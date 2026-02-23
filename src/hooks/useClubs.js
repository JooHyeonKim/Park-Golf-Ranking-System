import { useState, useEffect, useCallback } from 'react';
import {
  migrateFromLocalStorage,
  getAllClubs,
  addClubToDB,
  updateClubInDB,
  deleteClubFromDB
} from '../utils/db';

/**
 * 클럽 관리 커스텀 훅 (IndexedDB 기반)
 */
export function useClubs() {
  const [clubs, setClubs] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // 초기 로드 + 마이그레이션
  useEffect(() => {
    async function init() {
      try {
        await migrateFromLocalStorage();
        const loadedClubs = await getAllClubs();
        setClubs(loadedClubs);
      } catch (error) {
        console.error('Failed to initialize clubs:', error);
      }
      setIsInitialized(true);
    }
    init();
  }, []);

  // 클럽 추가
  const addClub = useCallback(async (name) => {
    const result = await addClubToDB(name);
    if (result) {
      setClubs(prev => [...prev, result]);
      return true;
    }
    return false;
  }, []);

  // 클럽 수정
  const editClub = useCallback(async (oldName, newName) => {
    const club = clubs.find(c => c.name === oldName);
    if (!club) return false;

    const success = await updateClubInDB(club.id, newName);
    if (success) {
      setClubs(prev => prev.map(c => c.name === oldName ? { ...c, name: newName.trim() } : c));
      return true;
    }
    return false;
  }, [clubs]);

  // 클럽 삭제
  const deleteClub = useCallback(async (name) => {
    const club = clubs.find(c => c.name === name);
    if (!club) return;

    await deleteClubFromDB(club.id);
    setClubs(prev => prev.filter(c => c.name !== name));
  }, [clubs]);

  return {
    clubs: clubs.map(c => c.name), // 기존 인터페이스 유지 (문자열 배열)
    clubObjects: clubs,             // id 포함된 객체 배열 (내부용)
    addClub,
    editClub,
    deleteClub,
    isInitialized
  };
}
