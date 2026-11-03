import React, { useState } from 'react';
import { Link } from '../router.jsx';
import PortalLayout from '../components/PortalLayout.jsx';
import { EmptyState, ErrorState, Field, LoadingState, Notice, PageHeading, SectionCard, TextAreaField } from '../components/ui.jsx';
import { ArrowUpRight } from '../components/icons.jsx';
import { useSession } from '../session.jsx';
import { mutate, useList } from '../data/store.js';
import { bookingStatus, formatDate, mentorStatus, todayISO } from '../data/status.js';
import { PasswordForm, StatusBadge } from './StudentPage.jsx';

const mentorViews = {
  'mentor-home': { title: 'Resumo', description: 'Uma visão geral do seu espaço profissional.' },
  'mentor-profile': { title: 'Perfil profissional', description: 'Apresente a sua experiência e especialidades.' },
  'mentor-services': { title: 'Serviços', description: 'Os serviços e preços que oferece aos estudantes.' },
  'mentor-calendar': { title: 'Calendário', description: 'A sua disponibilidade para sessões.' },
  'mentor-bookings': { title: 'Reservas', description: 'As sessões pedidas pelos estudantes.' },
  'mentor-earnings': { title: 'Rendimentos', description: 'O acompanhamento dos seus rendimentos.' },
};

function ProfileStatus() {
  const { mentor } = useSession();
  if (!mentor) {
    return <Notice title="Perfil por criar">Preencha o perfil profissional para pedir a aprovação da administração.</Notice>;
  }
  if (mentor.status === 'approved') return null;
  return (
    <Notice title={`Perfil ${mentor.status === 'pending' ? 'pendente' : 'suspenso'}`}>
      {mentor.status === 'pending'
        ? 'O seu perfil aguarda aprovação da administração. Só depois aparece no site e pode receber pedidos.'
        : 'O seu perfil está suspenso e não aparece no site. Contacte a administração.'}
    </Notice>
  );
}

const isUpcoming = (b) => b.status !== 'cancelled' && b.date >= todayISO();

