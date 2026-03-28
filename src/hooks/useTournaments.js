import { useState, useEffect, useCallback, useRef } from 'react';
import {
  createTournament,
  findTournament,
  updateTournament as updateTournamentUtil,
  deleteTournament as deleteTournamentUtil,
  updatePlayer as updatePlayerUtil,
  addPlayerToCourse as addPlayerToCourseUtil,
  removePlayerFromCourse as removePlayerFromCourseUtil,
  adjustGroupCount as adjustGroupCountUtil,
  countParticipants
} from '../utils/data';
import {
  loadTournaments as loadTournamentsFromDB,
  saveTournament as saveTournamentToDB,
  deleteTournament as deleteTournamentFromDB
} from '../utils/supabaseData';

/**
 * 대회 관리 커스텀 훅 (Supabase 기반)
 */
export function useTournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [currentTournamentId, setCurrentTournamentId] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 디바운스 타이머 ref
  const saveTimerRef = useRef({});

  // Supabase에 대회 저장 (디바운스)
  const debouncedSave = useCallback((tournament) => {
    const id = tournament.id;
    if (saveTimerRef.current[id]) {
      clearTimeout(saveTimerRef.current[id]);
    }
    saveTimerRef.current[id] = setTimeout(() => {
      saveTournamentToDB(tournament).catch(err =>
        console.error('Failed to save tournament:', err)
      );
      delete saveTimerRef.current[id];
    }, 500);
  }, []);

  // Supabase에 대회 즉시 저장
  const immediateSave = useCallback((tournament) => {
    const id = tournament.id;
    if (saveTimerRef.current[id]) {
      clearTimeout(saveTimerRef.current[id]);
      delete saveTimerRef.current[id];
    }
    saveTournamentToDB(tournament).catch(err =>
      console.error('Failed to save tournament:', err)
    );
  }, []);

  // 초기 로드 (Supabase)
  useEffect(() => {
    async function init() {
      try {
        const loaded = await loadTournamentsFromDB();
        setTournaments(loaded);
      } catch (error) {
        console.error('Failed to load tournaments:', error);
      }
      setCurrentTournamentId(null);
      setIsInitialized(true);
    }
    init();
  }, []);

  // 컴포넌트 언마운트 시 보류중인 저장 즉시 실행
  useEffect(() => {
    return () => {
      Object.values(saveTimerRef.current).forEach(clearTimeout);
    };
  }, []);

  // 새 대회 추가
  const addTournament = useCallback((name, date, holeCount = 36, groupCount = null, clubType = 'club') => {
    const newTournament = createTournament(name, date, holeCount, groupCount, clubType);
    setTournaments(prev => [newTournament, ...prev]);
    setCurrentTournamentId(newTournament.id);
    immediateSave(newTournament);
    return newTournament.id;
  }, [immediateSave]);

  // 대회 삭제
  const deleteTournament = useCallback((id) => {
    setTournaments(prev => deleteTournamentUtil(prev, id));
    if (currentTournamentId === id) {
      setCurrentTournamentId(null);
    }
    deleteTournamentFromDB(id).catch(err =>
      console.error('Failed to delete tournament:', err)
    );
  }, [currentTournamentId]);

  // 대회 업데이트
  const updateTournament = useCallback((id, updates) => {
    setTournaments(prev => {
      const updated = updateTournamentUtil(prev, id, updates);
      const tournament = findTournament(updated, id);
      if (tournament) immediateSave(tournament);
      return updated;
    });
  }, [immediateSave]);

  // 선수 업데이트 (디바운스 적용)
  const updatePlayer = useCallback((tournamentId, playerId, updates) => {
    setTournaments(prev => {
      const newTournaments = prev.map(tournament => {
        if (tournament.id === tournamentId) {
          const updated = {
            ...tournament,
            players: updatePlayerUtil(tournament.players, playerId, updates)
          };
          debouncedSave(updated);
          return updated;
        }
        return tournament;
      });
      return newTournaments;
    });
  }, [debouncedSave]);

  // 코스 그룹에 선수 추가
  const addPlayerToCourse = useCallback((tournamentId, baseCourse, group) => {
    setTournaments(prev => prev.map(tournament => {
      if (tournament.id === tournamentId) {
        const updated = {
          ...tournament,
          players: addPlayerToCourseUtil(tournament.players, baseCourse, group)
        };
        immediateSave(updated);
        return updated;
      }
      return tournament;
    }));
  }, [immediateSave]);

  // 추가된 선수 제거
  const removePlayerFromCourse = useCallback((tournamentId, playerId) => {
    setTournaments(prev => prev.map(tournament => {
      if (tournament.id === tournamentId) {
        const updated = {
          ...tournament,
          players: removePlayerFromCourseUtil(tournament.players, playerId)
        };
        immediateSave(updated);
        return updated;
      }
      return tournament;
    }));
  }, [immediateSave]);

  // 총 조 수 변경
  const updateGroupCount = useCallback((tournamentId, newGroupCount) => {
    setTournaments(prev => prev.map(tournament => {
      if (tournament.id === tournamentId) {
        const updated = {
          ...tournament,
          groupCount: newGroupCount,
          players: adjustGroupCountUtil(tournament.players, tournament.holeCount || 36, newGroupCount)
        };
        immediateSave(updated);
        return updated;
      }
      return tournament;
    }));
  }, [immediateSave]);

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
    addPlayerToCourse,
    removePlayerFromCourse,
    updateGroupCount,
    setCurrentTournament,
    getTournamentStats
  };
}
