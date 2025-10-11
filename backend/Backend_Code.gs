/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BACKEND_CODE.GS
 * Punto de entrada principal del sistema
 * VERSIÓN CORREGIDA: Con funciones proxy para exponer servicios
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Función principal que se ejecuta cuando alguien abre la Web App
 */
function doGet(e) {
  try {
    var userEmail = Session.getActiveUser().getEmail();
    
    if (!userEmail || userEmail === '') {
      userEmail = 'usuario@qa.com';
    }
    
    var template = HtmlService.createTemplateFromFile('Frontend_Index');
    template.userEmail = userEmail;
    
    return template.evaluate()
      .setTitle('QA Management System')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
      
  } catch (error) {
    Logger.log('❌ Error en doGet: ' + error.toString());
    return mostrarError('Error al cargar la aplicación: ' + error.message);
  }
}

/**
 * Incluye archivos HTML parciales
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Muestra una página de error amigable
 */
function mostrarError(mensaje) {
  var html = '<html><body style="font-family: Arial; padding: 40px; text-align: center;">';
  html += '<h1 style="color: #DC2626;">Error</h1>';
  html += '<p>' + mensaje + '</p>';
  html += '<p><a href="javascript:location.reload()">Recargar página</a></p>';
  html += '</body></html>';
  
  return HtmlService.createHtmlOutput(html);
}

// ===================================================================
// FUNCIONES PÚBLICAS BÁSICAS
// ===================================================================

/**
 * Obtiene información del usuario actual
 */