function MentorHome() {
  const { mentor } = useSession();
  const { items: bookings, loading } = useList('/me/mentor/bookings');
  const upcoming = bookings.filter(isUpcoming);
  const pending = bookings.filter((b) => b.status === 'pending');
  const next = upcoming[0];

  return (
    <>
      <div className="console-strip" role="group" aria-label="Resumo do espaço profissional">
        <div className="console-stat">
          <span className="console-stat__label">Estado do perfil</span>
          <span className="console-stat__value">{mentor ? <StatusBadge value={mentor.status} list={mentorStatus} /> : 'Por criar'}</span>
        </div>
        <div className="console-stat">
          <span className="console-stat__label">Próxima sessão</span>
          <span className={`console-stat__value${next ? '' : ' console-stat__value--empty'}`}>
            {loading ? '…' : next ? `${formatDate(next.date)} · ${next.time}` : 'Sem sessões'}
          </span>
        </div>
        <div className="console-stat">
          <span className="console-stat__label">Pedidos pendentes</span>
          <span className={`console-stat__value${pending.length ? '' : ' console-stat__value--empty'}`}>{loading ? '…' : pending.length}</span>
        </div>
      </div>
      <section className="console-panel" aria-labelledby="mentor-agenda-title">
        <div className="console-panel__head">
          <h2 id="mentor-agenda-title">Próximas sessões</h2>
          <Link to="/mentor/reservas">Ver reservas <ArrowUpRight size={14} /></Link>
        </div>
        <div className="console-panel__body">
          {upcoming.length === 0 ? (
            <EmptyState compact title="Ainda não há sessões" description="Os pedidos dos estudantes aparecem aqui." />
          ) : (
            <ul className="record-list">
              {upcoming.slice(0, 5).map((b) => (
                <li className="record-list__item" key={b.id}>
                  <div className="record-list__main">
                    <span className="record-list__title">{b.studentName}</span>
                    <span className="record-list__meta">{formatDate(b.date)} às {b.time}</span>
                  </div>
                  <StatusBadge value={b.status} list={bookingStatus} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      <div className="portal-help">
        <span>Mantenha o seu perfil atualizado.</span>
        <Link to="/mentor/perfil">Editar perfil profissional <ArrowUpRight size={15} /></Link>
      </div>
    </>
  );
}

function MentorProfile() {
  const { user, mentor, refresh } = useSession();
  const [values, setValues] = useState({
    name: mentor?.name || user.name,
    specialty: mentor?.specialty || '',
    bio: mentor?.bio || '',
    experience: mentor?.experience ?? '',
  });
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [saving, setSaving] = useState(false);
  const order = ['name', 'specialty', 'experience', 'bio'];

  const setValue = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const showErrors = (next) => {
    setErrors(next);
    const first = order.find((field) => next[field]);
    if (first) document.getElementById(`mentor-${first}`)?.focus();
    return Boolean(first);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setFeedback(null);
    const next = {};
    if (!values.name.trim()) next.name = 'Indique o nome profissional.';
    if (!values.specialty.trim()) next.specialty = 'Indique a sua especialidade.';
    if (String(values.experience).trim()) {
      const years = Number(values.experience);
      if (!Number.isInteger(years) || years < 0) next.experience = 'Indique um número de anos válido (0 ou mais).';
    }
    if (showErrors(next)) return;
    setSaving(true);
    try {
      await mutate('PUT', '/me/mentor', { ...values, experience: String(values.experience) });
      await refresh();
      setFeedback({ tone: 'success', text: 'Perfil guardado.' });
    } catch (error) {
      if (!showErrors(error.fields || {})) setFeedback({ tone: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SectionCard title="Informação profissional" description="É isto que os estudantes veem no seu perfil público.">
        <form className="profile-form" onSubmit={handleSubmit} noValidate>
          <fieldset className="form-group">
            <legend>Identificação</legend>
            <div className="form-grid">
              <Field id="mentor-name" label="Nome profissional" required autoComplete="name" value={values.name} onChange={setValue('name')} error={errors.name} />
              <Field id="mentor-email" label="Endereço de email" type="email" value={mentor?.email || user.email} disabled hint="Não é mostrado publicamente." />
            </div>
          </fieldset>
          <fieldset className="form-group">
            <legend>Apresentação</legend>
            <div className="form-grid">
              <Field id="mentor-specialty" label="Especialidade" required placeholder="Ex.: preparação para candidaturas" autoComplete="off" value={values.specialty} onChange={setValue('specialty')} error={errors.specialty} />
              <Field id="mentor-experience" label="Anos de experiência" type="number" min="0" inputMode="numeric" value={values.experience} onChange={setValue('experience')} error={errors.experience} />
              <TextAreaField className="form-field--full" id="mentor-bio" label="Apresentação" placeholder="Descreva a sua experiência" rows="5" value={values.bio} onChange={setValue('bio')} error={errors.bio} />
            </div>
          </fieldset>
          <div className="form-actions">
            <button className="button button--primary" type="submit" disabled={saving}>{saving ? 'A guardar…' : mentor ? 'Guardar perfil' : 'Criar perfil'}</button>
          </div>
          {feedback && <Notice tone={feedback.tone}>{feedback.text}</Notice>}
        </form>
      </SectionCard>
      <PasswordForm prefix="mentor-password" />
    </>
  );
}

function MentorBookings() {
  const { items, loading, error, reload } = useList('/me/mentor/bookings');
  const [message, setMessage] = useState(null);

  const setStatus = async (booking, status) => {
    setMessage(null);
    try {
      await mutate('PATCH', `/me/mentor/bookings/${booking.id}`, { status });
      setMessage({ tone: 'success', text: status === 'confirmed' ? 'Sessão confirmada.' : 'Sessão cancelada.' });
    } catch (err) {
      setMessage({ tone: 'error', text: Object.values(err.fields || {})[0] || err.message });
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState description={error.message} action={<button type="button" className="button button--outline" onClick={reload}>Tentar novamente</button>} />;

  return (
    <SectionCard>
      {message && <Notice tone={message.tone}>{message.text}</Notice>}
      {items.length === 0 ? (
        <EmptyState title="Ainda não há reservas" description="Os pedidos de sessão dos estudantes aparecem aqui." />
      ) : (
        <ul className="record-list">
          {items.map((b) => (
            <li className="record-list__item" key={b.id}>
              <div className="record-list__main">
                <span className="record-list__title">{b.studentName}</span>
                <span className="record-list__meta">
                  {formatDate(b.date)} às {b.time} · <a href={`mailto:${b.studentEmail}`}>{b.studentEmail}</a>
                </span>
                {b.topic && <span className="record-list__meta">{b.topic}</span>}
              </div>
              <div className="record-list__actions">
                <StatusBadge value={b.status} list={bookingStatus} />
                {b.status !== 'confirmed' && (
                  <button type="button" className="button button--small button--outline" onClick={() => setStatus(b, 'confirmed')}>Confirmar</button>
                )}
                {b.status !== 'cancelled' && (
                  <button type="button" className="button button--small button--text admin-actions__danger" onClick={() => setStatus(b, 'cancelled')}>Cancelar</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function MentorEmpty({ routeKey }) {
  const configs = {
    'mentor-services': ['Ainda não há serviços', 'A configuração de serviços e preços ainda não está disponível.'],
    'mentor-calendar': ['Ainda não há horários disponíveis', 'A gestão de disponibilidade ainda não está disponível.'],
    'mentor-earnings': ['Ainda não há dados de rendimentos', 'Os rendimentos aparecem aqui quando os pagamentos estiverem ligados.'],
  };
  const [title, description] = configs[routeKey] || ['Ainda sem dados para apresentar', 'Esta área é preenchida quando existirem dados.'];
  return <SectionCard><EmptyState title={title} description={description} /></SectionCard>;
}

export default function MentorPage({ routeKey }) {
  const view = mentorViews[routeKey] || mentorViews['mentor-home'];
  let content;
  if (routeKey === 'mentor-home') content = <MentorHome />;
  else if (routeKey === 'mentor-profile') content = <MentorProfile />;
  else if (routeKey === 'mentor-bookings') content = <MentorBookings />;
  else content = <MentorEmpty routeKey={routeKey} />;

  return (
    <PortalLayout type="mentor">
      <PageHeading title={view.title} description={view.description} />
      <ProfileStatus />
      {content}
    </PortalLayout>
  );
}
