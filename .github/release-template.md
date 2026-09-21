<p align="center">
  <img src="https://raw.githubusercontent.com/CyberGems/CyberLauncher/main/public/icon.png" width="120" alt="CyberLauncher">
</p>

## 📋 CyberLauncher {{VERSION}}: Release Notes

### 🚀 What's new in this release

<!-- Maintainer: Rewrite the marked paragraph for every release. Use 25-45 words, lead with user-facing changes, and do not repeat the app name or version. -->
<!-- changelog-summary:start -->
Recent shortcuts are now available directly from the tray, update notices offer clearer actions, the About experience is leaner, and release checksums are kept accurate automatically after publishing.
<!-- changelog-summary:end -->

> **New to CyberLauncher?** A full-screen, keyboard-driven Windows launcher for organizing, searching, and opening apps from a unified panel.

---

### ✨ Key Features & Highlights

- 📌 **Tray — Most recent**:
  - The system tray menu now has a **Most recent** submenu with the same list as the main panel, including each shortcut's resolved icon, so you can relaunch without opening the launcher.

- 🔔 **Update notice improvements**:
  - The update badge is now a compact circular arrow, the notification LED was moved to the More menu, and the redundant logo indicator was removed.
  - Release notices now provide clear **View release page** and **Download** actions without closing the notice unexpectedly.

- 🧭 **About cleanup**:
  - Removed the duplicate data-folder action from About because it is already available in Settings.

- 🔐 **Release notes checksums**:
  - CI now rewrites the GitHub release body after uploading the installer, so the SHA256 is no longer left as `pending`.

---

### 📦 Downloads & Packages

> ⬇️ **Direct download:** click the file name to download it now. Same file as in **Assets** at the bottom of this page.

| File | Description | Platform |
| :--- | :--- | :--- |
| **[`CyberLauncher-Setup-{{VERSION_NUM}}.exe`](https://github.com/CyberGems/CyberLauncher/releases/download/{{VERSION}}/CyberLauncher-Setup-{{VERSION_NUM}}.exe)** | 🚀 **Recommended Installer** (NSIS Setup with Start Menu & Desktop shortcuts) | Windows 10 / 11 (x64) |

---

### 🔐 Checksums

- **`CyberLauncher-Setup-{{VERSION_NUM}}.exe`** — SHA256: `{{INSTALLER_HASH}}`

---

*Crafted with precision by [CyberGems](https://cybergems.org)*
