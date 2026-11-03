import { Router } from 'express';
import { newId, now } from '../db.js';
import { BOOKING_SELECT, bookingOut, mentorOut, scholarshipOut, userOut } from '../mappers.js';
import { HttpError, fieldError, parseBody, todayISO } from '../validation.js';
import { hashPassword } from '../security.js';
import { requireRole } from './auth.js';
import { assertSlotFree } from './public.js';

const scholarshipSchema = {
  title: { type: 'text', required: true, max: 200 },
  provider: { type: 'text', required: true, max: 200 },
  deadline: { type: 'date' },
  link: { type: 'url' },
  status: { type: 'enum', required: true, options: ['draft', 'published'] },
  description: { type: 'longtext', max: 5000 },
};

const userSchema = {
  name: { type: 'text', required: true, max: 120 },
  email: { type: 'email', required: true },
  type: { type: 'enum', required: true, options: ['student', 'mentor', 'admin'] },
  status: { type: 'enum', required: true, options: ['active', 'suspended'] },
  password: { type: 'password' },
};

const mentorSchema = {
  name: { type: 'text', required: true, max: 120 },
  email: { type: 'email', required: true },
  specialty: { type: 'text', max: 160 },
  status: { type: 'enum', required: true, options: ['pending', 'approved', 'suspended'] },
  bio: { type: 'longtext', max: 3000 },
};

const bookingSchema = {
  mentorId: { type: 'text', required: true },
  studentName: { type: 'text', required: true, max: 120 },
  studentEmail: { type: 'email', required: true },
  date: { type: 'date', required: true },
  time: { type: 'time', required: true },
  status: { type: 'enum', required: true, options: ['pending', 'confirmed', 'cancelled'] },
  topic: { type: 'longtext', max: 2000 },
};

// Para ações rápidas (só o estado), o cliente envia apenas os campos alterados:
// juntamos com o registo atual e validamos o resultado completo.
const merge = (current, body) => ({ ...current, ...(body && typeof body === 'object' ? body : {}) });

