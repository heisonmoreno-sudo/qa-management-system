// ===================================================================
// BACKEND_SERVICES_WORKSPACE.GS
// Servicio para gestión y configuración de workspaces
// ACTUALIZADO: Validación de nombres duplicados (case insensitive)
// ===================================================================

/**
 * Verifica si un Sheet tiene la configuración necesaria
 * @param {string} sheetUrl - URL del Google Sheet
 * @returns {Object} Estado de la configuración
 */
function verificarConfiguracionSheet(sheetUrl) {
  try {
    Logger.log('Verificando configuracion del Sheet: ' + sheetUrl);
    
    // Intentar abrir el Sheet
    var spreadsheet = SpreadsheetApp.openByUrl(sheetUrl);
    var nombreSheet = spreadsheet.getName();
    
    // Verificar hojas requeridas
    var hojasRequeridas = ['Config', 'Casos', 'Bugs', 'Ejecuciones', 'Regresiones'];
    var hojasExistentes = spreadsheet.getSheets().map(function(sheet) {
      return sheet.getName();
    });
    
    var hojasFaltantes = [];
    hojasRequeridas.forEach(function(hoja) {
      if (hojasExistentes.indexOf(hoja) === -1) {
        hojasFaltantes.push(hoja);
      }
    });
    
    // Verificar si Config tiene los campos necesarios
    var configCompleta = false;
    var hojaConfig = spreadsheet.getSheetByName('Config');
    
    if (hojaConfig !== null) {
      var datosConfig = hojaConfig.getDataRange().getValues();
      configCompleta = datosConfig.length > 1; // Tiene mas que solo headers
    }
    
    return {
      success: true,
      nombreSheet: nombreSheet,
      tieneConfig: hojasFaltantes.length === 0 && configCompleta,
      hojasExistentes: hojasExistentes,
      hojasFaltantes: hojasFaltantes,
      necesitaConfiguracion: hojasFaltantes.length > 0 || !configCompleta,
      mensaje: hojasFaltantes.length > 0 
        ? 'El Sheet necesita configuracion. Faltan hojas: ' + hojasFaltantes.join(', ')
        : 'Sheet configurado correctamente'
    };
    
  } catch (error) {
    Logger.log('Error verificando Sheet: ' + error.toString());
    
    // Verificar tipo de error
    if (error.toString().indexOf('perhaps it does not exist') > -1) {
      return {
        success: false,
        error: 'No se pudo acceder al Sheet. Verifica la URL o que tengas permisos.'
      };
    }
    
    return {
      success: false,
      error: 'Error al verificar Sheet: ' + error.message
    };
  }
}

/**
 * Configura automáticamente un Sheet nuevo o incompleto
 * @param {string} sheetUrl - URL del Google Sheet
 * @returns {Object} Resultado de la configuración
 */
function configurarWorkspace(sheetUrl) {
  try {
    Logger.log('Iniciando configuracion de workspace: ' + sheetUrl);
    
    var spreadsheet = SpreadsheetApp.openByUrl(sheetUrl);
    var resultado = {
      success: true,
      hojasCreadas: [],
      hojasActualizadas: [],
      errores: []
    };
    
    // 1. Crear/Verificar hoja Config
    resultado = crearHojaConfig(spreadsheet, resultado);
    
    // 2. Crear/Verificar hoja Casos
    resultado = crearHojaCasos(spreadsheet, resultado);
    
    // 3. Crear/Verificar hoja Bugs
    resultado = crearHojaBugs(spreadsheet, resultado);
    
    // 4. Crear/Verificar hoja Ejecuciones
    resultado = crearHojaEjecuciones(spreadsheet, resultado);
    
    // 5. Crear/Verificar hoja Regresiones
    resultado = crearHojaRegresiones(spreadsheet, resultado);
    
    // 6. Eliminar hoja por defecto si existe y esta vacia
    eliminarHojaPorDefecto(spreadsheet);
    
    Logger.log('Configuracion completada. Hojas creadas: ' + resultado.hojasCreadas.length);
    
    resultado.mensaje = 'Workspace configurado exitosamente. Creadas: ' + 
                        resultado.hojasCreadas.length + ' hojas';
    
    return resultado;
    
  } catch (error) {
    Logger.log('Error configurando workspace: ' + error.toString());
    return {
      success: false,
      error: 'Error al configurar workspace: ' + error.message
    };
  }
}

