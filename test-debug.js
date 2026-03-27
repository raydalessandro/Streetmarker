const spot = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  coords: [45.4642, 9.1900],
  type: 'wall',
  status: 'free',
  availability: [{ from: '08:00', to: '22:00' }],
  securityLevel: 'low',
  notes: 'Valid spot',
  createdAt: Date.now(),
  updatedAt: Date.now()
};

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

console.log('ID:', spot.id);
console.log('UUID test:', UUID_V4_PATTERN.test(spot.id));
console.log('Coords:', spot.coords);
console.log('Type:', spot.type);
console.log('All fields:', Object.keys(spot));
