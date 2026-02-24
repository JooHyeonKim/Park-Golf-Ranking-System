import React, { useEffect, useState } from 'react';
import { getDeviceId } from '../../utils/deviceId';
import { listenToTournament, listenToGroups } from '../../utils/firestoreOps';

export default function CollabGroupSelect({ tournamentId, onSelectGroup, onBack }) {
  const [tournament, setTournament] = useState(null);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const deviceId = getDeviceId();

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
      listenToGroups(tournamentId, (groupsData) => {
        setGroups(groupsData);
      })
    );

    return () => unsubs.forEach(fn => fn());
  }, [tournamentId]);

  const getGroupStatus = (group) => {
    const submissions = group.submissions || {};
    const count = Object.keys(submissions).length;
    const hasMySubmission = !!submissions[deviceId];

    if (group.verificationStatus === 'verified') return { label: '완료', color: 'bg-green-100 text-green-700 border-green-300', count };
    if (group.verificationStatus === 'conflict') return { label: '충돌', color: 'bg-red-100 text-red-700 border-red-300', count };
    if (hasMySubmission) return { label: '제출됨', color: 'bg-blue-100 text-blue-700 border-blue-300', count };
    if (count === 1) return { label: '1/2', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', count };
    return { label: '대기', color: 'bg-gray-50 text-gray-500 border-gray-200', count };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="sticky top-0 bg-white border-b shadow-sm z-10 px-6 py-4">
        <div className="flex items-center">
          <button onClick={onBack} className="text-gray-600 hover:text-gray-800 mr-4 font-medium">← 뒤로</button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-green-800">{tournament?.name || '대회'}</h1>
            <p className="text-gray-500">{tournament?.holeCount}홀 | 점수를 입력할 조를 선택하세요</p>
          </div>
        </div>
      </div>

      {/* 상태 범례 */}
      <div className="px-6 py-3 flex gap-4 text-sm text-gray-500 flex-wrap">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200" />대기</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-300" />1/2</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-300" />제출됨</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-300" />완료</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-300" />충돌</span>
      </div>

      {/* 조 그리드 */}
      <div className="p-4">
        <div className="grid grid-cols-4 lg:grid-cols-6 gap-3">
          {groups.map(group => {
            const status = getGroupStatus(group);
            const playerNames = group.players
              .filter(p => p.name)
              .map(p => p.name)
              .join(', ');

            return (
              <button
                key={group.groupNumber}
                onClick={() => onSelectGroup(group.groupNumber)}
                className={`p-3 rounded-xl border-2 text-left transition-shadow hover:shadow-md ${status.color}`}
              >
                <div className="text-lg font-bold">{group.groupNumber}조</div>
                <div className="text-xs opacity-70">{group.course}</div>
                <div className="text-xs mt-1 font-medium">{status.label}</div>
                {playerNames && (
                  <div className="text-xs mt-1 opacity-60 truncate">{playerNames}</div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
