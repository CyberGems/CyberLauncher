<p align="center">
  <img src="public/icon-256.png" alt="CyberLauncher" width="120" />
</p>

<h1 align="center">CyberLauncher — Desktop Application Launcher</h1>

<p align="center">
  <strong>A full-screen, cyberpunk-themed launcher for Windows</strong>
</p>

<p align="center">
  <a href="https://github.com/CyberGems/CyberLauncher/releases/latest">
    <img src="https://img.shields.io/badge/⚡_Download_Latest_Release-(Windows_64--bit)-0047B3?style=for-the-badge&logo=windows&logoColor=white" alt="Download Latest Release" />
  </a>
  <a href="https://github.com/CyberGems/CyberLauncher/releases">
    <img src="https://img.shields.io/badge/All_Releases-Changelog-18181B?style=for-the-badge&logo=github&logoColor=white" alt="All Releases" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-GPL--3.0-blue.svg" alt="License" />
  <img src="https://img.shields.io/badge/platform-Windows-0078D4.svg?logo=windows&logoColor=white" alt="Platform" />
  <img src="https://img.shields.io/badge/version-1.8.1-00F0FF.svg" alt="Version" />
  <img src="https://img.shields.io/badge/Electron-42-512BD4.svg?logo=electron&logoColor=white" alt="Electron" />
  <a href="https://github.com/CyberGems/CyberLauncher/wiki"><img src="https://img.shields.io/badge/%F0%9F%93%96_Wiki-Documentation-222222?style=flat-square&logo=github&logoColor=white" alt="Wiki" /></a>
</p>

A full-screen, glassmorphic application launcher built with **Electron + React + TypeScript**. Designed to replace the traditional Windows Start Menu, CyberLauncher provides a fast, keyboard-driven workflow to organize, search, and launch your apps — all wrapped in a sleek cyberpunk interface with neon accents.

*Free and open source (GPLv3) — no ads, no tracking, and no data collection. Just enjoy it.*

---

## 🚀 Why CyberLauncher?

The Windows Start Menu works, but it's slow, cluttered, and mouse-driven. CyberLauncher reimagines app launching from the ground up — **type to search, hotkey to summon, click to launch**. No more digging through nested folders or scrolling through an alphabet soup of icons.

| Need | Solution |
|---|---|
| Replace the clunky Start Menu | Full-screen, keyboard-driven launcher with instant fuzzy search |
| Find anything on your PC | Hybrid indexing engine — Everything-grade file search across all drives |
| Stay organized | Color-coded categories, favorites bar, drag-to-reorder, taskbar pins |
| Launch from anywhere | Global hotkey, hot corners, per-app custom shortcuts |
| Track your workflow | Execution history, scheduled launches, console command runner |
| Make it yours | Background images, gradients, glass effects, opacity, UI scale |

---

## ✨ Key Features

### 🔍 Launch & Search
- **Instant Launch** — Open any app, shortcut (.lnk), or URL with a single click or Enter
- **Fuzzy Search** — Start typing to instantly filter your app library (no exact match needed)
- **System-Wide File Search** — Hybrid indexing engine finds files, folders, and apps across all drives
- **UWP / Windows Store Support** — Natively scan, import, and launch UWP & MSIX apps via AUMID
- **Console Mode** — Type `>` in search to execute shell commands directly

### 📂 Organization
- **Custom Categories** — Organize apps into color-coded categories with inline editing
- **Favorites & Drag-to-Reorder** — Pin most-used apps with drag & drop reordering
- **Taskbar** — Customizable bottom bar with pinned apps for quick access
- **Resizable Panels** — Drag to resize the category sidebar and most-used panel

### 🎯 Activation
- **Global Shortcut** — Show/hide with a customizable keyboard shortcut (default: `Alt+Shift+L`)
- **Hot Corners** — Activate the launcher by moving your cursor to any screen corner
- **Multi-Monitor Support** — Choose which display CyberLauncher appears on (including "Follow cursor")
- **Auto-Hide on Blur** — Launcher hides automatically when switching to another window

