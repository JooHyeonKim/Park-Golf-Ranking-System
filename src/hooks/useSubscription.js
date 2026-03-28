import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';

/**
 * 구독 상태 관리 훅
 * - Supabase subscriptions 테이블에서 현재 유저의 구독 정보 조회
 * - trialing / active / expired 상태 판별
 * - 무료체험 잔여일 계산
 */
export function useSubscription(userId) {
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('구독 정보 조회 실패:', error.message);
        setSubscription(null);
      } else {
        setSubscription(data);
      }
    } catch (err) {
      console.error('구독 정보 조회 오류:', err);
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const now = new Date();

  // 무료체험 중인지
  const isTrialing =
    subscription?.status === 'trialing' &&
    new Date(subscription.trial_ends_at) > now;

  // 활성 구독인지
  const isActive =
    subscription?.status === 'active' &&
    subscription.current_period_end &&
    new Date(subscription.current_period_end) > now;

  // 해지했지만 기간 남은 경우
  const isCanceled =
    subscription?.status === 'canceled' &&
    subscription.current_period_end &&
    new Date(subscription.current_period_end) > now;

  // 앱 사용 가능 여부
  const hasAccess = isTrialing || isActive || isCanceled;

  // 만료 여부 (무료체험 끝 + 결제 안함)
  const isExpired = !isLoading && subscription && !hasAccess;

  // 무료체험 잔여일
  const trialDaysLeft = isTrialing
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at) - now) / (1000 * 60 * 60 * 24)))
    : 0;

  // 다음 결제일
  const nextBillingDate = isActive && subscription.current_period_end
    ? new Date(subscription.current_period_end)
    : null;

  return {
    subscription,
    isLoading,
    isTrialing,
    isActive,
    isCanceled,
    isExpired,
    hasAccess,
    trialDaysLeft,
    nextBillingDate,
    refetch: fetchSubscription,
  };
}
