import React, { createContext, useContext } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { useAuthContext } from './AuthContext';

const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const { user } = useAuthContext();
  const subscription = useSubscription(user?.id);
  return (
    <SubscriptionContext.Provider value={subscription}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptionContext() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscriptionContext must be used within SubscriptionProvider');
  }
  return context;
}
