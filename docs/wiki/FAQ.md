# Frequently Asked Questions

General questions about CyberLauncher features, configuration, and troubleshooting.

---

## General

### What is CyberLauncher?
CyberLauncher is a full-screen, cyberpunk-themed application launcher for Windows. It replaces the traditional Start Menu with a fast, keyboard-driven interface featuring fuzzy search and system-wide file indexing.

### Is CyberLauncher free?
Yes. CyberLauncher is completely free and open source under the GPLv3 license. There are no paid features, ads, or tracking. You can help keep it free [here](https://github.com/CyberGems/CyberLauncher#-donate).

### Does CyberLauncher replace the Windows Start Menu?
No. CyberLauncher runs alongside the Start Menu. You can use both — press `Alt+Shift+L` for CyberLauncher and `Win` for Start Menu.

### Does CyberLauncher work offline?
Yes. CyberLauncher works fully offline. Only auto-update checks require internet.

---

## Search & Launch

### How does fuzzy search work?
Fuzzy search matches results even with imperfect typing. For example, "chr" matches "Chrome", "Chroma", etc. Results are ranked by relevance and usage frequency.

### Can I launch UWP (Windows Store) apps?
Yes. CyberLauncher scans for UWP apps, extracts their icons, and launches them via AUMID. Enable UWP scanning in Settings → UWP.

### What is Console Mode?
Type `>` in the search box to execute shell commands directly. For example, `> notepad` opens Notepad.

### Can I run apps as administrator?
Yes. Right-click an app → Run as administrator. You can also configure per-app admin mode.

### How do I add custom files or folders?
Drag and drop `.exe` or `.lnk` files from Explorer onto the launcher. For folders, add them to authorized folders in Indexer settings.

---

## Indexer

### What is the file indexer?
The indexer crawls your directories to build a searchable database of files. It supports configurable depth, system drives, and custom folders.

### Does indexing slow down my computer?
Indexing runs in the background with minimal impact. You can disable system drive indexing or reduce scan depth for better performance.

### How do I add folders to index?
Go to Settings → Indexer → Authorized Folders. Add any folder you want indexed.

### Can I index hidden folders?
Yes. Enable "Hidden folders" in Settings → Indexer to include dotfiles and hidden directories.

---

## Activation

### What are hot corners?
Hot corners activate the launcher when you move your cursor to a screen corner. Configure in Settings → General → Hotspots.

### Can I change the global shortcut?
Yes. Go to Settings → General and click the shortcut field, then press your desired combination.

### How does multi-monitor work?
Choose to show the launcher on a specific monitor or "Follow cursor" to show it wherever your cursor is.

---

## Customization

### Can I use my own background image?
Yes. Go to Settings → Appearance, select Image background, and choose your image file or enter a URL.

### How do I change the UI scale?
Go to Settings → Appearance and adjust the UI scale (0.8× to 1.4×).

### Can I switch between English and Spanish?
Yes. Go to Settings → General → Language and select English or Spanish.

---

## System Monitoring

### What system stats are shown?
The sidebar shows real-time RAM, CPU, and disk usage. The Storage HUD shows free space on all drives.

### What is the Scheduler?
The Scheduler lets you schedule app launches or commands to run after a countdown. Useful for delayed actions.

---

## Troubleshooting

### The launcher doesn't appear
- Check if CyberLauncher is running (system tray)
- Try the global shortcut again
- Check if the shortcut conflicts with another app

### The global shortcut doesn't work
- Some apps may capture the shortcut first
- Try a different key combination
- Run CyberLauncher as administrator

### Apps are not showing in search
- Check if the indexer is enabled
- Verify authorized folders include your apps
- Rebuild the indexer

### UWP apps are missing
- Enable UWP scanning in Settings → UWP
- Click "Import UWP apps" to trigger a scan

### High memory usage
- Reduce indexer scan depth
- Disable system drive indexing
- Clear icon cache

---

## Contributing

### How can I report a bug?
Open an issue on [GitHub Issues](https://github.com/CyberGems/CyberLauncher/issues) with:
- CyberLauncher version
- Windows version
- Steps to reproduce
- Expected vs actual behavior

### How can I contribute code?
1. Fork the repository
2. Create a feature branch
3. Submit a pull request
4. Describe your changes in the PR description

### How can I help with translations?
UI strings are in `src/locales.ts`. Submit a PR with your translation.

### How can I donate?
See the [Donate section](https://github.com/CyberGems/CyberLauncher#-donate) on the main README.
