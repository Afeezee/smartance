/**
 * Haversine distance between two lat/lng points in metres.
 *
 * Used by the attendance endpoint to check whether the student's phone was
 * within the lecturer's declared geofence radius. This is a best-effort
 * deterrent — GPS is spoofable on rooted/jailbroken devices — so we treat
 * out-of-range results by flagging the attendance for lecturer review
 * rather than silently rejecting it.
 */
const EARTH_RADIUS_M = 6_371_000;

export function haversineMeters(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(s));
}
