import React, { useState } from 'react';
import { Link, useRouter } from '../router.jsx';
import { DemoNote, Field } from '../components/ui.jsx';
import { ArrowLeft, ArrowRight } from '../components/icons.jsx';
import { useSession } from '../session.jsx';
import { ADMIN_ACCESS_CODE } from '../config/admin.js';

export default function AdminLoginPage() {
  const { signIn } = useSession();
  const { navigate } = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!code) { setError('Introduza o código de acesso.'); return; }
    if (code !== ADMIN_ACCESS_CODE) { setError('Código de acesso incorreto.'); return; }
    signIn('admin');
    navigate('/admin', { replace: true });
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <span className="auth-card__brand">
          <span className="brand-monogram" aria-hidden="true">B</span>
          <span>Bolsaria · Administração</span>
        </span>
        <h1>Acesso à administração</h1>
        <p className="auth-card__intro">Área reservada à equipa que gere bolsas, utilizadores, mentores e reservas.</p>
        <DemoNote>Acesso de demonstração por código. Num frontend sem servidor não há segurança real; será substituído por autenticação no backend.</DemoNote>
        <form className="stack-form" onSubmit={handleSubmit} noValidate>
          <Field
            id="admin-access-code"
            label="Código de acesso"
            type="password"
            required
            autoComplete="off"
            placeholder="Código de acesso"
            value={code}
            error={error}
            onChange={(event) => { setCode(event.target.value); setError(''); }}
          />
          <button className="button button--primary button--wide" type="submit">Entrar <ArrowRight size={16} /></button>
        </form>
        <Link className="auth-card__back" to="/"><ArrowLeft size={15} /> Voltar ao site público</Link>
      </div>
    </div>
  );
}
