-- Apply this migration after admin-authorization.sql and before deploying the
-- updated create-checkout and confirm-checkout Edge Functions.
begin;

alter table public.bookings
  add column if not exists is_pwd_senior boolean not null default false,
  add column if not exists pwd_senior_cashback_status text not null default 'not_applicable',
  add column if not exists pwd_senior_cashback_amount numeric(12, 2) not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.bookings'::regclass
      and conname = 'bookings_pwd_senior_cashback_status_check'
  ) then
    alter table public.bookings
      add constraint bookings_pwd_senior_cashback_status_check
      check (pwd_senior_cashback_status in (
        'not_applicable', 'pending_verification', 'credited', 'declined'
      ));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.bookings'::regclass
      and conname = 'bookings_pwd_senior_cashback_amount_check'
  ) then
    alter table public.bookings
      add constraint bookings_pwd_senior_cashback_amount_check
      check (pwd_senior_cashback_amount >= 0);
  end if;
end;
$$;

create or replace function public.prepare_booking_pickup_cashback()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  rpc_update boolean := coalesce(current_setting('app.pwd_senior_cashback_rpc', true), '') = 'on';
begin
  if tg_op = 'INSERT' then
    if new.pickup_location is null or new.pickup_location not in (
      'Demo SmartDrive Outlet - Makati, Metro Manila',
      'Demo SmartDrive Outlet - Cebu City, Cebu',
      'Demo SmartDrive Outlet - Davao City, Davao del Sur'
    ) then
      raise exception 'Choose a valid demo SmartDrive pickup outlet.';
    end if;

    new.is_pwd_discount := false;
    new.pwd_senior_cashback_amount := case
      when new.is_pwd_senior then round(coalesce(new.subtotal, 0) * 0.20, 2)
      else 0
    end;
    new.pwd_senior_cashback_status := case
      when new.is_pwd_senior then 'pending_verification'
      else 'not_applicable'
    end;
    return new;
  end if;

  if new.pickup_location is distinct from old.pickup_location
    and (new.pickup_location is null or new.pickup_location not in (
      'Demo SmartDrive Outlet - Makati, Metro Manila',
      'Demo SmartDrive Outlet - Cebu City, Cebu',
      'Demo SmartDrive Outlet - Davao City, Davao del Sur'
    )) then
    raise exception 'Choose a valid demo SmartDrive pickup outlet.';
  end if;

  if not rpc_update and (
    new.is_pwd_senior is distinct from old.is_pwd_senior
    or new.is_pwd_discount is distinct from old.is_pwd_discount
    or new.pwd_senior_cashback_status is distinct from old.pwd_senior_cashback_status
    or new.pwd_senior_cashback_amount is distinct from old.pwd_senior_cashback_amount
  ) then
    raise exception 'PWD/Senior cashback can only be reviewed through the admin verification action.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prepare_booking_pickup_cashback on public.bookings;
create trigger trg_prepare_booking_pickup_cashback
before insert or update on public.bookings
for each row execute function public.prepare_booking_pickup_cashback();

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
