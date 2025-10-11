// ===================================================================
// BACKEND_SERVICES_CASOS.GS
// Servicio para gestión de casos de prueba
// VERSIÓN MEJORADA: Con mejor manejo de errores y logging
// ===================================================================

/**
 * Lista casos de prueba con filtros opcionales
 * MEJORADO: Mejor manejo de errores y logging
 * @param {string} sheetUrl - URL del Google Sheet
 * @param {Object} filtros - Objeto con filtros (opcional)
 *        - excluirRegresiones: boolean para excluir hoja "Regresiones"
 *        - busqueda: string para buscar en título/descripción
 *        - hoja: string para filtrar por hoja específica
 *        - prioridad: string para filtrar por prioridad
 *        - estado: string para filtrar por estado
 *        - soloFlujoCritico: boolean
 *        - soloCandidatosRegresion: boolean
 * @returns {Object} Lista de casos
 */
function listarCasos(sheetUrl, filtros) {

  if (!sheetUrl || sheetUrl === '' || sheetUrl === null || sheetUrl === undefined) {
    Logger.log('❌ CRITICAL: sheetUrl es inválida');
    return {
      success: false,
      mensaje: 'URL del Sheet no proporcionada',
      error: 'sheetUrl is null, undefined or empty'
    };
  }
  try {
    // AGREGAR: Log de entrada para debug
    Logger.log('=== INICIO listarCasos ===');
    Logger.log('URL recibida: ' + sheetUrl);
    Logger.log('Filtros recibidos: ' + JSON.stringify(filtros));
    
    // VALIDACIÓN: Verificar que sheetUrl no sea null o undefined
    if (!sheetUrl || sheetUrl === '') {
      Logger.log('ERROR: sheetUrl está vacía o es null');
      return {
        success: false,
        mensaje: 'URL del Sheet no proporcionada'
      };
    }
    
    // INTENTAR abrir el spreadsheet
    var spreadsheet;
    try {
      spreadsheet = SpreadsheetApp.openByUrl(sheetUrl);
      Logger.log('✅ Spreadsheet abierto correctamente: ' + spreadsheet.getName());
    } catch (errorSpreadsheet) {
      Logger.log('ERROR al abrir spreadsheet: ' + errorSpreadsheet.toString());
      return {
        success: false,
        mensaje: 'No se pudo abrir el Google Sheet. Verifica la URL y los permisos.'
      };
    }
    
    var todosCasos = [];
    
    // CAMBIO: Si excluirRegresiones es true, obtener casos de todas las hojas excepto Regresiones
    if (filtros && filtros.excluirRegresiones) {
      
      Logger.log('Modo: Cargar TODOS los casos (excepto Regresiones)');
      
      // Obtener todas las hojas del spreadsheet
      var todasLasHojas = spreadsheet.getSheets();
      Logger.log('Total de hojas en el Sheet: ' + todasLasHojas.length);
      
      // Hojas del sistema que no deben incluirse en la búsqueda de casos
      var hojasExcluidas = ['Config', 'Bugs', 'Ejecuciones', 'Regresiones'];
      
      todasLasHojas.forEach(function(hoja) {
        var nombreHoja = hoja.getName();
        
        // Si no es una hoja excluida, buscar casos
        if (hojasExcluidas.indexOf(nombreHoja) === -1) {
          Logger.log('Revisando hoja: ' + nombreHoja);
          
          var datos = hoja.getDataRange().getValues();
          
          // Verificar que tenga datos y headers correctos
          if (datos.length > 1) {
            var headers = datos[0];
            
            // Verificar que sea una hoja de casos (tiene columna ID)
            var indexID = headers.indexOf('ID');
            if (indexID > -1) {
              Logger.log('✅ Hoja de casos detectada: ' + nombreHoja + ' (tiene ' + (datos.length - 1) + ' filas)');
              
              // Convertir filas a objetos
              for (var i = 1; i < datos.length; i++) {
                var caso = {};
                for (var j = 0; j < headers.length; j++) {
                  caso[headers[j]] = datos[i][j];
                }
                
                // Si no tiene hoja especificada, usar el nombre de la hoja actual
                if (!caso.Hoja || caso.Hoja === '') {
                  caso.Hoja = nombreHoja;
                }
                
                // Solo agregar si tiene ID válido
                if (caso.ID && caso.ID !== '') {
                  todosCasos.push(caso);
                }
              }
            } else {
              Logger.log('ℹ️ Hoja "' + nombreHoja + '" ignorada (no tiene columna ID)');
            }
          } else {
            Logger.log('ℹ️ Hoja "' + nombreHoja + '" está vacía');
          }
        } else {
          Logger.log('⏭️ Hoja "' + nombreHoja + '" excluida (hoja del sistema)');
        }
      });
      
      Logger.log('📊 Total de casos encontrados: ' + todosCasos.length);
      
    } else {
      // Comportamiento original: solo de hoja Casos
      Logger.log('Modo: Cargar solo desde hoja "Casos"');
      
      var hojaCasos = spreadsheet.getSheetByName('Casos');
      
      if (hojaCasos === null) {
        Logger.log('ERROR: No existe la hoja "Casos"');
        return {
          success: false,
          mensaje: 'No se encontró la hoja de Casos'
        };
      }
      
      var datos = hojaCasos.getDataRange().getValues();
      
      if (datos.length <= 1) {
        Logger.log('La hoja Casos está vacía (solo headers)');
        return {
          success: true,
          data: {
            casos: [],
            total: 0
          },
          mensaje: 'No hay casos creados'
        };
      }
      
      var headers = datos[0];
      
      // Convertir filas a objetos
      for (var i = 1; i < datos.length; i++) {
        var caso = {};
        for (var j = 0; j < headers.length; j++) {
          caso[headers[j]] = datos[i][j];
        }
        todosCasos.push(caso);
      }
      
      Logger.log('Casos encontrados en hoja "Casos": ' + todosCasos.length);
    }
    
    // Aplicar filtros adicionales si existen
    if (filtros) {
      var casosAntesFiltros = todosCasos.length;
      todosCasos = aplicarFiltrosCasos(todosCasos, filtros);
      Logger.log('Casos después de filtros: ' + todosCasos.length + ' (antes: ' + casosAntesFiltros + ')');
    }
    
    Logger.log('=== FIN listarCasos - ÉXITO ===');
    
    return {
      success: true,
      data: {
        casos: todosCasos,
        total: todosCasos.length
      }
    };
    
  } catch (error) {
    Logger.log('=== ERROR CRÍTICO en listarCasos ===');
    Logger.log('Tipo de error: ' + error.name);
    Logger.log('Mensaje: ' + error.message);
    Logger.log('Stack: ' + error.stack);
    
    return {
      success: false,
      mensaje: 'Error al listar casos: ' + error.message,
      detalles: error.toString()
    };
  }
}

