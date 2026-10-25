import React, { useEffect, useId, useRef, useState } from 'react';
import { Link, useRouter } from '../router.jsx';
import { useSession, roles } from '../session.jsx';
import { ChevronDown, Close } from './icons.jsx';

function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 42 42" fill="none" aria-hidden="true" focusable="false">
      <rect width="42" height="42" rx="12" fill="currentColor" />
      <path d="M12 10.5h11c3.8 0 6 2.1 6 5.1 0 2.3-1.3 3.9-3.4 4.6 2.8.6 4.3 2.5 4.3 5.2 0 3.7-2.6 6.1-6.8 6.1H12v-21Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m16.5 25 4.2-3.6 3.3 1.8 4.3-6" stroke="#AFC2FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="28.3" cy="17.2" r="1.8" fill="#AFC2FF" />
    </svg>
  );
}

export function Brand({ onNavigate }) {
  return (
    <Link to="/" className="brand" aria-label="Bolsaria — página inicial" onClick={onNavigate}>
      <BrandMark />
      <span className="brand__name">Bolsaria</span>
    </Link>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const [areasOpen, setAreasOpen] = useState(false);
  const { pathname, navigate } = useRouter();
  const { role, signOut } = useSession();
  const headerRef = useRef(null);
  const dropdownRef = useRef(null);
  const areasTriggerRef = useRef(null);
  const menuToggleRef = useRef(null);
  const areasId = useId();
  const close = () => { setOpen(false); setAreasOpen(false); };

  useEffect(() => { close(); }, [pathname]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      if (areasOpen) {
        setAreasOpen(false);
        areasTriggerRef.current?.focus();
        return;
      }
      if (open) {
        setOpen(false);
        menuToggleRef.current?.focus();
      }
    };
    const onPointerDown = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setAreasOpen(false);
      if (open && headerRef.current && !headerRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [areasOpen, open]);

  // A administração é uma área isolada: não aparece na navegação pública.
  const areas = [roles.student, roles.mentor];
  const currentArea = role ? roles[role] : null;
  const onArea = pathname.startsWith('/estudante') || pathname.startsWith('/mentor/') || pathname === '/mentor';

  return (
    <header className="site-header" ref={headerRef}>
      <div className="site-header__inner">
        <Brand onNavigate={close} />
        <button
          ref={menuToggleRef}
          className={`menu-toggle${open ? ' is-open' : ''}`}
          type="button"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
          aria-controls="primary-navigation"
          onClick={() => setOpen(!open)}
        >
          <span /><span /><span />
        </button>
        <nav id="primary-navigation" className={`primary-nav${open ? ' is-open' : ''}`} aria-label="Navegação principal">
          <Link to="/bolsas" aria-current={pathname.startsWith('/bolsas') ? 'page' : undefined} className={pathname.startsWith('/bolsas') ? 'is-current' : ''} onClick={close}>Bolsas</Link>
          <Link to="/mentores" aria-current={pathname.startsWith('/mentores') ? 'page' : undefined} className={pathname.startsWith('/mentores') ? 'is-current' : ''} onClick={close}>Mentores</Link>
          <div className="nav-dropdown" ref={dropdownRef}>
            <button
              ref={areasTriggerRef}
              className={`nav-dropdown__trigger${onArea ? ' is-current' : ''}`}
              type="button"
              aria-expanded={areasOpen}
              aria-controls={areasOpen ? areasId : undefined}
              aria-haspopup="true"
              onClick={() => setAreasOpen(!areasOpen)}
            >
              Áreas
              <ChevronDown size={15} className={`nav-dropdown__chevron${areasOpen ? ' is-open' : ''}`} />
            </button>
            {areasOpen && (
              <div className="nav-dropdown__menu" id={areasId}>
                {areas.map((area) => (
                  <Link
                    key={area.key}
                    to={area.area}
                    aria-current={pathname.startsWith(area.area) ? 'page' : undefined}
                    onClick={close}
                  >
                    {area.key === 'admin' ? area.label : `Área do ${area.label.toLowerCase()}`}
                    {role === area.key && <span className="nav-dropdown__badge">sessão</span>}
                  </Link>
                ))}
              </div>
            )}
          </div>
          {currentArea ? (
            <div className="nav-session">
              <span className="nav-session__role">{currentArea.label}</span>
              <Link to={currentArea.area} className="button button--small button--outline" onClick={close}>Abrir área</Link>
              <button className="button button--small button--text" type="button" onClick={() => { signOut(); close(); navigate('/'); }}>
                Sair <Close size={15} />
              </button>
            </div>
          ) : (
            <Link
              to="/entrar"
              aria-current={pathname.startsWith('/entrar') || pathname.startsWith('/registar') ? 'page' : undefined}
              className={`button button--small button--primary${pathname.startsWith('/entrar') || pathname.startsWith('/registar') ? ' is-current' : ''}`}
              onClick={close}
            >
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
