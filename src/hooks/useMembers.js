import { useState, useEffect, useCallback } from 'react';
import {
  getAllMembers,
  getMembersByClubFromDB,
  searchMembersByName,
  addMemberToDB,
  updateMemberInDB,
  deleteMemberFromDB,
  updateMembersClubInDB
} from '../utils/db';

/**
 * 회원 관리 커스텀 훅 (IndexedDB 기반)
 */
export function useMembers() {
  const [members, setMembers] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // 초기 로드
  useEffect(() => {
    async function init() {
      try {
        const loaded = await getAllMembers();
        setMembers(loaded);
      } catch (error) {
        console.error('Failed to load members:', error);
      }
      setIsInitialized(true);
    }
    init();
  }, []);

  // 회원 추가
  const addMember = useCallback(async (name, gender, club, birthDate = '') => {
    const result = await addMemberToDB(name, gender, club, birthDate);
    if (result) {
      setMembers(prev => [...prev, result]);
      return true;
    }
    return false;
  }, []);

  // 회원 수정
  const editMember = useCallback(async (id, updates) => {
    await updateMemberInDB(id, updates);
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  // 회원 삭제
  const deleteMember = useCallback(async (id) => {
    await deleteMemberFromDB(id);
    setMembers(prev => prev.filter(m => m.id !== id));
  }, []);

  // 이름으로 검색 (자동완성용 - state에서 필터)
  const searchByName = useCallback((name) => {
    const trimmed = name.trim();
    if (!trimmed) return [];
    return members.filter(m => m.name === trimmed);
  }, [members]);

  // 클럽별 회원 필터 (state에서 필터)
  const getMembersByClub = useCallback((clubName) => {
    return members.filter(m => m.club === clubName);
  }, [members]);

  // 클럽명 변경 시 소속 회원 일괄 업데이트
  const updateMembersClub = useCallback(async (oldName, newName) => {
    await updateMembersClubInDB(oldName, newName);
    setMembers(prev => prev.map(m =>
      m.club === oldName ? { ...m, club: newName } : m
    ));
  }, []);

  return {
    members,
    addMember,
    editMember,
    deleteMember,
    searchByName,
    getMembersByClub,
    updateMembersClub,
    isInitialized
  };
}
