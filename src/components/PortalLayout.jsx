import React, { useEffect, useRef } from 'react';
import { Link, useRouter } from '../router.jsx';

const portals = {
  student: {
    label: 'Área do estudante',
    root: '/estudante',
    links: [
      ['/estudante/perfil', 'Perfil'],
      ['/estudante/bolsas-guardadas', 'Bolsas guardadas'],
      ['/estudante/candidaturas', 'Candidaturas'],
      ['/estudante/documentos', 'Documentos'],
      ['/estudante/mentorias', 'Mentorias'],
      ['/estudante/candidatura-mentor', 'Candidatura a mentor'],
    ],
  },
  mentor: {
    label: 'Área do mentor',
    root: '/mentor',
    links: [
      ['/mentor/perfil', 'Perfil profissional'],
      ['/mentor/servicos', 'Serviços'],
      ['/mentor/calendario', 'Calendário'],
      ['/mentor/reservas', 'Reservas'],
      ['/mentor/rendimentos', 'Rendimentos'],
    ],
  },
  admin: {
    label: 'Administração',
    root: '/admin',
    links: [
      ['/admin/bolsas', 'Bolsas'],
      ['/admin/utilizadores', 'Utilizadores'],
      ['/admin/mentores', 'Mentores'],
      ['/admin/reservas', 'Reservas'],
    ],
  },
};

export default function PortalLayout({ type, children }) {
  const portal = portals[type];
  const { pathname } = useRouter();
  const navRef = useRef(null);
  const activeRef = useRef(null);

  useEffect(() => {
    if (!activeRef.current || !navRef.current) return;
    if (navRef.current.scrollWidth <= navRef.current.clientWidth) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    activeRef.current.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [pathname]);

  return (
    <div className="portal-layout">
      <aside className="portal-sidebar" aria-label={`Navegação: ${portal.label}`}>
        <p className="portal-sidebar__title">{portal.label}</p>
        <nav className="portal-nav" ref={navRef}>
          <Link
            to={portal.root}
            ref={pathname === portal.root ? activeRef : undefined}
            aria-current={pathname === portal.root ? 'page' : undefined}
            className={`portal-nav__link${pathname === portal.root ? ' is-current' : ''}`}
          >
            Resumo
          </Link>
          {portal.links.map(([to, label]) => (
            <Link
              key={to}
              to={to}
              ref={pathname === to ? activeRef : undefined}
              aria-current={pathname === to ? 'page' : undefined}
              className={`portal-nav__link${pathname === to ? ' is-current' : ''}`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="portal-content">{children}</div>
    </div>
  );
}