function obtenerUsuario() {
  try {
    return {
      email: Session.getActiveUser().getEmail() || 'usuario@qa.com',
      success: true
    };
  } catch (error) {
    Logger.log('❌ Error en obtenerUsuario: ' + error.toString());
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Función de prueba para verificar que el backend funciona
 */
function testBackend() {
  try {
    Logger.log('🧪 Test Backend ejecutado');
    var email = Session.getActiveUser().getEmail() || 'usuario@qa.com';
    
    return {
      success: true,
      mensaje: 'Backend funcionando correctamente!',
      timestamp: new Date().toISOString(),
      user: email
    };
  } catch (error) {
    Logger.log('❌ Error en testBackend: ' + error.toString());
    return {
      success: false,
      mensaje: 'Error en el backend: ' + error.message
    };
  }
}

// ===================================================================
// FUNCIONES PROXY PARA CASOS
// CRÍTICO: Estas funciones DEBEN estar aquí para ser accesibles
// ===================================================================

/**
 * PROXY: Lista casos de prueba
 * Esta función llama a la función real en Backend_Services_Casos.gs
 */
function listarCasos(sheetUrl, filtros) {
  try {
    Logger.log('📞 PROXY listarCasos llamado');
    Logger.log('   URL recibida: ' + sheetUrl);
    Logger.log('   Filtros: ' + JSON.stringify(filtros));
    
    // Validación inmediata
    if (!sheetUrl || sheetUrl === '' || sheetUrl === null || sheetUrl === undefined) {
      Logger.log('❌ PROXY: URL inválida');
      return {
        success: false,
        mensaje: 'URL del Sheet no proporcionada',
        error: 'sheetUrl is null, undefined or empty'
      };
    }
    
    // Llamar a la función real (que está en Backend_Services_Casos.gs)
    // NOTA: En Apps Script, las funciones en otros archivos .gs son accesibles
    var resultado = listarCasosReal(sheetUrl, filtros);
    
    Logger.log('✅ PROXY: Resultado obtenido');
    return resultado;
    
  } catch (error) {
    Logger.log('❌ ERROR en PROXY listarCasos: ' + error.toString());
    return {
      success: false,
      mensaje: 'Error en proxy: ' + error.message,
      error: error.toString()
    };
  }
}

/**
 * PROXY: Obtiene hojas disponibles
 */
function obtenerHojasDisponibles(sheetUrl) {
  try {
    Logger.log('📞 PROXY obtenerHojasDisponibles llamado');
    
    if (!sheetUrl) {
      return {
        success: false,
        mensaje: 'URL no proporcionada'
      };
    }
    
    return obtenerHojasDisponiblesReal(sheetUrl);
    
  } catch (error) {
    Logger.log('❌ ERROR en PROXY obtenerHojasDisponibles: ' + error.toString());
    return {
      success: false,
      mensaje: error.message
    };
  }
}

/**
 * PROXY: Crea un nuevo caso
 */
function crearCaso(datosCaso) {
  try {
    Logger.log('📞 PROXY crearCaso llamado');
    return crearCasoReal(datosCaso);
  } catch (error) {
    Logger.log('❌ ERROR en PROXY crearCaso: ' + error.toString());
    return {
      success: false,
      mensaje: error.message
    };
  }
}

/**
 * PROXY: Crea una nueva hoja
 */
function crearNuevaHoja(sheetUrl, nombreHoja) {
  try {
    Logger.log('📞 PROXY crearNuevaHoja llamado');
    return crearNuevaHojaReal(sheetUrl, nombreHoja);
  } catch (error) {
    Logger.log('❌ ERROR en PROXY crearNuevaHoja: ' + error.toString());
    return {
      success: false,
      mensaje: error.message
    };
  }
}

// ===================================================================
// FUNCIONES PROXY PARA WORKSPACE
// ===================================================================

/**
 * PROXY: Verifica configuración del Sheet
 */
function verificarConfiguracionSheet(sheetUrl) {
  try {
    Logger.log('📞 PROXY verificarConfiguracionSheet llamado');
    
    if (!sheetUrl) {
      return {
        success: false,
        error: 'URL no proporcionada'
      };
    }
    
    var sheet = SpreadsheetApp.openByUrl(sheetUrl);
    var hojaConfig = sheet.getSheetByName('Config');
    var hojaCasos = sheet.getSheetByName('Casos');
    var tieneConfigCompleta = hojaConfig !== null && hojaCasos !== null;
    
    return {
      success: true,
      tieneConfig: tieneConfigCompleta,
      nombreSheet: sheet.getName()
    };
    
  } catch (error) {
    Logger.log('❌ Error verificando sheet: ' + error.toString());
    return {
      success: false,
      error: 'No se pudo acceder al Sheet. Verifica la URL y los permisos.'
    };
  }
}

/**
 * PROXY: Configura workspace
 */
function configurarWorkspace(sheetUrl) {
  try {
    Logger.log('📞 PROXY configurarWorkspace llamado');
    // Esta función está en Backend_Services_Workspace.gs
    return configurarWorkspaceReal(sheetUrl);
  } catch (error) {
    Logger.log('❌ ERROR en PROXY configurarWorkspace: ' + error.toString());
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * PROXY: Crea nuevo workspace
 */
function crearNuevoWorkspace(nombreWorkspace) {
  try {
    Logger.log('📞 PROXY crearNuevoWorkspace llamado');
    return crearNuevoWorkspaceReal(nombreWorkspace);
  } catch (error) {
    Logger.log('❌ ERROR en PROXY crearNuevoWorkspace: ' + error.toString());
    return {
      success: false,
      error: error.message
    };
  }
}

// ===================================================================
// MANEJO DE ERRORES Y LOGS
// ===================================================================

/**
 * Registra un error en el log del sistema
 */
function registrarError(funcion, error, datos) {
  try {
    var mensaje = 'ERROR en ' + funcion + ': ' + error.toString();
    if (datos) {
      mensaje += ' | Datos: ' + JSON.stringify(datos);
    }
    Logger.log(mensaje);
  } catch (e) {
    Logger.log('Error al registrar error: ' + e.toString());
  }
}

/**
 * Registra una acción en el log (para debug)
 */
function registrarAccion(funcion, accion, datos) {
  try {
    var mensaje = funcion + ' - ' + accion;
    if (datos) {
      mensaje += ' | ' + JSON.stringify(datos);
    }
    Logger.log(mensaje);
  } catch (e) {
    // Silencioso si falla
  }
}
