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
- **Lanzamiento instantáneo**: abre cualquier app, carpeta, archivo o documento, acceso directo (`.lnk`) o URL con un solo clic o Intro
- **Búsqueda difusa**: empieza a escribir para filtrar al instante tu biblioteca de apps (sin necesidad de coincidencia exacta)
- **Paleta de comandos**: presiona `Ctrl+K` para ejecutar comandos del lanzador y navegar al instante
- **Búsqueda de archivos en todo el sistema**: el motor de índice híbrido encuentra archivos, carpetas y apps en todas las unidades
- **Soporte UWP / Windows Store**: escanea, importa y lanza apps UWP y MSIX de forma nativa mediante AUMID
- **Cyber Terminal**: escribe `>` en la búsqueda para abrir una sesión persistente e interactiva de PowerShell o CMD dentro del panel. Escribe en el prompt, usa el historial nativo y programas interactivos, y cambia de shell desde la barra.

### 📂 Organización
- **Categorías personalizadas**: organiza apps en categorías con código de color y edición en línea
- **Barra lateral colapsable**: contrae la barra de categorías a un riel compacto de 52px con `Ctrl+B` o al pasar el cursor
- **Favoritos y reordenar con arrastrar**: fija tus apps más usadas y reordénalas con arrastre fluido en tiempo real
- **Barra de tareas**: barra inferior personalizable con apps ancladas de acceso rápido
- **Paneles redimensionables**: arrastra para redimensionar la barra lateral de categorías y el panel de más usadas

### 🎯 Activación
- **Atajo global**: muestra u oculta con un atajo de teclado personalizable (predeterminado: `Alt+Shift+L`)
- **Esquinas activas (detección por monitor)**: activa el lanzador llevando el cursor a cualquier esquina de la pantalla. Incluye supresión inteligente en pantalla completa: ignora esquinas en monitores con videos o juegos a pantalla completa para evitar interrupciones, mientras tus demás monitores siguen respondiendo con normalidad.
- **Soporte multi-monitor**: elige en qué pantalla aparece CyberLauncher (incluido "Seguir al cursor")
- **Ocultar al perder el foco**: el lanzador se oculta automáticamente al cambiar a otra ventana

### 🤖 Compañero CyberBot
- **Compañero animado**: CyberBot comparte comentarios contextuales al abrir apps, avisos del sistema, cuentas regresivas de tareas programadas y consejos desde el lanzador.
- **Personaliza la experiencia**: Elige un nombre, mueve a CyberBot, ajusta su nivel de interacción y define un horario silencioso. Descansa tras 90 segundos sin actividad en el lanzador y despierta cuando vuelves.
- **No es un chatbot**: CyberBot usa mensajes contextuales integrados. Puedes desactivarlo en `Ajustes → CyberBot`; los banners de respaldo pueden mostrar avisos en su lugar.

### 📊 Sistema y monitorización
- **Monitor del sistema**: uso de RAM, CPU y disco en tiempo real en la barra superior
- **Centro de energía del sistema**: acceso rápido a Apagar, Reiniciar, Suspender y Bloquear con cuenta regresiva de seguridad de 10s
- **HUD de almacenamiento**: espacio libre y estado de todas las unidades del sistema
- **Programador de ejecuciones**: programa lanzamientos de apps o comandos con alertas flotantes independientes en el escritorio
- **Historial de ejecución**: registra y reabre todo lo que has lanzado, con opción de limpiar el historial
- **Copias de seguridad automáticas**: copias de seguridad recurrentes programables con políticas de retención

### 🎨 Personalización
- **Temas**: imágenes de fondo, degradados, colores sólidos, intensidad del cristal y controles de opacidad
- **Escala de la interfaz**: ajusta el tamaño de la interfaz a tu gusto
- **Interfaz bilingüe**: interfaz completa en inglés y español con selector de idioma instantáneo

### ⚡ Usuarios avanzados
- **Modo portable**: ejecuta CyberLauncher sin instalación, almacenando la configuración junto al ejecutable
- **Ejecutar como Administrador**: opción por app para solicitar privilegios elevados al iniciar
- **Atajos globales por app**: asigna atajos personalizados para lanzar cualquier app desde cualquier lugar
- **Arrastrar y soltar desde el Explorador**: arrastra aplicaciones, carpetas o cualquier archivo directamente al lanzador para agregarlos como accesos directos
- **Actualizaciones automáticas**: comprobación y descarga automáticas mediante GitHub releases
- **Exportar / Importar**: copia de seguridad y restauración de toda tu configuración en JSON
- **Instancia única**: solo se ejecuta una instancia; un segundo lanzamiento enfoca la ventana existente
- **Iniciar con Windows**: opcionalmente arranca minimizado o visible al arrancar el sistema
---

