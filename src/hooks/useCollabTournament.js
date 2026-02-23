import { useState, useEffect, useCallback } from 'react';
import { getDeviceId } from '../utils/deviceId';
import {
  createCollabTournament,
  getTournament,
  updateTournamentField,
  activateTournament,
  completeTournament,
  initializeGroups,
  updateGroupPlayers,
  addPlayerToGroup,
  removePlayerFromGroup,
  getAllGroups,
  listenToTournament,
  listenToGroups,
  setGroupVerified,
  setGroupConflict,
} from '../utils/firestoreOps';

/**
 * 팀장용 협동 대회 관리 훅
 */
export function useCollabTournament(tournamentId = null) {
  const [tournament, setTournament] = useState(null);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const deviceId = getDeviceId();

  // 대회 + 조 실시간 감시
  useEffect(() => {
    if (!tournamentId) return;

    setIsLoading(true);
    const unsubs = [];

    unsubs.push(
      listenToTournament(tournamentId, (data) => {
        setTournament(data);
        setIsLoading(false);
      })
    );

    unsubs.push(
      listenToGroups(tournamentId, (groupsData) => {
        setGroups(groupsData);
      })
    );

    return () => unsubs.forEach(fn => fn());
  }, [tournamentId]);

  /**
   * 대회 생성
   * @returns {{ id: string, code: string }}
   */
  const createTournament = useCallback(async ({ name, date, holeCount }) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await createCollabTournament({
        name,
        date,
        holeCount,
        leaderDeviceId: deviceId,
      });
      // 조 초기화
      await initializeGroups(result.id, holeCount);
      setIsLoading(false);
      return result;
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  }, [deviceId]);

  /**
   * 파 업데이트
   */
  const updatePars = useCallback(async (pars) => {
    if (!tournamentId) return;
    await updateTournamentField(tournamentId, pars);
  }, [tournamentId]);

  /**
   * 클럽 목록 업데이트
   */
  const updateClubs = useCallback(async (clubs) => {
    if (!tournamentId) return;
    await updateTournamentField(tournamentId, { clubs });
  }, [tournamentId]);

  /**
   * 조 선수 업데이트
   */
  const updatePlayers = useCallback(async (groupNumber, players) => {
    if (!tournamentId) return;
    await updateGroupPlayers(tournamentId, groupNumber, players);
  }, [tournamentId]);

  /**
   * 조에 추가 선수 삽입
   */
  const addPlayer = useCallback(async (groupNumber, baseCourse) => {
    if (!tournamentId) return;
    await addPlayerToGroup(tournamentId, groupNumber, baseCourse);
  }, [tournamentId]);

  /**
   * 조에서 추가 선수 제거
   */
  const removePlayer = useCallback(async (groupNumber, slotIndex) => {
    if (!tournamentId) return;
    await removePlayerFromGroup(tournamentId, groupNumber, slotIndex);
  }, [tournamentId]);

  /**
   * 대회 활성화 (참여자 입력 가능)
   */
  const activate = useCallback(async () => {
    if (!tournamentId) return;
    await activateTournament(tournamentId);
  }, [tournamentId]);

  /**
   * 검증된 결과를 기존 SummaryPage 형태로 변환
   */
  const getVerifiedResults = useCallback(() => {
    if (!tournament || groups.length === 0) return null;

    const players = [];
    let idCounter = 1;

    for (const group of groups) {
      if (group.verificationStatus !== 'verified' || !group.verifiedScores) continue;

      for (const player of group.players) {
        const scores = group.verifiedScores[String(player.slot)];
        if (!scores || !player.name) continue;

        const scoreA = scores.A ? scores.A.reduce((a, b) => a + b, 0) : null;
        const scoreB = scores.B ? scores.B.reduce((a, b) => a + b, 0) : null;
        const scoreC = scores.C ? scores.C.reduce((a, b) => a + b, 0) : null;
        const scoreD = scores.D ? scores.D.reduce((a, b) => a + b, 0) : null;

        // detailScores 변환 (A1~D9 형태)
        const detailScores = {};
        const courseKeys = ['A', 'B', 'C', 'D'];
        for (const key of courseKeys) {
          if (scores[key]) {
            scores[key].forEach((val, idx) => {
              detailScores[`${key}${idx + 1}`] = val;
            });
          }
        }

        players.push({
          id: idCounter++,
          group: group.groupNumber,
          course: player.course,
          name: player.name,
          gender: player.gender,
          club: player.club,
          scoreA,
          scoreB,
          scoreC,
          scoreD,
          detailScores,
        });
      }
    }

    return {
      id: tournament.id,
      name: tournament.name,
      date: tournament.date,
      holeCount: tournament.holeCount,
      createdAt: tournament.createdAt,
      players,
    };
  }, [tournament, groups]);

  return {
    tournament,
    groups,
    isLoading,
    error,
    createTournament,
    updatePars,
    updateClubs,
    updatePlayers,
    addPlayer,
    removePlayer,
    activate,
    getVerifiedResults,
  };
}
