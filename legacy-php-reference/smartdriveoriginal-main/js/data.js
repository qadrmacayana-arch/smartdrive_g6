/**
 * @file data.js
 * This file contains the default vehicle data for the SmartDrive™ application.
 * It also includes utility functions for accessing and managing the vehicle fleet data in localStorage.
 */
const DEFAULT_VEHICLES = [
  // Main Category 1: Cars
  // A. Electric
{
    id: "1",
    name: "Tesla Model 3",
    type: "Electric",
    price: 2500,
    srPoints: 300,
    image: "https://www.autodeal.com.ph/custom/car-model-photo/original/tesla-model-3-673feb7878492.jpg",
    features: ["Autopilot", "Glass Roof", "Pristine Condition", "Fully Sanitized"],
    specs: { transmission: "Automatic", fuel: "Electric", seats: 5 },
    description: "Affordable luxury meets sustainable driving. This Tesla Model 3 is in showroom condition, offering a smooth and silent ride through Metro Manila at a budget-friendly rate."
  },
  {
    id: "17",
    name: "Vinfast Limo",
    type: "Electric",
    price: 2200,
    srPoints: 280,
    image: "https://www.autodeal.com.ph/custom/car-model-photo/original/vinfast-limo-green-69782989082af.jpg",
    features: ["Eco-Friendly", "Spacious Interior", "Modern Infotainment", "Quiet Ride"],
    specs: { transmission: "Automatic", fuel: "Electric", seats: 5 },
    description: "A stylish and sustainable choice for the modern commuter. The Vinfast Limo Green offers a comfortable ride with zero emissions."
  },
  {
    id: "18",
    name: "BYD Seagull",
    type: "Electric",
    price: 1800,
    srPoints: 220,
    image: "https://www.expressway.ph/_next/image?url=https%3A%2F%2Fqyjzqzqqjimittltttph.supabase.co%2Fstorage%2Fv1%2Fobject%2Fpublic%2Fvehicles%2Fcars%2Fbyd-seagull-1.jpg&w=3840&q=75",
    features: ["Compact Design", "Energy Efficient", "Agile Handling", "Smart Connectivity"],
    specs: { transmission: "Automatic", fuel: "Electric", seats: 4 },
    description: "The perfect city car. The BYD Seagull is a compact and efficient EV that makes navigating urban streets a breeze."
  },
  {
    id: "19",
    name: "VinFast VF 3",
    type: "Electric",
    price: 1900,
    srPoints: 240,
    image: "https://qyjzqzqqjimittltttph.supabase.co/storage/v1/object/public/vehicles/cars/vinfast-vf-3-1.jpg",
    features: ["Bold Design", "Compact SUV", "Advanced Safety", "Long Range"],
    specs: { transmission: "Automatic", fuel: "Electric", seats: 4 },
    description: "A mini-eSUV with a strong personality. The VinFast VF 3 is designed for those who want to stand out while being environmentally conscious."
  },
  {
    id: "20",
    name: "BYD eMAX 7",
    type: "Electric",
    price: 2800,
    srPoints: 350,
    image: "https://cdn.prod.website-files.com/679b275acc89c99e5cf128aa/67f3b0881ff49accc6102e7b_BYD-eMAX7-HomePageBanner-1440x900.webp",
    features: ["7-Seater", "Panoramic Sunroof", "Family Friendly", "Large Cargo Space"],
    specs: { transmission: "Automatic", fuel: "Electric", seats: 7 },
    description: "The BYD eMAX 7 is a spacious and versatile electric MPV, perfect for family trips and group outings with zero emissions."
  },
  // B. Luxury Sedan
  {
    id: "2", // Keep original ID
    name: "BMW 5 Series",
    type: "Luxury Sedan",
    price: 3500,
    srPoints: 500,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQEoGLX6mxvjr4HkQJmVpzwqVxs2aA0xpp8i8csicrWHw&s",
    features: ["Leather Seats", "Sunroof", "Regularly Serviced", "High Performance"],
    specs: { transmission: "Automatic", fuel: "Gasoline", seats: 5 },
    description: "Experience the ultimate driving machine without the premium price tag. Our 5 Series is meticulously maintained to ensure a reliable and high-quality experience for your business trips in BGC."
  },
  {
    id: "5", // Keep original ID
    name: "Mercedes C-Class",
    type: "Luxury Sedan",
    price: 3800,
    srPoints: 550,
    image: "https://hips.hearstapps.com/mtg-prod/671005298159240008c4421b/6-2025-mercedes-benz-amg-c63s-e-performance-front-view.jpg",
    features: ["MBUX System", "Burmester Audio", "Impeccable Maintenance", "Safe & Secure"],
    specs: { transmission: "Automatic", fuel: "Hybrid", seats: 5 },
    description: "Indulge in Mercedes-Benz quality at a highly competitive rate. This C-Class is maintained to the highest standards, ensuring a flawless and luxurious arrival at any event."
  },
  {
    id: "21",
    name: "Toyota Camry",
    type: "Luxury Sedan",
    price: 3200,
    srPoints: 450,
    image: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Toyota/Camry/11344/1773396920075/front-left-side-47.jpg?imwidth=420&impolicy=resize",
    features: ["Reliable", "Comfortable Ride", "Advanced Safety", "Spacious"],
    specs: { transmission: "Automatic", fuel: "Gasoline", seats: 5 },
    description: "The Toyota Camry offers a perfect blend of luxury, comfort, and legendary reliability, making it an excellent choice for business or leisure."
  },
  {
    id: "22",
    name: "Honda Accord",
    type: "Luxury Sedan",
    price: 3100,
    srPoints: 430,
    image: "https://www.usnews.com/object/image/0000019b-6fde-dc2e-affb-fffe67c90000/usnpx-2026hondaaccord-angularfront-zd1.jpg?update-time=1767108404934&size=responsiveGallery&format=webp",
    features: ["Sleek Design", "Fuel Efficient", "Honda Sensing", "Premium Interior"],
    specs: { transmission: "Automatic", fuel: "Gasoline", seats: 5 },
    description: "With its sophisticated styling and advanced features, the Honda Accord provides a refined driving experience for any occasion."
  },
  {
    id: "23",
    name: "Nissan Teana",
    type: "Luxury Sedan",
    price: 3000,
    srPoints: 420,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRFwWQK1Pcn-uhsFACpf9drNg-QA6p62F4DHna084eWhLaflVlISbOJ1Dk&s=10",
    features: ["Zero Gravity Seats", "Bose Audio", "Quiet Cabin", "Smooth Ride"],
    specs: { transmission: "Automatic", fuel: "Gasoline", seats: 5 },
    description: "The Nissan Teana is designed for ultimate comfort, featuring a quiet and luxurious cabin perfect for long drives."
  },
  // C. SUV
  {
    id: "3", // Keep original ID
    name: "Range Rover Sport",
    type: "SUV",
    price: 4500,
    srPoints: 650,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQgN-h6KIG7QQv_mmo1WTn5oTZtQlmVByhEMk85mgt0ts7SaHJCODBCi6cl&s=10",
    features: ["All-Wheel Drive", "Air Suspension", "Perfect Condition", "Spacious Interior"],
    specs: { transmission: "Automatic", fuel: "Gasoline", seats: 7 },
    description: "A top-tier SUV at an unbeatable value. This Range Rover Sport is kept in excellent condition, ready to take your family comfortably to Tagaytay with power and style."
  },
  {
    id: "8", // Keep original ID
    name: "Toyota Fortuner",
    type: "SUV",
    price: 3200,
    srPoints: 400,
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/2015_Toyota_Fortuner_%28New_Zealand%29.jpg/1280px-2015_Toyota_Fortuner_%28New_Zealand%29.jpg?utm_source=en.wikipedia.org&utm_campaign=index&utm_content=thumbnail",
    features: ["4x4 Drive", "Spacious Cabin", "Roof Rack", "Modern Infotainment"],
    specs: { transmission: "Automatic", fuel: "Diesel", seats: 7 },
    description: "Reliable and tough, the Fortuner is perfect for family trips or off‑road adventures. Equipped with comfortable seating and advanced safety features."
  },
  {
    id: "11", // Keep original ID
    name: "Jeep Wrangler Unlimited",
    type: "SUV",
    price: 3600,
    srPoints: 500,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRWlaMfgm4Hl-1-gAbDnZb1HWxeWblN-llhDsWsYDB4gw&s=10",
    features: ["4x4 Offroad", "Removable Top", "Rugged Design", "Trail Rated"],
    specs: { transmission: "Automatic", fuel: "Gasoline", seats: 5 },
    description: "Adventure-ready and iconic, the Wrangler Unlimited is perfect for exploring rough terrain or cruising around the metro with style."
  },
  {
    id: "24",
    name: "Ford Everest",
    type: "SUV",
    price: 3400,
    srPoints: 480,
    image: "https://cdn.motor1.com/images/mgl/oj1A7p/s1/2023-ford-everest-titanium.webp",
    features: ["High Ground Clearance", "7-Seater", "Advanced Tech", "Powerful Engine"],
    specs: { transmission: "Automatic", fuel: "Diesel", seats: 7 },
    description: "A tough and technologically advanced SUV, the Ford Everest is ready for any adventure, on or off the road."
  },
  {
    id: "25",
    name: "Toyota Raize",
    type: "SUV",
    price: 2300,
    srPoints: 280,
    image: "https://imgcdn.oto.com/medium/gallery/exterior/38/2367/toyota-raize-53235.jpg",
    features: ["Compact SUV", "Fuel Efficient", "Stylish Design", "Easy to Park"],
    specs: { transmission: "Automatic", fuel: "Gasoline", seats: 5 },
    description: "The Toyota Raize is a compact SUV that's big on style and features, making it the perfect vehicle for city driving and weekend trips."
  },
  // Main Category 2: Motorcycles
  // A. Traditional Commuter Scooters
  {
    id: "26",
    name: "Honda Click",
    type: "Traditional Commuter Scooters",
    price: 800,
    srPoints: 100,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS3W5Wef6Bbt0ZzVvZ1QjHSwSYtbwdSU2kGta8cXsvPx-Fw1Y7fIyNAYHE&s=10",
    features: ["Fuel Efficient", "Sporty Design", "LED Lighting", "Easy to Ride"],
    specs: { transmission: "Automatic", fuel: "Gasoline", seats: 2 },
    description: "The Honda Click is a popular choice for city commuting, known for its fuel efficiency and sporty aesthetics."
  },
  {
    id: "27",
    name: "Yamaha Mio",
    type: "Traditional Commuter Scooters",
    price: 850,
    srPoints: 110,
    image: "https://motortrade.com.ph/wp-content/uploads/2021/09/2-13.jpg",
    features: ["Lightweight", "Vibrant Colors", "Smooth Ride", "Reliable"],
    specs: { transmission: "Automatic", fuel: "Gasoline", seats: 2 },
    description: "A stylish and lightweight scooter, the Yamaha Mio is perfect for navigating through traffic with ease and flair."
  },
  {
    id: "28",
    name: "Suzuki Burgman Street",
    type: "Traditional Commuter Scooters",
    price: 900,
    srPoints: 120,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT78qMqCd7ZhtJ_afJ2kgbW1HKClo52xrAoarDlLUQMXv1Ioy-AJdiELaC8&s=10",
    features: ["Maxi-Scooter Styling", "Comfortable Seat", "Large Storage", "Digital Meter"],
    specs: { transmission: "Automatic", fuel: "Gasoline", seats: 2 },
    description: "Enjoy the comfort of a maxi-scooter in a compact package. The Suzuki Burgman Street offers a luxurious and practical ride."
  },
  {
    id: "29",
    name: "Honda BeAT",
    type: "Traditional Commuter Scooters",
    price: 750,
    srPoints: 90,
    image: "https://motorace.ph/wp-content/uploads/2024/08/BEAT-black-premium-1024x1024.png",
    features: ["Economical", "Slim Body", "User-Friendly", "Sharp Design"],
    specs: { transmission: "Automatic", fuel: "Gasoline", seats: 2 },
    description: "The Honda BeAT is an economical and user-friendly scooter, making it an ideal choice for daily commuters."
  },
  {
    id: "30",
    name: "Yamaha Fazzio",
    type: "Traditional Commuter Scooters",
    price: 950,
    srPoints: 130,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTU8ftYA_9OV0R3RqW0GfPcQ1WWl5IGlDgWTqcb4k5CynoXWAFtdCx8hYg&s=10",
    features: ["Retro-Modern Design", "Hybrid Assist", "Smart Key", "Y-Connect"],
    specs: { transmission: "Automatic", fuel: "Gasoline", seats: 2 },
    description: "A unique and fashionable scooter, the Yamaha Fazzio combines retro style with modern technology for a fun ride."
  },
  // B. Maxi-Scooters
  {
    id: "31",
    name: "Yamaha XMAX",
    type: "Maxi-Scooters",
    price: 1500,
    srPoints: 200,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJE8P_UzNxy8Hi4vb7b7D5GJECdDGTL1LM8oYXMeRiRwtd7z7A60kIISz3_47vQf7xyglZYQcNiDJw8uU1BdlvrDzPCgcMbugx6WIMZQ&s=10",
    features: ["Powerful Engine", "Traction Control", "Large Underseat Storage", "Sporty Handling"],
    specs: { transmission: "Automatic", fuel: "Gasoline", seats: 2 },
    description: "The Yamaha XMAX delivers thrilling performance and comfort, making it the ultimate maxi-scooter for both city and highway."
  },
  {
    id: "32",
    name: "Honda Forza",
    type: "Maxi-Scooters",
    price: 1600,
    srPoints: 210,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBcolDlPy00OLpChKc0o4yVq9SagX5eHsccTG7hJV5mw&s=10",
    features: ["Electrically Adjustable Screen", "Smart Key", "HSTC", "Full LED Lighting"],
    specs: { transmission: "Automatic", fuel: "Gasoline", seats: 2 },
    description: "The Honda Forza combines sophisticated styling with advanced features for a premium and comfortable long-distance ride."
  },
  {
    id: "33",
    name: "Suzuki Burgman 400",
    type: "Maxi-Scooters",
    price: 1700,
    srPoints: 220,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwTcULLFETI1G-sMwsruJ8qDYCugQtFDg45eWddLvi8bbqIVM_LF4lPciJ&s=10",
    features: ["Plush Seating", "Adjustable Backrest", "Slim Design", "Strong Performance"],
    specs: { transmission: "Automatic", fuel: "Gasoline", seats: 2 },
    description: "The Suzuki Burgman 400 is the 'Athletic and Classy' scooter, offering a perfect blend of style, performance, and comfort."
  },
  {
    id: "34",
    name: "Kymco Xciting S 400i",
    type: "Maxi-Scooters",
    price: 1650,
    srPoints: 215,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTHVnFuIizQJrA8L5o8i0Ess5vzGWPoypPq5KbDucYfHw4TxHtmwJx-3vc&s=10",
    features: ["Noodoe Navigation", "Aggressive Styling", "Powerful Engine", "Adjustable Windshield"],
    specs: { transmission: "Automatic", fuel: "Gasoline", seats: 2 },
    description: "The Kymco Xciting S 400i is a sporty and technologically advanced maxi-scooter designed for dynamic riding."
  },
  {
    id: "35",
    name: "SYM Joymax Z+",
    type: "Maxi-Scooters",
    price: 1550,
    srPoints: 205,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTVC46oFuKoxMjQtTnisFQbM3R-LrN1glOjSFBbeaKgu0ySrG98QzhEWV0&s=10",
    features: ["Compact Body", "Adjustable Windscreen", "LED Lights", "Comfortable Ergonomics"],
    specs: { transmission: "Automatic", fuel: "Gasoline", seats: 2 },
    description: "The SYM Joymax Z+ offers a great balance of comfort and agility, making it a versatile choice for all kinds of journeys."
  },
  // C. Underbones
  {
    id: "36",
    name: "Honda Wave 110",
    type: "Underbones",
    price: 600,
    srPoints: 80,
    image: "https://global.honda/content/dam/site/global-en/newsroom-new/cq_img/news/2010/c100218/01.jpg",
    features: ["Fuel Injected", "Durable", "Economical", "Practical Design"],
    specs: { transmission: "Manual", fuel: "Gasoline", seats: 2 },
    description: "The Honda Wave 110i is a legendary underbone known for its durability, fuel efficiency, and practicality for daily use."
  },
  {
    id: "37",
    name: "Yamaha Sniper 155",
    type: "Underbones",
    price: 750,
    srPoints: 95,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSXpCLz4CQ5ZozK356YWbA7Xao_x1RAH8okVN28jGT5-AiynajQ1fxIhZdt&s=10",
    features: ["Liquid-Cooled Engine", "Sporty Design", "VVA Technology", "Assist & Slipper Clutch"],
    specs: { transmission: "Manual", fuel: "Gasoline", seats: 2 },
    description: "The Yamaha Sniper 155 offers race-bred performance in an underbone package, perfect for riders who crave speed and agility."
  },
  {
    id: "38",
    name: "Suzuki Raider R150",
    type: "Underbones",
    price: 780,
    srPoints: 100,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQUEuC2QMteXmmW0TbH-TvI9AuJ_OMiEMzH2WbaSRtXeg&s=10",
    features: ["DOHC Engine", "Lightweight Frame", "Powerful Performance", "Iconic Styling"],
    specs: { transmission: "Manual", fuel: "Gasoline", seats: 2 },
    description: "The 'King of Underbones', the Suzuki Raider R150 is renowned for its powerful engine and exceptional performance on the street."
  },
  {
    id: "39",
    name: "Kawasaki CT150",
    type: "Underbones",
    price: 650,
    srPoints: 85,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqZY25BezLV1yK3lzyxJ1au3XIA1uh4T3BsyVYJlZTUJCAaZ3COmliAi95&s=10",
    features: ["Rugged Build", "High Torque", "Business Ready", "Durable"],
    specs: { transmission: "Manual", fuel: "Gasoline", seats: 2 },
    description: "The Kawasaki CT150 is a robust and reliable underbone designed for business and heavy-duty daily use."
  },
  {
    id: "40",
    name: "Honda Supra GTR 150",
    type: "Underbones",
    price: 800,
    srPoints: 105,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1nlZfvdMBFeHkY2oRgapKf4PWANjt7pzPnOxMRyaJKQ&s=10",
    features: ["6-Speed Transmission", "Sport Touring", "LED Headlight", "Digital Meter Panel"],
    specs: { transmission: "Manual", fuel: "Gasoline", seats: 2 },
    description: "The Honda Supra GTR 150 is a sport touring underbone that offers both performance and comfort for longer rides."
  },
  // Main Category 3: Recreational Vehicles
  // A. Motorhomes
  {
    id: "41",
    name: "Toyota Coaster Motorhome",
    type: "Motorhomes",
    price: 8000,
    srPoints: 1000,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMrql6qixq0vmfE4-r_yJ-ERcmepDpoIM7guNJ0-xPMq_1ayuuMbeKR_Es&s=10",
    features: ["Spacious Living Area", "Kitchenette", "Bathroom", "Comfortable Sleeping"],
    specs: { transmission: "Manual", fuel: "Diesel", seats: 6 },
    description: "Travel in comfort and style with the Toyota Coaster Motorhome, your home on wheels for the ultimate road trip."
  },
  {
    id: "42",
    name: "Mitsubishi Fuso Canter RV",
    type: "Motorhomes",
    price: 8500,
    srPoints: 1100,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVj47NNzMEA0BzFTM0hTw425YWlfvuBfh5ihlK3O4ocQ&s=10",
    features: ["Rugged Chassis", "Fully-Equipped", "Off-Grid Capable", "Ample Storage"],
    specs: { transmission: "Manual", fuel: "Diesel", seats: 4 },
    description: "Built for adventure, the Fuso Canter RV can take you anywhere with all the comforts of home."
  },
  {
    id: "43",
    name: "Isuzu NHR Camper",
    type: "Motorhomes",
    price: 7800,
    srPoints: 950,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRvJ5zUJnvW8pj1DhkJQ1mF-qIrueDuH0CncVDc9trz-3WqvXR0Iaztjck&s=10",
    features: ["Reliable Engine", "Compact Design", "Efficient Layout", "Easy to Drive"],
    specs: { transmission: "Manual", fuel: "Diesel", seats: 4 },
    description: "The Isuzu NHR Camper offers a reliable and efficient motorhome experience in a more compact and manageable size."
  },
  {
    id: "44",
    name: "Ford Transit Motorhome",
    type: "Motorhomes",
    price: 9000,
    srPoints: 1200,
    image: "https://static1.squarespace.com/static/5adbc31350a54fda2d547576/t/649f1e6b8cae3d106076f0a4/1697736612728/0-boho-camper-vans-marjorie.jpg?format=1500w",
    features: ["Modern Interior", "Advanced Tech", "Comfortable Drive", "Full Amenities"],
    specs: { transmission: "Automatic", fuel: "Diesel", seats: 4 },
    description: "Experience the latest in motorhome luxury with the Ford Transit, featuring a modern design and smart technology."
  },
  {
    id: "45",
    name: "Mercedes-Benz Sprinter RV",
    type: "Motorhomes",
    price: 12000,
    srPoints: 1500,
    image: "https://di-uploads-pod6.dealerinspire.com/mercedesbenzofhoffmanestates/uploads/2026/05/678485496_1352100810299107_3682802217675914473_n.jpg",
    features: ["Premium Finish", "Luxury Amenities", "Smooth Performance", "Spacious"],
    specs: { transmission: "Automatic", fuel: "Diesel", seats: 4 },
    description: "The pinnacle of road travel, the Mercedes-Benz Sprinter RV offers unparalleled luxury and comfort for your journey."
  },
  // B. Conversion Vans
  {
    id: "46",
    name: "Toyota Hiace",
    type: "Conversion Vans",
    price: 4000,
    srPoints: 500,
    image: "https://www.scuderiamotordesign.com/wp-content/uploads/2024/02/Toyota-Hiace-Banner.jpg",
    features: ["Versatile Seating", "Reliable", "Spacious Cabin", "Air Conditioning"],
    specs: { transmission: "Automatic", fuel: "Diesel", seats: 12 },
    description: "The legendary Toyota Hiace, converted for comfort and convenience, is perfect for group travel and family outings."
  },
  {
    id: "47",
    name: "Nissan NV350 Urvan",
    type: "Conversion Vans",
    price: 3800,
    srPoints: 480,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSjs_Z-X0DsXwW2vj9NRSsuqG67a3KB7ywYo2ViZ_yQpA&s=10",
    features: ["Powerful AC", "Comfortable Seats", "Ample Legroom", "Durable"],
    specs: { transmission: "Manual", fuel: "Diesel", seats: 15 },
    description: "A practical and comfortable choice for large groups, the Nissan NV350 Urvan offers a pleasant journey for all passengers."
  },
  {
    id: "48",
    name: "Foton TransVan",
    type: "Conversion Vans",
    price: 3500,
    srPoints: 450,
    image: "https://www.autodeal.com.ph/custom/car-model-photo/original/2018-foton-view-transvan-front-5aaa459d6d09b.jpg",
    features: ["High Roof", "Spacious Interior", "Economical", "Dual AC"],
    specs: { transmission: "Manual", fuel: "Diesel", seats: 13 },
    description: "The Foton TransVan provides excellent value with its spacious interior and economical performance, ideal for budget-conscious groups."
  },
  {
    id: "49",
    name: "Maxus V90",
    type: "Conversion Vans",
    price: 4500,
    srPoints: 550,
    image: "https://maxus.sa/wp-content/uploads/2024/06/Maxus-V90-Bus-M-IMG.jpg",
    features: ["Luxury Interior", "Captain Seats", "Advanced Safety", "Modern Design"],
    specs: { transmission: "Automatic", fuel: "Diesel", seats: 9 },
    description: "Travel in business-class comfort with the Maxus V90, featuring a luxurious interior and premium amenities."
  },
  {
    id: "50",
    name: "Hyundai Staria",
    type: "Conversion Vans",
    price: 4800,
    srPoints: 600,
    image: "https://www.hyundai.com/eu/en/models/staria-hybrid.thumb.800.480.png?ck=1747997643",
    features: ["Futuristic Design", "Panoramic Windows", "Flexible Seating", "Premium Comfort"],
    specs: { transmission: "Automatic", fuel: "Diesel", seats: 11 },
    description: "The Hyundai Staria redefines group travel with its stunning design, spacious cabin, and unparalleled comfort."
  },
  // C. Travel Trailers
  {
    id: "51",
    name: "Carryboy Camper",
    type: "Travel Trailers",
    price: 2500,
    srPoints: 300,
    image: "https://carryboymotorhome.com/img/type_b/Mitsu%20Type%20B.png",
    features: ["Lightweight", "Easy to Tow", "Basic Amenities", "Compact"],
    specs: { transmission: "N/A", fuel: "N/A", seats: 2 },
    description: "The Carryboy Camper is a lightweight and easy-to-tow trailer, perfect for spontaneous weekend getaways."
  },
  {
    id: "52",
    name: "Teardrop Camper Trailer",
    type: "Travel Trailers",
    price: 2800,
    srPoints: 350,
    image: "https://www.gorving.com/sites/default/files/styles/hero_background_image_meta_tag/public/2022-02/4.jpg?h=41f55a5b&itok=3yTeKak4",
    features: ["Aerodynamic", "Cozy Sleeping Area", "Outdoor Galley", "Retro Style"],
    specs: { transmission: "N/A", fuel: "N/A", seats: 2 },
    description: "Experience the charm of camping with the iconic Teardrop Trailer, featuring a cozy interior and a functional outdoor kitchen."
  },
  {
    id: "53",
    name: "Aerolite Cub",
    type: "Travel Trailers",
    price: 3500,
    srPoints: 450,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSpRjjnswRZaXXi2bBkQb_DdO_JJG2f_SzgK5_V44nRK52SXiHup19yQUIr&s=10",
    features: ["Expandable", "Lightweight", "Family Friendly", "Full Amenities"],
    specs: { transmission: "N/A", fuel: "N/A", seats: 4 },
    description: "The Aerolite Cub is a lightweight travel trailer with expandable sections, providing extra space for the whole family."
  },
  {
    id: "54",
    name: "Starcraft Autumn Ridge",
    type: "Travel Trailers",
    price: 4000,
    srPoints: 500,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRFSEs8D6ueIOrgWF7Hx3nTUqRu5K8_hKk5lFav39Xn5lvl4EJwjFt_imQ&s=10",
    features: ["Spacious Layout", "Residential Feel", "Slide-Outs", "Full Kitchen"],
    specs: { transmission: "N/A", fuel: "N/A", seats: 6 },
    description: "The Starcraft Autumn Ridge offers a residential feel on the road, with spacious slide-outs and a full kitchen."
  },
  {
    id: "55",
    name: "Winnebago Hike",
    type: "Travel Trailers",
    price: 4500,
    srPoints: 550,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQnYe2xvs2B73vCSuYcghdOo6-k7Q9g4eJN3pYFvKNuBgIDYzGxUmqWt3P5&s=10",
    features: ["Off-Road Ready", "Rugged Exterior", "Modern Interior", "Versatile Storage"],
    specs: { transmission: "N/A", fuel: "N/A", seats: 4 },
    description: "Built for adventure, the Winnebago Hike is a rugged travel trailer designed to go off the beaten path."
  }
];

