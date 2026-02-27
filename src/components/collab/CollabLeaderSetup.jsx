import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { useCollabTournament } from '../../hooks/useCollabTournament';

const STEPS = ['대회 정보', '파 설정', '클럽/선수 등록', '완료'];

export default function CollabLeaderSetup({ searchByName, onComplete, onBack }) {
  const { user } = useAuthContext();
  const [step, setStep] = useState(0);
  const [tournamentId, setTournamentId] = useState(null);
  const [tournamentCode, setTournamentCode] = useState('');

  // Step 1: 대회 정보
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [holeCount, setHoleCount] = useState(36);

  // Step 2: 파 설정
  const [parA, setParA] = useState(Array(9).fill(4));
  const [parB, setParB] = useState(Array(9).fill(4));
  const [parC, setParC] = useState(Array(9).fill(4));
  const [parD, setParD] = useState(Array(9).fill(4));
  const [parTab, setParTab] = useState('A');

  // Step 3: 클럽/선수 편집
  const [clubs, setClubs] = useState([]);
  const [newClubName, setNewClubName] = useState('');
  const [editGroupNumber, setEditGroupNumber] = useState(null);

  const {
    tournament,
    groups,
    isLoading,
    error,
    createTournament,
    updatePars,
    updateClubs,
    updatePlayers,
    activate,
  } = useCollabTournament(tournamentId, user?.id);

  const [isCreating, setIsCreating] = useState(false);

  // ==================== Step 1: 대회 생성 ====================
  const handleCreateTournament = async () => {
    if (!name.trim()) return;
    setIsCreating(true);
    try {
      const result = await createTournament({ name: name.trim(), date, holeCount });
      setTournamentId(result.id);
      setTournamentCode(result.code);
      setStep(1);
    } catch (err) {
      alert('대회 생성 실패: ' + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  // ==================== Step 2: 파 저장 ====================
  const handleSavePars = async () => {
    const updates = {
      parA,
      parB,
      parC: holeCount === 36 ? parC : null,
      parD: holeCount === 36 ? parD : null,
    };
    await updatePars(updates);
    setStep(2);
  };

  const getParArray = (course) => {
    switch (course) {
      case 'A': return [parA, setParA];
      case 'B': return [parB, setParB];
      case 'C': return [parC, setParC];
      case 'D': return [parD, setParD];
      default: return [parA, setParA];
    }
  };

  const handleParChange = (course, holeIndex, value) => {
    const [arr, setArr] = getParArray(course);
    const next = [...arr];
    const num = parseInt(value) || 0;
    next[holeIndex] = Math.min(Math.max(num, 3), 5);
    setArr(next);
  };

  // ==================== Step 3: 클럽/선수 ====================
  const handleAddClub = async () => {
    const trimmed = newClubName.trim();
    if (!trimmed || clubs.includes(trimmed)) return;
    const next = [...clubs, trimmed];
    setClubs(next);
    await updateClubs(next);
    setNewClubName('');
  };

  const handleRemoveClub = async (clubName) => {
    const next = clubs.filter(c => c !== clubName);
    setClubs(next);
    await updateClubs(next);
  };

  // 선수 이름 변경
  const handlePlayerNameChange = (groupNum, slotIndex, value) => {
    const group = groups.find(g => g.groupNumber === groupNum);
    if (!group) return;
    const players = group.players.map(p =>
      p.slot === slotIndex ? { ...p, name: value } : p
    );
    updatePlayers(groupNum, players);
  };

  // 선수 이름 blur → 자동완성
  const handlePlayerNameBlur = (groupNum, slotIndex, value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const matches = searchByName(trimmed);
    if (matches.length === 1) {
      const member = matches[0];
      const group = groups.find(g => g.groupNumber === groupNum);
      if (!group) return;
      const players = group.players.map(p =>
        p.slot === slotIndex
          ? { ...p, name: trimmed, gender: member.gender, club: member.club }
          : p
      );
      updatePlayers(groupNum, players);
    }
  };

  // 선수 성별/클럽 변경
  const handlePlayerFieldChange = (groupNum, slotIndex, field, value) => {
    const group = groups.find(g => g.groupNumber === groupNum);
    if (!group) return;
    const players = group.players.map(p =>
      p.slot === slotIndex ? { ...p, [field]: value } : p
    );
    updatePlayers(groupNum, players);
  };

  // 대회 활성화 → 완료
  const handleActivate = async () => {
    await activate();
    setStep(3);
  };

  // 완료 → 대시보드로
  const handleGoToDashboard = () => {
    onComplete(tournamentId);
  };

  // 코드 복사
  const handleCopyCode = () => {
    navigator.clipboard.writeText(tournamentCode);
    alert('대회 코드가 복사되었습니다!');
  };

  const courses = holeCount === 18 ? ['A', 'B'] : ['A', 'B', 'C', 'D'];

  // ==================== 렌더링 ====================
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 헤더 */}
      <div className="flex-shrink-0 bg-white border-b shadow-sm z-10">
        <div className="flex items-center px-4 py-3">
          <button onClick={step === 0 ? onBack : () => setStep(step - 1)} className="text-gray-600 hover:text-gray-800 mr-3 font-medium text-base">
            ← 뒤로
          </button>
          <h1 className="text-lg font-bold text-green-800 flex-1">대회 설정</h1>
          {tournamentCode && (
            <button onClick={handleCopyCode} className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-lg font-medium hover:bg-blue-200 transition-colors">
              코드: {tournamentCode}
            </button>
          )}
        </div>
        {/* 스텝 인디케이터 */}
        <div className="flex px-4 pb-3 gap-2">
          {STEPS.map((s, i) => (
            <div key={i} className="flex-1">
              <div className={`h-1.5 rounded-full ${i <= step ? 'bg-green-500' : 'bg-gray-200'}`} />
              <div className={`text-sm mt-1 ${i === step ? 'text-green-700 font-bold' : 'text-gray-400'}`}>
                {s}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-20 py-5">
        {/* ==================== Step 0: 대회 정보 ==================== */}
        {step === 0 && (
          <div className="flex flex-col h-full">
            <div className="flex-1 space-y-6">
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">대회명</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="대회명을 입력하세요"
                  className="w-full border-2 rounded-xl px-4 py-3.5 text-base"
                />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">날짜</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full border-2 rounded-xl px-4 py-3.5 text-base"
                />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">홀 수</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setHoleCount(18)}
                    className={`flex-1 py-3.5 rounded-xl text-base font-bold border-2 ${
                      holeCount === 18 ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700'
                    }`}
                  >
                    18홀
                  </button>
                  <button
                    onClick={() => setHoleCount(36)}
                    className={`flex-1 py-3.5 rounded-xl text-base font-bold border-2 ${
                      holeCount === 36 ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700'
                    }`}
                  >
                    36홀
                  </button>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 pt-4 pb-2">
              <button
                onClick={handleCreateTournament}
                disabled={!name.trim() || isCreating}
                className="w-full py-4 bg-green-600 text-white rounded-xl text-lg font-bold disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isCreating ? '생성 중...' : '대회 생성'}
              </button>
            </div>
          </div>
        )}

        {/* ==================== Step 1: 파 설정 ==================== */}
        {step === 1 && (
          <div className="flex flex-col h-full">
            <div className="flex-1 space-y-5">
              <p className="text-base text-gray-500">각 코스의 홀별 파를 설정하세요 (3~5)</p>

              {/* 코스 탭 */}
              <div className="flex gap-2">
                {courses.map(c => (
                  <button
                    key={c}
                    onClick={() => setParTab(c)}
                    className={`flex-1 py-3 rounded-xl text-base font-bold ${
                      parTab === c ? 'bg-green-600 text-white' : 'bg-white text-gray-700 border-2'
                    }`}
                  >
                    {c}코스
                  </button>
                ))}
              </div>

              {/* 홀별 파 입력 */}
              <div className="bg-white rounded-xl border-2 p-4">
                <div className="grid grid-cols-3 gap-4">
                  {Array.from({ length: 9 }, (_, i) => {
                    const [arr] = getParArray(parTab);
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-base text-gray-600 w-10 font-medium">{i + 1}홀</span>
                        <div className="flex items-center border-2 rounded-xl overflow-hidden flex-1">
                          <button
                            onClick={() => handleParChange(parTab, i, arr[i] - 1)}
                            className="px-3 py-2.5 bg-gray-100 text-gray-600 hover:bg-gray-200 text-lg font-bold"
                          >
                            -
                          </button>
                          <span className="flex-1 py-2.5 text-base font-bold text-center">
                            {arr[i]}
                          </span>
                          <button
                            onClick={() => handleParChange(parTab, i, arr[i] + 1)}
                            className="px-3 py-2.5 bg-gray-100 text-gray-600 hover:bg-gray-200 text-lg font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-3 border-t text-base text-gray-600 text-right">
                  {parTab}코스 합계 파: <span className="font-bold text-lg">{getParArray(parTab)[0].reduce((a, b) => a + b, 0)}</span>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 pt-4 pb-2">
              <button
                onClick={handleSavePars}
                className="w-full py-4 bg-green-600 text-white rounded-xl text-lg font-bold"
              >
                다음: 클럽/선수 등록
              </button>
            </div>
          </div>
        )}

        {/* ==================== Step 2: 클럽/선수 등록 ==================== */}
        {step === 2 && (
          <div className="flex flex-col h-full">
            <div className="flex-1 space-y-5 min-h-0 overflow-y-auto">
              {/* 대회 코드 안내 */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 text-center">
                <div className="text-base text-blue-600 mb-1">대회 코드</div>
                <div className="text-4xl font-bold text-blue-800 tracking-wider">{tournamentCode}</div>
                <button
                  onClick={handleCopyCode}
                  className="mt-2 text-sm text-blue-500 underline"
                >
                  코드 복사
                </button>
              </div>

              {/* 클럽 관리 */}
              <div className="bg-white rounded-xl border-2 p-4">
                <h3 className="text-base font-bold text-gray-700 mb-3">참여 클럽</h3>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newClubName}
                    onChange={e => setNewClubName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddClub()}
                    placeholder="클럽명 입력"
                    className="flex-1 border-2 rounded-xl px-4 py-3 text-base"
                  />
                  <button
                    onClick={handleAddClub}
                    className="px-5 py-3 bg-green-600 text-white rounded-xl text-base font-bold"
                  >
                    추가
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {clubs.map(c => (
                    <span key={c} className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-base">
                      {c}
                      <button
                        onClick={() => handleRemoveClub(c)}
                        className="ml-2 text-green-600 hover:text-red-500 text-lg"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {clubs.length === 0 && <span className="text-base text-gray-400">클럽을 추가하세요</span>}
                </div>
              </div>

              {/* 조별 선수 편집 */}
              <div className="bg-white rounded-xl border-2 p-4">
                <h3 className="text-base font-bold text-gray-700 mb-2">
                  조 편성 ({groups.length}개 조)
                </h3>
                <p className="text-sm text-gray-400 mb-3">
                  각 조를 클릭하여 선수를 등록하세요. 이름 입력 후 자동완성이 됩니다.
                </p>

                <div className="grid grid-cols-5 lg:grid-cols-9 gap-2 mb-4">
                  {groups.map(g => {
                    const hasPlayers = g.players.some(p => p.name);
                    return (
                      <button
                        key={g.groupNumber}
                        onClick={() => setEditGroupNumber(editGroupNumber === g.groupNumber ? null : g.groupNumber)}
                        className={`py-2.5 px-1 rounded-xl text-base border-2 text-center font-medium ${
                          editGroupNumber === g.groupNumber
                            ? 'bg-green-600 text-white border-green-600'
                            : hasPlayers
                              ? 'bg-green-50 text-green-700 border-green-300'
                              : 'bg-white text-gray-500'
                        }`}
                      >
                        {g.groupNumber}조
                      </button>
                    );
                  })}
                </div>

                {/* 선택된 조 편집 */}
                {editGroupNumber && (() => {
                  const group = groups.find(g => g.groupNumber === editGroupNumber);
                  if (!group) return null;
                  return (
                    <div className="border-t-2 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-base font-bold">{editGroupNumber}조 ({group.course})</h4>
                      </div>
                      <div className="space-y-3">
                        {group.players.map((player, idx) => (
                          <div key={player.slot} className="flex gap-2 items-center">
                            <span className="text-sm text-gray-400 w-5 font-medium">{idx + 1}</span>
                            <input
                              type="text"
                              value={player.name}
                              onChange={e => handlePlayerNameChange(editGroupNumber, player.slot, e.target.value)}
                              onBlur={e => handlePlayerNameBlur(editGroupNumber, player.slot, e.target.value)}
                              placeholder="성명"
                              className="flex-1 border-2 rounded-xl px-3 py-2.5 text-base"
                            />
                            <select
                              value={player.gender}
                              onChange={e => handlePlayerFieldChange(editGroupNumber, player.slot, 'gender', e.target.value)}
                              className="border-2 rounded-xl px-2 py-2.5 text-base w-16"
                            >
                              <option value="">-</option>
                              <option value="남">남</option>
                              <option value="여">여</option>
                            </select>
                            <select
                              value={player.club}
                              onChange={e => handlePlayerFieldChange(editGroupNumber, player.slot, 'club', e.target.value)}
                              className="border-2 rounded-xl px-2 py-2.5 text-base w-24"
                            >
                              <option value="">클럽</option>
                              {clubs.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="flex-shrink-0 pt-4 pb-2">
              <button
                onClick={handleActivate}
                className="w-full py-4 bg-blue-600 text-white rounded-xl text-lg font-bold"
              >
                대회 시작 (참여자 입력 허용)
              </button>
            </div>
          </div>
        )}

        {/* ==================== Step 3: 완료 ==================== */}
        {step === 3 && (
          <div className="flex flex-col h-full">
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
              <div className="text-6xl">✅</div>
              <h2 className="text-2xl font-bold text-green-800">대회가 시작되었습니다!</h2>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 w-full">
                <div className="text-base text-blue-600 mb-1 text-center">대회 코드</div>
                <div className="text-5xl font-bold text-blue-800 tracking-wider text-center">{tournamentCode}</div>
              </div>
              <p className="text-base text-gray-500">참여자들에게 이 코드를 공유하세요</p>
            </div>
            <div className="flex-shrink-0 space-y-3 pt-4 pb-2">
              <button
                onClick={handleCopyCode}
                className="w-full py-4 bg-blue-600 text-white rounded-xl text-lg font-bold"
              >
                코드 복사
              </button>
              <button
                onClick={handleGoToDashboard}
                className="w-full py-4 bg-green-600 text-white rounded-xl text-lg font-bold"
              >
                대시보드로 이동
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
