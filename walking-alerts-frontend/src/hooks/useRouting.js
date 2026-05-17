import { useState } from 'react'

function calculateDistanceMeters(a, b) {
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
  const c = 2 * Math.atan2(Math.sqrt(sinLat * sinLat + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * sinLon * sinLon), Math.sqrt(1 - (sinLat * sinLat + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * sinLon * sinLon)))
  return Math.round(R * c)
}

export function useRouting(alerts) {
  const [routeStart, setRouteStart] = useState(null)
  const [routeEnd, setRouteEnd] = useState(null)
  const [routeEndAddress, setRouteEndAddress] = useState('')
  const [routePath, setRoutePath] = useState([])
  const [routeAlerts, setRouteAlerts] = useState([])
  const [isRouting, setIsRouting] = useState(false)

  const findAlertsNearRoute = (coordinates) => {
    return alerts.filter((alert) => {
      const alertPoint = { lat: alert.lat, lng: alert.lng }
      return coordinates.some(([lat, lng]) => {
        const distance = calculateDistanceMeters(alertPoint, { lat, lng })
        return distance <= 120
      })
    })
  }

  const findAlertsNearPoint = (point, threshold = 20) => {
    return alerts.filter((alert) => {
      return calculateDistanceMeters(point, { lat: alert.lat, lng: alert.lng }) <= threshold
    })
  }

  const calculateRoute = async (start, end) => {
    if (!start || !end) return

    setIsRouting(true)
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/foot/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true&alternatives=true`
      )
      const data = await response.json()

      if (data.routes && data.routes.length > 0) {
        let bestRoute = data.routes[0]
        let bestScore = Infinity

        data.routes.forEach((candidate) => {
          const coordinates = candidate.geometry.coordinates.map(([lng, lat]) => [lat, lng])
          const alertsNear = findAlertsNearRoute(coordinates)
          const score = alertsNear.length * 100000 + Math.round(candidate.distance || 0)
          if (score < bestScore) {
            bestScore = score
            bestRoute = candidate
          }
        })

        const coordinates = bestRoute.geometry.coordinates.map(([lng, lat]) => [lat, lng])
        setRoutePath(coordinates)

        const closeRouteAlerts = findAlertsNearRoute(coordinates)
        const destinationAlerts = findAlertsNearPoint(end, 20)
        const combinedAlerts = [...closeRouteAlerts, ...destinationAlerts].filter(
          (alert, index, self) => self.findIndex((item) => item.id === alert.id) === index
        )
        setRouteAlerts(combinedAlerts)
      }
    } catch (error) {
      console.error('Error calculando ruta:', error)
    } finally {
      setIsRouting(false)
    }
  }

  const clearRoute = () => {
    setRouteStart(null)
    setRouteEnd(null)
    setRoutePath([])
    setRouteAlerts([])
  }

  return {
    routeStart,
    setRouteStart,
    routeEnd,
    setRouteEnd,
    routeEndAddress,
    setRouteEndAddress,
    routePath,
    routeAlerts,
    isRouting,
    calculateRoute,
    clearRoute,
  }
}