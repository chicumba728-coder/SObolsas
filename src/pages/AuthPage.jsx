import React, { useState } from 'react';
import { Link, useRouter } from '../router.jsx';
import { Field, Notice } from '../components/ui.jsx';
import { Alert, ArrowLeft, ArrowRight, Eye, EyeOff } from '../components/icons.jsx';
import { useSession, homeFor } from '../session.jsx';
import { api } from '../data/api.js';

const modes = {
  'login-student': {
    area: 'student', title: 'Entrar como estudante',
    description: 'Aceda à área onde acompanha candidaturas, bolsas guardadas e mentorias.',
    button: 'Entrar como estudante', fields: ['email', 'password'],
  },
  'login-mentor': {
    area: 'mentor', title: 'Entrar como mentor',
    description: 'Aceda à área onde gere o perfil profissional, serviços e reservas.',
    button: 'Entrar como mentor', fields: ['email', 'password'],
  },
  'register-student': {
    area: 'student', title: 'Criar conta de estudante',
    description: 'Crie a conta para procurar bolsas, guardar oportunidades e acompanhar candidaturas.',
    button: 'Criar conta de estudante', fields: ['name', 'email', 'password'],
  },
  'register-mentor': {
    area: 'mentor', title: 'Criar conta de mentor',
    description: 'Crie a conta para apresentar serviços de mentoria e gerir reservas.',
    button: 'Criar conta de mentor', fields: ['name', 'email', 'password'],
  },
  recovery: {
    area: null, title: 'Recuperar palavra-passe',
    description: 'Indique o email associado à conta para receber as instruções de recuperação.',
    button: 'Pedir recuperação', fields: ['email'],
  },
  reset: {
    area: null, title: 'Definir nova palavra-passe',
    description: 'Escolha uma nova palavra-passe para a sua conta.',
    button: 'Guardar palavra-passe', fields: ['password', 'confirm'],
  },
};

const fieldConfig = {
  name: { label: 'Nome', type: 'text', placeholder: 'O seu nome', autoComplete: 'name' },
  email: { label: 'Endereço de email', type: 'email', placeholder: 'nome@exemplo.pt', autoComplete: 'email' },
  password: { label: 'Palavra-passe', type: 'password', placeholder: 'Introduza a sua palavra-passe' },
  confirm: { label: 'Confirmar palavra-passe', type: 'password', placeholder: 'Repita a palavra-passe' },
};

// Só aceita regressos para caminhos internos (evita redirecionamentos para outros sites).
const safeReturn = (value) => (value && value.startsWith('/') && !value.startsWith('//') ? value : null);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isRegister = (mode) => mode.startsWith('register');
const isLogin = (mode) => mode.startsWith('login');

function validate(fields, values) {
  const errors = {};
  if (fields.includes('name') && !values.name.trim()) errors.name = 'Indique o seu nome.';
  if (fields.includes('email')) {
    if (!values.email.trim()) errors.email = 'Indique o endereço de email.';
    else if (!EMAIL_RE.test(values.email.trim())) errors.email = 'Introduza um endereço de email válido, como nome@exemplo.pt.';
  }
  if (fields.includes('password')) {
    if (!values.password) errors.password = 'Introduza a palavra-passe.';
    else if (values.password.length < 8) errors.password = 'Use pelo menos 8 caracteres.';
  }
  if (fields.includes('confirm') && values.confirm !== values.password) errors.confirm = 'As palavras-passe não coincidem.';
  return errors;
}