/**
 * Aplica filtros a la lista de casos
 * @param {Array} casos - Array de casos
 * @param {Object} filtros - Objeto con filtros
 * @returns {Array} Casos filtrados
 */
function aplicarFiltrosCasos(casos, filtros) {
  var resultado = casos;
  
  // Filtro por búsqueda en título
  if (filtros.busqueda && filtros.busqueda !== '') {
    var busqueda = filtros.busqueda.toLowerCase();
    resultado = resultado.filter(function(caso) {
      var titulo = (caso.Titulo || '').toLowerCase();
      var descripcion = (caso.Descripcion || '').toLowerCase();
      return titulo.indexOf(busqueda) > -1 || descripcion.indexOf(busqueda) > -1;
    });
  }
  
  // Filtro por hoja
  if (filtros.hoja && filtros.hoja !== 'Todas') {
    resultado = resultado.filter(function(caso) {
      return caso.Hoja === filtros.hoja;
    });
  }
  
  // Filtro por prioridad
  if (filtros.prioridad && filtros.prioridad !== 'Todas') {
    resultado = resultado.filter(function(caso) {
      return caso.Prioridad === filtros.prioridad;
    });
  }
  
  // Filtro por estado
  if (filtros.estado && filtros.estado !== 'Todos') {
    resultado = resultado.filter(function(caso) {
      return caso.Estado === filtros.estado;
    });
  }
  
  // Filtro solo flujos críticos
  if (filtros.soloFlujoCritico === true) {
    resultado = resultado.filter(function(caso) {
      return caso.FlujoCritico === 'Si' || caso.FlujoCritico === 'Sí';
    });
  }
  
  // Filtro solo candidatos a regresión
  if (filtros.soloCandidatosRegresion === true) {
    resultado = resultado.filter(function(caso) {
      return caso.CandidatoRegresion === 'Si' || caso.CandidatoRegresion === 'Sí';
    });
  }
  
  return resultado;
}

/**
 * Crea un nuevo caso de prueba
 * @param {Object} datosCaso - Objeto con datos del caso
 * @returns {Object} Resultado de la operación
 */