### 📊 System & Monitoring
- **System Monitor** — Real-time RAM, CPU, and disk usage in the top bar
- **Storage HUD** — View free space and status of all system drives
- **Execution Scheduler** — Schedule app launches or console commands with a countdown timer
- **Execution History** — Track and reopen everything you've launched, with clear-history option

### 🎨 Customization
- **Theming** — Background images, gradients, solid colors, glass intensity, and opacity controls
- **UI Scale** — Adjust the interface size to your preference
- **Bilingual UI** — Full English and Spanish interface with instant language switcher

### ⚡ Power User
- **Run as Administrator** — Per-app option to request elevated privileges on launch
- **Per-App Global Shortcuts** — Assign custom hotkeys to launch any app from anywhere
- **Drag & Drop from Explorer** — Drag `.exe` or `.lnk` files directly into the launcher to add them
- **Auto-Updates** — Automatic update checks and downloads via GitHub releases
- **Export / Import** — Backup and restore your entire configuration as JSON
- **Single Instance** — Only one instance runs at a time; second launches focus the existing window
- **Launch with Windows** — Optionally start minimized or visible at system boot

---

## 🛠️ Tech Stack & Architecture

- **Platform:** Windows (primary target)
- **Framework:** Electron 42 + React 19 + TypeScript
- **Bundler:** Vite 6
- **Styling:** Tailwind CSS 4 + Motion (Framer Motion)
- **Installer:** electron-builder (NSIS)
- **Updater:** electron-updater (GitHub releases)

```
CyberLauncher/
├── electron/
│   ├── main.ts            Electron main process (window, tray, IPC, hotspots, indexer)
│   ├── preload.ts         Context bridge (IPC API exposed to renderer)
│   ├── display-resolve.ts Multi-monitor display resolution logic
│   └── updater.ts         Auto-update via electron-updater + GitHub Releases
├── scripts/
│   └── generate-icons.mjs Icon generation pipeline (sharp)
├── src/
│   ├── App.tsx            Main React application (all UI logic)
│   ├── main.tsx           React entry point
│   ├── index.css          Global styles, Tailwind, font imports
│   ├── locales.ts         i18n (English / Spanish)
│   ├── AboutModal.tsx     About & update dialog
│   └── Tooltip.tsx        Reusable tooltip component
├── public/                Static assets & icons
├── vite.config.ts         Vite + Electron plugin configuration
└── tsconfig.json          TypeScript configuration
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Git](https://git-scm.com/)

### Development

```bash
git clone https://github.com/CyberGems/CyberLauncher.git
cd CyberLauncher
npm install
npm run dev
```

### Build for Production

```bash
npm run build:electron
```

The installer will be in the `release/` directory.

### Lint

```bash
npm run lint
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `Alt+Shift+L` | Show/hide CyberLauncher (customizable) |
| `>` (in search) | Switch to console mode (execute shell commands) |
| `Enter` | Launch selected app / execute console command |
| `Esc` | Close menu / clear search |
| `↑` `↓` | Navigate search results |
| `←` `→` | Navigate sidebar menu |
| `Ctrl+←` / `Ctrl+→` | Cycle search filter (Mixed / Apps / Folders / Files) |
| `Tab` (in system search) | Return to normal launcher search |

---

## ❓ Frequently Asked Questions

### What is CyberLauncher?

CyberLauncher is a full-screen desktop application launcher for Windows. It replaces the traditional Start Menu with a fast, keyboard-driven interface featuring fuzzy search, system-wide file indexing, and a distinctive cyberpunk aesthetic.

### Does it replace the Windows Start Menu?

CyberLauncher runs alongside Windows — it doesn't modify system files. You can use it as your primary launcher while keeping the Start Menu accessible. Many users set CyberLauncher to auto-start and use the global hotkey to summon it instantly.

### Where is configuration stored?

All settings are stored in a single JSON file:

```
%APPDATA%/CyberLauncher/cyber-launcher-config.json
```

This includes apps, categories, favorites, taskbar pins, theme settings, shortcuts, indexer configuration, and scheduler tasks. You can export/import this file for backup.

### How do per-app global shortcuts work?

