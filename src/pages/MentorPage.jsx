import React, { useState } from 'react';
import { Link } from '../router.jsx';
import PortalLayout from '../components/PortalLayout.jsx';
import { DemoNote, EmptyState, Field, PageHeading, SectionCard, TextAreaField } from '../components/ui.jsx';
import { ArrowUpRight } from '../components/icons.jsx';
import { useSession } from '../session.jsx';

const mentorViews = {
  'mentor-home': { title: 'Resumo', description: 'Uma visão geral do seu espaço profissional.' },
  'mentor-profile': { title: 'Perfil profissional', description: 'Apresente a sua experiência e especialidades.' },
  'mentor-services': { title: 'Serviços', description: 'Os serviços e preços que oferece aos estudantes.' },
  'mentor-calendar': { title: 'Calendário', description: 'A sua disponibilidade para sessões.' },
  'mentor-bookings': { title: 'Reservas', description: 'As sessões agendadas com estudantes.' },
  'mentor-earnings': { title: 'Rendimentos', description: 'O acompanhamento dos seus rendimentos.' },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function MentorHome() {
  return (
    <>
      <div className="console-strip" role="group" aria-label="Resumo do espaço profissional">
        <div className="console-stat">
          <span className="console-stat__label">Serviços ativos</span>
          <span className="console-stat__value console-stat__value--empty">Sem dados</span>
        </div>
        <div className="console-stat">
          <span className="console-stat__label">Próxima reserva</span>
          <span className="console-stat__value console-stat__value--empty">Sem dados</span>
        </div>
        <div className="console-stat">
          <span className="console-stat__label">Rendimentos</span>
          <span className="console-stat__value console-stat__value--empty">Sem dados</span>
        </div>
      </div>
      <div className="console-split">
        <section className="console-panel" aria-labelledby="mentor-services-title">
          <div className="console-panel__head">
            <h2 id="mentor-services-title">Serviços</h2>
            <Link to="/mentor/servicos">Gerir serviços <ArrowUpRight size={14} /></Link>
          </div>
          <div className="console-panel__body">
            <EmptyState compact title="Ainda não há serviços" description="Os serviços e preços aparecem aqui depois de configurados." />
          </div>
        </section>
        <section className="console-panel" aria-labelledby="mentor-agenda-title">
          <div className="console-panel__head">
            <h2 id="mentor-agenda-title">Agenda</h2>
            <Link to="/mentor/calendario">Abrir calendário <ArrowUpRight size={14} /></Link>
          </div>
          <div className="console-panel__body">
            <EmptyState compact title="Ainda não há horários" description="A disponibilidade aparece aqui depois de ligada ao calendário." />
          </div>
        </section>
      </div>
      <div className="portal-help">
        <span>Novo na plataforma?</span>
        <Link to="/mentor/perfil">Completar perfil profissional <ArrowUpRight size={15} /></Link>
      </div>
    </>
  );
}

function MentorProfile() {
  const [values, setValues] = useState({ name: '', email: '', specialty: '', bio: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('');

  const setValue = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!values.name.trim()) nextErrors.name = 'Indique o nome profissional.';
    if (!values.email.trim()) nextErrors.email = 'Indique o endereço de email.';
    else if (!EMAIL_RE.test(values.email.trim())) nextErrors.email = 'Introduza um endereço de email válido.';
    if (!values.specialty.trim()) nextErrors.specialty = 'Indique a sua especialidade.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      const first = Object.keys(nextErrors)[0];
      document.getElementById(`mentor-${first}`)?.focus();
      return;
    }
    setStatus('Demonstração: os dados não são guardados nesta versão.');
  };

  return (
    <SectionCard title="Informação profissional" description="Preencha apenas para ver a estrutura do perfil. Esta versão não guarda nada.">
      <form className="profile-form" onSubmit={handleSubmit} noValidate>
        <DemoNote>O perfil profissional ainda não está ligado. As alterações não são guardadas.</DemoNote>
        <fieldset className="form-group">
          <legend>Identificação</legend>
          <div className="form-grid">
            <Field id="mentor-name" label="Nome profissional" required placeholder="Nome" autoComplete="name" value={values.name} onChange={setValue('name')} error={errors.name} />
            <Field id="mentor-email" label="Endereço de email" type="email" required placeholder="nome@exemplo.pt" autoComplete="email" value={values.email} onChange={setValue('email')} error={errors.email} />
          </div>
        </fieldset>
        <fieldset className="form-group">
          <legend>Apresentação</legend>
          <div className="form-grid">
            <Field className="form-field--full" id="mentor-specialty" label="Especialidade" required placeholder="Ex.: preparação para candidaturas" autoComplete="off" value={values.specialty} onChange={setValue('specialty')} error={errors.specialty} />
            <TextAreaField className="form-field--full" id="mentor-bio" label="Apresentação" placeholder="Descreva a sua experiência" rows="4" value={values.bio} onChange={setValue('bio')} />
          </div>
        </fieldset>
        <div className="form-actions">
          <button className="button button--primary" type="submit">Guardar perfil</button>
          {status && <span className="form-feedback" role="status">{status}</span>}
        </div>
      </form>
    </SectionCard>
  );
}

function MentorEmpty({ routeKey }) {
  const configs = {
    'mentor-services': ['Ainda não há serviços', 'Os serviços e preços aparecem aqui depois de configurados.'],
    'mentor-calendar': ['Ainda não há horários disponíveis', 'A disponibilidade aparece aqui depois de ligada ao calendário.'],
    'mentor-bookings': ['Ainda não há reservas', 'As reservas dos estudantes aparecem aqui.'],
    'mentor-earnings': ['Ainda não há dados de rendimentos', 'Os rendimentos aparecem aqui quando existirem sessões concluídas.'],
  };
  const [title, description] = configs[routeKey] || ['Ainda sem dados para apresentar', 'Esta área é preenchida quando existirem dados.'];
  return <SectionCard><EmptyState title={title} description={description} /></SectionCard>;
}

export default function MentorPage({ routeKey }) {
  const view = mentorViews[routeKey] || mentorViews['mentor-home'];
  const { role } = useSession();
  let content;
  if (routeKey === 'mentor-home') content = <MentorHome />;
  else if (routeKey === 'mentor-profile') content = <MentorProfile />;
  else content = <MentorEmpty routeKey={routeKey} />;

  return (
    <PortalLayout type="mentor">
      <PageHeading title={view.title} description={view.description} />
      {role !== 'mentor' && (
        <div className="context-note">
          <span>Está a ver esta área sem sessão iniciada. Nenhum dado foi carregado.</span>
          <Link className="text-link" to="/entrar/mentor">Entrar como mentor</Link>
        </div>
      )}
      {content}
    </PortalLayout>
  );
}