function crearCaso(datosCaso) {
  try {
    Logger.log('Creando caso: ' + datosCaso.titulo);
    
    var spreadsheet = SpreadsheetApp.openByUrl(datosCaso.sheetUrl);
    var hojaConfig = spreadsheet.getSheetByName('Config');
    
    // Determinar en qué hoja guardar
    var nombreHojaDestino = datosCaso.hoja || 'Casos';
    var hojaCasos = spreadsheet.getSheetByName(nombreHojaDestino);
    
    // Si la hoja no existe, usar "Casos" como fallback
    if (hojaCasos === null) {
      Logger.log('Hoja ' + nombreHojaDestino + ' no existe, usando Casos por defecto');
      nombreHojaDestino = 'Casos';
      hojaCasos = spreadsheet.getSheetByName('Casos');
    }
    
    if (hojaCasos === null) {
      return {
        success: false,
        mensaje: 'No se encontró la hoja de Casos'
      };
    }
    
    // Generar ID según la hoja donde se guardará
    var nuevoId = generarIdCaso(hojaConfig, nombreHojaDestino);
    
    // Generar URI único
    var casoURI = generarCasoURI(spreadsheet.getId(), nuevoId);
    
    // Obtener email del usuario
    var usuario = Session.getActiveUser().getEmail();
    
    // Preparar datos según formato
    var fila = [
      nuevoId,                                    // ID
      datosCaso.hoja,                             // Hoja
      datosCaso.titulo,                           // Titulo
      datosCaso.descripcion,                      // Descripcion
      datosCaso.formatoCaso,                      // Formato
      datosCaso.prioridad,                        // Prioridad
      datosCaso.tipoPrueba || 'Funcional',        // TipoPrueba
      datosCaso.pasos || '',                      // Pasos (Clasico)
      datosCaso.resultadoEsperado || '',          // ResultadoEsperado (Clasico)
      datosCaso.scenarioGiven || '',              // ScenarioGiven (Gherkin)
      datosCaso.scenarioWhen || '',               // ScenarioWhen (Gherkin)
      datosCaso.scenarioThen || '',               // ScenarioThen (Gherkin)
      datosCaso.precondiciones || '',             // Precondiciones
      datosCaso.flujoCritico ? 'Si' : 'No',       // FlujoCritico
      datosCaso.candidatoRegresion ? 'Si' : 'No', // CandidatoRegresion
      'Pendiente',                                // Estado
      new Date(),                                 // FechaCreacion
      usuario,                                    // CreadoPor
      '',                                         // FechaUltimaEjecucion
      '',                                         // ResultadoUltimaEjecucion
      '',                                         // LinkTrelloHU
      '',                                         // LinkBugRelacionado
      casoURI,                                    // CasoURI
      ''                                          // Notas
    ];
    
    // Agregar fila al final
    hojaCasos.appendRow(fila);
    
    Logger.log('Caso creado exitosamente: ' + nuevoId);
    
    return {
      success: true,
      data: {
        idCaso: nuevoId,
        hoja: nombreHojaDestino,
        titulo: datosCaso.titulo
      },
      mensaje: 'Caso creado exitosamente'
    };
    
  } catch (error) {
    Logger.log('Error creando caso: ' + error.toString());
    return {
      success: false,
      mensaje: 'Error al crear caso: ' + error.message
    };
  }
}

/**
 * Genera un ID único para el caso según la hoja
 * @param {Sheet} hojaConfig - Hoja de configuración
 * @param {string} nombreHoja - Nombre de la hoja donde se guardará el caso
 * @returns {string} ID del caso
 */
function generarIdCaso(hojaConfig, nombreHoja) {
  try {
    var datos = hojaConfig.getDataRange().getValues();
    var claveContador = 'ultimo_caso_id_' + nombreHoja;
    var ultimoId = 0;
    var filaContador = -1;
    
    // Buscar contador específico de esta hoja
    for (var i = 1; i < datos.length; i++) {
      if (datos[i][0] === claveContador) {
        ultimoId = parseInt(datos[i][1]) || 0;
        filaContador = i + 1;
        break;
      }
    }
    
    // Si no existe contador para esta hoja, crearlo
    if (filaContador === -1) {
      hojaConfig.appendRow([claveContador, 1, 'Contador de casos para hoja ' + nombreHoja]);
      ultimoId = 0;
    } else {
      // Actualizar contador existente
      hojaConfig.getRange(filaContador, 2).setValue(ultimoId + 1);
    }
    
    var nuevoNumero = ultimoId + 1;
    
    // Generar prefijo según el nombre de la hoja
    var prefijo = obtenerPrefijoHoja(nombreHoja);
    
    return prefijo + '-TC-' + nuevoNumero;
    
  } catch (error) {
    Logger.log('Error generando ID: ' + error.toString());
    // Fallback: usar timestamp
    return 'TC-' + new Date().getTime();
  }
}

