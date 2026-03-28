import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';

const DB_NAME = 'parkgolf-db';
const DB_VERSION = 2;

function openLocalDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('clubs')) {
        const s = db.createObjectStore('clubs', { keyPath: 'id', autoIncrement: true });
        s.createIndex('name', 'name', { unique: true });
      }
      if (!db.objectStoreNames.contains('members')) {
        const s = db.createObjectStore('members', { keyPath: 'id', autoIncrement: true });
        s.createIndex('name', 'name', { unique: false });
        s.createIndex('club', 'club', { unique: false });
      }
      if (!db.objectStoreNames.contains('affiliations')) {
        const s = db.createObjectStore('affiliations', { keyPath: 'id', autoIncrement: true });
        s.createIndex('name', 'name', { unique: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function readAllFromStore(db, storeName) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export function useDataMigration(userId) {
  const [isMigrating, setIsMigrating] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const migrate = useCallback(async () => {
    if (!userId) return;

    const migrationKey = `parkgolf-migration-done-${userId}`;
    if (localStorage.getItem(migrationKey) === 'true') {
      setIsDone(true);
      return;
    }

    // 로컬 데이터 읽기
    let tournaments = [];
    let clubs = [];
    let members = [];
    let affiliations = [];

    try {
      const raw = localStorage.getItem('parkgolf-tournaments');
      if (raw) tournaments = JSON.parse(raw);
    } catch { /* ignore */ }

    try {
      const db = await openLocalDB();
      clubs = await readAllFromStore(db, 'clubs');
      members = await readAllFromStore(db, 'members');
      affiliations = await readAllFromStore(db, 'affiliations');
      db.close();
    } catch { /* ignore */ }

    const hasLocalData =
      tournaments.length > 0 ||
      clubs.length > 0 ||
      members.length > 0 ||
      affiliations.length > 0;

    if (!hasLocalData) {
      localStorage.setItem(migrationKey, 'true');
      setIsDone(true);
      return;
    }

    setIsMigrating(true);

    try {
      const { error } = await supabase.rpc('migrate_local_data', {
        p_tournaments: tournaments,
        p_clubs: clubs.map(c => c.name),
        p_affiliations: affiliations.map(a => a.name),
        p_members: members.map(m => ({
          name: m.name,
          gender: m.gender || '',
          club: m.club || '',
          birthDate: m.birthDate || '',
        })),
      });

      if (error) {
        console.error('Migration error:', error);
      }

      localStorage.setItem(migrationKey, 'true');
    } catch (err) {
      console.error('Migration failed:', err);
    } finally {
      setIsMigrating(false);
      setIsDone(true);
    }
  }, [userId]);

  useEffect(() => {
    migrate();
  }, [migrate]);

  return { isMigrating, isDone };
}
