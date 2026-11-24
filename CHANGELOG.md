# Changelog

All notable changes to CyberLauncher are documented here.

## [1.17.0] - 2026-11-24

### 🇺🇸 English

- **Independent CyberBot controls.** Enable the built-in assistant and floating search separately. Open or hide floating search from the tray or its customizable shortcut (`Alt+Shift+B` by default). The launcher and widget switch without overlapping.
- **Readable system alerts.** Show system notices and countdowns immediately, keep long desktop text scrollable, and prevent duplicate desktop health alerts or a second bubble on dismissal. Conversations retain the typing effect.
- **One update notice.** Check, download, cancel a download, or restart to install from one notice, with progress and expandable release notes. Settings controls automatic update notices, and About can start a manual check.
- **Clear global shortcuts.** Use the broom button to disable launcher, floating CyberBot, or per-app shortcuts. Empty controls display Disabled, and the clear and reset buttons share the same style.
- **Consistent settings.** Give all six tabs matching introductions, neutral icons and shared control styles. Clearly label both CyberBot sections and show save feedback and a branded footer.
- **Clearer titlebar and search.** Move launcher tools into the titlebar, preserve the search field and resource values when space allows, and refine focus, spacing and divider feedback. The CyberBot toggle previews its crossed-out icon on a fresh hover.
- **Keyboard and tray behavior.** Keep `Alt+F4` available for Exit, clarify the minimize-to-tray gesture, focus the More menu on keyboard opening, and prevent stale menu tooltips and stuck Alt state. The tray tooltip truncates unusually long shortcuts.
- **Privacy and AI documentation.** Publish bilingual privacy and AI disclosures and document how the project verifies and uses AI-assisted work.

### 🇪🇸 Español

- **Controles independientes de CyberBot.** Activa por separado el asistente integrado y el buscador flotante. Abre u oculta el buscador desde la bandeja o con su atajo configurable (`Alt+Shift+B` por defecto). El lanzador y el widget se alternan sin solaparse.
- **Avisos de sistema legibles.** Muestra avisos y cuentas regresivas de inmediato, permite desplazar los textos largos en el escritorio y evita alertas de salud duplicadas o una segunda burbuja al cerrar. Las conversaciones conservan el efecto de escritura.
- **Un solo aviso de actualización.** Busca, descarga, cancela la descarga o reinicia para instalar desde un mismo aviso, con progreso y notas desplegables. Configuración controla los avisos automáticos y Acerca de permite iniciar una búsqueda manual.
- **Limpieza de atajos globales.** Usa la escobilla para desactivar los atajos del lanzador, CyberBot flotante o un acceso individual. Los campos vacíos muestran Desactivado, y los botones de limpiar y restablecer comparten estilo.
- **Configuración uniforme.** Las seis pestañas comparten introducciones, íconos neutros y estilos de controles. Las secciones de CyberBot se distinguen por su encabezado, y el panel muestra la confirmación de guardado y un pie con la marca.
- **Barra de título y búsqueda más claras.** Las herramientas pasan a la barra de título. El buscador y los valores de recursos se conservan cuando hay espacio, con ajustes de foco, espaciado y divisores. El toggle de CyberBot muestra el ícono tachado al volver a entrar con el cursor.
- **Comportamiento del teclado y la bandeja.** Mantiene `Alt+F4` disponible para salir, aclara el gesto de minimizar a la bandeja, enfoca el menú Más cuando se abre con el teclado y evita tooltips obsoletos y el estado Alt atascado. El tooltip de bandeja recorta atajos demasiado largos.
- **Documentación de privacidad e IA.** Publica avisos bilingües de privacidad y uso de IA, y documenta cómo se usa y verifica el trabajo asistido por IA.

## [1.16.2] - 2026-11-19

### 🇺🇸 English

- Fix system tray menu flicker on repeated opens and position jumps when switching between mixed-DPI monitors by destroying and prewarming the tray window with a two-step transparent reveal, and align the flyout gap to `4px`.
- Add an `Exit CyberLauncher` action to the titlebar More menu.

### 🇪🇸 Español

- Corrige el parpadeo del menú de bandeja en aperturas repetidas y los saltos de posición al cambiar entre monitores con DPI mixto destruyendo y precalentando la ventana con revelado transparente en dos pasos, y ajusta el espacio de los flyouts a `4px`.
- Añade la opción `Salir de CyberLauncher` al menú Más de la barra de título.

