import { useState, useEffect, useCallback } from 'react';
import { loadClubs, saveClubs } from '../utils/data';

/**
 * 클럽 관리 커스텀 훅
 */
export function useClubs() {
  const [clubs, setClubs] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // 초기 로드
  useEffect(() => {
    const loadedClubs = loadClubs();
    setClubs(loadedClubs);
    setIsInitialized(true);
  }, []);

  // 클럽 목록 변경 시 저장 (초기화 완료 후에만)
  useEffect(() => {
    if (isInitialized) {
      saveClubs(clubs);
    }
  }, [clubs, isInitialized]);

  // 클럽 추가
  const addClub = useCallback((name) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    if (clubs.includes(trimmed)) return false;
    setClubs(prev => [...prev, trimmed]);
    return true;
  }, [clubs]);

  // 클럽 수정
  const editClub = useCallback((oldName, newName) => {
    const trimmed = newName.trim();
    if (!trimmed) return false;
    if (trimmed !== oldName && clubs.includes(trimmed)) return false;
    setClubs(prev => prev.map(c => c === oldName ? trimmed : c));
    return true;
  }, [clubs]);

  // 클럽 삭제
  const deleteClub = useCallback((name) => {
    setClubs(prev => prev.filter(c => c !== name));
  }, []);

  return {
    clubs,
    addClub,
    editClub,
    deleteClub
  };
}
