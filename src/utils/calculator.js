/**
 * Carbon Footprint Calculator
 * Core logic for calculating emissions from user inputs
 */

// Loaded via require (Node/tests) or from window globals (browser)
const _emissionModule = typeof require !== 'undefined'
  ? require('../data/emission-factors.js')
  : null;

class CarbonCalculator {
  constructor() {
    // Resolve at instantiation time so browser globals are guaranteed to exist
    const ef = _emissionModule ? _emissionModule.EMISSION_FACTORS : window.EMISSION_FACTORS;
    const ga = _emissionModule ? _emissionModule.GLOBAL_AVERAGES  : window.GLOBAL_AVERAGES;
    this.factors = ef;
    this._globalAverages = ga;
  }

  /**
   * Calculate transport emissions
   * @param {Object} transport - Transport data
   * @returns {number} kg CO2e
   */
  calculateTransport(transport) {
    let total = 0;
    const t = this.factors.transport;

    if (transport.car_km_per_week) {
      const fuelType = transport.car_fuel_type || 'car_petrol';
      total += transport.car_km_per_week * 52 * (t[fuelType] || t.car_petrol);
    }
    if (transport.bus_km_per_week) {
      total += transport.bus_km_per_week * 52 * t.bus;
    }
    if (transport.train_km_per_week) {
      total += transport.train_km_per_week * 52 * t.train;
    }
    if (transport.flights_domestic_per_year) {
      total += transport.flights_domestic_per_year * 1500 * t.domestic_flight; // avg 1500km
    }
    if (transport.flights_international_per_year) {
      total += transport.flights_international_per_year * 8000 * t.international_flight; // avg 8000km
    }
    if (transport.motorcycle_km_per_week) {
      total += transport.motorcycle_km_per_week * 52 * t.motorcycle;
    }

    return Math.round(total);
  }

  /**
   * Calculate food emissions
   * @param {Object} diet - Diet data
   * @returns {number} kg CO2e
   */
  calculateFood(diet) {
    let total = 0;
    const f = this.factors.food;

    const dietProfiles = {
      vegan:       { beef: 0, lamb: 0, pork: 0, chicken: 0, fish: 0, eggs: 0.05, dairy_milk: 0, cheese: 0, rice: 0.3, vegetables: 0.5, fruits: 0.3, legumes: 0.3, tofu: 0.2, bread: 0.2 },
      vegetarian:  { beef: 0, lamb: 0, pork: 0, chicken: 0, fish: 0, eggs: 0.15, dairy_milk: 0.3, cheese: 0.1, rice: 0.3, vegetables: 0.4, fruits: 0.3, legumes: 0.2, tofu: 0.1, bread: 0.2 },
      pescatarian: { beef: 0, lamb: 0, pork: 0, chicken: 0, fish: 0.2, eggs: 0.1, dairy_milk: 0.2, cheese: 0.1, rice: 0.3, vegetables: 0.4, fruits: 0.2, legumes: 0.15, tofu: 0.05, bread: 0.15 },
      omnivore:    { beef: 0.1, lamb: 0.03, pork: 0.1, chicken: 0.15, fish: 0.08, eggs: 0.1, dairy_milk: 0.2, cheese: 0.08, rice: 0.3, vegetables: 0.3, fruits: 0.2, legumes: 0.1, tofu: 0.02, bread: 0.15 },
      heavy_meat:  { beef: 0.25, lamb: 0.1, pork: 0.2, chicken: 0.2, fish: 0.1, eggs: 0.1, dairy_milk: 0.3, cheese: 0.1, rice: 0.3, vegetables: 0.2, fruits: 0.1, legumes: 0.05, tofu: 0, bread: 0.1 }
    };

    const profile = dietProfiles[diet.type] || dietProfiles.omnivore;

    Object.entries(profile).forEach(([food, kgPerDay]) => {
      if (f[food]) {
        total += kgPerDay * 365 * f[food];
      }
    });

    // Apply food waste multiplier
    const wasteMultiplier = 1 + (diet.food_waste_pct || 0.15);
    total *= wasteMultiplier;

    return Math.round(total);
  }

  /**
   * Calculate home energy emissions
   * @param {Object} energy - Energy data
   * @returns {number} kg CO2e
   */
  calculateEnergy(energy) {
    let total = 0;
    const e = this.factors.energy;

    if (energy.electricity_kwh_per_month) {
      const gridFactor = energy.renewable_pct
        ? e.electricity_kwh * (1 - energy.renewable_pct / 100) + e.solar_kwh * (energy.renewable_pct / 100)
        : e.electricity_kwh;
      total += energy.electricity_kwh_per_month * 12 * gridFactor;
    }
    if (energy.gas_m3_per_month) {
      total += energy.gas_m3_per_month * 12 * e.natural_gas_m3;
    }
    if (energy.lpg_kg_per_month) {
      total += energy.lpg_kg_per_month * 12 * e.lpg_kg;
    }

    // Household size adjustment
    const householdSize = energy.household_size || 1;
    total = total / householdSize;

    return Math.round(total);
  }

