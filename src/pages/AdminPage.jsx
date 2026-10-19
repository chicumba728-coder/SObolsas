import React, { useState } from 'react';
import { Link } from '../router.jsx';
import PortalLayout from '../components/PortalLayout.jsx';
import { DataTable, Field, Notice, PageHeading, SearchField, SectionCard, TextAreaField } from '../components/ui.jsx';
import { ArrowUpRight, Close, Plus } from '../components/icons.jsx';
import { emptyData } from '../data/emptyData.js';
import { useSession } from '../session.jsx';

const adminViews = {
  'admin-home': {
    title: 'Resumo administrativo',
    description: 'Aceda às áreas de gestão e acompanhe o estado dos conteúdos.',
    type: 'summary',
  },
  'admin-scholarships': {
    title: 'Gestão de bolsas',
    description: 'Apenas a administração publica novas bolsas.',
    columns: ['Oportunidade', 'Entidade', 'Prazo', 'Estado'],
    type: 'scholarship',
    action: 'Lançar bolsa',
    collection: 'scholarships',
  },
  'admin-users': {
    title: 'Gestão de utilizadores',
    description: 'Contas de estudantes e mentores registadas na plataforma.',
    columns: ['Utilizador', 'Contacto', 'Tipo', 'Estado'],
    type: 'user',
    action: 'Adicionar utilizador',
    collection: 'users',
  },
  'admin-mentors': {
    title: 'Gestão de mentores',
    description: 'Perfis profissionais ativos na plataforma.',
    columns: ['Mentor', 'Especialidade', 'Estado'],
    type: 'mentor',
    action: 'Adicionar mentor',
    collection: 'mentors',
  },
  'admin-bookings': {
    title: 'Gestão de reservas',
    description: 'Sessões de mentoria agendadas.',
    columns: ['Reserva', 'Serviço', 'Data', 'Estado'],
    type: 'booking',
    action: 'Registar reserva',
    collection: 'bookings',
  },
};

const adminAreas = [
  ['/admin/bolsas', 'Bolsas', 'Publicar e gerir oportunidades de estudo.'],
  ['/admin/utilizadores', 'Utilizadores', 'Consultar contas de estudantes e mentores.'],
  ['/admin/mentores', 'Mentores', 'Aprovar perfis e acompanhar serviços.'],
  ['/admin/reservas', 'Reservas', 'Acompanhar sessões agendadas.'],
];

const formFields = {
  scholarship: [['admin-scholarship-title', 'Título da oportunidade', 'text', true], ['admin-scholarship-provider', 'Entidade', 'text', true], ['admin-scholarship-deadline', 'Prazo', 'date', false]],
  user: [['admin-user-name', 'Nome', 'text', true], ['admin-user-email', 'Endereço de email', 'email', true]],
  mentor: [['admin-mentor-name', 'Nome profissional', 'text', true], ['admin-mentor-email', 'Endereço de email', 'email', true], ['admin-mentor-specialty', 'Especialidade', 'text', false]],
  booking: [['admin-booking-service', 'Serviço', 'text', true], ['admin-booking-date', 'Data', 'date', false], ['admin-booking-time', 'Horário', 'time', false]],
};

