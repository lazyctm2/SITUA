# Validación de Alertas entre Usuarios Cercanos

Este documento describe el flujo de validación de alertas que debe soportar el backend para que la lógica implementada en el frontend funcione correctamente.

## Objetivo

Antes de publicar una alerta en el mapa, el reporte debe ser enviado a los usuarios cercanos para que validen si realmente se está produciendo un delito. Solo si la validación es positiva, la alerta se publica en el mapa.

## Eventos de Socket

### 1. `request-alert-validation`

Emitido por el usuario que reporta la alerta.

Payload esperado:
```json
{
  "requestId": "validation-123abc",
  "requesterId": "socketId123",
  "alertTypeId": 1,
  "alertTypeName": "Asalto",
  "lat": -38.7359,
  "lng": -72.5904,
  "deviceId": "web",
  "city": "Temuco",
  "country": "Chile",
  "created_at": "2026-05-07T..."
}
```

### 2. `alert-validation-request`

Emitido por el servidor a los usuarios cercanos al punto reportado, exceptuando al propio reportante.

Payload esperado:
```json
{
  "requestId": "validation-123abc",
  "requesterId": "socketId123",
  "alertTypeId": 1,
  "alertTypeName": "Asalto",
  "lat": -38.7359,
  "lng": -72.5904,
  "deviceId": "web",
  "city": "Temuco",
  "country": "Chile",
  "created_at": "2026-05-07T..."
}
```

### 3. `alert-validation-answer`

Emitido por cada vecino que recibe la solicitud de validación.

Payload esperado:
```json
{
  "requestId": "validation-123abc",
  "approved": true
}
```

### 4. `alert-validation-result`

Emitido por el servidor al reportante cuando la validación termina.

Payload si la alerta fue aprobada:
```json
{
  "requestId": "validation-123abc",
  "approved": true,
  "alert": {
    "id": "abc123",
    "alert_type_id": 1,
    "device_id": "web",
    "lat": -38.7359,
    "lng": -72.5904,
    "created_at": "2026-05-07T..."
  }
}
```

Payload si la alerta fue rechazada:
```json
{
  "requestId": "validation-123abc",
  "approved": false
}
```

### 5. `new-alert`

Emitido por el servidor a todos los usuarios cuando una alerta validada se publica en el mapa.

Payload esperado: la alerta normalizada con `id`, `lat`, `lng`, `alert_type_id`, `created_at`, etc.

## Lógica recomendada del servidor

1. Recibe `request-alert-validation`.
2. Identifica vecinos cercanos al punto `lat/lng`.
3. Reenvía `alert-validation-request` a esos vecinos.
4. Recolecta respuestas `alert-validation-answer`.
5. Decide si la alerta se aprueba o rechaza.
   - Puede ser mayoría simple, al menos un "sí", o una regla de quorum.
6. Si se aprueba:
   - Guarda la alerta en la base de datos.
   - Emite `alert-validation-result` al reportante con `approved: true` y los datos de alerta.
   - Emite `new-alert` a todos los clientes para mostrar la alerta en el mapa.
7. Si se rechaza:
   - Emite `alert-validation-result` al reportante con `approved: false`.

## Ejemplo de servidor mínimo (Node + Socket.IO)

```js
import express from 'express'
import http from 'http'
import { Server } from 'socket.io'

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: '*' },
})

const pendingValidations = new Map()

io.on('connection', (socket) => {
  socket.on('request-alert-validation', (payload) => {
    const requestId = payload.requestId
    pendingValidations.set(requestId, {
      payload,
      answers: [],
      requesterSocketId: socket.id,
    })

    const nearbySockets = findNearbySockets(payload.lat, payload.lng, socket.id)
    nearbySockets.forEach((neighborSocket) => {
      neighborSocket.emit('alert-validation-request', payload)
    })
  })

  socket.on('alert-validation-answer', ({ requestId, approved }) => {
    const validation = pendingValidations.get(requestId)
    if (!validation) return

    validation.answers.push({ approved, from: socket.id })

    const result = decideValidation(validation.answers)
    if (result.ready) {
      pendingValidations.delete(requestId)
      const requester = io.sockets.sockets.get(validation.requesterSocketId)
      if (!requester) return

      if (result.approved) {
        const alert = saveAlertToDatabase(validation.payload)
        requester.emit('alert-validation-result', {
          requestId,
          approved: true,
          alert,
        })
        io.emit('new-alert', alert)
      } else {
        requester.emit('alert-validation-result', {
          requestId,
          approved: false,
        })
      }
    }
  })
})

function decideValidation(answers) {
  const yesCount = answers.filter((a) => a.approved).length
  const noCount = answers.filter((a) => !a.approved).length
  const total = answers.length

  if (total < 2) return { ready: false }
  return { approved: yesCount >= noCount, ready: true }
}
```

## Notas

- El frontend actual ya maneja `request-alert-validation`, `alert-validation-request`, y `alert-validation-result`.
- El servidor debe excluir al reportante del broadcast de validación para que no se autovalide.
- Si el servidor aprueba la alerta, debe emitir `new-alert` para que todos los clientes actualicen el mapa.
