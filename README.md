# Walking Alerts

Un sistema integral de alertas de seguridad en tiempo real para peatones y ciclistas.

## Estructura del Proyecto

- **walking-alerts-backend**: API Node.js + Express + PostgreSQL + Socket.IO
- **walking-alerts-frontend**: React + Vite + Leaflet

## Instalación y Desarrollo Local

### Backend

```bash
cd walking-alerts-backend
npm install
npm start
```

### Frontend

```bash
cd walking-alerts-frontend
npm install
npm run dev
```

## Despliegue en Render

### Backend
- Connect to `walking-alerts-backend` folder
- Build: `npm install`
- Start: `npm start`
- Variables: `DATABASE_URL`

### Frontend
- Connect to `walking-alerts-frontend` folder
- Build: `npm install && npm run build`
- Publish: `dist`
- Variables: `VITE_API_URL`

Ver documentación detallada en cada carpeta.
