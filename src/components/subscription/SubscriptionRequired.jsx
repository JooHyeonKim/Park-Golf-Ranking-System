import React, { useState } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { requestSubscriptionPayment } from '../../utils/portone';

export default function SubscriptionRequired({ onSubscribed }) {
  const { user, signOut, getDisplayName } = useAuthContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubscribe = async () => {
    if (!window.IMP) {
      setError('결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await requestSubscriptionPayment({
        userId: user.id,
        email: user.email,
        name: getDisplayName(),
      });

      if (result.success) {
        onSubscribed?.();
      } else {
        setError(result.error || '결제에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (err) {
      setError('결제 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {/* 아이콘 */}
        <div className="w-20 h-20 mx-auto mb-6 bg-orange-100 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-gray-800 mb-2">
          무료 체험 기간이 종료되었습니다
        </h2>
        <p className="text-gray-500 mb-6 text-sm leading-relaxed">
          파크골프 스코어 집계 프로그램을 계속 이용하시려면<br />
          월간 구독을 시작해주세요.
        </p>

        {/* 요금 안내 */}
        <div className="bg-green-50 rounded-xl p-5 mb-6">
          <div className="text-sm text-green-700 font-medium mb-1">월간 구독</div>
          <div className="text-3xl font-bold text-green-800">
            3,000<span className="text-lg font-normal">원/월</span>
          </div>
          <div className="text-xs text-green-600 mt-2">
            모든 기능 무제한 이용 · 언제든 해지 가능
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        {/* 구독 버튼 */}
        <button
          onClick={handleSubscribe}
          disabled={isProcessing}
          className="w-full py-3.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-3"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              결제 처리 중...
            </span>
          ) : (
            '구독하기 (월 3,000원)'
          )}
        </button>

        {/* 로그아웃 */}
        <button
          onClick={handleLogout}
          className="w-full py-2 text-gray-400 hover:text-gray-600 text-sm transition-colors"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}
