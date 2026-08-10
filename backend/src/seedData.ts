export const STOPS = [
  // Common College Origin
  { id: 'stop-1', name: 'Sahrdaya College Main Gate (Kodakara)', lat: 10.3637, lng: 76.3262, sequenceOrder: 1, estimatedTimeFromStart: 0 },
  
  // Route 101: Irinjalakuda Line
  { id: 'stop-101-2', name: 'Kodakara NH-544 Junction', lat: 10.3670, lng: 76.3310, sequenceOrder: 2, estimatedTimeFromStart: 5 },
  { id: 'stop-101-3', name: 'Aloor Junction', lat: 10.3540, lng: 76.2730, sequenceOrder: 3, estimatedTimeFromStart: 12 },
  { id: 'stop-101-4', name: 'Irinjalakuda Private Bus Terminal', lat: 10.3420, lng: 76.2140, sequenceOrder: 4, estimatedTimeFromStart: 20 },

  // Route 102: Chalakudy Line
  { id: 'stop-102-2', name: 'Potta Junction NH-544', lat: 10.3380, lng: 76.3310, sequenceOrder: 2, estimatedTimeFromStart: 8 },
  { id: 'stop-102-3', name: 'Chalakudy KSRTC Bus Station', lat: 10.3070, lng: 76.3330, sequenceOrder: 3, estimatedTimeFromStart: 18 },

  // Route 103: Thrissur North Line
  { id: 'stop-103-2', name: 'Puthukkad Town Stand', lat: 10.4280, lng: 76.2710, sequenceOrder: 2, estimatedTimeFromStart: 12 },
  { id: 'stop-103-3', name: 'Ollur Railway Station Junction', lat: 10.4780, lng: 76.2420, sequenceOrder: 3, estimatedTimeFromStart: 22 },
  { id: 'stop-103-4', name: 'Thrissur Swaraj Round / Sakthan Stand', lat: 10.5210, lng: 76.2140, sequenceOrder: 4, estimatedTimeFromStart: 35 },

  // Route 104: Angamaly South Line
  { id: 'stop-104-2', name: 'Koratty Signal Junction', lat: 10.2650, lng: 76.3540, sequenceOrder: 2, estimatedTimeFromStart: 15 },
  { id: 'stop-104-3', name: 'Angamaly KSRTC Station', lat: 10.1970, lng: 76.3860, sequenceOrder: 3, estimatedTimeFromStart: 28 },

  // Route 105: Mala Coastal Line
  { id: 'stop-105-2', name: 'Ashtamichira Junction', lat: 10.2880, lng: 76.2620, sequenceOrder: 2, estimatedTimeFromStart: 14 },
  { id: 'stop-105-3', name: 'Mala Private Bus Terminal', lat: 10.2450, lng: 76.2550, sequenceOrder: 3, estimatedTimeFromStart: 25 }
];

export const ROUTES = [
  {
    id: 'route-101',
    name: 'Sahrdaya - Irinjalakuda Express (Route A)',
    startLocation: 'Sahrdaya Main Gate',
    endLocation: 'Irinjalakuda Terminal',
    distanceKm: 14.5,
    stops: [STOPS[0], STOPS[1], STOPS[2], STOPS[3]]
  },
  {
    id: 'route-102',
    name: 'Sahrdaya - Chalakudy KSRTC Shuttle (Route B)',
    startLocation: 'Sahrdaya Main Gate',
    endLocation: 'Chalakudy KSRTC Station',
    distanceKm: 9.2,
    stops: [STOPS[0], STOPS[4], STOPS[5]]
  },
  {
    id: 'route-103',
    name: 'Sahrdaya - Thrissur Swaraj Round Corridor (Route C)',
    startLocation: 'Sahrdaya Main Gate',
    endLocation: 'Thrissur Swaraj Round',
    distanceKm: 22.0,
    stops: [STOPS[0], STOPS[6], STOPS[7], STOPS[8]]
  },
  {
    id: 'route-104',
    name: 'Sahrdaya - Angamaly Highway Line (Route D)',
    startLocation: 'Sahrdaya Main Gate',
    endLocation: 'Angamaly KSRTC Station',
    distanceKm: 18.8,
    stops: [STOPS[0], STOPS[9], STOPS[10]]
  },
  {
    id: 'route-105',
    name: 'Sahrdaya - Mala Coastal Line (Route E)',
    startLocation: 'Sahrdaya Main Gate',
    endLocation: 'Mala Bus Terminal',
    distanceKm: 16.0,
    stops: [STOPS[0], STOPS[11], STOPS[12]]
  }
];