/**
 * Obtiene prefijo de la hoja para los IDs
 * @param {string} nombreHoja - Nombre de la hoja
 * @returns {string} Prefijo en mayúsculas
 */
function obtenerPrefijoHoja(nombreHoja) {
  if (!nombreHoja || nombreHoja === 'Casos') {
    return 'QA';
  }
  
  // Convertir a mayúsculas y quitar espacios
  var prefijo = nombreHoja.toUpperCase().replace(/\s+/g, '');
  
  // Limitar a 10 caracteres
  if (prefijo.length > 10) {
    prefijo = prefijo.substring(0, 10);
  }
  
  return prefijo;
}

/**
 * Genera URI único para el caso
 * @param {string} spreadsheetId - ID del spreadsheet
 * @param {string} casoId - ID del caso
 * @returns {string} URI del caso
 */
function generarCasoURI(spreadsheetId, casoId) {
  return spreadsheetId + '/' + casoId;
}

/**
 * Obtiene lista de hojas disponibles en el Sheet
 * @param {string} sheetUrl - URL del Google Sheet
 * @returns {Object} Lista de hojas
 */
function obtenerHojasDisponibles(sheetUrl) {
  try {
    var spreadsheet = SpreadsheetApp.openByUrl(sheetUrl);
    var todasHojas = spreadsheet.getSheets();
    
    // Filtrar hojas del sistema
    var hojasExcluidas = ['Config', 'Casos', 'Bugs', 'Ejecuciones', 'Regresiones'];
    var hojasDisponibles = [];
    
    todasHojas.forEach(function(hoja) {
      var nombre = hoja.getName();
      if (hojasExcluidas.indexOf(nombre) === -1) {
        hojasDisponibles.push(nombre);
      }
    });
    
    return {
      success: true,
      data: {
        hojas: hojasDisponibles
      }
    };
    
  } catch (error) {
    Logger.log('Error obteniendo hojas: ' + error.toString());
    return {
      success: false,
      mensaje: 'Error al obtener hojas: ' + error.message
    };
  }
}

/**
 * Obtiene detalle completo de un caso
 * @param {string} sheetUrl - URL del Sheet
 * @param {string} casoId - ID del caso
 * @returns {Object} Datos del caso
 */
function obtenerDetalleCaso(sheetUrl, casoId) {
  try {
    Logger.log('Obteniendo detalle de caso: ' + casoId);
    
    var spreadsheet = SpreadsheetApp.openByUrl(sheetUrl);
    var hojaCasos = spreadsheet.getSheetByName('Casos');
    
    if (hojaCasos === null) {
      return {
        success: false,
        mensaje: 'No se encontró la hoja de Casos'
      };
    }
    
    var datos = hojaCasos.getDataRange().getValues();
    var headers = datos[0];
    
    // Buscar caso por ID
    for (var i = 1; i < datos.length; i++) {
      if (datos[i][0] === casoId) {
        var caso = {};
        for (var j = 0; j < headers.length; j++) {
          caso[headers[j]] = datos[i][j];
        }
        
        return {
          success: true,
          data: caso
        };
      }
    }
    
    return {
      success: false,
      mensaje: 'Caso no encontrado'
    };
    
  } catch (error) {
    Logger.log('Error obteniendo caso: ' + error.toString());
    return {
      success: false,
      mensaje: 'Error al obtener caso: ' + error.message
    };
  }
}

/**
 * Actualiza un caso existente
 * @param {string} sheetUrl - URL del Sheet
 * @param {string} casoId - ID del caso
 * @param {Object} datosActualizados - Datos a actualizar
 * @returns {Object} Resultado
 */
