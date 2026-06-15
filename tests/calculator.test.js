/**
 * Test Suite: CarbonCalculator & StorageManager
 * Run with: node tests/calculator.test.js
 */

const { EMISSION_FACTORS, GLOBAL_AVERAGES, REDUCTION_TIPS, BADGES } = require('../src/data/emission-factors.js');
const { CarbonCalculator } = require('../src/utils/calculator.js');

// ── Minimal localStorage shim ──────────────────────────────────────────────
const _store = {};
global.localStorage = {
  getItem:    k => _store[k] ?? null,
  setItem:    (k, v) => { _store[k] = String(v); },
  removeItem: k => { delete _store[k]; },
  get length() { return Object.keys(_store).length; },
  key:        i => Object.keys(_store)[i] ?? null,
};
Object.keys(_store).forEach(k => delete _store[k]);          // start clean
const { StorageManager } = require('../src/utils/storage.js');

// ── Tiny test harness ──────────────────────────────────────────────────────
let passed = 0, failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ❌ ${name}`);
    console.error(`     ${e.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

function assertClose(a, b, tolerance = 50, msg) {
  if (Math.abs(a - b) > tolerance)
    throw new Error(msg || `Expected ~${b}, got ${a} (tolerance ±${tolerance})`);
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. EMISSION FACTORS DATA
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n📦 Emission Factors Data');

test('Transport factors are defined and positive', () => {
  assert(EMISSION_FACTORS.transport.car_petrol > 0, 'car_petrol factor missing');
  assert(EMISSION_FACTORS.transport.bus > 0, 'bus factor missing');
  assert(EMISSION_FACTORS.transport.cycling === 0, 'cycling should be 0');
});

test('Food factors cover all major categories', () => {
  ['beef', 'chicken', 'vegetables', 'legumes', 'dairy_milk'].forEach(food => {
    assert(EMISSION_FACTORS.food[food] > 0, `Missing food factor: ${food}`);
  });
  assert(EMISSION_FACTORS.food.beef > EMISSION_FACTORS.food.vegetables,
    'Beef should have higher emissions than vegetables');
});

test('Energy factors are present', () => {
  assert(EMISSION_FACTORS.energy.electricity_kwh > 0);
  assert(EMISSION_FACTORS.energy.solar_kwh < EMISSION_FACTORS.energy.electricity_kwh,
    'Solar should be cleaner than grid electricity');
});

test('Global averages are reasonable (kg CO2/year)', () => {
  assert(GLOBAL_AVERAGES.world > 1000 && GLOBAL_AVERAGES.world < 30000);
  assert(GLOBAL_AVERAGES.target_2030 < GLOBAL_AVERAGES.world,
    '2030 target should be below world average');
});

test('BADGES array has required fields', () => {
  assert(Array.isArray(BADGES) && BADGES.length > 0);
  BADGES.forEach(b => {
    assert(b.id && b.name && b.icon, `Badge missing fields: ${JSON.stringify(b)}`);
  });
});

test('REDUCTION_TIPS covers all key categories', () => {
  ['transport', 'food', 'energy', 'shopping'].forEach(cat => {
    assert(Array.isArray(REDUCTION_TIPS[cat]) && REDUCTION_TIPS[cat].length > 0,
      `Missing tips for category: ${cat}`);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. CARBON CALCULATOR
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n🧮 Carbon Calculator');

const calc = new CarbonCalculator();

test('Zero inputs produce zero transport emissions', () => {
  const result = calc.calculateTransport({});
  assert(result === 0, `Expected 0, got ${result}`);
});

test('Car emissions scale with distance', () => {
  const low  = calc.calculateTransport({ car_km_per_week: 50,  car_fuel_type: 'car_petrol' });
  const high = calc.calculateTransport({ car_km_per_week: 200, car_fuel_type: 'car_petrol' });
  assert(high > low * 3.5, 'Higher km should produce proportionally higher emissions');
});

test('Electric car emits less than petrol for same distance', () => {
  const km = 100;
  const petrol   = calc.calculateTransport({ car_km_per_week: km, car_fuel_type: 'car_petrol' });
  const electric = calc.calculateTransport({ car_km_per_week: km, car_fuel_type: 'car_electric' });
  assert(electric < petrol, `Electric (${electric}) should be less than petrol (${petrol})`);
});

test('Vegan diet emits less than heavy-meat diet', () => {
  const vegan     = calc.calculateFood({ type: 'vegan' });
  const heavyMeat = calc.calculateFood({ type: 'heavy_meat' });
  assert(vegan < heavyMeat, `Vegan (${vegan}) should be less than heavy_meat (${heavyMeat})`);
});

test('Food waste increases food emissions', () => {
  const low  = calc.calculateFood({ type: 'omnivore', food_waste_pct: 0.05 });
  const high = calc.calculateFood({ type: 'omnivore', food_waste_pct: 0.50 });
  assert(high > low, `High waste (${high}) should exceed low waste (${low})`);
});

test('Larger household reduces per-person energy emissions', () => {
  const solo  = calc.calculateEnergy({ electricity_kwh_per_month: 300, household_size: 1 });
  const group = calc.calculateEnergy({ electricity_kwh_per_month: 300, household_size: 4 });
  assert(group < solo, `Group share (${group}) should be less than solo (${solo})`);
});

test('Renewable energy reduces electricity emissions', () => {
  const grid      = calc.calculateEnergy({ electricity_kwh_per_month: 300, household_size: 1, renewable_pct: 0 });
  const renewable = calc.calculateEnergy({ electricity_kwh_per_month: 300, household_size: 1, renewable_pct: 100 });
  assert(renewable < grid, `Renewable (${renewable}) should be less than grid (${grid})`);
});

test('Shopping emissions increase with more new items', () => {
  const low  = calc.calculateShopping({ new_clothes_per_year: 5 });
  const high = calc.calculateShopping({ new_clothes_per_year: 50 });
  assert(high > low, `More clothes (${high}) should exceed fewer (${low})`);
});

test('Second-hand shopping reduces emissions', () => {
  const newOnly   = calc.calculateShopping({ new_clothes_per_year: 20, secondhand_pct: 0 });
  const secondHand = calc.calculateShopping({ new_clothes_per_year: 20, secondhand_pct: 80 });
  assert(secondHand < newOnly, `Second-hand (${secondHand}) should be less than new-only (${newOnly})`);
});

test('calculateTotal returns all required fields', () => {
  const result = calc.calculateTotal({
    transport: { car_km_per_week: 100, car_fuel_type: 'car_petrol' },
    food:      { type: 'omnivore' },
    energy:    { electricity_kwh_per_month: 250, household_size: 3 },
    shopping:  { new_clothes_per_year: 15 }
  });
  assert(result.total > 0, 'Total should be positive');
  assert(result.breakdown && typeof result.breakdown.transport === 'number', 'Breakdown missing transport');
  assert(result.percentages && result.percentages.food >= 0, 'Percentages missing food');
  assert(result.comparison && typeof result.comparison.vs_world_avg === 'number', 'Comparison missing');
  assert(result.trees_to_offset > 0, 'Trees offset should be positive');
  assert(result.equivalent && result.equivalent.km_driven > 0, 'Equivalent missing');
});

test('Percentages in breakdown sum to ~100', () => {
  const result = calc.calculateTotal({
    transport: { car_km_per_week: 80,  car_fuel_type: 'car_petrol' },
    food:      { type: 'vegetarian' },
    energy:    { electricity_kwh_per_month: 200, household_size: 2 },
    shopping:  { new_clothes_per_year: 10 }
  });
  const sum = Object.values(result.percentages).reduce((a, b) => a + b, 0);
  assert(Math.abs(sum - 100) <= 2, `Percentages sum to ${sum}, expected ~100`);
});

test('getRecommendations returns at most 5 items', () => {
  const result = calc.calculateTotal({
    transport: { car_km_per_week: 200, car_fuel_type: 'car_petrol', flights_domestic_per_year: 6 },
    food:      { type: 'heavy_meat' },
    energy:    { electricity_kwh_per_month: 500, household_size: 1 },
    shopping:  { new_clothes_per_year: 30 }
  });
  const recs = calc.getRecommendations(result, {});
  assert(recs.length > 0 && recs.length <= 5, `Expected 1–5 recommendations, got ${recs.length}`);
  recs.forEach(r => {
    assert(r.action && r.potential_saving >= 0, `Recommendation missing fields: ${JSON.stringify(r)}`);
  });
});

test('Trees-to-offset equals total / 21', () => {
  const result = calc.calculateTotal({ transport: { car_km_per_week: 100 }, food: { type: 'omnivore' } });
  const expected = Math.round(result.total / 21);
  assert(result.trees_to_offset === expected,
    `Expected ${expected} trees, got ${result.trees_to_offset}`);
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. STORAGE MANAGER
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n💾 Storage Manager');

const store = new StorageManager('test_');

test('set and get round-trips data correctly', () => {
  const obj = { foo: 'bar', num: 42, arr: [1, 2, 3] };
  store.set('round_trip', obj);
  const got = store.get('round_trip');
  assert(JSON.stringify(got) === JSON.stringify(obj), 'Round-trip data mismatch');
});

test('get returns null for missing key', () => {
  const val = store.get('definitely_missing_key_xyz');
  assert(val === null, `Expected null, got ${val}`);
});

test('remove deletes a key', () => {
  store.set('to_delete', 'hello');
  store.remove('to_delete');
  assert(store.get('to_delete') === null, 'Key should be gone after remove');
});

test('saveProfile and getProfile persist data', () => {
  const profile = { name: 'Arjun', location: 'Delhi', goal: 'reduce_transport' };
  store.saveProfile(profile);
  const got = store.getProfile();
  assert(got.name === profile.name, 'Profile name mismatch');
  assert(got.updated_at, 'Profile should have updated_at timestamp');
});

test('saveFootprintEntry appends to log', () => {
  const entry1 = { result: { total: 3000 } };
  const entry2 = { result: { total: 2800 } };
  store.saveFootprintEntry(entry1);
  store.saveFootprintEntry(entry2);
  const logs = store.getFootprintLogs();
  assert(logs.length >= 2, `Expected ≥2 logs, got ${logs.length}`);
  assert(logs[logs.length - 1].result.total === 2800, 'Last entry total mismatch');
});

test('getFootprintLogs returns array even when empty', () => {
  const fresh = new StorageManager('empty_test_');
  const logs = fresh.getFootprintLogs();
  assert(Array.isArray(logs), 'Should return an array');
  assert(logs.length === 0, 'Should be empty');
});

test('getTrend returns at most N entries', () => {
  for (let i = 0; i < 15; i++) store.saveFootprintEntry({ result: { total: 3000 - i * 10, breakdown: {} } });
  const trend = store.getTrend(5);
  assert(trend.length <= 5, `Expected ≤5 trend entries, got ${trend.length}`);
});

test('incrementStat and getStat work correctly', () => {
  const s = new StorageManager('stat_test_');
  assert(s.getStat('clicks') === 0, 'Initial stat should be 0');
  s.incrementStat('clicks');
  s.incrementStat('clicks');
  assert(s.getStat('clicks') === 2, `Expected 2, got ${s.getStat('clicks')}`);
});

test('unlockBadge returns true only on first unlock', () => {
  const b = new StorageManager('badge_test_');
  const first  = b.unlockBadge('eco_aware');
  const second = b.unlockBadge('eco_aware');
  assert(first  === true,  'First unlock should return true');
  assert(second === false, 'Second unlock should return false');
});

test('getEarnedBadges returns all unlocked badges', () => {
  const b = new StorageManager('badge2_test_');
  b.unlockBadge('first_step');
  b.unlockBadge('carbon_cutter');
  const earned = b.getEarnedBadges();
  assert(earned.length === 2, `Expected 2 badges, got ${earned.length}`);
  assert(earned.some(x => x.id === 'first_step'), 'first_step badge missing');
});

test('saveGoal creates new goal with id and timestamp', () => {
  const g = new StorageManager('goal_test_');
  g.saveGoal({ title: 'Cycle to work', category: 'transport', target: 20, progress: 0 });
  const goals = g.getGoals();
  assert(goals.length === 1, `Expected 1 goal, got ${goals.length}`);
  assert(goals[0].id, 'Goal should have an id');
  assert(goals[0].created_at, 'Goal should have created_at');
});

test('saveGoal updates existing goal by id', () => {
  const g = new StorageManager('goal_update_test_');
  g.saveGoal({ id: 'g_fixed', title: 'Eat less beef', target: 10, progress: 0 });
  g.saveGoal({ id: 'g_fixed', title: 'Eat less beef', target: 10, progress: 5 });
  const goals = g.getGoals();
  assert(goals.length === 1, 'Should not create duplicate goals');
  assert(goals[0].progress === 5, `Progress should be 5, got ${goals[0].progress}`);
});

test('clear removes all keys with the prefix', () => {
  const c = new StorageManager('clear_test_');
  c.set('a', 1); c.set('b', 2);
  c.clear();
  assert(c.get('a') === null, 'Key a should be cleared');
  assert(c.get('b') === null, 'Key b should be cleared');
});

test('isFirstVisit returns true then false', () => {
  const v = new StorageManager('visit_test_');
  assert(v.isFirstVisit() === true,  'Should be first visit');
  assert(v.isFirstVisit() === false, 'Should not be first visit again');
});

// ═══════════════════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n─────────────────────────────────────────');
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('Some tests failed. Please review the output above.');
  process.exit(1);
} else {
  console.log('All tests passed! ✅');
  process.exit(0);
}
