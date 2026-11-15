<p align="center">
  <img src="https://raw.githubusercontent.com/CyberGems/CyberLauncher/main/public/icon.png" width="120" alt="CyberLauncher">
</p>

## 📋 CyberLauncher {{VERSION}}: Release Notes

### 🚀 What's new in this release

<!-- IMPORTANT FOR AGENTS & MAINTAINERS: Always rewrite this entire section and highlights with the ACTUAL release notes for this specific new version before tagging. NEVER leave or copy previous version notes! Use 25-45 words for the summary, lead with user-facing changes, and do not repeat the app name or version. Keep the Spanish mirror inside the details block in sync: translate the summary and rewrite the highlights. -->
<!-- changelog-summary:start -->
Bilingual onboarding with starter categories, portable cross-PC backups with embedded icons and wallpapers, original preset art, full editable text context menus, standardized suite controls, missing-target recovery, collapsible favorites, and scheduler search refine the launcher experience.
<!-- changelog-summary:end -->

> **New to CyberLauncher?** A full-screen, keyboard-driven Windows launcher for organizing, searching, and opening apps, files, shortcuts, and console commands from a unified panel.

---

### ✨ Key Features & Highlights

- 🧭 **Bilingual Onboarding & Optional CyberBot Assistant**:
  - First-run wizard sets interface language cleanly and initializes 5 starter categories, 5 favorites, and 5 taskbar pins ready to customize.
  - Opt in to the CyberBot Assistant during setup (or toggle anytime in Settings), backed by factory reset with double confirmation.
  - Fixed-to-screen maximized bounds keep the launcher taskbar flush with the screen edge across monitors.

- 💾 **Portable Backups & Original Visuals**:
  - Automatic backups (default 3 retained copies) and manual JSON exports embed custom local icons and wallpapers so restores match across PCs.
  - Original 16:9 CyberLauncher preset backgrounds paired with crisp thumbnail selection and a dark suite-aligned NSIS installer sidebar.
  - Hide-on-blur is disabled by default on fresh installs so accidental focus changes stay friendly for new users.

- 🎨 **Suite-Standard UI & Organization Upgrades**:
  - Shared styled bilingual context menu (`Undo`, `Redo`, `Cut`, `Copy`, `Paste`, `Select All`, `Delete`) on every editable text field.
  - Standardized custom `ToggleSwitch`, `CustomSelect`, and `Checkbox` controls (including the tray pin popup), unified CyberBot bubbles, and calmed modal glows.
  - Renamed `All` to `All Items` (`Todo` in Spanish) with matching section icons, plus a clickable collapsible `FAVORITES` header with hover chevron and count badge.

- ⏱️ **Scheduler, UWP & Missing-Target Improvements**:
  - Redesigned dark-glass analog clock with etched app watermark and enlarged digital readout alongside inline shortcut filtering inside the Scheduler selector.
  - UWP import dialog highlights app icon and name while remembering the last picked category per session.
  - Missing shortcut modal offers one-click target browsing or direct deletion when paths move.

<details>
<summary><b>🇪🇸 Ver notas de la versión en Español</b></summary>

### 🚀 Novedades de esta versión

La configuración inicial bilingüe con accesos curados, copias portables con iconos y fondos incrustados, fondos originales, menú contextual en todo campo de texto, controles unificados de la suite, recuperación de rutas, favoritos plegables y búsqueda en el Programador refinan el lanzador.

> **¿Nuevo en CyberLauncher?** Un lanzador para Windows a pantalla completa y guiado por teclado para organizar, buscar y abrir apps, archivos, accesos directos y comandos desde un panel unificado.

---

### ✨ Novedades destacadas

- 🧭 **Configuración inicial bilingüe y Asistente CyberBot opcional**:
  - El asistente inicial ajusta el idioma y prepara 5 categorías básicas, 5 favoritos y 5 anclajes en barra listos para personalizar.
  - Permite activar o dejar desactivado el Asistente CyberBot desde el primer inicio, junto a un restablecimiento de fábrica con confirmación.
  - Límites exactos al maximizar para mantener la barra inferior alineada hasta el borde en cualquier monitor.

