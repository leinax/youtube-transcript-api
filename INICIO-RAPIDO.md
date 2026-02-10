# 🚀 GUÍA RÁPIDA - 5 Minutos a Producción

## ✅ Prerrequisitos
- Node.js 18+ instalado ([Descargar](https://nodejs.org/))

## 📦 Paso 1: Instalar (2 minutos)

```bash
cd youtube-transcript-backend
npm install
```

## 🚀 Paso 2: Iniciar Servidor (10 segundos)

```bash
npm start
```

Verás este mensaje:
```
╔════════════════════════════════════════════════════════════╗
║   🚀 Servidor corriendo en puerto 3001                      ║
╚════════════════════════════════════════════════════════════╝
```

## 🧪 Paso 3: Probar que Funciona (1 minuto)

```bash
npm test
```

Deberías ver:
```
✓ Health check exitoso
✓ Stats obtenidas correctamente
✓ Transcripción obtenida exitosamente
✓ Procesamiento bulk completado
```

## 🌐 Paso 4: Abrir Frontend (10 segundos)

1. Abre el archivo `youtube-transcript-generator-PRODUCTION.html` en tu navegador
2. Pega una URL de YouTube (ej: https://www.youtube.com/watch?v=dQw4w9WgXcQ)
3. Click en "Obtener Transcripción"

## ✨ ¡Listo!

Ya tienes transcripciones REALES de YouTube funcionando.

---

## 📝 Comandos Útiles

```bash
# Iniciar servidor
npm start

# Modo desarrollo (auto-reload)
npm run dev

# Ejecutar pruebas
npm test

# Ver configuración
curl http://localhost:3001/api/stats
```

---

## 🔧 Cambiar Configuración

Edita el archivo `.env`:

```env
# Puerto del servidor
PORT=3001

# Máximo de videos en bulk
BULK_MAX_VIDEOS=50

# Videos procesados simultáneamente
BULK_CONCURRENT_REQUESTS=3
```

---

## 🐛 Problemas Comunes

### "Port 3001 already in use"
Cambia el puerto en `.env` a 3002 o mata el proceso:
```bash
lsof -ti:3001 | xargs kill -9
```

### "Cannot find module"
```bash
npm install
```

### "CORS blocked"
Verifica que el frontend tenga el URL correcto: `http://localhost:3001`

---

## 📚 Documentación Completa

Para detalles completos, ve: `README.md`

---

## 🎯 Casos de Uso Reales

### Individual:
- Transcribir un video educativo
- Obtener subtítulos de una charla
- Extraer contenido de un tutorial

### Bulk:
- Analizar 30 videos de reviews de productos
- Transcribir una serie completa de webinars
- Procesar conferencia con múltiples charlas

---

## 🚀 Deploy a Producción

### Railway (más fácil):
1. railway.app → New Project
2. Conecta este repo
3. Deploy automático
4. URL pública generada

### Render:
1. render.com → New Web Service
2. Build: `npm install`
3. Start: `npm start`
4. Deploy

---

## ⏱️ Tiempos de Procesamiento

- 1 video: ~2-3 segundos
- 10 videos: ~20-30 segundos
- 50 videos (bulk): ~5-7 minutos

---

## 🎉 ¡Éxito!

Si todo funciona, tienes:
- ✅ Backend API funcional
- ✅ Frontend conectado
- ✅ Transcripciones reales de YouTube
- ✅ Procesamiento individual y bulk
- ✅ Rate limiting configurado
- ✅ Manejo de errores robusto

**Ahora puedes integrar esto con Bonnus o Conversa.**
