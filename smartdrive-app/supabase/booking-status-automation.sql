create extension if not exists pg_cron;

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
    if new.booking_status = 'cancelled' or old.booking_status = 'cancelled' then
      raise exception 'Only the customer can cancel a booking, and customer cancellations cannot be reversed by an admin.';
    end if;
    if old.booking_status is distinct from 'ongoing' or new.booking_status is distinct from 'completed' then
      raise exception 'Admins can only mark an in-progress booking completed after confirming the vehicle was returned.';
    end if;
  elsif auth.uid() = old.user_id then
    if old.booking_status is distinct from 'confirmed' or new.booking_status is distinct from 'cancelled' then
      raise exception 'Customers can only cancel their own confirmed bookings.';
    end if;
  else
    raise exception 'You are not authorized to change this booking status.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_booking_status_changes on public.bookings;
create trigger trg_guard_booking_status_changes
  before update of booking_status on public.bookings
  for each row execute function public.guard_booking_status_changes();

do $$
declare
  existing_job record;
begin
  for existing_job in
    select jobid from cron.job where jobname = 'smartdrive-start-due-bookings'
  loop
    perform cron.unschedule(existing_job.jobid);
  end loop;

  perform cron.schedule(
    'smartdrive-start-due-bookings',
    '*/15 * * * *',
    $command$
      update public.bookings
      set booking_status = 'ongoing'
      where booking_status = 'confirmed'
        and pickup_date <= (now() at time zone 'Asia/Manila')::date;
    $command$
  );
end;
$$;

do $$
declare
  existing_job record;
begin
  for existing_job in
    select jobid from cron.job where jobname = 'smartdrive-expire-unpaid-bookings'
  loop
    perform cron.unschedule(existing_job.jobid);
  end loop;

  perform cron.schedule(
    'smartdrive-expire-unpaid-bookings',
    '* * * * *',
    $command$
      update public.bookings
      set booking_status = 'cancelled',
          payment_status = 'failed'
      where booking_status = 'confirmed'
        and payment_status = 'pending'
        and created_at <= now() - interval '10 minutes';
    $command$
  );
end;
$$;
