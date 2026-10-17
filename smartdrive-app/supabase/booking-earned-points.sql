-- Run in the Supabase SQL Editor to award SR Points only for confirmed, paid bookings.
-- Points are awarded at one point per peso of the final booking total.

alter table public.bookings
  add column if not exists test_auto_confirmed boolean not null default false,
  add column if not exists promo_code text;

create or replace function public.award_sr_points_for_paid_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  balance_row public.wallet_balances;
  points_amount numeric(12, 2);
begin
  if tg_op = 'UPDATE'
    and new.booking_status = 'cancelled'
    and new.user_id is not null
    and old.booking_status is distinct from 'cancelled'
  then
    perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));

    if not exists (
      select 1
      from public.wallet_transactions
      where type = 'adjustment'
        and reference = 'cancel:' || new.reference_number
    ) then
      select amount
      into points_amount
      from public.wallet_transactions
      where type = 'reward'
        and reference = new.reference_number
      limit 1;

      if points_amount > 0 then
        select *
        into balance_row
        from public.wallet_balances
        where user_id = new.user_id
        order by id
        limit 1
        for update;

        if found then
          update public.wallet_balances
          set balance = coalesce(balance_row.balance, 0) - points_amount,
              total_earned = greatest(coalesce(balance_row.total_earned, 0) - points_amount, 0)
          where id = balance_row.id;

          insert into public.wallet_transactions (
            user_id, email, type, description, amount, reference,
            balance_before, balance_after, status
          )
          values (
            new.user_id,
            new.customer_email,
            'adjustment',
            'SR Points reversed for cancelled booking #' || new.reference_number,
            -points_amount,
            'cancel:' || new.reference_number,
            balance_row.balance,
            balance_row.balance - points_amount,
            'completed'
          );
        end if;
      end if;
    end if;
    return new;
  end if;

  if new.user_id is null
    or new.payment_status <> 'completed'
    or new.booking_status = 'cancelled'
    or new.test_auto_confirmed
    or new.payment_method = 'srpoints'
  then
    return new;
  end if;

  points_amount := round(coalesce(new.total_price, 0), 2);
  if points_amount <= 0 then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));

  if exists (
    select 1
    from public.wallet_transactions
    where type = 'reward'
      and reference = new.reference_number
  ) then
    return new;
  end if;

  insert into public.wallet_balances (user_id, email, balance, total_earned, total_spent)
  values (new.user_id, new.customer_email, 0, 0, 0)
  on conflict do nothing;

  select *
  into balance_row
  from public.wallet_balances
  where user_id = new.user_id
  order by id
  limit 1
  for update;

  update public.wallet_balances
  set balance = coalesce(balance_row.balance, 0) + points_amount,
      total_earned = coalesce(balance_row.total_earned, 0) + points_amount
  where id = balance_row.id;

  insert into public.wallet_transactions (
    user_id, email, type, description, amount, reference,
    balance_before, balance_after, status
  )
  values (
    new.user_id,
    new.customer_email,
    'reward',
    'SR Points earned from booking #' || new.reference_number,
    points_amount,
    new.reference_number,
    coalesce(balance_row.balance, 0),
    coalesce(balance_row.balance, 0) + points_amount,
    'completed'
  );

  return new;
end;
$$;

drop trigger if exists trg_award_sr_points_for_paid_booking on public.bookings;
create trigger trg_award_sr_points_for_paid_booking
after insert or update on public.bookings
for each row execute function public.award_sr_points_for_paid_booking();

create or replace function public.guard_customer_booking_payment_status()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is not null
    and auth.uid() = old.user_id
    and current_user not in ('postgres', 'service_role')
    and new.payment_status is distinct from old.payment_status
  then
    raise exception 'Only the verified payment process can update booking payment status.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_customer_booking_payment_status on public.bookings;
create trigger trg_guard_customer_booking_payment_status
before update of payment_status on public.bookings
for each row execute function public.guard_customer_booking_payment_status();

