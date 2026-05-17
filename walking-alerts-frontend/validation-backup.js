// Backup del sistema de validación de alertas
// Fecha: May 7, 2026
// Este archivo contiene el código de validación que se removió temporalmente
// para simplificar el flujo de reporte de alertas.

// Estados relacionados:
// const [pendingValidationId, setPendingValidationId] = useState(null)
// const [validationStatus, setValidationStatus] = useState('')
// const [validationEnabled, setValidationEnabled] = useState(true)

// Lógica en submitAlert (cuando validationEnabled es true):
/*
      const requestId = `validation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const payload = {
        requestId,
        requesterId: socket.id,
        alertTypeId: selectedType.id,
        alertTypeName: selectedType.name,
        lat,
        lng,
        deviceId: useLocation ? 'user-location' : 'web',
        city,
        country,
        created_at: new Date().toISOString(),
      }

      socket.emit('request-alert-validation', payload)
      setPendingValidationId(requestId)
      setValidationStatus('Alerta enviada a los vecinos para verificación...')

      if (!useLocation) setStreet('')
*/

// En useAlerts.js, los listeners de socket:
/*
  useEffect(() => {
    if (!socket) return

    const handleValidationRequest = (data) => {
      // Lógica para mostrar notificación de validación
      setValidationRequests(prev => [...prev, data])
    }

    const handleValidationResponse = (data) => {
      if (data.requestId === pendingValidationId) {
        setValidationStatus(`Validación: ${data.approved ? 'Aprobada' : 'Rechazada'}`)
        if (data.approved) {
          // Crear la alerta
          const newAlert = {
            id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            alert_type_id: data.alertTypeId,
            device_id: data.deviceId,
            lat: data.lat,
            lng: data.lng,
            created_at: data.created_at,
          }
          setAlerts(prev => [newAlert, ...prev])
          socket.emit('new-alert', newAlert)
        }
        setPendingValidationId(null)
      }
    }

    socket.on('alert-validation-request', handleValidationRequest)
    socket.on('alert-validation-response', handleValidationResponse)

    return () => {
      socket.off('alert-validation-request', handleValidationRequest)
      socket.off('alert-validation-response', handleValidationResponse)
    }
  }, [socket, pendingValidationId])
*/

// UI para mostrar estado de validación:
/*
{validationStatus && (
  <div className="validation-status">
    {validationStatus}
  </div>
)}
*/

// Toggle para habilitar/deshabilitar validación:
/*
<label>
  <input
    type="checkbox"
    checked={validationEnabled}
    onChange={(e) => setValidationEnabled(e.target.checked)}
  />
  Habilitar validación por vecinos
</label>
*/

// En server.js, la lógica de validación:
/*
io.on('connection', (socket) => {
  socket.on('request-alert-validation', (data) => {
    // Enviar a otros sockets para validación
    socket.broadcast.emit('alert-validation-request', data)

    // Simular respuestas automáticas para testing
    setTimeout(() => {
      const approved = Math.random() > 0.3 // 70% aprobación
      io.emit('alert-validation-response', {
        ...data,
        approved,
      })
    }, 2000 + Math.random() * 3000)
  })

  socket.on('disconnect', () => {
    console.log(`Socket desconectado: ${socket.id}`)
  })
})
*/