In the Add/Edit drawer for any app, you can assign a custom hotkey. CyberLauncher registers it system-wide via Electron's `globalShortcut` API, so you can launch that app from any application at any time.

### Does it support UWP / Microsoft Store apps?

Yes. CyberLauncher scans for UWP and MSIX packaged apps via their AUMID (Application User Model ID) and imports them into your library. They launch natively alongside traditional desktop apps.

### Can I contribute?

Absolutely! Fork the repository, create a feature branch, and submit a pull request. Please ensure your changes pass `npm run lint` before submitting.

---

## ❤️ Donate

**CyberLauncher** is a personal open-source project within the **CyberGems** suite. I've spent thousands of hours building and refining it — both for my own use and to share premium-quality software with the world for free.

If you'd like to support this work, a donation would mean a lot. Thank you! 🙏

<p align="center">
  <a href="https://www.paypal.com/donate/?hosted_button_id=M4PY3UPJA5Y6Q"><img src="https://img.shields.io/badge/Donate-PayPal-0070BA?style=for-the-badge&logo=paypal" alt="Donate via PayPal" /></a>
  <a href="https://ko-fi.com/cybergems"><img src="https://img.shields.io/badge/Support_me_on_Ko--fi-FF5E5B?style=for-the-badge&logo=ko-fi&logoColor=white" alt="Support me on Ko-fi" /></a>
  <a href="https://buymeacoffee.com/cybergems"><img src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me a Coffee" /></a>
</p>

<div align="center">

<details>
<summary><b>Crypto donations (BTC, ETH, USDT, LTC) — click to view addresses</b></summary>

<div align="left">

| Asset | Network | Address | QR |
|---|---|---|---|
| <img src="docs/donate/btc.svg" width="18" height="18" valign="middle" alt="BTC" /> **BTC** | Bitcoin | `bc1q5mxzz05nmvsheqzx7970euswta3fksxzcfzag4` | ![BTC QR](docs/donate/qr-btc.png) |
| <img src="docs/donate/eth.svg" width="18" height="18" valign="middle" alt="ETH" /> **ETH** | Ethereum (ERC20) | `0x79b703Ec0f77493679Fcd280aF3b983E20c580B8` | ![ETH QR](docs/donate/qr-eth.png) |
| <img src="docs/donate/usdt.svg" width="18" height="18" valign="middle" alt="USDT" /> **USDT** | Ethereum (ERC20) | `0x79b703Ec0f77493679Fcd280aF3b983E20c580B8` | ![USDT ERC20 QR](docs/donate/qr-eth.png) |
| <img src="docs/donate/usdt.svg" width="18" height="18" valign="middle" alt="USDT" /> **USDT** | BNB Smart Chain (BEP20) | `0x79b703Ec0f77493679Fcd280aF3b983E20c580B8` | ![USDT BEP20 QR](docs/donate/qr-eth.png) |
| <img src="docs/donate/usdt.svg" width="18" height="18" valign="middle" alt="USDT" /> **USDT** | Tron (TRC20) | `TSVbSk1HSyZ1NprCnAYiw56ECwXgH887mD` | ![USDT TRC20 QR](docs/donate/qr-usdt-tron.png) |
| <img src="docs/donate/ltc.svg" width="18" height="18" valign="middle" alt="LTC" /> **LTC** | Litecoin | `LWGnEHgcFCE2BRkzLnsdPDD8Y8ZeDK577X` | ![LTC QR](docs/donate/qr-ltc.png) |

> ⚠️ Send only the selected asset on the indicated network. Using the wrong network will result in permanent loss of funds.

</div>

</details>

</div>

---

## 📄 License

CyberLauncher is distributed under the terms of the GNU General Public License v3.0. See [LICENSE](./LICENSE) for the full license text.

Copyright (C) 2026 CyberGems

---

<div align="center" style="background:#0D0F17; border:1px solid rgba(0,255,255,0.12); border-radius:12px; padding:28px 20px; margin-top:32px;">

### Thanks for using CyberLauncher! 🎉

Made by [**CyberGems**](https://cybergems.org)

</div>
