# 📋 QA Management System - Documentación del Proyecto

## 🎯 Descripción General

Sistema completo de gestión QA desarrollado en Google Apps Script, integrado con el ecosistema Google Workspace y Trello. Permite gestionar casos de prueba, ejecutar test sets, crear bugs, generar informes y mantener trazabilidad completa del proceso de QA.

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico
- **Backend:** Google Apps Script (GAS)
- **Frontend:** HTML5, CSS3, JavaScript vanilla
- **Base de datos:** Google Sheets
- **Almacenamiento:** Google Drive
- **Gestión de tareas:** Trello API
- **Despliegue:** Web App de Google Apps Script

### Estructura de Archivos del Proyecto

```
QA-Management-System/
│
├── Backend/
│   ├── Backend_Code.gs                     # ✅ Punto de entrada principal
│   ├── Backend_Config.gs                   # ✅ Configuraciones y contadores
│   ├── Backend_Services_Casos.gs           # ✅ Lógica de casos de prueba
│   ├── Backend_Services_Workspace.gs       # ✅ Gestión de workspaces
│   ├── Backend_Utils_Utils.gs              # ✅ Utilidades generales
│   ├── Backend_Validator.gs                # ✅ Sistema de validación
│   ├── Backend_Services_Bugs.gs            # 🚧 Gestión de bugs (pendiente)
│   ├── Backend_Services_Trello.gs          # 📋 Integración Trello (pendiente)
│   ├── Backend_Services_Regresion.gs       # 📋 Lógica regresiones (pendiente)
│   ├── Backend_Services_Informes.gs        # 📋 Generación informes (pendiente)
│   └── Backend_Services_Drive.gs           # 📋 Manejo Drive (pendiente)
│
└── Frontend/
    ├── Frontend_Index.html                 # ✅ HTML principal
    ├── Frontend_Styles_Base.html           # ✅ Estilos CSS base
    ├── Frontend_Scripts_Main.html          # ✅ JavaScript principal
    ├── Frontend_Components_Casos.html      # ✅ Componente casos
    ├── Frontend_Components_Setup.html      # ✅ Componente configuración
    ├── Frontend_Components_Bugs.html       # 📋 Componente bugs (pendiente)
    └── Frontend_Components_Modals.html     # 📋 Modales adicionales (pendiente)
```

## 🚀 Funcionalidades Principales

### 1. Gestión de Workspaces ✅
- Configuración automática del Google Sheet
- Creación de estructura de hojas necesarias
- Validación de configuración existente
- Creación de nuevo workspace desde cero

### 2. Casos de Prueba ✅
- **Formatos soportados:** Clásico y Gherkin (Given-When-Then)
- **Organización:** Por hojas/módulos dinámicas
- **IDs únicos:** Formato `[HOJA]-TC-[N]` (ej: LOGIN-TC-1, PAGOS-TC-2)
- **Estados:** En diseño, Pendiente, Ejecutando, OK, No_OK
- **Campos implementados:**
  - Título (mín. 10 caracteres)
  - Descripción (mín. 10 caracteres)
  - Prioridad (Crítica/Alta/Media/Baja)
  - Formato del caso (Clásico/Gherkin)
  - Tipo de prueba
  - Pasos y resultado esperado (Clásico) o Given/When/Then (Gherkin)
  - Precondiciones
  - Flujo crítico (Sí/No)
  - Candidato a regresión (Sí/No)

### 3. Gestión de Hojas ✅
- Creación dinámica de nuevas hojas
- Validación de nombres duplicados
- Advertencias contextuales
- Estructura automática con headers

### 4. Ejecución de Test Sets 🚧
- *En desarrollo para próximo sprint*

### 5. Gestión de Bugs 📋
- *Pendiente de implementación*

### 6. Regresiones 📋
- *Pendiente de implementación*

### 7. Informes Automatizados 📋
- *Pendiente de implementación*

## 📊 Estructura del Google Sheet

### Hoja "Config" (Sistema) ✅
```
| Clave              | Valor                      | Descripción        |
|--------------------|----------------------------|--------------------|
| workspace_nombre   | [Nombre del proyecto]      | Nombre workspace   |
| workspace_creado   | [Fecha ISO]                | Fecha creación     |
| workspace_version  | 1.0                        | Versión sistema    |
| ultimo_caso_id_*   | [Contador por hoja]        | Contadores de IDs  |
| trello_board_url   | [URL opcional]             | Board de Trello    |
| drive_folder_id    | [ID opcional]              | Carpeta evidencias |
```

### Hoja "Casos" (Principal) ✅
```
| ID         | Hoja   | Título | Descripción | Prioridad | Estado | ... |
|------------|--------|--------|-------------|-----------|--------|-----|
| LOGIN-TC-1 | Login  | ...    | ...         | Alta      | OK     | ... |
| PAGOS-TC-1 | Pagos  | ...    | ...         | Crítica   | No_OK  | ... |
```

### Hojas Organizacionales (Login, Pagos, etc.) ✅
- Misma estructura que hoja Casos
- Creación dinámica desde la interfaz
- Headers automáticos al crear

### Hoja "Bugs" ✅
- Estructura creada, funcionalidad pendiente

### Hoja "Ejecuciones" ✅
- Estructura creada, funcionalidad pendiente

### Hoja "Regresiones" ✅
- Estructura creada, funcionalidad pendiente

