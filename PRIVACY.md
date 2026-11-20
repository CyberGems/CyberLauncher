# Privacy — CyberLauncher

CyberLauncher runs on your PC and keeps your data on your PC. It has **no account, no telemetry, no analytics SDK and no ads**. It never sends your layout, shortcuts or backups to its author or to anyone else.

Everything it knows (layout, shortcuts or backups) stays in `%APPDATA%\CyberLauncher\` (configuration, window state, wallpapers, icon cache, backups and logs). Portable builds use a `data` folder next to the executable. No app-data removal option was found in the installer script; the data folder is kept.

## When CyberLauncher goes online

These are all the connections CyberLauncher makes by itself. None of them sends your layout, shortcuts or backups. Like any request on the internet, the server sees your IP address.

| When | Where | What for | How to turn it off |
|---|---|---|---|
| 8 seconds after launch | GitHub Releases, with release notes from `api.github.com` | Check for a newer version | `autoUpdate`; portable builds disable the updater |

Links you open yourself are not part of this list.

## What CyberLauncher reads on your PC

CyberLauncher reads installed UWP/AppX manifests and display information, to list apps and place windows. That information stays on your screen. Anything that changes the system asks for confirmation first and, where possible, is backed up so it can be undone.

## Questions

Open an issue: https://github.com/CyberGems/CyberLauncher/issues

For a privacy-specific question, use the [contact page](https://cybergems.org/contact). The suite-wide statement is at [cybergems.org/privacy](https://cybergems.org/privacy).
