import { useState, useEffect, useCallback } from 'react';
import {
  loadTournaments,
  saveTournaments,
  loadCurrentTournamentId,
  saveCurrentTournamentId,
  createTournament,
  findTournament,
  updateTournament as updateTournamentUtil,
  deleteTournament as deleteTournamentUtil,
  updatePlayer as updatePlayerUtil,
  countParticipants
} from '../utils/data';

/**
 * 대회 관리 커스텀 훅
 */
export function useTournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [currentTournamentId, setCurrentTournamentId] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 초기 로드
  useEffect(() => {
    const loadedTournaments = loadTournaments();
    // 새로고침 시 항상 대회 목록 화면으로 이동
    // const loadedCurrentId = loadCurrentTournamentId();

    setTournaments(loadedTournaments);
    setCurrentTournamentId(null); // 항상 null로 시작
    setIsInitialized(true);
  }, []);

  // 대회 목록 변경 시 저장 (초기화 완료 후에만)
  useEffect(() => {
    if (isInitialized) {
      saveTournaments(tournaments);
    }
  }, [tournaments, isInitialized]);

  // 현재 대회 ID는 세션 동안만 유지 (localStorage에 저장하지 않음)
  // 새로고침 시 항상 대회 목록 화면으로 돌아가도록 함

  // 새 대회 추가
  const addTournament = useCallback((name, date) => {
    const newTournament = createTournament(name, date);
    setTournaments(prev => [newTournament, ...prev]);
    setCurrentTournamentId(newTournament.id);
    return newTournament.id;
  }, []);

  // 대회 삭제
  const deleteTournament = useCallback((id) => {
    setTournaments(prev => deleteTournamentUtil(prev, id));
    // 삭제된 대회가 현재 대회면 null로 설정
    if (currentTournamentId === id) {
      setCurrentTournamentId(null);
    }
  }, [currentTournamentId]);

  // 대회 업데이트
  const updateTournament = useCallback((id, updates) => {
    setTournaments(prev => updateTournamentUtil(prev, id, updates));
  }, []);

  // 선수 업데이트
  const updatePlayer = useCallback((tournamentId, playerId, updates) => {
    setTournaments(prev => {
      return prev.map(tournament => {
        if (tournament.id === tournamentId) {
          return {
            ...tournament,
            players: updatePlayerUtil(tournament.players, playerId, updates)
          };
        }
        return tournament;
      });
    });
  }, []);

  // 현재 대회 가져오기
  const getCurrentTournament = useCallback(() => {
    if (currentTournamentId === null) return null;
    return findTournament(tournaments, currentTournamentId);
  }, [tournaments, currentTournamentId]);

  // 현재 대회 설정
  const setCurrentTournament = useCallback((id) => {
    setCurrentTournamentId(id);
  }, []);

  // 대회 통계 계산
  const getTournamentStats = useCallback((tournamentId) => {
    const tournament = findTournament(tournaments, tournamentId);
    if (!tournament) return null;

    return {
      totalPlayers: tournament.players.length,
      participants: countParticipants(tournament.players)
    };
  }, [tournaments]);

  return {
    tournaments,
    currentTournamentId,
    currentTournament: getCurrentTournament(),
    addTournament,
    deleteTournament,
    updateTournament,
    updatePlayer,
    setCurrentTournament,
    getTournamentStats
  };
}
