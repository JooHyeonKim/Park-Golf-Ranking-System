import { useState, useEffect, useCallback } from 'react';
import {
  loadAffiliations as loadAffiliationsFromDB,
  addAffiliation as addAffiliationToDB,
  updateAffiliation as updateAffiliationInDB,
  deleteAffiliation as deleteAffiliationFromDB
} from '../utils/supabaseData';

const DEFAULT_AFFILIATIONS = ['서초', '강남', '송파'];

export function useAffiliations() {
  const [affiliations, setAffiliations] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        let loaded = await loadAffiliationsFromDB();

        // 신규 유저: 기본 소속 시딩
        if (loaded.length === 0) {
          for (const name of DEFAULT_AFFILIATIONS) {
            await addAffiliationToDB(name);
          }
          loaded = await loadAffiliationsFromDB();
        }

        setAffiliations(loaded);
      } catch (error) {
        console.error('Failed to initialize affiliations:', error);
      }
      setIsInitialized(true);
    }
    init();
  }, []);

  const addAffiliation = useCallback(async (name) => {
    const result = await addAffiliationToDB(name);
    if (result) {
      setAffiliations(prev => [...prev, result]);
      return true;
    }
    return false;
  }, []);

  const editAffiliation = useCallback(async (oldName, newName) => {
    const aff = affiliations.find(a => a.name === oldName);
    if (!aff) return false;

    const success = await updateAffiliationInDB(aff.id, newName);
    if (success) {
      setAffiliations(prev => prev.map(a => a.name === oldName ? { ...a, name: newName.trim() } : a));
      return true;
    }
    return false;
  }, [affiliations]);

  const deleteAffiliation = useCallback(async (name) => {
    const aff = affiliations.find(a => a.name === name);
    if (!aff) return;

    await deleteAffiliationFromDB(aff.id);
    setAffiliations(prev => prev.filter(a => a.name !== name));
  }, [affiliations]);

  return {
    affiliations: affiliations.map(a => a.name),
    addAffiliation,
    editAffiliation,
    deleteAffiliation,
    isInitialized
  };
}
