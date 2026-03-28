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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: '인증이 필요합니다.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // 유저 인증
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

    // 현재 구독 조회
    const { data: sub, error: subError } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (subError || !sub) {
      return new Response(JSON.stringify({ error: '구독 정보를 찾을 수 없습니다.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (sub.status !== 'active') {
      return new Response(JSON.stringify({ error: '활성 구독이 아닙니다.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 구독 해지 (현재 기간 종료까지 이용 가능)
    const now = new Date();
    const { error: updateError } = await supabaseClient
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('user_id', user.id);

    if (updateError) {
      return new Response(JSON.stringify({ error: '구독 해지 실패: ' + updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PortOne 빌링키 삭제 (선택적)
    if (sub.billing_key) {
      try {
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

        if (tokenData.code === 0) {
          await fetch(`https://api.iamport.kr/subscribe/customers/${sub.billing_key}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${tokenData.response.access_token}` },
          });
        }
      } catch {
        // 빌링키 삭제 실패는 무시 (구독 해지는 이미 완료)
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: '구독이 해지되었습니다.',
      access_until: sub.current_period_end,
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
