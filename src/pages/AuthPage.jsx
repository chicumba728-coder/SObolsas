import React, { useState } from 'react';
import { Link, useRouter } from '../router.jsx';
import { DemoNote, Field } from '../components/ui.jsx';
import { Alert, ArrowLeft, ArrowRight, Eye, EyeOff } from '../components/icons.jsx';
import { useSession } from '../session.jsx';

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
};

const fieldConfig = {
  name: { label: 'Nome', type: 'text', placeholder: 'O seu nome', autoComplete: 'name' },
  email: { label: 'Endereço de email', type: 'email', placeholder: 'nome@exemplo.pt', autoComplete: 'email' },
  password: { label: 'Palavra-passe', type: 'password', placeholder: 'Introduza a sua palavra-passe' },
};

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
  return errors;
}

export default function AuthPage({ mode }) {
  const config = modes[mode];
  const { navigate } = useRouter();
  const { signIn } = useSession();
  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState('');

  if (!config) return null;

  const setValue = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validate(config.fields, values);
    setErrors(nextErrors);
    const firstError = config.fields.find((field) => nextErrors[field]);
    if (firstError) {
      document.getElementById(`auth-${mode}-${firstError}`)?.focus();
      return;
    }
    setStatus('');
    if (isLogin(mode)) {
      signIn(config.area);
      navigate(config.area === 'student' ? '/estudante' : '/mentor');
      return;
    }
    setStatus(isRegister(mode)
      ? 'Demonstração: a conta não é criada. Nenhum pedido é enviado; o registo aguarda a ligação.'
      : 'Demonstração: nenhum email é enviado. A recuperação aguarda a ligação.');
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
        <DemoNote>
          {isLogin(mode)
            ? 'A entrada não verifica credenciais e serve apenas para abrir a área escolhida.'
            : 'A autenticação ainda não está ligada. Os dados não são enviados nem guardados.'}
        </DemoNote>
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
            if (field === 'password') {
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
                      autoComplete={isRegister(mode) ? 'new-password' : 'current-password'}
                      placeholder={cfg.placeholder}
                      value={values.password}
                      onChange={setValue('password')}
                      aria-invalid={errors.password ? 'true' : undefined}
                      aria-describedby={errors.password ? `${id}-error` : undefined}
                    />
                    <button
                      type="button"
                      className="password-field__toggle"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {field === 'password' && isRegister(mode) && !errors.password && (
                    <p className="form-field__hint">Use pelo menos 8 caracteres.</p>
                  )}
                  {errors.password && <p className="form-field__error" id={`${id}-error`}><Alert size={14} />{errors.password}</p>}
                </div>
              );
            }
            return <Field key={field} {...common} type={cfg.type} autoComplete={cfg.autoComplete} />;
          })}
          <button className="button button--primary button--wide" type="submit">
            {config.button} <ArrowRight size={16} />
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
          {mode === 'recovery' && <Link to="/entrar">Voltar a iniciar sessão</Link>}
        </div>
        <Link className="auth-card__back" to="/"><ArrowLeft size={15} /> Voltar à página inicial</Link>
      </div>
    </div>
  );
}
