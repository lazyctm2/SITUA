/* eslint-env node */
import express from 'express'
import http from 'http'
import { Server } from 'socket.io'

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
  },
})

app.use(express.json())

const alerts = []
const pendingValidations = new Map()

app.get('/alerts', (req, res) => {
  return res.json(alerts)
})

app.post('/alerts', (req, res) => {
  console.log('Recibida petición POST /alerts:', req.body)
  const { alertTypeId, lat, lng, deviceId } = req.body
  if (alertTypeId == null || lat == null || lng == null) {
    console.log('Datos faltantes:', { alertTypeId, lat, lng })
    return res.status(400).json({ error: 'Faltan datos de la alerta' })
  }

  const newAlert = {
    id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    alert_type_id: alertTypeId,
    device_id: deviceId || 'web',
    lat: Number(lat),
    lng: Number(lng),
    created_at: new Date().toISOString(),
  }

  alerts.unshift(newAlert)
  io.emit('new-alert', newAlert)
  console.log('Alerta creada:', newAlert)
  return res.status(201).json(newAlert)
})

const determineValidation = (answers, totalRequests) => {
  const yesCount = answers.filter((a) => a.approved).length
  const noCount = answers.filter((a) => !a.approved).length
  if (answers.length >= Math.min(totalRequests, 3)) {
    return { ready: true, approved: yesCount >= noCount }
  }
  return { ready: false }
}

const cleanupValidation = (requestId) => {
  pendingValidations.delete(requestId)
}

io.on('connection', (socket) => {
  console.log(`Socket conectado: ${socket.id}`)

  socket.on('request-alert-validation', (payload) => {
    const requestId = payload.requestId || `validation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const validation = {
      payload: { ...payload, requestId },
      answers: [],
      requesterSocketId: socket.id,
      voters: [],
    }
    pendingValidations.set(requestId, validation)

    const targetSockets = Array.from(io.sockets.sockets.values()).filter(
      (client) => client.id !== socket.id
    )

    targetSockets.forEach((client) => {
      client.emit('alert-validation-request', validation.payload)
      validation.voters.push(client.id)
    })

    if (targetSockets.length === 0) {
      const result = {
        requestId,
        approved: false,
      }
      socket.emit('alert-validation-result', result)
      cleanupValidation(requestId)
      return
    }

    const timeout = setTimeout(() => {
      const result = determineValidation(validation.answers, validation.voters.length)
      const approved = result.ready ? result.approved : false
      const response = { requestId, approved, request: validation.payload }
      socket.emit('alert-validation-result', response)
      if (approved) {
        const newAlert = {
          id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          alert_type_id: validation.payload.alertTypeId,
          device_id: validation.payload.deviceId,
          lat: validation.payload.lat,
          lng: validation.payload.lng,
          created_at: validation.payload.created_at,
        }
        alerts.unshift(newAlert)
        io.emit('new-alert', newAlert)
      }
      cleanupValidation(requestId)
    }, 10000)

    pendingValidations.set(requestId, {
      ...validation,
      timeout,
    })
  })

  socket.on('alert-validation-answer', ({ requestId, approved }) => {
    const validation = pendingValidations.get(requestId)
    if (!validation) return

    if (validation.answers.some((item) => item.from === socket.id)) {
      return
    }

    validation.answers.push({ approved, from: socket.id })
    const result = determineValidation(validation.answers, validation.voters.length)

    if (result.ready) {
      clearTimeout(validation.timeout)
      const finalApproved = result.approved
      const response = {
        requestId,
        approved: finalApproved,
        request: validation.payload,
      }
      const requester = io.sockets.sockets.get(validation.requesterSocketId)
      if (requester) {
        requester.emit('alert-validation-result', response)
      }
      if (finalApproved) {
        const newAlert = {
          id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          alert_type_id: validation.payload.alertTypeId,
          device_id: validation.payload.deviceId,
          lat: validation.payload.lat,
          lng: validation.payload.lng,
          created_at: validation.payload.created_at,
        }
        alerts.unshift(newAlert)
        io.emit('new-alert', newAlert)
      }
      cleanupValidation(requestId)
    }
  })

  socket.on('disconnect', () => {
    console.log(`Socket desconectado: ${socket.id}`)
  })
})

const port = process.env.PORT || 3002
server.listen(port, () => {
  console.log(`Servidor de alertas escuchando en http://localhost:${port}`)
})
