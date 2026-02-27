import React, { useState, useEffect, useMemo } from 'react';
import { getDeviceId } from '../../utils/deviceId';
import {
  listenToTournament,
  listenToGroup,
  submitGroupScores,
} from '../../utils/supabaseOps';

export default function CollabScoreCard({ tournamentId, groupNumber, nickname, onSubmitted, onBack }) {
  const [tournament, setTournament] = useState(null);
  const [group, setGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('A');
  const [showValidation, setShowValidation] = useState(false);

  const deviceId = getDeviceId();

  // scores: { [slotIndex]: { A: [null x 9], B: [null x 9], ... } }
  const [scores, setScores] = useState({});

  // 실시간 감시
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

  // 조 데이터 로드 시 scores 초기화
  useEffect(() => {
    if (!group || !tournament) return;
    const courses = tournament.holeCount === 18 ? ['A', 'B'] : ['A', 'B', 'C', 'D'];

    const initial = {};
    for (const player of group.players) {
      const playerScores = {};
      for (const c of courses) {
        playerScores[c] = Array(9).fill(null);
      }
      initial[String(player.slot)] = playerScores;
    }

    // 이전 제출이 있으면 복원 (충돌 후 재입력 시)
    const mySubmission = group.submissions?.[deviceId];
    if (mySubmission) {
      for (const [slot, courseScores] of Object.entries(mySubmission.scores)) {
        if (initial[slot]) {
          for (const [course, holeScores] of Object.entries(courseScores)) {
            if (initial[slot][course]) {
              initial[slot][course] = [...holeScores];
            }
          }
        }
      }
    }

    setScores(initial);
  }, [group, tournament, deviceId]);

  const courses = useMemo(() => {
    if (!tournament) return ['A', 'B', 'C', 'D'];
    return tournament.holeCount === 18 ? ['A', 'B'] : ['A', 'B', 'C', 'D'];
  }, [tournament]);

  const pars = useMemo(() => {
    if (!tournament) return {};
    return {
      A: tournament.parA || Array(9).fill(4),
      B: tournament.parB || Array(9).fill(4),
      C: tournament.parC || Array(9).fill(4),
      D: tournament.parD || Array(9).fill(4),
    };
  }, [tournament]);

  // 충돌 정보
  const discrepancies = useMemo(() => {
    if (!group || group.verificationStatus !== 'conflict') return [];
    return group.discrepancies || [];
  }, [group]);

  const isConflictHole = (slotIndex, course, hole) => {
    return discrepancies.some(
      d => d.playerSlot === slotIndex && d.course === course && d.hole === hole
    );
  };

  // 점수 변경
  const handleScoreChange = (slotIndex, course, holeIndex, value) => {
    const num = parseInt(value);
    const score = isNaN(num) ? null : Math.min(Math.max(num, 1), 12);

    setScores(prev => {
      const next = { ...prev };
      next[String(slotIndex)] = { ...next[String(slotIndex)] };
      next[String(slotIndex)][course] = [...next[String(slotIndex)][course]];
      next[String(slotIndex)][course][holeIndex] = score;
      return next;
    });
  };

  // 코스 합계
  const getCourseTotal = (slotIndex, course) => {
    const arr = scores[String(slotIndex)]?.[course];
    if (!arr) return null;
    const filled = arr.filter(v => v !== null);
    if (filled.length === 0) return null;
    return filled.reduce((a, b) => a + b, 0);
  };

  // 전체 미입력 홀 수
  const missingCount = useMemo(() => {
    let count = 0;
    if (!group) return 0;
    for (const player of group.players) {
      if (!player.name) continue; // 이름 없는 선수는 건너뛰기
      for (const course of courses) {
        const arr = scores[String(player.slot)]?.[course];
        if (!arr) continue;
        count += arr.filter(v => v === null).length;
      }
    }
    return count;
  }, [scores, group, courses]);

  // 이름이 있는 선수만 필터
  const activePlayers = useMemo(() => {
    if (!group) return [];
    return group.players.filter(p => p.name);
  }, [group]);

  // 제출
  const handleSubmit = async () => {
    if (missingCount > 0) {
      setShowValidation(true);
      return;
    }

    setIsSubmitting(true);
    try {
      // 이름 있는 선수의 점수만 제출
      const submitData = {};
      for (const player of activePlayers) {
        submitData[String(player.slot)] = scores[String(player.slot)];
      }
      await submitGroupScores(tournamentId, groupNumber, deviceId, nickname, submitData);
      onSubmitted();
    } catch (err) {
      alert('제출 실패: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !group || !tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <div className="sticky top-0 bg-white border-b shadow-sm z-20">
        <div className="flex items-center px-6 py-3">
          <button onClick={onBack} className="text-gray-600 hover:text-gray-800 mr-4 font-medium">← 뒤로</button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-green-800">{groupNumber}조 점수 입력</h1>
            <p className="text-sm text-gray-500">{group.course} | {activePlayers.length}명</p>
          </div>
        </div>
        {/* 코스 탭 */}
        <div className="flex border-t">
          {courses.map(c => (
            <button
              key={c}
              onClick={() => setActiveTab(c)}
              className={`flex-1 py-3 text-base font-medium border-b-2 transition-colors ${
                activeTab === c
                  ? 'text-green-700 border-green-600 bg-green-50'
                  : 'text-gray-400 border-transparent'
              }`}
            >
              {c}코스
              <span className="text-sm ml-1 opacity-60">
                (파{pars[c]?.reduce((a, b) => a + b, 0) || '-'})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 선수별 점수 테이블 */}
      <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
        <table className="w-full border-collapse bg-white rounded-xl border shadow-sm overflow-hidden">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 border-b w-32">선수</th>
              {Array.from({ length: 9 }, (_, i) => (
                <th key={i} className="px-1 py-3 text-center border-b w-14">
                  <div className="text-sm font-medium text-gray-600">{i + 1}H</div>
                  <div className="text-xs text-green-600">P{pars[activeTab]?.[i] || 4}</div>
                </th>
              ))}
              <th className="px-3 py-3 text-center text-sm font-bold text-gray-700 border-b w-16">합계</th>
            </tr>
          </thead>
          <tbody>
            {activePlayers.map(player => (
              <tr key={player.slot} className="border-b last:border-b-0 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{player.name}</span>
                    {player.gender && (
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        player.gender === '남' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
                      }`}>
                        {player.gender}
                      </span>
                    )}
                  </div>
                  {player.club && <div className="text-xs text-gray-400 mt-0.5">{player.club}</div>}
                </td>
                {Array.from({ length: 9 }, (_, i) => {
                  const val = scores[String(player.slot)]?.[activeTab]?.[i];
                  const isEmpty = val === null;
                  const conflict = isConflictHole(player.slot, activeTab, i + 1);

                  return (
                    <td key={i} className="px-1 py-2 text-center">
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={12}
                        value={val ?? ''}
                        onChange={e => handleScoreChange(player.slot, activeTab, i, e.target.value)}
                        className={`w-12 h-10 text-center text-sm font-medium rounded-lg outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                          conflict
                            ? 'bg-yellow-50 border-2 border-yellow-400'
                            : showValidation && isEmpty
                              ? 'bg-red-50 border-2 border-red-300'
                              : val !== null
                                ? 'bg-green-50 border border-green-300'
                                : 'bg-gray-50 border border-gray-200'
                        } focus:ring-2 focus:ring-green-400 focus:border-green-400`}
                      />
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-center">
                  <span className="text-base font-bold text-green-700">
                    {getCourseTotal(player.slot, activeTab) ?? '-'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 충돌 힌트 */}
        {discrepancies.filter(d => d.course === activeTab).length > 0 && (
          <div className="mt-4 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            노란색 홀에서 이전 두 기록이 불일치했습니다. 다시 확인해주세요.
          </div>
        )}

        {activePlayers.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            이 조에 등록된 선수가 없습니다
          </div>
        )}

        {/* 제출 영역 */}
        <div className="mt-6 flex items-center justify-between bg-white rounded-xl border shadow-sm px-6 py-4">
          <div className="text-base">
            {missingCount > 0 ? (
              <span className="text-red-500 font-medium">미입력: {missingCount}홀</span>
            ) : (
              <span className="text-green-600 font-bold">모든 홀 입력 완료</span>
            )}
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-8 py-3 rounded-xl font-medium text-base ${
              missingCount > 0
                ? 'bg-gray-300 text-gray-500'
                : 'bg-green-600 text-white hover:bg-green-700'
            } disabled:opacity-50`}
          >
            {isSubmitting ? '제출 중...' : '제출하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
