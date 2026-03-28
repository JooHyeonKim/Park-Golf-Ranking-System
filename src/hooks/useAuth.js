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
  const [isLoading, setIsLoading] = useState(!!supabase);
  const [error, setError] = useState(null);
  const [authEvent, setAuthEvent] = useState(null);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthEvent(event);
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email, password, displayName) => {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
    setError(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });
    if (error) {
      const msg = error.message.includes('already registered')
        ? '이미 가입된 이메일입니다. 로그인해주세요.'
        : error.message;
      setError(msg);
      return { data, error: { ...error, message: msg } };
    }
    // 이메일 인증 활성화 시: 이미 가입된 이메일은 identities가 빈 배열
    if (data?.user?.identities?.length === 0) {
      const dupError = { message: '이미 가입된 이메일입니다. 로그인해주세요.' };
      setError(dupError.message);
      return { data: null, error: dupError };
    }
    return { data, error };
  }, []);

  const signIn = useCallback(async (email, password) => {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
    return { data, error };
  }, []);

  const signInWithOAuth = useCallback(async (provider) => {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
    setError(null);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + window.location.pathname,
      },
    });
    if (error) setError(error.message);
    return { data, error };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
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
    authEvent,
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    getDisplayName,
  };
}
