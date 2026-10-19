import React, { useState } from 'react';
import { Link } from '../router.jsx';
import PortalLayout from '../components/PortalLayout.jsx';
import { DemoNote, EmptyState, Field, PageHeading, SectionCard, TextAreaField } from '../components/ui.jsx';
import { ArrowRight, ArrowUpRight } from '../components/icons.jsx';
import { useSession } from '../session.jsx';

const studentViews = {
  'student-home': { title: 'Resumo', description: 'Acompanhe o seu percurso académico e os próximos passos.' },
  'student-profile': { title: 'Perfil', description: 'Os seus dados pessoais e académicos num só lugar.' },
  'student-saved': { title: 'Bolsas guardadas', description: 'As oportunidades que guardou para consultar mais tarde.' },
  'student-applications': { title: 'Candidaturas', description: 'O estado das suas candidaturas a bolsas e mentorias.' },
  'student-documents': { title: 'Documentos', description: 'Ficheiros associados ao seu percurso.' },
  'student-mentorships': { title: 'Mentorias', description: 'As suas sessões de mentoria agendadas.' },
  'student-mentor-application': { title: 'Candidatura a mentor', description: 'Candidate-se para passar a oferecer serviços de mentoria na plataforma.' },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ProfileForm() {
  const [values, setValues] = useState({ name: '', email: '', study: '', institution: '', about: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('');

  const setValue = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!values.name.trim()) nextErrors.name = 'Indique o seu nome.';
    if (!values.email.trim()) nextErrors.email = 'Indique o endereço de email.';
    else if (!EMAIL_RE.test(values.email.trim())) nextErrors.email = 'Introduza um endereço de email válido.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      const first = Object.keys(nextErrors)[0];
      document.getElementById(`student-${first}`)?.focus();
      return;
    }
    setStatus('Demonstração: os dados não são guardados nesta versão.');
  };

  return (
    <SectionCard title="Dados do perfil" description="Preencha apenas para ver a estrutura do formulário. Esta versão não guarda nada.">
      <form className="profile-form" onSubmit={handleSubmit} noValidate>
        <DemoNote>O perfil ainda não está ligado à conta. As alterações não são guardadas.</DemoNote>
        <fieldset className="form-group">
          <legend>Dados pessoais</legend>
          <div className="form-grid">
            <Field id="student-name" label="Nome" required placeholder="Nome" autoComplete="name" value={values.name} onChange={setValue('name')} error={errors.name} />
            <Field id="student-email" label="Endereço de email" type="email" required placeholder="nome@exemplo.pt" autoComplete="email" value={values.email} onChange={setValue('email')} error={errors.email} />
          </div>
        </fieldset>
        <fieldset className="form-group">
          <legend>Percurso académico</legend>
          <div className="form-grid">
            <Field id="student-study" label="Área de estudo" placeholder="Área de estudo" autoComplete="off" value={values.study} onChange={setValue('study')} />
            <Field id="student-institution" label="Instituição de ensino" placeholder="Instituição" autoComplete="organization" value={values.institution} onChange={setValue('institution')} />
            <TextAreaField className="form-field--full" id="student-about" label="Sobre si" placeholder="Escreva uma breve apresentação" rows="4" value={values.about} onChange={setValue('about')} />
          </div>
        </fieldset>
        <div className="form-actions">
          <button type="submit" className="button button--primary">Guardar perfil</button>
          {status && <span className="form-feedback" role="status">{status}</span>}
        </div>
      </form>
    </SectionCard>
  );
}

