import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  Polyline,
  useMap,
} from 'react-leaflet'
import { useState, useEffect, useMemo } from 'react'
import L from 'leaflet'
import './App.css'
import { API_URL, socket } from './config'
import { useUserLocation } from './hooks/useUserLocation'
import { useAlerts } from './hooks/useAlerts'
import { useRouting } from './hooks/useRouting'

const ALERT_TYPES = [
  { id: 1, name: 'Asalto', icon: '/icons/asalto.svg', label: 'AS', color: '#dc2626' },
  { id: 2, name: 'Accidente vehicular', icon: '/icons/accidente_vehicular.svg', label: 'AV', color: '#d97706' },
  { id: 3, name: 'Accidente peatonal', icon: '/icons/accidente_peatonal.svg', label: 'AP', color: '#16a34a' },
  { id: 4, name: 'Portonazo', icon: '/icons/portonazo.svg', label: 'PT', color: '#7c3aed' },
  { id: 5, name: 'Incendio', icon: '/icons/incendio.svg', label: 'IN', color: '#f97316' },
]

const userIcon = new L.DivIcon({
  className: 'user-location-marker',
  iconSize: [42, 42],
  iconAnchor: [21, 21],
  html: `
    <div class="user-location-marker-wrap">
      <span class="user-location-inner"></span>
    </div>
  `,
})

function createAlertIcon(iconUrl = '/icons/asalto.svg', color = '#d32f2f') {
  return L.divIcon({
    className: 'alert-marker',
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    html: `
      <div class="alert-marker-wrap" style="background: ${color}; border-color: ${color};">
        <img src="${iconUrl}" class="alert-marker-image" alt="" />
      </div>
    `,
  })
}

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

function UserLocationFollower({ position, follow }) {
  const map = useMap()

  useEffect(() => {
    if (follow && position) {
      map.setView([position.lat, position.lng], map.getZoom(), {
        animate: true,
      })
    }
  }, [position, follow, map])

  return null
}

