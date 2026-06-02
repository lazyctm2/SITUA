# Walking Alerts Backend

Backend API for the Walking Alerts app. This Node.js service exposes alert endpoints and broadcasts new alerts via Socket.IO.

## Configuración de variables de entorno

Crea un archivo `.env` local copiando `.env.example`.

Variables principales:

- `PORT`: puerto HTTP para el servidor
- `USE_HTTPS`: `true` para usar certificados locales en desarrollo, `false` para HTTP
- `DATABASE_URL`: conexión de PostgreSQL como cadena única
- `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`: configuración local alternativa
- `DB_SSL`: `true` si la base de datos requiere SSL

> No comites `.env`; ya está incluido en `.gitignore`.

## Desarrollo local

Instala dependencias:

```bash
npm install
```

Ejecuta la app:

```bash
npm start
```

Si quieres usar HTTPS local, configura `.env`:

```env
USE_HTTPS=true
SSL_KEY_PATH=./ssl/10.40.63.9+1-key.pem
SSL_CERT_PATH=./ssl/10.40.63.9+1.pem
```

## Notas importantes

- El directorio `ssl/` está en `.gitignore` y no se subirá al repositorio.
- `db.js` usa variables de entorno para no exponer credenciales.
- Si usas un servicio de base de datos externo, configura `DATABASE_URL` o las variables de conexión local.
