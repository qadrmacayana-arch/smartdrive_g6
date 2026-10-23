-- Run in the Supabase SQL Editor after vehicle-fleet-quantity.sql.
-- Sets every existing vehicle listing to 10 units, including archived listings.

update public.vehicles
set fleet_quantity = 10;

notify pgrst, 'reload schema';
