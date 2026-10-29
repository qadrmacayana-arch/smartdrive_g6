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
  if (!url || !anonKey || !serviceKey) {
    console.error('Admin account access is missing required Supabase configuration.');
    return response({ error: 'Account access management is not configured.' }, 500);
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return response({ error: 'Sign in as an administrator.' }, 401);
  const token = authorization.slice(7);
  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await userClient.auth.getUser(token);
  if (authError || !authData.user) return response({ error: 'Your sign-in session is invalid.' }, 401);

  const isAdmin = authData.user.email?.toLowerCase() === 'admin@smartrentals.com'
    || authData.user.app_metadata?.['is_admin'] === true;
  if (!isAdmin) return response({ error: 'Only administrators can change account access.' }, 403);

  let body: { userId?: unknown; isActive?: unknown };
  try {
    body = await request.json();
  } catch {
    return response({ error: 'Request body must be valid JSON.' }, 400);
  }
  if (
    typeof body?.userId !== 'string'
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.userId)
    || typeof body.isActive !== 'boolean'
  ) {
    return response({ error: 'Provide a valid customer and account status.' }, 400);
  }
  if (body.userId === authData.user.id) {
    return response({ error: 'You cannot suspend your own administrator account.' }, 400);
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: targetResult, error: targetError } = await admin.auth.admin.getUserById(body.userId);
  if (targetError || !targetResult.user) {
    console.error('Unable to load target account for access change.', targetError);
    return response({ error: 'Customer account could not be found.' }, 404);
  }
  const target = targetResult.user;
  if (
    target.email?.toLowerCase() === 'admin@smartrentals.com'
    || target.app_metadata?.['is_admin'] === true
  ) {
    return response({ error: 'Administrator accounts cannot be suspended here.' }, 400);
  }

  const { data: profile, error: profileLookupError } = await userClient
    .from('profiles')
    .select('id,is_active')
    .eq('id', body.userId)
    .maybeSingle();
  if (profileLookupError) {
    console.error('Unable to check target profile access.', profileLookupError);
    return response({ error: 'Unable to load customer account status.' }, 500);
  }
  if (!profile) return response({ error: 'Customer profile could not be found.' }, 404);

  const isActive = body.isActive;
  const { data: profileUpdate, error: profileUpdateError } = await userClient
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', body.userId)
    .select('id')
    .maybeSingle();
  if (profileUpdateError || !profileUpdate) {
    console.error('Unable to update customer profile access.', profileUpdateError);
    return response({ error: 'Unable to update customer account status.' }, 500);
  }

  const { error: authUpdateError } = await admin.auth.admin.updateUserById(body.userId, {
    ban_duration: isActive ? 'none' : '876000h',
  });
  if (authUpdateError) {
    console.error('Unable to update customer sign-in access.', authUpdateError);
    const { error: rollbackError } = await userClient
      .from('profiles')
      .update({ is_active: profile.is_active })
      .eq('id', body.userId);
    if (rollbackError) console.error('Unable to restore customer profile access after auth failure.', rollbackError);
    return response({ error: 'Supabase could not update sign-in access. The profile change was rolled back when possible.' }, 502);
  }

  return response({ is_active: isActive });
});
