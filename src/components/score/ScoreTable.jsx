import React, { useState, useEffect, useRef } from 'react';
import { useRanking } from '../../hooks/useRanking';
import { countExtraPlayers } from '../../utils/data';
import DetailScoreModal from './DetailScoreModal';

// 코스명에서 기본 코스 추출 ("A-1-1" → "A-1", "A-1" → "A-1")
function getBaseCourse(course) {
  const parts = course.split('-');
  return `${parts[0]}-${parts[1]}`;
}

export default function ScoreTable({ tournament, clubs, onBack, onUpdatePlayer, onAddPlayerToCourse, onRemovePlayerFromCourse, onViewSummary, searchByName }) {
  const is36Hole = (tournament.holeCount || 36) === 36;
  const [sortBy, setSortBy] = useState('group'); // 'rank' | 'group'
  const [isRankingCalculated, setIsRankingCalculated] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [detailModalPlayer, setDetailModalPlayer] = useState(null);

  // 동명이인 선택 모달 상태
  const [duplicateMatches, setDuplicateMatches] = useState(null);
  const [duplicateTargetPlayerId, setDuplicateTargetPlayerId] = useState(null);

  const sortMenuRef = useRef(null);
  const { sortedPlayers: allSortedPlayers } = useRanking(tournament.players, sortBy, isRankingCalculated);
  // 18홀일 때 C/D 코스 선수 행 숨김
  const sortedPlayers = is36Hole
    ? allSortedPlayers
    : allSortedPlayers.filter(p => p.course.startsWith('A') || p.course.startsWith('B'));

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setIsSortMenuOpen(false);
      }
    };

    if (isSortMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSortMenuOpen]);

  const handleInputChange = (playerId, field, value) => {
    const updates = { [field]: value };
    onUpdatePlayer(tournament.id, playerId, updates);
  };

  const handleScoreChange = (playerId, field, value) => {
    // 빈 문자열이면 null, 아니면 숫자로 변환
    const numValue = value === '' ? null : parseInt(value, 10);
    if (numValue !== null && numValue > 100) return;
    const updates = { [field]: numValue };
    setIsRankingCalculated(false); // 점수 수정 시 순위 초기화

    onUpdatePlayer(tournament.id, playerId, updates);
  };

  const handleCalculateRanking = () => {
    setIsRankingCalculated(prev => !prev);
  };

  // 이름 입력 후 blur 시 자동완성
  const handleNameBlur = (playerId, nameValue) => {
    const trimmed = nameValue.trim();
    if (!trimmed || !searchByName) return;

    const matches = searchByName(trimmed);

    if (matches.length === 0) return;

    if (matches.length === 1) {
      const member = matches[0];
      onUpdatePlayer(tournament.id, playerId, {
        gender: member.gender,
        club: member.club
      });
      return;
    }

    // 동명이인 - 선택 모달 표시
    setDuplicateMatches(matches);
    setDuplicateTargetPlayerId(playerId);
  };

  // 동명이인 선택 처리
  const handleSelectDuplicate = (member) => {
    if (duplicateTargetPlayerId) {
      onUpdatePlayer(tournament.id, duplicateTargetPlayerId, {
        gender: member.gender,
        club: member.club
      });
    }
    setDuplicateMatches(null);
    setDuplicateTargetPlayerId(null);
  };

  // 테스트 데이터 생성
  const handleFillTestData = () => {
    const lastNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임'];
    const firstNames = ['민수', '영희', '철수', '지영', '현우', '수진', '동현', '미영', '성민', '혜진'];
    const clubList = clubs;

    tournament.players.forEach((player) => {
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const name = lastName + firstName;
      const gender = Math.random() > 0.5 ? '남' : '여';
      const club = clubList[Math.floor(Math.random() * clubList.length)];
      const scoreA = Math.floor(Math.random() * 15) + 20; // 20~34
      const scoreB = Math.floor(Math.random() * 15) + 20;

      const updates = { name, gender, club, scoreA, scoreB };
      if (is36Hole) {
        updates.scoreC = Math.floor(Math.random() * 15) + 20;
        updates.scoreD = Math.floor(Math.random() * 15) + 20;
      }

      onUpdatePlayer(tournament.id, player.id, updates);
    });

    setIsRankingCalculated(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 pb-4">
      {/* 헤더 */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-full mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={onBack}
              className="text-gray-700 hover:text-gray-900 font-bold text-lg"
            >
              ← 대회 목록
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-800 text-right">{tournament.name}</h2>
              <p className="text-sm text-gray-500 text-right">{tournament.date}</p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                if (isRankingCalculated) {
                  const missingPlayers = sortedPlayers.filter(
                    p => p.needsDetail && (!p.detailScores || Object.keys(p.detailScores).length === 0)
                  );
                  if (missingPlayers.length > 0) {
                    const names = missingPlayers.map(p => p.name || `(${p.course} ${p.group}조)`).join(', ');
                    if (!confirm(`백카운트 미입력 선수가 있습니다.\n${names}\n\n결과를 보시겠습니까?`)) return;
                  }
                }
                onViewSummary();
              }}
              className="flex-1 py-3 text-lg rounded-lg font-extrabold transition-colors bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg"
            >
              🏆 결과 보기
            </button>
            <button
              onClick={handleFillTestData}
              className="px-5 py-3 text-lg rounded-lg font-bold transition-colors bg-orange-500 text-white hover:bg-orange-600"
            >
              테스트 데이터
            </button>
            <button
              onClick={handleCalculateRanking}
              className={`px-5 py-3 text-lg rounded-lg font-bold transition-colors ${
                isRankingCalculated
                  ? 'bg-gray-500 text-white hover:bg-gray-600'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isRankingCalculated ? '수정하기' : '등수 계산하기'}
            </button>
            <div className="relative" ref={sortMenuRef}>
              <button
                onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                className="px-5 py-3 text-lg rounded-lg font-bold transition-colors bg-gray-300 text-gray-700 hover:bg-gray-400 flex items-center gap-1"
              >
                정렬: {sortBy === 'rank' ? '순위' : '조'}
                <span className="text-xs">▼</span>
              </button>
              {isSortMenuOpen && (
                <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[120px]">
                  <button
                    onClick={() => {
                      setSortBy('rank');
                      setIsSortMenuOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-100 rounded-t-lg ${
                      sortBy === 'rank' ? 'bg-green-50 font-semibold text-green-700' : 'text-gray-700'
                    }`}
                  >
                    순위
                  </button>
                  <button
                    onClick={() => {
                      setSortBy('group');
                      setIsSortMenuOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-100 rounded-b-lg ${
                      sortBy === 'group' ? 'bg-green-50 font-semibold text-green-700' : 'text-gray-700'
                    }`}
                  >
                    조
                  </button>
                </div>
              )}
            </div>
          </div>
          {(() => {
            if (!isRankingCalculated) return null;
            const missing = sortedPlayers.filter(
              p => p.needsDetail && (!p.detailScores || Object.keys(p.detailScores).length === 0)
            );
            if (missing.length === 0) return null;
            return (
              <p className="mt-2 text-sm font-semibold text-red-600">
                백카운트 미입력: {missing.map(p => p.name || `(${p.course} ${p.group}조)`).join(', ')}
              </p>
            );
          })()}
        </div>
      </div>

      {/* 점수 입력 표 */}
      <div className="px-4 pt-4">
        <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2">
                {!isRankingCalculated && <th className="bg-gray-300 py-3 px-1 border-r w-8"></th>}
                {/* 회색 그룹 */}
                <th className="bg-gray-300 py-3 px-2 text-center border-r">조</th>
                <th className="bg-gray-300 py-3 px-2 text-center border-r">코스</th>
                <th className="bg-gray-300 py-3 px-3 text-center border-r min-w-[50px]">성명</th>
                <th className="bg-gray-300 py-3 px-2 text-center border-r min-w-[50px]">성별</th>
                <th className="bg-gray-300 py-3 px-3 text-center border-r min-w-[80px]">클럽</th>

                {/* 하늘색 그룹 (A+B) */}
                <th className="bg-sky-200 py-3 px-2 text-center border-r">A코스</th>
                <th className="bg-sky-200 py-3 px-2 text-center border-r">B코스</th>
                <th className="bg-sky-300 py-3 px-2 text-center border-r">A+B</th>

                {/* 연두색 그룹 (C+D) - 36홀만 표시 */}
                {is36Hole && (
                  <>
                    <th className="bg-lime-200 py-3 px-2 text-center border-r">C코스</th>
                    <th className="bg-lime-200 py-3 px-2 text-center border-r">D코스</th>
                    <th className="bg-lime-300 py-3 px-2 text-center border-r">C+D</th>
                  </>
                )}

                {/* 노란색 (합계) */}
                <th className="bg-yellow-200 py-3 px-2 text-center border-r">{is36Hole ? '36홀 합계' : '18홀 합계'}</th>

                {/* 회색 (순위) */}
                <th className="bg-gray-300 py-3 px-2 text-center min-w-[60px]">순위</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const rows = [];
                const showAddButton = sortBy === 'group' && !isRankingCalculated;
                let playerRowIndex = 0;

                for (let i = 0; i < sortedPlayers.length; i++) {
                  const player = sortedPlayers[i];
                  const rowClass = playerRowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50';
                  playerRowIndex++;

                  const isExtraPlayer = player.course.split('-').length >= 3;

                  rows.push(
                    <tr key={player.id} className={rowClass}>
                      {!isRankingCalculated && (
                        <td className="py-2 px-1 text-center border-r w-8">
                          {isExtraPlayer && (
                            <button
                              onClick={() => onRemovePlayerFromCourse(tournament.id, player.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                              title="추가 선수 제거"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                        </td>
                      )}
                      {/* 조 */}
                      <td className="py-2 px-2 text-center border-r font-medium">{isExtraPlayer ? `${player.group}-1` : player.group}</td>

                      {/* 코스 */}
                      <td className="py-2 px-2 text-center border-r">{player.course}</td>

                      {/* 성명 */}
                      <td className="py-2 px-2 border-r">
                        <input
                          type="text"
                          value={player.name || ''}
                          onChange={(e) => handleInputChange(player.id, 'name', e.target.value)}
                          onBlur={(e) => handleNameBlur(player.id, e.target.value)}
                          disabled={isRankingCalculated}
                          className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-green-500 ${isRankingCalculated ? 'bg-gray-50 text-gray-700' : ''}`}
                          placeholder="이름"
                        />
                      </td>

                      {/* 성별 */}
                      <td className="py-2 px-2 border-r">
                        <select
                          value={player.gender || ''}
                          onChange={(e) => handleInputChange(player.id, 'gender', e.target.value)}
                          disabled={isRankingCalculated}
                          className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-green-500 ${isRankingCalculated ? 'bg-gray-50 text-gray-700' : ''}`}
                        >
                          <option value="">-</option>
                          <option value="남">남</option>
                          <option value="여">여</option>
                        </select>
                      </td>

                      {/* 클럽 */}
                      <td className="py-2 px-2 border-r">
                        <select
                          value={player.club || ''}
                          onChange={(e) => handleInputChange(player.id, 'club', e.target.value)}
                          disabled={isRankingCalculated}
                          className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-green-500 ${isRankingCalculated ? 'bg-gray-50 text-gray-700' : ''}`}
                        >
                          <option value="">-</option>
                          {clubs.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </td>

                      {/* A코스 */}
                      <td className="py-2 px-2 border-r">
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={player.scoreA ?? ''}
                          onChange={(e) => handleScoreChange(player.id, 'scoreA', e.target.value)}
                          disabled={isRankingCalculated}
                          className={`w-16 px-2 py-1 border rounded text-center focus:outline-none focus:ring-1 focus:ring-green-500 ${isRankingCalculated ? 'bg-gray-50 text-gray-700' : ''}`}
                        />
                      </td>

                      {/* B코스 */}
                      <td className="py-2 px-2 border-r">
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={player.scoreB ?? ''}
                          onChange={(e) => handleScoreChange(player.id, 'scoreB', e.target.value)}
                          disabled={isRankingCalculated}
                          className={`w-16 px-2 py-1 border rounded text-center focus:outline-none focus:ring-1 focus:ring-green-500 ${isRankingCalculated ? 'bg-gray-50 text-gray-700' : ''}`}
                        />
                      </td>

                      {/* A+B */}
                      <td className="py-2 px-2 text-center border-r font-semibold bg-sky-50">
                        {player.ab ?? '-'}
                      </td>

                      {/* C코스 - 36홀만 표시 */}
                      {is36Hole && (
                        <td className="py-2 px-2 border-r">
                          <input
                            type="number"
                            min="1"
                            max="12"
                            value={player.scoreC ?? ''}
                            onChange={(e) => handleScoreChange(player.id, 'scoreC', e.target.value)}
                            disabled={isRankingCalculated}
                            className={`w-16 px-2 py-1 border rounded text-center focus:outline-none focus:ring-1 focus:ring-green-500 ${isRankingCalculated ? 'bg-gray-50 text-gray-700' : ''}`}
                          />
                        </td>
                      )}

                      {/* D코스 - 36홀만 표시 */}
                      {is36Hole && (
                        <td className="py-2 px-2 border-r">
                          <input
                            type="number"
                            min="1"
                            max="12"
                            value={player.scoreD ?? ''}
                            onChange={(e) => handleScoreChange(player.id, 'scoreD', e.target.value)}
                            disabled={isRankingCalculated}
                            className={`w-16 px-2 py-1 border rounded text-center focus:outline-none focus:ring-1 focus:ring-green-500 ${isRankingCalculated ? 'bg-gray-50 text-gray-700' : ''}`}
                          />
                        </td>
                      )}

                      {/* C+D - 36홀만 표시 */}
                      {is36Hole && (
                        <td className="py-2 px-2 text-center border-r font-semibold bg-lime-50">
                          {player.cd ?? '-'}
                        </td>
                      )}

                      {/* 36홀 합계 */}
                      <td className="py-2 px-2 text-center border-r font-bold bg-yellow-50 text-lg">
                        <div className="flex items-center justify-center gap-1">
                          <span>{player.total ?? '-'}</span>
                          {isRankingCalculated && player.needsDetail && (
                            player.detailScores && Object.keys(player.detailScores).length > 0 ? (
                              <button
                                onClick={() => setDetailModalPlayer(player)}
                                className="ml-1 px-1.5 py-0.5 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors whitespace-nowrap"
                                title="동점자 - 백카운트 입력 완료"
                              >
                                백카운트 ✓
                              </button>
                            ) : (
                              <button
                                onClick={() => setDetailModalPlayer(player)}
                                className="ml-1 px-1.5 py-0.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors animate-pulse whitespace-nowrap"
                                title="동점자 - 백카운트 입력 필요"
                              >
                                백카운트
                              </button>
                            )
                          )}
                        </div>
                      </td>

                      {/* 순위 */}
                      <td className="py-2 px-2 text-center font-bold text-red-600 text-lg">
                        {player.rank ?? '-'}
                      </td>
                    </tr>
                  );

                  // 코스 그룹 경계에서 "+ 선수 추가" 버튼 삽입
                  if (showAddButton) {
                    const baseCourse = getBaseCourse(player.course);
                    const nextPlayer = sortedPlayers[i + 1];
                    const isLastInGroup = !nextPlayer || getBaseCourse(nextPlayer.course) !== baseCourse;

                    if (isLastInGroup) {
                      const extraCount = countExtraPlayers(tournament.players, baseCourse);
                      if (extraCount < 4) {
                        rows.push(
                          <tr key={`add-${baseCourse}`} className="bg-gray-100">
                            <td colSpan={is36Hole ? 14 : 11} className="py-1 text-center">
                              <button
                                onClick={() => onAddPlayerToCourse(tournament.id, baseCourse, player.group)}
                                className="px-3 py-1 text-xs text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                title={`${baseCourse} 선수 추가`}
                              >
                                + 선수 추가
                              </button>
                            </td>
                          </tr>
                        );
                      }
                    }
                  }
                }

                return rows;
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* 동점자 상세 점수 입력 모달 */}
      {detailModalPlayer && (
        <DetailScoreModal
          player={detailModalPlayer}
          is36Hole={is36Hole}
          onSave={(playerId, updates) => {
            onUpdatePlayer(tournament.id, playerId, updates);
          }}
          onClose={() => setDetailModalPlayer(null)}
        />
      )}

      {/* 동명이인 선택 모달 */}
      {duplicateMatches && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setDuplicateMatches(null); setDuplicateTargetPlayerId(null); }} />
          <div className="relative w-full max-w-sm bg-white rounded-t-2xl sm:rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b bg-green-600 text-white">
              <h3 className="font-bold text-lg">동명이인 선택</h3>
              <span className="text-sm text-green-100">같은 이름의 회원이 {duplicateMatches.length}명 있습니다</span>
            </div>
            <div className="divide-y max-h-60 overflow-y-auto">
              {duplicateMatches.map(member => (
                <button
                  key={member.id}
                  onClick={() => handleSelectDuplicate(member)}
                  className="w-full px-4 py-3 text-left hover:bg-green-50 transition-colors flex items-center gap-2"
                >
                  <span className="font-medium">{member.name}</span>
                  <span className={`text-sm px-1.5 py-0.5 rounded ${
                    member.gender === '남' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                  }`}>
                    {member.gender}
                  </span>
                  <span className="text-gray-500">{member.club}</span>
                  {member.birthDate && (
                    <span className="text-sm text-gray-400">{member.birthDate}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="p-4 border-t">
              <button
                onClick={() => { setDuplicateMatches(null); setDuplicateTargetPlayerId(null); }}
                className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                취소 (직접 입력)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
