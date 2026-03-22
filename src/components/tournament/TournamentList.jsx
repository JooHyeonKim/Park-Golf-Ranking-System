import { useState } from 'react';

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

export default function TournamentList({ tournaments, onSelect, onDelete, onAdd, onViewSummary, onGoToClubs, onGoToAffiliations, onCollab, onBack }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newHoleCount, setNewHoleCount] = useState(36);
  const [newGroupCount, setNewGroupCount] = useState(getDefaultGroupCount(36));
  const [newClubType, setNewClubType] = useState('club');

  const handleAdd = () => {
    if (!newName.trim()) {
      alert('대회명을 입력해주세요.');
      return;
    }
    onAdd(newName.trim(), newDate, newHoleCount, newGroupCount, newClubType);
    setNewName('');
    setNewDate(new Date().toISOString().split('T')[0]);
    setNewHoleCount(36);
    setNewGroupCount(getDefaultGroupCount(36));
    setNewClubType('club');
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
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 p-3 sm:p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* 상단: 협동입력 (우측) */}
        {onCollab && (
          <div className="flex justify-end mb-2">
            <button
              onClick={onCollab}
              className="px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-900 rounded-full font-bold hover:from-amber-500 hover:to-yellow-400 transition-all text-xs sm:text-sm animate-gold-glow"
            >
              🤝 협동 입력 모드
            </button>
          </div>
        )}

        {/* 메인 제목 */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-800">⛳ 파크골프 스코어 집계 프로그램</h1>
        </div>

        {/* 대회 관리 버튼 */}
        <div className="flex gap-2 sm:gap-3 mb-3 sm:mb-4">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-2 sm:px-5 sm:py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-sm sm:text-base"
          >
            + 새 대회
          </button>
          <button
            onClick={onGoToClubs}
            className="px-3 py-2 sm:px-5 sm:py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            클럽 관리
          </button>
          <button
            onClick={onGoToAffiliations}
            className="px-3 py-2 sm:px-5 sm:py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm sm:text-base"
          >
            소속 관리
          </button>
        </div>

        {/* 새 대회 추가 폼 */}
        {showAddForm && (
          <div className="bg-white rounded-xl p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 shadow-sm border">
            <h3 className="font-bold text-lg text-gray-800 mb-3 sm:mb-4">새 대회 추가</h3>
            <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-4">
              <div className="w-full md:flex-1">
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
              <div className="w-full md:w-48">
                <label className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="w-full md:w-40">
                <label className="block text-sm font-medium text-gray-700 mb-1">홀 수</label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleHoleCountChange(18)}
                    className={`flex-1 py-2 sm:py-2.5 rounded-lg font-medium transition-colors ${
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
                    className={`flex-1 py-2 sm:py-2.5 rounded-lg font-medium transition-colors ${
                      newHoleCount === 36
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    36홀
                  </button>
                </div>
              </div>
              <div className="w-full md:w-28">
                <label className="block text-sm font-medium text-gray-700 mb-1">조 수</label>
                <select
                  value={newGroupCount}
                  onChange={(e) => setNewGroupCount(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 sm:py-2.5 border border-gray-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {Array.from({ length: maxGroups }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n}조</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  총 {newGroupCount * 4}명
                </p>
              </div>
              <div className="w-full md:w-40">
                <label className="block text-sm font-medium text-gray-700 mb-1">구분</label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setNewClubType('club')}
                    className={`flex-1 py-2 sm:py-2.5 rounded-lg font-medium transition-colors ${
                      newClubType === 'club'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    클럽
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewClubType('affiliation')}
                    className={`flex-1 py-2 sm:py-2.5 rounded-lg font-medium transition-colors ${
                      newClubType === 'affiliation'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    소속
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  className="px-4 py-2 sm:px-6 sm:py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                >
                  추가
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 sm:px-6 sm:py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
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
          <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-6 py-3 font-semibold text-gray-700">대회명</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700 w-32">날짜</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700 w-20">홀 수</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700 w-20">조 수</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700 w-24">참가자</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700 w-60">작업</th>
                </tr>
              </thead>
              <tbody>
                {tournaments.map(tournament => {
                  const playerCount = tournament.players.filter(p => p.name && p.name.trim()).length;
                  const groupCount = getTournamentGroupCount(tournament);

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
                      <td className="text-center px-4 py-4 text-gray-600">{groupCount}조 / {tournament.clubType === 'affiliation' ? '소속' : '클럽'}</td>
                      <td className="text-center px-4 py-4 text-gray-600">{playerCount}명</td>
                      <td className="text-center px-4 py-4">
                        <div className="flex gap-2 justify-center items-center">
                          <button
                            onClick={() => onSelect(tournament.id)}
                            className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => onViewSummary(tournament.id)}
                            className="px-4 py-2 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 transition-colors"
                          >
                            집계 보기
                          </button>
                          <button
                            onClick={() => handleDelete(tournament.id, tournament.name)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="삭제"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
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
