# Walking Alerts Backend

Backend API for the Walking Alerts app. This Node.js service exposes alert endpoints and broadcasts new alerts via Socket.IO.

## Preparación para GitHub y Render

### 1. Configuración de variables de entorno

Crea un archivo `.env` local copiando `.env.example`.

Variables principales:

- `PORT`: puerto HTTP (Render proporciona su propio `PORT` automáticamente)
- `USE_HTTPS`: `true` para usar certificados locales en desarrollo, `false` para HTTP
- `DATABASE_URL`: conexión de PostgreSQL en Render
- `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`: configuración local alternativa
- `DB_SSL`: `true` si la base de datos requiere SSL

> No comites `.env`; ya está incluido en `.gitignore`.

### 2. Estructura preparada para Render

Render puede desplegar este repositorio directamente con el comando de inicio:

```bash
npm install
npm start
```

El servidor usa `process.env.PORT` y se ajusta automáticamente a Render.

### 3. Desarrollo local

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

### 4. Despliegue en Render

1. Conecta tu repositorio GitHub a Render.
2. Crea un servicio de tipo `Web Service`.
3. Establece `Build Command` en `npm install`.
4. Establece `Start Command` en `npm start`.
5. Añade la variable de entorno `DATABASE_URL` a Render o conecta una base de datos gestionada.
6. Asegúrate de que el servicio usa el comando `npm start` y que `PORT` queda en blanco/sin definir, porque Render lo provee.

### 5. Notas importantes

- El directorio `ssl/` está en `.gitignore` y no se subirá al repositorio.
- `db.js` ahora usa variables de entorno para no exponer credenciales.
- Si usas Render Database, Render crea `DATABASE_URL` automáticamente.
