/** Bangkok Metropolitan Area bounding box */
export const BANGKOK_CENTER = { lat: 13.7563, lng: 100.5018 };

export const BANGKOK_BOUNDS = {
  south: 13.492,
  north: 13.954,
  west: 100.327,
  east: 100.938,
};

export function isWithinBangkok(lat: number, lng: number): boolean {
  return (
    lat >= BANGKOK_BOUNDS.south &&
    lat <= BANGKOK_BOUNDS.north &&
    lng >= BANGKOK_BOUNDS.west &&
    lng <= BANGKOK_BOUNDS.east
  );
}

export function clampToBangkok(lat: number, lng: number): { lat: number; lng: number } {
  return {
    lat: Math.min(Math.max(lat, BANGKOK_BOUNDS.south), BANGKOK_BOUNDS.north),
    lng: Math.min(Math.max(lng, BANGKOK_BOUNDS.west), BANGKOK_BOUNDS.east),
  };
}
