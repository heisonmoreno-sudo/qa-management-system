/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BACKEND_CONFIG.GS
 * Gestión de configuración del sistema
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Obtiene la configuración completa del sistema desde la hoja Config
 * @returns {Object} Objeto con toda la configuración
 */
function obtenerConfiguracion() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const configSheet = ss.getSheetByName('Config');
    
    if (!configSheet) {
      Logger.log('⚠️ Hoja Config no existe, creando...');
      crearHojaConfig();
      return obtenerConfiguracionPorDefecto();
    }
    
    // Leer todos los datos de configuración
    const datos = configSheet.getDataRange().getValues();
    const config = {};
    
    // Saltar header (fila 0) y procesar el resto
    for (let i = 1; i < datos.length; i++) {
      const clave = datos[i][0];
      const valor = datos[i][1];
      
      if (clave) { // Solo si hay clave
        config[clave] = valor;
      }
    }
    
    Logger.log('✅ Configuración cargada: ' + Object.keys(config).length + ' items');
    return config;
    
  } catch (error) {
    Logger.log('❌ Error al obtener configuración: ' + error.message);
    return obtenerConfiguracionPorDefecto();
  }
}

/**
 * Guarda la configuración en la hoja Config
 * @param {Object} config - Objeto con pares clave-valor a guardar
 * @returns {boolean} true si se guardó correctamente
 */
function guardarConfiguracion(config) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let configSheet = ss.getSheetByName('Config');
    
    if (!configSheet) {
      Logger.log('⚠️ Hoja Config no existe, creando...');
      configSheet = crearHojaConfig();
    }
    
    // Obtener configuración actual
    const configActual = obtenerConfiguracion();
    
    // Mergear con nueva configuración
    const configFinal = { ...configActual, ...config };
    
    // Limpiar datos existentes (excepto header)
    const ultimaFila = configSheet.getLastRow();
    if (ultimaFila > 1) {
      configSheet.getRange(2, 1, ultimaFila - 1, 3).clearContent();
    }
    
    // Escribir configuración actualizada
    const datos = [];
    for (const [clave, valor] of Object.entries(configFinal)) {
      datos.push([clave, valor, '']); // Columna 3 para descripción (opcional)
    }
    
    if (datos.length > 0) {
      configSheet.getRange(2, 1, datos.length, 3).setValues(datos);
    }
    
    Logger.log('✅ Configuración guardada: ' + datos.length + ' items');
    return true;
    
  } catch (error) {
    Logger.log('❌ Error al guardar configuración: ' + error.message);
    return false;
  }
}

/**
 * Obtiene un valor específico de configuración
 * @param {string} clave - La clave a buscar
 * @param {any} valorPorDefecto - Valor a retornar si no existe la clave
 * @returns {any} El valor de la configuración o el valor por defecto
 */
function obtenerValorConfig(clave, valorPorDefecto = null) {
  try {
    const config = obtenerConfiguracion();
    return config[clave] !== undefined ? config[clave] : valorPorDefecto;
  } catch (error) {
    Logger.log('⚠️ Error al obtener valor de config: ' + error.message);
    return valorPorDefecto;
  }
}

/**
 * Guarda un valor específico de configuración
 * @param {string} clave - La clave
 * @param {any} valor - El valor
 * @returns {boolean} true si se guardó correctamente
 */
function guardarValorConfig(clave, valor) {
  const config = {};
  config[clave] = valor;
  return guardarConfiguracion(config);
}

/**
 * Crea la hoja Config si no existe
 * @returns {Sheet} La hoja Config creada
 */
