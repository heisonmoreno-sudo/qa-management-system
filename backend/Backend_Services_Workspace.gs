/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BACKEND_SERVICES_EJECUCION.GS
 * Servicio para gestión de ejecución de casos
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Actualiza el estado de ejecución de un caso
 * @param {string} sheetUrl - URL del Sheet
 * @param {string} casoId - ID del caso
 * @param {Object} datosEjecucion - Datos de la ejecución
 *   - estadoEjecucion: string (Sin ejecutar, Ejecutando, OK, No_OK, Bloqueado, Descartado)
 *   - comentarios: string
 *   - evidencias: array de URLs
 * @returns {Object} Resultado
 */
function actualizarEstadoEjecucion(sheetUrl, casoId, datosEjecucion) {
  try {
    Logger.log('Actualizando estado de ejecución para caso: ' + casoId);
    Logger.log('Datos: ' + JSON.stringify(datosEjecucion));
    
    var spreadsheet = SpreadsheetApp.openByUrl(sheetUrl);
    
    // Buscar el caso en todas las hojas
    var resultado = buscarCasoEnTodasHojas(spreadsheet, casoId);
    
    if (!resultado) {
      return {
        success: false,
        mensaje: 'Caso no encontrado: ' + casoId
      };
    }
    
    var hoja = resultado.hoja;
    var fila = resultado.fila;
    var headers = resultado.headers;
    
    // Índices de columnas
    var colEstadoEjecucion = headers.indexOf('EstadoEjecucion') + 1;
    var colFechaUltimaEjecucion = headers.indexOf('FechaUltimaEjecucion') + 1;
    var colResultadoUltimaEjecucion = headers.indexOf('ResultadoUltimaEjecucion') + 1;
    var colComentariosEjecucion = headers.indexOf('ComentariosEjecucion') + 1;
    var colEvidenciasURL = headers.indexOf('EvidenciasURL') + 1;
    
    // Actualizar estado de ejecución
    if (colEstadoEjecucion > 0) {
      hoja.getRange(fila, colEstadoEjecucion).setValue(datosEjecucion.estadoEjecucion);
    }
    
    // Actualizar fecha de última ejecución
    if (colFechaUltimaEjecucion > 0) {
      hoja.getRange(fila, colFechaUltimaEjecucion).setValue(new Date());
    }
    
    // Actualizar resultado (solo si es OK o No_OK)
    if (colResultadoUltimaEjecucion > 0) {
      if (datosEjecucion.estadoEjecucion === 'OK' || datosEjecucion.estadoEjecucion === 'No_OK') {
        hoja.getRange(fila, colResultadoUltimaEjecucion).setValue(datosEjecucion.estadoEjecucion);
      }
    }
    
    // Actualizar comentarios
    if (colComentariosEjecucion > 0 && datosEjecucion.comentarios) {
      hoja.getRange(fila, colComentariosEjecucion).setValue(datosEjecucion.comentarios);
    }
    
    // Actualizar evidencias (separadas por salto de línea)
    if (colEvidenciasURL > 0 && datosEjecucion.evidencias && datosEjecucion.evidencias.length > 0) {
      var evidenciasTexto = datosEjecucion.evidencias.join('\n');
      hoja.getRange(fila, colEvidenciasURL).setValue(evidenciasTexto);
    }
    
    Logger.log('Estado de ejecución actualizado exitosamente');
    
    return {
      success: true,
      mensaje: 'Estado actualizado correctamente',
      data: {
        casoId: casoId,
        estadoEjecucion: datosEjecucion.estadoEjecucion
      }
    };
    
  } catch (error) {
    Logger.log('Error actualizando estado de ejecución: ' + error.toString());
    return {
      success: false,
      mensaje: 'Error al actualizar estado: ' + error.message
    };
  }
}

/**
 * Busca un caso por ID en todas las hojas del spreadsheet
 * @param {Spreadsheet} spreadsheet
 * @param {string} casoId
 * @returns {Object|null} {hoja, fila, headers}
 */
function buscarCasoEnTodasHojas(spreadsheet, casoId) {
  var hojas = spreadsheet.getSheets();
  var hojasExcluidas = ['Config', 'Bugs', 'Ejecuciones', 'Regresiones'];
  
  for (var i = 0; i < hojas.length; i++) {
    var hoja = hojas[i];
    var nombreHoja = hoja.getName();
    
    // Skip hojas del sistema
    if (hojasExcluidas.indexOf(nombreHoja) > -1) {
      continue;
    }
    
    var datos = hoja.getDataRange().getValues();
    
    if (datos.length < 2) continue; // Sin datos
    
    var headers = datos[0];
    var colID = headers.indexOf('ID');
    
    if (colID === -1) continue; // No tiene columna ID
    
    // Buscar el caso
    for (var j = 1; j < datos.length; j++) {
      if (datos[j][colID] === casoId) {
        return {
          hoja: hoja,
          fila: j + 1,
          headers: headers
        };
      }
    }
  }
  
  return null;
}

