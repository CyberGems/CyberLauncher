# Frequently Asked Questions

General questions about CyberLauncher features, configuration, and troubleshooting (current version `v1.9.1`).

---

## General

### What is CyberLauncher?
CyberLauncher is a full-screen, cyberpunk-themed application launcher for Windows (Electron + React + TypeScript). It works as a fast, keyboard-driven alternative to the traditional Start Menu — it runs alongside Windows without modifying system files — featuring fuzzy search and system-wide file indexing.

### Is CyberLauncher free?
Yes. CyberLauncher is completely free and open source under the GPLv3 license. There are no paid features, ads, or tracking. You can help keep it free [here](https://github.com/CyberGems/CyberLauncher#%EF%B8%8F-donate).

### Does CyberLauncher replace the Windows Start Menu?
No. CyberLauncher runs alongside the Start Menu. You can use both — press `Alt+Shift+L` for CyberLauncher and `Win` for Start Menu.

### Does CyberLauncher work offline?
Yes, except for auto-update checks and remote background-image URLs. Search, launch, scheduler, and monitoring are fully local.

---

## Search & Launch

### How does fuzzy search work?
Fuzzy search matches results even with imperfect typing. For example, "chr" matches "Chrome", "Chroma", etc. Results are ranked by relevance and usage frequency (Most Used / Most Recent).

### Can I launch UWP (Windows Store) apps?
Yes. CyberLauncher scans for UWP / MSIX apps, extracts clean icons from manifests, and launches them via AUMID. Go to `Settings → WS SCANNER → SCAN WINDOWS STORE`, then **IMPORT**. See [Launch & Search](Launch-&-Search).

### What is Cyber Terminal (Console Mode)?
Type `>` in the search box to execute shell commands directly (persistent directory, PowerShell/CMD engines, history with `↑/↓`). Built-ins: `help, clear, cd, explorer, wt, sys, apps, dir`. For example, `> notepad` opens Notepad. See [Launch & Search](Launch-&-Search).

### Can I run apps as administrator?
Yes, for executables only (`.exe`, `.bat`, `.cmd`, `.ps1`, `.msi`, `.lnk`). Right-click a result → Run as administrator, or set the per-app admin switch in the Add / Edit drawer. A UAC prompt confirms elevation.

### How do I add custom files or folders?
Drag and drop `.exe` or `.lnk` files from Explorer onto the launcher (`DROP TO ADD APP`). Folders cannot be added by drag & drop — authorize them under `Settings → SEARCH ENGINE → AUTHORIZED DIRECTORIES TO INDEX`. See [Organization](Organization).

---

## Indexer

### What is the file indexer?
The hybrid indexing engine crawls your directories to build a searchable database of files. It supports configurable depth, system drives, and custom authorized folders. Press `Tab` in the search box for system-wide results with `MIXED / PROGRAMS / FOLDERS / FILES` filters.

### Does indexing slow down my computer?
Indexing runs in the background with minimal impact. You can skip whole-drive indexing, reduce `SCAN DEPTH LEVEL`, or disable `INDEXED SEARCH SERVICE` for better performance.

### How do I add folders to index?
Go to `Settings → SEARCH ENGINE → AUTHORIZED DIRECTORIES TO INDEX → ADD DIRECTORY`.

### Can I index hidden folders?
Yes, with two separate toggles: `INCLUDE HIDDEN FOLDERS (DOTFILES)` (show them in results) and `INDEX INSIDE HIDDEN FOLDERS` (recursively scan their contents, higher resource usage).

---

## Activation

### What are hot corners?
Hot corners summon the launcher when you move your cursor into an enabled screen corner (active-monitor only, with anti-accidental delay). Configure in `Settings → GENERAL → SCREEN CORNER HOTSPOTS ACTIVATION`. See [Activation](Activation).

### Can I change the global shortcut?
Yes. Go to `Settings → GENERAL → TOGGLE ACTIVATION SHORTCUT`, click the field, and press your combination. Per-app hotkeys are assigned in each shortcut's Add / Edit drawer. See [Keyboard Shortcuts](Keyboard-Shortcuts).

### How does multi-monitor work?
Pin a monitor or choose `Follow cursor` (`Settings → GENERAL → DISPLAY MONITOR`) to open wherever you summon it (hotkey, hotspot, or tray).

---

## Customization

### Can I use my own background image?
Yes. `Settings → APPEARANCE → BACKGROUND TYPE → Image`, then pick a preset, **Browse** your PC, or paste a **CUSTOM BACKGROUND (URL)**. The 4th grid slot stores your custom image persistently. See [Customization](Customization).

### How do I change the UI scale?
Two sliders: `Settings → GENERAL → CARD SIZE GRID SCALE` (card density) and `Settings → APPEARANCE → INTERFACE SCALE` (global zoom). There are no fixed `0.8×–1.4×` presets.

### Can I switch between English and Spanish?
Yes. `Settings → GENERAL → INTERFACE LANGUAGE` — applies instantly across menus, HUDs, terminal help, and dialogs.

---

## System Monitoring

### What system stats are shown?
The **top bar** shows live RAM and CPU (click either for the `SYSTEM RESOURCES` HUD: memory used/total, cores, uptime, launch count). The `STORAGE` HUD shows free/total space per drive. The footer mirrors uptime, last-24h launches, and date-time. See [System & Monitoring](System-&-Monitoring).

### What is the Scheduler?
Open it from the top-bar clock, footer date-time, or `⋯ → Task Scheduler`: queue a shortcut or console command with a minutes+seconds countdown (`SCHEDULE EXECUTION`), track live countdowns, cancel anytime. See [System & Monitoring](System-&-Monitoring).

---

## Troubleshooting

### The launcher doesn't appear
- Check if CyberLauncher is running (system tray — Windows may hide it behind the `^` overflow; see [Activation](Activation) tray-pin help)
- Try the global shortcut again
- Check if the shortcut conflicts with another app (`Settings → GENERAL`)

### The global shortcut doesn't work
- Some apps capture keys first — try a different combination
- Shortcuts registered by a non-elevated app don't fire while an elevated (admin) window is focused; running CyberLauncher as administrator helps in that case
- Re-register via `Settings → GENERAL → TOGGLE ACTIVATION SHORTCUT`

### Apps are not showing in search
- Check `Settings → SEARCH ENGINE → INDEXED SEARCH SERVICE` is enabled (`SYSTEM ONLINE`)
- Verify `AUTHORIZED DIRECTORIES TO INDEX` covers your folders
- Toggle the service off/on and adjust `SCAN DEPTH LEVEL`
- For Store apps use `Settings → WS SCANNER → SCAN WINDOWS STORE`

### UWP apps are missing
- Go to `Settings → WS SCANNER → SCAN WINDOWS STORE` and wait for `Scan successfully completed`
- Press **IMPORT**; use the scanner search box (`Search in the Windows Store...`) to find them

### High memory usage
- Reduce `SCAN DEPTH LEVEL`, skip whole-drive indexing
- Lower `BACKDROP BLUR LEVEL`, prefer Solid backgrounds
- `Settings → BACKUP & DATA → ICON MAINTENANCE → Refresh all icons` cleans orphaned icon-cache files

---

## Contributing

### How can I report a bug?
Open an issue on [GitHub Issues](https://github.com/CyberGems/CyberLauncher/issues) with:
- CyberLauncher version (`About` shows it) + `About → Copy diagnostics` output
- Windows version
- Steps to reproduce
- Expected vs actual behavior

### How can I contribute code?
1. Fork the repository
2. Create a feature branch
3. Ensure `npm run lint` (`tsc --noEmit`) passes
4. Submit a pull request with a clear description

### How can I help with translations?
UI strings live in `src/locales.ts` (English + Spanish objects — new languages follow the same `TranslationKey` pattern). Submit a PR with your translation.

### How can I donate?
See the [Donate section](https://github.com/CyberGems/CyberLauncher#%EF%B8%8F-donate) on the main README.
