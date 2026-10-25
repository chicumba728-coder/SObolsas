# SObolsas

# Bolsaria — frontend

Frontend responsivo em React e JavaScript, com CSS puro. A aplicação não inclui servidor, base de dados, autenticação, armazenamento ou processamento de pagamentos.

## Executar

Requisitos: Node.js e pnpm compatíveis com a versão declarada em `package.json`.

```sh
pnpm install
pnpm dev
```

O servidor de desenvolvimento usa a porta 3000. Para gerar os ficheiros estáticos:

```sh
pnpm build
```

## Áreas e papéis (MVP)

- **Público** (`/`, `/bolsas`, `/mentores`, `/agendar`): qualquer visitante pesquisa e filtra bolsas, vê detalhes de bolsas e perfis de mentores e pede uma sessão. Só aparecem bolsas **publicadas** e mentores **aprovados**; o email dos mentores nunca é público.
- **Estudante** (`/estudante`) e **Mentor** (`/mentor`): áreas separadas, com entrada própria (`/entrar/estudante`, `/entrar/mentor`).
- **Administração** (`/admin`): área **isolada** do site público, com layout próprio (sem menu nem rodapé públicos), fora da navegação pública e protegida. Sem sessão de admin, qualquer `/admin/...` redireciona para `/admin/entrar`.

### Operações do administrador

| Área | Rota | Operações |
| --- | --- | --- |
| Bolsas | `/admin/bolsas` | criar, editar, publicar/passar a rascunho, eliminar, pesquisar |
| Utilizadores | `/admin/utilizadores` | criar, editar, suspender/reativar, eliminar (email único) |
| Mentores | `/admin/mentores` | criar, editar, aprovar/suspender, eliminar (email único) |
| Reservas | `/admin/reservas` | registar, editar, confirmar/cancelar, eliminar (sem horários repetidos por mentor) |

Os pedidos de sessão feitos em `/agendar` chegam a `/admin/reservas` como **Pendente**.

## Dados e sessão (sem backend)

- **Dados:** `src/data/store.js` guarda as coleções no `localStorage` do navegador. Começam **vazias** (não há dados de exemplo) e só existem nesse navegador. É o único ficheiro a trocar quando houver API/base de dados. No painel há "Repor dados locais".
- **Sessão:** `src/session.jsx` guarda o papel em `sessionStorage` (sobrevive a recargas, termina ao fechar o separador). Entrada de estudante/mentor continua simulada.
- **Acesso admin:** código em `src/config/admin.js` (por omissão `bolsaria-admin`; alterar com `VITE_ADMIN_CODE` em `.env.local`, ver `.env.example`). **Não é segurança real**: num frontend o código fica no bundle. Substituir por autenticação no servidor.
- Checkout (`/checkout`) continua apenas como interface, sem pagamentos.

## Rotas

Declaradas em `src/router.jsx` (History API, sem biblioteca). `isAdminPath` separa a área de admin; `src/App.jsx` aplica layout e guarda de acesso (`AdminRoutes` vs `PublicRoutes`). Em produção, o servidor deve devolver `index.html` para qualquer caminho (fallback de SPA).
