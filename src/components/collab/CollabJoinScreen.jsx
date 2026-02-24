import React, { useState } from 'react';
import { useCollabParticipant } from '../../hooks/useCollabParticipant';

export default function CollabJoinScreen({ onJoinSuccess, onBack }) {
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [foundTournament, setFoundTournament] = useState(null);
  const { joinByCode, isLoading, error } = useCollabParticipant();

  const handleSearch = async () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) return;
    const result = await joinByCode(trimmed);
    if (result) {
      setFoundTournament(result);
    }
  };

  const handleJoin = () => {
    if (!foundTournament || !nickname.trim()) return;
    onJoinSuccess(foundTournament.id, foundTournament.tournament, nickname.trim());
  };

  const handleCodeChange = (e) => {
    // 영숫자만 허용, 대문자로 변환, 최대 6자
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setCode(val);
    // 코드 변경 시 이전 검색 결과 초기화
    if (foundTournament) setFoundTournament(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <h1 className="text-3xl font-bold text-green-800 text-center mb-8">대회 참여</h1>

        {/* 코드 입력 */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">대회 코드</label>
            <input
              type="text"
              value={code}
              onChange={handleCodeChange}
              onKeyDown={e => e.key === 'Enter' && !foundTournament && code.length === 6 && handleSearch()}
              placeholder="6자리 코드 입력"
              className="w-full border-2 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.3em] font-mono uppercase"
              maxLength={6}
              autoFocus
            />
          </div>

          {!foundTournament ? (
            <button
              onClick={handleSearch}
              disabled={code.length !== 6 || isLoading}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isLoading ? '검색 중...' : '대회 검색'}
            </button>
          ) : (
            <>
              {/* 대회 정보 표시 */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="text-sm text-green-600 mb-1">대회를 찾았습니다!</div>
                <div className="text-lg font-bold text-green-800">{foundTournament.tournament.name}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {foundTournament.tournament.date} | {foundTournament.tournament.holeCount}홀
                </div>
              </div>

              {/* 닉네임 입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">닉네임</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && nickname.trim() && handleJoin()}
                  placeholder="닉네임을 입력하세요"
                  className="w-full border rounded-xl px-4 py-3 text-sm"
                  autoFocus
                />
              </div>

              <button
                onClick={handleJoin}
                disabled={!nickname.trim()}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                대회 참여하기
              </button>
            </>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 text-center">
              {error}
            </div>
          )}
        </div>

        <button
          onClick={onBack}
          className="mt-10 text-gray-400 hover:text-gray-600 text-base block mx-auto"
        >
          ← 뒤로
        </button>
      </div>
    </div>
  );
}
