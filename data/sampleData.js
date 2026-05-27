// Sample data for GMG Certified Applicator Directory demo v3
// Hubs (companies/branches) + Sprayers (individuals).
// Every sprayer has their own coordinates.
// A sprayer links to a hub by company name + state.

// ===== SPRAY HUBS =====
export const hubs = [
  {
    id: 'hub-gmg',
    company: 'GMG Spray Hub',
    isGMG: true,
    region: 'BRISBANE',
    suburb: 'Richlands',
    city: 'Brisbane',
    state: 'QLD',
    postCode: '4077',
    phone: '1300 000 000',
    email: 'sprayhub@graphenemg.com',
    lat: -27.6050,
    lng: 152.9540,
  },
  {
    id: 'hub-gpx-sydney',
    company: 'Graphonyx',
    region: 'SYDNEY',
    suburb: 'Belrose',
    city: 'Sydney',
    state: 'NSW',
    postCode: '2085',
    phone: '1300 007 223',
    email: 'ops@graphonyx.com.au',
    lat: -33.7405,
    lng: 151.2099,
  },
  {
    id: 'hub-gpx-melbourne',
    company: 'Graphonyx',
    region: 'MELBOURNE',
    suburb: 'Cheltenham',
    city: 'Melbourne',
    state: 'VIC',
    postCode: '3192',
    phone: '1300 007 223',
    email: 'ops@graphonyx.com.au',
    lat: -37.9650,
    lng: 145.0560,
  },
  {
    id: 'hub-gpx-brisbane',
    company: 'Graphonyx',
    region: 'BRISBANE',
    suburb: 'Capalaba',
    city: 'Brisbane',
    state: 'QLD',
    postCode: '4157',
    phone: '1300 007 223',
    email: 'ops@graphonyx.com.au',
    lat: -27.5290,
    lng: 153.2000,
  },
  {
    id: 'hub-gpx-perth',
    company: 'Graphonyx',
    region: 'PERTH',
    suburb: 'Osborne Park',
    city: 'Perth',
    state: 'WA',
    postCode: '6017',
    phone: '1300 007 223',
    email: 'ops@graphonyx.com.au',
    lat: -31.9020,
    lng: 115.8340,
  },
];

// ===== CERTIFIED SPRAYERS =====
// Every sprayer has their own lat/lng (their own city).
export const sprayers = [
  {
    id: 's1', firstName: 'Michael', lastName: 'Chen', certNumber: 'GMG-SA-1042',
    company: 'Graphonyx', suburb: 'Chatswood', city: 'Sydney', state: 'NSW', postCode: '2067',
    email: 'm.chen@graphonyx.com.au', phone: '1300 007 223',
    lat: -33.7969, lng: 151.1803,
  },
  {
    id: 's2', firstName: 'Sarah', lastName: 'Thompson', certNumber: 'GMG-SA-1043',
    company: 'Graphonyx', suburb: 'Parramatta', city: 'Sydney', state: 'NSW', postCode: '2150',
    email: 's.thompson@graphonyx.com.au', phone: '1300 007 223',
    lat: -33.8150, lng: 151.0011,
  },
  {
    id: 's3', firstName: 'David', lastName: 'Nguyen', certNumber: 'GMG-SA-1051',
    company: 'Graphonyx', suburb: 'Richmond', city: 'Melbourne', state: 'VIC', postCode: '3121',
    email: 'd.nguyen@graphonyx.com.au', phone: '1300 007 223',
    lat: -37.8230, lng: 144.9980,
  },
  {
    id: 's4', firstName: 'Emma', lastName: 'Wilson', certNumber: 'GMG-SA-1055',
    company: 'Graphonyx', suburb: 'Geelong', city: 'Geelong', state: 'VIC', postCode: '3220',
    email: 'e.wilson@graphonyx.com.au', phone: '1300 007 223',
    lat: -38.1499, lng: 144.3617,
  },
  {
    id: 's5', firstName: 'James', lastName: 'Patterson', certNumber: 'GMG-SA-1060',
    company: 'Graphonyx', suburb: 'Toowong', city: 'Brisbane', state: 'QLD', postCode: '4066',
    email: 'j.patterson@graphonyx.com.au', phone: '1300 007 223',
    lat: -27.4848, lng: 152.9920,
  },
  // Independent sprayers - no matching hub
  {
    id: 's6', firstName: 'Robert', lastName: 'Hayes', certNumber: 'GMG-SA-1029',
    company: 'Hayes Coatings', suburb: 'Newcastle', city: 'Newcastle', state: 'NSW', postCode: '2300',
    email: 'rob@hayescoatings.com.au', phone: '0412 558 901',
    lat: -32.9270, lng: 151.7760,
  },
  {
    id: 's7', firstName: 'Lisa', lastName: 'Anderson', certNumber: 'GMG-SA-1071',
    company: 'Anderson Industrial', suburb: 'Mile End', city: 'Adelaide', state: 'SA', postCode: '5031',
    email: 'lisa@andersonindustrial.com.au', phone: '0423 887 210',
    lat: -34.9180, lng: 138.5680,
  },
];

// ===== MATCHING =====
// A sprayer belongs to a hub if company name + state both match.
// Future-proof: works for any company that has hub entries.
export function getHubSprayers(hub) {
  return sprayers.filter(
    (s) =>
      s.company.toLowerCase() === hub.company.toLowerCase() &&
      s.state === hub.state
  );
}

// Does this sprayer belong to any hub?
export function sprayerHasHub(sprayer) {
  return hubs.some(
    (h) =>
      h.company.toLowerCase() === sprayer.company.toLowerCase() &&
      h.state === sprayer.state
  );
}