## 🎨 Interfaz de Usuario

### Diseño Visual ✅
- **Estilo:** Moderno con gradientes y sombras suaves
- **Colores:** Esquema morado/violeta con acentos
- **Componentes:** Cards, modales, tablas responsivas
- **UX:** Interfaz limpia y minimalista
- **Responsive:** Adaptable a diferentes tamaños

### Pantallas Implementadas

1. **Pantalla de Bienvenida** ✅
   - Input para URL del Sheet
   - Botón para conectar Sheet existente
   - Botón para crear nuevo workspace
   - Test de conexión backend

2. **Pantalla de Setup** ✅
   - Auto-configuración del Sheet
   - Creación de hojas necesarias
   - Progreso visual
   - Validación de estructura

3. **Gestión de Casos** ✅
   - Tabla de casos con datos reales
   - Modal de creación/edición
   - Selector de hojas dinámico
   - Creación de hojas nuevas
   - Filtros funcionales
   - Validaciones en formularios

4. **Componentes UI** ✅
   - Header con información de usuario
   - Sistema de notificaciones toast
   - Spinner de carga con mensajes
   - Modales responsivos
   - Badges de estado y prioridad

## 🔧 Instalación y Configuración

### Requisitos Previos
1. Cuenta de Google con acceso a Google Sheets y Apps Script
2. Navegador web moderno (Chrome, Firefox, Edge)

### Pasos de Instalación

1. **Crear proyecto en Google Apps Script**
   ```
   - Ir a script.google.com
   - Crear nuevo proyecto
   - Nombrar el proyecto como "QA Management System"
   ```

2. **Copiar archivos del Backend**
   - Crear cada archivo .gs según la estructura
   - Copiar el código correspondiente

3. **Copiar archivos del Frontend**
   - Crear cada archivo .html
   - Copiar el código correspondiente

4. **Configurar Web App**
   ```
   - Implementar > Nueva implementación
   - Tipo: Aplicación web
   - Ejecutar como: Yo
   - Acceso: Según necesidad
   - Implementar
   ```

5. **Usar la aplicación**
   - Abrir la URL proporcionada
   - Conectar un Sheet existente o crear uno nuevo
   - El sistema auto-configurará la estructura

## 🔐 Seguridad y Permisos

- **Acceso:** Basado en permisos de Google Workspace
- **Ejecución:** Como el propietario del script
- **Datos:** Almacenados en Google Sheets del usuario
- **API Keys:** Preparado para almacenamiento seguro (pendiente Trello)

## 📈 Estado Actual del Desarrollo

### ✅ Completado (Sprint 1-2)
- Estructura modular del proyecto
- Sistema de navegación y UI base
- Configuración automática de workspace
- CRUD completo de casos de prueba
- Gestión de hojas dinámicas
- Sistema de IDs únicos por hoja
- Validaciones de formularios
- Notificaciones y feedback visual
- Filtros de casos funcionales
- Creación de estructura completa del Sheet

### 🚧 En Desarrollo (Sprint 3)
- Sistema de ejecución de test sets
- Upload de evidencias a Drive
- Creación de bugs desde casos

### 📋 Pendiente (Futuros Sprints)
- Integración completa con Trello API
- Sincronización bidireccional de bugs
- Sistema de regresiones
- Generación de informes automáticos
- Métricas y dashboards
- Exportación de datos
- Notificaciones por email
- Historial de cambios

## 🐛 Problemas Conocidos

1. **Sin problemas críticos actualmente** ✅
2. **Limitación:** La integración con Trello está pendiente
3. **Mejora sugerida:** Agregar paginación para grandes volúmenes de casos

## 📚 Mejores Prácticas

### Para Desarrollo
- Mantener archivos modulares y separados
- Comentar cada función nueva
- Validar en backend y frontend
- Usar el validador después de cambios

### Para Uso
- Organizar casos por hojas temáticas
- Usar nomenclatura consistente
- Documentar precondiciones claramente
- Marcar casos críticos y de regresión

### Para Mantenimiento
- Ejecutar `validarSistemaCompleto()` tras cambios
- Revisar logs en Apps Script
- Mantener backups del Sheet
- Documentar configuraciones personalizadas

## 🚀 Próximos Pasos

1. **Sprint 3 (Actual):** 
   - Implementar ejecución de casos
   - Upload de evidencias
   - Creación básica de bugs

2. **Sprint 4:** 
   - Integración con Trello
   - Sincronización de bugs

3. **Sprint 5:** 
   - Sistema de regresiones
   - Snapshots de casos

4. **Sprint 6:** 
   - Informes y métricas
   - Dashboard ejecutivo

## 📞 Soporte y Contribución

### Para Reportar Issues
- Usar el validador integrado primero
- Capturar logs de la consola del navegador
- Documentar pasos para reproducir

### Para Contribuir
- Mantener la estructura modular
- Agregar validaciones necesarias
- Actualizar documentación
- Probar en ambiente separado primero

## 🎯 Comandos Útiles

### En Google Apps Script
```javascript
// Validar sistema completo
validarSistemaCompleto()

// Validación rápida
validacionRapida()

// Test del backend
testBackend()

// Ver configuración actual
obtenerConfiguracion()
```

---

*Última actualización: Octubre 2024*
*Versión: 2.0.0 (Sprint 2 Completado)*
*Estado: Funcional - Gestión de Casos Operativa*