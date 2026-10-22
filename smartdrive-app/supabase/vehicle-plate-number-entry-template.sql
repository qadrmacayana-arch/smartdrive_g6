-- Enter the real registration plate for each listed vehicle by replacing NULL
-- with a quoted value, for example: ('1', 'ABC-1234').
-- Rows left NULL or blank are skipped. Vehicle IDs are never changed.
-- Run vehicle-plate-number.sql first if the plate_number column is not installed.

with plate_entries(vehicle_id, plate_number) as (
  values
    ('1789557476766', null::text), -- Sample Vehicle
    ('20', null::text), -- BYD eMAX 7
    ('1', null::text), -- Tesla Model 3
    ('17', null::text), -- Vinfast Limo
    ('18', null::text), -- BYD Seagull
    ('19', null::text), -- VinFast VF 3
    ('42', null::text), -- Mitsubishi Fuso Canter RV
    ('43', null::text), -- Isuzu NHR Camper
    ('45', null::text), -- Mercedes-Benz Sprinter RV
    ('46', null::text), -- Toyota Hiace
    ('47', null::text), -- Nissan NV350 Urvan
    ('48', null::text), -- Foton TransVan
    ('44', null::text), -- Ford Transit Motorhome
    ('55', null::text), -- Winnebago Hike
    ('53', null::text), -- Aerolite Cub
    ('54', null::text), -- Starcraft Autumn Ridge
    ('52', null::text), -- Teardrop Camper Trailer
    ('51', null::text), -- Carryboy Camper
    ('50', null::text), -- Hyundai Staria
    ('49', null::text), -- Maxus V90
    ('41', null::text), -- Toyota Coaster Motorhome
    ('40', null::text), -- Honda Supra GTR 150
    ('26', null::text), -- Honda Click
    ('27', null::text), -- Yamaha Mio
    ('28', null::text), -- Suzuki Burgman Street
    ('29', null::text), -- Honda BeAT
    ('30', null::text), -- Yamaha Fazzio
    ('31', null::text), -- Yamaha XMAX
    ('32', null::text), -- Honda Forza
    ('33', null::text), -- Suzuki Burgman 400
    ('34', null::text), -- Kymco Xciting S 400i
    ('35', null::text), -- SYM Joymax Z+
    ('36', null::text), -- Honda Wave 110
    ('37', null::text), -- Yamaha Sniper 155
    ('38', null::text), -- Suzuki Raider R150
    ('39', null::text), -- Kawasaki CT150
    ('25', null::text), -- Toyota Raize
    ('24', null::text), -- Ford Everest
    ('11', null::text), -- Jeep Wrangler Unlimited
    ('8', null::text), -- Toyota Fortuner
    ('3', null::text), -- Range Rover Sport
    ('23', null::text), -- Nissan Teana
    ('22', null::text), -- Honda Accord
    ('21', null::text), -- Toyota Camry
    ('5', null::text), -- Mercedes C-Class
    ('2', null::text) -- BMW 5 Series
)
update public.vehicles as vehicle
set plate_number = upper(btrim(plate_entries.plate_number))
from plate_entries
where vehicle.vehicle_id = plate_entries.vehicle_id
  and plate_entries.plate_number is not null
  and btrim(plate_entries.plate_number) <> ''
returning vehicle.vehicle_id, vehicle.name, vehicle.plate_number;
