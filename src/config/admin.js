// ATENÇÃO: acesso à administração SÓ para demonstração do MVP.
// Num frontend sem backend não existe segurança real: este código vai dentro do bundle
// e qualquer pessoa o consegue ler. Deve ser substituído por autenticação no servidor.
// Defina outro valor com VITE_ADMIN_CODE num ficheiro .env.local (não vai para o GitHub).
export const ADMIN_ACCESS_CODE = import.meta.env.VITE_ADMIN_CODE || 'bolsaria-admin';