/**
 * Crea o actualiza la hoja de configuración
 */
function crearHojaConfig(spreadsheet, resultado) {
  var nombreHoja = 'Config';
  var hoja = spreadsheet.getSheetByName(nombreHoja);
  
  if (hoja === null) {
    hoja = spreadsheet.insertSheet(nombreHoja);
    resultado.hojasCreadas.push(nombreHoja);
  } else {
    resultado.hojasActualizadas.push(nombreHoja);
  }
  
  // Headers
  var headers = ['Clave', 'Valor', 'Descripcion'];
  
  // Datos iniciales
  var datos = [
    ['workspace_nombre', spreadsheet.getName(), 'Nombre del workspace'],
    ['workspace_creado', new Date().toISOString(), 'Fecha de creacion'],
    ['workspace_version', '1.0', 'Version del sistema'],
    ['workspace_activo', 'SI', 'Estado del workspace'],
    ['ultimo_caso_id', '0', 'Ultimo ID de caso generado'],
    ['ultimo_bug_id', '0', 'Ultimo ID de bug generado'],
    ['trello_board_url', '', 'URL del board de Trello (opcional)'],
    ['trello_api_key', '', 'API Key de Trello (opcional)'],
    ['trello_token', '', 'Token de Trello (opcional)']
  ];
  
  // Escribir datos solo si la hoja esta vacia
  if (hoja.getLastRow() === 0) {
    hoja.getRange(1, 1, 1, headers.length).setValues([headers]);
    hoja.getRange(2, 1, datos.length, datos[0].length).setValues(datos);
    
    // Formato
    hoja.getRange(1, 1, 1, headers.length)
      .setBackground('#0f172a')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    
    hoja.setColumnWidth(1, 200);
    hoja.setColumnWidth(2, 300);
    hoja.setColumnWidth(3, 300);
    
    hoja.setFrozenRows(1);
  }
  
  return resultado;
}

/**
 * Crea o actualiza la hoja de Casos
 */
function crearHojaCasos(spreadsheet, resultado) {
  var nombreHoja = 'Casos';
  var hoja = spreadsheet.getSheetByName(nombreHoja);
  
  if (hoja === null) {
    hoja = spreadsheet.insertSheet(nombreHoja);
    resultado.hojasCreadas.push(nombreHoja);
  } else {
    resultado.hojasActualizadas.push(nombreHoja);
  }
  
  // Headers
  var headers = [
    'ID',
    'Hoja',
    'Titulo',
    'Descripcion',
    'Formato',
    'Prioridad',
    'TipoPrueba',
    'Pasos',
    'ResultadoEsperado',
    'ScenarioGiven',
    'ScenarioWhen',
    'ScenarioThen',
    'Precondiciones',
    'FlujoCritico',
    'CandidatoRegresion',
    'Estado',
    'FechaCreacion',
    'CreadoPor',
    'FechaUltimaEjecucion',
    'ResultadoUltimaEjecucion',
    'LinkTrelloHU',
    'LinkBugRelacionado',
    'CasoURI',
    'Notas'
  ];
  
  // Escribir headers solo si esta vacia
  if (hoja.getLastRow() === 0) {
    hoja.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Formato
    hoja.getRange(1, 1, 1, headers.length)
      .setBackground('#0f172a')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    
    // Anchos de columna
    hoja.setColumnWidth(1, 100);  // ID
    hoja.setColumnWidth(2, 150);  // Hoja
    hoja.setColumnWidth(3, 300);  // Titulo
    hoja.setColumnWidth(4, 400);  // Descripcion
    
    hoja.setFrozenRows(1);
    hoja.setFrozenColumns(1);
  }
  
  return resultado;
}

/**
 * Crea o actualiza la hoja de Bugs
 */
