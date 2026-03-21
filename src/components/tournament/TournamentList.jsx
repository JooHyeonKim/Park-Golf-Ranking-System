import React, { useState } from 'react';

// 총 조 수의 기본값 계산
function getDefaultGroupCount(holeCount) {
  return holeCount === 18 ? 18 : 36;
}

// 총 조 수의 최대값 계산
function getMaxGroupCount(holeCount) {
  return holeCount === 18 ? 18 : 36;
}

// 하위 호환: 기존 groupsPerCourse → groupCount 변환
function getTournamentGroupCount(tournament) {
  if (tournament.groupCount) return tournament.groupCount;
  const numCourses = (tournament.holeCount || 36) === 18 ? 2 : 4;
  return (tournament.groupsPerCourse || 9) * numCourses;
}

export default function TournamentList({ tournaments, onSelect, onDelete, onAdd, onViewSummary, onGoToClubs }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newHoleCount, setNewHoleCount] = useState(36);
  const [newGroupCount, setNewGroupCount] = useState(getDefaultGroupCount(36));

  const handleAdd = () => {
    if (!newName.trim()) {
      alert('대회명을 입력해주세요.');
      return;
    }
    onAdd(newName.trim(), newDate, newHoleCount, newGroupCount);
    setNewName('');
    setNewDate(new Date().toISOString().split('T')[0]);
    setNewHoleCount(36);
    setNewGroupCount(getDefaultGroupCount(36));
    setShowAddForm(false);
  };

  // 홀 수 변경 시 조 수도 기본값으로 리셋
  const handleHoleCountChange = (holeCount) => {
    setNewHoleCount(holeCount);
    setNewGroupCount(getDefaultGroupCount(holeCount));
  };

  const handleDelete = (id, name) => {
    if (confirm(`"${name}" 대회를 삭제하시겠습니까?`)) {
      onDelete(id);
    }
  };

  const maxGroups = getMaxGroupCount(newHoleCount);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 p-3 sm:p-4">
      {/* 헤더 */}
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2 sm:gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">파크골프 대회 관리</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-2 sm:px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-sm sm:text-base"
            >
              + 새 대회
            </button>
            <button
              onClick={onGoToClubs}
              className="px-3 py-2 sm:px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              클럽 관리
            </button>
          </div>
        </div>

        {/* 새 대회 추가 폼 */}
        {showAddForm && (
          <div className="bg-white rounded-xl p-3 sm:p-4 mb-4 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-3">새 대회 추가</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="대회명"
                className="px-3 py-2 sm:px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="px-3 py-2 sm:px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">홀 수 선택</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleHoleCountChange(18)}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      newHoleCount === 18
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    18홀
                  </button>
                  <button
                    type="button"
                    onClick={() => handleHoleCountChange(36)}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      newHoleCount === 36
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    36홀
                  </button>
                </div>
              </div>
              <div className="w-full sm:w-24">
                <label className="block text-sm font-medium text-gray-700 mb-2">조 수</label>
                <select
                  value={newGroupCount}
                  onChange={(e) => setNewGroupCount(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {Array.from({ length: maxGroups }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n}조</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  총 {newGroupCount * 4}명
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
              >
                추가
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 대회 목록 */}
        {tournaments.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-xl text-gray-600">등록된 대회가 없습니다</p>
            <p className="text-sm text-gray-400 mt-2">새 대회를 추가하여 시작하세요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tournaments.map(tournament => {
              const playerCount = tournament.players.filter(p => p.name && p.name.trim()).length;
              const groupCount = getTournamentGroupCount(tournament);

              return (
                <div
                  key={tournament.id}
                  className="bg-white rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-base sm:text-lg text-gray-800">📋 {tournament.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1 text-xs sm:text-sm text-gray-500">
                        <span>{tournament.date}</span>
                        <span>{tournament.holeCount || 36}홀 / {groupCount}조</span>
                        <span>참가: {playerCount}명</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onSelect(tournament.id)}
                        className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm"
                      >
                        보기
                      </button>
                      <button
                        onClick={() => onViewSummary(tournament.id)}
                        className="px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 text-sm"
                      >
                        집계
                      </button>
                      <button
                        onClick={() => handleDelete(tournament.id, tournament.name)}
                        className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 text-sm"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