function StudentHome() {
  const columns = [
    ['Candidaturas', '/estudante/candidaturas', 'O estado de cada candidatura a bolsas e mentorias.', 'Ainda não acompanha nenhuma candidatura.'],
    ['Documentos', '/estudante/documentos', 'Os ficheiros associados ao seu percurso.', 'Ainda não há documentos carregados.'],
    ['Mentorias', '/estudante/mentorias', 'As sessões agendadas com mentores.', 'Ainda não há sessões agendadas.'],
  ];
  return (
    <>
      <section className="tracker-lead" aria-labelledby="student-lead-title">
        <div className="tracker-lead__copy">
          <h2 id="student-lead-title">O seu percurso num só lugar</h2>
          <p>Reúna candidaturas, documentos e mentorias. À medida que avança, o estado de cada passo aparece aqui.</p>
        </div>
        <div className="tracker-lead__action">
          <Link className="button button--primary" to="/bolsas">Encontrar bolsas <ArrowRight size={16} /></Link>
        </div>
      </section>
      <div className="tracker-columns">
        {columns.map(([title, to, description, empty]) => (
          <section className="tracker-column" key={to} aria-label={title}>
            <div className="tracker-column__head">
              <Link className="tracker-column__title" to={to}>{title}</Link>
              <span className="tracker-column__count">0</span>
            </div>
            <div className="tracker-column__body">
              <p className="tracker-column__empty">{empty} {description}</p>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

function MentorApplicationForm() {
  const [values, setValues] = useState({ name: '', email: '', specialty: '', experience: '', motivation: '' });
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
    if (values.experience.trim()) {
      const years = Number(values.experience);
      if (!Number.isInteger(years) || years < 0) nextErrors.experience = 'Indique um número de anos válido (0 ou mais).';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      const first = Object.keys(nextErrors)[0];
      document.getElementById(`apply-${first}`)?.focus();
      return;
    }
    setStatus('Demonstração: a candidatura não é enviada nem guardada. A submissão aguarda a ligação.');
  };

  return (
    <SectionCard title="Candidatar-me a mentor" description="Candidate-se para oferecer serviços de mentoria. A aprovação é feita pela administração.">
      <form className="profile-form" onSubmit={handleSubmit} noValidate>
        <DemoNote>O formulário ainda não está ligado a dados. Nada é enviado nem guardado.</DemoNote>
        <fieldset className="form-group">
          <legend>Identificação</legend>
          <div className="form-grid">
            <Field id="apply-name" label="Nome profissional" required placeholder="Como quer ser apresentado" autoComplete="name" value={values.name} onChange={setValue('name')} error={errors.name} />
            <Field id="apply-email" label="Endereço de email" type="email" required placeholder="nome@exemplo.pt" autoComplete="email" value={values.email} onChange={setValue('email')} error={errors.email} />
          </div>
        </fieldset>
        <fieldset className="form-group">
          <legend>Experiência</legend>
          <div className="form-grid">
            <Field id="apply-specialty" label="Especialidade" required placeholder="Ex.: candidaturas ao ensino superior" autoComplete="off" value={values.specialty} onChange={setValue('specialty')} error={errors.specialty} />
            <Field id="apply-experience" label="Anos de experiência" type="number" min="0" placeholder="Ex.: 5" inputMode="numeric" value={values.experience} onChange={setValue('experience')} error={errors.experience} />
            <TextAreaField className="form-field--full" id="apply-motivation" label="Motivação" placeholder="Explique porque quer ser mentor na plataforma" rows="4" value={values.motivation} onChange={setValue('motivation')} />
          </div>
        </fieldset>
        <div className="form-actions">
          <button type="submit" className="button button--primary">Submeter candidatura</button>
          {status && <span className="form-feedback" role="status">{status}</span>}
        </div>
      </form>
    </SectionCard>
  );
}

function StudentEmptyContent({ routeKey }) {
  const states = {
    'student-saved': ['Ainda não há bolsas guardadas', 'As bolsas que guardar aparecem aqui.', 'Explore bolsas e use o botão de guardar para as reunir.'],
    'student-applications': ['Ainda não há candidaturas', 'O acompanhamento aparece aqui quando existirem candidaturas.'],
    'student-documents': ['Ainda não há documentos', 'Os documentos ficam reunidos aqui depois de carregados.'],
    'student-mentorships': ['Ainda não há mentorias', 'As sessões agendadas aparecem aqui.'],
  };
  const [title, description, hint] = states[routeKey] || ['Ainda sem dados para apresentar', 'Esta área é preenchida quando existirem dados.'];
  return (
    <SectionCard>
      {routeKey === 'student-documents' && <DemoNote>O envio e armazenamento de ficheiros ainda não estão ligados. Nenhum documento é enviado.</DemoNote>}
      <EmptyState
        title={title}
        description={description}
        hints={hint ? [hint] : undefined}
        action={routeKey === 'student-saved' ? <Link className="button button--outline" to="/bolsas">Explorar bolsas</Link> : undefined}
      />
    </SectionCard>
  );
}

export default function StudentPage({ routeKey }) {
  const view = studentViews[routeKey] || studentViews['student-home'];
  const { role } = useSession();
  let content;
  if (routeKey === 'student-home') content = <StudentHome />;
  else if (routeKey === 'student-profile') content = <ProfileForm />;
  else if (routeKey === 'student-mentor-application') content = <MentorApplicationForm />;
  else content = <StudentEmptyContent routeKey={routeKey} />;

  return (
    <PortalLayout type="student">
      <PageHeading title={view.title} description={view.description} />
      {role !== 'student' && (
        <div className="context-note">
          <span>Está a ver esta área sem sessão iniciada. Nenhum dado de utilizador foi carregado.</span>
          <Link className="text-link" to="/entrar/estudante">Entrar como estudante</Link>
        </div>
      )}
      {content}
      <div className="portal-help">
        <span>Precisa de orientação para se candidatar?</span>
        <Link to="/mentores">Consultar mentores <ArrowUpRight size={15} /></Link>
      </div>
    </PortalLayout>
  );
}