/**
 * Sube una evidencia a Google Drive
 * @param {Object} archivoData - {nombre, contenidoBase64, mimeType}
 * @returns {Object} {success, url}
 */
function subirEvidenciaADrive(archivoData) {
  try {
    Logger.log('Subiendo evidencia a Drive: ' + archivoData.nombre);
    
    // Obtener carpeta de evidencias desde Config
    var config = obtenerConfiguracion();
    var carpetaId = config['carpeta_evidencias_id'];
    
    if (!carpetaId || carpetaId === '') {
      return {
        success: false,
        mensaje: 'No se ha configurado la carpeta de evidencias en Config'
      };
    }
    
    // Obtener carpeta
    var carpeta = DriveApp.getFolderById(carpetaId);
    
    // Decodificar base64 y crear archivo
    var contenidoDecodificado = Utilities.base64Decode(archivoData.contenidoBase64);
    var blob = Utilities.newBlob(contenidoDecodificado, archivoData.mimeType, archivoData.nombre);
    
    // Crear archivo en Drive
    var archivo = carpeta.createFile(blob);
    
    // Hacer público (opcional, según necesidad)
    // archivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    var url = archivo.getUrl();
    
    Logger.log('Evidencia subida exitosamente: ' + url);
    
    return {
      success: true,
      url: url,
      nombre: archivoData.nombre
    };
    
  } catch (error) {
    Logger.log('Error subiendo evidencia: ' + error.toString());
    return {
      success: false,
      mensaje: 'Error al subir archivo: ' + error.message
    };
  }
}

/**
 * Obtiene resumen de ejecución de todos los casos
 * @param {string} sheetUrl - URL del Sheet
 * @returns {Object} Estadísticas de ejecución
 */
function obtenerResumenEjecucion(sheetUrl) {
  try {
    var spreadsheet = SpreadsheetApp.openByUrl(sheetUrl);
    var hojas = spreadsheet.getSheets();
    var hojasExcluidas = ['Config', 'Bugs', 'Ejecuciones', 'Regresiones'];
    
    var resumen = {
      total: 0,
      sinEjecutar: 0,
      ejecutando: 0,
      bloqueado: 0,
      ok: 0,
      noOk: 0,
      descartado: 0
    };
    
    for (var i = 0; i < hojas.length; i++) {
      var hoja = hojas[i];
      var nombreHoja = hoja.getName();
      
      if (hojasExcluidas.indexOf(nombreHoja) > -1) continue;
      
      var datos = hoja.getDataRange().getValues();
      
      if (datos.length < 2) continue;
      
      var headers = datos[0];
      var colEstadoEjecucion = headers.indexOf('EstadoEjecucion');
      
      if (colEstadoEjecucion === -1) continue;
      
      // Contar por estado
      for (var j = 1; j < datos.length; j++) {
        var estado = datos[j][colEstadoEjecucion] || 'Sin ejecutar';
        resumen.total++;
        
        switch (estado) {
          case 'Sin ejecutar':
            resumen.sinEjecutar++;
            break;
          case 'Ejecutando':
            resumen.ejecutando++;
            break;
          case 'Bloqueado':
            resumen.bloqueado++;
            break;
          case 'OK':
            resumen.ok++;
            break;
          case 'No_OK':
            resumen.noOk++;
            break;
          case 'Descartado':
            resumen.descartado++;
            break;
          default:
            resumen.sinEjecutar++;
        }
      }
    }
    
    // Calcular porcentaje
    resumen.porcentaje = resumen.total > 0 
      ? Math.round((resumen.ok / resumen.total) * 100) 
      : 0;
    
    return {
      success: true,
      data: resumen
    };
    
  } catch (error) {
    Logger.log('Error obteniendo resumen: ' + error.toString());
    return {
      success: false,
      mensaje: 'Error al obtener resumen: ' + error.message
    };
  }
}

/**
 * Función de prueba
 */
function testEjecucion() {
  Logger.log('🧪 Test de ejecución');
  
  var sheetUrl = 'TU_SHEET_URL_AQUI';
  
  // Test 1: Obtener resumen
  Logger.log('\n📊 Test 1: Resumen');
  var resumen = obtenerResumenEjecucion(sheetUrl);
  Logger.log(JSON.stringify(resumen, null, 2));
  
  // Test 2: Actualizar estado
  Logger.log('\n🔄 Test 2: Actualizar estado');
  var resultado = actualizarEstadoEjecucion(sheetUrl, 'LOGIN-TC-1', {
    estadoEjecucion: 'OK',
    comentarios: 'Test ejecutado correctamente',
    evidencias: ['https://drive.google.com/file/d/123']
  });
  Logger.log(JSON.stringify(resultado, null, 2));
}