function AdminForm({ type, onClose }) {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('');

  const setValue = (id) => (event) => {
    setValues((prev) => ({ ...prev, [id]: event.target.value }));
    setErrors((prev) => (prev[id] ? { ...prev, [id]: undefined } : prev));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = {};
    formFields[type].forEach(([id, , , required]) => {
      if (required && !(values[id] || '').trim()) nextErrors[id] = 'Campo obrigatório.';
    });
    if (type === 'scholarship') {
      const deadline = (values['admin-scholarship-deadline'] || '').trim();
      if (deadline) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const parsed = new Date(`${deadline}T00:00:00`);
        if (Number.isNaN(parsed.getTime())) nextErrors['admin-scholarship-deadline'] = 'Introduza uma data válida.';
        else if (parsed < today) nextErrors['admin-scholarship-deadline'] = 'O prazo não pode estar no passado.';
      }
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      document.getElementById(Object.keys(nextErrors)[0])?.focus();
      return;
    }
    setStatus('Demonstração: nenhum registo é criado. A gravação aguarda a ligação à base de dados.');
  };

  return (
    <SectionCard
      title="Novo registo"
      description="O formulário mostra os campos previstos. A gravação fica ativa quando a gestão estiver ligada."
      className="admin-form"
      action={<button type="button" className="button button--text" onClick={onClose}>Fechar <Close size={16} /></button>}
    >
      <form className="profile-form" onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          {formFields[type].map(([id, label, inputType, required]) => (
            <Field
              key={id}
              id={id}
              label={label}
              type={inputType}
              required={required}
              placeholder={inputType === 'date' || inputType === 'time' ? undefined : label}
              value={values[id] || ''}
              onChange={setValue(id)}
              error={errors[id]}
            />
          ))}
          {type === 'scholarship' && (
            <TextAreaField className="form-field--full" id="admin-scholarship-description" label="Descrição" placeholder="Descrição da oportunidade" rows="3" value={values['admin-scholarship-description'] || ''} onChange={setValue('admin-scholarship-description')} />
          )}
        </div>
        <div className="form-actions">
          <button className="button button--primary" type="submit">Guardar</button>
          {status && <span className="form-feedback" role="status">{status}</span>}
        </div>
      </form>
    </SectionCard>
  );
}

function AdminHome() {
  return (
    <>
      <div className="console-strip console-strip--four" role="group" aria-label="Resumo dos conteúdos">
        {['Bolsas', 'Utilizadores', 'Mentores', 'Reservas'].map((label) => (
          <div className="console-stat" key={label}>
            <span className="console-stat__label">{label}</span>
            <span className="console-stat__value console-stat__value--empty">0</span>
          </div>
        ))}
      </div>
      <section className="console-panel" aria-labelledby="admin-areas-title">
        <div className="console-panel__head">
          <h2 id="admin-areas-title">Áreas de gestão</h2>
        </div>
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

export default function AdminPage({ routeKey }) {
  const config = adminViews[routeKey] || adminViews['admin-home'];
  const { role } = useSession();
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState('');

  const records = config.collection ? emptyData[config.collection] || [] : [];
  const term = search.trim().toLowerCase();
  const filtered = term
    ? records.filter((record) => Object.values(record).some((value) => String(value).toLowerCase().includes(term)))
    : records;

  return (
    <PortalLayout type="admin">
      <PageHeading
        title={config.title}
        description={config.description}
        action={config.action && (
          <button className="button button--primary" type="button" aria-expanded={formOpen} onClick={() => setFormOpen(!formOpen)}>
            {formOpen ? <>Fechar formulário <Close size={16} /></> : <>{config.action} <Plus size={16} /></>}
          </button>
        )}
      />
      {role !== 'admin' && (
        <div className="context-note">
          <span>Está a ver a administração sem sessão iniciada. Nenhum registo pode ser criado, alterado ou apagado.</span>
          <Link className="text-link" to="/entrar">Iniciar sessão</Link>
        </div>
      )}
      {config.type === 'summary' && <AdminHome />}
      {config.type !== 'summary' && (
        <>
          {formOpen && <AdminForm type={config.type} onClose={() => setFormOpen(false)} />}
          <div className="admin-console__bar">
            <SearchField
              id="admin-search"
              label="Pesquisar nesta área"
              placeholder="Nome, email ou estado"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <span className="admin-console__chip" role="status" aria-live="polite">
              {filtered.length === 0 ? 'Sem registos' : `${filtered.length} registo${filtered.length === 1 ? '' : 's'}`}
            </span>
          </div>
          <DataTable
            caption={`${config.title} — tabela`}
            columns={config.columns}
            rows={filtered}
            emptyTitle={term ? 'Nenhum registo corresponde à pesquisa' : 'Ainda não há registos'}
            emptyDescription={term
              ? 'Experimente outro termo ou limpe a pesquisa.'
              : 'Os registos aparecem aqui quando a base de dados estiver ligada.'}
          />
          <Notice>Apenas a administração publica bolsas. Esta interface não cria, altera ou apaga registos nesta versão.</Notice>
        </>
      )}
    </PortalLayout>
  );
}