## 🚀 Primeros pasos

### Instalación (recomendada)

1. Descarga el instalador más reciente desde [Releases](https://github.com/CyberGems/CyberLauncher/releases/latest)
2. Ejecuta el instalador `.exe` y sigue el asistente de instalación
3. Inicia CyberLauncher. No necesitas ningún otro requisito: **no** necesitas Node.js ni Git

### 🛡️ Windows SmartScreen

Windows puede mostrar un aviso de SmartScreen la primera vez que ejecutas el instalador de CyberLauncher: esta es una app de hobby sin firmar, así que Windows aún no ha construido reputación para el archivo. Esto es esperado; el código fuente es público para que puedas inspeccionar exactamente qué hace.

Para continuar:

<details>
<summary><strong>Cómo ejecutar el instalador (paso a paso)</strong></summary>

Windows muestra este aviso para cualquier instalador sin un certificado de firma de código de pago; no significa que el archivo sea inseguro. No hagas clic en "No ejecutar":

1. Ejecuta el instalador. Windows puede mostrar el diálogo azul "Windows protegió tu PC".

![Aviso de Windows SmartScreen](https://cybergems.org/branding/smartscreen-warning.svg)

2. Haz clic en el pequeño enlace **Más información**.

![Diálogo de SmartScreen tras Más información](https://cybergems.org/branding/smartscreen-runanyway.svg)

3. Haz clic en **Ejecutar de todos modos**. El instalador arranca con normalidad.

Puedes verificar el archivo de forma independiente: compara el SHA con el release de GitHub, escanéalo en VirusTotal o compila desde el código fuente. Más detalles: [guía de SmartScreen en el sitio web](https://cybergems.org/download#smartscreen).

</details>

---

## 🛠️ Stack tecnológico y arquitectura

- **Plataforma:** Windows (objetivo principal)
- **Framework:** Electron 42 + React 19 + TypeScript
- **Bundler:** Vite 6
- **Estilos:** Tailwind CSS 4 + Motion (Framer Motion)
- **Instalador:** electron-builder (NSIS)
- **Actualizador:** electron-updater (GitHub releases)

```
CyberLauncher/
├── electron/
│   ├── main.ts            Proceso principal de Electron (ventana, bandeja, IPC, hotspots, indexador)
│   ├── preload.ts         Puente de contexto (API IPC expuesta al renderer)
│   ├── display-resolve.ts Lógica de resolución de pantalla multi-monitor
│   └── updater.ts         Actualización automática vía electron-updater + GitHub Releases
├── scripts/
│   └── generate-icons.mjs Pipeline de generación de iconos (sharp)
├── src/
│   ├── App.tsx            Aplicación React principal (toda la lógica de UI)
│   ├── main.tsx           Punto de entrada de React
│   ├── index.css          Estilos globales, Tailwind, imports de fuentes
│   ├── locales.ts         i18n (inglés / español)
│   ├── AboutModal.tsx     Diálogo Acerca de y actualizaciones
│   └── Tooltip.tsx        Componente de tooltip reutilizable
├── public/                Recursos estáticos e iconos
├── vite.config.ts         Configuración de Vite + plugin de Electron
└── tsconfig.json          Configuración de TypeScript
```

### Compilar desde el código fuente (desarrolladores)

Solo necesario si quieres modificar CyberLauncher o compilarlo tú mismo; los usuarios normales pueden omitir esta sección.

#### Requisitos previos

- [Node.js](https://nodejs.org/) v18+
- [Git](https://git-scm.com/)

#### Desarrollo

```bash
git clone https://github.com/CyberGems/CyberLauncher.git
cd CyberLauncher
npm install
npm run dev
```

#### Compilación para producción

```bash
npm run build:electron
```

El instalador quedará en el directorio `release/`.

#### Análisis de código

```bash
npm run lint
```
---

## ⌨️ Atajos de teclado

| Tecla | Acción |
|---|---|
| `Alt+Shift+L` | Mostrar/ocultar CyberLauncher (personalizable) |
| `Ctrl+J` | Abrir/cerrar Cyber Terminal |
| `Intro` | Lanzar la app seleccionada / ejecutar el comando en el prompt |
| `Ctrl+C` (en la terminal) | Interrumpir el comando activo |
| `Alt+Q` (en la terminal) | Cerrar Cyber Terminal |
| `Alt+1` / `Alt+2` (en la terminal) | Cambiar a PowerShell / CMD |
| `Alt+I` / `Alt+C` / `Alt+V` (en la terminal) | Interrumpir / copiar / pegar |
| `Alt+O` / `Alt+E` (en la terminal) | Abrir carpeta actual / terminal externa |
| `Alt+L` / `Alt+R` (en la terminal) | Limpiar pantalla / reiniciar una sesión cerrada |
| `Ctrl+Shift+C` / `Ctrl+Shift+V` (en la terminal) | Copiar selección / pegar |
| `Escape` | Cerrar el menú / limpiar la búsqueda; en la terminal, enviar Escape a la shell |
| `↑` `↓` | Navegar por los resultados de búsqueda |
| `←` `→` | Navegar por el menú de la barra lateral |
| `Ctrl+←` / `Ctrl+→` | Cambiar el filtro de búsqueda (Mixto / Apps / Carpetas / Archivos) |
| `Tab` (en la búsqueda del sistema) | Volver a la búsqueda normal del lanzador |

---

## ❤️ Donar

Tras incontables horas construyendo y perfeccionando **CyberLauncher** para mi propio uso, decidí recientemente compartirlo con el mundo junto a mis otras herramientas de código abierto en [CyberGems](https://github.com/CyberGems#-all-apps--repositories).

Si te gustaría apoyar las futuras actualizaciones, te lo agradecería de verdad. Tu donación ayuda a mantener el desarrollo, lanzar nuevas funciones, acelerar la resolución de actualizaciones y errores, y mejorar la calidad de la documentación. También puedes mostrar tu apoyo [poniendo una estrella al repo en GitHub](https://github.com/CyberGems/CyberLauncher). ¡Gracias! 🙏

<p align="center">
  <a href="https://www.paypal.com/donate/?hosted_button_id=M4PY3UPJA5Y6Q"><img src="https://img.shields.io/badge/Donar-PayPal-0070BA?style=for-the-badge&logo=paypal" alt="Donar con PayPal" /></a>
</p>

<p align="center">
  <a href="https://ko-fi.com/cybergems"><img src="https://img.shields.io/badge/Apóyame_en_Ko--fi-FF5E5B?style=for-the-badge&logo=ko-fi&logoColor=white" alt="Apóyame en Ko-fi" /></a>
</p>

<p align="center">
  <a href="https://buymeacoffee.com/cybergems"><img src="https://img.shields.io/badge/Invítame_a_un_café-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Invítame a un café" /></a>
</p>

<div align="center">

<details>
<summary><b>Donaciones cripto (BTC, ETH, USDT, LTC): haz clic para ver las direcciones</b></summary>

| Activo | Dirección | QR |
|---|---|---|
| **BTC** | <pre><code>bc1q5mxzz05nmvsheqzx7970euswta3fksxzcfzag4</code></pre> | <img src="docs/donate/qr-btc.png" width="90" height="90" alt="QR de BTC" /> |
| **ETH** | <pre><code>0x79b703Ec0f77493679Fcd280aF3b983E20c580B8</code></pre> | <img src="docs/donate/qr-eth.png" width="90" height="90" alt="QR de ETH" /> |
| **USDT (ERC20 / BEP20)** | <pre><code>0x79b703Ec0f77493679Fcd280aF3b983E20c580B8</code></pre> | <img src="docs/donate/qr-eth.png" width="90" height="90" alt="QR de USDT" /> |
| **USDT (TRC20)** | <pre><code>TSVbSk1HSyZ1NprCnAYiw56ECwXgH887mD</code></pre> | <img src="docs/donate/qr-usdt-tron.png" width="90" height="90" alt="QR de USDT TRC20" /> |
| **LTC** | <pre><code>LWGnEHgcFCE2BRkzLnsdPDD8Y8ZeDK577X</code></pre> | <img src="docs/donate/qr-ltc.png" width="90" height="90" alt="QR de LTC" /> |

> ⚠️ Envía solo el activo seleccionado en la red indicada. Usar la red incorrecta provocará la pérdida permanente de fondos.

</details>

</div>

---

## 📄 Licencia

CyberLauncher se distribuye bajo los términos de la Licencia Pública General GNU v3.0. Consulta [LICENSE](./LICENSE) para el texto completo de la licencia.

Copyright (C) 2026 CyberGems

---

## ❓ Preguntas frecuentes

Para preguntas frecuentes, guías de solución de problemas e instrucciones detalladas de configuración, visita las [Preguntas frecuentes](https://github.com/CyberGems/CyberLauncher/wiki/FAQ) o la [documentación en línea](https://cybergems.org/docs/cyberlauncher/FAQ).

---

<div align="center" style="background:#0D0F17; border:1px solid rgba(0,255,255,0.12); border-radius:12px; padding:28px 20px; margin-top:32px;">

### ¡Gracias por usar CyberLauncher! 🎉

Creado por [**CyberGems**](https://cybergems.org)

</div>
<p align="center">
  <a href="https://www.reddit.com/submit?url=https%3A%2F%2Fcybergems.org%2Fapps%2Fcyberlauncher%2F&title=CyberLauncher%3A%20herramienta%20de%20escritorio%20gratuita%20y%20de%20c%C3%B3digo%20abierto%20para%20Windows"><img src="https://img.shields.io/badge/Compartir_en_Reddit-FF4500?style=for-the-badge&logo=reddit&logoColor=white" alt="Compartir en Reddit" /></a>
  &nbsp;<a href="https://twitter.com/intent/tweet?text=CyberLauncher%3A%20herramienta%20de%20escritorio%20gratuita%20y%20de%20c%C3%B3digo%20abierto%20para%20Windows&url=https%3A%2F%2Fcybergems.org%2Fapps%2Fcyberlauncher%2F"><img src="https://img.shields.io/badge/Compartir_en_X-1DA1F2?style=for-the-badge&logo=x&logoColor=white" alt="Compartir en X" /></a>
  &nbsp;<a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fcybergems.org%2Fapps%2Fcyberlauncher%2F"><img src="https://img.shields.io/badge/Compartir_en_Facebook-1877F2?style=for-the-badge&logo=facebook&logoColor=white" alt="Compartir en Facebook" /></a>
  &nbsp;<a href="mailto:?subject=CyberLauncher%3A%20herramienta%20de%20escritorio%20gratuita%20y%20de%20c%C3%B3digo%20abierto%20para%20Windows&body=CyberLauncher%3A%20herramienta%20de%20escritorio%20gratuita%20y%20de%20c%C3%B3digo%20abierto%20para%20Windows%20https%3A%2F%2Fcybergems.org%2Fapps%2Fcyberlauncher%2F"><img src="https://img.shields.io/badge/Compartir_por_Email-EA4335?style=for-the-badge&logo=gmail&logoColor=white" alt="Compartir por correo" /></a>
  &nbsp;<a href="https://t.me/share/url?url=https%3A%2F%2Fcybergems.org%2Fapps%2Fcyberlauncher%2F&text=CyberLauncher%3A%20herramienta%20de%20escritorio%20gratuita%20y%20de%20c%C3%B3digo%20abierto%20para%20Windows"><img src="https://img.shields.io/badge/Compartir_en_Telegram-26A5E4?style=for-the-badge&logo=telegram&logoColor=white" alt="Compartir en Telegram" /></a>
  &nbsp;<a href="https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fcybergems.org%2Fapps%2Fcyberlauncher%2F"><img src="https://img.shields.io/badge/Compartir_en_LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="Compartir en LinkedIn" /></a>
</p>

---

## 🔗 Ver también

Más aplicaciones gratuitas, de código abierto y con la privacidad primero de [**CyberGems**](https://github.com/CyberGems):

| App | Descripción |
|:---:|---|
| 🕐&nbsp;[**CyberClock**](https://github.com/CyberGems/CyberClock#readme) | Reloj de escritorio con analógico y digital, calendario, temporizador, cronómetro y módulo de relajación. |
| 📢&nbsp;[**CyberFeeds**](https://github.com/CyberGems/CyberFeeds#readme) | Lector RSS y Atom de alto rendimiento y local-first, creado para la velocidad, la privacidad y la lectura limpia. |
| 💻&nbsp;[**CyberManager**](https://github.com/CyberGems/CyberManager#readme) | Gestor de tareas ligero y de alto rendimiento, virtualizado y nativo de NT, una potente alternativa al Administrador de Tareas. |
| 📝&nbsp;[**CyberNotes**](https://github.com/CyberGems/CyberNotes#readme) | App de notas centrada en la privacidad con texto enriquecido, carpetas, pestañas y almacenamiento local protegido con bcrypt. |
| ⚡&nbsp;[**CyberPaste**](https://github.com/CyberGems/CyberPaste#readme) | Gestor de portapapeles con la privacidad primero para texto, código, imágenes, HTML y archivos. |
| 📸&nbsp;[**CyberSnap**](https://github.com/CyberGems/CyberSnap#readme) | Suite de captura y anotación de pantalla con herramientas vectoriales, OCR de alta velocidad, grabación de pantalla y selector de color. |
| ⭐&nbsp;[**CyberTray**](https://github.com/CyberGems/CyberTray#readme) | Lanzador de bandeja de alto rendimiento con hotspots, monitoreo de sistema, gestor de procesos y bóveda de archivos protegida con PIN. |
| 💫&nbsp;[**CyberViewer**](https://github.com/CyberGems/CyberViewer#readme) | Visor y editor de imágenes completo diseñado para usuarios casuales y avanzados. |
| 🛡️&nbsp;[**CyberWall**](https://github.com/CyberGems/CyberWall#readme) | Cortafuegos de Windows fácil de usar con reglas por aplicación en tiempo real gracias al motor kernel WFP. |

➡️ **[Todas las aplicaciones en cybergems.org](https://cybergems.org)**
