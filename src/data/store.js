import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { api } from './api.js';

// Camada de dados ligada à API.
// - useResource(path): lê um recurso (GET) com cache partilhada e estados de carregamento/erro.
// - mutate(method, path, body): altera dados e volta a carregar os recursos em uso.
// As páginas não conhecem fetch nem URLs completos: só caminhos da API (/scholarships, /me/saved, ...).

const cache = new Map(); // path -> { data, error, loading, promise }
const listeners = new Map(); // path -> Set<listener>
const IDLE = Object.freeze({ data: undefined, error: null, loading: true });

function emit(path) {
  listeners.get(path)?.forEach((listener) => listener());
}

function load(path) {
  const current = cache.get(path);
  if (current?.promise) return current.promise;
  const promise = api('GET', path)
    .then((data) => { cache.set(path, { data, error: null, loading: false }); })
    .catch((error) => { cache.set(path, { data: current?.data, error, loading: false }); })
    .finally(() => emit(path));
  cache.set(path, { ...(current || IDLE), loading: true, promise });
  emit(path);
  return promise;
}

function subscribe(path, listener) {
  if (!listeners.has(path)) listeners.set(path, new Set());
  listeners.get(path).add(listener);
  return () => {
    const set = listeners.get(path);
    set.delete(listener);
    if (!set.size) listeners.delete(path);
  };
}

// Volta a pedir todos os recursos com componentes a usá-los e descarta os restantes.
export function invalidateAll() {
  for (const path of [...cache.keys()]) {
    if (listeners.has(path)) {
      const entry = cache.get(path);
      cache.set(path, { ...entry, promise: null });
      load(path);
    } else {
      cache.delete(path);
    }
  }
}

export function useResource(path, { enabled = true } = {}) {
  const key = enabled && path ? path : null;
  const snapshot = useSyncExternalStore(
    useCallback((listener) => (key ? subscribe(key, listener) : () => {}), [key]),
    () => (key ? cache.get(key) || IDLE : IDLE),
  );

  useEffect(() => {
    if (key && !cache.get(key)?.promise && cache.get(key)?.data === undefined && !cache.get(key)?.error) load(key);
  }, [key]);

  const reload = useCallback(() => {
    if (!key) return Promise.resolve();
    const entry = cache.get(key);
    if (entry) cache.set(key, { ...entry, promise: null });
    return load(key);
  }, [key]);

  if (!key) return { data: undefined, error: null, loading: false, reload };
  return { data: snapshot.data, error: snapshot.error, loading: snapshot.loading && snapshot.data === undefined, reload };
}

// Lista: devolve sempre um array (vazio enquanto carrega).
export function useList(path, options) {
  const result = useResource(path, options);
  return { ...result, items: Array.isArray(result.data) ? result.data : [] };
}

export async function mutate(method, path, body) {
  const result = await api(method, path, body);
  invalidateAll();
  return result;
}
