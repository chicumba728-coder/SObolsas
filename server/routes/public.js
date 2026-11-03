import { Router } from 'express';
import { newId, now } from '../db.js';
import { BOOKING_SELECT, bookingOut, mentorPublicOut, scholarshipOut } from '../mappers.js';
import { HttpError, fieldError, parseBody, todayISO } from '../validation.js';
import { createRateLimiter } from '../security.js';

const bookingLimiter = createRateLimiter({ max: 20, windowMs: 60 * 60 * 1000 });

// Garante que o mentor não tem outra reserva ativa no mesmo dia e horário.
export function assertSlotFree(db, { mentorId, date, time, excludeId = null }) {
  const clash = db.prepare(`
    SELECT 1 FROM bookings
    WHERE mentor_id = ? AND date = ? AND time = ? AND status <> 'cancelled' AND id IS NOT ?`)
    .get(mentorId, date, time, excludeId);
  if (clash) throw fieldError(409, 'time', 'Este mentor já tem uma reserva neste dia e horário.');
}

export function publicRouter(db) {
  const router = Router();

  router.get('/scholarships', (_req, res) => {
    const rows = db.prepare("SELECT * FROM scholarships WHERE status = 'published' ORDER BY created_at DESC").all();
    res.json(rows.map(scholarshipOut));
  });

  router.get('/scholarships/:id', (req, res) => {
    const row = db.prepare("SELECT * FROM scholarships WHERE id = ? AND status = 'published'").get(req.params.id);
    if (!row) throw new HttpError(404, 'Bolsa não encontrada.');
    res.json(scholarshipOut(row));
  });

  router.get('/mentors', (_req, res) => {
    const rows = db.prepare("SELECT * FROM mentors WHERE status = 'approved' ORDER BY name COLLATE NOCASE").all();
    res.json(rows.map(mentorPublicOut));
  });

  router.get('/mentors/:id', (req, res) => {
    const row = db.prepare("SELECT * FROM mentors WHERE id = ? AND status = 'approved'").get(req.params.id);
    if (!row) throw new HttpError(404, 'Mentor não encontrado.');
    res.json(mentorPublicOut(row));
  });

  // Pedido de sessão: aberto a visitantes; se houver sessão de estudante, fica associado à conta.
  router.post('/bookings', (req, res) => {
    if (!bookingLimiter.check(req.ip)) throw new HttpError(429, 'Demasiados pedidos. Tente novamente mais tarde.');
    const values = parseBody(req.body, {
      mentorId: { type: 'text', required: true },
      date: { type: 'date', required: true },
      time: { type: 'time', required: true },
      studentName: { type: 'text', required: true, max: 120 },
      studentEmail: { type: 'email', required: true },
      topic: { type: 'longtext', max: 2000 },
    });
    const mentor = db.prepare("SELECT id FROM mentors WHERE id = ? AND status = 'approved'").get(values.mentorId);
    if (!mentor) throw fieldError(400, 'mentorId', 'Escolha um mentor disponível.');
    if (values.date < todayISO()) throw fieldError(400, 'date', 'A data não pode estar no passado.');
    assertSlotFree(db, values);

    const id = newId();
    const studentUserId = req.user?.role === 'student' ? req.user.id : null;
    db.prepare(`
      INSERT INTO bookings (id, mentor_id, student_user_id, student_name, student_email, date, time, topic, status, source, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'public', ?)`)
      .run(id, values.mentorId, studentUserId, values.studentName, values.studentEmail, values.date, values.time, values.topic, now());
    res.status(201).json(bookingOut(db.prepare(`${BOOKING_SELECT} WHERE b.id = ?`).get(id)));
  });

  return router;
}
