import { useState, useEffect, useCallback } from 'react';
import {
  initAffiliations,
  getAllAffiliations,
  addAffiliationToDB,
  updateAffiliationInDB,
  deleteAffiliationFromDB
} from '../utils/db';

export function useAffiliations() {
  const [affiliations, setAffiliations] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        await initAffiliations();
        const loaded = await getAllAffiliations();
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
