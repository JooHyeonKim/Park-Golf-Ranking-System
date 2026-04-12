import React, { useState, useMemo } from 'react';

const HOLES = 9;
const COURSE_TAB_LABELS = { A: 'A1', B: 'B1', C: 'C1', D: 'D1', E: 'A2', F: 'B2' };

// 홀별 점수 입력 모달 (일반 입력용)
// - 탭 순서: A → B → C → D (순방향)
// - 홀 순서: 1 → 9 (순방향)
// - 저장 시 detailScores + 코스 합계(scoreX) 자동 갱신
export default function HoleScoreModal({ player, holeCount, initialCourse, onSave, onClose }) {
  const courses = holeCount === 54 ? ['A', 'B', 'C', 'D', 'E', 'F']
               : holeCount >= 36   ? ['A', 'B', 'C', 'D']
               : holeCount === 27  ? ['A', 'B', 'C']
               : ['A', 'B'];

  const [activeCourse, setActiveCourse] = useState(
    initialCourse && courses.includes(initialCourse) ? initialCourse : courses[0]
  );
  const [scores, setScores] = useState(() => ({ ...(player.detailScores || {}) }));

  const handleScoreChange = (course, holeNum, value) => {
    const key = `${course}${holeNum}`;
    const numValue = value === '' ? null : parseInt(value, 10);
    setScores(prev => {
      const next = { ...prev };
      if (numValue === null) delete next[key];
      else next[key] = numValue;
      return next;
    });
  };

  const courseTotal = useMemo(() => {
    let sum = null;
    for (let h = 1; h <= 9; h++) {
      const v = scores[`${activeCourse}${h}`];
      if (v != null) { sum = (sum ?? 0) + v; }
    }
    return sum;
  }, [scores, activeCourse]);

  const handleSave = () => {
    const scoreUpdates = {};
    ['A', 'B', 'C', 'D', 'E', 'F'].forEach(c => {
      let sum = null;
      for (let h = 1; h <= 9; h++) {
        const v = scores[`${c}${h}`];
        if (v != null) { sum = (sum ?? 0) + v; }
      }
      if (sum !== null) scoreUpdates[`score${c}`] = sum;
    });
    onSave(player.id, { detailScores: scores, ...scoreUpdates });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-lg max-h-[90vh] bg-white rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-blue-600 text-white">
          <div>
            <h3 className="font-bold text-lg">홀별 점수 입력</h3>
            <span className="text-sm text-blue-100">{player.name}{player.club ? ` (${player.club})` : ''}</span>
          </div>
          <button onClick={onClose} className="text-white text-2xl leading-none px-2">&times;</button>
        </div>

        {/* 코스 탭 (A → D 순) */}
        <div className="flex border-b">
          {courses.map(c => (
            <button
              key={c}
              onClick={() => setActiveCourse(c)}
              className={`flex-1 py-2 font-medium text-center transition-colors ${
                activeCourse === c
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {holeCount === 54 ? COURSE_TAB_LABELS[c] : c}코스
            </button>
          ))}
        </div>

        {/* 점수 입력 그리드 (1 → 9 순) */}
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
                const holeNum = idx + 1;
                const key = `${activeCourse}${holeNum}`;
                return (
                  <tr key={holeNum} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="py-2 text-center font-medium">{holeNum}</td>
                    <td className="py-2 text-center">
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={scores[key] ?? ''}
                        onChange={(e) => handleScoreChange(activeCourse, holeNum, e.target.value)}
                        className="w-16 px-2 py-1 border rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-3 flex items-center px-2 py-2 bg-gray-100 rounded">
            <span className="font-semibold">
              {holeCount === 54 ? COURSE_TAB_LABELS[activeCourse] : activeCourse}코스 합계: {courseTotal ?? '-'}
            </span>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex gap-2 p-4 border-t">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
