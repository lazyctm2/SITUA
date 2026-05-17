# Walking Alerts Frontend

Frontend React + Vite para la app Walking Alerts.

## Configuración para GitHub y Render

### Variables de entorno

Crea un archivo `.env` local copiando `.env.example`.

Variables principales:

- `VITE_API_URL`: URL completa del backend, por ejemplo `https://walking-alerts-backend.onrender.com`
- `VITE_USE_HTTPS`: `true` para habilitar HTTPS en Vite local (opcional)
- `VITE_SSL_KEY`: ruta al archivo de llave local (solo si usas HTTPS local)
- `VITE_SSL_CERT`: ruta al archivo de certificado local (solo si usas HTTPS local)

### Scripts útiles

- `npm install` — instala dependencias
- `npm run dev` — inicia Vite en modo desarrollo
- `npm run build` — genera la carpeta `dist` para producción
- `npm run preview` — sirve la versión de producción localmente

### Despliegue en Render

La app se puede desplegar como un sitio estático si el backend está disponible por separado.

- `Build Command`: `npm install && npm run build`
- `Publish Directory`: `dist`
- Variables de entorno en Render: `VITE_API_URL`

### Notas importantes

- El frontend ahora usa `VITE_API_URL` para conectarse al backend en lugar de una dirección hardcodeada.
- El archivo `.env` está ignorado en Git (`.gitignore`).
- Si usas HTTPS local, configura `VITE_USE_HTTPS` y rutas válidas para `VITE_SSL_KEY` y `VITE_SSL_CERT`.
