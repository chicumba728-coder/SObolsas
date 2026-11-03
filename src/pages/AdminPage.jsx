import React, { useState } from 'react';
import { Link } from '../router.jsx';
import PortalLayout from '../components/PortalLayout.jsx';
import { DataTable, ErrorState, Field, LoadingState, Notice, PageHeading, SearchField, SectionCard, SelectField, TextAreaField } from '../components/ui.jsx';
import { ArrowUpRight, Close, Plus } from '../components/icons.jsx';
import { mutate, useList, useResource } from '../data/store.js';
import {
  bookingStatus, formatDate, labelOf, mentorStatus, scholarshipStatus, statusTones, todayISO, userStatus, userTypes,
} from '../data/status.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/\S+$/i;

function StatusBadge({ value, list }) {
  return <span className={`status-badge status-badge--${statusTones[value] || 'muted'}`}>{labelOf(list, value)}</span>;
}

// Configuração de cada área de gestão: campos do formulário, colunas, ações rápidas e validações.
const entities = {
  scholarship: {
    path: '/admin/scholarships',
    createLabel: 'Lançar bolsa',
    names: { one: 'Bolsa', done: 'guardada' },
    defaults: { status: 'published' },
    fields: [
      { id: 'title', label: 'Título da oportunidade', type: 'text', required: true },
      { id: 'provider', label: 'Entidade', type: 'text', required: true },
      { id: 'deadline', label: 'Prazo', type: 'date' },
      { id: 'link', label: 'Ligação oficial (opcional)', type: 'url', placeholder: 'https://' },
      { id: 'status', label: 'Estado', type: 'select', options: scholarshipStatus, required: true },
      { id: 'description', label: 'Descrição', type: 'textarea', full: true },
    ],
    columns: ['Oportunidade', 'Entidade', 'Prazo', 'Estado'],
    cells: (r) => [r.title, r.provider, formatDate(r.deadline), <StatusBadge key="s" value={r.status} list={scholarshipStatus} />],
    search: (r) => [r.title, r.provider, r.description, labelOf(scholarshipStatus, r.status)],
    quick: (r) => (r.status === 'published'
      ? { label: 'Passar a rascunho', patch: { status: 'draft' } }
      : { label: 'Publicar', patch: { status: 'published' } }),
    validate: (v, existing) => {
      const errors = {};
      if (v.link && !URL_RE.test(v.link.trim())) errors.link = 'Introduza uma ligação válida, a começar por http:// ou https://.';
      if (v.deadline && v.deadline !== existing?.deadline && v.deadline < todayISO()) errors.deadline = 'O prazo não pode estar no passado.';
      return errors;
    },
  },
  user: {
    path: '/admin/users',
    createLabel: 'Adicionar utilizador',
    names: { one: 'Utilizador', done: 'guardado' },
    defaults: { type: 'student', status: 'active' },
    fields: [
      { id: 'name', label: 'Nome', type: 'text', required: true },
      { id: 'email', label: 'Endereço de email', type: 'email', required: true },
      { id: 'type', label: 'Tipo de conta', type: 'select', options: userTypes, required: true },
      { id: 'status', label: 'Estado', type: 'select', options: userStatus, required: true },
      { id: 'password', label: 'Palavra-passe', type: 'password', requiredOnCreate: true, hint: 'Mínimo 8 caracteres. Ao editar, deixe vazio para manter a atual.' },
    ],
    columns: ['Utilizador', 'Contacto', 'Tipo', 'Estado'],
    cells: (r) => [r.name, r.email, labelOf(userTypes, r.type), <StatusBadge key="s" value={r.status} list={userStatus} />],
    search: (r) => [r.name, r.email, labelOf(userTypes, r.type), labelOf(userStatus, r.status)],
    quick: (r) => (r.status === 'active'
      ? { label: 'Suspender', patch: { status: 'suspended' } }
      : { label: 'Reativar', patch: { status: 'active' } }),
  },
  mentor: {
    path: '/admin/mentors',
    createLabel: 'Adicionar mentor',
    names: { one: 'Mentor', done: 'guardado' },
    defaults: { status: 'approved' },
    fields: [
      { id: 'name', label: 'Nome profissional', type: 'text', required: true },
      { id: 'email', label: 'Endereço de email', type: 'email', required: true, hint: 'Visível apenas na administração.' },
      { id: 'specialty', label: 'Especialidade', type: 'text' },
      { id: 'status', label: 'Estado', type: 'select', options: mentorStatus, required: true, hint: 'Só mentores aprovados aparecem no site público.' },
      { id: 'bio', label: 'Apresentação', type: 'textarea', full: true },
    ],
    columns: ['Mentor', 'Especialidade', 'Estado'],
    cells: (r) => [r.name, r.specialty || '—', <StatusBadge key="s" value={r.status} list={mentorStatus} />],
    search: (r) => [r.name, r.email, r.specialty, r.bio, labelOf(mentorStatus, r.status)],
    quick: (r) => (r.status === 'approved'
      ? { label: 'Suspender', patch: { status: 'suspended' } }
      : { label: 'Aprovar', patch: { status: 'approved' } }),
  },
  booking: {
    path: '/admin/bookings',
    createLabel: 'Registar reserva',
    names: { one: 'Reserva', done: 'guardada' },
    defaults: { status: 'confirmed' },
    fields: [
      { id: 'mentorId', label: 'Mentor', type: 'mentor', required: true },
      { id: 'studentName', label: 'Nome do estudante', type: 'text', required: true },
      { id: 'studentEmail', label: 'Email do estudante', type: 'email', required: true },
      { id: 'date', label: 'Data', type: 'date', required: true },
      { id: 'time', label: 'Horário', type: 'time', required: true },
      { id: 'status', label: 'Estado', type: 'select', options: bookingStatus, required: true },
      { id: 'topic', label: 'Assunto (opcional)', type: 'textarea', full: true },
    ],
    columns: ['Estudante', 'Mentor', 'Data e hora', 'Estado'],
    cells: (r) => [r.studentName, r.mentorName || '—', `${formatDate(r.date)} · ${r.time || '—'}`, <StatusBadge key="s" value={r.status} list={bookingStatus} />],
    search: (r) => [r.studentName, r.studentEmail, r.mentorName, r.date, r.topic, labelOf(bookingStatus, r.status)],
    quick: (r) => (r.status === 'pending'
      ? { label: 'Confirmar', patch: { status: 'confirmed' } }
      : r.status === 'confirmed'
        ? { label: 'Cancelar', patch: { status: 'cancelled' } }
        : { label: 'Reabrir', patch: { status: 'pending' } }),
  },
};