/**
 * Retrieves the current fleet data.
 *
 * Reads the fleet from localStorage (where admin edits are persisted under
 * the key `fleetData`). If no saved data exists, or the saved data is invalid,
 * it falls back to the default fleet defined in `DEFAULT_VEHICLES`.
 *
 * @returns {Array<object>} The array of vehicle objects.
 */
function getFleet() {
  try {
    const raw = localStorage.getItem('fleetData');
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure we have a valid array before returning it.
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    // If the stored data is corrupted, fall back to defaults below.
    console.warn('Fleet data in localStorage is invalid. Using default fleet.', e);
  }
  return DEFAULT_VEHICLES.slice();
}

// Initialize the global VEHICLES and CARS variables with the current fleet data.
let VEHICLES = getFleet();
// For backward compatibility, CARS can be an alias for VEHICLES
let CARS = VEHICLES;

/**
 * Finds and returns a vehicle object by its ID.
 * @param {string} id - The ID of the vehicle to find.
 * @returns {object|undefined} The vehicle object if found, otherwise undefined.
 */
function getCarById(id) {
  return VEHICLES.find(car => car.id === id);
}

/**
 * Finds and returns a vehicle object by its name.
 * @param {string} name - The name of the vehicle to find.
 * @returns {object|undefined} The vehicle object if found, otherwise undefined.
 */
