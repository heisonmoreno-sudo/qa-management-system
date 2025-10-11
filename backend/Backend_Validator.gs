/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BACKEND_VALIDATOR.GS
 * Sistema de validación de integridad del proyecto QA Management System
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Función principal - Ejecuta todas las validaciones
 * EJECUTAR ESTA después de cada actualización de código
 */
function validarSistemaCompleto() {
  const resultado = {
    timestamp: new Date(),
    errores: [],
    advertencias: [],
    info: [],
    resumen: {}
  };

  Logger.log('🔍 Iniciando validación del sistema...\n');
  
  try {
    // 1. Validar estructura de archivos Backend
    validarArchivosBackend(resultado);
    
    // 2. Validar funciones referenciadas
    validarReferenciasBackend(resultado);
    
    // 3. Validar configuración del Sheet
    validarConfiguracionSheet(resultado);
    
    // 4. Validar estructura Frontend (básico)
    validarEstructuraFrontend(resultado);
    
    // 5. Generar reporte
    generarReporte(resultado);
    
  } catch (error) {
    Logger.log('❌ ERROR CRÍTICO EN VALIDACIÓN: ' + error.message);
    Logger.log(error.stack);
  }
  
  return resultado;
}

/**
 * Valida que existan los archivos Backend principales
 */
function validarArchivosBackend(resultado) {
  Logger.log('📁 Validando archivos Backend...');
  
  const archivosRequeridos = [
    'doGet',
    'obtenerConfiguracion',
    'guardarConfiguracion'
  ];
  
  archivosRequeridos.forEach(func => {
    if (typeof this[func] === 'function') {
      resultado.info.push(`✅ Función core encontrada: ${func}`);
    } else {
      resultado.errores.push(`❌ Función core NO encontrada: ${func}`);
    }
  });
}

/**
 * Valida referencias entre funciones Backend
 */
function validarReferenciasBackend(resultado) {
  Logger.log('🔗 Validando referencias entre funciones...');
  
  // Definir mapeo de funciones esperadas por módulo
  const funcionesEsperadas = {
    'Casos': [
      'obtenerCasosPorHoja',
      'crearNuevoCaso',
      'actualizarCaso',
      'eliminarCaso',
      'obtenerHojasDisponibles'
    ],
    'Bugs': [
      'obtenerBugs',
      'crearBug',
      'sincronizarBugsConTrello'
    ],
    'Workspace': [
      'obtenerWorkspaces',
      'guardarWorkspace',
      'seleccionarWorkspace'
    ],
    'Trello': [
      'validarConexionTrello',
      'obtenerTablerosTrello'
    ]
  };
  
  // Validar cada módulo
  Object.keys(funcionesEsperadas).forEach(modulo => {
    const funciones = funcionesEsperadas[modulo];
    let encontradas = 0;
    
    funciones.forEach(func => {
      if (typeof this[func] === 'function') {
        encontradas++;
      } else {
        resultado.advertencias.push(`⚠️  ${modulo}: Función '${func}' no encontrada`);
      }
    });
    
    if (encontradas === funciones.length) {
      resultado.info.push(`✅ Módulo ${modulo}: ${encontradas}/${funciones.length} funciones OK`);
    } else {
      resultado.advertencias.push(`⚠️  Módulo ${modulo}: Solo ${encontradas}/${funciones.length} funciones encontradas`);
    }
  });
}

/**
 * Valida la configuración del Google Sheet
 */
function validarConfiguracionSheet(resultado) {
  Logger.log('📊 Validando configuración del Sheet...');
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (!ss) {
      resultado.errores.push('❌ No se puede acceder al Spreadsheet activo');
      return;
    }
    
    resultado.info.push(`✅ Spreadsheet activo: ${ss.getName()}`);
    
    // Verificar hoja Config
    const configSheet = ss.getSheetByName('Config');
    if (configSheet) {
      resultado.info.push('✅ Hoja "Config" encontrada');
      
      // Verificar estructura básica
      const headers = configSheet.getRange(1, 1, 1, 3).getValues()[0];
      if (headers[0] === 'Clave' && headers[1] === 'Valor') {
        resultado.info.push('✅ Estructura de Config correcta');
      } else {
        resultado.advertencias.push('⚠️  Estructura de Config no estándar');
      }
    } else {
      resultado.errores.push('❌ Hoja "Config" NO encontrada - Sistema no funcionará');
    }
    
    // Verificar hoja Bugs
    const bugsSheet = ss.getSheetByName('Bugs');
    if (bugsSheet) {
      resultado.info.push('✅ Hoja "Bugs" encontrada');
    } else {
      resultado.advertencias.push('⚠️  Hoja "Bugs" no encontrada - Funcionalidad limitada');
    }
    
    // Contar hojas de casos (excluyendo Config y Bugs)
    const allSheets = ss.getSheets();
    const hojasCase = allSheets.filter(s => 
      s.getName() !== 'Config' && 
      s.getName() !== 'Bugs'
    );
    
    if (hojasCase.length > 0) {
      resultado.info.push(`✅ ${hojasCase.length} hoja(s) de casos encontradas: ${hojasCase.map(s => s.getName()).join(', ')}`);
    } else {
      resultado.advertencias.push('⚠️  No se encontraron hojas de casos de prueba');
    }
    
  } catch (error) {
    resultado.advertencias.push(`⚠️  No se puede validar Sheet (puede estar ejecutándose desde editor): ${error.message}`);
  }
}

/**
 * Valida estructura básica del Frontend
 */
