/ ===================================================================
// BACKEND_SERVICES_CASOS.GS
// Servicio para gestión de casos de prueba
// VERSIÓN 3.0: IDs simplificados + Mover casos entre hojas
// ===================================================================

/**
 * Lista casos de prueba con filtros opcionales
 */
function listarCasos(sheetUrl, filtros) {
  Logger.log('════════════════════════════════════');
  Logger.log('🔵 listarCasos EJECUTÁNDOSE');
  Logger.log('🔵 URL recibida: ' + sheetUrl);
  Logger.log('🔵 Filtros: ' + JSON.stringify(filtros));
  Logger.log('════════════════════════════════════');
  
  if (!sheetUrl || sheetUrl === '' || sheetUrl === null || sheetUrl === undefined) {
    Logger.log('❌ CRITICAL: sheetUrl es inválida');
    return {
      success: false,
      mensaje: 'URL del Sheet no proporcionada',
      error: 'sheetUrl is null, undefined or empty'
    };
  }
  
  try {
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
    
    if (filtros && filtros.excluirRegresiones) {
      Logger.log('Modo: Cargar TODOS los casos (excepto Regresiones)');
      
      var todasLasHojas = spreadsheet.getSheets();
      Logger.log('Total de hojas en el Sheet: ' + todasLasHojas.length);
      
      var hojasExcluidas = ['Config', 'Bugs', 'Ejecuciones', 'Regresiones'];
      
      todasLasHojas.forEach(function(hoja) {
        var nombreHoja = hoja.getName();
        
        if (hojasExcluidas.indexOf(nombreHoja) === -1) {
          Logger.log('Revisando hoja: ' + nombreHoja);
          
          var datos = hoja.getDataRange().getValues();
          
          if (datos.length > 1) {
            var headers = datos[0];
            var indexID = headers.indexOf('ID');
            
            if (indexID > -1) {
              Logger.log('✅ Hoja de casos detectada: ' + nombreHoja + ' (tiene ' + (datos.length - 1) + ' filas)');
              
              for (var i = 1; i < datos.length; i++) {
                var caso = {};
                for (var j = 0; j < headers.length; j++) {
                  var valor = datos[i][j];
                  
                  if (valor instanceof Date) {
                    caso[headers[j]] = valor.toISOString();
                  } else {
                    caso[headers[j]] = valor;
                  }
                }
                
                if (!caso.Hoja || caso.Hoja === '') {
                  caso.Hoja = nombreHoja;
                }
                
                if (caso.ID && caso.ID !== '') {
                  todosCasos.push(caso);
                }
              }
            }
          }
        }
      });
      
      Logger.log('📊 Total de casos encontrados: ' + todosCasos.length);
      
    } else {
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
      
      for (var i = 1; i < datos.length; i++) {
        var caso = {};
        for (var j = 0; j < headers.length; j++) {
          var valor = datos[i][j];
          
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
    
    // Excluir casos eliminados por defecto
    if (!filtros || !filtros.incluirEliminados) {
      var casosAntesExcluir = todosCasos.length;
      todosCasos = todosCasos.filter(function(caso) {
        return caso.Estado !== 'Eliminado';
      });
      Logger.log('Casos después de excluir eliminados: ' + todosCasos.length + ' (antes: ' + casosAntesExcluir + ')');
    }
    
    if (filtros) {
      var casosAntesFiltros = todosCasos.length;
      todosCasos = aplicarFiltrosCasos(todosCasos, filtros);
      Logger.log('Casos después de filtros: ' + todosCasos.length + ' (antes: ' + casosAntesFiltros + ')');
    }
    
    Logger.log('=== FIN listarCasos - ÉXITO ===');
    
    var resultado = {
      success: true,
      data: {
        casos: todosCasos,
        total: todosCasos.length
      }
    };
    
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
 * Obtiene detalle completo de un caso específico
 */
function obtenerDetalleCaso(sheetUrl, casoId) {
  try {
    Logger.log('🔍 Obteniendo detalle de caso: ' + casoId);
    
    var spreadsheet = SpreadsheetApp.openByUrl(sheetUrl);
    var hojasExcluidas = ['Config', 'Bugs', 'Ejecuciones', 'Regresiones'];
    var todasLasHojas = spreadsheet.getSheets();
    
    for (var h = 0; h < todasLasHojas.length; h++) {
      var hoja = todasLasHojas[h];
      var nombreHoja = hoja.getName();
      
      if (hojasExcluidas.indexOf(nombreHoja) > -1) {
        continue;
      }
      
      var datos = hoja.getDataRange().getValues();
      if (datos.length <= 1) continue;
      
      var headers = datos[0];
      var indexID = headers.indexOf('ID');
      
      if (indexID === -1) continue;
      
      for (var i = 1; i < datos.length; i++) {
        if (datos[i][indexID] === casoId) {
          var caso = {};
          for (var j = 0; j < headers.length; j++) {
            var valor = datos[i][j];
            
            if (valor instanceof Date) {
              caso[headers[j]] = valor.toISOString();
            } else {
              caso[headers[j]] = valor;
            }
          }
          
          Logger.log('✅ Caso encontrado en hoja: ' + nombreHoja);
          
          return {
            success: true,
            data: caso
          };
        }
      }
    }
    
    Logger.log('❌ Caso no encontrado: ' + casoId);
    return {
      success: false,
      mensaje: 'Caso no encontrado'
    };
    
  } catch (error) {
    Logger.log('❌ Error obteniendo caso: ' + error.toString());
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
    Logger.log('✏️ Actualizando caso: ' + casoId);
    Logger.log('Datos a actualizar: ' + JSON.stringify(datosActualizados));
    
    var spreadsheet = SpreadsheetApp.openByUrl(sheetUrl);
    var hojasExcluidas = ['Config', 'Bugs', 'Ejecuciones', 'Regresiones'];
    var todasLasHojas = spreadsheet.getSheets();
    
    for (var h = 0; h < todasLasHojas.length; h++) {
      var hoja = todasLasHojas[h];
      var nombreHoja = hoja.getName();
      
      if (hojasExcluidas.indexOf(nombreHoja) > -1) {
        continue;
      }
      
      var datos = hoja.getDataRange().getValues();
      if (datos.length <= 1) continue;
      
      var headers = datos[0];
      var indexID = headers.indexOf('ID');
      
      if (indexID === -1) continue;
      
      for (var i = 1; i < datos.length; i++) {
        if (datos[i][indexID] === casoId) {
          
          Logger.log('✅ Caso encontrado en hoja: ' + nombreHoja + ', fila: ' + (i + 1));
          
          for (var campo in datosActualizados) {
            var colIndex = headers.indexOf(campo);
            if (colIndex > -1) {
              var valor = datosActualizados[campo];
              
              if (campo.indexOf('Fecha') > -1 && typeof valor === 'string') {
                try {
                  valor = new Date(valor);
                } catch (e) {
                  // Mantener como string si falla
                }
              }
              
              hoja.getRange(i + 1, colIndex + 1).setValue(valor);
              Logger.log('  ✓ Campo actualizado: ' + campo + ' = ' + valor);
            }
          }
          
          Logger.log('✅ Caso actualizado exitosamente');
          
          return {
            success: true,
            mensaje: 'Caso actualizado exitosamente'
          };
        }
      }
    }
    
    Logger.log('❌ Caso no encontrado: ' + casoId);
    return {
      success: false,
      mensaje: 'Caso no encontrado'
    };
    
  } catch (error) {
    Logger.log('❌ Error actualizando caso: ' + error.toString());
    return {
      success: false,
      mensaje: 'Error al actualizar caso: ' + error.message
    };
  }
}

/**
 * NUEVA FUNCIÓN: Mueve un caso de una hoja a otra
 * Mantiene el ID pero cambia la ubicación física
 */
function moverCaso(sheetUrl, casoId, hojaDestino) {
  try {
    Logger.log('📦 Moviendo caso ' + casoId + ' a hoja: ' + hojaDestino);
    
    var spreadsheet = SpreadsheetApp.openByUrl(sheetUrl);
    
    // 1. Buscar el caso en todas las hojas
    var casoCompleto = buscarCasoEnTodasLasHojas(spreadsheet, casoId);
    
    if (!casoCompleto) {
      Logger.log('❌ Caso no encontrado');
      return {
        success: false,
        mensaje: 'Caso no encontrado'
      };
    }
    
    var hojaOrigen = casoCompleto.hoja;
    var filaCaso = casoCompleto.fila;
    var datosCaso = casoCompleto.datos;
    
    Logger.log('Caso encontrado en hoja: ' + hojaOrigen.getName() + ', fila: ' + filaCaso);
    
    // 2. Verificar que hoja destino existe
    var hojaDestinoSheet = spreadsheet.getSheetByName(hojaDestino);
    
    if (!hojaDestinoSheet) {
      Logger.log('❌ Hoja destino no existe');
      return {
        success: false,
        mensaje: 'La hoja destino "' + hojaDestino + '" no existe'
      };
    }
    
    // 3. No mover si ya está en la hoja destino
    if (hojaOrigen.getName() === hojaDestino) {
      Logger.log('⚠️ El caso ya está en la hoja destino');
      return {
        success: false,
        mensaje: 'El caso ya está en la hoja "' + hojaDestino + '"'
      };
    }
    
    // 4. Actualizar campo "Hoja" en los datos
    var headers = hojaOrigen.getRange(1, 1, 1, hojaOrigen.getLastColumn()).getValues()[0];
    var indexHoja = headers.indexOf('Hoja');
    var indexNotas = headers.indexOf('Notas');
    
    if (indexHoja > -1) {
      datosCaso[indexHoja] = hojaDestino;
    }
    
    // 5. Agregar nota de movimiento
    if (indexNotas > -1) {
      var notaAnterior = datosCaso[indexNotas] || '';
      var fecha = new Date().toLocaleDateString('es-ES');
      var notaMovimiento = 'Movido desde "' + hojaOrigen.getName() + '" el ' + fecha;
      datosCaso[indexNotas] = notaAnterior ? notaAnterior + ' | ' + notaMovimiento : notaMovimiento;
    }
    
    // 6. Copiar caso a hoja destino
    hojaDestinoSheet.appendRow(datosCaso);
    Logger.log('✓ Caso copiado a hoja destino');
    
    // 7. Eliminar caso de hoja origen
    hojaOrigen.deleteRow(filaCaso);
    Logger.log('✓ Caso eliminado de hoja origen');
    
    Logger.log('✅ Caso movido exitosamente');
    
    return {
      success: true,
      mensaje: 'Caso movido exitosamente de "' + hojaOrigen.getName() + '" a "' + hojaDestino + '"',
      data: {
        casoId: casoId,
        hojaOrigen: hojaOrigen.getName(),
        hojaDestino: hojaDestino
      }
    };
    
  } catch (error) {
    Logger.log('❌ Error moviendo caso: ' + error.toString());
    return {
      success: false,
      mensaje: 'Error al mover caso: ' + error.message
    };
  }
}

/**
 * Busca un caso en todas las hojas y retorna su ubicación
 */
function buscarCasoEnTodasLasHojas(spreadsheet, casoId) {
  var hojasExcluidas = ['Config', 'Bugs', 'Ejecuciones', 'Regresiones'];
  var todasLasHojas = spreadsheet.getSheets();
  
  for (var h = 0; h < todasLasHojas.length; h++) {
    var hoja = todasLasHojas[h];
    
    if (hojasExcluidas.indexOf(hoja.getName()) > -1) {
      continue;
    }
    
    var datos = hoja.getDataRange().getValues();
    if (datos.length <= 1) continue;
    
    var headers = datos[0];
    var indexID = headers.indexOf('ID');
    
    if (indexID === -1) continue;
    
    for (var i = 1; i < datos.length; i++) {
      if (datos[i][indexID] === casoId) {
        return {
          hoja: hoja,
          fila: i + 1,
          datos: datos[i]
        };
      }
    }
  }
  
  return null;
}

/**
 * Elimina un caso (soft delete)
 */
function eliminarCaso(sheetUrl, casoId) {
  try {
    Logger.log('🗑️ Eliminando caso (soft delete): ' + casoId);
    
    var usuario = Session.getActiveUser().getEmail();
    var fechaEliminacion = new Date().toISOString();
    
    return actualizarCaso(sheetUrl, casoId, {
      Estado: 'Eliminado',
      Notas: 'Eliminado el ' + fechaEliminacion + ' por ' + usuario
    });
    
  } catch (error) {
    Logger.log('❌ Error eliminando caso: ' + error.toString());
    return {
      success: false,
      mensaje: 'Error al eliminar caso: ' + error.message
    };
  }
}

/**
 * Restaura un caso eliminado
 */
function restaurarCaso(sheetUrl, casoId) {
  try {
    Logger.log('↩️ Restaurando caso: ' + casoId);
    
    var usuario = Session.getActiveUser().getEmail();
    var fechaRestauracion = new Date().toISOString();
    
    return actualizarCaso(sheetUrl, casoId, {
      Estado: 'Pendiente',
      Notas: 'Restaurado el ' + fechaRestauracion + ' por ' + usuario
    });
    
  } catch (error) {
    Logger.log('❌ Error restaurando caso: ' + error.toString());
    return {
      success: false,
      mensaje: 'Error al restaurar caso: ' + error.message
    };
  }
}

/**
 * Crea un nuevo caso de prueba
 * ACTUALIZADO: IDs simplificados sin prefijo de hoja
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
    
    // CAMBIO: ID simplificado
    var nuevoId = generarIdCasoSimplificado(hojaConfig);
    var casoURI = generarCasoURI(spreadsheet.getId(), nuevoId);
    var usuario = Session.getActiveUser().getEmail();
    
    var fila = [
      nuevoId,
      nombreHojaDestino,
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
 * NUEVO: Genera ID simplificado (TC-1, TC-2, TC-3...)
 * Sin prefijo de hoja
 */
function generarIdCasoSimplificado(hojaConfig) {
  try {
    var datos = hojaConfig.getDataRange().getValues();
    var claveContador = 'ultimo_caso_id_global';
    var ultimoId = 0;
    var filaContador = -1;
    
    // Buscar contador global
    for (var i = 1; i < datos.length; i++) {
      if (datos[i][0] === claveContador) {
        ultimoId = parseInt(datos[i][1]) || 0;
        filaContador = i + 1;
        break;
      }
    }
    
    // Si no existe contador global, crearlo
    if (filaContador === -1) {
      hojaConfig.appendRow([claveContador, 1, 'Contador global de casos (IDs simplificados)']);
      ultimoId = 0;
    } else {
      // Actualizar contador existente
      hojaConfig.getRange(filaContador, 2).setValue(ultimoId + 1);
    }
    
    var nuevoNumero = ultimoId + 1;
    
    // Formato simplificado: TC-1, TC-2, TC-3...
    return 'TC-' + nuevoNumero;
    
  } catch (error) {
    Logger.log('Error generando ID: ' + error.toString());
    // Fallback: usar timestamp
    return 'TC-' + new Date().getTime();
  }
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
