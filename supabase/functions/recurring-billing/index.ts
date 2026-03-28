import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 서비스 역할 인증 확인 (cron에서 호출)
    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // service_role 키를 통해 호출된 것인지 확인
    if (!authHeader?.includes(supabaseServiceKey)) {
      return new Response(JSON.stringify({ error: '권한이 없습니다.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // 결제 기한 만료된 활성 구독 조회
    const now = new Date().toISOString();
    const { data: expiredSubs, error: queryError } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('status', 'active')
      .not('billing_key', 'is', null)
      .lte('current_period_end', now);

    if (queryError) {
      return new Response(JSON.stringify({ error: '구독 조회 실패' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PortOne 액세스 토큰 발급
    const portoneApiKey = Deno.env.get('PORTONE_API_KEY')!;
    const portoneApiSecret = Deno.env.get('PORTONE_API_SECRET')!;

    const tokenRes = await fetch('https://api.iamport.kr/users/getToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imp_key: portoneApiKey,
        imp_secret: portoneApiSecret,
      }),
    });
    const tokenData = await tokenRes.json();
    if (tokenData.code !== 0) {
      return new Response(JSON.stringify({ error: 'PortOne 인증 실패' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const accessToken = tokenData.response.access_token;

    const results = [];

    for (const sub of expiredSubs || []) {
      const merchantUid = `recurring_${sub.user_id}_${Date.now()}`;

      try {
        // 빌링키로 재결제
        const payRes = await fetch('https://api.iamport.kr/subscribe/payments/again', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customer_uid: sub.billing_key,
            merchant_uid: merchantUid,
            amount: 3000,
            name: '파크골프 스코어 집계 프로그램 월간 구독',
            currency: 'KRW',
          }),
        });
        const payData = await payRes.json();

        if (payData.code === 0 && payData.response.status === 'paid') {
          // 결제 성공 → 기간 갱신
          const newStart = new Date();
          const newEnd = new Date();
          newEnd.setDate(newEnd.getDate() + 30);

          await supabaseClient
            .from('subscriptions')
            .update({
              current_period_start: newStart.toISOString(),
              current_period_end: newEnd.toISOString(),
              status: 'active',
              updated_at: newStart.toISOString(),
            })
            .eq('id', sub.id);

          await supabaseClient.from('payment_history').insert({
            user_id: sub.user_id,
            amount: 3000,
            portone_imp_uid: payData.response.imp_uid,
            merchant_uid: merchantUid,
            status: 'paid',
            paid_at: newStart.toISOString(),
          });

          results.push({ user_id: sub.user_id, status: 'paid' });
        } else {
          // 결제 실패 → past_due 또는 expired
          const failStatus = sub.status === 'past_due' ? 'expired' : 'past_due';

          await supabaseClient
            .from('subscriptions')
            .update({
              status: failStatus,
              updated_at: new Date().toISOString(),
            })
            .eq('id', sub.id);

          await supabaseClient.from('payment_history').insert({
            user_id: sub.user_id,
            amount: 3000,
            merchant_uid: merchantUid,
            status: 'failed',
            paid_at: new Date().toISOString(),
          });

          results.push({ user_id: sub.user_id, status: 'failed', reason: payData.message });
        }
      } catch (err) {
        results.push({ user_id: sub.user_id, status: 'error', reason: err.message });
      }
    }

    // 무료체험 만료 유저도 expired로 전환
    await supabaseClient
      .from('subscriptions')
      .update({ status: 'expired', updated_at: now })
      .eq('status', 'trialing')
      .lte('trial_ends_at', now);

    // 해지 후 기간 만료된 유저도 expired로 전환
    await supabaseClient
      .from('subscriptions')
      .update({ status: 'expired', updated_at: now })
      .eq('status', 'canceled')
      .lte('current_period_end', now);

    return new Response(JSON.stringify({
      processed: expiredSubs?.length || 0,
      results,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: '서버 오류: ' + err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
