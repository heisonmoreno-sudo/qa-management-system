/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BACKEND_CODE.GS
 * Punto de entrada principal del sistema
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Función principal que se ejecuta cuando alguien abre la Web App
 * Esta es la puerta de entrada del sistema
 */
function doGet(e) {
  try {
    // Obtener el email del usuario actual
    var userEmail = Session.getActiveUser().getEmail();
    
    // Si no se puede obtener el email, usar uno por defecto
    if (!userEmail || userEmail === '') {
      userEmail = 'usuario@qa.com';
    }
    
    // Crear y devolver la interfaz HTML
    var template = HtmlService.createTemplateFromFile('Frontend_Index');
    template.userEmail = userEmail;
    
    return template.evaluate()
      .setTitle('QA Management System')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
      
  } catch (error) {
    Logger.log('Error en doGet: ' + error.toString());
    return mostrarError('Error al cargar la aplicación: ' + error.message);
  }
}

/**
 * Incluye archivos HTML parciales (para modularizar el frontend)
 * Uso: <?!= include('nombre_archivo'); ?> en HTML
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
// FUNCIONES PÚBLICAS - Llamadas desde el frontend
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
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Verifica si un Google Sheet tiene la configuración de workspace
 */
function verificarConfiguracionSheet(sheetUrl) {
  try {
    var sheet = SpreadsheetApp.openByUrl(sheetUrl);
    var hojaConfig = sheet.getSheetByName('Config');
    
    // Verificar si existen las hojas necesarias
    var hojaCasos = sheet.getSheetByName('Casos');
    var tieneConfigCompleta = hojaConfig !== null && hojaCasos !== null;
    
    return {
      success: true,
      tieneConfig: tieneConfigCompleta,
      nombreSheet: sheet.getName()
    };
  } catch (error) {
    Logger.log('Error verificando sheet: ' + error.toString());
    return {
      success: false,
      error: 'No se pudo acceder al Sheet. Verifica la URL y los permisos.'
    };
  }
}

/**
 * Lista todos los workspaces configurados
 * Busca en Drive todos los Sheets que tengan hoja de configuración
 */
function listarWorkspaces() {
  try {
    var workspaces = [];
    
    // TODO: Implementar búsqueda de Sheets con configuración
    // Por ahora devuelve array vacío para que no rompa
    
    return {
      success: true,
      workspaces: workspaces
    };
  } catch (error) {
    Logger.log('Error en listarWorkspaces: ' + error.toString());
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Obtiene un mensaje aleatorio del tipo especificado
 * Para mostrar en spinners y notificaciones
 */
function obtenerMensajeAleatorio(tipo) {
  try {
    var mensajes = {
      'carga': [
        'Preparando tu arsenal de testing...',
        'Cargando casos de prueba...',
        'Sincronizando con el servidor...',
        'Configurando workspace...',
        'Casi listo...'
      ],
      'exito': [
        '¡Excelente trabajo!',
        '¡Operación exitosa!',
        '¡Todo listo!',
        '¡Perfecto!'
      ]
    };
    
    var listaMensajes = mensajes[tipo] || mensajes['carga'];
    var mensaje = listaMensajes[Math.floor(Math.random() * listaMensajes.length)];
    
    return {
      success: true,
      mensaje: mensaje
    };
  } catch (error) {
    return {
      success: true,
      mensaje: 'Cargando...'
    };
  }
}

/**
 * Función de prueba para verificar que el backend funciona
 */
function testBackend() {
  try {
    var email = Session.getActiveUser().getEmail() || 'usuario@qa.com';
    
    return {
      success: true,
      mensaje: 'Backend funcionando correctamente!',
      timestamp: new Date().toISOString(),
      user: email
    };
  } catch (error) {
    return {
      success: false,
      mensaje: 'Error en el backend: ' + error.message
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
    // Si falla el log, al menos intentamos
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
