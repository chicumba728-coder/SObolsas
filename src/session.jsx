import React, { createContext, useContext, useMemo, useState } from 'react';

// Sessão simulada, apenas em memória e apenas para navegação entre áreas.
// Não autentica, não valida credenciais, não grava e não sobrevive a recargas.
export const roles = {
  student: { key: 'student', label: 'Estudante', area: '/estudante' },
  mentor: { key: 'mentor', label: 'Mentor', area: '/mentor' },
  admin: { key: 'admin', label: 'Administração', area: '/admin' },
};

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [role, setRole] = useState(null);

  const value = useMemo(() => ({
    role,
    isRole: (expected) => role === expected,
    signIn: (nextRole) => setRole(roles[nextRole] ? nextRole : null),
    signOut: () => setRole(null),
  }), [role]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession deve ser utilizado dentro de SessionProvider.');
  return context;
}
