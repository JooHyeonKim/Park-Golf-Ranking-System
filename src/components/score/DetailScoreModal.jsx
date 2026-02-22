import React, { useState, useMemo } from 'react';

const HOLES = 9;

export default function DetailScoreModal({ player, is36Hole, onSave, onClose, readOnly = false }) {
  const courses = is36Hole ? ['D', 'C', 'B', 'A'] : ['B', 'A'];
  const [activeCourse, setActiveCourse] = useState(courses[0]);
  const [scores, setScores] = useState(() => player.detailScores || {});

  const courseScoreMap = {
    A: player.scoreA,
    B: player.scoreB,
    C: player.scoreC,
    D: player.scoreD,
  };

  const handleScoreChange = (course, holeNum, value) => {
    const key = `${course}${holeNum}`;
    const numValue = value === '' ? null : parseInt(value, 10);
    setScores(prev => ({ ...prev, [key]: numValue }));
  };

  const courseTotal = useMemo(() => {
    let sum = 0;
    let hasAny = false;
    for (let h = 1; h <= 9; h++) {
      const val = scores[`${activeCourse}${h}`];
      if (val != null) {
        sum += val;
        hasAny = true;
      }
    }
    return hasAny ? sum : null;
  }, [scores, activeCourse]);

  const expectedTotal = courseScoreMap[activeCourse];
  const hasMismatch = courseTotal !== null && expectedTotal !== null && courseTotal !== expectedTotal;
  const isMatch = courseTotal !== null && expectedTotal !== null && courseTotal === expectedTotal;

  const handleSave = () => {
    onSave(player.id, { detailScores: scores });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* 모달 */}
      <div className="relative w-full max-w-lg max-h-[90vh] bg-white rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-green-600 text-white">
          <div>
            <h3 className="font-bold text-lg">홀별 상세 점수</h3>
            <span className="text-sm text-green-100">{player.name}{player.club ? ` (${player.club})` : ''}</span>
          </div>
          <button onClick={onClose} className="text-white text-2xl leading-none px-2">&times;</button>
        </div>

        {/* 코스 탭 */}
        <div className="flex border-b">
          {courses.map(c => (
            <button
              key={c}
              onClick={() => setActiveCourse(c)}
              className={`flex-1 py-2 font-medium text-center transition-colors ${
                activeCourse === c
                  ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {c}코스
            </button>
          ))}
        </div>

        {/* 점수 입력 그리드 */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-center w-16">홀</th>
                <th className="py-2 text-center">타수</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: HOLES }, (_, idx) => {
                const holeNum = HOLES - idx;
                const key = `${activeCourse}${holeNum}`;
                return (
                  <tr key={holeNum} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="py-2 text-center font-medium">{holeNum}</td>
                    <td className="py-2 text-center">
                      {readOnly ? (
                        <span className="font-semibold">{scores[key] ?? '-'}</span>
                      ) : (
                        <input
                          type="number"
                          min={1}
                          max={12}
                          value={scores[key] ?? ''}
                          onChange={(e) => handleScoreChange(activeCourse, holeNum, e.target.value)}
                          className="w-16 px-2 py-1 border rounded text-center focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* 코스 합계 + 검증 */}
          <div className="mt-3 flex items-center justify-between px-2 py-2 bg-gray-100 rounded">
            <span className="font-semibold">
              {activeCourse}코스 합계: {courseTotal ?? '-'}
            </span>
            {hasMismatch && (
              <span className="text-red-500 text-xs">
                코스 점수({expectedTotal})와 불일치
              </span>
            )}
            {isMatch && (
              <span className="text-green-600 text-xs font-medium">일치</span>
            )}
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex gap-2 p-4 border-t">
          <button
            onClick={onClose}
            className={`flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors`}
          >
            {readOnly ? '닫기' : '취소'}
          </button>
          {!readOnly && (
            <button
              onClick={handleSave}
              className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              저장
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
