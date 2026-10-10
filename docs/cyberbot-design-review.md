# CyberBot design review and integration

The approved design is extracted from the local `public/cyberbot-preview.html` laboratory. The review uses the real `App`, `CyberBot`, layout and speech bubble inside Electron, with the extracted avatar in its normal location. The first visual stage was accepted; normal launches now use the same approved component with the integration described below.

Run `npm run build`, then `node scripts/cyberbot-review.mjs`. The review creates a separate temporary portable profile. It copies appearance, launcher organization and the icon cache from the installed app, but does not copy scheduled tasks. Automatic updates, backups, system alerts, startup registration and hotspots are disabled in that profile. The production main process already skips Windows startup registration in development mode. Close this instance with its tray Exit command; closing the window hides it to the tray, as in CyberLauncher.

The review controls provide resting, marquee, terminal, curious, flight, sleeping, alert, two-cube and slit-eye expressions, the chest equalizer, reduced ambient motion, and the monitor transformation. They are available in Spanish and English. Idle disappearance and hover relocation are suspended while inspecting a fixed expression. Real behavior mode uses the normal controllers.

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

These first-stage comparisons established the tested appearance, not frame-by-frame equivalence of every animation. The accepted component is promoted directly; it is not reconstructed from screenshots.

## Stage two: launcher behavior

After visual acceptance, the normal renderer now uses this same approved component. The old launcher avatar is removed. The existing bilingual phrase decks, speech bubbles, notification priorities, quiet hours, minimal chatter, hover assistance, dodge preferences and obstacle layout remain in place.

Original laboratory faces are preserved. Happy, delighted, affectionate, sparkle, wink, startled, storage, success and speaking meanings from the previous bot are fitted to the new visor without rebuilding its shell. Speaking uses the approved chest equalizer for a finite 1.8-second cue, rather than adding a second mouth or a different head animation. The inspection controls expose these additional expressions.

The marquee chooses two distinct real statuses. It measures the loaded font, waits for the monitor landing, and holds the expression long enough for the full text to exit. The first pass defers an idle departure or sleep without resetting elapsed inactivity; once reading finishes, an already due gesture can proceed. Interaction and important speech still interrupt it immediately. Laboratory sample telemetry is not used.

Idle departures use the laboratory portal and its separate floor halo. Interrupted departures cancel both body and halo timers. Dragging retains the launcher's bounds and drop position while using the approved flight/curious face, reactor boost, bounded tilt and settling motion. Reduced motion disables ambient effects and portal motion while preserving useful scrolling content.

The default right anchor moved 12 CSS pixels left. Its height uses the measured desktop taskbar/footer edge and the actual landed SVG geometry. The measured head bottom was 777.4000 CSS pixels versus the footer edge at 777.6000, at 125% Windows scaling. Moving the bot manually gives it a new local landing base; the top corner and obstacle relocation also retain their own base.

Verification: 55 CyberBot tests, TypeScript and production build passed. Native Electron checks covered all 18 expressions, a physical click that changes the phrase, the finite EQ cue, portal reversal and complete departure, safe scrolling text, reduced motion, and physical drag/drop with identical before/after drop coordinates. A live, unforced cycle rotated through launcher, terminal and marquee, departed through the portal and woke on pointer activity. Opening the real settings panel moved both avatar and visible speech out of its way; after the panel exit animation, the saved position returned within 0.05 CSS pixels. A real tray hide and shortcut return delivered the actual launcher-shown event and restarted scrolling. Native Windows window handles were used to verify visibility because the inspected document did not reflect the hide. Controlled rest and monitor images still had zero differing pixels out of 11,500, with the same stationary text position. These are controlled-frame comparisons, not a claim about every animation frame.

The installed application and its real data profile are unchanged. The isolated review can run real behavior or hold a selected expression. Its conversation level is now full; minimal chatter continues to suppress ordinary interaction phrases by its existing rule. The build retains its existing chunk-size warning.

## Stage three: desktop notifications

The separate transparent desktop toast now mounts the same approved avatar component as the launcher. The old toast SVG is removed. Its 84 CSS pixel width is preserved; its height is now 96.6 pixels to retain the approved 100 by 115 aspect ratio. Existing message text, bilingual labels, scheduler buttons, release links, dismissal and banner fallback remain in the toast controller.

The toast is a Vite build entry, `cyberbot-toast.html`, instead of an unbundled public HTML page. Electron opens that entry through Vite during development and from `dist` in production. The production script policy remains restricted to local scripts. Bundled fonts may use local file or data URLs, including small font subsets embedded by Vite.

Speech uses the approved chest equalizer for 1.8 seconds. Countdown updates keep the same announcement key, so they do not restart the cue. Hiding or changing to a banner unmounts the avatar and clears its timers. CyberBot now subscribes to live changes of the system reduced-motion preference, including in the launcher; changing that preference does not extend an old desktop speech cue.

Verification: TypeScript, production build and all 56 CyberBot tests passed. The isolated real Electron toast was tested at 150% Windows scaling in a 530 by 180 CSS pixel window. The avatar measured 84 by 96.59375 pixels, and the bubble and action buttons stayed inside the window after its entry transition. Tests exercised the finite speech cue, countdown updates, launcher/alert/storage/success faces, literal text containing HTML, live reduced-motion changes, banner fallback, unmount on dismissal, and loading the actual compiled page through `file:`. No toast renderer or console errors remained.

Scheduler launch/cancel buttons were clicked through the actual preload and main process using a deliberately nonexistent task ID in the isolated profile. IPC delivery was verified; no real scheduled application was executed. The storage HUD action was also delivered through that bridge. Release-link dispatch is covered by the controller test; opening an external browser was not part of native verification.

Both rendering surfaces now share the approved artwork. The installed app, its profile and the untracked source laboratory remain untouched. Minor visual polish and a future installer/release remain separate work.
