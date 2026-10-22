-- Run in Supabase SQL Editor when review operations report a missing booking_id column.
alter table public.reviews
  add column if not exists booking_id bigint
  references public.bookings(id) on delete set null on update cascade;

create index if not exists idx_reviews_booking_id
  on public.reviews (booking_id);

notify pgrst, 'reload schema';
