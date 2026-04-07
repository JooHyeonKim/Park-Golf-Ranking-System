import { useState } from 'react';
import { useSubscriptionContext } from '../../contexts/SubscriptionContext';

// 총 조 수의 기본값 계산
function getDefaultGroupCount(holeCount) {
  if (holeCount === 18) return 18;
  if (holeCount === 27) return 27;
  if (holeCount === 54) return 54;
  return 36;
}

// 총 조 수의 최대값 계산
function getMaxGroupCount(holeCount) {
  if (holeCount === 18) return 18;
  if (holeCount === 27) return 27;
  if (holeCount === 54) return 54;
  return 36;
}

// 하위 호환: 기존 groupsPerCourse → groupCount 변환
function getTournamentGroupCount(tournament) {
  if (tournament.groupCount) return tournament.groupCount;
  const hc = tournament.holeCount || 36;
  const numCourses = hc === 18 ? 2 : hc === 27 ? 3 : hc === 54 ? 6 : 4;
  return (tournament.groupsPerCourse || 9) * numCourses;
}

export default function TournamentList({ tournaments, onSelect, onDelete, onAdd, onViewSummary, onGoToClubs, onGoToAffiliations, onCollab, isAuthenticated, displayName, userEmail, onLogin, onProfile }) {
  const { isActive } = useSubscriptionContext();
  const isVip = isActive;
  const [clubTypeFilter, setClubTypeFilter] = useState('club');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newHoleCount, setNewHoleCount] = useState(36);
  const [newGroupCount, setNewGroupCount] = useState(getDefaultGroupCount(36));
  const [newClubType, setNewClubType] = useState('club');

  const filteredTournaments = tournaments.filter(t => (t.clubType || 'club') === clubTypeFilter);

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
    setNewClubType(clubTypeFilter);
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
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 p-3 sm:p-4 pb-32 sm:pb-36">
      <div className="max-w-4xl mx-auto">
        {/* 상단: 협동입력 (좌) + 클럽/소속 관리 (우) */}
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          {onCollab ? (
            <button
              onClick={onCollab}
              className="px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-900 rounded-full font-bold hover:from-amber-500 hover:to-yellow-400 transition-all text-xs sm:text-sm animate-gold-glow"
            >
              🤝 협동 입력 모드
            </button>
          ) : <div />}
          <div className="flex gap-2">
            <button
              onClick={onGoToClubs}
              className="px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-sky-400 to-blue-400 text-white rounded-full font-bold hover:from-sky-500 hover:to-blue-500 transition-all text-xs sm:text-sm"
            >
              🏷️ 클럽 관리
            </button>
            <button
              onClick={onGoToAffiliations}
              className="px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-violet-400 to-indigo-400 text-white rounded-full font-bold hover:from-violet-500 hover:to-indigo-500 transition-all text-xs sm:text-sm"
            >
              🏢 소속 관리
            </button>
            {isAuthenticated ? (
              <button
                onClick={onProfile}
                className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-full font-bold transition-all text-xs sm:text-sm relative ${
                  isVip
                    ? 'bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 text-amber-900 hover:from-yellow-600 hover:via-amber-500 hover:to-yellow-600 shadow-lg animate-gold-glow'
                    : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700'
                }`}
              >
                {isVip && <span className="overflow-hidden rounded-full absolute inset-0 pointer-events-none"><span className="animate-vip-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"></span></span>}
                {isVip && <span className="animate-vip-crown absolute -top-3 -left-1 text-base sm:text-lg drop-shadow-md">👑</span>}
                {!isVip && '👤 '}{displayName || '프로필'}
                {isVip && <span className="ml-1 px-1.5 py-0.5 bg-amber-900/20 rounded text-[10px] sm:text-xs font-black tracking-wider">VIP</span>}
              </button>
            ) : (
              <button
                onClick={onLogin}
                className="px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-bold hover:from-green-600 hover:to-emerald-600 transition-all text-xs sm:text-sm"
              >
                🔑 로그인
              </button>
            )}
          </div>
        </div>

        {/* 메인 제목 */}
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-[clamp(1.1rem,5vw,2.25rem)] sm:text-3xl md:text-4xl font-extrabold text-gray-800 whitespace-nowrap">⛳ 파크골프 스코어 집계 프로그램</h1>
        </div>

        {/* 클럽/소속 탭 */}
        <div className="mb-4">
          <div className="inline-flex rounded-lg overflow-hidden">
            <button
              onClick={() => { setClubTypeFilter('club'); setNewClubType('club'); }}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 font-bold text-xs sm:text-sm transition-colors ${
                clubTypeFilter === 'club'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-500 hover:bg-gray-100'
              }`}
            >
              🏷️ 클럽
            </button>
            <button
              onClick={() => { setClubTypeFilter('affiliation'); setNewClubType('affiliation'); }}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 font-bold text-xs sm:text-sm transition-colors ${
                clubTypeFilter === 'affiliation'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-500 hover:bg-gray-100'
              }`}
            >
              🏢 소속
            </button>
          </div>
        </div>

        {/* 새 대회 추가 폼 */}
        {showAddForm && (
          <div className="bg-white rounded-xl p-4 sm:p-5 mb-4 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4 text-lg">새 대회 추가</h3>

            {/* 대회명 + 날짜 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="대회명"
                className="px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
              />
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
              />
            </div>

            {/* 옵션 선택 영역 */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {/* 홀 수 */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1.5">홀 수</label>
                <select
                  value={newHoleCount}
                  onChange={(e) => handleHoleCountChange(parseInt(e.target.value, 10))}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-center text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value={18}>18홀</option>
                  <option value={27}>27홀</option>
                  <option value={36}>36홀</option>
                  <option value={54}>54홀</option>
                </select>
              </div>

              {/* 구분 */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1.5">구분</label>
                <div className="inline-flex rounded-lg overflow-hidden border border-gray-300 w-full">
                  <button
                    type="button"
                    onClick={() => setNewClubType('club')}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      newClubType === 'club'
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    클럽
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewClubType('affiliation')}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      newClubType === 'affiliation'
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    소속
                  </button>
                </div>
              </div>

              {/* 조 수 */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1.5">조 수</label>
                <select
                  value={newGroupCount}
                  onChange={(e) => setNewGroupCount(parseInt(e.target.value, 10))}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-center text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {Array.from({ length: maxGroups }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n}조</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors"
              >
                대회 추가
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-6 py-2.5 bg-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 새 대회 버튼 */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-2 sm:px-4 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors text-sm sm:text-base"
          >
            + 새 대회
          </button>
        </div>

        {/* 대회 목록 */}
        {filteredTournaments.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-xl text-gray-600">등록된 {clubTypeFilter === 'affiliation' ? '소속' : '클럽'} 대회가 없습니다</p>
            <p className="text-sm text-gray-400 mt-2">새 대회를 추가하여 시작하세요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTournaments.map(tournament => {
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
                        <span>{tournament.holeCount || 36}홀 / {groupCount}조 / {tournament.clubType === 'affiliation' ? '소속' : '클럽'}</span>
                        <span>참가: {playerCount}명</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="flex gap-2">
                        <button
                          onClick={() => onSelect(tournament.id)}
                          className="px-4 py-2 bg-amber-500 text-white rounded-lg font-bold hover:bg-amber-600 transition-colors text-sm"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => onViewSummary(tournament.id)}
                          className="px-4 py-2 bg-teal-500 text-white rounded-lg font-bold hover:bg-teal-600 transition-colors text-sm"
                        >
                          집계 보기
                        </button>
                      </div>
                      <button
                        onClick={() => handleDelete(tournament.id, tournament.name)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-auto sm:ml-0"
                        title="삭제"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
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
