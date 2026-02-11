// Script de prueba para el API de YouTube Transcript
// Uso: node test-api.js

const API_URL = 'http://localhost:3001';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testHealthCheck() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('TEST 1: Health Check', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    
    if (response.ok) {
      log('✓ Health check exitoso', 'green');
      log(`  Status: ${data.status}`, 'blue');
      log(`  Timestamp: ${data.timestamp}`, 'blue');
    } else {
      log('✗ Health check falló', 'red');
    }
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
    log('  ¿Está el servidor corriendo en el puerto 3001?', 'yellow');
  }
}

async function testStats() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('TEST 2: Estadísticas del Servidor', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  
  try {
    const response = await fetch(`${API_URL}/api/stats`);
    const data = await response.json();
    
    if (response.ok) {
      log('✓ Stats obtenidas correctamente', 'green');
      log('\n  Límites configurados:', 'blue');
      log(`    • Max videos por bulk: ${data.limits.maxVideosPerBulk}`, 'blue');
      log(`    • Requests concurrentes: ${data.limits.concurrentRequests}`, 'blue');
      log(`    • Rate limit por minuto: ${data.limits.rateLimitPerMinute}`, 'blue');
      log(`    • Bulk requests por hora: ${data.limits.bulkRequestsPerHour}`, 'blue');
    } else {
      log('✗ Error obteniendo stats', 'red');
    }
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
  }
}

async function testSingleTranscript() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('TEST 3: Transcripción Individual', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  
  // Video de prueba: "Never Gonna Give You Up" - Rick Astley
  const testVideoId = 'dQw4w9WgXcQ';
  
  try {
    log(`\n  Procesando video: ${testVideoId}`, 'yellow');
    const startTime = Date.now();
    
    const response = await fetch(`${API_URL}/api/transcript`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videoId: testVideoId })
    });
    
    const data = await response.json();
    const endTime = Date.now();
    
    if (data.success) {
      log(`\n✓ Transcripción obtenida exitosamente`, 'green');
      log(`  Tiempo de respuesta: ${endTime - startTime}ms`, 'blue');
      log(`  Segmentos: ${data.metadata.segments}`, 'blue');
      log(`  Video ID: ${data.videoId}`, 'blue');
      log('\n  Primeras 3 líneas de la transcripción:', 'blue');
      const lines = data.transcript.split('\n').slice(0, 6);
      lines.forEach(line => {
        if (line.trim()) log(`    ${line}`, 'blue');
      });
    } else {
      log(`\n✗ Error: ${data.error}`, 'red');
    }
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
  }
}

async function testBulkTranscript() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('TEST 4: Procesamiento Bulk (3 videos)', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  
  // Videos de prueba cortos
  const testVideoIds = [
    'dQw4w9WgXcQ', // Rick Astley
    'jNQXAC9IVRw', // Me at the zoo (primer video de YouTube)
    '9bZkp7q19f0'  // Gangnam Style
  ];
  
  try {
    log(`\n  Procesando ${testVideoIds.length} videos en bulk...`, 'yellow');
    const startTime = Date.now();
    
    const response = await fetch(`${API_URL}/api/bulk-transcript`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videoIds: testVideoIds })
    });
    
    const data = await response.json();
    const endTime = Date.now();
    
    if (data.success) {
      log(`\n✓ Procesamiento bulk completado`, 'green');
      log(`  Tiempo total: ${endTime - startTime}ms`, 'blue');
      log(`  Exitosos: ${data.summary.successful}`, 'green');
      log(`  Fallidos: ${data.summary.failed}`, data.summary.failed > 0 ? 'yellow' : 'blue');
      
      log('\n  Resultados por video:', 'blue');
      data.results.forEach((result, index) => {
        const status = result.success ? '✓' : '✗';
        const color = result.success ? 'green' : 'red';
        const segments = result.metadata.segments || 'N/A';
        log(`    ${status} ${result.videoId} - ${segments} segmentos (${result.metadata.processingTimeMs}ms)`, color);
        if (!result.success) {
          log(`      Error: ${result.error}`, 'red');
        }
      });
    } else {
      log(`\n✗ Error: ${data.error}`, 'red');
    }
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
  }
}

async function testInvalidVideo() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('TEST 5: Manejo de Errores', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  
  const invalidVideoId = 'INVALID123';
  
  try {
    log(`\n  Intentando procesar video inválido: ${invalidVideoId}`, 'yellow');
    
    const response = await fetch(`${API_URL}/api/transcript`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videoId: invalidVideoId })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      log(`\n✓ Error manejado correctamente`, 'green');
      log(`  Mensaje de error: ${data.error}`, 'blue');
    } else {
      log(`\n✗ Debería haber retornado un error`, 'red');
    }
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
  }
}

async function runAllTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║           SUITE DE PRUEBAS - YouTube Transcript API       ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  await testHealthCheck();
  await testStats();
  await testSingleTranscript();
  await testBulkTranscript();
  await testInvalidVideo();
  
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('✓ Suite de pruebas completada', 'green');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');
}

// Ejecutar tests
runAllTests().catch(error => {
  log(`\nError fatal: ${error.message}`, 'red');
  process.exit(1);
});
