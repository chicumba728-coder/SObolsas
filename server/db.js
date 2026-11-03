import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

// Base de dados SQLite (módulo nativo do Node >= 22.13). O ficheiro fica em server/data/ por omissão.
const DB_PATH = process.env.DB_PATH || resolve(import.meta.dirname, 'data', 'bolsaria.db');

export function openDatabase(path = DB_PATH) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  migrate(db);
  return db;
}

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT,
      role TEXT NOT NULL CHECK (role IN ('student', 'mentor', 'admin')),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
      study TEXT NOT NULL DEFAULT '',
      institution TEXT NOT NULL DEFAULT '',
      about TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mentors (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      specialty TEXT NOT NULL DEFAULT '',
      bio TEXT NOT NULL DEFAULT '',
      experience INTEGER,
      motivation TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended')),
      created_at TEXT NOT NULL,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS scholarships (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      provider TEXT NOT NULL,
      deadline TEXT NOT NULL DEFAULT '',
      link TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      mentor_id TEXT NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
      student_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      student_name TEXT NOT NULL,
      student_email TEXT NOT NULL COLLATE NOCASE,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      topic TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
      source TEXT NOT NULL DEFAULT 'public',
      created_at TEXT NOT NULL,
      updated_at TEXT
    );
    CREATE INDEX IF NOT EXISTS bookings_mentor_slot ON bookings (mentor_id, date, time);

    CREATE TABLE IF NOT EXISTS saved_scholarships (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      scholarship_id TEXT NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      PRIMARY KEY (user_id, scholarship_id)
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      scholarship_id TEXT NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'preparing' CHECK (status IN ('preparing', 'submitted', 'accepted', 'rejected')),
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT,
      UNIQUE (user_id, scholarship_id)
    );
  `);
}

export const newId = () => randomUUID();
export const now = () => new Date().toISOString();
