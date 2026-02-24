import React, { useEffect, useState, useCallback, useRef } from 'react';
import { getDeviceId } from '../../utils/deviceId';
import {
  listenToTournament,
  listenToGroup,
  setGroupVerified,
  setGroupConflict,
  resetGroupSubmissions,
} from '../../utils/firestoreOps';
import { checkAndVerify } from '../../hooks/useCollabVerification';

export default function CollabSubmissionStatus({ tournamentId, groupNumber, onResubmit, onBackToGroups }) {
  const [tournament, setTournament] = useState(null);
  const [group, setGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const verifyingRef = useRef(false);

  useEffect(() => {
    if (!tournamentId) return;
    const unsubs = [];

    unsubs.push(
      listenToTournament(tournamentId, (data) => {
        setTournament(data);
        setIsLoading(false);
      })
    );

    unsubs.push(
      listenToGroup(tournamentId, groupNumber, (data) => {
        setGroup(data);
      })
    );

    return () => unsubs.forEach(fn => fn());
  }, [tournamentId, groupNumber]);

  // 2개 제출 감지 시 자동 검증 (ref로 중복 방지)
  useEffect(() => {
    if (!group || !tournament) return;
    if (group.verificationStatus === 'verified' || group.verificationStatus === 'conflict') return;
    if (verifyingRef.current) return;

    const { shouldVerify, result } = checkAndVerify(group, tournament.holeCount);
    if (!shouldVerify) return;

    verifyingRef.current = true;
    (async () => {
      try {
        if (result.isMatch) {
          await setGroupVerified(tournamentId, groupNumber, result.verifiedScores);
        } else {
          await setGroupConflict(tournamentId, groupNumber, result.discrepancies);
        }
      } catch (err) {
        console.error('Verification failed:', err);
      } finally {
        verifyingRef.current = false;
      }
    })();
  }, [group, tournament, tournamentId, groupNumber]);

  // 재입력 처리 (double-click 방지)
  const handleResubmit = async () => {
    if (isResetting) return;
    setIsResetting(true);
    try {
      await resetGroupSubmissions(tournamentId, groupNumber);
      onResubmit();
    } catch (err) {
      alert('초기화 실패: ' + err.message);
      setIsResetting(false);
    }
  };

  if (isLoading || !group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">로딩 중...</div>
      </div>
    );
  }

  const submissions = group.submissions || {};
  const submissionCount = Object.keys(submissions).length;
  const status = group.verificationStatus;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <div className="sticky top-0 bg-white border-b shadow-sm z-10 px-6 py-4">
        <div className="flex items-center">
          <button onClick={onBackToGroups} className="text-gray-600 hover:text-gray-800 mr-4 font-medium">← 조 목록</button>
          <h1 className="text-xl font-bold text-green-800">{groupNumber}조 제출 상태</h1>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-xl text-center space-y-6">

          {/* 대기 중 (1/2) */}
          {status === 'pending' && submissionCount < 2 && (
            <>
              <div className="text-7xl animate-pulse">⏳</div>
              <h2 className="text-2xl font-bold text-gray-700">제출 완료!</h2>
              <p className="text-lg text-gray-500">
                다른 참여자의 입력을 기다리는 중입니다...
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
                <div className="text-base text-yellow-700">
                  제출 현황: <span className="font-bold text-lg">{submissionCount}/2</span>
                </div>
              </div>
            </>
          )}

          {/* 검증 중 */}
          {status === 'pending' && submissionCount >= 2 && (
            <>
              <div className="text-7xl animate-spin">⚙️</div>
              <h2 className="text-2xl font-bold text-gray-700">검증 중...</h2>
              <p className="text-lg text-gray-500">두 기록을 비교하고 있습니다</p>
            </>
          )}

          {/* 검증 완료 */}
          {status === 'verified' && (
            <>
              <div className="text-7xl">✅</div>
              <h2 className="text-2xl font-bold text-green-700">검증 완료!</h2>
              <p className="text-lg text-gray-500">
                두 기록이 일치하여 승인되었습니다.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                <div className="text-base text-green-700 font-medium">
                  {groupNumber}조 기록이 대회 결과에 반영되었습니다
                </div>
              </div>
            </>
          )}

          {/* 충돌 */}
          {status === 'conflict' && (
            <>
              <div className="text-7xl">⚠️</div>
              <h2 className="text-2xl font-bold text-red-700">기록 불일치!</h2>
              <p className="text-lg text-gray-500">
                두 기록에 차이가 있습니다. 다시 확인해주세요.
              </p>

              {/* 불일치 상세 */}
              {group.discrepancies && group.discrepancies.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-left">
                  <h3 className="text-base font-bold text-red-700 mb-3">
                    불일치 항목 ({group.discrepancies.length}건)
                  </h3>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {group.discrepancies.map((d, i) => {
                      const player = group.players.find(p => p.slot === d.playerSlot);
                      const values = Object.values(d.values);
                      return (
                        <div key={i} className="text-sm text-red-600 flex justify-between">
                          <span>{player?.name || `선수${d.playerSlot + 1}`} {d.course}{d.hole}홀</span>
                          <span className="font-mono">{values[0] ?? '-'} vs {values[1] ?? '-'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={handleResubmit}
                disabled={isResetting}
                className="w-full py-3 bg-red-600 text-white rounded-xl font-medium text-base disabled:opacity-50"
              >
                {isResetting ? '초기화 중...' : '다시 입력하기'}
              </button>
            </>
          )}

          <button
            onClick={onBackToGroups}
            className="text-gray-400 hover:text-gray-600 text-base"
          >
            다른 조 입력하기
          </button>
        </div>
      </div>
    </div>
  );
}
