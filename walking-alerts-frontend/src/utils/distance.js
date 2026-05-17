export function calculateDistanceMeters(a, b) {
  const toRad = (value) => (value * Math.PI) / 180
  const lat1 = a.lat
  const lon1 = a.lng
  const lat2 = b.lat
  const lon2 = b.lng
  const R = 6371000
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const sinLat = Math.sin(dLat / 2)
  const sinLon = Math.sin(dLon / 2)
  const c =
    2 *
    Math.atan2(
      Math.sqrt(
        sinLat * sinLat +
          Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * sinLon * sinLon
      ),
      Math.sqrt(
        1 -
          (sinLat * sinLat +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * sinLon * sinLon)
      )
    )
  return Math.round(R * c)
}
