const express = require("express");
const cors = require("cors");
const http = require("http");
const https = require("https");
const fs = require("fs");
const { Server } = require("socket.io");
const pool = require("./db");

const app = express();
const port = process.env.PORT || 3000;
const useHttps = process.env.USE_HTTPS === "true";

let server;
if (useHttps) {
  const keyPath = process.env.SSL_KEY_PATH || "./ssl/10.40.63.9+1-key.pem";
  const certPath = process.env.SSL_CERT_PATH || "./ssl/10.40.63.9+1.pem";

  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    server = https.createServer(
      {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      },
      app
    );
  } else {
    console.warn("USE_HTTPS=true set but SSL files not found; falling back to HTTP.");
  }
}

if (!server) {
  server = http.createServer(app);
}

const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());

const ALERT_TTL_HOURS = 1

async function cleanupOldAlerts() {
  try {
    const result = await pool.query(
      `DELETE FROM alerts
       WHERE created_at < NOW() - INTERVAL '${ALERT_TTL_HOURS} hour'`
    )
    if (result.rowCount) {
      console.log(`Removed ${result.rowCount} alerts older than ${ALERT_TTL_HOURS}h`)
    }
  } catch (error) {
    console.error('Error cleaning old alerts:', error)
  }
}

cleanupOldAlerts()
setInterval(cleanupOldAlerts, 15 * 60 * 1000)

/* 🔹 TIPOS DE ALERTA */
app.get("/alert-types", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM alert_types ORDER BY id"
  );
  res.json(result.rows);
});

/* 🔹 OBTENER TODAS LAS ALERTAS (AL ENTRAR A LA APP) */
app.get("/alerts", async (req, res) => {
  const result = await pool.query(`
    SELECT 
      a.id,
      a.alert_type_id,
      t.name AS type_name,
      ST_Y(a.location::geometry) AS lat,
      ST_X(a.location::geometry) AS lng,
      a.device_id,
      a.created_at
    FROM alerts a
    JOIN alert_types t ON t.id = a.alert_type_id
    WHERE a.created_at >= NOW() - INTERVAL '${ALERT_TTL_HOURS} hour'
    ORDER BY a.created_at DESC
  `);

  res.json(result.rows);
});

app.delete("/alerts", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM alerts")
    io.emit('clear-alerts')
    res.json({ deleted: result.rowCount })
  } catch (error) {
    console.error('Error deleting alerts:', error)
    res.status(500).json({ error: 'Error deleting alerts' })
  }
})

/* 🔹 CREAR ALERTA Y EMITIRLA A TODOS */
app.post("/alerts", async (req, res) => {
  const alertTypeId = req.body.alertTypeId || req.body.alert_type_id
  const { lat, lng, deviceId } = req.body

  if (!alertTypeId || lat == null || lng == null) {
    return res.status(400).json({ error: "Faltan datos requeridos" })
  }

  try {
    const insertResult = await pool.query(
      `
      INSERT INTO alerts (alert_type_id, location, device_id)
      VALUES (
        $1,
        ST_SetSRID(ST_MakePoint($2, $3), 4326),
        $4
      )
      RETURNING id
      `,
      [alertTypeId, lng, lat, deviceId || "web"]
    )

    const alertId = insertResult.rows[0].id
    const result = await pool.query(`
      SELECT
        a.id,
        a.alert_type_id,
        t.name AS type_name,
        ST_Y(a.location::geometry) AS lat,
        ST_X(a.location::geometry) AS lng,
        a.device_id,
        a.created_at
      FROM alerts a
      JOIN alert_types t ON t.id = a.alert_type_id
      WHERE a.id = $1
    `, [alertId])

    const newAlert = result.rows[0]

    // 🔴 Emitir la alerta con tipo y datos completos
    io.emit("new-alert", newAlert)

    res.json(newAlert)
  } catch (error) {
    console.error("Error creando alerta:", error)
    res.status(500).json({ error: "Error creando alerta" })
  }
})

/* 🔹 SOCKET.IO */
io.on("connection", socket => {
  console.log("Dispositivo conectado:", socket.id);
});

/* 🔹 HEALTHCHECK / RAÍZ */
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Walking Alerts backend", uptime_seconds: process.uptime() });
});

/* 🔹 INICIAR SERVIDOR */
server.listen(3000, () => {
  console.log("Backend activo en https://0.0.0.0:3000");
});