const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { YoutubeTranscript } = require('youtube-transcript');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
  origin: function(origin, callback) {
    // Permitir requests sin origin (como mobile apps o curl)
    if (!origin) return callback(null, true);
    
    // Permitir file:// para desarrollo local
    if (origin.startsWith('file://')) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 20,
  message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Bulk rate limiting (más restrictivo)
const bulkLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // 5 requests bulk por hora
  message: 'Límite de procesamiento bulk alcanzado. Intenta en 1 hora.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Endpoint para transcripción individual
app.post('/api/transcript', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { videoId } = req.body;
    
    if (!videoId) {
      return res.status(400).json({
        success: false,
        error: 'videoId es requerido'
      });
    }

    console.log(`[${new Date().toISOString()}] Procesando video: ${videoId}`);

    // Obtener transcripción de YouTube
    const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
    
    if (!transcriptData || transcriptData.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No se encontró transcripción para este video'
      });
    }

    // Formatear transcripción con timestamps
    const formattedTranscript = transcriptData.map(item => {
      const hours = Math.floor(item.offset / 3600000);
      const minutes = Math.floor((item.offset % 3600000) / 60000);
      const seconds = Math.floor((item.offset % 60000) / 1000);
      
      const timestamp = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      
      return `[${timestamp}] ${item.text}`;
    }).join('\n\n');

    const processingTime = Date.now() - startTime;
    
    console.log(`[${new Date().toISOString()}] Video ${videoId} procesado en ${processingTime}ms`);

    res.json({
      success: true,
      videoId,
      transcript: formattedTranscript,
      metadata: {
        segments: transcriptData.length,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error:`, error.message);
    
    // Errores comunes y mensajes amigables
    let errorMessage = error.message;
    
    if (error.message.includes('Transcript is disabled')) {
      errorMessage = 'Este video no tiene subtítulos/transcripción disponible';
    } else if (error.message.includes('Video unavailable')) {
      errorMessage = 'Video no disponible o privado';
    } else if (error.message.includes('Could not find')) {
      errorMessage = 'No se pudo encontrar la transcripción para este video';
    }
    
    res.status(400).json({
      success: false,
      error: errorMessage,
      videoId: req.body.videoId
    });
  }
});

// Endpoint para procesamiento BULK
app.post('/api/bulk-transcript', bulkLimiter, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { videoIds } = req.body;
    
    if (!Array.isArray(videoIds) || videoIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'videoIds debe ser un array no vacío'
      });
    }
    
    const maxVideos = parseInt(process.env.BULK_MAX_VIDEOS) || 50;
    if (videoIds.length > maxVideos) {
      return res.status(400).json({
        success: false,
        error: `Máximo ${maxVideos} videos permitidos. Recibidos: ${videoIds.length}`
      });
    }

    console.log(`[${new Date().toISOString()}] Procesamiento bulk iniciado: ${videoIds.length} videos`);

    const results = [];
    const concurrentRequests = parseInt(process.env.BULK_CONCURRENT_REQUESTS) || 3;
    const delayBetweenBatches = parseInt(process.env.BULK_DELAY_BETWEEN_BATCHES) || 1000;
    
    // Procesar en lotes
    for (let i = 0; i < videoIds.length; i += concurrentRequests) {
      const batch = videoIds.slice(i, i + concurrentRequests);
      
      const batchPromises = batch.map(async (videoId) => {
        const itemStartTime = Date.now();
        
        try {
          const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
          
          const formattedTranscript = transcriptData.map(item => {
            const hours = Math.floor(item.offset / 3600000);
            const minutes = Math.floor((item.offset % 3600000) / 60000);
            const seconds = Math.floor((item.offset % 60000) / 1000);
            
            const timestamp = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            
            return `[${timestamp}] ${item.text}`;
          }).join('\n\n');
          
          const processingTime = Date.now() - itemStartTime;
          
          console.log(`  ✓ ${videoId} procesado en ${processingTime}ms`);
          
          return {
            videoId,
            success: true,
            transcript: formattedTranscript,
            metadata: {
              segments: transcriptData.length,
              processingTimeMs: processingTime
            }
          };
        } catch (error) {
          const processingTime = Date.now() - itemStartTime;
          
          console.log(`  ✗ ${videoId} falló: ${error.message}`);
          
          let errorMessage = error.message;
          if (error.message.includes('Transcript is disabled')) {
            errorMessage = 'Transcripción no disponible';
          } else if (error.message.includes('Video unavailable')) {
            errorMessage = 'Video no disponible';
          }
          
          return {
            videoId,
            success: false,
            error: errorMessage,
            metadata: {
              processingTimeMs: processingTime
            }
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Delay entre lotes (excepto en el último)
      if (i + concurrentRequests < videoIds.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }
    
    const totalTime = Date.now() - startTime;
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`[${new Date().toISOString()}] Bulk completado: ${successful} exitosos, ${failed} fallidos en ${totalTime}ms`);
    
    res.json({
      success: true,
      results,
      summary: {
        total: videoIds.length,
        successful,
        failed,
        processingTimeMs: totalTime,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error en bulk:`, error.message);
    
    res.status(500).json({
      success: false,
      error: 'Error en el procesamiento bulk: ' + error.message
    });
  }
});

// Endpoint de estadísticas (opcional)
app.get('/api/stats', (req, res) => {
  res.json({
    limits: {
      maxVideosPerBulk: parseInt(process.env.BULK_MAX_VIDEOS) || 50,
      concurrentRequests: parseInt(process.env.BULK_CONCURRENT_REQUESTS) || 3,
      rateLimitPerMinute: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 20,
      bulkRequestsPerHour: 5
    },
    server: {
      uptime: process.uptime(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint no encontrado'
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   YouTube Transcript API Server                           ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║   🚀 Servidor corriendo en puerto ${PORT}                      ║`);
  console.log(`║   🌍 Ambiente: ${process.env.NODE_ENV || 'development'}                            ║`);
  console.log(`║   📦 Bulk: hasta ${process.env.BULK_MAX_VIDEOS || 50} videos                             ║`);
  console.log(`║   ⚡ Concurrencia: ${process.env.BULK_CONCURRENT_REQUESTS || 3} videos simultáneos               ║`);
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║   Endpoints disponibles:                                   ║');
  console.log(`║   GET  http://0.0.0.0:${PORT}/health                          ║`);
  console.log(`║   GET  http://0.0.0.0:${PORT}/api/stats                       ║`);
  console.log(`║   POST http://0.0.0.0:${PORT}/api/transcript                  ║`);
  console.log(`║   POST http://0.0.0.0:${PORT}/api/bulk-transcript             ║`);
  console.log('╚════════════════════════════════════════════════════════════╝');
});

module.exports = app;