function App() {
  const {
    location: userLocation,
    accuracy,
    error: locationError,
  } = useUserLocation()
  const {
    alerts,
    animatedAlertId,
    lastUpdated,
    error: alertsError,
    isLoading: alertsLoading,
    addOrUpdateAlert,
  } = useAlerts(API_URL, ALERT_TYPES, userLocation)
  const [street, setStreet] = useState('')
  const [selectedType, setSelectedType] = useState(ALERT_TYPES[0])
  const [followUser, setFollowUser] = useState(true)
  const [activePanel, setActivePanel] = useState('report')
  const [city, setCity] = useState(null)
  const [country, setCountry] = useState(null)
  const [destinationQuery, setDestinationQuery] = useState('')
  const [destinationSuggestions, setDestinationSuggestions] = useState([])
  const [securityRadius, setSecurityRadius] = useState(800)
  const {
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
  } = useRouting(alerts)
  useEffect(() => {
    if (!userLocation || city) return

    const reverseUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.lat}&lon=${userLocation.lng}&zoom=10&addressdetails=1&accept-language=es`
    fetch(reverseUrl)
      .then((res) => res.json())
      .then((data) => {
        const address = data.address || {}
        const detectedCity =
          address.city || address.town || address.village || address.county || address.state
        const detectedCountry = address.country || 'Chile'
        setCity(detectedCity || 'Temuco')
        setCountry(detectedCountry || 'Chile')
      })
      .catch(() => {
        setCity('Temuco')
        setCountry('Chile')
      })
  }, [userLocation, city])

  const validAlerts = useMemo(
    () =>
      alerts.filter(
        (alert) =>
          Number.isFinite(alert.lat) && Number.isFinite(alert.lng)
      ),
    [alerts]
  )

  const alertsWithDistance = useMemo(() => {
    if (!userLocation) return validAlerts

    return validAlerts.map((alert) => ({
      ...alert,
      distance: calculateDistanceMeters(userLocation, {
        lat: alert.lat,
        lng: alert.lng,
      }),
    }))
  }, [validAlerts, userLocation])

  const visibleAlerts = userLocation
    ? alertsWithDistance.filter(
        (alert) => alert.distance !== null && alert.distance <= securityRadius
      )
    : alertsWithDistance

  const displayAlerts = routePath.length > 0
    ? [
        ...visibleAlerts,
        ...routeAlerts.filter(
          (routeAlert) => !visibleAlerts.some((visible) => visible.id === routeAlert.id)
        ),
      ]
    : visibleAlerts

  const nearestAlert = userLocation
    ? visibleAlerts.reduce((closest, alert) => {
        if (!closest) return alert
        return alert.distance < closest.distance ? alert : closest
      }, null)
    : null

  const nearbyAlertCount = visibleAlerts.length
  const lastUpdatedLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Cargando...'

  const handleSelectDestination = async (suggestion) => {
    if (!userLocation) {
      alert('Activa la ubicación para crear rutas seguras')
      return
    }

    const destination = {
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
    }

    setDestinationQuery(suggestion.display_name)
    setDestinationSuggestions([])
    setRouteEnd(destination)

    if (!routeStart) {
      setRouteStart(userLocation)
      calculateRoute(userLocation, destination)
    } else {
      calculateRoute(routeStart, destination)
    }
  }

  useEffect(() => {
    if (!destinationQuery || destinationQuery.length < 3) {
      setDestinationSuggestions([])
      return
    }

    const timer = setTimeout(async () => {
      try {
        const query = `${destinationQuery}${city ? `, ${city}` : ''}${country ? `, ${country}` : ''}`
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=1&accept-language=es&q=${encodeURIComponent(query)}`
        const res = await fetch(url)
        const data = await res.json()
        setDestinationSuggestions(
          Array.isArray(data)
            ? data.map((item) => ({
                id: item.place_id,
                display_name: item.display_name,
                lat: item.lat,
                lon: item.lon,
              }))
            : []
        )
      } catch (error) {
        console.error('Error fetching suggestions', error)
        setDestinationSuggestions([])
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [destinationQuery, city, country])

  const submitAlert = async (useLocation = false) => {
    let lat
    let lng

    if (useLocation) {
      if (!userLocation) {
        alert('Activa la ubicación para reportar desde tu posición actual')
        return
      }
      lat = userLocation.lat
      lng = userLocation.lng
    } else {
      if (!street) {
        alert('Ingrese una dirección')
        return
      }

      const query = `${street}, ${city}, ${country}`
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}`

      try {
        const res = await fetch(url)
        const data = await res.json()

        if (!data.length) {
          alert('Dirección no encontrada')
          return
        }

        const result = data[0]
        lat = parseFloat(result.lat)
        lng = parseFloat(result.lon)
      } catch (error) {
        console.error(error)
        alert('Error al buscar la dirección')
        return
      }
    }

    try {
      console.log('Enviando alerta:', { alertTypeId: selectedType.id, lat, lng, deviceId: useLocation ? 'user-location' : 'web' })
      const response = await fetch(`${API_URL}/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alertTypeId: selectedType.id,
          lat,
          lng,
          deviceId: useLocation ? 'user-location' : 'web',
        }),
      })

      console.log('Respuesta del servidor:', response.status, response.statusText)
      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        throw new Error(errorBody?.error || 'Error al publicar alerta')
      }

      alert('Alerta reportada exitosamente')
      if (!useLocation) setStreet('')
    } catch (error) {
      console.error('Error en submitAlert:', error)
      alert(error.message || 'Error al enviar la alerta')
    }

  }

  return (
    <div className="app-shell">
      <div className="map-panel">
        <div className="top-bar">
          <div className="top-search-wrapper">
            <input
              className="top-search-input"
              type="text"
              placeholder="¿Dónde vamos hoy?"
              value={destinationQuery}
              onChange={(e) => setDestinationQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && destinationSuggestions.length > 0) {
                  handleSelectDestination(destinationSuggestions[0])
                }
              }}
            />
            {destinationSuggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {destinationSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    className="suggestion-item"
                    onClick={() => handleSelectDestination(suggestion)}
                  >
                    {suggestion.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <MapContainer
          className="custom-map"
          center={[-38.7359, -72.5904]}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          onContextMenu={(e) => {
            e.originalEvent.preventDefault()
            if (routeStart && !routeEnd) {
              setRouteEnd({ lat: e.latlng.lat, lng: e.latlng.lng })
            }
          }}
        >
          <TileLayer
            url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap contributors &copy; Stadia Maps'
          />
          <UserLocationFollower position={userLocation} follow={followUser} />

          {userLocation && (
            <>
              <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} />
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={securityRadius}
                pathOptions={{
                  color: '#0ea5e9',
                  weight: 1,
                  fillOpacity: 0,
                  opacity: 0.28,
                }}
              />
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={securityRadius}
                pathOptions={{
                  className: 'radar-circle',
                  color: '#0ea5e9',
                  weight: 2,
                  fillOpacity: 0,
                  opacity: 0.9,
                }}
              />
            </>
          )}

          {displayAlerts.map((alert) => (
            <Marker
              key={alert.id}
              position={[alert.lat, alert.lng]}
              icon={createAlertIcon(alert.type.icon, alert.type.color)}
            />
          ))}

          {routePath.length > 0 && (
            <Polyline
              positions={routePath}
              pathOptions={{
                color: '#00f0ff',
                weight: 4,
                opacity: 0.95,
              }}
            />
          )}

          {routeStart && (
            <Marker
              position={[routeStart.lat, routeStart.lng]}
              icon={L.divIcon({
                className: 'route-marker start',
                iconSize: [32, 32],
                iconAnchor: [16, 32],
                html: '<div class="route-marker-wrap start">A</div>',
              })}
            />
          )}

          {routeEnd && (
            <Marker
              position={[routeEnd.lat, routeEnd.lng]}
              icon={L.divIcon({
                className: 'route-marker end',
                iconSize: [32, 32],
                iconAnchor: [16, 32],
                html: '<div class="route-marker-wrap end">B</div>',
              })}
            />
          )}
        </MapContainer>
        <button
          type="button"
          className={`follow-user-button ${followUser ? 'active' : ''}`}
          onClick={() => setFollowUser((value) => !value)}
          aria-label="Seguir ubicación"
        >
          <span className="follow-icon">📍</span>
        </button>
      </div>

      <div className="floating-panel-buttons">
        <button
          type="button"
          className={`floating-button ${activePanel === 'report' ? 'active' : ''}`}
          onClick={() => setActivePanel(activePanel === 'report' ? 'none' : 'report')}
          aria-label="Reportar"
        >
          <span className="button-icon">⚠️</span>
          <span>Reportar</span>
        </button>
        <button
          type="button"
          className={`floating-button ${activePanel === 'insights' ? 'active' : ''}`}
          onClick={() => setActivePanel(activePanel === 'insights' ? 'none' : 'insights')}
          aria-label="Avisos"
        >
          <span className="button-icon">📊</span>
          <span>Avisos</span>
        </button>
        <button
          type="button"
          className={`floating-button ${activePanel === 'prefs' ? 'active' : ''}`}
          onClick={() => setActivePanel(activePanel === 'prefs' ? 'none' : 'prefs')}
          aria-label="Configuración"
        >
          <span className="button-icon">⚙️</span>
          <span>Configuración</span>
        </button>
      </div>

      {activePanel !== 'none' && (
        <aside className="controls-panel floating-panel">
          <div className="panel-header-row">
            <div className="panel-title">
              {activePanel === 'report' && 'Reportar incidente'}
              {activePanel === 'insights' && 'Insights'}
              {activePanel === 'prefs' && 'Preferencias'}
            </div>
            <button
              type="button"
              className="floating-close"
              onClick={() => setActivePanel('none')}
              aria-label="Cerrar panel"
            >
              ×
            </button>
          </div>

          {activePanel === 'insights' && (
            <>
              <section className="card header-card">
                <div className="nearest-alert-header">
                  {nearestAlert && (
                    <div className="nearest-alert-icon" style={{ background: `${nearestAlert.type.color}15`, borderColor: nearestAlert.type.color }}>
                      <img src={nearestAlert.type.icon} alt={nearestAlert.type.name} />
                    </div>
                  )}
                  <div>
                    <p className="eyebrow">Delito más cercano</p>
                    <h1>{nearestAlert ? nearestAlert.type.name : 'Sin incidentes cercanos'}</h1>
                    <p className="subtext">
                      {nearestAlert
                        ? `Publicado a las ${nearestAlert.timeLabel} · ${nearestAlert.distance} m de distancia`
                        : 'Ajusta tu radio de seguridad y activa la ubicación para ver incidentes cercanos.'}
                    </p>
                  </div>
                </div>

                <div className="stats-grid">
                  <div className="stat-card">
                    <span>Alertas en radio</span>
                    <strong>{nearbyAlertCount}</strong>
                  </div>
                  <div className="stat-card">
                    <span>Radio seguro</span>
                    <strong>{securityRadius} m</strong>
                  </div>
                  <div className="stat-card">
                    <span>Actualizado</span>
                    <strong>{lastUpdatedLabel}</strong>
                  </div>
                </div>

                <button className="small-button" onClick={() => setFollowUser((v) => !v)}>
                  {followUser ? 'Pausar seguimiento' : 'Seguir ubicación'}
                </button>
              </section>

              <section className="card route-card">
                <div className="section-title">
                  <span>Crear ruta segura</span>
                  {routeAlerts.length > 0 && (
                    <span className="count-pill">{routeAlerts.length} alertas cerca</span>
                  )}
                </div>

                {!routeStart && (
                  <button
                    className="primary-button"
                    onClick={() => {
                      if (userLocation) {
                        setRouteStart(userLocation)
                      } else {
                        alert('Activa la ubicación para crear rutas')
                      }
                    }}
                  >
                    Establecer punto de inicio
                  </button>
                )}

                {routeStart && !routeEnd && (
                  <div>
                    <label className="field-label">Dirección de destino</label>
                    <input
                      className="input-field"
                      type="text"
                      placeholder={`Ej. Avenida Principal, ${city || 'Temuco'}`}
                      value={routeEndAddress}
                      onChange={(e) => setRouteEndAddress(e.target.value)}
                    />
                    <button
                      className="secondary-button"
                      onClick={async () => {
                        if (!routeEndAddress) return
                        try {
                          const query = `${routeEndAddress}, ${city}, ${country}`
                          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
                          const res = await fetch(url)
                          const data = await res.json()
                          if (data.length) {
                            const result = data[0]
                            setRouteEnd({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) })
                            setRouteEndAddress('')
                          } else {
                            alert('Dirección no encontrada')
                          }
                        } catch (error) {
                          console.error(error)
                          alert('Error al buscar la dirección')
                        }
                      }}
                    >
                      Buscar dirección
                    </button>
                    <p className="route-note">O haz clic derecho en el mapa para seleccionar el destino (en móvil, mantén presionado)</p>
                    <button
                      className="secondary-button"
                      onClick={() => setRouteStart(null)}
                    >
                      Cambiar inicio
                    </button>
                  </div>
                )}

                {routeStart && routeEnd && (
                  <div>
                    <button
                      className="primary-button"
                      onClick={() => calculateRoute(routeStart, routeEnd)}
                      disabled={isRouting}
                    >
                      {isRouting ? 'Calculando...' : 'Calcular ruta'}
                    </button>
                    <button
                      className="secondary-button"
                      onClick={clearRoute}
                    >
                      Limpiar ruta
                    </button>
                  </div>
                )}

                {routeAlerts.length > 0 && (
                  <div className="route-warnings">
                    <p className="warning-title">
                      ⚠️ Alertas cerca de la ruta{routeEnd && routeAlerts.some((alert) => calculateDistanceMeters(routeEnd, { lat: alert.lat, lng: alert.lng }) <= 20) ? ' o del destino' : ''}:
                    </p>
                    {routeAlerts.slice(0, 3).map((alert) => (
                      <div key={alert.id} className="route-alert-item">
                        <img src={alert.type.icon} alt={alert.type.name} />
                        <span>
                          {alert.type.name} - {routeEnd && calculateDistanceMeters(routeEnd, { lat: alert.lat, lng: alert.lng }) <= 20
                            ? 'destino cercano'
                            : `${calculateDistanceMeters(routeStart, { lat: alert.lat, lng: alert.lng })} m`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="card list-card">
                <div className="section-title">
                  <span>Últimas alertas</span>
                  <span className="count-pill">{visibleAlerts.length}</span>
                </div>

                <div className="alerts-list">
                  {alertsLoading ? (
                    <div className="empty-state">Cargando alertas...</div>
                  ) : alertsError ? (
                    <div className="empty-state">{alertsError}</div>
                  ) : validAlerts.length === 0 ? (
                    <div className="empty-state">No hay alertas disponibles.</div>
                  ) : (
                    visibleAlerts.slice(0, 5).map((alert) => {
                      const typeName = alert.type?.name || alert.type_name || 'Incidente'
                      const alertIcon =
                        alert.type?.icon ||
                        ALERT_TYPES.find((t) => t.id === alert.alert_type_id)?.icon ||
                        '/icons/asalto.svg'
                      const alertColor = alert.type?.color || '#2563eb'

                      return (
                        <div
                          key={alert.id}
                          className={`alert-item ${alert.id === animatedAlertId ? 'new-alert' : ''}`}
                        >
                          <div className="alert-icon" style={{ background: `${alertColor}15`, borderColor: alertColor }}>
                            <img src={alertIcon} alt={typeName} />
                          </div>
                          <div className="alert-meta">
                            <strong>{typeName}</strong>
                            <span>{alert.device_id ? `Origen: ${alert.device_id}` : 'Origen web'}</span>
                          </div>
                          <div className="alert-status">Activo</div>
                        </div>
                      )
                    })
                  )}
                </div>
              </section>
            </>
          )}

          {activePanel === 'report' && (
            <section className="card report-card">
              <div className="section-title">
                <span>Reportar un incidente</span>
                <span className="pill live">En línea</span>
              </div>

              <label className="field-label">Dirección</label>
              <input
                className="input-field"
                type="text"
                placeholder={`Ej. Avenida Principal, ${city || 'Temuco'}`}
                value={street}
                onChange={(e) => setStreet(e.target.value)}
              />

              <button
                className="secondary-button"
                type="button"
                onClick={() => submitAlert(true)}
                disabled={!userLocation}
              >
                Reportar desde mi ubicación
              </button>

              <label className="field-label">Tipo de alerta</label>
              <div className="type-options">
                {ALERT_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    className={`type-option ${selectedType.id === type.id ? 'active' : ''}`}
                    onClick={() => setSelectedType(type)}
                  >
                    <div className="type-icon" style={{ background: `${type.color}15`, borderColor: type.color }}>
                      <img src={type.icon} alt={type.name} />
                    </div>
                    <span>{type.name}</span>
                  </button>
                ))}
              </div>

              <button
                className="primary-button"
                onClick={() => submitAlert(false)}
              >
                Reportar ahora
              </button>
            </section>
          )}

          {activePanel === 'prefs' && (
            <section className="card prefs-card">
              <div className="section-title">
                <span>Preferencias</span>
              </div>
              <div className="prefs-row">
                <span>Seguir ubicación</span>
                <button
                  className={`small-button ${followUser ? 'active' : 'idle'}`}
                  type="button"
                  onClick={() => setFollowUser((value) => !value)}
                >
                  {followUser ? 'Activo' : 'Inactivo'}
                </button>
              </div>
              <div className="prefs-row">
                <span>Radio de seguridad</span>
                <strong>{securityRadius} m</strong>
              </div>
              <input
                className="radius-range"
                type="range"
                min="200"
                max="1200"
                step="50"
                value={securityRadius}
                onChange={(e) => setSecurityRadius(Number(e.target.value))}
              />
            </section>
          )}
        </aside>
      )}
    </div>
  )
}

export default App