function getCarByName(name) {
  return CARS.find(car => car.name === name);
}

/**
 * Filters and returns all vehicles of a specific type.
 * @param {string} type - The vehicle type to filter by (e.g., "SUV", "Electric").
 * @returns {Array<object>} An array of vehicle objects that match the type.
 */
function getCarsByType(type) {
  return VEHICLES.filter(car => car.type === type);
}

/**
 * Returns a new array of all vehicles sorted by price.
 * @param {'asc'|'desc'} [order='asc'] - The sorting order ('asc' for ascending, 'desc' for descending).
 * @returns {Array<object>} The sorted array of vehicle objects.
 */
function getCarsSortedByPrice(order = 'asc') {
  return [...VEHICLES].sort((a, b) => {
    return order === 'asc' ? a.price - b.price : b.price - a.price;
  });
}

/**
 * Calculates the rental price breakdown.
 * @param {number} dailyRate - The daily rental rate of the vehicle.
 * @param {number} days - The total number of rental days.
 * @param {boolean} [insuranceIncluded=true] - Whether to include the standard insurance fee.
 * @returns {{subtotal: number, insurance: number, discount: number, total: number}} An object with the price breakdown.
 */
function calculateRentalPrice(dailyRate, days, insuranceIncluded = true) {
  const rental = dailyRate * days;
  const insurance = insuranceIncluded ? 500 : 0;
  const discount = rental >= 5000 ? 500 : 0;
  return {
    subtotal: rental,
    insurance: insurance,
    discount: discount,
    total: rental + insurance - discount
  };
}