## [1.16.1] - 2026-11-18

### 🇺🇸 English

- Convert the tray submenus (`Help` and `More from CyberGems`) into side-by-side flyout panels with dwell hover, click toggling, automatic monitor-edge placement, and keyboard arrow navigation, and point the tray Donate link directly to the repository section.
- Sandbox popup windows (`tray`, `pin tip`, and `desktop toast`), share a navigation lock across windows, validate renderer and tray URLs before passing them to the shell, rebuild dead tray renderers on reopen, and show startup failures in a dialog.

### 🇪🇸 Español

- Convierte los submenús de la bandeja (`Ayuda` y `Más de CyberGems`) en paneles flyout laterales con retardo hover, alternancia por clic, colocación automática según el monitor y navegación con flechas del teclado, y apunta el enlace Donar de la bandeja a la sección del repositorio.
- Aísla las ventanas emergentes en sandbox (`bandeja`, `aviso de fijar` y `toast de escritorio`), comparte bloqueo de navegación entre ventanas, valida enlaces antes de abrirlos en el sistema, reconstruye renderizadores de bandeja caídos y muestra errores de inicio en un diálogo.

## [1.16.0] - 2026-11-17

### 🇺🇸 English

- Add the floating CyberBot: a collapsible, draggable bubble that opens shortcut search in its own window from the global shortcut, sleeps with idle expressions and a chest meter, keeps its bounds stable across monitor DPI changes, and suspends while the launcher is visible.
- Add power action scheduling with a countdown chip, custom minutes confirmed with Enter, an apply-now button, persistence across restarts, and a reminder when the window hides to the tray.
- Move Microsoft Store imports to a standalone branded dialog with discovery progress, duplicate merging, pin options, and a recovery modal that searches the Store for missing apps.
- Adopt the Outfit typeface for the app and tray branding, move launcher layout controls to the top of Appearance, and group display settings into that tab.
- Batch shell icon extraction into one PowerShell process, preserve icon transparency, and self-heal black-boxed cached icons.
- Pause hide-on-blur while any modal or blocking overlay is open, and fix power schedule toast collisions with the CyberBot popup.
- Persist scheduled tasks and embed indexer settings in exports and backups.
- Ship winget manifests with every release and automate Windows Package Manager submissions.

### 🇪🇸 Español

- Añade el CyberBot flotante: una burbuja plegable y arrastrable que abre la búsqueda de accesos en su propia ventana desde el atajo global, duerme con expresiones de inactividad y un medidor en el pecho, mantiene sus límites estables entre cambios de DPI del monitor y se suspende mientras el lanzador está visible.
- Añade la programación de acciones de energía con chip de cuenta atrás, minutos personalizados confirmados con Enter, botón de aplicar ahora, persistencia entre reinicios y aviso al ocultar la ventana en la bandeja.
- Pasa las importaciones de Microsoft Store a un diálogo independiente con la marca, progreso de descubrimiento, fusión de duplicados, opciones de anclaje y un modal de recuperación que busca en la Store las apps desaparecidas.
- Adopta la tipografía Outfit para la marca de la app y la bandeja, mueve los controles del diseño del lanzador al inicio de Apariencia y agrupa los ajustes de pantalla en esa pestaña.
- Agrupa la extracción de iconos del Shell en un solo proceso de PowerShell, conserva la transparencia y autocura las cachés en negro.
- Pausa la ocultación al perder el foco mientras haya diálogos o superposiciones bloqueantes, y corrige las colisiones del toast de programación con la ventana de CyberBot.
- Persiste las tareas programadas e incrusta los ajustes del indexador en exportaciones y copias.
- Publica manifiestos winget con cada release y automatiza los envíos al Windows Package Manager.

## [1.15.0] - 2026-11-14

### 🇺🇸 English

