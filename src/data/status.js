// Estados usados pela administração e pelas páginas públicas.
export const scholarshipStatus = [
  { value: 'draft', label: 'Rascunho' },
  { value: 'published', label: 'Publicada' },
];

export const mentorStatus = [
  { value: 'pending', label: 'Pendente' },
  { value: 'approved', label: 'Aprovado' },
  { value: 'suspended', label: 'Suspenso' },
];

export const userStatus = [
  { value: 'active', label: 'Ativo' },
  { value: 'suspended', label: 'Suspenso' },
];

export const userTypes = [
  { value: 'student', label: 'Estudante' },
  { value: 'mentor', label: 'Mentor' },
];

export const bookingStatus = [
  { value: 'pending', label: 'Pendente' },
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'cancelled', label: 'Cancelada' },
];

export const labelOf = (list, value) => list.find((item) => item.value === value)?.label || '—';

export function formatDate(value) {
  if (!value) return '—';
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function todayISO() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

// Prazo aberto: sem prazo definido ou ainda não ultrapassado.
export const isDeadlineOpen = (deadline) => !deadline || deadline >= todayISO();