function actualizarCaso(sheetUrl, casoId, datosActualizados) {
  try {
    Logger.log('Actualizando caso: ' + casoId);
    
    var spreadsheet = SpreadsheetApp.openByUrl(sheetUrl);
    var hojaCasos = spreadsheet.getSheetByName('Casos');
    
    if (hojaCasos === null) {
      return {
        success: false,
        mensaje: 'No se encontró la hoja de Casos'
      };
    }
    
    var datos = hojaCasos.getDataRange().getValues();
    var headers = datos[0];
    
    // Buscar fila del caso
    for (var i = 1; i < datos.length; i++) {
      if (datos[i][0] === casoId) {
        
        // Actualizar campos modificados
        for (var campo in datosActualizados) {
          var colIndex = headers.indexOf(campo);
          if (colIndex > -1) {
            hojaCasos.getRange(i + 1, colIndex + 1).setValue(datosActualizados[campo]);
          }
        }
        
        return {
          success: true,
          mensaje: 'Caso actualizado exitosamente'
        };
      }
    }
    
    return {
      success: false,
      mensaje: 'Caso no encontrado'
    };
    
  } catch (error) {
    Logger.log('Error actualizando caso: ' + error.toString());
    return {
      success: false,
      mensaje: 'Error al actualizar caso: ' + error.message
    };
  }
}

/**
 * Elimina un caso (marca como eliminado, no borra físicamente)
 * @param {string} sheetUrl - URL del Sheet
 * @param {string} casoId - ID del caso
 * @returns {Object} Resultado
 */
function eliminarCaso(sheetUrl, casoId) {
  try {
    Logger.log('Eliminando caso: ' + casoId);
    
    // Por ahora, marcar estado como "Eliminado"
    return actualizarCaso(sheetUrl, casoId, {
      Estado: 'Eliminado',
      Notas: 'Eliminado el ' + new Date().toISOString()
    });
    
  } catch (error) {
    Logger.log('Error eliminando caso: ' + error.toString());
    return {
      success: false,
      mensaje: 'Error al eliminar caso: ' + error.message
    };
  }
}

/**
 * Crea una nueva hoja (sheet/tab) con estructura de casos
 * @param {string} sheetUrl - URL del Google Sheet
 * @param {string} nombreHoja - Nombre de la nueva hoja
 * @returns {Object} Resultado de la operación
 */
function crearNuevaHoja(sheetUrl, nombreHoja) {
  try {
    Logger.log('Creando nueva hoja: ' + nombreHoja);
    
    var spreadsheet = SpreadsheetApp.openByUrl(sheetUrl);
    
    // Verificar que no exista ya
    var hojaExistente = spreadsheet.getSheetByName(nombreHoja);
    if (hojaExistente !== null) {
      return {
        success: false,
        mensaje: 'Ya existe una hoja con ese nombre'
      };
    }
    
    // Crear nueva hoja
    var nuevaHoja = spreadsheet.insertSheet(nombreHoja);
    
    // Headers iguales a la hoja Casos
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
    
    // Escribir headers
    nuevaHoja.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Formato
    nuevaHoja.getRange(1, 1, 1, headers.length)
      .setBackground('#0f172a')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    
    // Anchos de columna
    nuevaHoja.setColumnWidth(1, 100);  // ID
    nuevaHoja.setColumnWidth(2, 150);  // Hoja
    nuevaHoja.setColumnWidth(3, 300);  // Titulo
    nuevaHoja.setColumnWidth(4, 400);  // Descripcion
    
    nuevaHoja.setFrozenRows(1);
    nuevaHoja.setFrozenColumns(1);
    
    Logger.log('Hoja creada exitosamente con headers: ' + nombreHoja);
    
    return {
      success: true,
      data: {
        nombreHoja: nombreHoja
      },
      mensaje: 'Hoja creada exitosamente'
    };
    
  } catch (error) {
    Logger.log('Error creando hoja: ' + error.toString());
    return {
      success: false,
      mensaje: 'Error al crear hoja: ' + error.message
    };
  }
}

/**
 * Función de TEST para verificar listarCasos desde Apps Script
 */
function testListarCasos() {
  // ⚠️ IMPORTANTE: Cambia esta URL por la de TU Google Sheet
  var url = "https://docs.google.com/spreadsheets/d/1mrB6k8ZnUxwNedc67GHA9h9ECAYv-XKHXVWgd5qzhCg/edit?gid=1755706280#gid=1755706280";
  
  Logger.log("=== TEST DE LISTAR CASOS ===");
  Logger.log("Probando con URL: " + url);
  
  try {
    var resultado = listarCasos(url, { excluirRegresiones: true });
    Logger.log("✅ RESULTADO: " + JSON.stringify(resultado, null, 2));
    
    if (resultado.success) {
      Logger.log("✅ TEST EXITOSO - Casos encontrados: " + resultado.data.total);
    } else {
      Logger.log("❌ TEST FALLÓ - Mensaje: " + resultado.mensaje);
    }
    
  } catch (error) {
    Logger.log("💥 ERROR EN TEST: " + error.toString());
    Logger.log("Stack: " + error.stack);
  }
  
  Logger.log("=== FIN TEST ===");
}
