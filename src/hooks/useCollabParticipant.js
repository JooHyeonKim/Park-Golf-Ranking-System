import { useState, useEffect, useCallback } from 'react';
import { getDeviceId } from '../utils/deviceId';
import {
  findTournamentByCode,
  submitGroupScores,
  resetGroupSubmissions,
  listenToTournament,
  listenToGroups,
  listenToGroup,
} from '../utils/firestoreOps';

/**
 * 참여자용 협동 대회 참여 훅
 */
export function useCollabParticipant() {
  const [tournamentId, setTournamentId] = useState(null);
  const [tournament, setTournament] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const deviceId = getDeviceId();

  // 대회 실시간 감시
  useEffect(() => {
    if (!tournamentId) return;

    const unsubs = [];

    unsubs.push(
      listenToTournament(tournamentId, (data) => {
        setTournament(data);
      })
    );

    unsubs.push(
      listenToGroups(tournamentId, (groupsData) => {
        setGroups(groupsData);
      })
    );

    return () => unsubs.forEach(fn => fn());
  }, [tournamentId]);

  // 선택된 조 실시간 감시
  useEffect(() => {
    if (!tournamentId || !selectedGroup) return;

    const unsub = listenToGroup(tournamentId, selectedGroup, (data) => {
      // groups 배열에서 해당 조 업데이트
      setGroups(prev => prev.map(g =>
        g.groupNumber === selectedGroup ? data : g
      ));
    });

    return () => unsub();
  }, [tournamentId, selectedGroup]);

  /**
   * 대회 코드로 참여
   * @param {string} code - 6자리 코드
   * @returns {Object|null} - { id, tournament } 또는 null
   */
  const joinByCode = useCallback(async (code) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await findTournamentByCode(code);
      if (!result) {
        setError('대회를 찾을 수 없습니다');
        setIsLoading(false);
        return null;
      }
      if (result.status === 'setup') {
        setError('아직 대회가 시작되지 않았습니다');
        setIsLoading(false);
        return null;
      }
      setTournamentId(result.id);
      setTournament(result);
      setIsLoading(false);
      return { id: result.id, tournament: result };
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      return null;
    }
  }, []);

  /**
   * 조 선택
   */
  const selectGroup = useCallback((groupNumber) => {
    setSelectedGroup(groupNumber);
  }, []);

  /**
   * 점수 제출
   * @param {number} groupNumber
   * @param {string} nickname
   * @param {Object} scores
   */
  const submitScores = useCallback(async (groupNumber, nickname, scores) => {
    if (!tournamentId) return;
    setIsLoading(true);
    try {
      await submitGroupScores(tournamentId, groupNumber, deviceId, nickname, scores);
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  }, [tournamentId, deviceId]);

  /**
   * 현재 조에서 본인의 제출 상태
   */
  const getSubmissionStatus = useCallback((groupNumber) => {
    const group = groups.find(g => g.groupNumber === groupNumber);
    if (!group) return { status: 'none', submissionCount: 0 };

    const submissions = group.submissions || {};
    const submissionCount = Object.keys(submissions).length;
    const hasMySubmission = !!submissions[deviceId];

    if (group.verificationStatus === 'verified') {
      return { status: 'verified', submissionCount };
    }
    if (group.verificationStatus === 'conflict') {
      return {
        status: 'conflict',
        submissionCount,
        discrepancies: group.discrepancies,
      };
    }
    if (hasMySubmission) {
      return { status: 'submitted', submissionCount };
    }
    return { status: 'none', submissionCount };
  }, [groups, deviceId]);

  /**
   * 제출 초기화 (재입력용)
   */
  const resetSubmissions = useCallback(async (groupNumber) => {
    if (!tournamentId) return;
    await resetGroupSubmissions(tournamentId, groupNumber);
  }, [tournamentId]);

  return {
    tournament,
    tournamentId,
    groups,
    selectedGroup,
    isLoading,
    error,
    deviceId,
    joinByCode,
    selectGroup,
    submitScores,
    getSubmissionStatus,
    resetSubmissions,
  };
}
