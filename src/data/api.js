// Cliente HTTP da API (/api). A sessão vai num cookie httpOnly, enviado automaticamente pelo navegador.
export class ApiError extends Error {
  constructor(status, message, fields) {
    super(message);
    this.status = status;
    this.fields = fields || {};
  }
}

export async function api(method, path, body) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: method === 'GET' ? undefined : JSON.stringify(body ?? {}),
    });
  } catch {
    throw new ApiError(0, 'Não foi possível contactar o servidor. Verifique a ligação e tente novamente.');
  }

  let data = null;
  try { data = await response.json(); } catch { /* resposta sem JSON */ }
  if (!response.ok) {
    throw new ApiError(response.status, data?.error || 'Ocorreu um erro inesperado. Tente novamente.', data?.fields);
  }
  return data;
}
