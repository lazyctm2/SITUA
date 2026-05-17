import { useState, useEffect } from 'react'

export function useUserLocation() {
  const [location, setLocation] = useState(null)
  const [accuracy, setAccuracy] = useState(null)
  const [error, setError] = useState(() =>
    typeof navigator !== 'undefined' && navigator.geolocation
      ? null
      : 'Geolocalización no soportada'
  )

  useEffect(() => {
    if (!navigator.geolocation) {
      return
    }

    const watcher = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }
        setLocation(loc)
        setAccuracy(pos.coords.accuracy)
        setError(null)
      },
      (err) => {
        setError(err.message)
        console.error(err)
      },
      {
        enableHighAccuracy: false,
        timeout: 20000,
        maximumAge: 10000,
      }
    )

    return () => navigator.geolocation.clearWatch(watcher)
  }, [])

  return { location, accuracy, error }
}