drop policy if exists "Customers can create their own bookings" on public.bookings;
create policy "Customers can create their own bookings"
on public.bookings for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and payment_status = 'pending'
  and payment_method = 'srpoints'
);

drop policy if exists "wallet_balances_insert_own" on public.wallet_balances;
drop policy if exists "wallet_balances_update_own" on public.wallet_balances;
drop policy if exists "wallet_transactions_insert_own" on public.wallet_transactions;
drop policy if exists "wallet_balances_insert_admin" on public.wallet_balances;
drop policy if exists "wallet_balances_update_admin" on public.wallet_balances;
drop policy if exists "wallet_transactions_insert_admin" on public.wallet_transactions;

create or replace function public.spend_sr_points(target_reference text, target_amount numeric)
returns public.wallet_balances
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_booking public.bookings;
  balance_row public.wallet_balances;
  amount_to_spend numeric(12, 2);
  vehicle_rate numeric(10, 2);
  expected_days integer;
  expected_subtotal numeric(12, 2);
  best_discount numeric(12, 2) := 0;
  expected_total numeric(12, 2);
  candidate_discount numeric(12, 2);
  promo_discount numeric(12, 2);
  promo_description text;
  promo_row public.discount_codes%rowtype;
  claimed_discount numeric(5, 2);
  claimed_description text;
  other_completed_bookings integer;
