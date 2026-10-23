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
const bookingFields = [
  'id',
  'reference_number',
  'user_id',
  'customer_email',
  'customer_name',
  'customer_phone',
  'customer_address',
  'vehicle_id',
  'vehicle_name',
  'pickup_date',
  'return_date',
  'pickup_location',
  'daily_rate',
  'rental_days',
  'subtotal',
  'insurance',
  'discount',
  'discount_label',
  'promo_code',
  'total_price',
  'payment_method',
  'payment_status',
  'paymongo_checkout_session_id',
  'paymongo_payment_id',
  'test_auto_confirmed',
  'booking_status',
  'is_pwd_discount',
  'is_pwd_senior',
  'pwd_senior_cashback_status',
  'pwd_senior_cashback_amount',
  'driver_age',
  'booking_conditions_accepted',
  'booking_conditions_accepted_at',
  'rating',
  'notes',
  'created_at',
].join(',');

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return response({ error: 'Method not allowed.' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const paymongoKey = Deno.env.get('PAYMONGO_SECRET_KEY');
  if (!url || !serviceKey || !paymongoKey) {
    console.error('PayMongo return confirmation is missing required configuration.');
    return response({ error: 'Payment confirmation is not configured.' }, 500);
  }

  let reference: unknown;
  let attemptId: unknown;
  try {
    const body = await request.json();
    reference = body?.referenceNumber;
    attemptId = body?.attemptId;
  } catch {
    return response({ error: 'Invalid checkout reference.' }, 400);
  }
  if (typeof reference !== 'string' || !/^SD-\d{4}-[A-F\d]{12}$/.test(reference)) {
    return response({ error: 'Invalid checkout reference.' }, 400);
  }
  if (typeof attemptId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(attemptId)) {
    return response({ error: 'Invalid checkout return token.' }, 400);
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: attempt, error: attemptError } = await admin
    .from('paymongo_checkout_attempts')
    .select('*')
    .eq('id', attemptId)
    .eq('reference_number', reference)
    .maybeSingle();
  if (attemptError) {
    console.error('Unable to load PayMongo checkout attempt.', attemptError);
    return response({ error: 'Unable to load checkout details.' }, 500);
  }
  if (!attempt) return response({ error: 'Checkout attempt was not found.' }, 404);
  if (attempt.status === 'failed') return response({ status: 'failed' }, 409);
  if (attempt.status === 'paid') {
    const { data: booking, error: bookingError } = await admin
      .from('bookings')
      .select(bookingFields)
      .eq('reference_number', reference)
      .maybeSingle();
    if (bookingError || !booking) {
      console.error('Unable to load paid booking for checkout return.', bookingError);
      return response({ error: 'Unable to load confirmed booking.' }, 500);
    }
    return response({
      status: attempt.booking_payload?.test_auto_confirmed ? 'test-confirmed' : 'paid',
      booking,
    });
  }
  if (!attempt.paymongo_checkout_session_id) return response({ status: 'pending' });

  const testAutoConfirm = Deno.env.get('PAYMONGO_TEST_AUTO_CONFIRM') === 'true'
    && paymongoKey.startsWith('sk_test_');
  let hasPaidPayment = testAutoConfirm;
  let sessionId = attempt.paymongo_checkout_session_id;

  if (testAutoConfirm) {
    console.warn('Auto-confirming a test checkout without verifying payment.', { reference });
  } else {
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
    const paidPayment = payments.find(
      (payment: { attributes?: { status?: string } }) => payment.attributes?.status === 'paid',
    );
    hasPaidPayment = Boolean(paidPayment);
    if (paidPayment && typeof paidPayment.id === 'string') {
      attempt.paymongo_payment_id = paidPayment.id;
    }
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
  }
  if (!hasPaidPayment) return response({ status: 'pending' });

  const { data: existingBooking, error: bookingLookupError } = await admin
    .from('bookings')
    .select('id,user_id')
    .eq('reference_number', reference)
    .maybeSingle();
  if (bookingLookupError) {
    console.error('Unable to check existing booking.', bookingLookupError);
    return response({ error: 'Unable to complete booking.' }, 500);
  }
  if (existingBooking && existingBooking.user_id !== attempt.user_id) {
    console.error('Existing booking owner does not match checkout attempt.', { reference });
    return response({ error: 'Unable to complete booking.' }, 409);
  }
  if (!existingBooking) {
    const { error: insertError } = await admin.from('bookings').insert({
      ...attempt.booking_payload,
      paymongo_checkout_session_id: attempt.paymongo_checkout_session_id,
      paymongo_payment_id: attempt.paymongo_payment_id ?? null,
      test_auto_confirmed: testAutoConfirm,
    });
    if (insertError) {
      console.error('Unable to create paid booking from checkout return.', insertError);
      return response({ error: 'Unable to complete booking.' }, 500);
    }
  } else {
    const { error: updateBookingError } = await admin
      .from('bookings')
      .update({
        ...attempt.booking_payload,
        paymongo_checkout_session_id: attempt.paymongo_checkout_session_id,
        paymongo_payment_id: attempt.paymongo_payment_id ?? null,
        test_auto_confirmed: testAutoConfirm,
      })
      .eq('id', existingBooking.id)
      .eq('user_id', attempt.user_id);
    if (updateBookingError) {
      console.error('Unable to confirm existing booking from checkout return.', updateBookingError);
      return response({ error: 'Unable to complete booking.' }, 500);
    }
  }

  const { error: updateError } = await admin
    .from('paymongo_checkout_attempts')
    .update({
      status: 'paid',
      booking_payload: testAutoConfirm
        ? { ...attempt.booking_payload, test_auto_confirmed: true }
        : attempt.booking_payload,
    })
    .eq('id', attempt.id)
    .eq('status', 'pending');
  if (updateError) {
    console.error('Unable to mark checkout attempt paid.', updateError);
    return response({ error: 'Unable to complete booking.' }, 500);
  }
  const { data: booking, error: bookingError } = await admin
    .from('bookings')
    .select(bookingFields)
    .eq('reference_number', reference)
    .maybeSingle();
  if (bookingError || !booking) {
    console.error('Unable to load confirmed booking for checkout return.', bookingError);
    return response({ error: 'Unable to load confirmed booking.' }, 500);
  }
  return response({ status: testAutoConfirm ? 'test-confirmed' : 'paid', booking });
});