/**
 * Formats a number into a currency string (e.g., ₱1,000).
 * @param {number} amount - The number to format.
 * @returns {string} The formatted currency string.
 */
function formatCurrency(amount) {
  return '₱' + amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// Utility function to format date
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

/**
 * Generates a unique reference number for a booking.
 * @returns {string} A unique reference string.
 */
function generateReferenceNumber() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9).toUpperCase();
  return `REF-${timestamp}-${random}`;
}

// --- Static Data Arrays for UI Elements ---

const CAR_TYPES = [
  'Electric', 
  'Luxury Sedan', 
  'SUV', 
  'Traditional Commuter Scooters',
  'Maxi-Scooters',
  'Underbones',
  'Motorhomes',
  'Conversion Vans',
  'Travel Trailers'
];

// Rental locations
const RENTAL_LOCATIONS = [
  'Manila - Downtown',
  'Makati - BGC Area',
  'Quezon City - EDSA',
  'Pasay - Naia Area',
  'Laguna - Sta Rosa',
  'Cebu - Downtown'
];

// Insurance options
const INSURANCE_OPTIONS = [
  { id: 1, name: 'Comprehensive Coverage', price: 500, description: 'Full coverage including damages and accidents' },
  { id: 2, name: 'Basic Coverage', price: 300, description: 'Basic protection for major incidents' },
  { id: 3, name: 'No Insurance', price: 0, description: 'No additional insurance' }
];

// Payment methods
const PAYMENT_METHODS = [
  { id: 'credit-card', name: 'Credit Card', icon: '💳' },
  { id: 'gcash', name: 'GCash', icon: '📱' },
  { id: 'maya', name: 'Maya', icon: '💸' }
];

// License types
const LICENSE_TYPES = [
  'Non-Professional Driver\'s License',
  'Professional Driver\'s License',
  'International Driving Permit'
];