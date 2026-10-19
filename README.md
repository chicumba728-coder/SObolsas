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

As áreas estão separadas por papel e claramente marcadas como interface, sem autenticação real:

- **Estudante** (`/estudante`): perfil, bolsas guardadas, candidaturas, documentos e mentorias.
- **Mentor** (`/mentor`): perfil profissional, serviços, calendário, reservas e rendimentos.
- **Administração** (`/admin`): gestão de bolsas, utilizadores, mentores e reservas. Apenas a administração lança novas bolsas.

Registos e entradas são separados por área (`/entrar/estudante`, `/entrar/mentor`, `/registar/estudante`, `/registar/mentor`). Um estudante pode candidatar-se a mentor em `/estudante/candidatura-mentor`; a aprovação fica a cargo da administração.

A entrada é **simulada** (`src/session.jsx`): guarda apenas o papel escolhido em memória, para navegar entre áreas. Não verifica credenciais, não cria sessão e não sobrevive a recargas.

## Integração futura

As coleções começam vazias em `src/data/emptyData.js`. Este módulo não define endpoints nem contratos de API. Formulários, seleção de horários, gestão e checkout são apenas interfaces: não enviam nem guardam dados e não processam pagamentos. As rotas estão declaradas em `src/router.jsx`.
