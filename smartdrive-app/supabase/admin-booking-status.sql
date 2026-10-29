-- Apply after bookings-rls.sql and booking-status-automation.sql.
-- Administrators may correct booking status while payment state remains protected.
create or replace function public.guard_booking_status_changes()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  caller_role text := coalesce(auth.role(), current_user);
  is_trusted_role boolean := caller_role in ('service_role', 'postgres', 'supabase_admin');
  is_admin boolean :=
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false);
begin
  if is_trusted_role or new.booking_status is not distinct from old.booking_status then
    return new;
  end if;

  if is_admin then
    if new.booking_status <> 'cancelled'
      and new.payment_status in ('failed', 'refunded') then
      raise exception 'Bookings with failed or refunded payments can only be cancelled.';
    end if;
    if new.booking_status in ('ongoing', 'completed')
      and new.payment_status is distinct from 'completed' then
      raise exception 'Payment must be completed before a booking can be in progress or completed.';
    end if;
    return new;
  end if;

  if auth.uid() = old.user_id
    and old.booking_status = 'confirmed'
    and new.booking_status = 'cancelled' then
    return new;
  end if;

  raise exception 'You are not authorized to change this booking status.';
end;
$$;

drop trigger if exists trg_guard_booking_status_changes on public.bookings;
create trigger trg_guard_booking_status_changes
  before update of booking_status on public.bookings
  for each row execute function public.guard_booking_status_changes();
