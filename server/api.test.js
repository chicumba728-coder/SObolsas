import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase, newId, now } from './db.js';
import { createApp } from './app.js';
import { hashPassword } from './security.js';

let server;
let base;

before(async () => {
  const db = openDatabase(':memory:');
  db.prepare("INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, 'Admin', 'admin@teste.pt', ?, 'admin', ?)")
    .run(newId(), await hashPassword('admin-pass-123'), now());
  server = createApp(db, { staticDir: '/nao-existe' }).listen(0);
  base = `http://localhost:${server.address().port}/api`;
});

after(() => server.close());

// Cliente mínimo com cookie de sessão.
function client() {
  let cookie = '';
  return async (method, path, body) => {
    const res = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
      body: body === undefined ? (method === 'GET' ? undefined : '{}') : JSON.stringify(body),
    });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    return { status: res.status, body: await res.json() };
  };
}

const future = () => {
  const d = new Date(Date.now() + 7 * 864e5);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

test('fluxo completo: admin, estudante, mentor e reservas', async () => {
  const admin = client();
  const anon = client();
  const studentApi = client();
  const mentorApi = client();

  // Sem sessão: área de admin e de estudante bloqueadas.
  assert.equal((await anon('GET', '/admin/scholarships')).status, 401);
  assert.equal((await anon('GET', '/me/saved')).status, 401);

  // CSRF: pedidos de escrita sem JSON são recusados.
  const form = await fetch(`${base}/auth/login`, { method: 'POST', body: 'email=x', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  assert.equal(form.status, 415);

  // Login de admin com palavra-passe errada / certa.
  assert.equal((await admin('POST', '/auth/login', { email: 'admin@teste.pt', password: 'errada-123' })).status, 401);
  const login = await admin('POST', '/auth/login', { email: 'admin@teste.pt', password: 'admin-pass-123' });
  assert.equal(login.status, 200);
  assert.equal(login.body.user.role, 'admin');
  assert.equal(login.body.user.password_hash, undefined);

  // Admin cria bolsa publicada e rascunho; o público só vê a publicada.
  const pub = await admin('POST', '/admin/scholarships', { title: 'Bolsa A', provider: 'Fundação X', status: 'published', deadline: future() });
  assert.equal(pub.status, 201);
  await admin('POST', '/admin/scholarships', { title: 'Bolsa B', provider: 'Fundação Y', status: 'draft' });
  const publicList = await anon('GET', '/scholarships');
  assert.deepEqual(publicList.body.map((s) => s.title), ['Bolsa A']);
  assert.equal((await admin('POST', '/admin/scholarships', { title: '', provider: 'x', status: 'draft' })).body.fields.title, 'Campo obrigatório.');

  // Registo de mentor: fica pendente e não é público até ser aprovado.
  const reg = await mentorApi('POST', '/auth/register', { name: 'Maria Mentora', email: 'maria@teste.pt', password: 'mentor-pass-1', role: 'mentor' });
  assert.equal(reg.status, 201);
  assert.equal(reg.body.mentor.status, 'pending');
  assert.equal((await anon('GET', '/mentors')).body.length, 0);
  assert.equal((await mentorApi('PUT', '/me/mentor', { name: 'Maria Mentora', specialty: 'Candidaturas', bio: 'Olá' })).status, 200);
  const mentorId = reg.body.mentor.id;
  assert.equal((await admin('PATCH', `/admin/mentors/${mentorId}`, { status: 'approved' })).body.status, 'approved');
  const publicMentors = (await anon('GET', '/mentors')).body;
  assert.equal(publicMentors.length, 1);
  assert.equal(publicMentors[0].email, undefined, 'email do mentor não é público');

  // Estudante regista-se, guarda bolsa, acompanha candidatura, pede sessão.
  assert.equal((await studentApi('POST', '/auth/register', { name: 'João', email: 'joao@teste.pt', password: 'curta', role: 'student' })).status, 400);
  assert.equal((await studentApi('POST', '/auth/register', { name: 'João', email: 'joao@teste.pt', password: 'aluno-pass-1', role: 'student' })).status, 201);
  assert.equal((await anon('POST', '/auth/register', { name: 'Outro', email: 'JOAO@teste.pt', password: 'aluno-pass-1', role: 'student' })).status, 409);
  assert.equal((await studentApi('GET', '/admin/users')).status, 403);
  assert.equal((await studentApi('GET', '/me/mentor/bookings')).status, 403);

  const scholarshipId = pub.body.id;
  assert.equal((await studentApi('PUT', `/me/saved/${scholarshipId}`)).status, 200);
  assert.equal((await studentApi('GET', '/me/saved')).body.length, 1);
  const app = await studentApi('POST', '/me/applications', { scholarshipId, status: 'preparing' });
  assert.equal(app.status, 201);
  assert.equal(app.body.scholarshipTitle, 'Bolsa A');
  assert.equal((await studentApi('POST', '/me/applications', { scholarshipId })).status, 409);
  assert.equal((await studentApi('PATCH', `/me/applications/${app.body.id}`, { status: 'submitted' })).body.status, 'submitted');

  const profile = await studentApi('PUT', '/me/profile', { name: 'João Silva', email: 'joao@teste.pt', study: 'Engenharia', institution: 'UL', about: '' });
  assert.equal(profile.body.study, 'Engenharia');

  const date = future();
  const booking = await studentApi('POST', '/bookings', { mentorId, date, time: '10:00', studentName: 'João Silva', studentEmail: 'joao@teste.pt' });
  assert.equal(booking.status, 201);
  assert.equal(booking.body.status, 'pending');
  const clash = await anon('POST', '/bookings', { mentorId, date, time: '10:00', studentName: 'Ana', studentEmail: 'ana@teste.pt' });
  assert.equal(clash.status, 409);
  assert.ok(clash.body.fields.time);

  // O estudante vê a sessão; o mentor vê a reserva e confirma-a.
  assert.equal((await studentApi('GET', '/me/bookings')).body.length, 1);
  const mentorBookings = await mentorApi('GET', '/me/mentor/bookings');
  assert.equal(mentorBookings.body.length, 1);
  assert.equal((await mentorApi('PATCH', `/me/mentor/bookings/${booking.body.id}`, { status: 'confirmed' })).body.status, 'confirmed');

  // Candidatura a mentor do estudante cria perfil pendente e dá acesso à área do mentor.
  const apply = await studentApi('POST', '/me/mentor-application', { name: 'João Silva', specialty: 'Matemática', experience: '3' });
  assert.equal(apply.status, 201);
  assert.equal(apply.body.status, 'pending');
  assert.equal((await studentApi('GET', '/me/mentor')).status, 200);

  // Admin suspende a conta do estudante: a sessão deixa de valer e o login é recusado.
  const users = (await admin('GET', '/admin/users')).body;
  const joao = users.find((u) => u.email === 'joao@teste.pt');
  await admin('PATCH', `/admin/users/${joao.id}`, { status: 'suspended' });
  assert.equal((await studentApi('GET', '/me/saved')).status, 401);
  assert.equal((await studentApi('POST', '/auth/login', { email: 'joao@teste.pt', password: 'aluno-pass-1' })).status, 403);

  // Admin não se pode suspender nem eliminar a si próprio.
  const me = users.find((u) => u.role === 'admin');
  assert.equal((await admin('PATCH', `/admin/users/${me.id}`, { status: 'suspended' })).status, 400);
  assert.equal((await admin('DELETE', `/admin/users/${me.id}`)).status, 400);

  // Logout termina a sessão.
  await admin('POST', '/auth/logout');
  assert.equal((await admin('GET', '/auth/me')).body.user, null);
});