function crearHojaBugs(spreadsheet, resultado) {
  var nombreHoja = 'Bugs';
  var hoja = spreadsheet.getSheetByName(nombreHoja);
  
  if (hoja === null) {
    hoja = spreadsheet.insertSheet(nombreHoja);
    resultado.hojasCreadas.push(nombreHoja);
  } else {
    resultado.hojasActualizadas.push(nombreHoja);
  }
  
  // Headers
  var headers = [
    'ID',
    'Titulo',
    'Descripcion',
    'Severidad',
    'Prioridad',
    'Estado',
    'TieneCasoDiseñado',
    'LinkCasoPrueba',
    'CasoURI',
    'OrigenSinCaso',
    'PasosReproducir',
    'ResultadoEsperado',
    'ResultadoActual',
    'Ambiente',
    'Navegador',
    'FechaDeteccion',
    'DetectadoPor',
    'AsignadoA',
    'FechaResolucion',
    'LinkTrello',
    'Adjuntos',
    'Notas'
  ];
  
  // Escribir headers solo si esta vacia
  if (hoja.getLastRow() === 0) {
    hoja.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Formato
    hoja.getRange(1, 1, 1, headers.length)
      .setBackground('#0f172a')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    
    // Anchos
    hoja.setColumnWidth(1, 100);  // ID
    hoja.setColumnWidth(2, 300);  // Titulo
    hoja.setColumnWidth(3, 400);  // Descripcion
    
    hoja.setFrozenRows(1);
    hoja.setFrozenColumns(1);
  }
  
  return resultado;
}

/**
 * Crea o actualiza la hoja de Ejecuciones
 */
function crearHojaEjecuciones(spreadsheet, resultado) {
  var nombreHoja = 'Ejecuciones';
  var hoja = spreadsheet.getSheetByName(nombreHoja);
  
  if (hoja === null) {
    hoja = spreadsheet.insertSheet(nombreHoja);
    resultado.hojasCreadas.push(nombreHoja);
  } else {
    resultado.hojasActualizadas.push(nombreHoja);
  }
  
  // Headers
  var headers = [
    'ID',
    'CasoID',
    'CasoTitulo',
    'FechaEjecucion',
    'EjecutadoPor',
    'Resultado',
    'Observaciones',
    'Ambiente',
    'Navegador',
    'TiempoEjecucion',
    'EvidenciaURL',
    'BugGenerado',
    'BugID'
  ];
  
  // Escribir headers solo si esta vacia
  if (hoja.getLastRow() === 0) {
    hoja.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Formato
    hoja.getRange(1, 1, 1, headers.length)
      .setBackground('#0f172a')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    
    hoja.setFrozenRows(1);
  }
  
  return resultado;
}

/**
 * Crea o actualiza la hoja de Regresiones
 */
function crearHojaRegresiones(spreadsheet, resultado) {
  var nombreHoja = 'Regresiones';
  var hoja = spreadsheet.getSheetByName(nombreHoja);
  
  if (hoja === null) {
    hoja = spreadsheet.insertSheet(nombreHoja);
    resultado.hojasCreadas.push(nombreHoja);
  } else {
    resultado.hojasActualizadas.push(nombreHoja);
  }
  
  // Headers
  var headers = [
    'ID',
    'Nombre',
    'Descripcion',
    'FechaCreacion',
    'CreadoPor',
    'CasosIncluidos',
    'TotalCasos',
    'Estado',
    'UltimaEjecucion',
    'ResultadoUltimaEjecucion',
    'Notas'
  ];
  
  // Escribir headers solo si esta vacia
  if (hoja.getLastRow() === 0) {
    hoja.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Formato
    hoja.getRange(1, 1, 1, headers.length)
      .setBackground('#0f172a')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    
    hoja.setColumnWidth(1, 100);
    hoja.setColumnWidth(2, 300);
    hoja.setColumnWidth(3, 400);
    
    hoja.setFrozenRows(1);
  }
  
  return resultado;
}

/**
 * Elimina la hoja por defecto "Hoja 1" si existe y está vacía
 */
function eliminarHojaPorDefecto(spreadsheet) {
  try {
    var hojaDefault = spreadsheet.getSheetByName('Hoja 1');
    
    if (hojaDefault !== null && hojaDefault.getLastRow() <= 1) {
      // Solo eliminar si hay mas de una hoja
      if (spreadsheet.getSheets().length > 1) {
        spreadsheet.deleteSheet(hojaDefault);
        Logger.log('Hoja por defecto eliminada');
      }
    }
  } catch (error) {
    Logger.log('No se pudo eliminar hoja por defecto: ' + error.toString());
  }
}