const adminViews = {
  'admin-home': { title: 'Resumo administrativo', description: 'Aceda às áreas de gestão e acompanhe o estado dos conteúdos.' },
  'admin-scholarships': { title: 'Gestão de bolsas', description: 'Apenas a administração publica novas bolsas.', entity: 'scholarship' },
  'admin-users': { title: 'Gestão de utilizadores', description: 'Contas de estudantes e mentores registadas na plataforma.', entity: 'user' },
  'admin-mentors': { title: 'Gestão de mentores', description: 'Aprove perfis profissionais. Só mentores aprovados são públicos.', entity: 'mentor' },
  'admin-bookings': { title: 'Gestão de reservas', description: 'Pedidos e sessões de mentoria agendadas.', entity: 'booking' },
};

const adminAreas = [
  ['/admin/bolsas', 'Bolsas', 'Publicar e gerir oportunidades de estudo.'],
  ['/admin/utilizadores', 'Utilizadores', 'Consultar e gerir contas de estudantes e mentores.'],
  ['/admin/mentores', 'Mentores', 'Aprovar perfis e acompanhar mentores.'],
  ['/admin/reservas', 'Reservas', 'Confirmar ou cancelar sessões agendadas.'],
];

function AdminForm({ entityKey, record, onSaved, onClose }) {
  const config = entities[entityKey];
  const { items: mentors } = useList('/admin/mentors', { enabled: entityKey === 'booking' });
  const [values, setValues] = useState(() => ({ ...config.defaults, ...(record || {}), password: '' }));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const idFor = (field) => `admin-${entityKey}-${field}`;

  const setValue = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const showErrors = (next) => {
    setErrors(next);
    const firstInvalid = config.fields.find((field) => next[field.id]);
    if (firstInvalid) document.getElementById(idFor(firstInvalid.id))?.focus();
    return Boolean(firstInvalid);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    const next = {};
    const clean = {};
    config.fields.forEach((field) => {
      const raw = values[field.id] ?? '';
      clean[field.id] = field.type === 'password' ? raw : String(raw).trim();
    });

    config.fields.forEach((field) => {
      const required = field.required || (field.requiredOnCreate && !record);
      if (required && !clean[field.id]) next[field.id] = 'Campo obrigatório.';
      if (field.type === 'email' && clean[field.id] && !EMAIL_RE.test(clean[field.id])) next[field.id] = 'Introduza um endereço de email válido.';
      if (field.type === 'password' && clean[field.id] && clean[field.id].length < 8) next[field.id] = 'Use pelo menos 8 caracteres.';
    });
    Object.assign(next, config.validate ? config.validate(clean, record) : {});
    if (showErrors(next)) return;

    const data = { ...clean };
    if (data.password === '') delete data.password;
    setSaving(true);
    setFormError('');
    try {
      if (record) await mutate('PATCH', `${config.path}/${record.id}`, data);
      else await mutate('POST', config.path, data);
      onSaved(`${config.names.one} ${config.names.done}.`);
    } catch (error) {
      const fieldErrors = Object.fromEntries(Object.entries(error.fields || {}).filter(([id]) => config.fields.some((f) => f.id === id)));
      if (!showErrors(fieldErrors)) setFormError(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard
      title={record ? 'Editar registo' : 'Novo registo'}
      description="As alterações são guardadas no servidor e ficam visíveis para todos."
      className="admin-form"
      action={<button type="button" className="button button--text" onClick={onClose}>Fechar <Close size={16} /></button>}
    >
      <form className="profile-form" onSubmit={handleSubmit} noValidate>
        {formError && <Notice tone="error">{formError}</Notice>}
        <div className="form-grid">
          {config.fields.map((field) => {
            const common = {
              id: idFor(field.id),
              label: field.label,
              required: field.required || (field.requiredOnCreate && !record),
              hint: field.hint,
              error: errors[field.id],
              value: values[field.id] || '',
              onChange: setValue(field.id),
            };
            if (field.type === 'textarea') return <TextAreaField key={field.id} className="form-field--full" rows="3" {...common} />;
            if (field.type === 'select') return <SelectField key={field.id} options={field.options} {...common} />;
            if (field.type === 'mentor') {
              return (
                <SelectField
                  key={field.id}
                  placeholder={mentors.length ? 'Escolha um mentor' : 'Crie primeiro um mentor'}
                  options={mentors.map((m) => ({ value: m.id, label: m.name }))}
                  {...common}
                />
              );
            }
            return <Field key={field.id} type={field.type} placeholder={field.placeholder} autoComplete={field.type === 'password' ? 'new-password' : undefined} {...common} />;
          })}
        </div>
        <div className="form-actions">
          <button className="button button--primary" type="submit" disabled={saving}>{saving ? 'A guardar…' : record ? 'Guardar alterações' : 'Guardar'}</button>
          <button className="button button--outline" type="button" onClick={onClose}>Cancelar</button>
        </div>
      </form>
    </SectionCard>
  );
}

function AdminHome() {
  const { data: summary, error, loading, reload } = useResource('/admin/summary');

  if (loading) return <LoadingState />;
  if (error) return <ErrorState description={error.message} action={<button type="button" className="button button--outline" onClick={reload}>Tentar novamente</button>} />;

  const stats = [
    ['Bolsas', summary.scholarships.total, `${summary.scholarships.published} publicadas`],
    ['Utilizadores', summary.users.total, `${summary.users.suspended} suspensos`],
    ['Mentores', summary.mentors.total, `${summary.mentors.pending} por aprovar`],
    ['Reservas', summary.bookings.total, `${summary.bookings.pending} pendentes`],
  ];

  return (
    <>
      <div className="console-strip console-strip--four" role="group" aria-label="Resumo dos conteúdos">
        {stats.map(([label, total, hint]) => (
          <div className="console-stat" key={label}>
            <span className="console-stat__label">{label}</span>
            <span className={`console-stat__value${total === 0 ? ' console-stat__value--empty' : ''}`}>{total}</span>
            <span className="console-stat__hint">{hint}</span>
          </div>
        ))}
      </div>
      <section className="console-panel" aria-labelledby="admin-areas-title">
        <div className="console-panel__head"><h2 id="admin-areas-title">Áreas de gestão</h2></div>
        <div className="console-panel__body">
          <nav className="shortcut-list" aria-label="Áreas de gestão">
            {adminAreas.map(([to, title, description]) => (
              <Link className="shortcut-list__item" key={to} to={to}>
                <span>
                  <span className="shortcut-list__title">{title}</span>
                  <span className="shortcut-list__description">{description}</span>
                </span>
                <ArrowUpRight size={18} />
              </Link>
            ))}
          </nav>
        </div>
      </section>
    </>
  );
}

function AdminList({ entityKey }) {
  const config = entities[entityKey];
  const { items: records, loading, error, reload } = useList(config.path);
  const [search, setSearch] = useState('');
  const [actionError, setActionError] = useState('');
  const [form, setForm] = useState(null); // null | 'new' | record
  const [confirmId, setConfirmId] = useState(null);
  const [message, setMessage] = useState('');

  const term = search.trim().toLowerCase();
  const filtered = term
    ? records.filter((r) => config.search(r).some((value) => String(value || '').toLowerCase().includes(term)))
    : records;

  const closeForm = () => setForm(null);
  const saved = (text) => { setMessage(text); closeForm(); };
  const openNew = () => { setMessage(''); setActionError(''); setForm(form === 'new' ? null : 'new'); };

  const runAction = async (method, record, body, successText) => {
    setMessage('');
    setActionError('');
    try {
      await mutate(method, `${config.path}/${record.id}`, body);
      setMessage(successText);
      return true;
    } catch (err) {
      setActionError(Object.values(err.fields || {})[0] || err.message);
      return false;
    }
  };

  const renderRow = (record) => {
    const quick = config.quick?.(record);
    return (
      <tr key={record.id}>
        {config.cells(record).map((cell, index) => <td key={index}>{cell}</td>)}
        <td className="admin-actions">
          {confirmId === record.id ? (
            <span className="admin-actions__confirm" role="group" aria-label="Confirmar eliminação">
              <span>Eliminar?</span>
              <button type="button" className="button button--small button--primary" onClick={async () => { setConfirmId(null); if (await runAction('DELETE', record, undefined, 'Registo eliminado.') && form?.id === record.id) closeForm(); }}>Sim</button>
              <button type="button" className="button button--small button--text" onClick={() => setConfirmId(null)}>Não</button>
            </span>
          ) : (
            <>
              <button type="button" className="button button--small button--text" onClick={() => { setMessage(''); setForm(record); }}>Editar</button>
              {quick && (
                <button type="button" className="button button--small button--text" onClick={() => runAction('PATCH', record, quick.patch, `Estado atualizado: ${quick.label.toLowerCase()}.`)}>{quick.label}</button>
              )}
              <button type="button" className="button button--small button--text admin-actions__danger" onClick={() => setConfirmId(record.id)}>Eliminar</button>
            </>
          )}
        </td>
      </tr>
    );
  };

  return (
    <>
      {message && <Notice tone="success">{message}</Notice>}
      {actionError && <Notice tone="error">{actionError}</Notice>}
      {form && (
        <AdminForm
          key={form === 'new' ? 'new' : form.id}
          entityKey={entityKey}
          record={form === 'new' ? null : form}
          onSaved={saved}
          onClose={closeForm}
        />
      )}
      <div className="admin-console__bar">
        <SearchField id="admin-search" label="Pesquisar nesta área" placeholder="Nome, email ou estado" value={search} onChange={(event) => setSearch(event.target.value)} />
        <span className="admin-console__chip" role="status" aria-live="polite">
          {filtered.length === 0 ? 'Sem registos' : `${filtered.length} registo${filtered.length === 1 ? '' : 's'}`}
        </span>
        <button className="button button--primary" type="button" aria-expanded={form === 'new'} onClick={openNew}>
          {form === 'new' ? <>Fechar formulário <Close size={16} /></> : <>{config.createLabel} <Plus size={16} /></>}
        </button>
      </div>
      {loading && <LoadingState />}
      {error && <ErrorState description={error.message} action={<button type="button" className="button button--outline" onClick={reload}>Tentar novamente</button>} />}
      {!loading && !error && <DataTable
        caption={`${config.names.one} — tabela`}
        columns={[...config.columns, 'Ações']}
        rows={filtered}
        renderRow={renderRow}
        emptyTitle={term ? 'Nenhum registo corresponde à pesquisa' : 'Ainda não há registos'}
        emptyDescription={term ? 'Experimente outro termo ou limpe a pesquisa.' : `Use “${config.createLabel}” para criar o primeiro registo.`}
      />}
    </>
  );
}

export default function AdminPage({ routeKey }) {
  const config = adminViews[routeKey] || adminViews['admin-home'];

  return (
    <PortalLayout type="admin">
      <PageHeading title={config.title} description={config.description} />
      {config.entity ? <AdminList key={config.entity} entityKey={config.entity} /> : <AdminHome />}
    </PortalLayout>
  );
}
