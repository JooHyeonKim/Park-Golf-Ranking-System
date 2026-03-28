import React from 'react';
import { useSubscriptionContext } from '../../contexts/SubscriptionContext';

export default function TrialBanner() {
  const { isTrialing, trialDaysLeft } = useSubscriptionContext();

  if (!isTrialing) return null;

  const isUrgent = trialDaysLeft <= 7;

  return (
    <div className={`px-4 py-2 text-center text-sm font-medium ${
      isUrgent
        ? 'bg-orange-100 text-orange-800'
        : 'bg-blue-50 text-blue-700'
    }`}>
      무료 체험 {trialDaysLeft}일 남음
      {isUrgent && ' · 구독하면 중단 없이 이용할 수 있습니다'}
    </div>
  );
}
