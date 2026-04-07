import React, { useState } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';

export default function AuthLoginScreen({ onLoginSuccess, onBack, returnTo = 'collab-role', hideBackButton = false, subtitle }) {
  const { signUp, signIn, signInWithOAuth, error: authError } = useAuthContext();
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  const error = localError || authError;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setIsLoading(true);

    try {
      if (tab === 'register') {
        if (!displayName.trim()) {
          setLocalError('이름을 입력해주세요');
          setIsLoading(false);
          return;
        }
        const { data, error } = await signUp(email, password, displayName.trim());
        if (!error && data?.user) {
          onLoginSuccess();
        }
      } else {
        const { error } = await signIn(email, password);
        if (!error) {
          onLoginSuccess();
        }
      }
    } catch {
      setLocalError('오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    setLocalError('');
    localStorage.setItem('parkgolf-auth-redirect-intent', returnTo);
    await signInWithOAuth(provider);
  };

  if (signUpSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center p-8">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">✉️</div>
          <h2 className="text-xl font-bold text-green-800 mb-3">이메일을 확인해주세요</h2>
          <p className="text-gray-600 mb-6">
            <strong>{email}</strong>으로 인증 링크를 보냈습니다.
            <br />이메일의 링크를 클릭하면 가입이 완료됩니다.
          </p>
          <button
            onClick={() => { setSignUpSuccess(false); setTab('login'); }}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            로그인하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center p-8">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-green-800 mb-1">파크골프 대회 관리</h1>
          <p className="text-gray-500 text-sm">{subtitle || '협동 입력 모드를 사용하려면 로그인이 필요합니다'}</p>
        </div>

        {/* 탭 */}
        <div className="flex mb-6 border-b">
          <button
            onClick={() => { setTab('login'); setLocalError(''); }}
            className={`flex-1 pb-3 text-center font-semibold transition-colors ${
              tab === 'login'
                ? 'text-green-700 border-b-2 border-green-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            로그인
          </button>
          <button
            onClick={() => { setTab('register'); setLocalError(''); }}
            className={`flex-1 pb-3 text-center font-semibold transition-colors ${
              tab === 'register'
                ? 'text-green-700 border-b-2 border-green-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            회원가입
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="이름을 입력하세요"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                required
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '처리 중...' : tab === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>

        {/* 뒤로가기 */}
        {!hideBackButton && (
          <button
            onClick={onBack}
            className="w-full mt-6 py-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
          >
            ← 모드 선택으로 돌아가기
          </button>
        )}
      </div>
    </div>
  );
}
