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

## Despliegue

### Backend
- Carpeta: `walking-alerts-backend`
- Build: `npm install`
- Start: `npm start`
- Variables: `DATABASE_URL`

### Frontend
- Carpeta: `walking-alerts-frontend`
- Build: `npm install && npm run build`
- Publicar: `dist`
- Variables: `VITE_API_URL`

El frontend puede desplegarse gratis en GitHub Pages con la acción de CI incluida.

Ver documentación detallada en cada carpeta.
