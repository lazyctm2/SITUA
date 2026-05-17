import { useEffect, useState, useCallback } from 'react'
import { socket } from '../config'
import { calculateDistanceMeters } from '../utils/distance'
import { formatAlertTime } from '../utils/time'

const normalizeCoords = (alert) => {
  const rawLat =
    alert.lat ??
    alert.latitude ??
    alert.location?.lat ??
    alert.position?.lat ??
    alert.coordinates?.lat ??
    alert.coord?.lat
  const rawLng =
    alert.lng ??
    alert.lon ??
    alert.longitude ??
    alert.location?.lng ??
    alert.position?.lng ??
    alert.coordinates?.lng ??
    alert.coord?.lng

  const lat = rawLat != null ? Number(rawLat) : null
  const lng = rawLng != null ? Number(rawLng) : null

  return {
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
  }
}

const normalizeId = (alert) => alert.id ?? alert._id ?? alert.uuid ?? alert.key ?? null
const normalizeDeviceId = (alert) => alert.device_id ?? alert.deviceId ?? alert.device ?? 'web'
const normalizeTypeId = (alert) =>
  alert.alert_type_id ?? alert.alertTypeId ?? alert.type_id ?? alert.alertType ?? null
const normalizeTypeName = (alert) =>
  alert.type_name ?? alert.typeName ?? alert.alertTypeName ?? alert.type?.name ?? ''
const normalizeCreatedAt = (alert) =>
  alert.created_at ?? alert.createdAt ?? alert.timestamp ?? alert.time ?? null

const chooseType = (alert, ALERT_TYPES) => {
  const typeId = normalizeTypeId(alert)
  const typeName = normalizeTypeName(alert)

  return (
    ALERT_TYPES.find((t) => t.id === typeId) ||
    ALERT_TYPES.find((t) => t.name?.toLowerCase() === String(typeName).toLowerCase()) ||
    ALERT_TYPES[0]
  )
}

const normalizeAlertPayload = (alert, ALERT_TYPES, userLocation) => {
  const { lat, lng } = normalizeCoords(alert)
  const type = chooseType(alert, ALERT_TYPES)
  const distance =
    userLocation && lat != null && lng != null
      ? calculateDistanceMeters(userLocation, { lat, lng })
      : null

  return {
    ...alert,
    id: normalizeId(alert) ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    lat,
    lng,
    alert_type_id: normalizeTypeId(alert),
    device_id: normalizeDeviceId(alert),
    created_at: normalizeCreatedAt(alert),
    type,
    distance,
    timeLabel: formatAlertTime(normalizeCreatedAt(alert)),
    originLabel:
      normalizeDeviceId(alert) === 'user-location'
        ? 'Ubicación actual'
        : 'Dirección ingresada',
  }
}

/**
 * Hook encargado de:
 * - cargar alertas desde la API
 * - escuchar alertas por socket
 * - normalizar TODAS las alertas para la UI
 */
export function useAlerts(API_URL, ALERT_TYPES, userLocation) {
  const [alerts, setAlerts] = useState([])
  const [animatedAlertId, setAnimatedAlertId] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const normalizeAlert = useCallback(
    (alert) => normalizeAlertPayload(alert, ALERT_TYPES, userLocation),
    [ALERT_TYPES, userLocation]
  )

  useEffect(() => {
    fetch(`${API_URL}/alerts`)
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.alerts ?? []
        const normalized = list.map(normalizeAlert)
        setAlerts(normalized)
        setLastUpdated(new Date().toISOString())
      })
      .catch((err) => {
        console.error('Error cargando alertas:', err)
        setError('No fue posible cargar las alertas. Verifica la conexión o el servidor.')
      })
      .finally(() => setIsLoading(false))
  }, [API_URL, normalizeAlert])

  useEffect(() => {
    const handleNewAlert = (alert) => {
      const normalized = normalizeAlert(alert)
      setAlerts((prev) => [normalized, ...prev.filter((item) => item.id !== normalized.id)])
      setAnimatedAlertId(normalized.id)
      setLastUpdated(new Date().toISOString())
    }

    socket.on('new-alert', handleNewAlert)
    socket.on('clear-alerts', () => setAlerts([]))

    return () => {
      socket.off('new-alert', handleNewAlert)
      socket.off('clear-alerts')
    }
  }, [normalizeAlert])

  const addOrUpdateAlert = useCallback(
    (alert) => {
      const normalized = normalizeAlert(alert)
      setAlerts((prev) => [normalized, ...prev.filter((item) => item.id !== normalized.id)])
    },
    [normalizeAlert]
  )

  useEffect(() => {
    if (!animatedAlertId) return
    const timer = setTimeout(() => setAnimatedAlertId(null), 900)
    return () => clearTimeout(timer)
  }, [animatedAlertId])

  return {
    alerts,
    animatedAlertId,
    lastUpdated,
    error,
    isLoading,
    addOrUpdateAlert,
  }
}
