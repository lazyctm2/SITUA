# Walking Alerts Frontend

Frontend React + Vite para la app Walking Alerts.

## Configuración de variables de entorno

Crea un archivo `.env` local copiando `.env.example`.

Variables principales:

- `VITE_API_URL`: URL completa del backend, por ejemplo `http://localhost:3000`
- `VITE_USE_HTTPS`: `true` para habilitar HTTPS en Vite local (opcional)
- `VITE_SSL_KEY`: ruta al archivo de llave local (solo si usas HTTPS local)
- `VITE_SSL_CERT`: ruta al archivo de certificado local (solo si usas HTTPS local)

## Scripts útiles

- `npm install` — instala dependencias
- `npm run dev` — inicia Vite en modo desarrollo
- `npm run build` — genera la carpeta `dist` para producción
- `npm run preview` — sirve la versión de producción localmente

## Despliegue

La app se puede generar como sitio estático si el backend está disponible por separado.

- Comando de construcción: `npm install && npm run build`
- Directorio de publicación: `dist`
- La acción de GitHub Pages del repositorio publica automáticamente el contenido de `dist` cuando haces push a `main`.

> Si quieres usar un backend público en producción, configura el secreto `VITE_API_URL` en el repositorio con la URL del backend.

## Notas importantes

- El frontend usa `VITE_API_URL` para conectarse al backend en lugar de una dirección hardcodeada.
- El archivo `.env` está ignorado en Git (`.gitignore`).
- Si usas HTTPS local, configura `VITE_USE_HTTPS` y rutas válidas para `VITE_SSL_KEY` y `VITE_SSL_CERT`.
