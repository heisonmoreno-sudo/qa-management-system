// ===================================================================
// BACKEND_SERVICES_CASOS.GS
// Servicio para gestión de casos de prueba
// VERSIÓN CORREGIDA: Con serialización de objetos para el frontend
// ===================================================================

/**
 * Lista casos de prueba con filtros opcionales
 * @param {string} sheetUrl - URL del Google Sheet
 * @param {Object} filtros - Objeto con filtros (opcional)
 * @returns {Object} Lista de casos
 */
function listarCasos(sheetUrl, filtros) {
  // LOGS INICIALES PARA DEBUG
  Logger.log('════════════════════════════════════');
  Logger.log('🔵 listarCasos EJECUTÁNDOSE');
  Logger.log('🔵 URL recibida: ' + sheetUrl);
  Logger.log('🔵 Tipo de sheetUrl: ' + typeof sheetUrl);
  Logger.log('🔵 Filtros: ' + JSON.stringify(filtros));
  Logger.log('════════════════════════════════════');
  
  // VALIDACIÓN CRÍTICA PRIMERO
  if (!sheetUrl || sheetUrl === '' || sheetUrl === null || sheetUrl === undefined) {
    Logger.log('❌ CRITICAL: sheetUrl es inválida');
    return {
      success: false,
      mensaje: 'URL del Sheet no proporcionada',
      error: 'sheetUrl is null, undefined or empty'
    };
  }
  
  try {
    Logger.log('=== INICIO listarCasos ===');
    Logger.log('URL recibida: ' + sheetUrl);
    Logger.log('Filtros recibidos: ' + JSON.stringify(filtros));
    
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
    
    // Si excluirRegresiones es true, obtener casos de todas las hojas excepto Regresiones
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
                  var valor = datos[i][j];
                  
                  // CRÍTICO: Convertir Dates a strings para serialización
                  if (valor instanceof Date) {
                    caso[headers[j]] = valor.toISOString();
                  } else {
                    caso[headers[j]] = valor;
                  }
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
          var valor = datos[i][j];
          
          // CRÍTICO: Convertir Dates a strings
          if (valor instanceof Date) {
            caso[headers[j]] = valor.toISOString();
          } else {
            caso[headers[j]] = valor;
          }
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
    
    // CRÍTICO: Crear objeto limpio y serializable
    var resultado = {
      success: true,
      data: {
        casos: todosCasos,
        total: todosCasos.length
      }
    };
    
    // Serializar y deserializar para limpiar objetos complejos
    try {
      var resultadoLimpio = JSON.parse(JSON.stringify(resultado));
      Logger.log('📤 Retornando al frontend: ' + resultadoLimpio.data.total + ' casos');
      return resultadoLimpio;
    } catch (errorSerializacion) {
      Logger.log('⚠️ Error en serialización, retornando objeto simple');
      return {
        success: true,
        data: {
          casos: todosCasos,
          total: todosCasos.length
        }
      };
    }
    
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
 */
function aplicarFiltrosCasos(casos, filtros) {
  var resultado = casos;
  
  if (filtros.busqueda && filtros.busqueda !== '') {
    var busqueda = filtros.busqueda.toLowerCase();
    resultado = resultado.filter(function(caso) {
      var titulo = (caso.Titulo || '').toLowerCase();
      var descripcion = (caso.Descripcion || '').toLowerCase();
      return titulo.indexOf(busqueda) > -1 || descripcion.indexOf(busqueda) > -1;
    });
  }
  
  if (filtros.hoja && filtros.hoja !== 'Todas') {
    resultado = resultado.filter(function(caso) {
      return caso.Hoja === filtros.hoja;
    });
  }
  
  if (filtros.prioridad && filtros.prioridad !== 'Todas') {
    resultado = resultado.filter(function(caso) {
      return caso.Prioridad === filtros.prioridad;
    });
  }
  
  if (filtros.estado && filtros.estado !== 'Todos') {
    resultado = resultado.filter(function(caso) {
      return caso.Estado === filtros.estado;
    });
  }
  
  if (filtros.soloFlujoCritico === true) {
    resultado = resultado.filter(function(caso) {
      return caso.FlujoCritico === 'Si' || caso.FlujoCritico === 'Sí';
    });
  }
  
  if (filtros.soloCandidatosRegresion === true) {
    resultado = resultado.filter(function(caso) {
      return caso.CandidatoRegresion === 'Si' || caso.CandidatoRegresion === 'Sí';
    });
  }
  
  return resultado;
}

/**
 * Crea un nuevo caso de prueba
 */
function crearCaso(datosCaso) {
  try {
    Logger.log('Creando caso: ' + datosCaso.titulo);
    
    var spreadsheet = SpreadsheetApp.openByUrl(datosCaso.sheetUrl);
    var hojaConfig = spreadsheet.getSheetByName('Config');
    
    var nombreHojaDestino = datosCaso.hoja || 'Casos';
    var hojaCasos = spreadsheet.getSheetByName(nombreHojaDestino);
    
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
    
    var nuevoId = generarIdCaso(hojaConfig, nombreHojaDestino);
    var casoURI = generarCasoURI(spreadsheet.getId(), nuevoId);
    var usuario = Session.getActiveUser().getEmail();
    
    var fila = [
      nuevoId,
      datosCaso.hoja,
      datosCaso.titulo,
      datosCaso.descripcion,
      datosCaso.formatoCaso,
      datosCaso.prioridad,
      datosCaso.tipoPrueba || 'Funcional',
      datosCaso.pasos || '',
      datosCaso.resultadoEsperado || '',
      datosCaso.scenarioGiven || '',
      datosCaso.scenarioWhen || '',
      datosCaso.scenarioThen || '',
      datosCaso.precondiciones || '',
      datosCaso.flujoCritico ? 'Si' : 'No',
      datosCaso.candidatoRegresion ? 'Si' : 'No',
      'Pendiente',
      new Date(),
      usuario,
      '',
      '',
      '',
      '',
      casoURI,
      ''
    ];
    
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
 */
function generarIdCaso(hojaConfig, nombreHoja) {
  try {
    var datos = hojaConfig.getDataRange().getValues();
    var claveContador = 'ultimo_caso_id_' + nombreHoja;
    var ultimoId = 0;
    var filaContador = -1;
    
    for (var i = 1; i < datos.length; i++) {
      if (datos[i][0] === claveContador) {
        ultimoId = parseInt(datos[i][1]) || 0;
        filaContador = i + 1;
        break;
      }
    }
    
    if (filaContador === -1) {
      hojaConfig.appendRow([claveContador, 1, 'Contador de casos para hoja ' + nombreHoja]);
      ultimoId = 0;
    } else {
      hojaConfig.getRange(filaContador, 2).setValue(ultimoId + 1);
    }
    
    var nuevoNumero = ultimoId + 1;
    var prefijo = obtenerPrefijoHoja(nombreHoja);
    
    return prefijo + '-TC-' + nuevoNumero;
    
  } catch (error) {
    Logger.log('Error generando ID: ' + error.toString());
    return 'TC-' + new Date().getTime();
  }
}

/**
 * Obtiene prefijo de la hoja para los IDs
 */
function obtenerPrefijoHoja(nombreHoja) {
  if (!nombreHoja || nombreHoja === 'Casos') {
    return 'QA';
  }
  
  var prefijo = nombreHoja.toUpperCase().replace(/\s+/g, '');
  
  if (prefijo.length > 10) {
    prefijo = prefijo.substring(0, 10);
  }
  
  return prefijo;
}

/**
 * Genera URI único para el caso
 */
function generarCasoURI(spreadsheetId, casoId) {
  return spreadsheetId + '/' + casoId;
}

/**
 * Obtiene lista de hojas disponibles en el Sheet
 */
function obtenerHojasDisponibles(sheetUrl) {
  try {
    var spreadsheet = SpreadsheetApp.openByUrl(sheetUrl);
    var todasHojas = spreadsheet.getSheets();
    
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
    
    for (var i = 1; i < datos.length; i++) {
      if (datos[i][0] === casoId) {
        
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
 * Elimina un caso
 */
function eliminarCaso(sheetUrl, casoId) {
  try {
    Logger.log('Eliminando caso: ' + casoId);
    
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
 * Crea una nueva hoja con estructura de casos
 */
function crearNuevaHoja(sheetUrl, nombreHoja) {
  try {
    Logger.log('Creando nueva hoja: ' + nombreHoja);
    
    var spreadsheet = SpreadsheetApp.openByUrl(sheetUrl);
    
    var hojaExistente = spreadsheet.getSheetByName(nombreHoja);
    if (hojaExistente !== null) {
      return {
        success: false,
        mensaje: 'Ya existe una hoja con ese nombre'
      };
    }
    
    var nuevaHoja = spreadsheet.insertSheet(nombreHoja);
    
    var headers = [
      'ID', 'Hoja', 'Titulo', 'Descripcion', 'Formato', 'Prioridad',
      'TipoPrueba', 'Pasos', 'ResultadoEsperado', 'ScenarioGiven',
      'ScenarioWhen', 'ScenarioThen', 'Precondiciones', 'FlujoCritico',
      'CandidatoRegresion', 'Estado', 'FechaCreacion', 'CreadoPor',
      'FechaUltimaEjecucion', 'ResultadoUltimaEjecucion', 'LinkTrelloHU',
      'LinkBugRelacionado', 'CasoURI', 'Notas'
    ];
    
    nuevaHoja.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    nuevaHoja.getRange(1, 1, 1, headers.length)
      .setBackground('#0f172a')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    
    nuevaHoja.setColumnWidth(1, 100);
    nuevaHoja.setColumnWidth(2, 150);
    nuevaHoja.setColumnWidth(3, 300);
    nuevaHoja.setColumnWidth(4, 400);
    
    nuevaHoja.setFrozenRows(1);
    nuevaHoja.setFrozenColumns(1);
    
    Logger.log('Hoja creada exitosamente: ' + nombreHoja);
    
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
 * Función de TEST
 */
function testListarCasos() {
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