  /**
   * Calculate shopping/lifestyle emissions
   * @param {Object} shopping - Shopping data
   * @returns {number} kg CO2e
   */
  calculateShopping(shopping) {
    let total = 0;
    const s = this.factors.shopping;

    if (shopping.new_clothes_per_year) {
      total += shopping.new_clothes_per_year * s.clothing_item;
    }
    if (shopping.new_phone_years) {
      total += (1 / shopping.new_phone_years) * s.electronics_phone;
    }
    if (shopping.new_laptop_years) {
      total += (1 / shopping.new_laptop_years) * s.electronics_laptop;
    }
    if (shopping.furniture_items_per_year) {
      total += shopping.furniture_items_per_year * s.furniture_item;
    }

    // Second-hand discount
    if (shopping.secondhand_pct) {
      total *= (1 - shopping.secondhand_pct / 200); // partial reduction
    }

    return Math.round(total);
  }

  /**
   * Calculate total annual footprint
   * @param {Object} userData - Complete user data
   * @returns {Object} Breakdown and total
   */
  calculateTotal(userData) {
    const transport = this.calculateTransport(userData.transport || {});
    const food = this.calculateFood(userData.food || { type: 'omnivore' });
    const energy = this.calculateEnergy(userData.energy || {});
    const shopping = this.calculateShopping(userData.shopping || {});
    const total = transport + food + energy + shopping;

    return {
      total,
      breakdown: { transport, food, energy, shopping },
      percentages: {
        transport: Math.round((transport / total) * 100),
        food: Math.round((food / total) * 100),
        energy: Math.round((energy / total) * 100),
        shopping: Math.round((shopping / total) * 100)
      },
      comparison: {
        vs_world_avg: Math.round(((total - this._globalAverages.world) / this._globalAverages.world) * 100),
        vs_india_avg: Math.round(((total - this._globalAverages.india) / this._globalAverages.india) * 100),
        vs_target: Math.round(((total - this._globalAverages.target_2030) / this._globalAverages.target_2030) * 100)
      },
      trees_to_offset: Math.round(total / 21), // avg tree absorbs 21kg CO2/year
      equivalent: {
        smartphone_charges: Math.round(total / 0.00822),
        km_driven: Math.round(total / 0.21),
        beef_kg: Math.round(total / 27)
      }
    };
  }

  /**
   * Get personalized AI-style recommendations
   * @param {Object} result - Calculation result
   * @param {Object} userData - User data
   * @returns {Array} Recommendations
   */
  getRecommendations(result, userData) {
    const recs = [];
    const { breakdown } = result;

    // Find the biggest emission category
    const sorted = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
    const topCategory = sorted[0][0];

    // Category-specific recommendations
    if (topCategory === 'transport' && breakdown.transport > 2000) {
      if (userData.transport?.car_km_per_week > 100) {
        recs.push({
          priority: 'high',
          category: 'transport',
          action: 'Consider carpooling or public transport for your daily commute',
          potential_saving: Math.round(breakdown.transport * 0.35),
          context: `Your driving contributes ${Math.round(userData.transport.car_km_per_week * 52 * 0.21)} kg CO₂/year`
        });
      }
      if (userData.transport?.flights_domestic_per_year > 2) {
        recs.push({
          priority: 'high',
          category: 'transport',
          action: 'Replace domestic flights with train travel where possible',
          potential_saving: Math.round(userData.transport.flights_domestic_per_year * 1500 * (0.255 - 0.041)),
          context: 'Train emits 6x less CO₂ than flying on the same route'
        });
      }
    }

    if (topCategory === 'food' || breakdown.food > 1500) {
      const dietType = userData.food?.type || 'omnivore';
      if (dietType === 'heavy_meat' || dietType === 'omnivore') {
        recs.push({
          priority: 'high',
          category: 'food',
          action: 'Try meat-free Mondays to reduce food emissions by up to 15%',
          potential_saving: Math.round(breakdown.food * 0.15),
          context: 'Beef produces 27x more CO₂ than vegetables per kg'
        });
      }
    }

    if (topCategory === 'energy' || breakdown.energy > 1000) {
      recs.push({
        priority: 'medium',
        category: 'energy',
        action: 'Switch to LED bulbs and optimize your AC/heating usage',
        potential_saving: Math.round(breakdown.energy * 0.12),
        context: 'Lighting and HVAC account for 50-60% of home energy use'
      });
    }

    // Universal good recommendations
    recs.push({
      priority: 'low',
      category: 'lifestyle',
      action: 'Track your footprint weekly to stay aware and motivated',
      potential_saving: Math.round(result.total * 0.05),
      context: 'Studies show tracking behavior reduces emissions by 5-10%'
    });

    return recs.slice(0, 5);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CarbonCalculator };
} else {
  window.CarbonCalculator = CarbonCalculator;
}
