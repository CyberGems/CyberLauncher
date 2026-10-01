<p align="center">
  <a href="./README.md">English</a> · Español
</p>

<p align="center">
  <a href="https://cybergems.org/apps/cyberlauncher/">
    <img src="https://cybergems.org/banners/es/cyberlauncher.png" alt="CyberLauncher: lanzador rápido y personalizable de apps, archivos y comandos" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/CyberGems/CyberLauncher/releases/latest"><img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FCyberGems%2FCyberLauncher%2Fmain%2Fpackage.json&query=%24.version&prefix=%20Descargar%20CyberLauncher%20v&suffix=%20&style=for-the-badge&label=&labelColor=0891B2&color=0891B2" alt="Descargar la última versión" /><img src="https://img.shields.io/badge/Windows_10%2F11_(64--bit)-2563EB?style=for-the-badge" alt="Windows 10/11 (64 bits)" /></a>
  &nbsp;<a href="https://github.com/CyberGems/CyberLauncher/releases"><img src="https://img.shields.io/badge/Todas_las_versiones-30363D?style=for-the-badge&logo=github&logoColor=white" alt="Todas las versiones" /><img src="https://img.shields.io/badge/Notas_de_la_versi%C3%B3n-475569?style=for-the-badge" alt="Notas de la versión" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Licencia-GPL--3.0-1F2428.svg?style=flat-square&color=334155" alt="Licencia" />&nbsp;
  <img src="https://img.shields.io/badge/Plataforma-Windows_10%2F11-1F2428.svg?style=flat-square&color=334155" alt="Plataforma" />&nbsp;
  <img src="https://img.shields.io/badge/Electron-42-1F2428.svg?style=flat-square&logo=electron&logoColor=white&color=334155" alt="Electron" />&nbsp;
  <a href="https://github.com/CyberGems/CyberLauncher/wiki"><img src="https://img.shields.io/badge/Wiki-Documentaci%C3%B3n-1F2428?style=flat-square&logo=gitbook&logoColor=white&color=334155" alt="Wiki" /></a>
</p>

---

## ¿Qué es CyberLauncher?

CyberLauncher es un lanzador de aplicaciones a pantalla completa que convierte buscar y abrir cosas en Windows en un flujo de trabajo rápido y con teclado. Busca aplicaciones y archivos, organiza favoritos y categorías, invoca el lanzador con un atajo global o esquinas calientes, y automatiza lanzamientos recurrentes con el programador. El monitor de sistema integrado, las herramientas de comandos, los extensos controles de apariencia y una elegante interfaz de cristal lo convierten tanto en una alternativa práctica al menú Inicio como en un centro de comandos de escritorio personalizable. Construido con **Electron + React + TypeScript**.

*Gratuito y de código abierto (GPLv3): sin anuncios, sin rastreo y sin recogida de datos. Solo disfrútalo.*

---

## 🚀 ¿Por qué CyberLauncher?

CyberLauncher agiliza el lanzamiento de apps desde cero: **escribe para buscar, atajo para invocar, clic para lanzar**. Se acabó hurgar en carpetas anidadas o desplazarte por menús atiborrados.

| Necesidad | Solución |
|---|---|
| Lanzamiento rápido de apps | Lanzador a pantalla completa con teclado y búsqueda difusa instantánea |
| Encuentra cualquier cosa en tu PC | Motor de índice híbrido: búsqueda de archivos al estilo Everything en todas las unidades |
| Mantente organizado | Categorías con código de color, barra de favoritos, reordenar con arrastrar, anclajes a la barra de tareas |
| Lanza desde cualquier lugar | Atajo global, esquinas calientes, atajos personalizados por app |
| Sigue tu flujo de trabajo | Historial de ejecución, lanzamientos programados, ejecutor de comandos de consola |
| Hazlo tuyo | Imágenes de fondo, degradados, efectos de cristal, opacidad, escala de la interfaz |

---

## ✨ Funciones principales

### 🔍 Lanzamiento y búsqueda
- **Lanzamiento instantáneo**: abre cualquier app, acceso directo (`.lnk`) o URL con un solo clic o Intro
- **Búsqueda difusa**: empieza a escribir para filtrar al instante tu biblioteca de apps (sin necesidad de coincidencia exacta)
- **Búsqueda de archivos en todo el sistema**: el motor de índice híbrido encuentra archivos, carpetas y apps en todas las unidades
- **Soporte UWP / Windows Store**: escanea, importa y lanza apps UWP y MSIX de forma nativa mediante AUMID
- **Modo consola**: escribe `>` en la búsqueda para ejecutar comandos del shell directamente

### 📂 Organización
- **Categorías personalizadas**: organiza apps en categorías con código de color y edición en línea
- **Favoritos y reordenar con arrastrar**: fija tus apps más usadas y reordénalas con arrastrar y soltar
- **Barra de tareas**: barra inferior personalizable con apps ancladas de acceso rápido
- **Paneles redimensionables**: arrastra para redimensionar la barra lateral de categorías y el panel de más usadas

### 🎯 Activación
- **Atajo global**: muestra u oculta con un atajo de teclado personalizable (predeterminado: `Alt+Shift+L`)
- **Esquinas activas (detección por monitor)**: activa el lanzador llevando el cursor a cualquier esquina de la pantalla. Incluye supresión inteligente en pantalla completa: ignora esquinas en monitores con videos o juegos a pantalla completa para evitar interrupciones, mientras tus demás monitores siguen respondiendo con normalidad.
- **Soporte multi-monitor**: elige en qué pantalla aparece CyberLauncher (incluido "Seguir al cursor")
- **Ocultar al perder el foco**: el lanzador se oculta automáticamente al cambiar a otra ventana

### 📊 Sistema y monitorización
- **Monitor del sistema**: uso de RAM, CPU y disco en tiempo real en la barra superior
- **HUD de almacenamiento**: espacio libre y estado de todas las unidades del sistema
- **Programador de ejecuciones**: programa lanzamientos de apps o comandos de consola con temporizador de cuenta regresiva
- **Historial de ejecución**: registra y reabre todo lo que has lanzado, con opción de limpiar el historial

### 🎨 Personalización
- **Temas**: imágenes de fondo, degradados, colores sólidos, intensidad del cristal y controles de opacidad
- **Escala de la interfaz**: ajusta el tamaño de la interfaz a tu gusto
- **Interfaz bilingüe**: interfaz completa en inglés y español con selector de idioma instantáneo

### ⚡ Usuarios avanzados
- **Ejecutar como Administrador**: opción por app para solicitar privilegios elevados al iniciar
- **Atajos globales por app**: asigna atajos personalizados para lanzar cualquier app desde cualquier lugar
- **Arrastrar y soltar desde el Explorador**: arrastra archivos `.exe` o `.lnk` directamente al lanzador para añadirlos
- **Actualizaciones automáticas**: comprobación y descarga automáticas mediante GitHub releases
- **Exportar / Importar**: copia de seguridad y restauración de toda tu configuración en JSON
- **Instancia única**: solo se ejecuta una instancia; un segundo lanzamiento enfoca la ventana existente
- **Iniciar con Windows**: opcionalmente arranca minimizado o visible al arrancar el sistema