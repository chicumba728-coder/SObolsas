// Conversão de linhas SQL (snake_case) para o formato da API (camelCase).
// Nunca expõe password_hash; o email de mentores só sai para a administração ou para o próprio.

export const userOut = (r) => r && ({
  id: r.id,
  name: r.name,
  email: r.email,
  role: r.role,
  type: r.role,
  status: r.status,
  study: r.study,
  institution: r.institution,
  about: r.about,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export const mentorPublicOut = (r) => r && ({
  id: r.id,
  name: r.name,
  specialty: r.specialty,
  bio: r.bio,
  experience: r.experience,
  status: r.status,
});

export const mentorOut = (r) => r && ({
  ...mentorPublicOut(r),
  email: r.email,
  userId: r.user_id,
  motivation: r.motivation,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export const scholarshipOut = (r) => r && ({
  id: r.id,
  title: r.title,
  provider: r.provider,
  deadline: r.deadline,
  link: r.link,
  status: r.status,
  description: r.description,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export const bookingOut = (r) => r && ({
  id: r.id,
  mentorId: r.mentor_id,
  mentorName: r.mentor_name ?? '',
  studentUserId: r.student_user_id,
  studentName: r.student_name,
  studentEmail: r.student_email,
  date: r.date,
  time: r.time,
  topic: r.topic,
  status: r.status,
  source: r.source,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export const applicationOut = (r) => r && ({
  id: r.id,
  scholarshipId: r.scholarship_id,
  scholarshipTitle: r.scholarship_title ?? '',
  scholarshipProvider: r.scholarship_provider ?? '',
  scholarshipDeadline: r.scholarship_deadline ?? '',
  status: r.status,
  notes: r.notes,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

// Query de reservas com o nome do mentor.
export const BOOKING_SELECT = `
  SELECT b.*, m.name AS mentor_name
  FROM bookings b JOIN mentors m ON m.id = b.mentor_id`;
