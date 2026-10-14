import { createClient } from 'npm:@supabase/supabase-js@2';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, paymongo-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const response = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });

function signatures(header: string | null): { timestamp: string; hashes: string[] } | null {
  if (!header) return null;
  const parts = new Map(header.split(',').map((part) => {
    const [key, ...value] = part.trim().split('=');
    return [key, value.join('=')];
  }));
  const timestamp = parts.get('t');
  const hashes = [parts.get('te'), parts.get('li')].filter(
    (value): value is string => typeof value === 'string' && /^[a-f\d]{64}$/i.test(value),
  );
  return timestamp && hashes.length ? { timestamp, hashes } : null;
}

async function verifySignature(body: string, header: string | null, secret: string): Promise<boolean> {
  const parsed = signatures(header);
  if (!parsed) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const hmac = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${parsed.timestamp}.${body}`),
  );
  const expected = [...new Uint8Array(hmac)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return parsed.hashes.some((hash) => {
    if (hash.length !== expected.length) return false;
    let difference = 0;
    for (let index = 0; index < hash.length; index++) {
      difference |= hash.toLowerCase().charCodeAt(index) ^ expected.charCodeAt(index);
    }
    return difference === 0;
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers });
  if (request.method !== 'POST') return response({ error: 'Method not allowed.' }, 405);

  const webhookSecret = Deno.env.get('PAYMONGO_WEBHOOK_SECRET');
  const paymongoKey = Deno.env.get('PAYMONGO_SECRET_KEY');
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!webhookSecret || !paymongoKey || !url || !serviceKey) {
    console.error('PayMongo webhook is missing required configuration.');
    return response({ error: 'Webhook is not configured.' }, 500);
  }

  const rawBody = await request.text();
  try {
    if (!await verifySignature(rawBody, request.headers.get('paymongo-signature'), webhookSecret)) {
      return response({ error: 'Invalid webhook signature.' }, 401);
    }
  } catch (error) {
    console.error('Unable to verify PayMongo webhook signature.', error);
    return response({ error: 'Unable to verify webhook signature.' }, 500);
  }

  let event: {
    data?: {
      type?: string;
      data?: {
        id?: string;
        attributes?: {
          reference_number?: string;
          metadata?: { attempt_id?: string };
        };
      };
    };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return response({ error: 'Invalid webhook payload.' }, 400);
  }
  const eventData = event.data;
  if (eventData?.type !== 'checkout_session.payment.paid') return response({ received: true });

  const eventSession = eventData.data;
  const sessionId = eventSession?.id;
  const reference = eventSession?.attributes?.reference_number;
  const attemptId = eventSession?.attributes?.metadata?.attempt_id;
  if (!sessionId || !reference || !attemptId) {
    return response({ error: 'Paid checkout event is missing its payment reference.' }, 400);
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
    return response({ error: 'Unable to load checkout attempt.' }, 500);
  }
  if (!attempt) return response({ error: 'Checkout attempt was not found.' }, 404);
  if (
    attempt.paymongo_checkout_session_id
    && attempt.paymongo_checkout_session_id !== sessionId
  ) {
    return response({ error: 'Checkout session does not match this attempt.' }, 409);
  }
  if (attempt.status === 'failed') return response({ received: true });

  const providerResponse = await fetch(
    `https://api.paymongo.com/v2/checkout_sessions/${encodeURIComponent(sessionId)}`,
    { headers: { Authorization: `Basic ${btoa(`${paymongoKey}:`)}` } },
  );
  if (!providerResponse.ok) {
    console.error('Unable to verify checkout with PayMongo.', providerResponse.status);
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
    session?.id !== sessionId
    || attributes?.reference_number !== reference
    || attributes?.metadata?.attempt_id !== attemptId
    || items.length === 0
    || items.some((item: { currency?: string }) => item.currency !== 'PHP')
    || !hasPaidPayment
    || !Number.isFinite(itemTotal)
    || itemTotal !== Math.round(Number(attempt.total_price) * 100)
  ) {
    console.error('PayMongo payment did not match the checkout attempt.', { sessionId, reference });
    return response({ error: 'Payment could not be verified.' }, 409);
  }

  if (attempt.status !== 'paid') {
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
      const booking = {
        ...attempt.booking_payload,
        paymongo_checkout_session_id: sessionId,
      };
      const { error: insertError } = await admin.from('bookings').insert(booking);
      if (insertError) {
        console.error('Unable to create paid booking.', insertError);
        return response({ error: 'Unable to complete booking.' }, 500);
      }
    } else {
      const { error: updateBookingError } = await admin
        .from('bookings')
        .update({
          ...attempt.booking_payload,
          paymongo_checkout_session_id: sessionId,
        })
        .eq('id', existingBooking.id)
        .eq('user_id', attempt.user_id);
      if (updateBookingError) {
        console.error('Unable to confirm existing paid booking.', updateBookingError);
        return response({ error: 'Unable to complete booking.' }, 500);
      }
    }
    const { error: updateError } = await admin
      .from('paymongo_checkout_attempts')
      .update({ status: 'paid', paymongo_checkout_session_id: sessionId })
      .eq('id', attemptId)
      .eq('status', 'pending');
    if (updateError) {
      console.error('Unable to mark checkout attempt paid.', updateError);
      return response({ error: 'Unable to complete booking.' }, 500);
    }
  }
  return response({ received: true });
});
