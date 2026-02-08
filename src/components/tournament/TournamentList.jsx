import React, { useState } from 'react';

export default function TournamentList({ tournaments, onSelect, onDelete, onAdd }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

  const handleAdd = () => {
    if (newName.trim()) {
      onAdd(newName.trim(), newDate);
      setNewName('');
      setNewDate(new Date().toISOString().split('T')[0]);
      setShowAddForm(false);
    }
  };

  const handleDelete = (id, name) => {
    if (confirm(`"${name}" 대회를 삭제하시겠습니까?`)) {
      onDelete(id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 p-4">
      {/* 헤더 */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">파크골프 대회 관리</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            + 새 대회
          </button>
        </div>

        {/* 새 대회 추가 폼 */}
        {showAddForm && (
          <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-3">새 대회 추가</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="대회명"
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
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

              return (
                <div
                  key={tournament.id}
                  className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800">📋 {tournament.name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span>{tournament.date}</span>
                        <span>참가: {playerCount}명</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onSelect(tournament.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                      >
                        보기
                      </button>
                      <button
                        onClick={() => handleDelete(tournament.id, tournament.name)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
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
