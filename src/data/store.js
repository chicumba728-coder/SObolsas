import { useSyncExternalStore } from 'react';
import { emptyData } from './emptyData.js';

// Camada de dados local do MVP.
// Guarda as coleções no localStorage do navegador (sem backend). Começa SEMPRE vazia:
// não existem dados de exemplo. É o único ponto a substituir quando houver API/base de dados;
// as páginas usam apenas useCollection / addRecord / updateRecord / removeRecord.
const STORAGE_KEY = 'bolsaria:data:v1';
const listeners = new Set();
let cache = null;

function emptyState() {
  const base = {};
  Object.keys(emptyData).forEach((key) => { base[key] = []; });
  return base;
}

function load() {
  const state = emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      Object.keys(state).forEach((key) => {
        if (Array.isArray(parsed?.[key])) state[key] = parsed[key];
      });
    }
  } catch { /* armazenamento indisponível ou corrompido: arranca vazio */ }
  return state;
}

function getState() {
  if (!cache) cache = load();
  return cache;
}

function emit() {
  listeners.forEach((listener) => listener());
}

function commit(next) {
  cache = next;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* mantém só em memória */ }
  emit();
}

function subscribe(listener) {
  listeners.add(listener);
  const onStorage = (event) => {
    if (event.key === STORAGE_KEY || event.key === null) { cache = null; emit(); }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useCollection(name) {
  const state = useSyncExternalStore(subscribe, getState, getState);
  return state[name] || emptyData[name] || [];
}

export function useRecord(name, id) {
  const records = useCollection(name);
  return records.find((record) => record.id === id) || null;
}

export function addRecord(name, data) {
  const state = getState();
  const record = { ...data, id: createId(), createdAt: new Date().toISOString() };
  commit({ ...state, [name]: [record, ...(state[name] || [])] });
  return record;
}

export function updateRecord(name, id, patch) {
  const state = getState();
  commit({
    ...state,
    [name]: (state[name] || []).map((record) => (
      record.id === id ? { ...record, ...patch, updatedAt: new Date().toISOString() } : record
    )),
  });
}

export function removeRecord(name, id) {
  const state = getState();
  commit({ ...state, [name]: (state[name] || []).filter((record) => record.id !== id) });
}

export function resetAllData() {
  commit(emptyState());
}
