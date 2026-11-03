import React from 'react';
import { Link } from '../router.jsx';
import Header from './Header.jsx';

export default function AppShell({ children }) {
  return (
    <>
      <a className="skip-link" href="#main-content">Saltar para o conteúdo</a>
      <Header />
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