function crearHojaConfig() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const configSheet = ss.insertSheet('Config', 0); // Insertar como primera hoja
    
    // Crear headers
    const headers = [['Clave', 'Valor', 'Descripción']];
    configSheet.getRange(1, 1, 1, 3).setValues(headers);
    
    // Formato de headers
    const headerRange = configSheet.getRange(1, 1, 1, 3);
    headerRange.setBackground('#4285f4');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    
    // Ajustar anchos
    configSheet.setColumnWidth(1, 250); // Clave
    configSheet.setColumnWidth(2, 300); // Valor
    configSheet.setColumnWidth(3, 300); // Descripción
    
    // Crear configuración inicial
    const configInicial = [
      ['trello_board_id', '', 'ID del tablero de Trello'],
      ['trello_api_key', '', 'API Key de Trello (personal)'],
      ['trello_token', '', 'Token de Trello (personal)'],
      ['drive_folder_id', '', 'ID de carpeta de evidencias en Drive'],
      ['proyecto_nombre', 'Mi Proyecto QA', 'Nombre del proyecto actual'],
      ['ultimo_caso_id', '0', 'Contador global de casos']
    ];
    
    configSheet.getRange(2, 1, configInicial.length, 3).setValues(configInicial);
    
    Logger.log('✅ Hoja Config creada con éxito');
    return configSheet;
    
  } catch (error) {
    Logger.log('❌ Error al crear hoja Config: ' + error.message);
    throw error;
  }
}

/**
 * Retorna configuración por defecto en caso de error
 * @returns {Object} Configuración por defecto
 */
function obtenerConfiguracionPorDefecto() {
  return {
    'proyecto_nombre': 'Mi Proyecto QA',
    'ultimo_caso_id': '0',
    'trello_board_id': '',
    'trello_api_key': '',
    'trello_token': '',
    'drive_folder_id': ''
  };
}

/**
 * Incrementa el contador de un tipo de ID
 * @param {string} tipo - Tipo de ID (ej: 'ultimo_caso_id', 'ultimo_bug_id')
 * @returns {number} El nuevo ID
 */
function incrementarContador(tipo) {
  try {
    const valorActual = obtenerValorConfig(tipo, '0');
    const nuevoValor = parseInt(valorActual) + 1;
    guardarValorConfig(tipo, nuevoValor.toString());
    return nuevoValor;
  } catch (error) {
    Logger.log('❌ Error al incrementar contador: ' + error.message);
    return 1;
  }
}

/**
 * Obtiene el contador de IDs por hoja (para casos de prueba)
 * @param {string} nombreHoja - Nombre de la hoja
 * @returns {number} El contador actual de esa hoja
 */
function obtenerContadorPorHoja(nombreHoja) {
  const clave = 'ultimo_caso_id_' + nombreHoja.toLowerCase().replace(/\s+/g, '_');
  return parseInt(obtenerValorConfig(clave, '0'));
}

/**
 * Incrementa el contador de una hoja específica
 * @param {string} nombreHoja - Nombre de la hoja
 * @returns {number} El nuevo ID
 */
function incrementarContadorHoja(nombreHoja) {
  const clave = 'ultimo_caso_id_' + nombreHoja.toLowerCase().replace(/\s+/g, '_');
  const valorActual = obtenerValorConfig(clave, '0');
  const nuevoValor = parseInt(valorActual) + 1;
  guardarValorConfig(clave, nuevoValor.toString());
  return nuevoValor;
}

/**
 * Función de prueba - Verifica que todo funcione
 */
function testConfiguracion() {
  Logger.log('🧪 Iniciando test de configuración...');
  
  // Test 1: Obtener configuración
  Logger.log('\n📖 Test 1: Obtener configuración');
  const config = obtenerConfiguracion();
  Logger.log('Config actual: ' + JSON.stringify(config, null, 2));
  
  // Test 2: Guardar valor
  Logger.log('\n💾 Test 2: Guardar valor');
  const guardado = guardarValorConfig('test_key', 'test_value');
  Logger.log('Guardado exitoso: ' + guardado);
  
  // Test 3: Obtener valor específico
  Logger.log('\n🔍 Test 3: Obtener valor específico');
  const valor = obtenerValorConfig('test_key', 'no encontrado');
  Logger.log('Valor obtenido: ' + valor);
  
  // Test 4: Incrementar contador
  Logger.log('\n➕ Test 4: Incrementar contador');
  const contador1 = incrementarContador('test_contador');
  const contador2 = incrementarContador('test_contador');
  Logger.log('Contador 1: ' + contador1 + ', Contador 2: ' + contador2);
  
  // Test 5: Contador por hoja
  Logger.log('\n📄 Test 5: Contador por hoja');
  const idHoja1 = incrementarContadorHoja('Login');
  const idHoja2 = incrementarContadorHoja('Login');
  Logger.log('ID Login 1: ' + idHoja1 + ', ID Login 2: ' + idHoja2);
  
  Logger.log('\n✅ Tests completados');
}
