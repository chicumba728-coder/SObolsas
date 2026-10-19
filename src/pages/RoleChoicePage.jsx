import React from 'react';
import { Link } from '../router.jsx';
import { DemoNote, PageHeading } from '../components/ui.jsx';
import { ArrowRight } from '../components/icons.jsx';

const options = [
  {
    to: '/entrar/estudante',
    title: 'Procuro bolsas e mentorias',
    description: 'Guarde oportunidades, acompanhe candidaturas e consulte as suas sessões de mentoria.',
  },
  {
    to: '/entrar/mentor',
    title: 'Ofereço serviços de mentoria',
    description: 'Apresente o seu perfil profissional, defina serviços e gerencie as suas reservas.',
  },
];

export default function RoleChoicePage() {
  return (
    <div className="content-wrap content-wrap--narrow page-content role-choice">
      <PageHeading
        title="Entrar"
        description="As áreas de estudante e de mentor são separadas. Escolha por onde quer entrar."
      />
      <DemoNote>A entrada não verifica credenciais nem guarda sessão. Serve apenas para abrir a área escolhida.</DemoNote>
      <ul className="role-choice__grid">
        {options.map((option) => (
          <li key={option.to}>
            <Link to={option.to} className="role-tile">
              <h2>{option.title}</h2>
              <p>{option.description}</p>
              <span className="role-tile__cta">Entrar <ArrowRight size={16} /></span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="role-choice__foot">
        Ainda não tem conta? <Link className="text-link" to="/registar/estudante">Criar conta de estudante</Link>{' '}
        ou <Link className="text-link" to="/registar/mentor">criar conta de mentor</Link>.
      </p>
    </div>
  );
}
