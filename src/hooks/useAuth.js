import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';

/**
 * 인증 상태 관리 훅
 * - 이메일/비밀번호 회원가입/로그인
 * - Google, Kakao OAuth
 * - 세션 자동 복원 및 상태 변경 감지
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email, password, displayName) => {
    setError(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });
    if (error) setError(error.message);
    return { data, error };
  }, []);

  const signIn = useCallback(async (email, password) => {
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
    return { data, error };
  }, []);

  const signInWithOAuth = useCallback(async (provider) => {
    setError(null);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) setError(error.message);
    return { data, error };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) setError(error.message);
  }, []);

  const getDisplayName = useCallback(() => {
    if (!user) return '';
    return (
      user.user_metadata?.display_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      '사용자'
    );
  }, [user]);

  return {
    user,
    session,
    isLoading,
    error,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    getDisplayName,
  };
}