begin
  if current_user_id is null then
    raise exception 'Sign in to use SR Points.';
  end if;
  if target_reference is null or char_length(target_reference) > 60 then
    raise exception 'The booking reference is invalid.';
  end if;

  if target_amount is null or target_amount::text in ('NaN', 'Infinity', '-Infinity') then
    raise exception 'The SR Points amount is invalid.';
  end if;
  amount_to_spend := round(target_amount, 2);
  if amount_to_spend <= 0 then
    raise exception 'The SR Points amount must be greater than zero.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text, 0));

  select *
  into target_booking
  from public.bookings
  where reference_number = target_reference
    and user_id = current_user_id
  for update;

  if not found then
    raise exception 'The booking could not be found for this account.';
  end if;
  if target_booking.payment_method is distinct from 'srpoints'
    or target_booking.booking_status is distinct from 'confirmed'
    or round(target_booking.total_price, 2) is distinct from amount_to_spend
  then
    raise exception 'The booking is not eligible for SR Points payment.';
  end if;

  if target_booking.payment_status = 'completed' then
    select *
    into balance_row
    from public.wallet_balances
    where user_id = current_user_id
    order by id
    limit 1;
    if not found then
      raise exception 'The completed booking has no wallet balance.';
    end if;
    return balance_row;
  end if;
  if target_booking.payment_status <> 'pending' then
    raise exception 'This booking is not awaiting SR Points payment.';
  end if;

  expected_days := target_booking.return_date - target_booking.pickup_date;
  if target_booking.pickup_date < current_date
    or expected_days < 1
    or expected_days > 365
    or target_booking.booking_conditions_accepted is distinct from true
    or target_booking.booking_documents_ready is distinct from true
    or target_booking.driver_license_confirmed is distinct from true
  then
    raise exception 'The booking dates or required booking details are invalid.';
  end if;

  select price
  into vehicle_rate
  from public.vehicles
  where id = target_booking.vehicle_id
    and status = 'available';
  if not found then
    raise exception 'This vehicle is no longer available.';
  end if;

  expected_subtotal := round(vehicle_rate * expected_days, 2);
  if target_booking.daily_rate is distinct from vehicle_rate
    or target_booking.rental_days is distinct from expected_days
    or target_booking.subtotal is distinct from expected_subtotal
    or target_booking.insurance is distinct from 500
  then
    raise exception 'The booking price could not be verified. Please restart checkout.';
  end if;

  if exists (
    select 1
    from public.bookings existing
    where existing.id <> target_booking.id
      and existing.vehicle_id = target_booking.vehicle_id
      and existing.booking_status <> 'cancelled'
      and existing.payment_status = 'completed'
      and existing.pickup_date < target_booking.return_date
      and existing.return_date > target_booking.pickup_date
  ) then
    raise exception 'This vehicle is no longer available for the selected dates.';
  end if;

  if target_booking.is_pwd_senior then
    best_discount := round(expected_subtotal * 0.20, 2);
  end if;

  select count(*)
  into other_completed_bookings
  from public.bookings
  where user_id = current_user_id
    and payment_status = 'completed'
    and id <> target_booking.id;
  if other_completed_bookings = 0 then
    candidate_discount := round(expected_subtotal * 0.15, 2);
    best_discount := greatest(best_discount, candidate_discount);
  end if;

  if nullif(trim(target_booking.promo_code), '') is not null then
    select *
    into promo_row
    from public.discount_codes
    where lower(code) = lower(trim(target_booking.promo_code))
      and is_active is true
    limit 1;

    if found then
      if (promo_row.valid_from is not null and promo_row.valid_from > now())
        or (promo_row.valid_until is not null and promo_row.valid_until < now())
        or (
          promo_row.max_uses is not null
          and coalesce(promo_row.current_uses, 0) >= promo_row.max_uses
        )
        or expected_subtotal < coalesce(promo_row.min_spend, 0)
      then
        raise exception 'This promo code is no longer valid.';
      end if;
      if promo_row.discount_percent <= 0 or promo_row.discount_percent > 100 then
        raise exception 'This promo code has an invalid discount.';
      end if;
      promo_discount := round(expected_subtotal * promo_row.discount_percent / 100, 2);
      promo_description := promo_row.description;
    else
      select discount_percent, description
      into claimed_discount, claimed_description
      from public.claimed_reward_codes
      where user_id = current_user_id
        and lower(code) = lower(trim(target_booking.promo_code))
      limit 1;
      if not found then
        raise exception 'This promo code is not available to this account.';
      end if;
      if claimed_discount <= 0 or claimed_discount > 100 then
        raise exception 'This promo code has an invalid discount.';
      end if;
      promo_discount := round(expected_subtotal * claimed_discount / 100, 2);
      promo_description := claimed_description;
    end if;
    best_discount := greatest(best_discount, promo_discount);
  end if;

  expected_total := round(expected_subtotal + 500 - best_discount, 2);
  if target_booking.discount is distinct from best_discount
    or target_booking.total_price is distinct from expected_total
    or expected_total <> amount_to_spend
  then
    raise exception 'The booking total could not be verified. Please restart checkout.';
  end if;

  insert into public.wallet_balances (user_id, email, balance, total_earned, total_spent)
  values (current_user_id, target_booking.customer_email, 0, 0, 0)
  on conflict do nothing;

  select *
  into balance_row
  from public.wallet_balances
  where user_id = current_user_id
  order by id
  limit 1
  for update;

  if coalesce(balance_row.balance, 0) < amount_to_spend then
    raise exception 'Insufficient SR Points balance.';
  end if;

  update public.wallet_balances
  set balance = coalesce(balance_row.balance, 0) - amount_to_spend,
      total_spent = coalesce(balance_row.total_spent, 0) + amount_to_spend
  where id = balance_row.id;

  insert into public.wallet_transactions (
    user_id, email, type, description, amount, payment_method, reference,
    balance_before, balance_after, status
  )
  values (
    current_user_id,
    target_booking.customer_email,
    'payment',
    'Used for booking #' || target_reference,
    -amount_to_spend,
    'srpoints',
    target_reference,
    balance_row.balance,
    balance_row.balance - amount_to_spend,
    'completed'
  );

  update public.bookings
  set payment_status = 'completed'
  where id = target_booking.id;

  select *
  into balance_row
  from public.wallet_balances
  where id = balance_row.id;

  return balance_row;
end;
$$;

revoke execute on function public.spend_sr_points(text, numeric) from public, anon;
grant execute on function public.spend_sr_points(text, numeric) to authenticated;

notify pgrst, 'reload schema';
