import React from 'react';
import { Link, useRouter } from '../router.jsx';
import { useSession } from '../session.jsx';
import { Brand } from './Header.jsx';

// Estrutura própria da administração: sem navegação pública, sem rodapé público.
export default function AdminShell({ children }) {
  const { role, signOut } = useSession();
  const { navigate } = useRouter();
  const isAdmin = role === 'admin';

  return (
    <>
      <a className="skip-link" href="#main-content">Saltar para o conteúdo</a>
      <header className="site-header admin-header">
        <div className="site-header__inner">
          <div className="admin-header__brand">
            <Brand />
            <span className="admin-header__tag">Administração</span>
          </div>
          {isAdmin && (
            <div className="admin-header__actions">
              <Link className="button button--small button--outline" to="/">Ver site público</Link>
              <button
                className="button button--small button--text"
                type="button"
                onClick={() => { signOut(); navigate('/admin/entrar', { replace: true }); }}
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </header>
      <main id="main-content" className="site-main admin-console">{children}</main>
    </>
  );
}
