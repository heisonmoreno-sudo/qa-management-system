
**
 * ═══════════════════════════════════════════════════════════════════════════
 * BACKEND_CODE.GS
 * Punto de entrada principal del sistema
 * ═══════════════════════════════════════════════════════════════════════════
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

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function mostrarError(mensaje) {
  var html = '<html><body style="font-family: Arial; padding: 40px; text-align: center;">';
  html += '<h1 style="color: #DC2626;">Error</h1>';
  html += '<p>' + mensaje + '</p>';
  html += '<p><a href="javascript:location.reload()">Recargar página</a></p>';
  html += '</body></html>';
  
  return HtmlService.createHtmlOutput(html);
}

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
