-- Apply after paymongo.sql, admin-authorization.sql, and bookings-rls.sql.
-- Admins may only record a refund for a cancelled booking whose payment succeeded.
create or replace function public.block_unverified_booking_payment_updates()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  request_role text := coalesce(auth.role(), current_user);
  is_trusted_role boolean := request_role in ('service_role', 'postgres', 'supabase_admin');
  is_admin boolean :=
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false);
  is_admin_refund boolean;
begin
  is_admin_refund := is_admin
    and old.booking_status = 'cancelled'
    and old.payment_status = 'completed'
    and new.payment_status = 'refunded';

  if is_admin_refund
    and (to_jsonb(new) - 'payment_status') is distinct from (to_jsonb(old) - 'payment_status') then
    raise exception 'Recording a refund cannot change other booking details.';
  end if;

  if not is_trusted_role and (
    (new.payment_status is distinct from old.payment_status and not is_admin_refund)
    or new.paymongo_checkout_session_id is distinct from old.paymongo_checkout_session_id
    or new.paymongo_payment_id is distinct from old.paymongo_payment_id
  ) then
    raise exception 'Payment status and checkout references can only be changed by the payment service or an authorized cancelled-booking refund.';
  end if;

  if not is_trusted_role and old.paymongo_checkout_session_id is not null and (
    new.reference_number is distinct from old.reference_number
    or new.user_id is distinct from old.user_id
    or new.vehicle_id is distinct from old.vehicle_id
    or new.vehicle_name is distinct from old.vehicle_name
    or new.customer_email is distinct from old.customer_email
    or new.customer_name is distinct from old.customer_name
    or new.customer_phone is distinct from old.customer_phone
    or new.customer_address is distinct from old.customer_address
    or new.pickup_location is distinct from old.pickup_location
    or new.pickup_date is distinct from old.pickup_date
    or new.return_date is distinct from old.return_date
    or new.daily_rate is distinct from old.daily_rate
    or new.rental_days is distinct from old.rental_days
    or new.subtotal is distinct from old.subtotal
    or new.insurance is distinct from old.insurance
    or new.discount is distinct from old.discount
    or new.discount_label is distinct from old.discount_label
    or new.total_price is distinct from old.total_price
    or new.payment_method is distinct from old.payment_method
    or new.is_pwd_senior is distinct from old.is_pwd_senior
    or new.is_pwd_discount is distinct from old.is_pwd_discount
    or new.driver_age is distinct from old.driver_age
    or new.renter_type is distinct from old.renter_type
    or new.driver_license_type is distinct from old.driver_license_type
    or new.driver_license_country is distinct from old.driver_license_country
    or new.foreign_license_support is distinct from old.foreign_license_support
    or new.philippines_arrival_date is distinct from old.philippines_arrival_date
    or new.driver_license_confirmed is distinct from old.driver_license_confirmed
    or new.booking_documents_ready is distinct from old.booking_documents_ready
    or new.booking_conditions_accepted is distinct from old.booking_conditions_accepted
    or new.booking_conditions_accepted_at is distinct from old.booking_conditions_accepted_at
  ) then
    raise exception 'Booking details cannot be changed after checkout has started.';
  end if;

  return new;
end;
$$;
