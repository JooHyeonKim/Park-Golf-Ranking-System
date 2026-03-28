import React, { useState, useEffect } from 'react';
import { useSubscriptionContext } from '../../contexts/SubscriptionContext';
import { supabase } from '../../utils/supabase';
import { cancelSubscription, requestSubscriptionPayment } from '../../utils/portone';
import { useAuthContext } from '../../contexts/AuthContext';

export default function SubscriptionManagement({ onBack }) {
  const { user, getDisplayName } = useAuthContext();
  const { subscription, isTrialing, isActive, isCanceled, trialDaysLeft, nextBillingDate, refetch } = useSubscriptionContext();
  const [payments, setPayments] = useState([]);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('payment_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setPayments(data);
      });
  }, [user?.id]);

  const handleCancel = async () => {
    if (!confirm('정말 구독을 해지하시겠습니까?\n현재 결제 기간이 끝날 때까지 이용할 수 있습니다.')) return;

    setIsCanceling(true);
    setError(null);
    try {
      await cancelSubscription();
      setSuccessMsg('구독이 해지되었습니다. 현재 기간 종료까지 이용 가능합니다.');
      refetch();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCanceling(false);
    }
  };

  const handleResubscribe = async () => {
    if (!window.IMP) {
      setError('결제 모듈을 불러오는 중입니다.');
      return;
    }
    setIsSubscribing(true);
    setError(null);
    try {
      const result = await requestSubscriptionPayment({
        userId: user.id,
        email: user.email,
        name: getDisplayName(),
      });
      if (result.success) {
        setSuccessMsg('구독이 재개되었습니다!');
        refetch();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('결제 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const getStatusLabel = () => {
    if (isTrialing) return { text: '무료 체험', color: 'bg-blue-100 text-blue-700' };
    if (isActive) return { text: '구독 중', color: 'bg-green-100 text-green-700' };
    if (isCanceled) return { text: '해지 예정', color: 'bg-orange-100 text-orange-700' };
    return { text: '만료', color: 'bg-red-100 text-red-700' };
  };

  const status = getStatusLabel();

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
        <h2 className="text-lg font-bold text-gray-800 mb-4">구독 관리</h2>

        {/* 구독 상태 */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">구독 상태</span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}>
              {status.text}
            </span>
          </div>

          {isTrialing && (
            <div className="text-sm text-gray-600">
              무료 체험 <span className="font-semibold text-blue-700">{trialDaysLeft}일</span> 남음
              <div className="text-xs text-gray-400 mt-1">
                종료일: {new Date(subscription.trial_ends_at).toLocaleDateString('ko-KR')}
              </div>
            </div>
          )}

          {isActive && nextBillingDate && (
            <div className="text-sm text-gray-600">
              다음 결제일: <span className="font-semibold">{nextBillingDate.toLocaleDateString('ko-KR')}</span>
              <div className="text-xs text-gray-400 mt-1">월 3,000원</div>
            </div>
          )}

          {isCanceled && subscription.current_period_end && (
            <div className="text-sm text-orange-600">
              {new Date(subscription.current_period_end).toLocaleDateString('ko-KR')}까지 이용 가능
            </div>
          )}
        </div>

        {/* 알림 메시지 */}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-4">{error}</div>
        )}
        {successMsg && (
          <div className="bg-green-50 text-green-600 text-sm rounded-lg p-3 mb-4">{successMsg}</div>
        )}

        {/* 액션 버튼 */}
        {isActive && (
          <button
            onClick={handleCancel}
            disabled={isCanceling}
            className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors disabled:opacity-50 mb-3"
          >
            {isCanceling ? '처리 중...' : '구독 해지'}
          </button>
        )}

        {(isCanceled || isTrialing) && (
          <button
            onClick={handleResubscribe}
            disabled={isSubscribing}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 mb-3"
          >
            {isSubscribing ? '처리 중...' : '구독하기 (월 3,000원)'}
          </button>
        )}

        {/* 결제 내역 */}
        {payments.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">결제 내역</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {payments.map((p) => (
                <div key={p.id} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg text-sm">
                  <div>
                    <div className="text-gray-800">{p.amount.toLocaleString()}원</div>
                    <div className="text-xs text-gray-400">
                      {new Date(p.paid_at || p.created_at).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                  <span className={`text-xs font-medium ${
                    p.status === 'paid' ? 'text-green-600' :
                    p.status === 'failed' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {p.status === 'paid' ? '결제완료' : p.status === 'failed' ? '실패' : '환불'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 뒤로 */}
        <button
          onClick={onBack}
          className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm transition-colors mt-4"
        >
          ← 뒤로
        </button>
      </div>
    </div>
  );
}
