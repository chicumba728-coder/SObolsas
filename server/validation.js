export class HttpError extends Error {
  constructor(status, message, fields) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const URL_RE = /^https?:\/\/\S+$/i;

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Valida e normaliza um corpo de pedido segundo um esquema.
// schema: { campo: { type, required, max, options, min } }
// partial = true valida só os campos presentes (PATCH).
export function parseBody(body, schema, { partial = false } = {}) {
  const input = body && typeof body === 'object' ? body : {};
  const values = {};
  const errors = {};

  for (const [field, rule] of Object.entries(schema)) {
    const present = Object.prototype.hasOwnProperty.call(input, field) && input[field] !== null && input[field] !== undefined;
    if (partial && !present) continue;

    let value = present ? input[field] : '';
    if (rule.type === 'password') value = typeof value === 'string' ? value : '';
    else if (rule.type === 'int') value = value === '' ? '' : value;
    else value = typeof value === 'string' ? value.trim() : String(value).trim();

    if (value === '') {
      if (rule.required) errors[field] = 'Campo obrigatório.';
      else values[field] = rule.type === 'int' ? null : '';
      continue;
    }

    const max = rule.max ?? (rule.type === 'longtext' ? 5000 : 200);
    switch (rule.type) {
      case 'email':
        if (!EMAIL_RE.test(value) || value.length > 254) errors[field] = 'Introduza um endereço de email válido.';
        else value = value.toLowerCase();
        break;
      case 'password':
        if (value.length < 8) errors[field] = 'Use pelo menos 8 caracteres.';
        else if (value.length > 200) errors[field] = 'Palavra-passe demasiado longa.';
        break;
      case 'date':
        if (!DATE_RE.test(value) || Number.isNaN(new Date(`${value}T00:00:00`).getTime())) errors[field] = 'Data inválida.';
        break;
      case 'time':
        if (!TIME_RE.test(value)) errors[field] = 'Horário inválido.';
        break;
      case 'url':
        if (!URL_RE.test(value) || value.length > 2000) errors[field] = 'Introduza uma ligação válida, a começar por http:// ou https://.';
        break;
      case 'enum':
        if (!rule.options.includes(value)) errors[field] = 'Valor inválido.';
        break;
      case 'int': {
        const number = Number(value);
        if (!Number.isInteger(number) || number < (rule.min ?? 0) || number > (rule.maxValue ?? 100)) errors[field] = 'Indique um número válido.';
        else value = number;
        break;
      }
      default:
        if (value.length > max) errors[field] = `Use no máximo ${max} caracteres.`;
    }
    if (!errors[field]) values[field] = value;
  }

  if (Object.keys(errors).length) throw new HttpError(400, 'Verifique os campos assinalados.', errors);
  return values;
}

export const fieldError = (status, field, message) => new HttpError(status, message, { [field]: message });