export function adminRouter(db) {
  const router = Router();
  router.use(requireRole('admin'));

  const get = (table, id) => db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
  const mustGet = (table, id, label) => {
    const row = get(table, id);
    if (!row) throw new HttpError(404, `${label} não encontrado(a).`);
    return row;
  };

  // ---------- Resumo ----------
  router.get('/summary', (_req, res) => {
    const count = (sql) => db.prepare(sql).get().n;
    res.json({
      scholarships: { total: count('SELECT COUNT(*) n FROM scholarships'), published: count("SELECT COUNT(*) n FROM scholarships WHERE status = 'published'") },
      users: { total: count('SELECT COUNT(*) n FROM users'), suspended: count("SELECT COUNT(*) n FROM users WHERE status = 'suspended'") },
      mentors: { total: count('SELECT COUNT(*) n FROM mentors'), pending: count("SELECT COUNT(*) n FROM mentors WHERE status = 'pending'") },
      bookings: { total: count('SELECT COUNT(*) n FROM bookings'), pending: count("SELECT COUNT(*) n FROM bookings WHERE status = 'pending'") },
    });
  });

  // ---------- Bolsas ----------
  router.get('/scholarships', (_req, res) => {
    res.json(db.prepare('SELECT * FROM scholarships ORDER BY created_at DESC').all().map(scholarshipOut));
  });

  router.post('/scholarships', (req, res) => {
    const v = parseBody(req.body, scholarshipSchema);
    if (v.deadline && v.deadline < todayISO()) throw fieldError(400, 'deadline', 'O prazo não pode estar no passado.');
    const id = newId();
    db.prepare(`INSERT INTO scholarships (id, title, provider, deadline, link, status, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(id, v.title, v.provider, v.deadline, v.link, v.status, v.description, now());
    res.status(201).json(scholarshipOut(get('scholarships', id)));
  });

  router.patch('/scholarships/:id', (req, res) => {
    const current = scholarshipOut(mustGet('scholarships', req.params.id, 'Bolsa'));
    const v = parseBody(merge(current, req.body), scholarshipSchema);
    if (v.deadline && v.deadline !== current.deadline && v.deadline < todayISO()) {
      throw fieldError(400, 'deadline', 'O prazo não pode estar no passado.');
    }
    db.prepare(`UPDATE scholarships SET title = ?, provider = ?, deadline = ?, link = ?, status = ?, description = ?, updated_at = ?
      WHERE id = ?`).run(v.title, v.provider, v.deadline, v.link, v.status, v.description, now(), req.params.id);
    res.json(scholarshipOut(get('scholarships', req.params.id)));
  });

  router.delete('/scholarships/:id', (req, res) => {
    mustGet('scholarships', req.params.id, 'Bolsa');
    db.prepare('DELETE FROM scholarships WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  });

  // ---------- Utilizadores ----------
  const linkMentorByEmail = (userId, email) => {
    db.prepare('UPDATE mentors SET user_id = ?, updated_at = ? WHERE email = ? AND user_id IS NULL')
      .run(userId, now(), email);
  };

  router.get('/users', (_req, res) => {
    res.json(db.prepare('SELECT * FROM users ORDER BY created_at DESC').all().map(userOut));
  });

  router.post('/users', async (req, res) => {
    const v = parseBody(req.body, { ...userSchema, password: { type: 'password', required: true } });
    if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(v.email)) throw fieldError(409, 'email', 'Já existe um registo com este email.');
    const id = newId();
    db.prepare('INSERT INTO users (id, name, email, password_hash, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, v.name, v.email, await hashPassword(v.password), v.type, v.status, now());
    if (v.type === 'mentor') linkMentorByEmail(id, v.email);
    res.status(201).json(userOut(get('users', id)));
  });

  router.patch('/users/:id', async (req, res) => {
    const current = userOut(mustGet('users', req.params.id, 'Utilizador'));
    const v = parseBody(merge({ ...current, password: '' }, req.body), userSchema);
    const isSelf = req.params.id === req.user.id;
    if (isSelf && v.status !== 'active') throw fieldError(400, 'status', 'Não pode suspender a sua própria conta.');
    if (isSelf && v.type !== 'admin') throw fieldError(400, 'type', 'Não pode retirar a si próprio o acesso de administração.');
    if (db.prepare('SELECT 1 FROM users WHERE email = ? AND id <> ?').get(v.email, req.params.id)) {
      throw fieldError(409, 'email', 'Já existe um registo com este email.');
    }
    db.prepare('UPDATE users SET name = ?, email = ?, role = ?, status = ?, updated_at = ? WHERE id = ?')
      .run(v.name, v.email, v.type, v.status, now(), req.params.id);
    if (v.password) {
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(await hashPassword(v.password), req.params.id);
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(req.params.id);
    }
    if (v.status === 'suspended') db.prepare('DELETE FROM sessions WHERE user_id = ?').run(req.params.id);
    if (v.type === 'mentor') linkMentorByEmail(req.params.id, v.email);
    res.json(userOut(get('users', req.params.id)));
  });

  router.delete('/users/:id', (req, res) => {
    if (req.params.id === req.user.id) throw new HttpError(400, 'Não pode eliminar a sua própria conta.');
    mustGet('users', req.params.id, 'Utilizador');
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  });

  // ---------- Mentores ----------
  router.get('/mentors', (_req, res) => {
    res.json(db.prepare('SELECT * FROM mentors ORDER BY created_at DESC').all().map(mentorOut));
  });

  const linkUserByEmail = (mentorId, email) => {
    const user = db.prepare(`SELECT u.id FROM users u WHERE u.email = ? AND u.role = 'mentor'
      AND NOT EXISTS (SELECT 1 FROM mentors m WHERE m.user_id = u.id)`).get(email);
    if (user) db.prepare('UPDATE mentors SET user_id = ? WHERE id = ? AND user_id IS NULL').run(user.id, mentorId);
  };

  router.post('/mentors', (req, res) => {
    const v = parseBody(req.body, mentorSchema);
    if (db.prepare('SELECT 1 FROM mentors WHERE email = ?').get(v.email)) throw fieldError(409, 'email', 'Já existe um registo com este email.');
    const id = newId();
    db.prepare('INSERT INTO mentors (id, name, email, specialty, status, bio, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, v.name, v.email, v.specialty, v.status, v.bio, now());
    linkUserByEmail(id, v.email);
    res.status(201).json(mentorOut(get('mentors', id)));
  });

  router.patch('/mentors/:id', (req, res) => {
    const current = mentorOut(mustGet('mentors', req.params.id, 'Mentor'));
    const v = parseBody(merge(current, req.body), mentorSchema);
    if (db.prepare('SELECT 1 FROM mentors WHERE email = ? AND id <> ?').get(v.email, req.params.id)) {
      throw fieldError(409, 'email', 'Já existe um registo com este email.');
    }
    db.prepare('UPDATE mentors SET name = ?, email = ?, specialty = ?, status = ?, bio = ?, updated_at = ? WHERE id = ?')
      .run(v.name, v.email, v.specialty, v.status, v.bio, now(), req.params.id);
    linkUserByEmail(req.params.id, v.email);
    res.json(mentorOut(get('mentors', req.params.id)));
  });

  router.delete('/mentors/:id', (req, res) => {
    mustGet('mentors', req.params.id, 'Mentor');
    db.prepare('DELETE FROM mentors WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  });

  // ---------- Reservas ----------
  router.get('/bookings', (_req, res) => {
    res.json(db.prepare(`${BOOKING_SELECT} ORDER BY b.date DESC, b.time DESC`).all().map(bookingOut));
  });

  const checkBooking = (v, excludeId) => {
    if (!get('mentors', v.mentorId)) throw fieldError(400, 'mentorId', 'Escolha um mentor existente.');
    if (v.status !== 'cancelled') assertSlotFree(db, { ...v, excludeId });
  };

  router.post('/bookings', (req, res) => {
    const v = parseBody(req.body, bookingSchema);
    checkBooking(v, null);
    const id = newId();
    db.prepare(`INSERT INTO bookings (id, mentor_id, student_name, student_email, date, time, topic, status, source, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'admin', ?)`)
      .run(id, v.mentorId, v.studentName, v.studentEmail, v.date, v.time, v.topic, v.status, now());
    res.status(201).json(bookingOut(db.prepare(`${BOOKING_SELECT} WHERE b.id = ?`).get(id)));
  });

  router.patch('/bookings/:id', (req, res) => {
    const current = bookingOut(mustGet('bookings', req.params.id, 'Reserva'));
    const v = parseBody(merge(current, req.body), bookingSchema);
    checkBooking(v, req.params.id);
    db.prepare(`UPDATE bookings SET mentor_id = ?, student_name = ?, student_email = ?, date = ?, time = ?, topic = ?, status = ?, updated_at = ?
      WHERE id = ?`).run(v.mentorId, v.studentName, v.studentEmail, v.date, v.time, v.topic, v.status, now(), req.params.id);
    res.json(bookingOut(db.prepare(`${BOOKING_SELECT} WHERE b.id = ?`).get(req.params.id)));
  });

  router.delete('/bookings/:id', (req, res) => {
    mustGet('bookings', req.params.id, 'Reserva');
    db.prepare('DELETE FROM bookings WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  });

  return router;
}
