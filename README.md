# YouTube Transcript API - Guía de Instalación Paso a Paso

## 📦 Paso 1: Instalar Dependencias

### Requisitos Previos
- **Node.js**: Versión 18 o superior ([Descargar aquí](https://nodejs.org/))
- **npm**: Viene incluido con Node.js

Verifica tu instalación:
```bash
node --version  # Debe mostrar v18.x.x o superior
npm --version   # Debe mostrar 9.x.x o superior
```

### Instalar las dependencias del proyecto

```bash
cd youtube-transcript-backend
npm install
```

Esto instalará:
- `express` - Framework web
- `cors` - Para permitir requests desde el frontend
- `youtube-transcript` - Librería para obtener transcripciones
- `express-rate-limit` - Control de rate limiting
- `dotenv` - Manejo de variables de entorno
- `nodemon` - Auto-reload durante desarrollo

**⏱️ Tiempo estimado:** 1-2 minutos

---

## 🚀 Paso 2: Iniciar el Servidor

### Modo Desarrollo (con auto-reload)
```bash
npm run dev
```

### Modo Producción
```bash
npm start
```

Deberías ver este mensaje:
```
╔════════════════════════════════════════════════════════════╗
║   YouTube Transcript API Server                           ║
╠════════════════════════════════════════════════════════════╣
║   🚀 Servidor corriendo en puerto 3001                      ║
║   🌍 Ambiente: development                                 ║
║   📦 Bulk: hasta 50 videos                                 ║
║   ⚡ Concurrencia: 3 videos simultáneos                     ║
╠════════════════════════════════════════════════════════════╣
║   Endpoints disponibles:                                   ║
║   GET  http://localhost:3001/health                        ║
║   GET  http://localhost:3001/api/stats                     ║
║   POST http://localhost:3001/api/transcript                ║
║   POST http://localhost:3001/api/bulk-transcript           ║
╚════════════════════════════════════════════════════════════╝
```

**✅ Si ves esto, tu servidor está funcionando correctamente!**

---

## 🧪 Paso 3: Probar el API

### Opción A: Usar el script de prueba automático

```bash
npm test
```

Esto ejecutará una suite completa de pruebas que incluye:
- ✓ Health check
- ✓ Estadísticas del servidor
- ✓ Transcripción individual
- ✓ Procesamiento bulk (3 videos)
- ✓ Manejo de errores

### Opción B: Probar manualmente con curl

**1. Health Check:**
```bash
curl http://localhost:3001/health
```

**2. Obtener una transcripción:**
```bash
curl -X POST http://localhost:3001/api/transcript \
  -H "Content-Type: application/json" \
  -d '{"videoId": "dQw4w9WgXcQ"}'
```

**3. Procesamiento Bulk:**
```bash
curl -X POST http://localhost:3001/api/bulk-transcript \
  -H "Content-Type: application/json" \
  -d '{"videoIds": ["dQw4w9WgXcQ", "jNQXAC9IVRw"]}'
```

### Opción C: Probar desde el navegador

Abre en tu navegador:
- Health: http://localhost:3001/health
- Stats: http://localhost:3001/api/stats

---

## 🌐 Paso 4: Conectar con el Frontend

Ahora necesitas actualizar tu archivo HTML para usar el API real.

Abre `youtube-transcript-generator.html` y modifica estas funciones:

### 4.1. Actualizar función fetchSingleTranscript

Reemplaza la función completa:

```javascript
const fetchSingleTranscript = async (videoId) => {
    const response = await fetch('http://localhost:3001/api/transcript', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId })
    });

    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Error al obtener transcripción');
    }

    return data.transcript;
};
```

### 4.2. Actualizar función processBulkTranscripts

Reemplaza la función completa:

```javascript
const processBulkTranscripts = async (videoIds) => {
    const ids = videoIds.map(v => v.id);
    
    const response = await fetch('http://localhost:3001/api/bulk-transcript', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoIds: ids })
    });

    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Error en procesamiento bulk');
    }

    // Transformar resultados al formato esperado por el frontend
    return data.results.map(result => ({
        id: result.videoId,
        url: `https://youtube.com/watch?v=${result.videoId}`,
        status: result.success ? 'completed' : 'error',
        transcript: result.transcript,
        error: result.error
    }));
};
```

### 4.3. Eliminar los delays simulados

Busca y **elimina** estas líneas:
```javascript
// ELIMINAR ESTO:
await new Promise(resolve => setTimeout(resolve, 1500));
await delay(1500 + Math.random() * 1000);

// Y ELIMINAR la simulación de errores:
if (Math.random() < 0.1) {
    throw new Error('Video no disponible o sin subtítulos');
}
```

---

## 🔧 Paso 5: Configuración Avanzada (Opcional)

### Modificar límites de procesamiento

Edita el archivo `.env`:

```env
# Aumentar videos permitidos en bulk
BULK_MAX_VIDEOS=100

# Aumentar concurrencia (cuidado con rate limits)
BULK_CONCURRENT_REQUESTS=5

