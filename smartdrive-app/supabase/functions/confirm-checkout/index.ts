import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const response = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return response({ error: 'Method not allowed.' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const paymongoKey = Deno.env.get('PAYMONGO_SECRET_KEY');
  if (!url || !anonKey || !serviceKey || !paymongoKey) {
    console.error('PayMongo return confirmation is missing required configuration.');
    return response({ error: 'Payment confirmation is not configured.' }, 500);
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return response({ error: 'Sign in to confirm this payment.' }, 401);
  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await userClient.auth.getUser(authorization.slice(7));
  if (authError || !authData.user) return response({ error: 'Your sign-in session is invalid.' }, 401);

  let reference: unknown;
  try {
    reference = (await request.json())?.referenceNumber;
  } catch {
    return response({ error: 'Invalid checkout reference.' }, 400);
  }
  if (typeof reference !== 'string' || !/^SD-\d{4}-[A-F\d]{12}$/.test(reference)) {
    return response({ error: 'Invalid checkout reference.' }, 400);
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: attempt, error: attemptError } = await admin
    .from('paymongo_checkout_attempts')
    .select('*')
    .eq('reference_number', reference)
    .eq('user_id', authData.user.id)
    .maybeSingle();
  if (attemptError) {
    console.error('Unable to load PayMongo checkout attempt.', attemptError);
    return response({ error: 'Unable to load checkout details.' }, 500);
  }
  if (!attempt) return response({ error: 'Checkout attempt was not found.' }, 404);
  if (attempt.status === 'paid') return response({ status: 'paid' });
  if (attempt.status === 'failed') return response({ status: 'failed' }, 409);
  if (!attempt.paymongo_checkout_session_id) return response({ status: 'pending' });

  const providerResponse = await fetch(
    `https://api.paymongo.com/v2/checkout_sessions/${encodeURIComponent(attempt.paymongo_checkout_session_id)}`,
    { headers: { Authorization: `Basic ${btoa(`${paymongoKey}:`)}` } },
  );
  if (!providerResponse.ok) {
    console.error('Unable to verify returned checkout with PayMongo.', providerResponse.status);
    return response({ error: 'Unable to verify payment with PayMongo.' }, 502);
  }
  const provider = await providerResponse.json();
  const session = provider?.data;
  const attributes = session?.attributes;
  const items = Array.isArray(attributes?.line_items) ? attributes.line_items : [];
  const payments = Array.isArray(attributes?.payments) ? attributes.payments : [];
  const hasPaidPayment = payments.some(
    (payment: { attributes?: { status?: string } }) => payment.attributes?.status === 'paid',
  );
  const itemTotal = items.reduce(
    (total: number, item: { amount?: number; quantity?: number; currency?: string }) =>
      item.currency === 'PHP' ? total + Number(item.amount) * Number(item.quantity) : Number.NaN,
    0,
  );
  if (
    session?.id !== attempt.paymongo_checkout_session_id
    || attributes?.reference_number !== reference
    || attributes?.metadata?.attempt_id !== attempt.id
    || items.length === 0
    || items.some((item: { currency?: string }) => item.currency !== 'PHP')
    || !Number.isFinite(itemTotal)
    || itemTotal !== Math.round(Number(attempt.total_price) * 100)
  ) {
    console.error('PayMongo return did not match the checkout attempt.', {
      sessionId: attempt.paymongo_checkout_session_id,
      reference,
    });
    return response({ error: 'Payment could not be verified.' }, 409);
  }
  if (!hasPaidPayment) return response({ status: 'pending' });

  const { data: existingBooking, error: bookingLookupError } = await admin
    .from('bookings')
    .select('id')
    .eq('reference_number', reference)
    .maybeSingle();
  if (bookingLookupError) {
    console.error('Unable to check existing booking.', bookingLookupError);
    return response({ error: 'Unable to complete booking.' }, 500);
  }
  if (!existingBooking) {
    const { error: insertError } = await admin.from('bookings').insert({
      ...attempt.booking_payload,
      paymongo_checkout_session_id: attempt.paymongo_checkout_session_id,
    });
    if (insertError) {
      console.error('Unable to create paid booking from checkout return.', insertError);
      return response({ error: 'Unable to complete booking.' }, 500);
    }
  }

  const { error: updateError } = await admin
    .from('paymongo_checkout_attempts')
    .update({ status: 'paid' })
    .eq('id', attempt.id)
    .eq('status', 'pending');
  if (updateError) {
    console.error('Unable to mark checkout attempt paid.', updateError);
    return response({ error: 'Unable to complete booking.' }, 500);
  }
  return response({ status: 'paid' });
});
