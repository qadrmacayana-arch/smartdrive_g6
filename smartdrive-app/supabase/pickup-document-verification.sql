-- Apply after pickup-outlets-and-cashback.sql.
begin;

alter table public.bookings
  add column if not exists pickup_license_verified boolean not null default false,
  add column if not exists pickup_government_ids_verified boolean not null default false,
  add column if not exists pickup_proof_of_billing_verified boolean not null default false,
  add column if not exists pickup_pwd_senior_id_verified boolean not null default false;

create or replace function public.guard_booking_pickup_document_updates()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  caller_role text := coalesce(auth.role(), current_user);
  trusted_role boolean := caller_role in ('service_role', 'postgres', 'supabase_admin');
begin
  if new.pickup_license_verified is not distinct from old.pickup_license_verified
    and new.pickup_government_ids_verified is not distinct from old.pickup_government_ids_verified
    and new.pickup_proof_of_billing_verified is not distinct from old.pickup_proof_of_billing_verified
    and new.pickup_pwd_senior_id_verified is not distinct from old.pickup_pwd_senior_id_verified then
    return new;
  end if;

  if not trusted_role and not public.has_admin_access() then
    raise exception 'Only administrators can record pickup document checks.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_booking_pickup_document_updates on public.bookings;
create trigger trg_guard_booking_pickup_document_updates
before update of
  pickup_license_verified,
  pickup_government_ids_verified,
  pickup_proof_of_billing_verified,
  pickup_pwd_senior_id_verified
on public.bookings
for each row execute function public.guard_booking_pickup_document_updates();

create or replace function public.review_pwd_senior_cashback(
  target_booking_id bigint,
  approve boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_booking public.bookings;
  balance_row public.wallet_balances;
  cashback_amount numeric(12, 2);
  transaction_reference text;
begin
  if not public.has_admin_access() then
    raise exception 'Only administrators can verify PWD/Senior cashback.';
  end if;
  if approve is null then
    raise exception 'Choose whether the pickup ID was verified.';
  end if;

  select *
  into target_booking
  from public.bookings
  where id = target_booking_id
  for update;

  if not found then
    raise exception 'The booking could not be found.';
  end if;
  if target_booking.is_pwd_senior is not true
    or target_booking.pwd_senior_cashback_status is distinct from 'pending_verification' then
    raise exception 'This booking has no pending PWD/Senior cashback claim.';
  end if;
  if target_booking.user_id is null
    or target_booking.payment_status is distinct from 'completed'
    or target_booking.booking_status is distinct from 'ongoing' then
    raise exception 'Cashback can be reviewed only after payment and vehicle pickup.';
  end if;

  if not approve then
    perform set_config('app.pwd_senior_cashback_rpc', 'on', true);
    update public.bookings
    set pwd_senior_cashback_status = 'declined'
    where id = target_booking.id;
    return jsonb_build_object(
      'status', 'declined',
      'amount', target_booking.pwd_senior_cashback_amount
    );
  end if;

  if target_booking.pickup_license_verified is not true
    or target_booking.pickup_government_ids_verified is not true
    or target_booking.pickup_proof_of_billing_verified is not true
    or target_booking.pickup_pwd_senior_id_verified is not true then
    raise exception 'Confirm all required pickup documents, including the PWD/Senior ID, before crediting cashback.';
  end if;

  cashback_amount := round(coalesce(target_booking.subtotal, 0) * 0.20, 2);
  if cashback_amount <= 0 then
    raise exception 'The calculated cashback amount is invalid.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(target_booking.user_id::text, 0));
  transaction_reference := 'pwd-senior-cashback:' || target_booking.reference_number;
  if exists (
    select 1
    from public.wallet_transactions
    where reference = transaction_reference
  ) then
    raise exception 'Cashback for this booking has already been credited.';
  end if;

  if not exists (
    select 1
    from public.wallet_balances
    where user_id = target_booking.user_id
  ) then
    insert into public.wallet_balances (user_id, email, balance, total_earned, total_spent)
    values (target_booking.user_id, target_booking.customer_email, 0, 0, 0);
  end if;

  select *
  into balance_row
  from public.wallet_balances
  where user_id = target_booking.user_id
  order by id
  limit 1
  for update;

  if not found then
    raise exception 'The customer wallet could not be initialized.';
  end if;

  update public.wallet_balances
  set balance = coalesce(balance_row.balance, 0) + cashback_amount,
      total_earned = coalesce(balance_row.total_earned, 0) + cashback_amount
  where id = balance_row.id;

  insert into public.wallet_transactions (
    user_id, email, type, description, amount, reference,
    balance_before, balance_after, status
  )
  values (
    target_booking.user_id,
    target_booking.customer_email,
    'reward',
    'PWD/Senior cashback for booking #' || target_booking.reference_number,
    cashback_amount,
    transaction_reference,
    coalesce(balance_row.balance, 0),
    coalesce(balance_row.balance, 0) + cashback_amount,
    'completed'
  );

  perform set_config('app.pwd_senior_cashback_rpc', 'on', true);
  update public.bookings
  set pwd_senior_cashback_status = 'credited',
      pwd_senior_cashback_amount = cashback_amount
  where id = target_booking.id;

  return jsonb_build_object('status', 'credited', 'amount', cashback_amount);
end;
$$;

revoke execute on function public.review_pwd_senior_cashback(bigint, boolean) from public, anon;
grant execute on function public.review_pwd_senior_cashback(bigint, boolean) to authenticated;

commit;
