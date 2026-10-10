# CyberBot design review, stage one

The approved design is extracted from the local `public/cyberbot-preview.html` laboratory. The review uses the real `App`, `CyberBot`, layout and speech bubble inside Electron, with the extracted avatar in its normal location. Normal launches retain the existing avatar until the visual review is accepted.

Run `npm run build`, then `node scripts/cyberbot-review.mjs`. The review creates a separate temporary portable profile. It copies appearance, launcher organization and the icon cache from the installed app, but does not copy scheduled tasks. Automatic updates, backups, system alerts, startup registration and hotspots are disabled in that profile. The production main process already skips Windows startup registration in development mode. Close this instance with its tray Exit command; closing the window hides it to the tray, as in CyberLauncher.

The review controls provide resting, marquee, terminal, curious, flight, sleeping, alert, two-cube and slit-eye expressions, the chest equalizer, reduced ambient motion, and the monitor transformation. They are available in Spanish and English. Idle disappearance and hover relocation are suspended during review so the design remains available for inspection.

## Approved laboratory defaults

| Feature | Default in the saved laboratory |
| --- | --- |
| Crest / keel | Clean / clean |
| Equalizer | Ladder, trapezoid profile |
| Halo | Ephemeral, hollow core, perspective rings |
| Side reactors | Enabled, Cherenkov, 2.8 seconds |
| Reactor chamber | Solid, opacity 0.92 to 0.98 |
| Alert | Exclamation marks |
| Hover | Head spin, happy rear face |
| Drag | Random curious / flight face |
| Initial face | Launcher |
| Marquee transformation | Paused body in the HTML defaults; screen mode selected for review according to the latest approved screenshot |

Some laboratory settings can be overridden by its browser storage or URL parameters. The exported artwork retains all geometry variants. This first stage exposes the primary expressions and monitor transformation, not every laboratory configuration or controller.

## Fidelity findings

Several laboratory gradient stops use React-style `stopColor` attributes in HTML. Chromium ignores these attributes and renders the corresponding surfaces black. Converting them to JSX would activate the written blue gradients and change the approved appearance. The extraction intentionally preserves the actual HTML rendering. SVG IDs are made unique per instance, and robot styles are isolated from the rest of the application. The source laboratory is not modified.

The marquee sample counts, RAM values and free disk figures in the laboratory are static examples. The review uses the actual app version and a translated existing status. Original phrase catalogs, bilingual translations, notification routing and behaviors remain intact for the next integration stage.

## Verification on Windows

- TypeScript, production build, and the 51 existing CyberBot tests passed.
- The real Electron review was captured at 125% scaling with an 80 by 92 CSS pixel avatar.
- The monitor transition landed the head at SVG y=49, completely retracted the torso, and kept the ephemeral halo hidden.
- Controlled captures of the original SVG and extracted component used the same Electron renderer, background, local font, fixed animation state and SVG timeline. Resting and monitor/marquee each had zero differing pixels out of 11,500 pixels at the comparison threshold of 0.1.
- The capture flow produced no renderer exceptions. The build retains its existing large-chunk warning. The isolated instance can log a shortcut registration conflict while the installed app is open; its initial renderer briefly requests the existing default shortcut before restoring the test profile setting.

These comparisons establish the tested appearance, not frame-by-frame equivalence of every animation. User acceptance, expression mapping from the previous avatar, idle timing, portal behavior, drag inertia, telemetry integration, tray return, and a full behavioral regression pass remain for subsequent stages. Promote this same component after acceptance; do not reconstruct it from screenshots.
