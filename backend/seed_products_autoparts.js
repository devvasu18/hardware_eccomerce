const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const Category = require('./models/Category');

dotenv.config();

// Auto Parts Products by Category
const autoPartsProducts = {
    'engine-parts': [
        { name: 'Engine Oil Filter - Premium Grade', basePrice: 450, discountedPrice: 380, stock: 150, hsnCode: '84099199', description: 'High-quality oil filter for all major car brands' },
        { name: 'Spark Plug Set (4 pcs) - NGK', basePrice: 1200, discountedPrice: 999, stock: 200, hsnCode: '85111000', description: 'NGK iridium spark plugs for better performance' },
        { name: 'Air Filter - K&N Performance', basePrice: 2500, discountedPrice: 2199, stock: 80, hsnCode: '84213990', description: 'Washable and reusable air filter' },
        { name: 'Timing Belt Kit - Gates', basePrice: 3500, discountedPrice: 2999, stock: 60, hsnCode: '40103900', description: 'Complete timing belt kit with tensioner' },
        { name: 'Engine Gasket Set - Victor Reinz', basePrice: 4500, discountedPrice: 3899, stock: 45, hsnCode: '84099199', description: 'Full engine gasket set for overhaul' },
        { name: 'Piston Ring Set - Mahle', basePrice: 3200, discountedPrice: 2799, stock: 50, hsnCode: '84099100', description: 'Premium piston rings for engine rebuild' },
        { name: 'Cylinder Head Gasket - Elring', basePrice: 1800, discountedPrice: 1599, stock: 70, hsnCode: '84099199', description: 'Multi-layer steel head gasket' },
        { name: 'Crankshaft Seal Kit', basePrice: 650, discountedPrice: 549, stock: 120, hsnCode: '84099199', description: 'Front and rear crankshaft seals' },
        { name: 'Valve Cover Gasket - OEM Quality', basePrice: 890, discountedPrice: 749, stock: 100, hsnCode: '84099199', description: 'Prevents oil leaks from valve cover' },
        { name: 'Engine Mount Set (3 pcs)', basePrice: 4200, discountedPrice: 3599, stock: 40, hsnCode: '40169390', description: 'Rubber engine mounts for vibration control' },
        { name: 'Camshaft Position Sensor', basePrice: 2100, discountedPrice: 1799, stock: 65, hsnCode: '90318090', description: 'OEM replacement sensor' },
        { name: 'Oil Pump - High Pressure', basePrice: 5500, discountedPrice: 4699, stock: 30, hsnCode: '84133090', description: 'High-flow oil pump for better lubrication' },
        { name: 'Water Pump - Bosch', basePrice: 3800, discountedPrice: 3299, stock: 55, hsnCode: '84137090', description: 'Cooling system water pump' },
        { name: 'Thermostat Housing Assembly', basePrice: 1200, discountedPrice: 999, stock: 90, hsnCode: '84818090', description: 'Complete thermostat housing with sensor' },
        { name: 'Engine Coolant Temperature Sensor', basePrice: 850, discountedPrice: 699, stock: 110, hsnCode: '90318090', description: 'Accurate temperature monitoring' }
    ],
    'brake-system': [
        { name: 'Brake Pad Set - Front (Ceramic)', basePrice: 2800, discountedPrice: 2399, stock: 120, hsnCode: '87083010', description: 'Low dust ceramic brake pads' },
        { name: 'Brake Disc Rotor - Ventilated (Pair)', basePrice: 4500, discountedPrice: 3899, stock: 80, hsnCode: '87083010', description: 'Ventilated disc rotors for better cooling' },
        { name: 'Brake Caliper - Front Right', basePrice: 6500, discountedPrice: 5599, stock: 35, hsnCode: '87083010', description: 'Remanufactured brake caliper' },
        { name: 'Brake Master Cylinder', basePrice: 5200, discountedPrice: 4499, stock: 40, hsnCode: '87083010', description: 'Hydraulic brake master cylinder' },
        { name: 'Brake Fluid DOT 4 (1 Liter)', basePrice: 450, discountedPrice: 379, stock: 200, hsnCode: '38200000', description: 'High-performance brake fluid' },
        { name: 'Brake Hose Kit - Stainless Steel', basePrice: 3200, discountedPrice: 2799, stock: 60, hsnCode: '40093100', description: 'Braided stainless steel brake lines' },
        { name: 'Brake Shoe Set - Rear Drum', basePrice: 1800, discountedPrice: 1549, stock: 90, hsnCode: '87083010', description: 'Rear drum brake shoes' },
        { name: 'Wheel Cylinder - Rear (Pair)', basePrice: 1400, discountedPrice: 1199, stock: 75, hsnCode: '87083010', description: 'Rear wheel cylinders for drum brakes' },
        { name: 'ABS Sensor - Front', basePrice: 1900, discountedPrice: 1649, stock: 85, hsnCode: '90318090', description: 'Anti-lock brake system sensor' },
        { name: 'Brake Booster - Vacuum Assisted', basePrice: 7500, discountedPrice: 6499, stock: 25, hsnCode: '87083010', description: 'Power brake booster' },
        { name: 'Parking Brake Cable - Rear', basePrice: 1100, discountedPrice: 949, stock: 95, hsnCode: '87083010', description: 'Hand brake cable assembly' },
        { name: 'Brake Pad Wear Sensor', basePrice: 650, discountedPrice: 549, stock: 130, hsnCode: '90318090', description: 'Electronic brake pad wear indicator' },
        { name: 'Brake Caliper Repair Kit', basePrice: 890, discountedPrice: 749, stock: 110, hsnCode: '87083010', description: 'Seals and hardware for caliper rebuild' },
        { name: 'Brake Drum - Rear (Single)', basePrice: 2200, discountedPrice: 1899, stock: 70, hsnCode: '87083010', description: 'Cast iron brake drum' },
        { name: 'Brake Proportioning Valve', basePrice: 2800, discountedPrice: 2399, stock: 50, hsnCode: '87083010', description: 'Adjustable brake bias valve' }
    ],
    'suspension-steering': [
        { name: 'Shock Absorber - Front (Pair)', basePrice: 5500, discountedPrice: 4699, stock: 60, hsnCode: '87088010', description: 'Gas-charged shock absorbers' },
        { name: 'Strut Assembly - Complete Front', basePrice: 8500, discountedPrice: 7299, stock: 40, hsnCode: '87088010', description: 'Quick-strut complete assembly' },
        { name: 'Control Arm - Lower Front Right', basePrice: 3200, discountedPrice: 2799, stock: 55, hsnCode: '87088010', description: 'Stamped steel control arm with bushings' },
        { name: 'Ball Joint - Upper (Pair)', basePrice: 1800, discountedPrice: 1549, stock: 80, hsnCode: '87088010', description: 'Greasable ball joints' },
        { name: 'Tie Rod End - Outer', basePrice: 950, discountedPrice: 799, stock: 120, hsnCode: '87088010', description: 'Steering tie rod end' },
        { name: 'Sway Bar Link Kit - Front', basePrice: 1200, discountedPrice: 999, stock: 100, hsnCode: '87088010', description: 'Stabilizer bar links with bushings' },
        { name: 'Coil Spring - Front (Pair)', basePrice: 4200, discountedPrice: 3599, stock: 45, hsnCode: '73202000', description: 'Heavy-duty coil springs' },
        { name: 'Steering Rack - Power Assisted', basePrice: 15500, discountedPrice: 13299, stock: 20, hsnCode: '87088010', description: 'Remanufactured power steering rack' },
        { name: 'Power Steering Pump', basePrice: 6800, discountedPrice: 5899, stock: 35, hsnCode: '84133090', description: 'Hydraulic power steering pump' },
        { name: 'Wheel Bearing Hub Assembly - Front', basePrice: 3500, discountedPrice: 2999, stock: 70, hsnCode: '84821090', description: 'Complete hub assembly with ABS sensor' },
        { name: 'Strut Mount - Front (Pair)', basePrice: 1600, discountedPrice: 1349, stock: 90, hsnCode: '40169390', description: 'Rubber strut top mounts' },
        { name: 'Rack and Pinion Boot Kit', basePrice: 650, discountedPrice: 549, stock: 110, hsnCode: '40169390', description: 'Steering rack dust boots' },
        { name: 'Idler Arm - Steering', basePrice: 2100, discountedPrice: 1799, stock: 65, hsnCode: '87088010', description: 'Center link idler arm' },
        { name: 'Pitman Arm - Heavy Duty', basePrice: 2400, discountedPrice: 2049, stock: 55, hsnCode: '87088010', description: 'Steering box pitman arm' },
        { name: 'Suspension Bushing Kit - Complete', basePrice: 3800, discountedPrice: 3299, stock: 40, hsnCode: '40169390', description: 'Polyurethane bushing set' }
    ],
    'electrical-parts': [
        { name: 'Car Battery 12V 65Ah - Exide', basePrice: 6500, discountedPrice: 5599, stock: 80, hsnCode: '85071000', description: 'Maintenance-free car battery' },
        { name: 'Alternator - 120A Remanufactured', basePrice: 8500, discountedPrice: 7299, stock: 45, hsnCode: '85114000', description: 'High-output alternator' },
        { name: 'Starter Motor - Bosch', basePrice: 7200, discountedPrice: 6199, stock: 50, hsnCode: '85114000', description: 'Gear reduction starter' },
        { name: 'Ignition Coil Pack (4 pcs)', basePrice: 4500, discountedPrice: 3899, stock: 70, hsnCode: '85114000', description: 'Direct ignition coils' },
        { name: 'Fuel Pump - Electric In-Tank', basePrice: 5800, discountedPrice: 4999, stock: 60, hsnCode: '84133090', description: 'High-pressure fuel pump' },
        { name: 'Oxygen Sensor - Upstream', basePrice: 3200, discountedPrice: 2799, stock: 85, hsnCode: '90318090', description: 'Heated O2 sensor' },
        { name: 'Mass Air Flow Sensor - MAF', basePrice: 4800, discountedPrice: 4199, stock: 55, hsnCode: '90318090', description: 'Hot-wire MAF sensor' },
        { name: 'Throttle Position Sensor', basePrice: 1800, discountedPrice: 1549, stock: 95, hsnCode: '90318090', description: 'TPS for fuel injection' },
        { name: 'Wiper Motor - Front', basePrice: 2400, discountedPrice: 2049, stock: 75, hsnCode: '85129000', description: 'Variable speed wiper motor' },
        { name: 'Horn - Dual Tone', basePrice: 850, discountedPrice: 699, stock: 150, hsnCode: '85122000', description: 'Electric horn set' },
        { name: 'Relay Set - Automotive (5 pcs)', basePrice: 650, discountedPrice: 549, stock: 200, hsnCode: '85364900', description: 'Multi-purpose relays' },
        { name: 'Fuse Box - Complete Assembly', basePrice: 3500, discountedPrice: 2999, stock: 40, hsnCode: '85363090', description: 'Under-hood fuse panel' },
        { name: 'Voltage Regulator - Alternator', basePrice: 1200, discountedPrice: 999, stock: 100, hsnCode: '85114000', description: 'Electronic voltage regulator' },
        { name: 'Distributor Cap and Rotor Kit', basePrice: 950, discountedPrice: 799, stock: 80, hsnCode: '85114000', description: 'Ignition distributor parts' },
        { name: 'Crankshaft Position Sensor', basePrice: 2100, discountedPrice: 1799, stock: 90, hsnCode: '90318090', description: 'Engine position sensor' }
    ],
    'filters-fluids': [
        { name: 'Engine Oil 5W-30 Synthetic (5L)', basePrice: 2800, discountedPrice: 2399, stock: 150, hsnCode: '27101990', description: 'Fully synthetic motor oil' },
        { name: 'Transmission Fluid ATF (4L)', basePrice: 1800, discountedPrice: 1549, stock: 120, hsnCode: '27101990', description: 'Automatic transmission fluid' },
        { name: 'Coolant/Antifreeze (5L)', basePrice: 1200, discountedPrice: 999, stock: 180, hsnCode: '38200000', description: 'Pre-mixed engine coolant' },
        { name: 'Power Steering Fluid (1L)', basePrice: 450, discountedPrice: 379, stock: 200, hsnCode: '38200000', description: 'Hydraulic steering fluid' },
        { name: 'Fuel Filter - Inline', basePrice: 650, discountedPrice: 549, stock: 140, hsnCode: '84212300', description: 'Fuel line filter' },
        { name: 'Cabin Air Filter - HEPA', basePrice: 890, discountedPrice: 749, stock: 160, hsnCode: '84213990', description: 'High-efficiency cabin filter' },
        { name: 'Transmission Filter Kit', basePrice: 1400, discountedPrice: 1199, stock: 90, hsnCode: '84212300', description: 'Filter with gasket and pan' },
        { name: 'Differential Fluid 75W-90 (1L)', basePrice: 850, discountedPrice: 699, stock: 110, hsnCode: '27101990', description: 'Gear oil for differentials' },
        { name: 'Windshield Washer Fluid (5L)', basePrice: 280, discountedPrice: 249, stock: 250, hsnCode: '34029090', description: 'All-season washer fluid' },
        { name: 'Brake Cleaner Spray (500ml)', basePrice: 320, discountedPrice: 269, stock: 200, hsnCode: '34029090', description: 'Non-chlorinated brake cleaner' },
        { name: 'Engine Degreaser (1L)', basePrice: 450, discountedPrice: 379, stock: 150, hsnCode: '34029090', description: 'Heavy-duty engine cleaner' },
        { name: 'Hydraulic Oil Filter', basePrice: 750, discountedPrice: 649, stock: 100, hsnCode: '84212300', description: 'Spin-on hydraulic filter' },
        { name: 'Grease - Lithium Multi-Purpose (500g)', basePrice: 380, discountedPrice: 319, stock: 180, hsnCode: '27101990', description: 'Chassis grease' },
        { name: 'Radiator Flush (500ml)', basePrice: 420, discountedPrice: 349, stock: 130, hsnCode: '38200000', description: 'Cooling system cleaner' },
        { name: 'Fuel Injector Cleaner (300ml)', basePrice: 550, discountedPrice: 469, stock: 170, hsnCode: '38112900', description: 'Fuel system treatment' }
    ],
    'body-parts': [
        { name: 'Front Bumper - Primed', basePrice: 8500, discountedPrice: 7299, stock: 25, hsnCode: '87089900', description: 'Replacement front bumper cover' },
        { name: 'Rear Bumper - Primed', basePrice: 7800, discountedPrice: 6699, stock: 30, hsnCode: '87089900', description: 'Replacement rear bumper cover' },
        { name: 'Front Fender - Right', basePrice: 5500, discountedPrice: 4699, stock: 35, hsnCode: '87089900', description: 'Steel front fender panel' },
        { name: 'Hood - Steel', basePrice: 9500, discountedPrice: 8199, stock: 20, hsnCode: '87089900', description: 'Front hood panel' },
        { name: 'Door Shell - Front Left', basePrice: 12500, discountedPrice: 10799, stock: 15, hsnCode: '87089900', description: 'Complete door shell' },
        { name: 'Side Mirror - Power Folding Right', basePrice: 3800, discountedPrice: 3299, stock: 50, hsnCode: '87089900', description: 'Electric side mirror with indicator' },
        { name: 'Grille - Front Chrome', basePrice: 4200, discountedPrice: 3599, stock: 40, hsnCode: '87089900', description: 'Front radiator grille' },
        { name: 'Door Handle - Exterior Front', basePrice: 1200, discountedPrice: 999, stock: 80, hsnCode: '87089900', description: 'Chrome door handle' },
        { name: 'Trunk Lid - Rear', basePrice: 8800, discountedPrice: 7599, stock: 18, hsnCode: '87089900', description: 'Rear trunk/boot lid' },
        { name: 'Rocker Panel - Left Side', basePrice: 3500, discountedPrice: 2999, stock: 30, hsnCode: '87089900', description: 'Side skirt panel' },
        { name: 'Wheel Arch Trim - Front', basePrice: 1800, discountedPrice: 1549, stock: 60, hsnCode: '87089900', description: 'Fender liner trim' },
        { name: 'Windshield Molding - Upper', basePrice: 950, discountedPrice: 799, stock: 70, hsnCode: '87089900', description: 'Windshield trim strip' },
        { name: 'Mud Flap Set (4 pcs)', basePrice: 1100, discountedPrice: 949, stock: 100, hsnCode: '40169390', description: 'Rubber mud guards' },
        { name: 'Bumper Bracket - Front', basePrice: 850, discountedPrice: 699, stock: 90, hsnCode: '87089900', description: 'Bumper mounting bracket' },
        { name: 'Door Seal - Weather Strip', basePrice: 1400, discountedPrice: 1199, stock: 85, hsnCode: '40169390', description: 'Rubber door seal' }
    ],
    'lighting': [
        { name: 'Headlight Assembly - Halogen Right', basePrice: 4500, discountedPrice: 3899, stock: 50, hsnCode: '85122000', description: 'Complete headlight unit' },
        { name: 'LED Headlight Bulb H4 (Pair)', basePrice: 2800, discountedPrice: 2399, stock: 120, hsnCode: '85392190', description: 'High-brightness LED bulbs' },
        { name: 'Tail Light Assembly - Left', basePrice: 3200, discountedPrice: 2799, stock: 60, hsnCode: '85122000', description: 'Rear tail light cluster' },
        { name: 'Fog Light - Front (Pair)', basePrice: 2400, discountedPrice: 2049, stock: 80, hsnCode: '85122000', description: 'Fog lamp set with wiring' },
        { name: 'Turn Signal Light - Side Mirror', basePrice: 650, discountedPrice: 549, stock: 140, hsnCode: '85122000', description: 'LED side indicator' },
        { name: 'Interior Dome Light - LED', basePrice: 450, discountedPrice: 379, stock: 180, hsnCode: '85122000', description: 'Cabin ceiling light' },
        { name: 'License Plate Light (Pair)', basePrice: 380, discountedPrice: 319, stock: 200, hsnCode: '85122000', description: 'Number plate lamps' },
        { name: 'Daytime Running Light - DRL Strip', basePrice: 1800, discountedPrice: 1549, stock: 90, hsnCode: '85122000', description: 'LED DRL strips' },
        { name: 'Reverse Light Bulb - LED', basePrice: 320, discountedPrice: 269, stock: 160, hsnCode: '85392190', description: 'Backup light bulbs' },
        { name: 'Headlight Bulb H7 Halogen (Pair)', basePrice: 550, discountedPrice: 469, stock: 150, hsnCode: '85392190', description: 'Standard halogen bulbs' },
        { name: 'Brake Light Bulb - LED (Pair)', basePrice: 480, discountedPrice: 399, stock: 170, hsnCode: '85392190', description: 'Stop light bulbs' },
        { name: 'Fog Light Bulb H11 (Pair)', basePrice: 420, discountedPrice: 349, stock: 130, hsnCode: '85392190', description: 'Yellow fog bulbs' },
        { name: 'Headlight Leveling Motor', basePrice: 1500, discountedPrice: 1299, stock: 70, hsnCode: '85122000', description: 'Auto-leveling actuator' },
        { name: 'Third Brake Light - LED Bar', basePrice: 1200, discountedPrice: 999, stock: 100, hsnCode: '85122000', description: 'High-mount stop lamp' },
        { name: 'Headlight Washer Nozzle', basePrice: 850, discountedPrice: 699, stock: 80, hsnCode: '85122000', description: 'Headlamp cleaning jet' }
    ],
    'tires-wheels': [
        { name: 'All-Season Tire 195/65R15', basePrice: 4500, discountedPrice: 3899, stock: 100, hsnCode: '40111000', description: 'Radial passenger tire' },
        { name: 'Performance Tire 205/55R16', basePrice: 5800, discountedPrice: 4999, stock: 80, hsnCode: '40111000', description: 'High-performance summer tire' },
        { name: 'SUV Tire 235/60R18', basePrice: 7500, discountedPrice: 6499, stock: 60, hsnCode: '40111000', description: 'All-terrain SUV tire' },
        { name: 'Alloy Wheel 16" - 5 Spoke', basePrice: 6500, discountedPrice: 5599, stock: 50, hsnCode: '87087090', description: 'Aluminum alloy rim' },
        { name: 'Steel Wheel 15" - Black', basePrice: 2800, discountedPrice: 2399, stock: 90, hsnCode: '87087090', description: 'Painted steel rim' },
        { name: 'Wheel Hub Cap Set (4 pcs)', basePrice: 1200, discountedPrice: 999, stock: 120, hsnCode: '87087090', description: 'Chrome wheel covers' },
        { name: 'Tire Valve Stem - TPMS Compatible', basePrice: 280, discountedPrice: 249, stock: 200, hsnCode: '40169390', description: 'Rubber valve stems' },
        { name: 'Wheel Lug Nuts - Chrome (Set of 20)', basePrice: 650, discountedPrice: 549, stock: 150, hsnCode: '73181600', description: 'Conical seat lug nuts' },
        { name: 'Wheel Spacer Kit 20mm (Pair)', basePrice: 1800, discountedPrice: 1549, stock: 70, hsnCode: '87087090', description: 'Aluminum wheel spacers' },
        { name: 'Tire Pressure Sensor - TPMS', basePrice: 2400, discountedPrice: 2049, stock: 85, hsnCode: '90318090', description: 'Wireless tire sensor' },
        { name: 'Wheel Alignment Shim Kit', basePrice: 850, discountedPrice: 699, stock: 110, hsnCode: '87089900', description: 'Camber adjustment shims' },
        { name: 'Tire Repair Kit - Tubeless', basePrice: 450, discountedPrice: 379, stock: 180, hsnCode: '40169390', description: 'Emergency tire plug kit' },
        { name: 'Wheel Weight - Adhesive (Box of 50)', basePrice: 550, discountedPrice: 469, stock: 140, hsnCode: '78060090', description: 'Stick-on balance weights' },
        { name: 'Spare Tire - Compact 125/70R16', basePrice: 3500, discountedPrice: 2999, stock: 45, hsnCode: '40111000', description: 'Space-saver spare tire' },
        { name: 'Wheel Lock Set - Anti-Theft', basePrice: 1400, discountedPrice: 1199, stock: 95, hsnCode: '73181600', description: 'Locking lug nuts with key' }
    ]
};

