import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let httpsConfig = false
if (process.env.VITE_USE_HTTPS === 'true') {
  const keyPath = process.env.VITE_SSL_KEY || './ssl/localhost-key.pem'
  const certPath = process.env.VITE_SSL_CERT || './ssl/localhost.pem'
  const resolvedKey = path.resolve(__dirname, keyPath)
  const resolvedCert = path.resolve(__dirname, certPath)
  if (fs.existsSync(resolvedKey) && fs.existsSync(resolvedCert)) {
    httpsConfig = {
      key: fs.readFileSync(resolvedKey),
      cert: fs.readFileSync(resolvedCert),
    }
  } else {
    console.warn('VITE_USE_HTTPS=true but SSL files were not found; running Vite in HTTP mode.')
  }
}

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    https: httpsConfig,
  },
})