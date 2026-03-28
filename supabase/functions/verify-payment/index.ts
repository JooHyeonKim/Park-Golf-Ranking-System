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
    // 인증 확인
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: '인증이 필요합니다.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Supabase 클라이언트 (유저 토큰으로)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // 유저 토큰에서 user_id 추출
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: '유효하지 않은 인증입니다.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 요청 바디
    const { imp_uid, merchant_uid } = await req.json();
    if (!imp_uid || !merchant_uid) {
      return new Response(JSON.stringify({ error: 'imp_uid와 merchant_uid가 필요합니다.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PortOne API로 결제 검증
    const portoneApiKey = Deno.env.get('PORTONE_API_KEY')!;
    const portoneApiSecret = Deno.env.get('PORTONE_API_SECRET')!;

    // 1. 액세스 토큰 발급
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

    // 2. 결제 정보 조회
    const paymentRes = await fetch(`https://api.iamport.kr/payments/${imp_uid}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const paymentData = await paymentRes.json();
    if (paymentData.code !== 0) {
      return new Response(JSON.stringify({ error: '결제 정보 조회 실패' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payment = paymentData.response;

    // 3. 금액 검증 (3,000원)
    if (payment.amount !== 3000 || payment.status !== 'paid') {
      return new Response(JSON.stringify({ error: '결제 금액 또는 상태가 유효하지 않습니다.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. 구독 활성화
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 30);

    const { error: updateError } = await supabaseClient
      .from('subscriptions')
      .update({
        status: 'active',
        billing_key: payment.customer_uid || null,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('user_id', user.id);

    if (updateError) {
      return new Response(JSON.stringify({ error: '구독 업데이트 실패: ' + updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. 결제 내역 기록
    await supabaseClient.from('payment_history').insert({
      user_id: user.id,
      amount: payment.amount,
      portone_imp_uid: imp_uid,
      merchant_uid: merchant_uid,
      status: 'paid',
      paid_at: now.toISOString(),
    });

    return new Response(JSON.stringify({ success: true }), {
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