# Reducir delay entre lotes
BULK_DELAY_BETWEEN_BATCHES=500
```

**⚠️ Advertencia:** Aumentar estos valores puede causar rate limiting de YouTube.

### Agregar tu dominio en producción

En `.env`, modifica:
```env
ALLOWED_ORIGINS=http://localhost:3000,https://tudominio.com
```

---

## 📋 Checklist de Verificación

Antes de considerar que todo está funcionando:

- [ ] Node.js instalado (v18+)
- [ ] `npm install` ejecutado sin errores
- [ ] Servidor inicia correctamente (`npm start`)
- [ ] Health check responde OK
- [ ] Script de prueba pasa todos los tests (`npm test`)
- [ ] Frontend conectado y funcionando
- [ ] Transcripción individual funciona
- [ ] Procesamiento bulk funciona

---

## 🐛 Solución de Problemas Comunes

### Error: "Cannot find module 'youtube-transcript'"

**Solución:**
```bash
npm install youtube-transcript --save
```

### Error: "Port 3001 already in use"

**Solución 1:** Cambiar puerto en `.env`:
```env
PORT=3002
```

**Solución 2:** Matar el proceso en el puerto:
```bash
# En Mac/Linux
lsof -ti:3001 | xargs kill -9

# En Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Error: "CORS policy blocked"

**Solución:** Verifica que tu origen esté en `ALLOWED_ORIGINS` en `.env`

Para desarrollo local con archivo HTML abierto directamente:
```env
ALLOWED_ORIGINS=http://localhost:3000,file://
```

### Error: "Transcript is disabled"

**Causa:** El video no tiene subtítulos/transcripción disponible.

**Solución:** Prueba con otro video que tenga subtítulos habilitados.

### Error: "Rate limit exceeded"

**Causa:** Demasiadas requests en poco tiempo.

**Solución:** Espera 1 minuto o ajusta `RATE_LIMIT_MAX_REQUESTS` en `.env`

---

## 📊 Endpoints Disponibles

### GET /health
Verifica que el servidor esté funcionando.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-02-10T10:30:00.000Z",
  "environment": "development"
}
```

### GET /api/stats
Obtiene estadísticas y configuración del servidor.

**Response:**
```json
{
  "limits": {
    "maxVideosPerBulk": 50,
    "concurrentRequests": 3,
    "rateLimitPerMinute": 20,
    "bulkRequestsPerHour": 5
  },
  "server": {
    "uptime": 3600,
    "nodeVersion": "v18.17.0",
    "environment": "development"
  }
}
```

### POST /api/transcript
Obtiene la transcripción de un video individual.

**Request:**
```json
{
  "videoId": "dQw4w9WgXcQ"
}
```

**Response:**
```json
{
  "success": true,
  "videoId": "dQw4w9WgXcQ",
  "transcript": "[00:00:00] We're no strangers to love...",
  "metadata": {
    "segments": 42,
    "processingTimeMs": 1234,
    "timestamp": "2025-02-10T10:30:00.000Z"
  }
}
```

### POST /api/bulk-transcript
Procesa múltiples videos en bulk.

**Request:**
```json
{
  "videoIds": ["dQw4w9WgXcQ", "jNQXAC9IVRw"]
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "videoId": "dQw4w9WgXcQ",
      "success": true,
      "transcript": "...",
      "metadata": {
        "segments": 42,
        "processingTimeMs": 1234
      }
    }
  ],
  "summary": {
    "total": 2,
    "successful": 2,
    "failed": 0,
    "processingTimeMs": 3456,
    "timestamp": "2025-02-10T10:30:00.000Z"
  }
}
```

---

## 🚀 Deploy a Producción

### Opción 1: Railway

1. Crea cuenta en [Railway.app](https://railway.app)
2. Conecta tu repositorio GitHub
3. Railway detectará automáticamente Node.js
4. Agrega variables de entorno en el dashboard
5. Deploy automático

### Opción 2: Render

1. Crea cuenta en [Render.com](https://render.com)
2. New Web Service → Conecta GitHub
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Agrega variables de entorno

### Opción 3: Heroku

```bash
heroku create youtube-transcript-api
heroku config:set NODE_ENV=production
git push heroku main
```

---

## 📝 Notas Importantes

1. **Rate Limiting de YouTube:** La API de YouTube tiene límites. No abuses del servicio.

2. **Videos sin transcripción:** No todos los videos tienen transcripción disponible. Maneja estos casos apropiadamente.

3. **Privacidad:** No almacenes transcripciones sin permiso del creador del contenido.

4. **Escalabilidad:** Para más de 1000 videos/día, considera implementar un sistema de colas (BullMQ).

5. **Caché:** Para producción seria, implementa Redis para cachear transcripciones populares.

---

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs del servidor
2. Verifica que todos los pasos se completaron
3. Consulta la sección de "Solución de Problemas"
4. Verifica que el video tenga subtítulos disponibles

---

## ✅ Todo Listo

Si llegaste hasta aquí y todo funciona:

🎉 **¡Felicidades! Tienes un sistema completo de transcripción de YouTube funcionando.**

Ahora puedes:
- Transcribir videos individuales
- Procesar hasta 50 videos en bulk
- Integrar con tus proyectos (Bonnus, Conversa)
- Escalar según tus necesidades