/**
 * ERROR 5 FIX: Valida si ya existe un workspace con ese nombre (case insensitive)
 * @param {string} nombreWorkspace - Nombre a validar
 * @returns {boolean} true si ya existe
 */
function existeWorkspaceConNombre(nombreWorkspace) {
  try {
    var nombreNormalizado = nombreWorkspace.toLowerCase().trim();
    
    // Buscar en Drive todos los Spreadsheets
    var files = DriveApp.getFilesByType(MimeType.GOOGLE_SHEETS);
    
    while (files.hasNext()) {
      var file = files.next();
      var nombreExistente = file.getName().toLowerCase().trim();
      
      if (nombreExistente === nombreNormalizado) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    Logger.log('Error verificando nombres: ' + error.toString());
    return false;
  }
}

/**
 * ERROR 5 FIX: Genera un nombre único si ya existe
 * @param {string} nombreBase - Nombre base deseado
 * @returns {string} Nombre único
 */
function generarNombreUnico(nombreBase) {
  var contador = 1;
  var nombreFinal = nombreBase;
  
  while (existeWorkspaceConNombre(nombreFinal)) {
    contador++;
    nombreFinal = nombreBase + ' (' + contador + ')';
  }
  
  return nombreFinal;
}

/**
 * Crea un nuevo Google Sheet con configuración completa
 * @param {string} nombreWorkspace - Nombre del workspace
 * @returns {Object} URL y detalles del nuevo Sheet
 */
function crearNuevoWorkspace(nombreWorkspace) {
  try {
    Logger.log('Creando nuevo workspace: ' + nombreWorkspace);
    
    // ERROR 5 FIX: Validar y ajustar nombre si es necesario
    var nombreFinal = nombreWorkspace || 'QA Workspace';
    
    // Verificar si el nombre ya existe
    if (existeWorkspaceConNombre(nombreFinal)) {
      nombreFinal = generarNombreUnico(nombreFinal);
      Logger.log('Nombre ajustado para evitar duplicado: ' + nombreFinal);
    }
    
    // Crear nuevo spreadsheet
    var nuevoSheet = SpreadsheetApp.create(nombreFinal);
    var sheetUrl = nuevoSheet.getUrl();
    
    Logger.log('Nuevo Sheet creado: ' + sheetUrl);
    
    // Configurar el workspace
    var resultadoConfig = configurarWorkspace(sheetUrl);
    
    if (resultadoConfig.success) {
      return {
        success: true,
        sheetUrl: sheetUrl,
        nombreSheet: nuevoSheet.getName(),
        nombreOriginal: nombreWorkspace,
        nombreFinal: nombreFinal,
        fueRenombrado: nombreWorkspace !== nombreFinal,
        mensaje: nombreWorkspace !== nombreFinal 
          ? 'Workspace creado como "' + nombreFinal + '" (el nombre original ya existía)'
          : 'Workspace creado y configurado exitosamente',
        detalles: resultadoConfig
      };
    } else {
      return {
        success: false,
        error: 'Sheet creado pero fallo la configuracion: ' + resultadoConfig.error
      };
    }
    
  } catch (error) {
    Logger.log('Error creando workspace: ' + error.toString());
    return {
      success: false,
      error: 'Error al crear workspace: ' + error.message
    };
  }
}

/**
 * Obtiene información de configuración del workspace
 * @param {string} sheetUrl - URL del Sheet
 * @returns {Object} Datos de configuración
 */
function obtenerConfigWorkspace(sheetUrl) {
  try {
    var spreadsheet = SpreadsheetApp.openByUrl(sheetUrl);
    var hojaConfig = spreadsheet.getSheetByName('Config');
    
    if (hojaConfig === null) {
      return {
        success: false,
        error: 'No se encontro la hoja Config'
      };
    }
    
    var datos = hojaConfig.getDataRange().getValues();
    var config = {};
    
    // Convertir datos a objeto
    for (var i = 1; i < datos.length; i++) {
      config[datos[i][0]] = datos[i][1];
    }
    
    return {
      success: true,
      config: config,
      nombreWorkspace: spreadsheet.getName()
    };
    
  } catch (error) {
    return {
      success: false,
      error: 'Error obteniendo config: ' + error.message
    };
  }
}
