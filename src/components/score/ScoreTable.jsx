import React, { useState, useEffect, useRef } from 'react';
import { useRanking } from '../../hooks/useRanking';
import DetailScoreModal from './DetailScoreModal';

export default function ScoreTable({ tournament, clubs, onBack, onUpdatePlayer, onViewSummary }) {
  const is36Hole = (tournament.holeCount || 36) === 36;
  const [sortBy, setSortBy] = useState('group'); // 'rank' | 'group'
  const [isRankingCalculated, setIsRankingCalculated] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [detailModalPlayer, setDetailModalPlayer] = useState(null);
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
    const updates = { [field]: numValue };
    setIsRankingCalculated(false); // 점수 수정 시 순위 초기화
    onUpdatePlayer(tournament.id, playerId, updates);
  };

  const handleCalculateRanking = () => {
    setIsRankingCalculated(prev => !prev);
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
              onClick={() => onViewSummary()}
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
        </div>
      </div>

      {/* 점수 입력 표 */}
      <div className="px-4 pt-4">
        <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2">
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
              {sortedPlayers.map((player, index) => (
                <tr
                  key={player.id}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  {/* 조 */}
                  <td className="py-2 px-2 text-center border-r font-medium">{player.group}</td>

                  {/* 코스 */}
                  <td className="py-2 px-2 text-center border-r">{player.course}</td>

                  {/* 성명 */}
                  <td className="py-2 px-2 border-r">
                    <input
                      type="text"
                      value={player.name || ''}
                      onChange={(e) => handleInputChange(player.id, 'name', e.target.value)}
                      disabled={isRankingCalculated}
                      className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-green-500 ${isRankingCalculated ? 'bg-gray-100 text-gray-500' : ''}`}
                      placeholder="이름"
                    />
                  </td>

                  {/* 성별 */}
                  <td className="py-2 px-2 border-r">
                    <select
                      value={player.gender || ''}
                      onChange={(e) => handleInputChange(player.id, 'gender', e.target.value)}
                      disabled={isRankingCalculated}
                      className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-green-500 ${isRankingCalculated ? 'bg-gray-100 text-gray-500' : ''}`}
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
                      className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-green-500 ${isRankingCalculated ? 'bg-gray-100 text-gray-500' : ''}`}
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
                      className={`w-16 px-2 py-1 border rounded text-center focus:outline-none focus:ring-1 focus:ring-green-500 ${isRankingCalculated ? 'bg-gray-100 text-gray-500' : ''}`}
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
                      className={`w-16 px-2 py-1 border rounded text-center focus:outline-none focus:ring-1 focus:ring-green-500 ${isRankingCalculated ? 'bg-gray-100 text-gray-500' : ''}`}
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
                        className={`w-16 px-2 py-1 border rounded text-center focus:outline-none focus:ring-1 focus:ring-green-500 ${isRankingCalculated ? 'bg-gray-100 text-gray-500' : ''}`}
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
                        className={`w-16 px-2 py-1 border rounded text-center focus:outline-none focus:ring-1 focus:ring-green-500 ${isRankingCalculated ? 'bg-gray-100 text-gray-500' : ''}`}
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
                    {player.total ?? '-'}
                  </td>

                  {/* 순위 */}
                  <td className="py-2 px-2 text-center font-bold text-red-600 text-lg">
                    <div className="flex items-center justify-center gap-1">
                      <span>{player.rank ?? '-'}</span>
                      {isRankingCalculated && player.needsDetail && (
                        player.detailScores && Object.keys(player.detailScores).length > 0 ? (
                          <button
                            onClick={() => setDetailModalPlayer(player)}
                            className="ml-1 px-1.5 py-0.5 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                            title="동점자 - 상세 점수 입력 완료"
                          >
                            ✓
                          </button>
                        ) : (
                          <button
                            onClick={() => setDetailModalPlayer(player)}
                            className="ml-1 px-1.5 py-0.5 text-xs bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors animate-pulse"
                            title="동점자 - 상세 점수 입력 필요"
                          >
                            !
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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
    </div>
  );
}
