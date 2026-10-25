import React, { createContext, useContext, useMemo, useState } from 'react';

// Sessão simulada por papel, guardada em sessionStorage (sobrevive a recargas, termina ao fechar o separador).
// Não autentica utilizadores reais. A entrada da administração exige o código de src/config/admin.js.
export const roles = {
  student: { key: 'student', label: 'Estudante', area: '/estudante' },
  mentor: { key: 'mentor', label: 'Mentor', area: '/mentor' },
  admin: { key: 'admin', label: 'Administração', area: '/admin' },
};

const SESSION_KEY = 'bolsaria:role';
const SessionContext = createContext(null);

function readRole() {
  try {
    const stored = window.sessionStorage.getItem(SESSION_KEY);
    return roles[stored] ? stored : null;
  } catch { return null; }
}

function writeRole(role) {
  try {
    if (role) window.sessionStorage.setItem(SESSION_KEY, role);
    else window.sessionStorage.removeItem(SESSION_KEY);
  } catch { /* armazenamento indisponível */ }
}

export function SessionProvider({ children }) {
  const [role, setRole] = useState(readRole);

  const value = useMemo(() => ({
    role,
    isRole: (expected) => role === expected,
    signIn: (nextRole) => {
      const next = roles[nextRole] ? nextRole : null;
      writeRole(next);
      setRole(next);
    },
    signOut: () => { writeRole(null); setRole(null); },
  }), [role]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession deve ser utilizado dentro de SessionProvider.');
  return context;
}
