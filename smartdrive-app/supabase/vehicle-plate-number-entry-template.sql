-- FICTIONAL DEMO PLATES ONLY. Do not use these as real registration numbers.
-- Replace them with actual plates before using this fleet for real bookings.
-- Vehicle IDs are never changed.
-- Run vehicle-plate-number.sql first if the plate_number column is not installed.

with plate_entries(vehicle_id, plate_number) as (
  values
    ('1789557476766', 'DEMO-0001'), -- Sample Vehicle
    ('20', 'DEMO-0002'), -- BYD eMAX 7
    ('1', 'DEMO-0003'), -- Tesla Model 3
    ('17', 'DEMO-0004'), -- Vinfast Limo
    ('18', 'DEMO-0005'), -- BYD Seagull
    ('19', 'DEMO-0006'), -- VinFast VF 3
    ('42', 'DEMO-0007'), -- Mitsubishi Fuso Canter RV
    ('43', 'DEMO-0008'), -- Isuzu NHR Camper
    ('45', 'DEMO-0009'), -- Mercedes-Benz Sprinter RV
    ('46', 'DEMO-0010'), -- Toyota Hiace
    ('47', 'DEMO-0011'), -- Nissan NV350 Urvan
    ('48', 'DEMO-0012'), -- Foton TransVan
    ('44', 'DEMO-0013'), -- Ford Transit Motorhome
    ('55', 'DEMO-0014'), -- Winnebago Hike
    ('53', 'DEMO-0015'), -- Aerolite Cub
    ('54', 'DEMO-0016'), -- Starcraft Autumn Ridge
    ('52', 'DEMO-0017'), -- Teardrop Camper Trailer
    ('51', 'DEMO-0018'), -- Carryboy Camper
    ('50', 'DEMO-0019'), -- Hyundai Staria
    ('49', 'DEMO-0020'), -- Maxus V90
    ('41', 'DEMO-0021'), -- Toyota Coaster Motorhome
    ('40', 'DEMO-0022'), -- Honda Supra GTR 150
    ('26', 'DEMO-0023'), -- Honda Click
    ('27', 'DEMO-0024'), -- Yamaha Mio
    ('28', 'DEMO-0025'), -- Suzuki Burgman Street
    ('29', 'DEMO-0026'), -- Honda BeAT
    ('30', 'DEMO-0027'), -- Yamaha Fazzio
    ('31', 'DEMO-0028'), -- Yamaha XMAX
    ('32', 'DEMO-0029'), -- Honda Forza
    ('33', 'DEMO-0030'), -- Suzuki Burgman 400
    ('34', 'DEMO-0031'), -- Kymco Xciting S 400i
    ('35', 'DEMO-0032'), -- SYM Joymax Z+
    ('36', 'DEMO-0033'), -- Honda Wave 110
    ('37', 'DEMO-0034'), -- Yamaha Sniper 155
    ('38', 'DEMO-0035'), -- Suzuki Raider R150
    ('39', 'DEMO-0036'), -- Kawasaki CT150
    ('25', 'DEMO-0037'), -- Toyota Raize
    ('24', 'DEMO-0038'), -- Ford Everest
    ('11', 'DEMO-0039'), -- Jeep Wrangler Unlimited
    ('8', 'DEMO-0040'), -- Toyota Fortuner
    ('3', 'DEMO-0041'), -- Range Rover Sport
    ('23', 'DEMO-0042'), -- Nissan Teana
    ('22', 'DEMO-0043'), -- Honda Accord
    ('21', 'DEMO-0044'), -- Toyota Camry
    ('5', 'DEMO-0045'), -- Mercedes C-Class
    ('2', 'DEMO-0046') -- BMW 5 Series
)
update public.vehicles as vehicle
set plate_number = upper(btrim(plate_entries.plate_number))
from plate_entries
where vehicle.vehicle_id = plate_entries.vehicle_id
  and plate_entries.plate_number is not null
  and btrim(plate_entries.plate_number) <> ''
returning vehicle.vehicle_id, vehicle.name, vehicle.plate_number;
