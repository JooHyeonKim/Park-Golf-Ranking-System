import React from 'react';
import { useAuthContext } from '../../contexts/AuthContext';

export default function AuthProfileScreen({ onLogin, onBack }) {
  const { user, isAuthenticated, signOut, getDisplayName } = useAuthContext();

  const handleLogout = async () => {
    await signOut();
    onBack();
  };

  // 로그인 방법 표시
  const getProvider = () => {
    if (!user) return '';
    const provider = user.app_metadata?.provider;
    if (provider === 'google') return 'Google';
    if (provider === 'kakao') return '카카오';
    return '이메일';
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center p-8">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">👤</div>
          <h2 className="text-xl font-bold text-gray-800 mb-3">로그인이 필요합니다</h2>
          <p className="text-gray-500 mb-6">
            로그인하면 협동 입력 모드를 사용할 수 있습니다
          </p>
          <button
            onClick={onLogin}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors mb-3"
          >
            로그인하기
          </button>
          <button
            onClick={onBack}
            className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
          >
            ← 뒤로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center p-8">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="프로필"
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <span className="text-3xl">👤</span>
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-800">{getDisplayName()}</h2>
          <p className="text-gray-500 text-sm">{user.email}</p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between py-3 px-4 bg-gray-50 rounded-lg">
            <span className="text-gray-600 text-sm">로그인 방법</span>
            <span className="text-gray-800 text-sm font-medium">{getProvider()}</span>
          </div>
          <div className="flex justify-between py-3 px-4 bg-gray-50 rounded-lg">
            <span className="text-gray-600 text-sm">가입일</span>
            <span className="text-gray-800 text-sm font-medium">
              {new Date(user.created_at).toLocaleDateString('ko-KR')}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-3 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition-colors mb-3"
        >
          로그아웃
        </button>
        <button
          onClick={onBack}
          className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
        >
          ← 뒤로
        </button>
      </div>
    </div>
  );
}
