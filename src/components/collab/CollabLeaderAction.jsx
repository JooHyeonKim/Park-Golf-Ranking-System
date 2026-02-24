import { useState } from 'react';
import { findTournamentByCode } from '../../utils/firestoreOps';

export default function CollabLeaderAction({ onCreateNew, onJoinExisting, onBack }) {
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCodeChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setCode(val);
    if (error) setError('');
  };

  const handleJoin = async () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) return;

    setIsLoading(true);
    setError('');
    try {
      const result = await findTournamentByCode(trimmed);
      if (!result) {
        setError('대회를 찾을 수 없습니다');
        setIsLoading(false);
        return;
      }
      onJoinExisting(result.id);
    } catch (err) {
      setError('검색 실패: ' + err.message);
      setIsLoading(false);
    }
  };

  if (showCodeInput) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-lg text-center">
          <h1 className="text-3xl font-bold text-green-800 mb-8">기존 대회 접속</h1>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">대회 코드</label>
              <input
                type="text"
                value={code}
                onChange={handleCodeChange}
                onKeyDown={e => e.key === 'Enter' && code.length === 6 && handleJoin()}
                placeholder="6자리 코드 입력"
                className="w-full border-2 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.3em] font-mono uppercase"
                maxLength={6}
                autoFocus
              />
            </div>

            <button
              onClick={handleJoin}
              disabled={code.length !== 6 || isLoading}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-medium text-base disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isLoading ? '검색 중...' : '대회 접속'}
            </button>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 text-center">
                {error}
              </div>
            )}
          </div>

          <button
            onClick={() => { setShowCodeInput(false); setCode(''); setError(''); }}
            className="mt-10 text-gray-400 hover:text-gray-600 text-base"
          >
            ← 뒤로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center p-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-green-800 mb-3">팀장 모드</h1>
        <p className="text-gray-500">대회를 생성하거나 기존 대회에 접속하세요</p>
      </div>

      <div className="flex gap-6 max-w-3xl w-full">
        <button
          onClick={onCreateNew}
          className="flex-1 py-10 px-8 bg-white border-2 border-blue-600 rounded-xl shadow-md hover:shadow-lg hover:border-blue-700 transition-all group"
        >
          <div className="text-5xl mb-4">➕</div>
          <div className="text-2xl font-bold text-blue-700 mb-2 group-hover:text-blue-800">새 대회 생성</div>
          <div className="text-gray-500">새로운 대회를 만들고 설정합니다</div>
        </button>

        <button
          onClick={() => setShowCodeInput(true)}
          className="flex-1 py-10 px-8 bg-white border-2 border-green-600 rounded-xl shadow-md hover:shadow-lg hover:border-green-700 transition-all group"
        >
          <div className="text-5xl mb-4">🔗</div>
          <div className="text-2xl font-bold text-green-700 mb-2 group-hover:text-green-800">기존 대회 접속</div>
          <div className="text-gray-500">대회 코드를 입력하여 관리합니다</div>
        </button>
      </div>

      <button
        onClick={onBack}
        className="mt-10 text-gray-400 hover:text-gray-600 text-base"
      >
        ← 역할 선택으로 돌아가기
      </button>
    </div>
  );
}
