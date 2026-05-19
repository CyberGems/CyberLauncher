export const translations = {
  es: {
    // Top Bar & General Placeholders
    top_time: "Reloj Neuronal",
    search_placeholder_normal: "Buscar en CyberLauncher...",
    search_placeholder_system: "Buscar en todo el sistema...",
    search_placeholder_console: "Escribe un comando de consola...",
    clear_search: "Limpiar búsqueda",
    hud_system: "Abrir Diagnóstico de Recursos de Sistema",
    hud_storage: "Abrir Diagnóstico de Almacenamiento Físico",
    hud_clock: "Abrir Reloj Neuronal y Programador de Ejecuciones",
    
    // Sidebar Tabs
    tab_general: "GENERAL",
    tab_appearance: "APARIENCIA",
    tab_system: "SISTEMA",
    tab_indexer: "BUSCADOR",
    tab_uwp: "WINDOWS STORE",
    
    // Settings Title
    settings_title: "CONFIGURACIÓN DE CYBERLAUNCHER",
    
    // General Settings Tab
    general_language: "IDIOMA DE LA INTERFAZ (LANGUAGE)",
    general_language_desc: "Selecciona el idioma de los menús y paneles de CyberLauncher.",
    general_shortcut: "ATAJO PARA ACTIVAR / OCULTAR",
    general_shortcut_desc: "Haz clic en el botón de arriba y presiona la combinación de teclas (ej. Ctrl+Shift+P).",
    general_shortcut_rec: "Presiona la combinación de teclas...",
    general_scale: "TAMAÑO DE LAS CARDS",
    general_scale_desc: "Ajusta el tamaño de la cuadrícula para ver más o menos apps, sin hacer scroll.",
    general_monitor: "MONITOR DE DESPLIEGUE",
    general_monitor_desc: "Selecciona en cuál monitor aparecerá Cyber Launcher.",
    general_hotspots: "ACTIVACIÓN POR HOTSPOTS",
    general_hotspots_corners: "Esquinas activas",
    general_hotspots_corners_desc: "Selecciona una o más esquinas para activar el launcher al llevar el cursor allí.",
    general_hotspots_delay: "Retraso de activación",
    general_hotspots_delay_desc: "Previene activaciones accidentales",
    general_hide_on_click: "Ocultar al hacer clic en espacio vacío",
    general_hide_on_click_desc: "Al hacer clic en el fondo del launcher, se oculta al tray.",
    general_hide_on_blur: "Ocultar al perder el foco",
    general_hide_on_blur_desc: "Al hacer clic fuera del launcher, se oculta al tray automáticamente.",
    general_show_taskbar: "Mostrar icono en la barra de tareas",
    general_show_taskbar_desc: "Muestra el icono de Cyber Launcher en la barra de tareas de Windows.",
    general_reset_on_launch: "Restablecer vista al abrir (Reset)",
    general_reset_on_launch_desc: "Limpia la búsqueda, scroll y restablece la categoría a 'TODAS' al abrir.",
    
    // Appearance Settings Tab
    app_bg_type: "TIPO DE FONDO",
    app_bg_image: "Imagen",
    app_bg_gradient: "Gradiente",
    app_bg_solid: "Sólido",
    app_bg_desc: "Personaliza el fondo visual de la interfaz del lanzador.",
    app_blur: "NIVEL DE DESENFOQUE (BLUR)",
    app_blur_desc: "Ajusta el desenfoque de fondo para mejorar la legibilidad.",
    app_opacity: "OPACIDAD DEL FONDO",
    app_opacity_desc: "Controla la transparencia del fondo de la aplicación.",
    app_scale: "ESCALA DE LA INTERFAZ",
    app_scale_desc: "Ajusta la escala general de renderizado de CyberLauncher.",
    
    // System Settings Tab
    sys_startup: "INICIO AUTOMÁTICO CON WINDOWS",
    sys_startup_desc: "Lanza Cyber Launcher automáticamente al iniciar sesión.",
    sys_blur_hide: "OCULTAR AL PERDER EL FOCO (BLUR HIDE)",
    sys_blur_hide_desc: "Oculta el lanzador inmediatamente al hacer clic fuera de su ventana.",
    sys_animations: "EFECTOS VISUALES Y ANIMACIONES",
    sys_animations_desc: "Habilita efectos fluidos y transiciones holográficas premium.",
    
    // Indexer Settings Tab
    idx_title: "NEURO-INDEX GLOBAL",
    idx_desc: "Motor de indexación híbrido de archivos y accesos directos",
    idx_master: "SERVICIO DE BÚSQUEDA INDEXADA",
    idx_master_desc: "Habilita la indexación global de archivos en segundo plano con velocidad Everything.",
    idx_status_online: "SISTEMA ONLINE",
    idx_status_offline: "APAGADO",
    idx_status_label: "ESTADO DEL MOTOR",
    idx_status_registered: "ARCHIVOS REGISTRADOS",
    idx_scan_depth: "PROFUNDIDAD DEL RASTREO",
    idx_scan_depth_desc: "Niveles altos rastrean más carpetas internas pero consumen más disco temporal en el primer arranque.",
    idx_drives_detected: "UNIDADES DEL SISTEMA DETECTADAS (DRIVES)",
    idx_drives_none: "No se detectaron unidades físicas lógicas.",
    idx_folders_authorized: "CARPETAS AUTORIZADAS A INDEXAR",
    idx_add_folder: "AGREGAR CARPETA",
    
    // Windows Store Settings Tab
    uwp_title: "APLICACIONES UWP & MSIX",
    uwp_desc: "Gestión nativa de aplicaciones de la Tienda de Windows (AUMID)",
    uwp_scan_btn: "ESCANEAR WINDOWS STORE",
    uwp_scan_desc: "Busca y registra todas las aplicaciones UWP instaladas en tu sistema de forma automatizada.",
    uwp_empty: "No hay aplicaciones UWP indexadas. Haz clic en 'Escanear Windows Store' arriba para iniciar.",
    uwp_toast_scan_start: "Iniciando escaneo de Windows Store...",
    uwp_toast_scan_success: "Escaneo completado con éxito",
    
    // Context Menu
    ctx_open: "Abrir",
    ctx_copy: "Copiar",
    ctx_cut: "Cortar",
    ctx_copy_path: "Copiar ruta completa al portapapeles",
    ctx_pin_fav: "Anclar a Favoritos de CyberLauncher",
    ctx_pin_bar: "Anclar a Barra de Tareas de CyberLauncher",
    
    // Placeholder Info Text below input
    hint_console_enter: "Presiona [Enter] para ejecutar",
    hint_system_tab: "Presiona [Tab] para volver al Launcher",
    hint_normal_console: "Escribe '>' para consola o [Tab] para buscar en sistema",
    
    // Notifications & Toasts
    notif_drive_linked: "Indexando unidad entera {drive}...",
    notif_drive_unlinked: "Unidad {drive} desvinculada",
    notif_indexer_saved: "Configuración del indexador guardada",
    notif_indexer_error: "Error al guardar configuración del indexador",
    notif_path_added: "Ruta agregada: {path}",
    notif_path_removed: "Ruta eliminada: {path}",
    
    // System Status
    stat_online: "ONLINE",
    stat_offline: "OFFLINE",
    stat_level1: "LIVIANO (NIVEL 1)",
    stat_level2: "NORMAL (NIVEL 2)",
    stat_level3: "AVANZADO (NIVEL 3)",
    stat_level4: "COMPLETO (NIVEL 4)",
  },
  en: {
    // Top Bar & General Placeholders
    top_time: "Neural Clock",
    search_placeholder_normal: "Search in CyberLauncher...",
    search_placeholder_system: "Search system-wide...",
    search_placeholder_console: "Type a console command...",
    clear_search: "Clear search",
    hud_system: "Open System Resource Diagnostics",
    hud_storage: "Open Physical Storage Diagnostics",
    hud_clock: "Open Neural Clock & Execution Scheduler",
    
    // Sidebar Tabs
    tab_general: "GENERAL",
    tab_appearance: "APPEARANCE",
    tab_system: "SYSTEM",
    tab_indexer: "SEARCH ENGINE",
    tab_uwp: "WINDOWS STORE",
    
    // Settings Title
    settings_title: "CYBERLAUNCHER CONFIGURATION",
    
    // General Settings Tab
    general_language: "INTERFACE LANGUAGE",
    general_language_desc: "Select the display language for CyberLauncher menus and panels.",
    general_shortcut: "TOGGLE ACTIVATION SHORTCUT",
    general_shortcut_desc: "Click the button above and press your desired shortcut keys (e.g. Ctrl+Shift+P).",
    general_shortcut_rec: "Press shortcut keys combination...",
    general_scale: "CARD SIZE GRID SCALE",
    general_scale_desc: "Adjust grid scale to view more or fewer apps without scrolling.",
    general_monitor: "DISPLAY MONITOR",
    general_monitor_desc: "Select which display monitor CyberLauncher will render on.",
    general_hotspots: "SCREEN CORNER HOTSPOTS ACTIVATION",
    general_hotspots_corners: "Active Corners",
    general_hotspots_corners_desc: "Select one or more screen corners to activate the launcher when hovering the cursor.",
    general_hotspots_delay: "Activation Delay Time",
    general_hotspots_delay_desc: "Prevents accidental trigger activations",
    general_hide_on_click: "Hide on Background Click",
    general_hide_on_click_desc: "Clicking the launcher's background area automatically hides it to system tray.",
    general_hide_on_blur: "Hide on Blur / Focus Loss",
    general_hide_on_blur_desc: "Clicking outside of the launcher window automatically minimizes it.",
    general_show_taskbar: "Show Taskbar Tray Icon",
    general_show_taskbar_desc: "Displays the CyberLauncher icon in the Windows taskbar panel.",
    general_reset_on_launch: "Reset View State on Launch",
    general_reset_on_launch_desc: "Clears search query, resets scroll position, and active category to 'ALL' upon launch.",
    
    // Appearance Settings Tab
    app_bg_type: "BACKGROUND TYPE",
    app_bg_image: "Image",
    app_bg_gradient: "Gradient",
    app_bg_solid: "Solid",
    app_bg_desc: "Customize the visual background theme of the launcher.",
    app_blur: "BACKDROP BLUR LEVEL",
    app_blur_desc: "Adjust the background blur intensity to improve readability.",
    app_opacity: "BACKGROUND OPACITY",
    app_opacity_desc: "Control the background transparency of the launcher window.",
    app_scale: "INTERFACE SCALE",
    app_scale_desc: "Adjust the global rendering scale of CyberLauncher UI.",
    
    // System Settings Tab
    sys_startup: "LAUNCH AUTO WITH WINDOWS",
    sys_startup_desc: "Launch CyberLauncher automatically when you log into Windows.",
    sys_blur_hide: "HIDE ON FOCUS LOSS (BLUR HIDE)",
    sys_blur_hide_desc: "Hide the launcher instantly when you click outside its window.",
    sys_animations: "VISUAL EFFECTS & ANIMATIONS",
    sys_animations_desc: "Enable fluid interface motions and premium holographic transitions.",
    
    // Indexer Settings Tab
    idx_title: "GLOBAL NEURO-INDEX",
    idx_desc: "Hybrid indexing file system and application shortcut engine",
    idx_master: "INDEXED SEARCH SERVICE",
    idx_master_desc: "Enable global background file indexing with Everything-grade speed.",
    idx_status_online: "SYSTEM ONLINE",
    idx_status_offline: "DISABLED",
    idx_status_label: "ENGINE STATUS",
    idx_status_registered: "INDEXED FILES",
    idx_scan_depth: "SCAN DEPTH LEVEL",
    idx_scan_depth_desc: "Higher levels search deeper directories but consume more temp space during initial run.",
    idx_drives_detected: "DETECTED SYSTEM DRIVES",
    idx_drives_none: "No logical system drives detected.",
    idx_folders_authorized: "AUTHORIZED DIRECTORIES TO INDEX",
    idx_add_folder: "ADD DIRECTORY",
    
    // Windows Store Settings Tab
    uwp_title: "UWP & MSIX APPLICATIONS",
    uwp_desc: "Native Windows Store sandbox application management (AUMID)",
    uwp_scan_btn: "SCAN WINDOWS STORE",
    uwp_scan_desc: "Automatically discover and catalog UWP applications installed in your system.",
    uwp_empty: "No UWP applications cataloged yet. Click 'Scan Windows Store' above to begin.",
    uwp_toast_scan_start: "Starting Windows Store application scan...",
    uwp_toast_scan_success: "Scan successfully completed",
    
    // Context Menu
    ctx_open: "Open",
    ctx_copy: "Copy",
    ctx_cut: "Cut",
    ctx_copy_path: "Copy full path to clipboard",
    ctx_pin_fav: "Pin to CyberLauncher Favorites",
    ctx_pin_bar: "Pin to CyberLauncher Taskbar",
    
    // Placeholder Info Text below input
    hint_console_enter: "Press [Enter] to execute command",
    hint_system_tab: "Press [Tab] to go back to Launcher",
    hint_normal_console: "Type '>' for console or [Tab] to search system files",
    
    // Notifications & Toasts
    notif_drive_linked: "Indexing full drive {drive}...",
    notif_drive_unlinked: "Drive {drive} unlinked",
    notif_indexer_saved: "Search indexer settings saved",
    notif_indexer_error: "Failed to save search indexer settings",
    notif_path_added: "Added path: {path}",
    notif_path_removed: "Removed path: {path}",
    
    // System Status
    stat_online: "ONLINE",
    stat_offline: "OFFLINE",
    stat_level1: "LIGHT (LEVEL 1)",
    stat_level2: "NORMAL (LEVEL 2)",
    stat_level3: "ADVANCED (LEVEL 3)",
    stat_level4: "FULL (LEVEL 4)",
  }
};

export type TranslationKey = keyof typeof translations.es;
