import React, { useState } from 'react';
import { Link } from '../router.jsx';
import Header from './Header.jsx';
import { Close, Info } from './icons.jsx';

const DEMO_DISMISSED_KEY = 'bolsaria:demo-notice-dismissed';

function DemoNotice() {
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(DEMO_DISMISSED_KEY) === '1'; } catch { return false; }
  });

  if (dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem(DEMO_DISMISSED_KEY, '1'); } catch { /* armazenamento indisponível */ }
  };

  return (
    <div className="demo-notice" role="status">
      <div className="demo-notice__inner">
        <span className="demo-notice__icon" aria-hidden="true"><Info size={16} /></span>
        <p>Demonstração sem dados ligados: as listas e pesquisas mostram como ficarão quando a ligação estiver concluída.</p>
        <button type="button" className="demo-notice__close" aria-label="Fechar aviso" onClick={dismiss}><Close size={16} /></button>
      </div>
    </div>
  );
}

export default function AppShell({ children }) {
  return (
    <>
      <a className="skip-link" href="#main-content">Saltar para o conteúdo</a>
      <Header />
      <DemoNotice />
      <main id="main-content" className="site-main">{children}</main>
      <footer className="site-footer">
        <div className="site-footer__inner">
          <div className="site-footer__brand">
            <span className="site-footer__name">Bolsaria</span>
            <span className="site-footer__tagline">Bolsas de estudo e mentorias, organizadas num só lugar.</span>
          </div>
          <nav className="site-footer__nav" aria-label="Ligações do rodapé">
            <Link to="/bolsas">Bolsas</Link>
            <Link to="/mentores">Mentores</Link>
            <Link to="/entrar">Entrar</Link>
          </nav>
          <span className="site-footer__copy">© {new Date().getFullYear()} Bolsaria</span>
        </div>
      </footer>
    </>
  );
}
