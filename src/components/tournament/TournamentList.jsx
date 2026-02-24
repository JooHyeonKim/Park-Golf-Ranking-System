import { useState } from 'react';

export default function TournamentList({ tournaments, onSelect, onDelete, onAdd, onViewSummary, onGoToClubs }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newHoleCount, setNewHoleCount] = useState(36);

  const handleAdd = () => {
    if (!newName.trim()) {
      alert('대회명을 입력해주세요.');
      return;
    }
    onAdd(newName.trim(), newDate, newHoleCount);
    setNewName('');
    setNewDate(new Date().toISOString().split('T')[0]);
    setNewHoleCount(36);
    setShowAddForm(false);
  };

  const handleDelete = (id, name) => {
    if (confirm(`"${name}" 대회를 삭제하시겠습니까?`)) {
      onDelete(id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">파크골프 대회 관리</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              + 새 대회
            </button>
            <button
              onClick={onGoToClubs}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              클럽 관리
            </button>
          </div>
        </div>

        {/* 새 대회 추가 폼 */}
        {showAddForm && (
          <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border">
            <h3 className="font-bold text-lg text-gray-800 mb-4">새 대회 추가</h3>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">대회명</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="대회명"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
              </div>
              <div className="w-48">
                <label className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="w-40">
                <label className="block text-sm font-medium text-gray-700 mb-1">홀 수</label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setNewHoleCount(18)}
                    className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
                      newHoleCount === 18
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    18홀
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewHoleCount(36)}
                    className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
                      newHoleCount === 36
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    36홀
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                >
                  추가
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 대회 목록 */}
        {tournaments.length === 0 ? (
          <div className="bg-white rounded-xl p-16 text-center shadow-sm border">
            <p className="text-xl text-gray-600">등록된 대회가 없습니다</p>
            <p className="text-gray-400 mt-2">새 대회를 추가하여 시작하세요</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-6 py-3 font-semibold text-gray-700">대회명</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700 w-32">날짜</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700 w-20">홀 수</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700 w-24">참가자</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700 w-60">작업</th>
                </tr>
              </thead>
              <tbody>
                {tournaments.map(tournament => {
                  const playerCount = tournament.players.filter(p => p.name && p.name.trim()).length;

                  return (
                    <tr
                      key={tournament.id}
                      className="border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-800">{tournament.name}</span>
                      </td>
                      <td className="text-center px-4 py-4 text-gray-600">{tournament.date}</td>
                      <td className="text-center px-4 py-4 text-gray-600">{tournament.holeCount || 36}홀</td>
                      <td className="text-center px-4 py-4 text-gray-600">{playerCount}명</td>
                      <td className="text-center px-4 py-4">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => onSelect(tournament.id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                          >
                            점수 입력
                          </button>
                          <button
                            onClick={() => onViewSummary(tournament.id)}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                          >
                            집계
                          </button>
                          <button
                            onClick={() => handleDelete(tournament.id, tournament.name)}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
