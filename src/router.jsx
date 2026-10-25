import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

export const routes = [
  { path: '/', title: 'Início', key: 'home' },
  { path: '/bolsas', title: 'Bolsas de estudo', key: 'scholarships' },
  { path: '/bolsas/:id', title: 'Detalhe da bolsa', key: 'scholarship-detail' },
  { path: '/mentores', title: 'Mentores', key: 'mentors' },
  { path: '/mentores/:id', title: 'Perfil de mentor', key: 'mentor-detail' },
  { path: '/entrar', title: 'Iniciar sessão', key: 'login' },
  { path: '/entrar/estudante', title: 'Entrar como estudante', key: 'login-student' },
  { path: '/entrar/mentor', title: 'Entrar como mentor', key: 'login-mentor' },
  { path: '/registar/estudante', title: 'Criar conta de estudante', key: 'register-student' },
  { path: '/registar/mentor', title: 'Criar conta de mentor', key: 'register-mentor' },
  { path: '/recuperar-palavra-passe', title: 'Recuperar palavra-passe', key: 'recovery' },
  { path: '/estudante', title: 'Área do estudante', key: 'student-home' },
  { path: '/estudante/perfil', title: 'Perfil do estudante', key: 'student-profile' },
  { path: '/estudante/bolsas-guardadas', title: 'Bolsas guardadas', key: 'student-saved' },
  { path: '/estudante/candidaturas', title: 'Candidaturas', key: 'student-applications' },
  { path: '/estudante/documentos', title: 'Documentos', key: 'student-documents' },
  { path: '/estudante/mentorias', title: 'Mentorias', key: 'student-mentorships' },
  { path: '/estudante/candidatura-mentor', title: 'Candidatura a mentor', key: 'student-mentor-application' },
  { path: '/mentor', title: 'Área do mentor', key: 'mentor-home' },
  { path: '/mentor/perfil', title: 'Perfil profissional', key: 'mentor-profile' },
  { path: '/mentor/servicos', title: 'Serviços', key: 'mentor-services' },
  { path: '/mentor/calendario', title: 'Calendário', key: 'mentor-calendar' },
  { path: '/mentor/reservas', title: 'Reservas', key: 'mentor-bookings' },
  { path: '/mentor/rendimentos', title: 'Rendimentos', key: 'mentor-earnings' },
  { path: '/agendar', title: 'Agendamento', key: 'booking' },
  { path: '/checkout', title: 'Checkout', key: 'checkout' },
  { path: '/admin/entrar', title: 'Acesso à administração', key: 'admin-login' },
  { path: '/admin', title: 'Painel administrativo', key: 'admin-home' },
  { path: '/admin/bolsas', title: 'Gestão de bolsas', key: 'admin-scholarships' },
  { path: '/admin/utilizadores', title: 'Gestão de utilizadores', key: 'admin-users' },
  { path: '/admin/mentores', title: 'Gestão de mentores', key: 'admin-mentors' },
  { path: '/admin/reservas', title: 'Gestão de reservas', key: 'admin-bookings' },
];

const RouterContext = createContext(null);

// Tudo o que está em /admin é uma área isolada: layout próprio e acesso protegido (exceto /admin/entrar).
export const isAdminPath = (pathname) => pathname === '/admin' || pathname.startsWith('/admin/');

export function matchRoute(pathname) {
  const pathSegments = pathname.split('/').filter(Boolean);
  for (const route of routes) {
    const routeSegments = route.path.split('/').filter(Boolean);
    if (routeSegments.length !== pathSegments.length) continue;
    const params = {};
    const matches = routeSegments.every((segment, index) => {
      if (segment.startsWith(':')) {
        params[segment.slice(1)] = decodeURIComponent(pathSegments[index]);
        return true;
      }
      return segment === pathSegments[index];
    });
    if (matches) return { route, params };
  }
  return { route: null, params: {} };
}

export function RouterProvider({ children }) {
  const [location, setLocation] = useState(() => ({
    pathname: window.location.pathname,
    search: window.location.search,
  }));

  useEffect(() => {
    const syncLocation = () => setLocation({
      pathname: window.location.pathname,
      search: window.location.search,
    });
    window.addEventListener('popstate', syncLocation);
    return () => window.removeEventListener('popstate', syncLocation);
  }, []);

  const navigate = (to, options = {}) => {
    const url = new URL(to, window.location.origin);
    if (options.replace) window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    else window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
    setLocation({ pathname: url.pathname, search: url.search });
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const main = document.getElementById('main-content');
    if (!main) return;
    if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
    main.focus({ preventScroll: true });
  }, [location.pathname, location.search]);

  const value = useMemo(() => ({ ...location, ...matchRoute(location.pathname), navigate }), [location]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) throw new Error('useRouter deve ser utilizado dentro de RouterProvider.');
  return context;
}

export const Link = React.forwardRef(function Link({ to, onClick, children, ...props }, ref) {
  const { navigate } = useRouter();
  return (
    <a
      ref={ref}
      href={to}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
});
