import { useState, useEffect, useCallback } from 'react';
import {
  loadClubs as loadClubsFromDB,
  addClub as addClubToDB,
  updateClub as updateClubInDB,
  deleteClub as deleteClubFromDB
} from '../utils/supabaseData';

const DEFAULT_CLUBS = [
  '방배', '양재', '잠원', '반포', '서리풀',
  '서래', '우면', '서초', '내곡', '청계',
  '이수', '매헌', '향목'
];

/**
 * 클럽 관리 커스텀 훅 (Supabase 기반)
 */
export function useClubs() {
  const [clubs, setClubs] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // 초기 로드
  useEffect(() => {
    async function init() {
      try {
        let loaded = await loadClubsFromDB();

        // 신규 유저: 기본 클럽 시딩
        if (loaded.length === 0) {
          for (const name of DEFAULT_CLUBS) {
            await addClubToDB(name);
          }
          loaded = await loadClubsFromDB();
        }

        setClubs(loaded);
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
    clubs: clubs.map(c => c.name),
    clubObjects: clubs,
    addClub,
    editClub,
    deleteClub,
    isInitialized
  };
}
