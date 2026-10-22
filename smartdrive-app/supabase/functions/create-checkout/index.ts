import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const INSURANCE_FEE = 500;

type CheckoutInput = {
  vehicleId: number;
  pickupDate: string;
  returnDate: string;
  pickupLocation: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string | null;
  driverAge: number;
  bookingConditionsAccepted: boolean;
  isPwd: boolean;
  paymentMethod: 'credit-card' | 'gcash' | 'maya';
  promoCode: string | null;
  returnToApp?: boolean;
};

const response = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const cents = (value: number) => Math.round(money(value) * 100);

function rentalDays(start: string, end: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) return null;
  const startTime = Date.parse(`${start}T00:00:00Z`);
  const endTime = Date.parse(`${end}T00:00:00Z`);
  if (
    !Number.isFinite(startTime)
    || !Number.isFinite(endTime)
    || new Date(startTime).toISOString().slice(0, 10) !== start
    || new Date(endTime).toISOString().slice(0, 10) !== end
  ) return null;
  const days = (endTime - startTime) / 86_400_000;
  return Number.isInteger(days) && days > 0 ? days : null;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return response({ error: 'Method not allowed.' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const paymongoKey = Deno.env.get('PAYMONGO_SECRET_KEY');
  const appUrl = Deno.env.get('APP_BASE_URL');
  if (!url || !anonKey || !serviceKey || !paymongoKey || !appUrl) {
    console.error('PayMongo checkout is missing required configuration.');
    return response({ error: 'Checkout is not configured. Please contact support.' }, 500);
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return response({ error: 'Sign in before checkout.' }, 401);
  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await userClient.auth.getUser(authorization.slice(7));
  if (authError || !authData.user) return response({ error: 'Your sign-in session is invalid.' }, 401);

  let input: CheckoutInput;
  try {
    input = await request.json();
  } catch {
    return response({ error: 'Invalid checkout details.' }, 400);
  }
  if (
    !input
    || !Number.isSafeInteger(input?.vehicleId)
    || !['credit-card', 'gcash', 'maya'].includes(input?.paymentMethod)
    || typeof input.isPwd !== 'boolean'
    || typeof input.pickupDate !== 'string'
    || typeof input.returnDate !== 'string'
    || typeof input.pickupLocation !== 'string'
    || typeof input.customerName !== 'string'
    || typeof input.customerEmail !== 'string'
    || typeof input.customerPhone !== 'string'
    || (input.customerAddress != null && typeof input.customerAddress !== 'string')
    || !Number.isInteger(input.driverAge)
    || input.driverAge < 18
    || input.driverAge > 100
    || input.bookingConditionsAccepted !== true
    || (input.promoCode !== null && typeof input.promoCode !== 'string')
    || (input.returnToApp !== undefined && typeof input.returnToApp !== 'boolean')
  ) {
    return response({ error: 'Invalid checkout details.' }, 400);
  }
  const days = rentalDays(input.pickupDate, input.returnDate);
  const today = new Date().toISOString().slice(0, 10);
  const latestPickupDate = new Date(Date.parse(`${today}T00:00:00Z`) + 365 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const name = input.customerName?.trim();
  const email = input.customerEmail?.trim().toLowerCase();
  const phone = input.customerPhone?.trim();
  const customerAddress = input.customerAddress?.trim() ?? '';
  const location = input.pickupLocation?.trim();
  if (
    !days || input.pickupDate < today || input.pickupDate > latestPickupDate || days > 365
    || !name || name.length > 160
    || !email || email !== (authData.user.email ?? '').toLowerCase()
    || !phone || phone.length > 40
    || customerAddress.length > 500
    || !location || location.length > 160
  ) {
    return response({ error: 'Booking details are invalid or do not match your account.' }, 400);
  }

  let baseUrl: URL;
  try {
    baseUrl = new URL(appUrl);
  } catch {
    return response({ error: 'Checkout app URL is not configured.' }, 500);
  }
  if (baseUrl.protocol !== 'https:' && baseUrl.hostname !== 'localhost') {
    return response({ error: 'Checkout app URL must use HTTPS.' }, 500);
  }

  let returnBaseUrl = baseUrl;
  const requestOrigin = request.headers.get('Origin');
  if (requestOrigin && !input.returnToApp) {
    let originUrl: URL;
    try {
      originUrl = new URL(requestOrigin);
    } catch {
      return response({ error: 'Checkout must start from a valid SmartDrive app origin.' }, 403);
    }

    const isConfiguredOrigin = originUrl.origin === baseUrl.origin;
    const isProductionOrigin = originUrl.origin === 'https://smartdrive-app.vercel.app';
    const isSmartDriveVercelPreview = originUrl.protocol === 'https:'
      && (
        /^smartdrive-app(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(originUrl.hostname)
        || /^smartdrive-[a-z0-9-]+-smartdriveteam\.vercel\.app$/i.test(originUrl.hostname)
      );
    const isLocalTestOrigin = paymongoKey.startsWith('sk_test_')
      && originUrl.protocol === 'http:'
      && ['localhost', '127.0.0.1'].includes(originUrl.hostname);
    if (
      !isConfiguredOrigin
      && !isProductionOrigin
      && !isSmartDriveVercelPreview
      && !isLocalTestOrigin
    ) {
      return response({
        error: 'Checkout started from an unsupported app address. Open SmartDrive from its configured website and try again.',
      }, 403);
    }
    returnBaseUrl = originUrl;
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: vehicle, error: vehicleError } = await admin
    .from('vehicles')
    .select('id,name,price,status')
    .eq('id', input.vehicleId)
    .maybeSingle();
  if (vehicleError || !vehicle || vehicle.status !== 'available') {
    if (vehicleError) console.error('Unable to verify checkout vehicle.', vehicleError);
    return response({ error: 'This vehicle is not currently available.' }, 409);
  }

  const pendingHoldCutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data: conflicts, error: conflictError } = await admin
    .from('bookings')
    .select('id')
    .eq('vehicle_id', vehicle.id)
    .in('booking_status', ['confirmed', 'ongoing'])
    .or(`payment_status.eq.completed,and(payment_status.eq.pending,created_at.gt.${pendingHoldCutoff})`)
    .lt('pickup_date', input.returnDate)
    .gt('return_date', input.pickupDate)
    .limit(1);
  if (conflictError) {
    console.error('Unable to verify vehicle availability.', conflictError);
    return response({ error: 'Unable to verify vehicle availability.' }, 500);
  }
  if (conflicts?.length) return response({ error: 'This vehicle is no longer available for those dates.' }, 409);

  const subtotal = money(Number(vehicle.price) * days);
  const options: Array<{ amount: number; label: string; priority: number }> = [
    { amount: 0, label: 'N/A', priority: 0 },
  ];
  if (input.isPwd) {
    options.push({ amount: money(subtotal * 0.2), label: 'PWD Discount (20%)', priority: 2 });
  }
  const { count, error: memberError } = await admin
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', authData.user.id)
    .eq('payment_status', 'completed');
  if (memberError) {
    console.error('Unable to verify member discount.', memberError);
    return response({ error: 'Unable to verify booking discounts.' }, 500);
  }
  if ((count ?? 0) === 0) {
    options.push({ amount: money(subtotal * 0.15), label: 'New Member Discount (15%)', priority: 1 });
  }

  if (input.promoCode?.trim()) {
    const code = input.promoCode.trim();
    const { data: publicPromo, error: publicError } = await admin
      .from('discount_codes')
      .select('code,description,discount_percent,min_spend,max_uses,current_uses,valid_from,valid_until')
      .ilike('code', code)
      .eq('is_active', true)
      .maybeSingle();
    if (publicError) {
      console.error('Unable to verify promo code.', publicError);
      return response({ error: 'Unable to verify promo code.' }, 500);
    }
    let promo: { code: string; description: string; discount_percent: number } | null = null;
    if (publicPromo) {
      const now = Date.now();
      const datesValid =
        (!publicPromo.valid_from || now >= Date.parse(publicPromo.valid_from))
        && (!publicPromo.valid_until || now <= Date.parse(publicPromo.valid_until));
      const usesValid = publicPromo.max_uses == null
        || Number(publicPromo.current_uses) < Number(publicPromo.max_uses);
      if (datesValid && usesValid && subtotal >= Number(publicPromo.min_spend ?? 0)) promo = publicPromo;
    } else {
      const { data: claimed, error: claimedError } = await admin
        .from('claimed_reward_codes')
        .select('code,description,discount_percent')
        .eq('user_id', authData.user.id)
        .ilike('code', code)
        .maybeSingle();
      if (claimedError) {
        console.error('Unable to verify claimed reward code.', claimedError);
        return response({ error: 'Unable to verify promo code.' }, 500);
      }
      if (claimed) promo = claimed;
    }
    if (!promo) return response({ error: 'This promo code is no longer valid.' }, 409);
    const percent = Number(promo.discount_percent);
    if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
      return response({ error: 'This promo code has an invalid discount.' }, 409);
    }
    options.push({
      amount: money(subtotal * percent / 100),
      label: `${promo.description} (${promo.code})`,
      priority: 3,
    });
  }

  const best = options.reduce((current, option) =>
    option.amount > current.amount || (option.amount === current.amount && option.priority > current.priority)
      ? option
      : current,
  );
  const total = money(subtotal + INSURANCE_FEE - best.amount);
  const amount = cents(total);
  if (!Number.isSafeInteger(amount) || amount < 100) {
    console.error('Invalid calculated PayMongo checkout amount.', {
      vehicleId: vehicle.id,
      dailyRate: vehicle.price,
      rentalDays: days,
      subtotal,
      discount: best.amount,
      total,
      amount,
    });
    return response({ error: 'The calculated payment amount is invalid. Please refresh and try again.' }, 400);
  }

  const referenceNumber =
    `SD-${new Date().getFullYear()}-${crypto.randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`;
  const attemptId = crypto.randomUUID();
  const booking = {
    reference_number: referenceNumber,
    user_id: authData.user.id,
    customer_email: email,
    customer_name: name,
    customer_phone: phone,
    customer_address: customerAddress || null,
    vehicle_id: vehicle.id,
    vehicle_name: vehicle.name,
    pickup_date: input.pickupDate,
    return_date: input.returnDate,
    pickup_location: location,
    daily_rate: Number(vehicle.price),
    rental_days: days,
    subtotal,
    insurance: INSURANCE_FEE,
    discount: best.amount,
    discount_label: best.label,
    promo_code: input.promoCode?.trim() || null,
    total_price: total,
    payment_method: input.paymentMethod,
    payment_status: 'completed',
    test_auto_confirmed: false,
    booking_status: 'confirmed',
    is_pwd_discount: input.isPwd,
    driver_age: input.driverAge,
    booking_conditions_accepted: input.bookingConditionsAccepted,
    booking_conditions_accepted_at: new Date().toISOString(),
  };
  const { error: attemptError } = await admin.from('paymongo_checkout_attempts').insert({
    id: attemptId,
    user_id: authData.user.id,
    reference_number: referenceNumber,
    payment_method: input.paymentMethod,
    total_price: total,
    booking_payload: booking,
    status: 'pending',
  });
  if (attemptError) {
    console.error('Unable to save checkout attempt.', attemptError);
    return response({ error: 'Unable to start checkout. Please try again.' }, 500);
  }

  const successUrl = new URL(`/booking/confirmation/${referenceNumber}`, returnBaseUrl);
  successUrl.searchParams.set('payment', 'success');
  successUrl.searchParams.set('attempt', attemptId);
  if (input.returnToApp) successUrl.searchParams.set('returnToApp', '1');
  const cancelUrl = new URL(`/booking/${vehicle.id}/payment?payment=cancelled`, baseUrl).toString();
  const methodTypes: Record<CheckoutInput['paymentMethod'], string[]> = {
    'credit-card': ['card'],
    gcash: ['gcash'],
    maya: ['paymaya'],
  };
  const providerResponse = await fetch('https://api.paymongo.com/v2/checkout_sessions', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${paymongoKey}:`)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: {
        attributes: {
          line_items: [{ name: `SmartDrive rental - ${vehicle.name}`, amount, currency: 'PHP', quantity: 1 }],
          payment_method_types: methodTypes[input.paymentMethod],
          success_url: successUrl.toString(),
          cancel_url: cancelUrl,
          reference_number: referenceNumber,
          metadata: { attempt_id: attemptId, user_id: authData.user.id },
        },
      },
    }),
  });
  const providerResult = await providerResponse.json();
  const checkoutId = providerResult?.data?.id;
  const checkoutUrl = providerResult?.data?.attributes?.checkout_url;
  if (!providerResponse.ok || typeof checkoutId !== 'string' || typeof checkoutUrl !== 'string') {
    await admin.from('paymongo_checkout_attempts').update({ status: 'failed' }).eq('id', attemptId);
    console.error('PayMongo did not create a checkout session.', providerResult);
    const providerMessage = Array.isArray(providerResult?.errors)
      ? providerResult.errors
        .map((error: { detail?: unknown; code?: unknown }) =>
          typeof error.detail === 'string'
            ? error.detail
            : typeof error.code === 'string'
              ? error.code
              : null,
        )
        .filter((detail: string | null): detail is string => detail !== null)
        .join(' ')
      : '';
    return response({
      error: providerMessage
        ? `PayMongo rejected the checkout: ${providerMessage}`
        : 'PayMongo could not start checkout. Please try again.',
    }, 502);
  }
  const { error: updateError } = await admin
    .from('paymongo_checkout_attempts')
    .update({ paymongo_checkout_session_id: checkoutId })
    .eq('id', attemptId)
    .eq('status', 'pending')
    .is('paymongo_checkout_session_id', null);
  if (updateError) {
    console.error('Could not save PayMongo session reference.', updateError);
    return response({ error: 'Could not save checkout details. Please contact support.' }, 500);
  }
  return response({ checkoutUrl, referenceNumber });
});