- **Bilingual Onboarding & Starter Setup**: Added a first-run wizard with language sync, curated starter items (5 categories, 5 favorites, 5 taskbar pins), and optional CyberBot Assistant activation, plus factory reset with confirmation.
- **Portable Backups Across PCs**: Automatic backups (3 retained copies by default) and manual JSON exports now embed custom local icons and wallpapers, pruning unused imported backgrounds on restore or removal.
- **Original Backgrounds & Installer Artwork**: Added original 16:9 CyberLauncher wallpapers with a visual thumbnail selector and a dark suite-aligned NSIS installer sidebar.
- **Suite-Standard UI & Text Context Menus**: Added a shared bilingual context menu (Undo, Redo, Cut, Copy, Paste, Select All, Delete) across every editable text field, standardized custom selects, checkboxes, and toggle switches, unified CyberBot command bubbles, calmed modal glows, and matched tray popup controls.
- **Smarter Organization & Window Behavior**: Updated `All` to `All Items` / `Todo` with aligned section icons, added a collapsible `FAVORITES` header with count badge and tooltip, disabled hide-on-blur by default so launches stay focused on explicit opens, and synchronized maximized taskbar bounds.
- **Scheduler, UWP & Missing-Target Polish**: Redesigned the analog clock dial with the etched CyberLauncher watermark and larger digital readout, replaced the placeholder dropdown item with inline shortcut search, prioritized app name/icon with session category memory in UWP imports, and added locate/delete recovery when a shortcut target is missing.

### 🇪🇸 Español

- **Configuración Inicial Bilingüe**: Nuevo asistente de primera ejecución con sincronización de idioma, accesos iniciales curados (5 categorías, 5 favoritos, 5 anclajes en barra) y activación opcional del Asistente CyberBot, junto al restablecimiento de fábrica con confirmación.
- **Respaldos Portables Entre Equipos**: Las copias automáticas (3 copias por defecto) y exportaciones JSON incrustan iconos personalizados y fondos locales, limpiando fondos importados huérfanos al restaurar o eliminar.
- **Fondos Originales y Barra del Instalador**: Nuevos fondos 16:9 propios con selector visual por miniaturas y barra lateral oscura para el instalador NSIS alineada con la suite.
- **Controles de la Suite y Menú Contextual de Texto**: Menú contextual bilingüe compartido (Deshacer, Rehacer, Cortar, Copiar, Pegar, Seleccionar todo, Eliminar) en cada campo de texto editable, selectores, casillas y conmutadores estandarizados, globos unificados en CyberBot, brillos moderados en modales y casilla estilizada en el aviso de bandeja.
- **Mejor Organización y Comportamiento de Ventana**: Sección `TODO` / `ALL ITEMS` con icono en cabecera y barra lateral, cabecera `FAVORITOS` plegable con contador y tooltip, ocultar al perder foco desactivado por defecto y ajuste exacto de la barra inferior al maximizar.
- **Programador, UWP y Accesos No Encontrados**: Reloj analógico rediseñado con marca de agua del icono y lectura digital ampliada, buscador inline en el selector de accesos del Programador, diálogo de importación UWP centrado en icono/nombre con memoria de categoría por sesión y modal para reubicar o eliminar accesos rotos.

## [1.14.0] - 2026-10-28

### 🇺🇸 English

- Interactive CyberBot quick command prompt with global shortcut activation, and the companion stays visible on the main panel during idle.
- Automated backups support custom destination folders with flexible retention (1, 3, 5 or 7 copies).
- Tray branding and settings controls receive refined polish.

### 🇪🇸 Español

- Paleta rápida interactiva de CyberBot con activación por atajo global; el compañero permanece visible en el panel principal durante la inactividad.
- Los respaldos automáticos admiten carpeta de destino personalizada con retención flexible (1, 3, 5 o 7 copias).
- Pulido de la marca en la bandeja y de los controles de ajustes.

## [1.13.0] - 2026-10-15

### 🇺🇸 English

- Refined CyberBot design: layered visuals, typed speech, smoother movement and richer idle expressions.
- Inline naming, contextual returns and graceful farewells; status screens appear less often and dialogs behave quieter.
- Microsoft Store apps open without false failure notices.

### 🇪🇸 Español

- Diseño refinado de CyberBot: profundidad visual, texto progresivo, movimiento más suave y expresiones variadas.
- Nombre inline, regresos contextuales y despedidas animadas; las pantallas informativas aparecen menos y los diálogos distraen menos.
- Las apps de Microsoft Store se abren sin falsos avisos de error.

## [1.12.0] - 2026-10-05

### 🇺🇸 English

