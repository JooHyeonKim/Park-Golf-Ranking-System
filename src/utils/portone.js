import { supabase } from './supabase';

const MERCHANT_ID = import.meta.env.VITE_PORTONE_MERCHANT_ID;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * PortOne SDK 초기화
 */
export function initPortOne() {
  if (window.IMP && MERCHANT_ID) {
    window.IMP.init(MERCHANT_ID);
  }
}

/**
 * 구독 결제 요청 (빌링키 발급 + 최초 결제)
 */
export function requestSubscriptionPayment({ userId, email, name }) {
  return new Promise((resolve) => {
    if (!window.IMP) {
      resolve({ success: false, error: '결제 모듈을 불러올 수 없습니다.' });
      return;
    }

    const merchantUid = `sub_${userId}_${Date.now()}`;
    const customerUid = `cuid_${userId}_${Date.now()}`;

    window.IMP.request_pay(
      {
        pg: 'kakaopay',
        pay_method: 'card',
        merchant_uid: merchantUid,
        customer_uid: customerUid,
        name: '파크골프 스코어 집계 프로그램 월간 구독',
        amount: 3000,
        buyer_email: email,
        buyer_name: name,
        currency: 'KRW',
      },
      async (response) => {
        if (response.success) {
          try {
            const session = await supabase.auth.getSession();
            const accessToken = session.data.session?.access_token;

            const res = await fetch(
              `${SUPABASE_URL}/functions/v1/verify-payment`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  apikey: SUPABASE_ANON_KEY,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  imp_uid: response.imp_uid,
                  merchant_uid: response.merchant_uid,
                }),
              }
            );

            if (res.ok) {
              resolve({ success: true });
            } else {
              const data = await res.json().catch(() => ({}));
              resolve({
                success: false,
                error: data.error || '결제 검증에 실패했습니다.',
              });
            }
          } catch (err) {
            resolve({
              success: false,
              error: '결제 검증 중 오류가 발생했습니다.',
            });
          }
        } else {
          resolve({
            success: false,
            error: response.error_msg || '결제가 취소되었습니다.',
          });
        }
      }
    );
  });
}

/**
 * 구독 해지 요청
 */
export async function cancelSubscription() {
  const session = await supabase.auth.getSession();
  const accessToken = session.data.session?.access_token;

  const res = await fetch(
    `${SUPABASE_URL}/functions/v1/cancel-subscription`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || '구독 해지에 실패했습니다.');
  }

  return await res.json();
}
