import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './data/api.js';
import { invalidateAll } from './data/store.js';

// Sessão real: autenticação no servidor, com cookie httpOnly. Aqui só se guarda o estado em memória.
export const roles = {
  student: { key: 'student', label: 'Estudante', area: '/estudante' },
  mentor: { key: 'mentor', label: 'Mentor', area: '/mentor' },
  admin: { key: 'admin', label: 'Administração', area: '/admin' },
};

const SessionContext = createContext(null);

// Quem pode entrar em cada área. A área do mentor também abre a estudantes que se candidataram a mentor.
export function canAccess(area, user, mentor) {
  if (!user) return false;
  if (area === 'student') return user.role === 'student';
  if (area === 'mentor') return user.role === 'mentor' || Boolean(mentor);
  if (area === 'admin') return user.role === 'admin';
  return false;
}

export function SessionProvider({ children }) {
  const [state, setState] = useState({ user: null, mentor: null, loading: true });

  const apply = useCallback((payload) => {
    setState({ user: payload?.user || null, mentor: payload?.mentor || null, loading: false });
    invalidateAll();
  }, []);

  const refresh = useCallback(async () => {
    try {
      apply(await api('GET', '/auth/me'));
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [apply]);

  useEffect(() => { refresh(); }, [refresh]);

  const value = useMemo(() => ({
    ...state,
    role: state.user?.role || null,
    canAccess: (area) => canAccess(area, state.user, state.mentor),
    refresh,
    signIn: async (email, password) => {
      const payload = await api('POST', '/auth/login', { email, password });
      apply(payload);
      return payload;
    },
    register: async (data) => {
      const payload = await api('POST', '/auth/register', data);
      apply(payload);
      return payload;
    },
    signOut: async () => {
      try { await api('POST', '/auth/logout'); } catch { /* sessão já terminada */ }
      apply(null);
    },
  }), [state, refresh, apply]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession deve ser utilizado dentro de SessionProvider.');
  return context;
}

// Área principal de um utilizador autenticado.
export function homeFor(user) {
  if (!user) return '/entrar';
  return roles[user.role]?.area || '/';
}