function validarEstructuraFrontend(resultado) {
  Logger.log('🎨 Validando estructura Frontend...');
  
  try {
    // Intentar obtener el HTML
    const html = HtmlService.createTemplateFromFile('Frontend_Index');
    if (html) {
      resultado.info.push('✅ Frontend_Index.html encontrado');
    }
  } catch (error) {
    resultado.errores.push('❌ Frontend_Index.html NO encontrado o tiene errores');
  }
  
  // Lista de componentes esperados
  const componentesEsperados = [
    'Frontend_Styles_Base',
    'Frontend_Scripts_Main',
    'Frontend_Components_Casos'
  ];
  
  componentesEsperados.forEach(comp => {
    try {
      HtmlService.createTemplateFromFile(comp);
      resultado.info.push(`✅ Componente encontrado: ${comp}.html`);
    } catch (error) {
      resultado.advertencias.push(`⚠️  Componente no encontrado: ${comp}.html`);
    }
  });
}

/**
 * Genera y muestra el reporte final
 */
function generarReporte(resultado) {
  Logger.log('\n' + '═'.repeat(70));
  Logger.log('📋 REPORTE DE VALIDACIÓN DEL SISTEMA');
  Logger.log('═'.repeat(70));
  Logger.log(`🕐 Timestamp: ${resultado.timestamp.toLocaleString()}`);
  Logger.log('');
  
  // Resumen
  Logger.log('📊 RESUMEN:');
  Logger.log(`   ✅ Info: ${resultado.info.length} items`);
  Logger.log(`   ⚠️  Advertencias: ${resultado.advertencias.length} items`);
  Logger.log(`   ❌ Errores: ${resultado.errores.length} items`);
  Logger.log('');
  
  // Errores críticos
  if (resultado.errores.length > 0) {
    Logger.log('❌ ERRORES CRÍTICOS (REQUIEREN ATENCIÓN):');
    resultado.errores.forEach(err => Logger.log(`   ${err}`));
    Logger.log('');
  }
  
  // Advertencias
  if (resultado.advertencias.length > 0) {
    Logger.log('⚠️  ADVERTENCIAS (REVISAR):');
    resultado.advertencias.forEach(adv => Logger.log(`   ${adv}`));
    Logger.log('');
  }
  
  // Info
  if (resultado.info.length > 0) {
    Logger.log('✅ VALIDACIONES EXITOSAS:');
    resultado.info.forEach(info => Logger.log(`   ${info}`));
    Logger.log('');
  }
  
  // Conclusión
  Logger.log('═'.repeat(70));
  if (resultado.errores.length === 0) {
    Logger.log('✅ SISTEMA VALIDADO CORRECTAMENTE');
  } else {
    Logger.log('❌ SISTEMA CON ERRORES - REVISAR ARRIBA');
  }
  Logger.log('═'.repeat(70));
  
  // Mensaje para el usuario (solo si se ejecuta desde Sheet)
  try {
    const ui = SpreadsheetApp.getUi();
    if (resultado.errores.length === 0 && resultado.advertencias.length === 0) {
      ui.alert(
        '✅ Validación Exitosa',
        'El sistema está correctamente configurado.\n\n' +
        'Revisa el Log (Ver > Registros) para más detalles.',
        ui.ButtonSet.OK
      );
    } else {
      ui.alert(
        '⚠️ Validación con Observaciones',
        `Se encontraron:\n` +
        `• ${resultado.errores.length} errores críticos\n` +
        `• ${resultado.advertencias.length} advertencias\n\n` +
        'Revisa el Log (Ver > Registros) para más detalles.',
        ui.ButtonSet.OK
      );
    }
  } catch (e) {
    // Si no se puede acceder a UI (ejecutando desde editor), solo mostrar en log
    Logger.log('ℹ️  Popup no disponible (ejecutando desde editor)');
    Logger.log('📝 Revisa el reporte completo arriba ☝️');
  }
}

/**
 * Función auxiliar: Verificar si existe una función específica
 */
function existeFuncion(nombreFuncion) {
  try {
    return typeof this[nombreFuncion] === 'function';
  } catch (error) {
    return false;
  }
}

/**
 * Función de prueba rápida - Solo verifica lo esencial
 */
function validacionRapida() {
  Logger.log('⚡ Validación Rápida...');
  
  const checks = [
    { nombre: 'doGet', tipo: 'CRÍTICO' },
    { nombre: 'obtenerConfiguracion', tipo: 'CRÍTICO' },
    { nombre: 'obtenerCasosPorHoja', tipo: 'IMPORTANTE' },
    { nombre: 'crearNuevoCaso', tipo: 'IMPORTANTE' }
  ];
  
  let erroresCriticos = 0;
  
  checks.forEach(check => {
    const existe = typeof this[check.nombre] === 'function';
    const icon = existe ? '✅' : '❌';
    Logger.log(`${icon} [${check.tipo}] ${check.nombre}`);
    
    if (!existe && check.tipo === 'CRÍTICO') {
      erroresCriticos++;
    }
  });
  
  if (erroresCriticos === 0) {
    Logger.log('\n✅ Validación rápida OK');
  } else {
    Logger.log(`\n❌ ${erroresCriticos} error(es) crítico(s) encontrado(s)`);
  }
}

/**
 * Menú personalizado para ejecutar validaciones
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🔍 Validador QA')
    .addItem('▶️ Validación Completa', 'validarSistemaCompleto')
    .addItem('⚡ Validación Rápida', 'validacionRapida')
    .addSeparator()
    .addItem('📋 Ver último reporte', 'mostrarUltimoReporte')
    .addToUi();
}

/**
 * Muestra información del último reporte (placeholder)
 */
function mostrarUltimoReporte() {
  SpreadsheetApp.getUi().alert(
    'Ejecuta "Validación Completa" y revisa el Log:\n' +
    'Ver > Registros (Ctrl+Enter)'
  );
}
