import { Router } from 'express';
import { newId, now } from '../db.js';
import { BOOKING_SELECT, applicationOut, bookingOut, mentorOut, scholarshipOut, userOut } from '../mappers.js';
import { HttpError, fieldError, parseBody } from '../validation.js';
import { hashPassword, verifyPassword } from '../security.js';
import { requireMentorArea, requireRole, requireUser } from './auth.js';
import { assertSlotFree } from './public.js';

const APPLICATION_STATUS = ['preparing', 'submitted', 'accepted', 'rejected'];

export function meRouter(db) {
  const router = Router();
  const student = requireRole('student');

  // ---- Perfil da conta (qualquer utilizador autenticado) ----
  router.get('/profile', requireUser, (req, res) => res.json(userOut(req.user)));

  router.put('/profile', requireUser, (req, res) => {
    const values = parseBody(req.body, {
      name: { type: 'text', required: true, max: 120 },
      email: { type: 'email', required: true },
      study: { type: 'text', max: 160 },
      institution: { type: 'text', max: 160 },
      about: { type: 'longtext', max: 2000 },
    });
    const taken = db.prepare('SELECT 1 FROM users WHERE email = ? AND id <> ?').get(values.email, req.user.id);
    if (taken) throw fieldError(409, 'email', 'Já existe uma conta com este email.');
    db.prepare('UPDATE users SET name = ?, email = ?, study = ?, institution = ?, about = ?, updated_at = ? WHERE id = ?')
      .run(values.name, values.email, values.study, values.institution, values.about, now(), req.user.id);
    res.json(userOut(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)));
  });

  router.put('/password', requireUser, async (req, res) => {
    const values = parseBody(req.body, {
      currentPassword: { type: 'password', required: true },
      newPassword: { type: 'password', required: true },
    });
    if (!(await verifyPassword(values.currentPassword, req.user.password_hash))) {
      throw fieldError(400, 'currentPassword', 'A palavra-passe atual está incorreta.');
    }
    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(await hashPassword(values.newPassword), now(), req.user.id);
    // Termina as outras sessões, mantém a atual.
    db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?').run(req.user.id, req.sessionTokenHash);
    res.json({ ok: true });
  });

  // ---- Estudante: bolsas guardadas ----
  router.get('/saved', student, (req, res) => {
    const rows = db.prepare(`
      SELECT s.* FROM saved_scholarships ss JOIN scholarships s ON s.id = ss.scholarship_id
      WHERE ss.user_id = ? AND s.status = 'published' ORDER BY ss.created_at DESC`).all(req.user.id);
    res.json(rows.map(scholarshipOut));
  });

  router.put('/saved/:id', student, (req, res) => {
    const exists = db.prepare("SELECT 1 FROM scholarships WHERE id = ? AND status = 'published'").get(req.params.id);
    if (!exists) throw new HttpError(404, 'Bolsa não encontrada.');
    db.prepare('INSERT OR IGNORE INTO saved_scholarships (user_id, scholarship_id, created_at) VALUES (?, ?, ?)').run(req.user.id, req.params.id, now());
    res.json({ ok: true });
  });

  router.delete('/saved/:id', student, (req, res) => {
    db.prepare('DELETE FROM saved_scholarships WHERE user_id = ? AND scholarship_id = ?').run(req.user.id, req.params.id);
    res.json({ ok: true });
  });

  // ---- Estudante: acompanhamento de candidaturas a bolsas ----
  const APPLICATION_SELECT = `
    SELECT a.*, s.title AS scholarship_title, s.provider AS scholarship_provider, s.deadline AS scholarship_deadline
    FROM applications a JOIN scholarships s ON s.id = a.scholarship_id`;
  const findApplication = (id, userId) => db.prepare(`${APPLICATION_SELECT} WHERE a.id = ? AND a.user_id = ?`).get(id, userId);

  router.get('/applications', student, (req, res) => {
    const rows = db.prepare(`${APPLICATION_SELECT} WHERE a.user_id = ? ORDER BY a.created_at DESC`).all(req.user.id);
    res.json(rows.map(applicationOut));
  });

  router.post('/applications', student, (req, res) => {
    const values = parseBody(req.body, {
      scholarshipId: { type: 'text', required: true },
      status: { type: 'enum', options: APPLICATION_STATUS },
      notes: { type: 'longtext', max: 2000 },
    });
    const exists = db.prepare("SELECT 1 FROM scholarships WHERE id = ? AND status = 'published'").get(values.scholarshipId);
    if (!exists) throw fieldError(404, 'scholarshipId', 'Bolsa não encontrada.');
    const duplicate = db.prepare('SELECT 1 FROM applications WHERE user_id = ? AND scholarship_id = ?').get(req.user.id, values.scholarshipId);
    if (duplicate) throw fieldError(409, 'scholarshipId', 'Já acompanha uma candidatura a esta bolsa.');
    const id = newId();
    db.prepare('INSERT INTO applications (id, user_id, scholarship_id, status, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, req.user.id, values.scholarshipId, values.status || 'preparing', values.notes || '', now());
    res.status(201).json(applicationOut(findApplication(id, req.user.id)));
  });

  router.patch('/applications/:id', student, (req, res) => {
    if (!findApplication(req.params.id, req.user.id)) throw new HttpError(404, 'Candidatura não encontrada.');
    const values = parseBody(req.body, {
      status: { type: 'enum', options: APPLICATION_STATUS },
      notes: { type: 'longtext', max: 2000 },
    }, { partial: true });
    const current = findApplication(req.params.id, req.user.id);
    db.prepare('UPDATE applications SET status = ?, notes = ?, updated_at = ? WHERE id = ?')
      .run(values.status ?? current.status, values.notes ?? current.notes, now(), req.params.id);
    res.json(applicationOut(findApplication(req.params.id, req.user.id)));
  });

  router.delete('/applications/:id', student, (req, res) => {
    const result = db.prepare('DELETE FROM applications WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    if (!result.changes) throw new HttpError(404, 'Candidatura não encontrada.');
    res.json({ ok: true });
  });

  // ---- Estudante: sessões de mentoria pedidas com a conta ----
  router.get('/bookings', student, (req, res) => {
    const rows = db.prepare(`${BOOKING_SELECT} WHERE b.student_user_id = ? ORDER BY b.date DESC, b.time DESC`).all(req.user.id);
    res.json(rows.map(bookingOut));
  });

  // ---- Estudante: candidatura a mentor (cria perfil de mentor pendente) ----
  router.post('/mentor-application', student, (req, res) => {
    if (req.mentor) throw new HttpError(409, 'Já tem uma candidatura a mentor registada.');
    const values = parseBody(req.body, {
      name: { type: 'text', required: true, max: 120 },
      specialty: { type: 'text', required: true, max: 160 },
      experience: { type: 'int', min: 0, maxValue: 80 },
      motivation: { type: 'longtext', max: 2000 },
    });
    if (db.prepare('SELECT 1 FROM mentors WHERE email = ?').get(req.user.email)) {
      throw new HttpError(409, 'Já existe um perfil de mentor com o seu email. Contacte a administração.');
    }
    const id = newId();
    db.prepare(`
      INSERT INTO mentors (id, user_id, name, email, specialty, experience, motivation, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`)
      .run(id, req.user.id, values.name, req.user.email, values.specialty, values.experience, values.motivation, now());
    res.status(201).json(mentorOut(db.prepare('SELECT * FROM mentors WHERE id = ?').get(id)));
  });

  // ---- Mentor: perfil profissional ----
  router.get('/mentor', requireMentorArea, (req, res) => res.json(mentorOut(req.mentor)));

  router.put('/mentor', requireMentorArea, (req, res) => {
    const values = parseBody(req.body, {
      name: { type: 'text', required: true, max: 120 },
      specialty: { type: 'text', required: true, max: 160 },
      bio: { type: 'longtext', max: 3000 },
      experience: { type: 'int', min: 0, maxValue: 80 },
    });
    if (req.mentor) {
      db.prepare('UPDATE mentors SET name = ?, specialty = ?, bio = ?, experience = ?, updated_at = ? WHERE id = ?')
        .run(values.name, values.specialty, values.bio, values.experience, now(), req.mentor.id);
    } else {
      // Conta de mentor sem perfil (ex.: criada pela administração): cria o perfil, pendente de aprovação.
      if (db.prepare('SELECT 1 FROM mentors WHERE email = ?').get(req.user.email)) {
        throw new HttpError(409, 'Já existe um perfil de mentor com o seu email. Contacte a administração.');
      }
      db.prepare(`
        INSERT INTO mentors (id, user_id, name, email, specialty, bio, experience, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`)
        .run(newId(), req.user.id, values.name, req.user.email, values.specialty, values.bio, values.experience, now());
    }
    res.json(mentorOut(db.prepare('SELECT * FROM mentors WHERE user_id = ?').get(req.user.id)));
  });

  // ---- Mentor: reservas recebidas ----
  router.get('/mentor/bookings', requireMentorArea, (req, res) => {
    if (!req.mentor) return res.json([]);
    const rows = db.prepare(`${BOOKING_SELECT} WHERE b.mentor_id = ? ORDER BY b.date, b.time`).all(req.mentor.id);
    res.json(rows.map(bookingOut));
  });

  router.patch('/mentor/bookings/:id', requireMentorArea, (req, res) => {
    const booking = req.mentor && db.prepare('SELECT * FROM bookings WHERE id = ? AND mentor_id = ?').get(req.params.id, req.mentor.id);
    if (!booking) throw new HttpError(404, 'Reserva não encontrada.');
    const { status } = parseBody(req.body, { status: { type: 'enum', required: true, options: ['confirmed', 'cancelled'] } });
    if (status !== 'cancelled' && booking.status === 'cancelled') {
      assertSlotFree(db, { mentorId: booking.mentor_id, date: booking.date, time: booking.time, excludeId: booking.id });
    }
    db.prepare('UPDATE bookings SET status = ?, updated_at = ? WHERE id = ?').run(status, now(), booking.id);
    res.json(bookingOut(db.prepare(`${BOOKING_SELECT} WHERE b.id = ?`).get(booking.id)));
  });

  return router;
}
