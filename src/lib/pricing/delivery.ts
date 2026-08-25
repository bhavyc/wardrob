/**
 * Utility for calculating delivery fee based on distance zone within a single city.
 * MVP assumes distance is passed or calculated externally (e.g., via pincode lookup).
 */

export enum DistanceZone {
  NEAR_0_5KM = 'NEAR_0_5KM',
  MID_5_15KM = 'MID_5_15KM',
  FAR_15_25KM = 'FAR_15_25KM',
  OUT_OF_BOUNDS = 'OUT_OF_BOUNDS',
}

export const DELIVERY_RATES = {
  [DistanceZone.NEAR_0_5KM]: 80,
  [DistanceZone.MID_5_15KM]: 120,
  [DistanceZone.FAR_15_25KM]: 150,
};

/**
 * Calculate the delivery zone based on distance in kilometers.
 * @param distanceKm Distance in kilometers
 * @returns DistanceZone
 */
export function getDistanceZone(distanceKm: number): DistanceZone {
  if (distanceKm >= 0 && distanceKm <= 5) {
    return DistanceZone.NEAR_0_5KM;
  }
  if (distanceKm > 5 && distanceKm <= 15) {
    return DistanceZone.MID_5_15KM;
  }
  if (distanceKm > 15 && distanceKm <= 25) {
    return DistanceZone.FAR_15_25KM;
  }
  return DistanceZone.OUT_OF_BOUNDS;
}

/**
 * Get the delivery fee for a specific zone.
 * @param zone The calculated DistanceZone
 * @returns delivery fee in INR, or throws an error if out of bounds.
 */
export function getDeliveryFeeForZone(zone: DistanceZone): number {
  if (zone === DistanceZone.OUT_OF_BOUNDS) {
    throw new Error('Delivery not available for this distance in MVP (Single City only)');
  }
  return DELIVERY_RATES[zone];
}

/**
 * Wrapper to directly get fee by distance.
 */
export function calculateDeliveryFee(distanceKm: number): number {
  const zone = getDistanceZone(distanceKm);
  return getDeliveryFeeForZone(zone);
}