async function seedAutoPartsProducts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hardware_system');
        console.log('MongoDB Connected for seeding products...\n');

        // Clear existing products
        await Product.deleteMany({});
        console.log('✓ Cleared existing products\n');

        let totalProducts = 0;
        const categories = await Category.find({});

        for (const category of categories) {
            const products = autoPartsProducts[category.slug];

            if (products && products.length > 0) {
                const productsToInsert = products.map(product => {
                    // Select image based on category
                    const categoryImages = {
                        'engine-parts': [
                            'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=800&auto=format&fit=crop', // Engine
                            'https://images.unsplash.com/photo-1597758399580-0a2da484274c?q=80&w=800&auto=format&fit=crop'  // Pistons
                        ],
                        'brake-system': [
                            'https://images.unsplash.com/photo-1601000676461-291771457805?q=80&w=800&auto=format&fit=crop', // Brake disc
                            'https://images.unsplash.com/photo-1582298538104-fe2e74c2ed54?q=80&w=800&auto=format&fit=crop'  // Car parts
                        ],
                        'suspension-steering': [
                            'https://images.unsplash.com/photo-1550508538-34c56aec7f43?q=80&w=800&auto=format&fit=crop', // Undercarriage
                            'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?q=80&w=800&auto=format&fit=crop'  // Mechanic
                        ],
                        'electrical-parts': [
                            'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=800&auto=format&fit=crop', // Battery
                            'https://images.unsplash.com/photo-1555627228-59424294b4e9?q=80&w=800&auto=format&fit=crop'  // Multimeter
                        ],
                        'filters-fluids': [
                            'https://images.unsplash.com/photo-1635773173369-02c38d61749a?q=80&w=800&auto=format&fit=crop', // Oil
                            'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?q=80&w=800&auto=format&fit=crop'  // Pouring oil
                        ],
                        'body-parts': [
                            'https://images.unsplash.com/photo-1627454820574-fb600aa5d4e1?q=80&w=800&auto=format&fit=crop', // Door
                            'https://images.unsplash.com/photo-1618609571343-41bbd9646bde?q=80&w=800&auto=format&fit=crop'  // Modern car
                        ],
                        'lighting': [
                            'https://images.unsplash.com/photo-1580273916550-e323be2ebdd9?q=80&w=800&auto=format&fit=crop', // Headlight
                            'https://images.unsplash.com/photo-1549480606-5386f6874402?q=80&w=800&auto=format&fit=crop'  // Car lights
                        ],
                        'tires-wheels': [
                            'https://images.unsplash.com/photo-1580274455191-1c62238fa333?q=80&w=800&auto=format&fit=crop', // Tire
                            'https://images.unsplash.com/photo-1578844251758-2f71da645217?q=80&w=800&auto=format&fit=crop'  // Wheel
                        ]
                    };

                    const fallbackImage = 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=800&auto=format&fit=crop';

                    // Pick a random image from the category list or use fallback
                    const catImages = categoryImages[category.slug] || [fallbackImage];
                    const selectedImage = catImages[Math.floor(Math.random() * catImages.length)];
                    const secondaryImage = catImages[(Math.floor(Math.random() * catImages.length) + 1) % catImages.length];

                    return {
                        ...product,
                        category: category.slug,
                        imageUrl: selectedImage,
                        images: [selectedImage, secondaryImage],
                        isVisible: true,
                        isFeatured: Math.random() > 0.8, // 20% chance of being featured
                        isTopSale: Math.random() > 0.85, // 15% chance of being top sale
                        isNewArrival: Math.random() > 0.9, // 10% chance of being new arrival
                        specifications: {
                            'Brand': ['Bosch', 'NGK', 'Mahle', 'Gates', 'OEM', 'Aftermarket'][Math.floor(Math.random() * 6)],
                            'Warranty': ['6 Months', '1 Year', '2 Years'][Math.floor(Math.random() * 3)],
                            'Condition': 'New'
                        },
                        unit: 'piece'
                    };
                });

                await Product.insertMany(productsToInsert);

                // Update category product count
                await Category.findByIdAndUpdate(category._id, {
                    productCount: productsToInsert.length
                });

                console.log(`✓ Inserted ${productsToInsert.length} products for "${category.name}"`);
                totalProducts += productsToInsert.length;
            }
        }

        console.log(`\n✅ Successfully seeded ${totalProducts} auto parts products across ${categories.length} categories!`);
        console.log('\nProduct distribution:');
        for (const category of categories) {
            const count = await Product.countDocuments({ category: category.slug });
            console.log(`  - ${category.name}: ${count} products`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error seeding products:', error);
        process.exit(1);
    }
}

seedAutoPartsProducts();
