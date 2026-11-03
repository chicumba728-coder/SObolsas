# SObolsas

# Bolsaria

Plataforma de bolsas de estudo e mentorias: frontend em React (CSS puro) e API em Node.js (Express) com base de dados SQLite.

## Executar

Requisitos: Node.js 22.13 ou superior (usa o módulo `node:sqlite` nativo) e pnpm (versão em `package.json`; `corepack enable` instala-a).

```sh
pnpm install
cp .env.example .env   # preencha ADMIN_EMAIL e ADMIN_PASSWORD
pnpm dev               # API em :3001 + frontend em :3000 (o Vite encaminha /api)
```

Abra http://localhost:3000. O primeiro administrador é criado no arranque a partir do `.env` (só se ainda não existir nenhum). Entra em `/admin/entrar`.

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | API + frontend em modo de desenvolvimento |
| `pnpm test` | testes da API (`server/*.test.js`, base de dados em memória) |
| `pnpm build` | compila o frontend para `dist/` |
| `pnpm start` | produção: a API serve também o `dist/` com fallback de SPA (porta `PORT`, por omissão 3001) |

## Arquitetura

```text
server/
  index.js        arranque, criação do primeiro admin
  app.js          Express: /api, proteção CSRF (só JSON), erros, ficheiros estáticos em produção
  db.js           SQLite: ligação e esquema (criado automaticamente)
  security.js     palavras-passe (scrypt), tokens de sessão, cookies, limite de tentativas
  validation.js   validação dos pedidos
  routes/         auth, public, me (estudante/mentor), admin
src/
  data/api.js     cliente HTTP
  data/store.js   useResource / useList / mutate (cache partilhada; recarrega após alterações)
  session.jsx     sessão do utilizador (GET /api/auth/me) e regras de acesso por área
```

Os dados ficam em `server/data/bolsaria.db` (fora do Git). Para recomeçar do zero, pare o servidor e apague esse ficheiro.

## Autenticação e acesso

- Sessão por cookie `httpOnly` (`SameSite=Lax`, `Secure` em produção), válida 14 dias; o servidor guarda apenas o hash do token.
- Palavras-passe com scrypt e sal; mínimo de 8 caracteres. Login e recuperação têm limite de tentativas.
- **Estudante** (`/estudante`): contas `student`. **Mentor** (`/mentor`): contas `mentor` ou estudantes que se candidataram a mentor. **Administração** (`/admin`): contas `admin`. Sem sessão, as áreas redirecionam para a página de entrada e voltam depois do login.
- Suspender uma conta termina as sessões dela.
- **Recuperação de palavra-passe:** ainda não há serviço de email. A ligação de recuperação (válida 1 hora) é escrita no registo do servidor.

## O que cada área faz

- **Público:** pesquisa de bolsas publicadas e mentores aprovados (o email dos mentores nunca é enviado ao navegador); pedido de sessão em `/agendar` (com ou sem conta; o servidor recusa horários ocupados).
- **Estudante:** perfil e palavra-passe, bolsas guardadas, acompanhamento de candidaturas (estado e notas), sessões pedidas com a conta, candidatura a mentor.
- **Mentor:** perfil profissional (fica pendente até aprovação), reservas recebidas com confirmar/cancelar, próximas sessões.
- **Administração:** CRUD de bolsas, utilizadores (com palavra-passe), mentores (aprovar/suspender) e reservas; resumo com contagens.

## Ainda não implementado

- Envio e armazenamento de documentos do estudante.
- Serviços, preços e disponibilidade dos mentores; rendimentos.
- Checkout e pagamentos (`/checkout` é só interface).
- Envio de emails (recuperação, confirmações).