export default function AuthPage({ mode }) {
  const config = modes[mode];
  const { navigate, search } = useRouter();
  const { signIn, register } = useSession();
  const [values, setValues] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const params = new URLSearchParams(search);
  const returnTo = safeReturn(params.get('voltar'));
  const resetToken = params.get('token') || '';

  if (!config) return null;

  const setValue = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const showErrors = (nextErrors) => {
    setErrors(nextErrors);
    const firstError = config.fields.find((field) => nextErrors[field]);
    if (firstError) document.getElementById(`auth-${mode}-${firstError}`)?.focus();
    return Boolean(firstError);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    if (showErrors(validate(config.fields, values))) return;
    setStatus('');
    setFormError('');
    setSubmitting(true);
    const email = values.email.trim();
    try {
      if (isLogin(mode)) {
        const { user } = await signIn(email, values.password);
        navigate(returnTo || homeFor(user), { replace: true });
      } else if (isRegister(mode)) {
        const { user } = await register({ name: values.name.trim(), email, password: values.password, role: config.area });
        navigate(returnTo || homeFor(user), { replace: true });
      } else if (mode === 'recovery') {
        await api('POST', '/auth/recovery', { email });
        setStatus('Se existir uma conta com este email, enviámos as instruções para definir uma nova palavra-passe. A ligação é válida durante 1 hora.');
      } else if (mode === 'reset') {
        await api('POST', '/auth/reset', { token: resetToken, password: values.password });
        setValues((prev) => ({ ...prev, password: '', confirm: '' }));
        setStatus('Palavra-passe atualizada. Já pode iniciar sessão com a nova palavra-passe.');
      }
    } catch (error) {
      const fieldErrors = Object.fromEntries(Object.entries(error.fields || {}).filter(([field]) => config.fields.includes(field)));
      if (!showErrors(fieldErrors)) setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <span className="auth-card__brand">
          <span className="brand-monogram" aria-hidden="true">B</span>
          <span>Bolsaria</span>
        </span>
        <h1>{config.title}</h1>
        <p className="auth-card__intro">{config.description}</p>
        {mode === 'reset' && !resetToken && (
          <Notice tone="error">A ligação não é válida. Peça uma nova em <Link to="/recuperar-palavra-passe">recuperar palavra-passe</Link>.</Notice>
        )}
        {mode === 'register-mentor' && (
          <Notice>O perfil de mentor só fica público depois de aprovado pela administração.</Notice>
        )}
        {formError && <Notice tone="error">{formError}</Notice>}
        <form className="stack-form" onSubmit={handleSubmit} noValidate>
          {config.fields.map((field) => {
            const cfg = fieldConfig[field];
            const id = `auth-${mode}-${field}`;
            const common = {
              id,
              label: cfg.label,
              error: errors[field],
              required: true,
              placeholder: cfg.placeholder,
              value: values[field],
              onChange: setValue(field),
            };
            if (field === 'password' || field === 'confirm') {
              return (
                <div className="form-field" key={field}>
                  <label htmlFor={id}>{cfg.label}<span className="form-field__required" aria-hidden="true">*</span></label>
                  <div className="password-field">
                    <input
                      id={id}
                      name={id}
                      type={showPassword ? 'text' : 'password'}
                      required
                      aria-required="true"
                      autoComplete={isLogin(mode) ? 'current-password' : 'new-password'}
                      placeholder={cfg.placeholder}
                      value={values[field]}
                      onChange={setValue(field)}
                      aria-invalid={errors[field] ? 'true' : undefined}
                      aria-describedby={errors[field] ? `${id}-error` : undefined}
                    />
                    {field === 'password' && <button
                      type="button"
                      className="password-field__toggle"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>}
                  </div>
                  {field === 'password' && !isLogin(mode) && !errors.password && (
                    <p className="form-field__hint">Use pelo menos 8 caracteres.</p>
                  )}
                  {errors[field] && <p className="form-field__error" id={`${id}-error`}><Alert size={14} />{errors[field]}</p>}
                </div>
              );
            }
            return <Field key={field} {...common} type={cfg.type} autoComplete={cfg.autoComplete} />;
          })}
          <button className="button button--primary button--wide" type="submit" disabled={submitting || (mode === 'reset' && !resetToken)}>
            {submitting ? 'Aguarde…' : <>{config.button} <ArrowRight size={16} /></>}
          </button>
          {status && <p className="form-feedback" role="status">{status}</p>}
        </form>
        <div className="auth-card__links">
          {isLogin(mode) && (
            <>
              <Link to="/recuperar-palavra-passe">Esqueceu-se da palavra-passe?</Link>
              <span>Ainda não tem conta? <Link to={config.area === 'student' ? '/registar/estudante' : '/registar/mentor'}>Criar conta de {config.area === 'student' ? 'estudante' : 'mentor'}</Link></span>
            </>
          )}
          {isRegister(mode) && (
            <>
              <span>Já tem conta? <Link to={config.area === 'student' ? '/entrar/estudante' : '/entrar/mentor'}>Entrar como {config.area === 'student' ? 'estudante' : 'mentor'}</Link></span>
              <span>
                {config.area === 'student'
                  ? <>Quer dar mentorias? <Link to="/registar/mentor">Criar conta de mentor</Link></>
                  : <>Procura bolsas? <Link to="/registar/estudante">Criar conta de estudante</Link></>}
              </span>
            </>
          )}
          {(mode === 'recovery' || mode === 'reset') && <Link to="/entrar">Voltar a iniciar sessão</Link>}
        </div>
        <Link className="auth-card__back" to="/"><ArrowLeft size={15} /> Voltar à página inicial</Link>
      </div>
    </div>
  );
}
