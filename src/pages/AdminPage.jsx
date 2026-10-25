import React, { useState } from 'react';
import { Link } from '../router.jsx';
import PortalLayout from '../components/PortalLayout.jsx';
import { DataTable, Field, Notice, PageHeading, SearchField, SectionCard, SelectField, TextAreaField } from '../components/ui.jsx';
import { ArrowUpRight, Close, Plus } from '../components/icons.jsx';
import { addRecord, removeRecord, resetAllData, updateRecord, useCollection } from '../data/store.js';
import {
  bookingStatus, formatDate, labelOf, mentorStatus, scholarshipStatus, todayISO, userStatus, userTypes,
} from '../data/status.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/\S+$/i;

const tones = {
  published: 'success', approved: 'success', active: 'success', confirmed: 'success',
  draft: 'warning', pending: 'warning',
  suspended: 'muted', cancelled: 'muted',
};

function StatusBadge({ value, list }) {
  return <span className={`status-badge status-badge--${tones[value] || 'muted'}`}>{labelOf(list, value)}</span>;
}

// Configuração de cada área de gestão: campos do formulário, colunas, ações rápidas e validações.
const entities = {
  scholarship: {
    collection: 'scholarships',
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
    collection: 'users',
    createLabel: 'Adicionar utilizador',
    names: { one: 'Utilizador', done: 'guardado' },
    defaults: { type: 'student', status: 'active' },
    fields: [
      { id: 'name', label: 'Nome', type: 'text', required: true },
      { id: 'email', label: 'Endereço de email', type: 'email', required: true },
      { id: 'type', label: 'Tipo de conta', type: 'select', options: userTypes, required: true },
      { id: 'status', label: 'Estado', type: 'select', options: userStatus, required: true },
    ],
    columns: ['Utilizador', 'Contacto', 'Tipo', 'Estado'],
    cells: (r) => [r.name, r.email, labelOf(userTypes, r.type), <StatusBadge key="s" value={r.status} list={userStatus} />],
    search: (r) => [r.name, r.email, labelOf(userTypes, r.type), labelOf(userStatus, r.status)],
    quick: (r) => (r.status === 'active'
      ? { label: 'Suspender', patch: { status: 'suspended' } }
      : { label: 'Reativar', patch: { status: 'active' } }),
    uniqueEmail: true,
  },
  mentor: {
    collection: 'mentors',
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
    uniqueEmail: true,
  },
  booking: {
    collection: 'bookings',
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
    validate: (v, existing, all) => {
      const errors = {};
      if (v.status !== 'cancelled' && v.mentorId && v.date && v.time) {
        const clash = all.some((r) => r.id !== existing?.id && r.mentorId === v.mentorId && r.date === v.date && r.time === v.time && r.status !== 'cancelled');
        if (clash) errors.time = 'Este mentor já tem uma reserva neste dia e horário.';
      }
      return errors;
    },
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
  const mentors = useCollection('mentors');
  const existingRecords = useCollection(config.collection);
  const [values, setValues] = useState(() => ({ ...config.defaults, ...(record || {}) }));
  const [errors, setErrors] = useState({});
  const idFor = (field) => `admin-${entityKey}-${field}`;

  const setValue = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const next = {};
    const clean = {};
    config.fields.forEach((field) => { clean[field.id] = (values[field.id] || '').trim(); });

    config.fields.forEach((field) => {
      if (field.required && !clean[field.id]) next[field.id] = 'Campo obrigatório.';
      if (field.type === 'email' && clean[field.id] && !EMAIL_RE.test(clean[field.id])) next[field.id] = 'Introduza um endereço de email válido.';
    });
    if (config.uniqueEmail && clean.email && !next.email) {
      const taken = existingRecords.some((r) => r.id !== record?.id && (r.email || '').toLowerCase() === clean.email.toLowerCase());
      if (taken) next.email = 'Já existe um registo com este email.';
    }
    Object.assign(next, config.validate ? config.validate(clean, record, existingRecords) : {});

    setErrors(next);
    const firstInvalid = config.fields.find((field) => next[field.id]);
    if (firstInvalid) { document.getElementById(idFor(firstInvalid.id))?.focus(); return; }

    const data = { ...clean };
    if (entityKey === 'booking') data.mentorName = mentors.find((m) => m.id === clean.mentorId)?.name || '';
    if (record) updateRecord(config.collection, record.id, data);
    else addRecord(config.collection, data);
    onSaved(`${config.names.one} ${config.names.done}.`);
  };

  return (
    <SectionCard
      title={record ? 'Editar registo' : 'Novo registo'}
      description="Os dados ficam guardados neste navegador até existir ligação ao servidor."
      className="admin-form"
      action={<button type="button" className="button button--text" onClick={onClose}>Fechar <Close size={16} /></button>}
    >
      <form className="profile-form" onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          {config.fields.map((field) => {
            const common = {
              id: idFor(field.id),
              label: field.label,
              required: field.required,
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
            return <Field key={field.id} type={field.type} placeholder={field.placeholder} {...common} />;
          })}
        </div>
        <div className="form-actions">
          <button className="button button--primary" type="submit">{record ? 'Guardar alterações' : 'Guardar'}</button>
          <button className="button button--outline" type="button" onClick={onClose}>Cancelar</button>
        </div>
      </form>
    </SectionCard>
  );
}

function AdminHome() {
  const scholarships = useCollection('scholarships');
  const users = useCollection('users');
  const mentors = useCollection('mentors');
  const bookings = useCollection('bookings');
  const [confirmReset, setConfirmReset] = useState(false);

  const stats = [
    ['Bolsas', scholarships.length, `${scholarships.filter((r) => r.status === 'published').length} publicadas`],
    ['Utilizadores', users.length, `${users.filter((r) => r.status === 'suspended').length} suspensos`],
    ['Mentores', mentors.length, `${mentors.filter((r) => r.status === 'pending').length} por aprovar`],
    ['Reservas', bookings.length, `${bookings.filter((r) => r.status === 'pending').length} pendentes`],
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
      <section className="admin-reset" aria-label="Dados locais">
        <p>Os dados deste MVP ficam guardados apenas neste navegador.</p>
        {confirmReset ? (
          <span className="admin-reset__confirm">
            Apagar todos os registos?
            <button type="button" className="button button--small button--primary" onClick={() => { resetAllData(); setConfirmReset(false); }}>Sim, apagar</button>
            <button type="button" className="button button--small button--text" onClick={() => setConfirmReset(false)}>Cancelar</button>
          </span>
        ) : (
          <button type="button" className="button button--small button--outline" onClick={() => setConfirmReset(true)}>Repor dados locais</button>
        )}
      </section>
    </>
  );
}

function AdminList({ entityKey }) {
  const config = entities[entityKey];
  const records = useCollection(config.collection);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(null); // null | 'new' | record
  const [confirmId, setConfirmId] = useState(null);
  const [message, setMessage] = useState('');

  const term = search.trim().toLowerCase();
  const filtered = term
    ? records.filter((r) => config.search(r).some((value) => String(value || '').toLowerCase().includes(term)))
    : records;

  const closeForm = () => setForm(null);
  const saved = (text) => { setMessage(text); closeForm(); };
  const openNew = () => { setMessage(''); setForm(form === 'new' ? null : 'new'); };

  const renderRow = (record) => {
    const quick = config.quick?.(record);
    return (
      <tr key={record.id}>
        {config.cells(record).map((cell, index) => <td key={index}>{cell}</td>)}
        <td className="admin-actions">
          {confirmId === record.id ? (
            <span className="admin-actions__confirm" role="group" aria-label="Confirmar eliminação">
              <span>Eliminar?</span>
              <button type="button" className="button button--small button--primary" onClick={() => { removeRecord(config.collection, record.id); setConfirmId(null); setMessage('Registo eliminado.'); if (form?.id === record.id) closeForm(); }}>Sim</button>
              <button type="button" className="button button--small button--text" onClick={() => setConfirmId(null)}>Não</button>
            </span>
          ) : (
            <>
              <button type="button" className="button button--small button--text" onClick={() => { setMessage(''); setForm(record); }}>Editar</button>
              {quick && (
                <button type="button" className="button button--small button--text" onClick={() => { updateRecord(config.collection, record.id, quick.patch); setMessage(`Estado atualizado: ${quick.label.toLowerCase()}.`); }}>{quick.label}</button>
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
      <DataTable
        caption={`${config.names.one} — tabela`}
        columns={[...config.columns, 'Ações']}
        rows={filtered}
        renderRow={renderRow}
        emptyTitle={term ? 'Nenhum registo corresponde à pesquisa' : 'Ainda não há registos'}
        emptyDescription={term ? 'Experimente outro termo ou limpe a pesquisa.' : `Use “${config.createLabel}” para criar o primeiro registo.`}
      />
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