- CyberBot companion: animated feedback for launches, system notices and practical tips, with a custom name, position, quiet hours and interaction level.
- Interactive PowerShell/CMD terminal inside the launcher.
- Improved app launch guidance plus monitoring and scheduled-task alert refinements.

### 🇪🇸 Español

- Compañero CyberBot: avisos animados al abrir apps, novedades del sistema y consejos, con nombre personalizado, posición, horario silencioso y nivel de interacción.
- Terminal interactiva de PowerShell/CMD dentro del lanzador.
- Mejor guía al abrir apps y refinamientos de monitorización y alertas de tareas programadas.

## [1.11.0] - 2026-10-03

### 🇺🇸 English

- Redesigned installer with custom orbital artwork.
- Skip unwanted updates from toasts or the About modal, and silent background updates on restart.
- Bilingual release notes preview in the interface language with clean in-app changelog rendering.

### 🇪🇸 Español

- Instalador rediseñado con arte orbital personalizado.
- Salta actualizaciones no deseadas desde los avisos o Acerca de, con actualizaciones silenciosas en segundo plano al reiniciar.
- Vista previa bilingüe de las notas en el idioma de la interfaz, con visualización limpia del changelog en la app.

## [1.10.0] - 2026-10-02

### 🇺🇸 English

- Collapsible left sidebar rail and Ctrl+K command palette for faster navigation.
- System power hub with a safety countdown, plus standalone desktop alerts for scheduled launches.
- Customizable automated backups, fluid icon reordering, and an acrylic tray menu.

### 🇪🇸 Español

- Barra lateral colapsable y paleta de comandos Ctrl+K para navegar más rápido.
- Centro de energía del sistema con cuenta regresiva de seguridad y alertas de escritorio independientes para lanzamientos programados.
- Respaldos automáticos personalizables, reordenación fluida de iconos y menú de bandeja acrílico.

## [1.9.2] - 2026-09-07

### 🇺🇸 English

- Tray menu gains a most-recent section, and update notices improve with checksums surfaced in the release notes.
- About window cleanup.

### 🇪🇸 Español

- El menú de la bandeja suma una sección de recientes y los avisos de actualización mejoran con checksums en las notas.
- Limpieza de la ventana Acerca de.

## [1.9.1] - 2026-09-07

### 🇺🇸 English

- Tray menu surfaces the most recent launches.
- Release notes now include checksums.

### 🇪🇸 Español

- El menú de la bandeja muestra los lanzamientos más recientes.
- Las notas del release incluyen checksums.

## [1.9.0] - 2026-09-07

### 🇺🇸 English

- Cyber Terminal: persistent working directory, PowerShell/cmd, command history and cleaner prompts.
- Update notices show a peek of the release notes with a direct link (toast and About).
- Keyboard and search refinements: category hotkeys (including Alt+0), view-mode hotkeys and fewer conflicts.
- Icon refresh (single or bulk), cleaner UWP icons, WS scanner shortcuts, and a fix for random black screens.

### 🇪🇸 Español

- Cyber Terminal: directorio persistente, PowerShell/cmd, historial de comandos y prompts más limpios.
- Los avisos de actualización muestran una vista previa de las notas con enlace directo (toast y Acerca de).
- Refinamientos de teclado y búsqueda: hotkeys de categorías (incluida Alt+0), hotkeys de vistas y menos conflictos.
- Refresco de iconos (individual o por lote), iconos UWP más limpios, accesos de WS scanner y corrección de pantallas en negro.

## [1.8.1] - 2026-08-14

### 🇺🇸 English

- Stabilized tray menu with sharper icons.
- Sidebar branding casing now matches the About title.

### 🇪🇸 Español

- Menú de bandeja estabilizado con iconos más nítidos.
- La marca de la barra lateral coincide con el título de Acerca de.

## [1.8.0] - 2026-08-14

### 🇺🇸 English

- Reduced tray idle CPU usage.
- Refreshed application icon and in-app logo.

### 🇪🇸 Español

- Menor uso de CPU en la bandeja en reposo.
- Icono de la app y logo interno renovados.

## [1.7.0] - 2026-08-07

### 🇺🇸 English

- Optimized idle CPU usage and updated the application icon.
- Advanced and scheduler collapse tooltips, plus a scheduler helper.
- Quit tray icon synced with CyberViewer.

