import { Router } from 'express';
import { newId, now } from '../db.js';
import { HttpError, fieldError, parseBody } from '../validation.js';
import { mentorOut, userOut } from '../mappers.js';
import {
  SESSION_COOKIE, SESSION_DAYS, createRateLimiter, createToken, hashPassword, hashToken,
  parseCookies, sessionCookieOptions, verifyPassword,
} from '../security.js';

const loginLimiter = createRateLimiter({ max: 10, windowMs: 15 * 60 * 1000 });
const recoveryLimiter = createRateLimiter({ max: 5, windowMs: 60 * 60 * 1000 });
const RESET_MINUTES = 60;

// Middleware: lê o cookie de sessão e coloca req.user / req.mentor (ou null).
export function loadSession(db) {
  const findSession = db.prepare(`
    SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ?`);
  const findMentor = db.prepare('SELECT * FROM mentors WHERE user_id = ?');

  return (req, _res, next) => {
    req.user = null;
    req.mentor = null;
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
    if (token) {
      const user = findSession.get(hashToken(token), now());
      if (user && user.status === 'active') {
        req.user = user;
        req.sessionTokenHash = hashToken(token);
        req.mentor = findMentor.get(user.id) || null;
      }
    }
    next();
  };
}

export const requireUser = (req, _res, next) => {
  if (!req.user) throw new HttpError(401, 'Inicie sessão para continuar.');
  next();
};

export const requireRole = (role) => (req, _res, next) => {
  if (!req.user) throw new HttpError(401, 'Inicie sessão para continuar.');
  if (req.user.role !== role) throw new HttpError(403, 'Não tem permissão para esta área.');
  next();
};

// Área do mentor: contas de mentor ou estudantes que já se candidataram (têm perfil de mentor).
export const requireMentorArea = (req, _res, next) => {
  if (!req.user) throw new HttpError(401, 'Inicie sessão para continuar.');
  if (req.user.role !== 'mentor' && !req.mentor) throw new HttpError(403, 'Não tem permissão para esta área.');
  next();
};

export const sessionPayload = (req) => ({ user: userOut(req.user), mentor: mentorOut(req.mentor) });

export function authRouter(db) {
  const router = Router();
  const insertSession = db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)');
  const findUserByEmail = db.prepare('SELECT * FROM users WHERE email = ?');
  const findMentorByEmail = db.prepare('SELECT id FROM mentors WHERE email = ?');
  const findMentorByUser = db.prepare('SELECT * FROM mentors WHERE user_id = ?');

  const startSession = (res, user) => {
    const token = createToken();
    const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now());
    insertSession.run(hashToken(token), user.id, expires);
    res.cookie(SESSION_COOKIE, token, sessionCookieOptions());
  };

  router.get('/me', (req, res) => res.json(sessionPayload(req)));

  router.post('/register', async (req, res) => {
    const values = parseBody(req.body, {
      name: { type: 'text', required: true, max: 120 },
      email: { type: 'email', required: true },
      password: { type: 'password', required: true },
      role: { type: 'enum', required: true, options: ['student', 'mentor'] },
    });
    if (findUserByEmail.get(values.email)) throw fieldError(409, 'email', 'Já existe uma conta com este email.');
    if (values.role === 'mentor' && findMentorByEmail.get(values.email)) {
      throw fieldError(409, 'email', 'Já existe um perfil de mentor com este email. Contacte a administração.');
    }

    const user = {
      id: newId(), name: values.name, email: values.email, role: values.role,
      password_hash: await hashPassword(values.password), created_at: now(),
    };
    db.exec('BEGIN');
    try {
      db.prepare('INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(user.id, user.name, user.email, user.password_hash, user.role, user.created_at);
      if (values.role === 'mentor') {
        db.prepare('INSERT INTO mentors (id, user_id, name, email, status, created_at) VALUES (?, ?, ?, ?, ?, ?)')
          .run(newId(), user.id, user.name, user.email, 'pending', now());
      }
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }

    const stored = findUserByEmail.get(values.email);
    startSession(res, stored);
    res.status(201).json({ user: userOut(stored), mentor: mentorOut(findMentorByUser.get(stored.id)) });
  });

  router.post('/login', async (req, res) => {
    const values = parseBody(req.body, {
      email: { type: 'email', required: true },
      password: { type: 'password', required: true },
    });
    const limitKey = `${req.ip}|${values.email}`;
    if (!loginLimiter.check(limitKey)) throw new HttpError(429, 'Demasiadas tentativas. Tente novamente dentro de alguns minutos.');

    const user = findUserByEmail.get(values.email);
    // Sem utilizador, calcula um hash na mesma para o tempo de resposta não revelar se o email existe.
    const valid = user?.password_hash
      ? await verifyPassword(values.password, user.password_hash)
      : (await hashPassword(values.password), false);
    if (!user || !valid) throw new HttpError(401, 'Email ou palavra-passe incorretos.');
    if (user.status !== 'active') throw new HttpError(403, 'Esta conta está suspensa. Contacte a administração.');

    loginLimiter.reset(limitKey);
    startSession(res, user);
    res.json({ user: userOut(user), mentor: mentorOut(findMentorByUser.get(user.id)) });
  });

  router.post('/logout', (req, res) => {
    if (req.sessionTokenHash) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(req.sessionTokenHash);
    res.clearCookie(SESSION_COOKIE, { ...sessionCookieOptions(), maxAge: undefined });
    res.json({ ok: true });
  });

  // Recuperação: resposta sempre igual (não revela se o email existe).
  // Sem serviço de email ligado, a ligação é escrita no registo do servidor.
  router.post('/recovery', (req, res) => {
    const { email } = parseBody(req.body, { email: { type: 'email', required: true } });
    if (!recoveryLimiter.check(`${req.ip}|${email}`)) throw new HttpError(429, 'Demasiados pedidos. Tente novamente mais tarde.');
    const user = findUserByEmail.get(email);
    if (user && user.status === 'active') {
      const token = createToken();
      const expires = new Date(Date.now() + RESET_MINUTES * 60 * 1000).toISOString();
      db.prepare('DELETE FROM password_resets WHERE user_id = ? OR expires_at <= ?').run(user.id, now());
      db.prepare('INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(hashToken(token), user.id, expires);
      const base = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
      console.log(`[recuperação] Ligação para ${email} (válida ${RESET_MINUTES} min): ${base}/redefinir-palavra-passe?token=${token}`);
    }
    res.json({ ok: true });
  });

  router.post('/reset', async (req, res) => {
    const values = parseBody(req.body, {
      token: { type: 'text', required: true },
      password: { type: 'password', required: true },
    });
    const reset = db.prepare('SELECT * FROM password_resets WHERE token_hash = ? AND expires_at > ?').get(hashToken(values.token), now());
    if (!reset) throw new HttpError(400, 'A ligação de recuperação é inválida ou expirou. Peça uma nova.');
    const hash = await hashPassword(values.password);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(hash, now(), reset.user_id);
    db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(reset.user_id);
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(reset.user_id);
    res.json({ ok: true });
  });

  return router;
}