- 💾 **Copias portables entre equipos y arte original**:
  - Los respaldos automáticos (3 copias por defecto) y exportaciones JSON incrustan iconos personalizados y fondos locales para restaurar todo intacto incluso en otro PC.
  - Fondos 16:9 originales de CyberLauncher con selector de miniaturas nítido y barra lateral oscura para el instalador NSIS acorde a la suite.
  - Ocultar al perder el foco desactivado por defecto en instalaciones nuevas para ofrecer una primera experiencia más cómoda.

- 🎨 **Controles de la suite y mejoras de organización**:
  - Menú contextual bilingüe compartido (`Deshacer`, `Rehacer`, `Cortar`, `Copiar`, `Pegar`, `Seleccionar todo`, `Eliminar`) en todos los campos de texto editables.
  - Controles `ToggleSwitch`, `CustomSelect` y `Checkbox` unificados (incluido el aviso de bandeja), globos consistentes en CyberBot y brillos moderados en modales.
  - Sección renombrada a `Todo` (`All Items` en inglés) con icono en barra y cabecera, y título `FAVORITOS` clicable para contraer o expandir con tooltip y contador.

- ⏱️ **Programador, UWP y recuperación de accesos**:
  - Reloj analógico rediseñado en cristal oscuro con marca de agua del cohete, lectura digital ampliada y buscador inline dentro del selector del Programador.
  - El diálogo de importación UWP prioriza el icono y el nombre de la app y recuerda la última categoría elegida en la sesión.
  - El aviso de destino no encontrado permite reubicar la ruta o eliminar el acceso directamente desde el modal.

### ⚠️ Antes de instalar

- **Windows:** esta versión aún no está firmada digitalmente. SmartScreen puede avisar antes de ejecutarla: **Más información › Ejecutar de todas formas**. Cuando Smart App Control está activado, Windows rechaza programas sin firmar; consulta la [política de firma de código](https://github.com/CyberGems/.github/blob/main/CODE_SIGNING.md). Verifica la descarga con los checksums SHA256 que aparecen más abajo.

</details>

---

### ⚠️ Before you install

- **Windows:** this release is not code-signed yet. SmartScreen may ask before it runs: **More info › Run anyway**. Where Smart App Control is on, Windows refuses unsigned programs; see the [code signing policy](https://github.com/CyberGems/.github/blob/main/CODE_SIGNING.md). Verify the download with the SHA256 checksums below.

---

### 📦 Downloads & Packages

> ⬇️ **Direct download:** click a file name to download it now. Same files as in **Assets** at the bottom of this page.

| File | Description | Platform |
| :--- | :--- | :--- |
| **[`CyberLauncher-Setup-{{VERSION_NUM}}.exe`](https://github.com/CyberGems/CyberLauncher/releases/download/{{VERSION}}/CyberLauncher-Setup-{{VERSION_NUM}}.exe)** | 🚀 **Recommended Installer** (NSIS Setup with Start Menu & Desktop shortcuts) | Windows 10 / 11 (x64) |
| **[`CyberLauncher-Portable-{{VERSION_NUM}}.exe`](https://github.com/CyberGems/CyberLauncher/releases/download/{{VERSION}}/CyberLauncher-Portable-{{VERSION_NUM}}.exe)** | 💼 **Portable package** (run from any folder, with settings stored beside it) | Windows 10 / 11 (x64) |

---

### 🔐 VirusTotal and SHA256

> 🛡️ The report opens on VirusTotal and does not download anything.

**Installer**: [View VirusTotal report](https://www.virustotal.com/gui/file/{{INSTALLER_HASH}})

```text
{{INSTALLER_HASH}}
```

**Portable**: [View VirusTotal report](https://www.virustotal.com/gui/file/{{PORTABLE_HASH}})

```text
{{PORTABLE_HASH}}
```

---

📜 **Full changelog:** browse every version in [CHANGELOG.md](https://github.com/CyberGems/CyberLauncher/blob/main/CHANGELOG.md).

*Crafted with precision by [CyberGems](https://cybergems.org)*
