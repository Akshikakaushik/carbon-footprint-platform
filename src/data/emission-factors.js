/**
 * Carbon Footprint Emission Factors
 * All values in kg CO2 equivalent
 * Sources: EPA, IPCC, Our World in Data
 */

const EMISSION_FACTORS = {
  transport: {
    car_petrol: 0.21,        // kg CO2 per km (average)
    car_diesel: 0.17,        // kg CO2 per km
    car_electric: 0.05,      // kg CO2 per km (grid average)
    motorcycle: 0.11,        // kg CO2 per km
    bus: 0.089,              // kg CO2 per km per passenger
    train: 0.041,            // kg CO2 per km per passenger
    domestic_flight: 0.255,  // kg CO2 per km per passenger
    international_flight: 0.195, // kg CO2 per km per passenger
    cycling: 0.0,
    walking: 0.0
  },
  food: {
    beef: 27.0,              // kg CO2 per kg food
    lamb: 39.2,
    pork: 12.1,
    chicken: 6.9,
    fish: 6.1,
    eggs: 4.8,
    dairy_milk: 3.2,         // per litre
    cheese: 13.5,
    rice: 2.7,
    vegetables: 2.0,
    fruits: 1.1,
    legumes: 0.9,
    tofu: 3.0,
    bread: 0.9
  },
  energy: {
    electricity_kwh: 0.233,  // kg CO2 per kWh (India grid avg)
    natural_gas_m3: 2.0,     // kg CO2 per m3
    lpg_kg: 2.98,            // kg CO2 per kg
    coal_kg: 2.42,
    solar_kwh: 0.02,
    wind_kwh: 0.01
  },
  shopping: {
    clothing_item: 10.0,     // kg CO2 per item (average)
    electronics_phone: 70.0,
    electronics_laptop: 300.0,
    furniture_item: 45.0,
    plastic_kg: 6.0,
    paper_kg: 1.84
  },
  waste: {
    landfill_kg: 0.5,        // kg CO2 per kg waste
    recycled_kg: 0.04,
    composted_kg: 0.01
  }
};

const GLOBAL_AVERAGES = {
  world: 4900,       // kg CO2 per year per person
  india: 1900,
  usa: 14700,
  eu: 7200,
  china: 7800,
  target_2030: 2000  // Paris Agreement compatible
};

const REDUCTION_TIPS = {
  transport: [
    { action: "Switch to public transport for daily commute", saving: 2400, difficulty: "medium", impact: "high" },
    { action: "Carpool with colleagues or neighbors", saving: 1200, difficulty: "easy", impact: "medium" },
    { action: "Switch to an electric vehicle", saving: 3000, difficulty: "hard", impact: "high" },
    { action: "Work from home 2 days per week", saving: 960, difficulty: "medium", impact: "medium" },
    { action: "Take train instead of domestic flights", saving: 1800, difficulty: "medium", impact: "high" },
    { action: "Cycle or walk for short trips under 3km", saving: 600, difficulty: "easy", impact: "low" }
  ],
  food: [
    { action: "Go vegetarian for one day per week", saving: 360, difficulty: "easy", impact: "medium" },
    { action: "Replace beef with chicken or legumes", saving: 800, difficulty: "easy", impact: "high" },
    { action: "Buy local and seasonal produce", saving: 200, difficulty: "easy", impact: "low" },
    { action: "Reduce food waste by 50%", saving: 400, difficulty: "medium", impact: "medium" },
    { action: "Adopt a plant-based diet", saving: 1500, difficulty: "hard", impact: "high" },
    { action: "Grow your own herbs and vegetables", saving: 100, difficulty: "medium", impact: "low" }
  ],
  energy: [
    { action: "Switch to LED lighting throughout home", saving: 200, difficulty: "easy", impact: "low" },
    { action: "Install solar panels", saving: 1800, difficulty: "hard", impact: "high" },
    { action: "Improve home insulation", saving: 1200, difficulty: "hard", impact: "high" },
    { action: "Use energy-efficient appliances (A+++ rated)", saving: 600, difficulty: "medium", impact: "medium" },
    { action: "Set thermostat 2°C lower in winter", saving: 400, difficulty: "easy", impact: "medium" },
    { action: "Air-dry clothes instead of using dryer", saving: 150, difficulty: "easy", impact: "low" }
  ],
  shopping: [
    { action: "Buy second-hand clothing instead of new", saving: 500, difficulty: "easy", impact: "medium" },
    { action: "Repair items instead of replacing them", saving: 300, difficulty: "medium", impact: "medium" },
    { action: "Avoid single-use plastics", saving: 100, difficulty: "easy", impact: "low" },
    { action: "Choose products with minimal packaging", saving: 80, difficulty: "easy", impact: "low" },
    { action: "Keep electronics for 2+ extra years", saving: 200, difficulty: "easy", impact: "medium" }
  ]
};

const BADGES = [
  { id: "first_step", name: "First Step", icon: "🌱", description: "Completed your first carbon calculation", threshold: 1, type: "calculations" },
  { id: "eco_aware", name: "Eco Aware", icon: "🌍", description: "Tracked footprint for 7 days", threshold: 7, type: "streak" },
  { id: "carbon_cutter", name: "Carbon Cutter", icon: "✂️", description: "Reduced footprint by 10%", threshold: 10, type: "reduction_pct" },
  { id: "green_hero", name: "Green Hero", icon: "🦸", description: "Reduced footprint by 25%", threshold: 25, type: "reduction_pct" },
  { id: "climate_champion", name: "Climate Champion", icon: "🏆", description: "Below global average emissions", threshold: 4900, type: "total_below" },
  { id: "plant_based", name: "Plant Pioneer", icon: "🥗", description: "Logged 10 vegetarian days", threshold: 10, type: "veg_days" },
  { id: "pedal_power", name: "Pedal Power", icon: "🚲", description: "Chose cycling/walking 20 times", threshold: 20, type: "active_transport" }
];

// Export for Node.js tests; expose as globals in browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EMISSION_FACTORS, GLOBAL_AVERAGES, REDUCTION_TIPS, BADGES };
} else {
  window.EMISSION_FACTORS = EMISSION_FACTORS;
  window.GLOBAL_AVERAGES  = GLOBAL_AVERAGES;
  window.REDUCTION_TIPS   = REDUCTION_TIPS;
  window.BADGES           = BADGES;
}
