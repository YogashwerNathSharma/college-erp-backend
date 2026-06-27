
// ============================================
// GPS HELPER UTILITIES
// ============================================

const EARTH_RADIUS_KM = 6371;

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula.
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;

  return Math.round(distance * 1000) / 1000; // Round to 3 decimal places (meter precision)
}

/**
 * Check if a point is within a circular geofence.
 * @param lat - Current latitude
 * @param lng - Current longitude
 * @param centerLat - Geofence center latitude
 * @param centerLng - Geofence center longitude
 * @param radius - Geofence radius in kilometers
 * @returns true if point is within geofence
 */
export function isWithinGeofence(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  radius: number
): boolean {
  const distance = calculateDistance(lat, lng, centerLat, centerLng);
  return distance <= radius;
}

/**
 * Calculate estimated time of arrival.
 * @param currentLat - Current latitude
 * @param currentLng - Current longitude
 * @param destLat - Destination latitude
 * @param destLng - Destination longitude
 * @param speed - Current speed in km/h
 * @returns ETA in seconds, or null if speed is 0
 */
export function calculateETA(
  currentLat: number,
  currentLng: number,
  destLat: number,
  destLng: number,
  speed: number
): number | null {
  if (speed <= 0) return null;

  const distance = calculateDistance(currentLat, currentLng, destLat, destLng);
  const timeHours = distance / speed;
  const timeSeconds = Math.round(timeHours * 3600);

  return timeSeconds;
}

/**
 * Format coordinates into a human-readable string.
 * @returns Formatted string like "12.9716° N, 77.5946° E"
 */
export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? "N" : "S";
  const lngDir = lng >= 0 ? "E" : "W";

  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}

/**
 * Check if vehicle speed exceeds the limit.
 * @param speed - Current speed in km/h
 * @param limit - Speed limit in km/h
 * @returns Object with violation status and excess speed
 */
export function checkSpeedLimit(
  speed: number,
  limit: number
): { isViolation: boolean; excessSpeed: number } {
  const excessSpeed = speed - limit;
  return {
    isViolation: excessSpeed > 0,
    excessSpeed: excessSpeed > 0 ? Math.round(excessSpeed * 10) / 10 : 0,
  };
}

/**
 * Check if vehicle has deviated from its route.
 * Compares current position against all route stops and checks if
 * the minimum distance to any stop segment exceeds the max deviation.
 * @param lat - Current latitude
 * @param lng - Current longitude
 * @param routeStops - Array of stops with latitude/longitude
 * @param maxDeviation - Maximum allowed deviation in kilometers
 * @returns Object with deviation status and distance from route
 */
export function checkRouteDeviation(
  lat: number,
  lng: number,
  routeStops: Array<{ latitude: number; longitude: number }>,
  maxDeviation: number
): { isDeviated: boolean; deviationDistance: number; nearestStopIndex: number } {
  if (!routeStops || routeStops.length === 0) {
    return { isDeviated: false, deviationDistance: 0, nearestStopIndex: -1 };
  }

  let minDistance = Infinity;
  let nearestStopIndex = 0;

  // Find minimum distance to any route stop
  for (let i = 0; i < routeStops.length; i++) {
    const stop = routeStops[i];
    if (stop.latitude == null || stop.longitude == null) continue;

    const distance = calculateDistance(lat, lng, stop.latitude, stop.longitude);
    if (distance < minDistance) {
      minDistance = distance;
      nearestStopIndex = i;
    }
  }

  // Also check distance to segments between consecutive stops
  for (let i = 0; i < routeStops.length - 1; i++) {
    const stopA = routeStops[i];
    const stopB = routeStops[i + 1];

    if (
      stopA.latitude == null || stopA.longitude == null ||
      stopB.latitude == null || stopB.longitude == null
    ) continue;

    const segmentDistance = distanceToSegment(
      lat, lng,
      stopA.latitude, stopA.longitude,
      stopB.latitude, stopB.longitude
    );

    if (segmentDistance < minDistance) {
      minDistance = segmentDistance;
      nearestStopIndex = i;
    }
  }

  return {
    isDeviated: minDistance > maxDeviation,
    deviationDistance: Math.round(minDistance * 1000) / 1000,
    nearestStopIndex,
  };
}

/**
 * Calculate the shortest distance from a point to a line segment (approximate for short distances).
 */
function distanceToSegment(
  lat: number, lng: number,
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const A = lat - lat1;
  const B = lng - lng1;
  const C = lat2 - lat1;
  const D = lng2 - lng1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;

  let param = lenSq !== 0 ? dot / lenSq : -1;

  let closestLat: number;
  let closestLng: number;

  if (param < 0) {
    closestLat = lat1;
    closestLng = lng1;
  } else if (param > 1) {
    closestLat = lat2;
    closestLng = lng2;
  } else {
    closestLat = lat1 + param * C;
    closestLng = lng1 + param * D;
  }

  return calculateDistance(lat, lng, closestLat, closestLng);
}

export default {
  calculateDistance,
  isWithinGeofence,
  calculateETA,
  formatCoordinates,
  checkSpeedLimit,
  checkRouteDeviation,
};
