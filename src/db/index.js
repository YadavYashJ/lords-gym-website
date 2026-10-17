const fs = require('fs');
const path = require('path');
const config = require('../config');
const { hash, uid } = require('../utils/hash');

fs.mkdirSync(config.dataDir, { recursive: true });
const DB_FILE = path.join(config.dataDir, 'db.json');

const INITIAL_PLANS = [
  {
    id: 1,
    plan_name: 'Normal Gym',
    price: 1500,
    duration: 30,
    inclusions: 'Access to full free-weights section, full cardio deck, lockers, modern facility amenities',
    is_active: 1
  },
  {
    id: 2,
    plan_name: 'Gym with Trainer',
    price: 4000,
    duration: 30,
    inclusions: 'Everything in Normal Gym + Dedicated personal trainer & custom workout split',
    is_active: 1
  },
  {
    id: 3,
    plan_name: 'Gym with Trainer & Dietician',
    price: 5000,
    duration: 30,
    inclusions: 'Everything in Gym with Trainer + Certified dietician consultation & customized meal plan',
    is_active: 1
  }
];

const INITIAL_AMENITIES = [
  { id: 1, name: 'Heavy Free Weights', icon: 'fitness_center', description: 'Full Olympic barbell sets, dumbbell rack up to 50 kg, powerlifting platforms.' },
  { id: 2, name: 'Cardio Equipment', icon: 'directions_run', description: 'Commercial treadmills, cross trainers, assault bikes, and rowing machines.' },
  { id: 3, name: 'Personal Training', icon: 'sports_gymnastics', description: 'Dedicated floor time with certified head coach Imran Pathan and lead trainers.' },
  { id: 4, name: 'Diet & Nutrition', icon: 'restaurant', description: 'Certified dietician consultation and customized meal plans for elite lifters.' },
  { id: 5, name: 'Chilled RO Water', icon: 'water_drop', description: 'Pure alkaline chilled RO water dispenser cleaned daily at 5:00 AM on 2nd floor.' },
  { id: 6, name: 'Secure Locker Room', icon: 'lock', description: 'Individual combination lockers, changing rooms, and 24-hour facility CCTV.' }
];

const INITIAL_USERS = [
  {
    id: 1,
    full_name: 'Imran Pathan',
    email: 'thelordsgymsachin@gmail.com',
    mobile: '9998841979',
    pass: hash('LordsGym@2025'),
    role: 'admin',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    full_name: 'Yash Jayprakash',
    email: 'yash@example.com',
    mobile: '9876543210',
    pass: hash('Member@123'),
    role: 'member',
    active_plan_id: 2,
    subscription_start: new Date(Date.now() - 12 * 86400000).toISOString().slice(0, 10),
    subscription_end: new Date(Date.now() + 18 * 86400000).toISOString().slice(0, 10),
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

let data = {
  users: INITIAL_USERS,
  membership_plans: INITIAL_PLANS,
  amenities: INITIAL_AMENITIES,
  enquiries: []
};

// Load existing data if file exists
try {
  if (fs.existsSync(DB_FILE)) {
    data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    // Ensure all collections exist
    data.users = data.users || INITIAL_USERS;
    data.membership_plans = data.membership_plans || INITIAL_PLANS;
    data.amenities = data.amenities || INITIAL_AMENITIES;
    data.enquiries = data.enquiries || [];
  } else {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  }
} catch (e) {
  // fallback to in-memory defaults
}

const save = () => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Failed to write db.json', e);
  }
};

module.exports = {
  list(coll, filterFn = () => true) {
    return (data[coll] || []).filter(filterFn);
  },
  find(coll, id) {
    return (data[coll] || []).find(item => String(item.id) === String(id));
  },
  findBy(coll, predicate) {
    return (data[coll] || []).find(predicate);
  },
  create(coll, record) {
    if (!data[coll]) data[coll] = [];
    const id = data[coll].length > 0 ? Math.max(...data[coll].map(x => Number(x.id) || 0)) + 1 : 1;
    const item = { id, createdAt: new Date().toISOString(), ...record };
    data[coll].push(item);
    save();
    return item;
  },
  update(coll, id, patch) {
    const item = (data[coll] || []).find(x => String(x.id) === String(id));
    if (!item) return null;
    Object.assign(item, patch, { updatedAt: new Date().toISOString() });
    save();
    return item;
  },
  remove(coll, id) {
    if (!data[coll]) return false;
    const idx = data[coll].findIndex(x => String(x.id) === String(id));
    if (idx === -1) return false;
    data[coll].splice(idx, 1);
    save();
    return true;
  }
};
