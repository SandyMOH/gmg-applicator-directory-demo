// Sample data for GMG Certified Applicator Directory demo v2
// Structure: Hubs (companies/branches) + Sprayers (individuals)
// Sprayers match to a hub by company name + state.

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
// company + state drive the hub matching
export const sprayers = [
  // Graphonyx NSW -> matches GPX Sydney
  { id: 's1', firstName: 'Michael', lastName: 'Chen', certNumber: 'GMG-SA-1042', company: 'Graphonyx', state: 'NSW', city: 'Sydney', email: 'ops@graphonyx.com.au', phone: '1300 007 223' },
  { id: 's2', firstName: 'Sarah', lastName: 'Thompson', certNumber: 'GMG-SA-1043', company: 'Graphonyx', state: 'NSW', city: 'Sydney', email: 'ops@graphonyx.com.au', phone: '1300 007 223' },
  // Graphonyx VIC -> matches GPX Melbourne
  { id: 's3', firstName: 'David', lastName: 'Nguyen', certNumber: 'GMG-SA-1051', company: 'Graphonyx', state: 'VIC', city: 'Melbourne', email: 'ops@graphonyx.com.au', phone: '1300 007 223' },
  { id: 's4', firstName: 'Emma', lastName: 'Wilson', certNumber: 'GMG-SA-1055', company: 'Graphonyx', state: 'VIC', city: 'Melbourne', email: 'ops@graphonyx.com.au', phone: '1300 007 223' },
  // Graphonyx QLD -> matches GPX Brisbane
  { id: 's5', firstName: 'James', lastName: 'Patterson', certNumber: 'GMG-SA-1060', company: 'Graphonyx', state: 'QLD', city: 'Brisbane', email: 'ops@graphonyx.com.au', phone: '1300 007 223' },
  // Independent sprayers -> shown individually with their own company
  { id: 's6', firstName: 'Robert', lastName: 'Hayes', certNumber: 'GMG-SA-1029', company: 'Hayes Coatings', state: 'NSW', city: 'Newcastle', suburb: 'Newcastle', postCode: '2300', email: 'rob@hayescoatings.com.au', phone: '0412 558 901', lat: -32.9270, lng: 151.7760 },
  { id: 's7', firstName: 'Lisa', lastName: 'Anderson', certNumber: 'GMG-SA-1071', company: 'Anderson Industrial', state: 'SA', city: 'Adelaide', suburb: 'Mile End', postCode: '5031', email: 'lisa@andersonindustrial.com.au', phone: '0423 887 210', lat: -34.9180, lng: 138.5680 },
];

// ===== MATCHING LOGIC =====
// A sprayer matches a hub if company name matches AND state matches.
// Future-proof: works for any company that has hub entries, not just Graphonyx.
export function matchSprayerToHub(sprayer) {
  return hubs.find(
    (hub) =>
      hub.company.toLowerCase() === (sprayer.company || '').toLowerCase() &&
      hub.state === sprayer.state
  );
}

// Build the grouped structure for the Sprayers tab
export function buildSprayerGroups() {
  const groupedHubs = {}; // hubId -> { hub, sprayers: [] }
  const independents = [];

  for (const sprayer of sprayers) {
    const hub = matchSprayerToHub(sprayer);
    if (hub) {
      if (!groupedHubs[hub.id]) {
        groupedHubs[hub.id] = { hub, sprayers: [] };
      }
      groupedHubs[hub.id].sprayers.push(sprayer);
    } else {
      independents.push(sprayer);
    }
  }

  return {
    groups: Object.values(groupedHubs),
    independents,
  };
}