### 🇪🇸 Español

- Uso de CPU en reposo optimizado e icono de la app actualizado.
- Tooltips de colapso en Opciones avanzadas y programador, y un asistente del programador.
- Icono de salida en la bandeja sincronizado con CyberViewer.

## [1.6.0] - 2026-07-31

### 🇺🇸 English

- Clearer grid vs list views and a clearer scheduler access button label.
- Add App flow polish: advanced panel, icon loader after the file dialog closes, and the Uncategorized category.

### 🇪🇸 Español

- Vistas de cuadrícula y lista más diferenciadas y etiqueta más clara en el botón del programador.
- Flujo de Agregar app mejorado: panel avanzado, cargador de iconos tras cerrar el diálogo y la categoría Sin categoría.

## [1.5.2] - 2026-07-31

### 🇺🇸 English

- Per-user NSIS install by default, elevating only when needed.

### 🇪🇸 Español

- Instalación NSIS por usuario por defecto, elevando permisos solo cuando hace falta.

## [1.5.1] - 2026-07-31

### 🇺🇸 English

- Fixed the update toast click and installer artifact naming for GitHub Releases.
- Removed unused legacy background assets to shrink the installer package.

### 🇪🇸 Español

- Corregido el clic del toast de actualización y el nombre del instalador en GitHub Releases.
- Eliminados assets de fondo sin usar para reducir el instalador.

## [1.5.0] - 2026-07-30

### 🇺🇸 English

- Background picker refactor: three packaged presets plus a Browse slot for local custom images.
- Presets ship with the app, so thumbnails survive installation on another PC.
- Lowered default glass intensity and background opacity for a clearer first-run look.

### 🇪🇸 Español

- Selector de fondo renovado: tres presets empaquetados y una ranura Examinar para imágenes locales.
- Los presets viajan con la app, así las miniaturas sobreviven a la instalación en otro PC.
- Intensidad de vidrio y opacidad de fondo predeterminadas más bajas para una primera impresión más clara.

## [1.4.0] - 2026-07-30

### 🇺🇸 English

- Scheduler layout polish and refreshed system and storage HUDs with bilingual labels.
- Fresh installs start empty, and the scheduler gains a retractable status panel for the clock and active tasks.
- Fixed a tray crash on hide-on-blur; softer side drawers and hover feel.

### 🇪🇸 Español

- Pulido del programador y HUDs de sistema y almacenamiento renovados con etiquetas bilingües.
- Las instalaciones nuevas empiezan vacías y el programador estrena panel de estado retráctil para el reloj y las tareas activas.
- Corregido un crash de la bandeja al ocultar en desenfoque; cajones laterales y sensación de hover más suaves.

## [1.3.0] - 2026-07-29

### 🇺🇸 English

- New About modal with a GitHub auto-update pipeline (electron-updater).
- System tray menu restyled after CyberFeeds with bilingual actions.
- Unified sidebar badges, softer favorites hover, and missing control tooltips.

### 🇪🇸 Español

- Modal Acerca de renovado con pipeline de auto-actualización por GitHub (electron-updater).
- Menú de bandeja restilizado tras CyberFeeds con acciones bilingües.
- Insignias de la barra lateral unificadas, hover de favoritos más suave y tooltips que faltaban.

## [1.2.6] - 2026-05-25

### 🇺🇸 English

- App modal pin toggles and collapsible advanced options.
- Indexer hidden-folder settings and search filter counters.

### 🇪🇸 Español

- Fijado de apps en el modal y opciones avanzadas colapsables.
- Ajustes de carpetas ocultas del indexador y contadores en los filtros de búsqueda.

## [1.2.5] - 2026-05-23

### 🇺🇸 English

- Customizable context menu tooltips.
- Updated locales.

### 🇪🇸 Español

- Tooltips del menú contextual personalizables.
- Localizaciones actualizadas.

## [1.2.0] - 2026-05-19

### 🇺🇸 English

- First public release of CyberLauncher: a full-screen, keyboard-driven launcher to organize, search and launch apps from a unified panel.

### 🇪🇸 Español

- Primera versión pública de CyberLauncher: un lanzador a pantalla completa guiado por teclado para organizar, buscar y abrir apps desde un panel unificado.
