import { openDatabase, newId, now } from './db.js';
import { createApp } from './app.js';
import { hashPassword } from './security.js';

const PORT = Number(process.env.PORT || 3001);
const db = openDatabase();

// Primeiro administrador: criado a partir de ADMIN_EMAIL / ADMIN_PASSWORD se ainda não existir nenhum.
async function ensureAdmin() {
  const hasAdmin = db.prepare("SELECT 1 FROM users WHERE role = 'admin'").get();
  if (hasAdmin) return;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 8) {
    console.warn('[bolsaria] Não existe nenhum administrador. Defina ADMIN_EMAIL e ADMIN_PASSWORD (mín. 8 caracteres) no .env e reinicie.');
    return;
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    db.prepare("UPDATE users SET role = 'admin', status = 'active', password_hash = ?, updated_at = ? WHERE id = ?")
      .run(await hashPassword(password), now(), existing.id);
  } else {
    db.prepare("INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, 'admin', ?)")
      .run(newId(), process.env.ADMIN_NAME || 'Administração', email, await hashPassword(password), now());
  }
  console.log(`[bolsaria] Administrador criado: ${email}`);
}

await ensureAdmin();
createApp(db).listen(PORT, () => {
  console.log(`[bolsaria] API a correr em http://localhost:${PORT}/api`);
});
