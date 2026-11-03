import React, { useState } from 'react';
import { Link, useRouter } from '../router.jsx';
import { Field, Notice } from '../components/ui.jsx';
import { ArrowLeft, ArrowRight } from '../components/icons.jsx';
import { useSession } from '../session.jsx';

export default function AdminLoginPage() {
  const { signIn, signOut } = useSession();
  const { navigate } = useRouter();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const setValue = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!values.email.trim()) next.email = 'Indique o endereço de email.';
    if (!values.password) next.password = 'Introduza a palavra-passe.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      const { user } = await signIn(values.email.trim(), values.password);
      if (user.role !== 'admin') {
        await signOut();
        setFormError('Esta conta não tem acesso à administração.');
        return;
      }
      navigate('/admin', { replace: true });
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
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
        {formError && <Notice tone="error">{formError}</Notice>}
        <form className="stack-form" onSubmit={handleSubmit} noValidate>
          <Field
            id="admin-email"
            label="Endereço de email"
            type="email"
            required
            autoComplete="username"
            value={values.email}
            error={errors.email}
            onChange={setValue('email')}
          />
          <Field
            id="admin-password"
            label="Palavra-passe"
            type="password"
            required
            autoComplete="current-password"
            value={values.password}
            error={errors.password}
            onChange={setValue('password')}
          />
          <button className="button button--primary button--wide" type="submit" disabled={submitting}>
            {submitting ? 'Aguarde…' : <>Entrar <ArrowRight size={16} /></>}
          </button>
        </form>
        <Link className="auth-card__back" to="/"><ArrowLeft size={15} /> Voltar ao site público</Link>
      </div>
    </div>
  );
}
