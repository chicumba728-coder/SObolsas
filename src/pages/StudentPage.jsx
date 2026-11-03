import React, { useState } from 'react';
import { Link } from '../router.jsx';
import PortalLayout from '../components/PortalLayout.jsx';
import {
  DemoNote, EmptyState, ErrorState, Field, LoadingState, Notice, PageHeading, SectionCard, SelectField, TextAreaField,
} from '../components/ui.jsx';
import { ArrowRight, ArrowUpRight } from '../components/icons.jsx';
import { useSession } from '../session.jsx';
import { mutate, useList } from '../data/store.js';
import { applicationStatus, bookingStatus, formatDate, labelOf, mentorStatus, statusTones } from '../data/status.js';

const studentViews = {
  'student-home': { title: 'Resumo', description: 'Acompanhe o seu percurso académico e os próximos passos.' },
  'student-profile': { title: 'Perfil', description: 'Os seus dados pessoais e académicos num só lugar.' },
  'student-saved': { title: 'Bolsas guardadas', description: 'As oportunidades que guardou para consultar mais tarde.' },
  'student-applications': { title: 'Candidaturas', description: 'O estado das suas candidaturas a bolsas.' },
  'student-documents': { title: 'Documentos', description: 'Ficheiros associados ao seu percurso.' },
  'student-mentorships': { title: 'Mentorias', description: 'As suas sessões de mentoria pedidas com esta conta.' },
  'student-mentor-application': { title: 'Candidatura a mentor', description: 'Candidate-se para passar a oferecer serviços de mentoria na plataforma.' },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function StatusBadge({ value, list }) {
  return <span className={`status-badge status-badge--${statusTones[value] || 'muted'}`}>{labelOf(list, value)}</span>;
}

function ListState({ loading, error, reload }) {
  if (loading) return <LoadingState />;
  if (error) return <ErrorState description={error.message} action={<button type="button" className="button button--outline" onClick={reload}>Tentar novamente</button>} />;
  return null;
}

// Formulário genérico: estado, erros locais/servidor e envio.
function useForm(initial, fieldIds, prefix) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [saving, setSaving] = useState(false);

  const setValue = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const showErrors = (next) => {
    setErrors(next);
    const first = fieldIds.find((field) => next[field]);
    if (first) document.getElementById(`${prefix}-${first}`)?.focus();
    return Boolean(first);
  };

  const submit = async (validate, action, successText) => {
    if (saving) return;
    setFeedback(null);
    if (showErrors(validate(values))) return;
    setSaving(true);
    try {
      await action(values);
      setFeedback({ tone: 'success', text: successText });
    } catch (error) {
      if (!showErrors(error.fields || {})) setFeedback({ tone: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  return { values, setValues, errors, feedback, saving, setValue, submit };
}

function ProfileForm() {
  const { user, refresh } = useSession();
  const form = useForm(
    { name: user.name, email: user.email, study: user.study || '', institution: user.institution || '', about: user.about || '' },
    ['name', 'email', 'study', 'institution', 'about'],
    'student',
  );
  const { values, errors, setValue } = form;

  const validate = (v) => {
    const next = {};
    if (!v.name.trim()) next.name = 'Indique o seu nome.';
    if (!v.email.trim()) next.email = 'Indique o endereço de email.';
    else if (!EMAIL_RE.test(v.email.trim())) next.email = 'Introduza um endereço de email válido.';
    return next;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    form.submit(validate, async (v) => { await mutate('PUT', '/me/profile', v); await refresh(); }, 'Perfil guardado.');
  };

  return (
    <SectionCard title="Dados do perfil" description="Estes dados ficam associados à sua conta.">
      <form className="profile-form" onSubmit={handleSubmit} noValidate>
        <fieldset className="form-group">
          <legend>Dados pessoais</legend>
          <div className="form-grid">
            <Field id="student-name" label="Nome" required autoComplete="name" value={values.name} onChange={setValue('name')} error={errors.name} />
            <Field id="student-email" label="Endereço de email" type="email" required autoComplete="email" value={values.email} onChange={setValue('email')} error={errors.email} />
          </div>
        </fieldset>
        <fieldset className="form-group">
          <legend>Percurso académico</legend>
          <div className="form-grid">
            <Field id="student-study" label="Área de estudo" autoComplete="off" value={values.study} onChange={setValue('study')} error={errors.study} />
            <Field id="student-institution" label="Instituição de ensino" autoComplete="organization" value={values.institution} onChange={setValue('institution')} error={errors.institution} />
            <TextAreaField className="form-field--full" id="student-about" label="Sobre si" placeholder="Escreva uma breve apresentação" rows="4" value={values.about} onChange={setValue('about')} error={errors.about} />
          </div>
        </fieldset>
        <div className="form-actions">
          <button type="submit" className="button button--primary" disabled={form.saving}>{form.saving ? 'A guardar…' : 'Guardar perfil'}</button>
        </div>
        {form.feedback && <Notice tone={form.feedback.tone}>{form.feedback.text}</Notice>}
      </form>
    </SectionCard>
  );
}

export function PasswordForm({ prefix = 'password' }) {
  const form = useForm({ currentPassword: '', newPassword: '' }, ['currentPassword', 'newPassword'], prefix);
  const { values, errors, setValue } = form;

  const handleSubmit = (event) => {
    event.preventDefault();
    form.submit(
      (v) => {
        const next = {};
        if (!v.currentPassword) next.currentPassword = 'Introduza a palavra-passe atual.';
        if (v.newPassword.length < 8) next.newPassword = 'Use pelo menos 8 caracteres.';
        return next;
      },
      async (v) => { await mutate('PUT', '/me/password', v); form.setValues({ currentPassword: '', newPassword: '' }); },
      'Palavra-passe alterada. As outras sessões foram terminadas.',
    );
  };

  return (
    <SectionCard title="Palavra-passe" description="Altere a palavra-passe de acesso à conta.">
      <form className="profile-form" onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <Field id={`${prefix}-currentPassword`} label="Palavra-passe atual" type="password" required autoComplete="current-password" value={values.currentPassword} onChange={setValue('currentPassword')} error={errors.currentPassword} />
          <Field id={`${prefix}-newPassword`} label="Nova palavra-passe" type="password" required autoComplete="new-password" hint="Use pelo menos 8 caracteres." value={values.newPassword} onChange={setValue('newPassword')} error={errors.newPassword} />
        </div>
        <div className="form-actions">
          <button type="submit" className="button button--outline" disabled={form.saving}>{form.saving ? 'A guardar…' : 'Alterar palavra-passe'}</button>
        </div>
        {form.feedback && <Notice tone={form.feedback.tone}>{form.feedback.text}</Notice>}
      </form>
    </SectionCard>
  );
}

function StudentHome() {
  const applications = useList('/me/applications');
  const saved = useList('/me/saved');
  const bookings = useList('/me/bookings');
  const upcoming = bookings.items.filter((b) => b.status !== 'cancelled');

  const columns = [
    ['Candidaturas', '/estudante/candidaturas', applications, 'Ainda não acompanha nenhuma candidatura.',
      (a) => <><span>{a.scholarshipTitle}</span> <StatusBadge value={a.status} list={applicationStatus} /></>],
    ['Bolsas guardadas', '/estudante/bolsas-guardadas', saved, 'Ainda não guardou nenhuma bolsa.',
      (s) => <><span>{s.title}</span> <span className="muted-text">Prazo: {formatDate(s.deadline)}</span></>],
    ['Mentorias', '/estudante/mentorias', { ...bookings, items: upcoming }, 'Ainda não há sessões pedidas.',
      (b) => <><span>{b.mentorName} · {formatDate(b.date)} {b.time}</span> <StatusBadge value={b.status} list={bookingStatus} /></>],
  ];

  return (
    <>
      <section className="tracker-lead" aria-labelledby="student-lead-title">
        <div className="tracker-lead__copy">
          <h2 id="student-lead-title">O seu percurso num só lugar</h2>
          <p>Reúna bolsas, candidaturas e mentorias. À medida que avança, o estado de cada passo aparece aqui.</p>
        </div>
        <div className="tracker-lead__action">
          <Link className="button button--primary" to="/bolsas">Encontrar bolsas <ArrowRight size={16} /></Link>
        </div>
      </section>
      <div className="tracker-columns">
        {columns.map(([title, to, list, empty, render]) => (
          <section className="tracker-column" key={to} aria-label={title}>
            <div className="tracker-column__head">
              <Link className="tracker-column__title" to={to}>{title}</Link>
              <span className="tracker-column__count">{list.loading ? '…' : list.items.length}</span>
            </div>
            <div className="tracker-column__body">
              {list.items.length === 0
                ? <p className="tracker-column__empty">{list.loading ? 'A carregar…' : empty}</p>
                : (
                  <ul className="tracker-column__list">
                    {list.items.slice(0, 3).map((item) => <li key={item.id}>{render(item)}</li>)}
                  </ul>
                )}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

function SavedScholarships() {
  const { items, loading, error, reload } = useList('/me/saved');
  const [message, setMessage] = useState(null);

  const remove = async (id) => {
    try {
      await mutate('DELETE', `/me/saved/${id}`);
      setMessage({ tone: 'success', text: 'Bolsa removida das guardadas.' });
    } catch (err) {
      setMessage({ tone: 'error', text: err.message });
    }
  };

  if (loading || error) return <ListState loading={loading} error={error} reload={reload} />;
  return (
    <SectionCard>
      {message && <Notice tone={message.tone}>{message.text}</Notice>}
      {items.length === 0 ? (
        <EmptyState
          title="Ainda não há bolsas guardadas"
          description="As bolsas que guardar aparecem aqui."
          hints={['Abra uma bolsa e use “Guardar bolsa” para a reunir aqui.']}
          action={<Link className="button button--outline" to="/bolsas">Explorar bolsas</Link>}
        />
      ) : (
        <ul className="record-list">
          {items.map((s) => (
            <li className="record-list__item" key={s.id}>
              <div className="record-list__main">
                <Link className="record-list__title" to={`/bolsas/${s.id}`}>{s.title}</Link>
                <span className="record-list__meta">{s.provider} · Prazo: {formatDate(s.deadline)}</span>
              </div>
              <div className="record-list__actions">
                <button type="button" className="button button--small button--text" onClick={() => remove(s.id)}>Remover</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function ApplicationItem({ application, onMessage }) {
  const [notes, setNotes] = useState(application.notes || '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const update = async (patch, text) => {
    try {
      await mutate('PATCH', `/me/applications/${application.id}`, patch);
      onMessage({ tone: 'success', text });
    } catch (err) {
      onMessage({ tone: 'error', text: err.message });
    }
  };

  const remove = async () => {
    try {
      await mutate('DELETE', `/me/applications/${application.id}`);
      onMessage({ tone: 'success', text: 'Candidatura removida do acompanhamento.' });
    } catch (err) {
      onMessage({ tone: 'error', text: err.message });
    }
  };

  return (
    <li className="record-list__item record-list__item--stacked">
      <div className="record-list__main">
        <Link className="record-list__title" to={`/bolsas/${application.scholarshipId}`}>{application.scholarshipTitle}</Link>
        <span className="record-list__meta">{application.scholarshipProvider} · Prazo: {formatDate(application.scholarshipDeadline)}</span>
      </div>
      <div className="form-grid">
        <SelectField
          id={`application-status-${application.id}`}
          label="Estado"
          options={applicationStatus}
          value={application.status}
          onChange={(event) => update({ status: event.target.value }, 'Estado atualizado.')}
        />
        <TextAreaField
          className="form-field--full"
          id={`application-notes-${application.id}`}
          label="Notas"
          rows="2"
          placeholder="Documentos em falta, contactos, próximos passos…"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </div>
      <div className="record-list__actions">
        <button type="button" className="button button--small button--outline" disabled={notes === (application.notes || '')} onClick={() => update({ notes }, 'Notas guardadas.')}>Guardar notas</button>
        {confirmDelete ? (
          <span className="admin-actions__confirm" role="group" aria-label="Confirmar remoção">
            <span>Remover?</span>
            <button type="button" className="button button--small button--primary" onClick={remove}>Sim</button>
            <button type="button" className="button button--small button--text" onClick={() => setConfirmDelete(false)}>Não</button>
          </span>
        ) : (
          <button type="button" className="button button--small button--text admin-actions__danger" onClick={() => setConfirmDelete(true)}>Remover</button>
        )}
      </div>
    </li>
  );
}

function Applications() {
  const { items, loading, error, reload } = useList('/me/applications');
  const { items: saved } = useList('/me/saved');
  const [message, setMessage] = useState(null);
  const [selected, setSelected] = useState('');
  const available = saved.filter((s) => !items.some((a) => a.scholarshipId === s.id));

  const add = async (event) => {
    event.preventDefault();
    if (!selected) return;
    try {
      await mutate('POST', '/me/applications', { scholarshipId: selected });
      setSelected('');
      setMessage({ tone: 'success', text: 'Candidatura adicionada.' });
    } catch (err) {
      setMessage({ tone: 'error', text: Object.values(err.fields || {})[0] || err.message });
    }
  };

  if (loading || error) return <ListState loading={loading} error={error} reload={reload} />;
  return (
    <SectionCard>
      {message && <Notice tone={message.tone}>{message.text}</Notice>}
      {available.length > 0 && (
        <form className="inline-form" onSubmit={add}>
          <SelectField
            id="application-new"
            label="Acompanhar uma bolsa guardada"
            placeholder="Escolha uma bolsa"
            options={available.map((s) => ({ value: s.id, label: s.title }))}
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
          />
          <button type="submit" className="button button--primary" disabled={!selected}>Adicionar</button>
        </form>
      )}
      {items.length === 0 ? (
        <EmptyState
          title="Ainda não há candidaturas"
          description="Na página de uma bolsa, use “Acompanhar candidatura” para registar aqui o seu progresso."
          action={<Link className="button button--outline" to="/bolsas">Explorar bolsas</Link>}
        />
      ) : (
        <ul className="record-list">
          {items.map((a) => <ApplicationItem key={a.id} application={a} onMessage={setMessage} />)}
        </ul>
      )}
    </SectionCard>
  );
}

function Mentorships() {
  const { items, loading, error, reload } = useList('/me/bookings');
  if (loading || error) return <ListState loading={loading} error={error} reload={reload} />;
  return (
    <SectionCard>
      {items.length === 0 ? (
        <EmptyState
          title="Ainda não há mentorias"
          description="As sessões que pedir com esta conta aparecem aqui."
          action={<Link className="button button--outline" to="/mentores">Encontrar um mentor</Link>}
        />
      ) : (
        <ul className="record-list">
          {items.map((b) => (
            <li className="record-list__item" key={b.id}>
              <div className="record-list__main">
                <Link className="record-list__title" to={`/mentores/${b.mentorId}`}>{b.mentorName}</Link>
                <span className="record-list__meta">{formatDate(b.date)} às {b.time}{b.topic ? ` · ${b.topic}` : ''}</span>
              </div>
              <StatusBadge value={b.status} list={bookingStatus} />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function MentorApplicationForm() {
  const { user, mentor, refresh } = useSession();
  const form = useForm({ name: user.name, specialty: '', experience: '', motivation: '' }, ['name', 'specialty', 'experience', 'motivation'], 'apply');
  const { values, errors, setValue } = form;

  if (mentor) {
    return (
      <SectionCard title="Candidatura registada">
        <p>Estado: <StatusBadge value={mentor.status} list={mentorStatus} /></p>
        <p>
          {mentor.status === 'approved'
            ? 'O seu perfil de mentor está aprovado e visível no site.'
            : 'A administração vai analisar a candidatura. Entretanto, pode completar o perfil profissional.'}
        </p>
        <div className="detail-actions">
          <Link className="button button--primary" to="/mentor">Abrir área do mentor <ArrowRight size={16} /></Link>
        </div>
      </SectionCard>
    );
  }

  const validate = (v) => {
    const next = {};
    if (!v.name.trim()) next.name = 'Indique o nome profissional.';
    if (!v.specialty.trim()) next.specialty = 'Indique a sua especialidade.';
    if (String(v.experience).trim()) {
      const years = Number(v.experience);
      if (!Number.isInteger(years) || years < 0) next.experience = 'Indique um número de anos válido (0 ou mais).';
    }
    return next;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    form.submit(validate, async (v) => { await mutate('POST', '/me/mentor-application', v); await refresh(); }, 'Candidatura enviada.');
  };

  return (
    <SectionCard title="Candidatar-me a mentor" description="Candidate-se para oferecer serviços de mentoria. A aprovação é feita pela administração.">
      <form className="profile-form" onSubmit={handleSubmit} noValidate>
        {form.feedback && <Notice tone={form.feedback.tone}>{form.feedback.text}</Notice>}
        <fieldset className="form-group">
          <legend>Identificação</legend>
          <div className="form-grid">
            <Field id="apply-name" label="Nome profissional" required placeholder="Como quer ser apresentado" autoComplete="name" value={values.name} onChange={setValue('name')} error={errors.name} />
            <Field id="apply-email" label="Endereço de email" type="email" value={user.email} disabled hint="É usado o email da sua conta." />
          </div>
        </fieldset>
        <fieldset className="form-group">
          <legend>Experiência</legend>
          <div className="form-grid">
            <Field id="apply-specialty" label="Especialidade" required placeholder="Ex.: candidaturas ao ensino superior" autoComplete="off" value={values.specialty} onChange={setValue('specialty')} error={errors.specialty} />
            <Field id="apply-experience" label="Anos de experiência" type="number" min="0" placeholder="Ex.: 5" inputMode="numeric" value={values.experience} onChange={setValue('experience')} error={errors.experience} />
            <TextAreaField className="form-field--full" id="apply-motivation" label="Motivação" placeholder="Explique porque quer ser mentor na plataforma" rows="4" value={values.motivation} onChange={setValue('motivation')} error={errors.motivation} />
          </div>
        </fieldset>
        <div className="form-actions">
          <button type="submit" className="button button--primary" disabled={form.saving}>{form.saving ? 'A enviar…' : 'Submeter candidatura'}</button>
        </div>
      </form>
    </SectionCard>
  );
}

function Documents() {
  return (
    <SectionCard>
      <DemoNote>O envio e armazenamento de ficheiros ainda não estão ligados. Nenhum documento é enviado.</DemoNote>
      <EmptyState title="Ainda não há documentos" description="Os documentos ficam reunidos aqui depois de carregados." />
    </SectionCard>
  );
}

export default function StudentPage({ routeKey }) {
  const view = studentViews[routeKey] || studentViews['student-home'];
  const content = {
    'student-home': <StudentHome />,
    'student-profile': <><ProfileForm /><PasswordForm prefix="student-password" /></>,
    'student-saved': <SavedScholarships />,
    'student-applications': <Applications />,
    'student-documents': <Documents />,
    'student-mentorships': <Mentorships />,
    'student-mentor-application': <MentorApplicationForm />,
  }[routeKey] || <StudentHome />;

  return (
    <PortalLayout type="student">
      <PageHeading title={view.title} description={view.description} />
      {content}
      <div className="portal-help">
        <span>Precisa de orientação para se candidatar?</span>
        <Link to="/mentores">Consultar mentores <ArrowUpRight size={15} /></Link>
      </div>
    </PortalLayout>
  );
}
