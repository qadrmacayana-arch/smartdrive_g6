-- Run in the Supabase SQL Editor after the base schema and
-- vehicle-fleet-quantity.sql. Adds 10 sample cars with 10 units per listing.
-- Re-running this script will not duplicate vehicle IDs.

insert into public.vehicles (
  vehicle_id,
  name,
  type,
  main_category,
  price,
  sr_points,
  description,
  features,
  transmission,
  fuel,
  seats,
  fleet_quantity,
  status,
  is_featured
)
values
  (
    'DEMO-0047', 'Honda City', 'Sedan', 'Cars', 2200, 220,
    'A comfortable and efficient sedan for city driving and weekend trips.',
    '["Automatic transmission", "Air conditioning", "Bluetooth audio", "Backup camera"]'::jsonb,
    'Automatic', 'Gasoline', 5, 10, 'available', false
  ),
  (
    'DEMO-0048', 'Toyota Vios', 'Sedan', 'Cars', 2000, 200,
    'A practical sedan with a comfortable cabin for everyday travel.',
    '["Automatic transmission", "Air conditioning", "Bluetooth audio", "Safety airbags"]'::jsonb,
    'Automatic', 'Gasoline', 5, 10, 'available', false
  ),
  (
    'DEMO-0049', 'Mitsubishi Xpander', 'MPV', 'Cars', 2800, 280,
    'A spacious MPV suited to family trips and group outings.',
    '["7 seats", "Air conditioning", "Bluetooth audio", "Rear parking sensors"]'::jsonb,
    'Automatic', 'Gasoline', 7, 10, 'available', false
  ),
  (
    'DEMO-0050', 'Isuzu mu-X', 'SUV', 'Cars', 3600, 360,
    'A roomy SUV with a confident ride for longer journeys.',
    '["7 seats", "Air conditioning", "Cruise control", "Rear camera"]'::jsonb,
    'Automatic', 'Diesel', 7, 10, 'available', false
  ),
  (
    'DEMO-0051', 'Toyota Yaris Cross', 'SUV', 'Cars', 2700, 270,
    'A compact crossover that is easy to drive around town.',
    '["Air conditioning", "Smart entry", "Bluetooth audio", "Rear camera"]'::jsonb,
    'Automatic', 'Gasoline', 5, 10, 'available', false
  ),
  (
    'DEMO-0052', 'Nissan Almera', 'Sedan', 'Cars', 2100, 210,
    'A comfortable sedan with efficient performance for daily rentals.',
    '["Air conditioning", "Bluetooth audio", "Safety airbags", "Comfortable interior"]'::jsonb,
    'Automatic', 'Gasoline', 5, 10, 'available', false
  ),
  (
    'DEMO-0053', 'Hyundai Tucson', 'SUV', 'Cars', 3300, 330,
    'A versatile SUV with generous space for passengers and luggage.',
    '["5 seats", "Air conditioning", "Bluetooth audio", "Rear camera"]'::jsonb,
    'Automatic', 'Gasoline', 5, 10, 'available', false
  ),
  (
    'DEMO-0054', 'Kia Soluto', 'Sedan', 'Cars', 1800, 180,
    'A value-friendly sedan for comfortable city and highway travel.',
    '["Air conditioning", "Bluetooth audio", "USB charging", "Safety airbags"]'::jsonb,
    'Automatic', 'Gasoline', 5, 10, 'available', false
  ),
  (
    'DEMO-0055', 'Suzuki Ertiga', 'MPV', 'Cars', 2500, 250,
    'A practical seven-seat MPV for families and small groups.',
    '["7 seats", "Air conditioning", "Bluetooth audio", "Flexible cargo space"]'::jsonb,
    'Automatic', 'Gasoline', 7, 10, 'available', false
  ),
  (
    'DEMO-0056', 'Mitsubishi Montero Sport', 'SUV', 'Cars', 3800, 380,
    'A spacious SUV for road trips, family travel, and longer drives.',
    '["7 seats", "Air conditioning", "Cruise control", "Rear camera"]'::jsonb,
    'Automatic', 'Diesel', 7, 10, 'available', false
  )
on conflict do nothing;
