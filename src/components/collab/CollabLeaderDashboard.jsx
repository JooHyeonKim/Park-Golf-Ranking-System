import React, { useEffect, useCallback } from 'react';
import { useCollabTournament } from '../../hooks/useCollabTournament';
import { checkAndVerify } from '../../hooks/useCollabVerification';
import { setGroupVerified, setGroupConflict } from '../../utils/firestoreOps';

export default function CollabLeaderDashboard({ tournamentId, onViewSummary, onBack }) {
  const {
    tournament,
    groups,
    isLoading,
    getVerifiedResults,
  } = useCollabTournament(tournamentId);

  // 2개 제출이 감지된 조에 대해 자동 검증 실행
  useEffect(() => {
    if (!tournament || groups.length === 0) return;

    for (const group of groups) {
      if (group.verificationStatus !== 'pending') continue;

      const { shouldVerify, result } = checkAndVerify(group, tournament.holeCount);
      if (!shouldVerify) continue;

      // 비동기 검증 결과 기록
      (async () => {
        try {
          if (result.isMatch) {
            await setGroupVerified(tournamentId, group.groupNumber, result.verifiedScores);
          } else {
            await setGroupConflict(tournamentId, group.groupNumber, result.discrepancies);
          }
        } catch (err) {
          console.error(`Group ${group.groupNumber} verification error:`, err);
        }
      })();
    }
  }, [groups, tournament, tournamentId]);

  const handleViewSummary = () => {
    const results = getVerifiedResults();
    if (results) {
      onViewSummary(results);
    }
  };

  const handleCopyCode = () => {
    if (tournament?.code) {
      navigator.clipboard.writeText(tournament.code);
      alert('대회 코드가 복사되었습니다!');
    }
  };

  if (isLoading || !tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">로딩 중...</div>
      </div>
    );
  }

  // 통계
  const totalGroups = groups.length;
  const verifiedCount = groups.filter(g => g.verificationStatus === 'verified').length;
  const conflictCount = groups.filter(g => g.verificationStatus === 'conflict').length;
  const submittedCount = groups.filter(g => {
    const subs = Object.keys(g.submissions || {}).length;
    return subs > 0 && g.verificationStatus === 'pending';
  }).length;
  const pendingCount = totalGroups - verifiedCount - conflictCount - submittedCount;

  const getGroupStyle = (group) => {
    const subs = Object.keys(group.submissions || {}).length;
    if (group.verificationStatus === 'verified') return 'bg-green-100 border-green-400 text-green-800';
    if (group.verificationStatus === 'conflict') return 'bg-red-100 border-red-400 text-red-800';
    if (subs >= 2) return 'bg-blue-100 border-blue-400 text-blue-800';
    if (subs === 1) return 'bg-yellow-100 border-yellow-400 text-yellow-800';
    return 'bg-gray-50 border-gray-200 text-gray-500';
  };

  const getGroupLabel = (group) => {
    const subs = Object.keys(group.submissions || {}).length;
    if (group.verificationStatus === 'verified') return '완료';
    if (group.verificationStatus === 'conflict') return '충돌';
    if (subs >= 2) return '검증중';
    if (subs === 1) return '1/2';
    return '대기';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="sticky top-0 bg-white border-b shadow-sm z-10">
        <div className="flex items-center px-4 py-3">
          <button onClick={onBack} className="text-gray-600 mr-3">← 나가기</button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-green-800">{tournament.name}</h1>
            <p className="text-xs text-gray-400">{tournament.date} | {tournament.holeCount}홀</p>
          </div>
          <button
            onClick={handleCopyCode}
            className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-medium"
          >
            코드: {tournament.code}
          </button>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-4">
        {/* 진행 상황 요약 */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-gray-100 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-gray-600">{pendingCount}</div>
            <div className="text-xs text-gray-500">대기</div>
          </div>
          <div className="bg-yellow-100 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-yellow-700">{submittedCount}</div>
            <div className="text-xs text-yellow-600">입력중</div>
          </div>
          <div className="bg-green-100 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-green-700">{verifiedCount}</div>
            <div className="text-xs text-green-600">완료</div>
          </div>
          <div className="bg-red-100 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-red-700">{conflictCount}</div>
            <div className="text-xs text-red-600">충돌</div>
          </div>
        </div>

        {/* 진행률 바 */}
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">진행률</span>
            <span className="font-bold text-green-700">{verifiedCount}/{totalGroups}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${totalGroups > 0 ? (verifiedCount / totalGroups) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* 결과 보기 버튼 */}
        {verifiedCount > 0 && (
          <button
            onClick={handleViewSummary}
            className={`w-full py-3 rounded-xl font-medium ${
              verifiedCount === totalGroups
                ? 'bg-green-600 text-white'
                : 'bg-white border-2 border-green-600 text-green-700'
            }`}
          >
            {verifiedCount === totalGroups
              ? '최종 결과 보기'
              : `중간 결과 보기 (${verifiedCount}조 완료)`}
          </button>
        )}

        {/* 조별 상태 그리드 */}
        <div className="bg-white rounded-xl border p-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3">조별 현황</h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {groups.map(group => {
              const subs = group.submissions || {};
              const subNames = Object.values(subs).map(s => s.nickname).join(', ');

              return (
                <div
                  key={group.groupNumber}
                  className={`p-2 rounded-lg border-2 text-center ${getGroupStyle(group)}`}
                >
                  <div className="text-sm font-bold">{group.groupNumber}조</div>
                  <div className="text-xs opacity-70">{group.course}</div>
                  <div className="text-xs font-medium mt-0.5">{getGroupLabel(group)}</div>
                  {subNames && (
                    <div className="text-xs opacity-50 mt-0.5 truncate">{subNames}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 범례 */}
        <div className="flex gap-4 text-xs text-gray-500 justify-center flex-wrap">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200" />대기</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-300" />1/2</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-300" />검증중</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-300" />완료</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-300" />충돌</span>
        </div>
      </div>
    </div>
  );
}
