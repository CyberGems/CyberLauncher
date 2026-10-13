# CyberBot design review and integration

The approved design is extracted from the private local `artifacts/cyberbot-preview.html` laboratory. The review uses the real `App`, `CyberBot`, layout and speech bubble inside Electron, with the extracted avatar in its normal location. The first visual stage was accepted; normal launches now use the same approved component with the integration described below.

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

Both rendering surfaces now share the approved artwork. The installed app, its profile and the private source laboratory remain untouched. Minor visual polish and a future installer/release remain separate work.

## Stage four: progressive speech

Launcher bubbles and native desktop CyberBot notices now share a typewriter controller. It reveals one Unicode grapheme every 28 milliseconds, writes the main message followed by its detail, and shows a single blinking caret beside the current text. The approved chest equalizer follows the actual writing state. This replaces the fixed 1.8-second speech cue from stages two and three without changing the chosen face or artwork.

The complete text reserves the bubble's final footprint from the start, so its size and position remain stable during writing. Context tags and action buttons remain available immediately. Accessible text contains the complete message once; visual character updates and the invisible size reserve are hidden from assistive technology. Reduced motion displays the full message immediately without a caret or speech animation.

New messages replace the writing session; closing a notice disposes its timer. Updates to live values such as countdown seconds keep their existing message identity and show the updated value immediately, rather than repeatedly animating stale numbers. Scheduler countdown lifetimes retain their original deadline. Other timed speech lasts at least the expected writing duration plus 2.5 seconds for reading; persistent messages remain persistent. The App notification timer also uses this minimum to avoid clearing a long CyberBot announcement prematurely. This can extend the corresponding long banner fallback's lifetime, although banners still render their text immediately.

Native desktop messages retain their existing two-line title and single-line detail limits. During writing, the text viewport follows the caret; after completion, the original truncation returns. Launcher bubbles retain their normal wrapping.

Verification: all 61 CyberBot tests, TypeScript and production build passed. Real Electron checks covered the mounted launcher component and an actual App interaction, sequential title/detail writing, Unicode text, writing beyond 1.8 seconds, message replacement, dismissal, live reduced-motion changes, priority face preservation and exact bubble geometry before and after writing. The launcher bubble stayed at 300 by 178.375 CSS pixels; the desktop bubble stayed at 382 by 95.03125 pixels in the corresponding controlled case. Native source and compiled file loading were both checked, including visible caret bounds, live countdown updates, literal HTML text and a long nonpersistent notice that finished writing before its reading interval and automatic dismissal. No renderer errors occurred in those checks. The build retains its existing chunk-size warning.

The review runs in an isolated profile. The installed app, actual scheduled tasks, private control files and private laboratory are unchanged.

## Drag direction polish

Flight tilt now follows the latest nonzero pointer movement instead of combining displacement from the grab point with averaged velocity. Motion's stationary callbacks retain the last posture; a new vertical movement returns the tilt to neutral. The existing 14-degree limit remains. The integration stylesheet shortens only the dragging transform transition from 80 to 40 milliseconds; the laboratory artwork, extracted stylesheet and other animation timings are unchanged.

Verification: all 61 CyberBot tests, TypeScript and production build passed. The isolated native Electron review exercised repeated direction reversals while the pointer remained on the same side of its original grab point, a slower three-pixel reversal, stable flight expression, release anchoring and reduced motion. In the completed controlled run, the three main reversals visibly changed sign approximately 45, 50 and 65 milliseconds after the pointer event. The drop coordinates remained identical before and after release. These are measurements from that run, not a latency guarantee for every machine or pointer event.

## Two alternating hover reactions

Hover now alternates between focus and scan on eligible pointer entries. Focus lifts the unchanged head by two SVG units, tilts it by at most 2.4 degrees toward the pointer and moves a soft reflection inside the visor. Scan makes one 760-millisecond pass across the visor with a brief sensor-light pulse, then stops while the pointer remains still. The front expression is preserved; the old horizontal compression and rear smiling face are no longer activated by hover. These effects use the existing drawing with small planar movements and lighting cues, rather than a 3D head rotation.

The new visor layers are clipped and their SVG references remain unique per instance. The scan gradient uses explicit user-space coordinates so a horizontal path with a zero-height bounding box still paints correctly. The extracted laboratory SVG and stylesheet are unchanged; application additions live in the existing integration layer.

Dragging, departure/return, marquee, sleeping, RAM/storage alerts and reduced motion suppress the new reactions. An interrupted effect waits for a fresh pointer entry before another reaction can start. Ordinary face changes and speech do not restart an effect or consume the alternating sequence. Pointer tracking uses one cancellable animation frame and is removed on interruption or unmount.

Verification: all 63 CyberBot tests, TypeScript and production build passed. Native Electron checks used the actual shared avatar at its 80 by 92 CSS pixel launcher size and also exercised the App's pointer-entry handler. They verified alternating entries, pointer tracking, unchanged front face, no horizontal flattening, natural scan completion, cancellation during drag/portal/priority states, live reduced-motion changes and 200 distinct SVG IDs across two instances. Controlled capture frames were inspected. A local pixel comparison confirmed that the scan actually paints its visor stroke; natural playback reached opacity 0.848 and returned to zero while the pointer remained hovered. The physical drag-direction check still passed, including release with identical before/after coordinates. No renderer errors occurred. The build retains its existing chunk-size warning.

## Permanent material lighting

Cursor-responsive lighting now follows the existing shoulder bevels and narrow torso edges, with a quieter accent along the helmet curves. The visor reflection from the focus hover is removed. The head attention and single scan pass remain unchanged. The helmet highlight survives the compact marquee transformation because it belongs to the head; the torso highlights retract with their parent chassis.

The virtual light travels across the entire renderer window, independently of hover or expression. It retains its last position when the pointer stops or leaves the window. This does not track the pointer outside the application. One coalesced animation frame updates each mounted avatar's local SVG gradients per pointer frame; no continuous lighting loop runs at rest. Departure and unmount remove the listeners and cancel pending frames. Reduced motion retains stationary material highlights. The launcher and desktop notification share the same implementation, with per-instance SVG IDs and no new user-facing text.

Verification: all 63 CyberBot tests, TypeScript and production build passed. Native Electron checks confirmed visible material changes between distant window corners with no hover, persistence at rest and across speech/expression updates, marquee retraction, disabled tracking during departure and reduced motion, and both alternating hover reactions. Controlled native pixel comparison found 1,329 changed color channels between the two lighting positions; the scan still painted its own stroke and completed naturally. A physical pointer check exercised the actual App from far away from the bot. The compiled desktop notification was loaded through file: and verified for changing highlights and live reduced motion. Physical drag reversals, slow direction changes and unchanged drop anchoring passed. These checks recorded no renderer errors.

The review remains isolated from the installed app and its profile. The private laboratory, extracted SVG and extracted stylesheet are unchanged. The production build retains its existing chunk-size warning.

## Highlight stability during motion

The material strokes now have more continuous coverage at the small displayed size: the two specular outlines use 1.4 SVG units with lower opacity, and the faint base edges use 1.1 units at 0.07 opacity. Their color and geometry are preserved. Geometric precision remains enabled for the new material layers.

Ordinary levitation now uses SVG animateTransform, with the approved 8-unit vertical travel, 3.2-second duration and matching ease-in-out splines. The four nested assembly/head/chassis groups no longer request persistent transform promotion. This avoids sliding and resampling cached thin-curve textures during ordinary levitation. Portal, drop, hover and drag transforms keep their existing controllers and timings. A local class observer starts and ends the vector float, including the delayed restart after drop settling. It is disconnected on unmount. Departure is explicitly ineligible for float; reduced motion ends the SVG animation. The private laboratory and extracted drawing/styles are unchanged. SVG animation is described in the [SVG specification](https://www.w3.org/TR/SVG2/animate.html).

Cursor lighting now approaches its target with a short exponential response (45-millisecond time constant). It writes only changed gradient coordinates, settles to the exact target and stops requesting frames. Hiding the document pauses this work; departure, reduced motion and unmount cancel pending frames and remove listeners. Lighting remains independent of hover, speech and expression.

Verification: all 63 CyberBot tests, TypeScript and production build passed. Native Electron checks covered natural vector movement, stable animation start across speech changes, drag cancellation, delayed float restart after settling, portal return, live reduced-motion changes, progressive cursor response, exact settling and zero gradient mutations during a stationary 750-millisecond observation. Existing alternating hover, actual scan paint, marquee retraction, per-instance SVG references and real App pointer input also passed. The compiled desktop notification was tested through file: for lighting, moving vector float and reduced motion. Physical drag reversals, slower direction changes and unchanged drop coordinates passed. No renderer errors were recorded.

A controlled native comparison at 125% scaling isolated the actual material layers on black and sampled 11 equivalent levitation frames over 0.8 seconds, with a fixed light direction. The previous CSS motion/style was compared with the corrected shared component. The helmet's luminance-weighted contrast range decreased from 23.94 to 9.60; total material luminance variation (coefficient of variation) decreased from 0.395% to 0.168%. Additional renderer device-scale emulations of 100% and 150% passed the same contrast-stability comparison. These measurements describe the sampled renderings, not a claim of zero pixel variation or identical results on every display. Increasing SVG layout size and scaling it back down did not improve the controlled result and is not used.

The isolated review remains available for live visual assessment. The installed app and real profile are unchanged. The build retains its existing chunk-size warning.

## Floor-aware marquee and quieter torso reflections

Torso material highlights are attenuated by 12% as a group, keeping their geometry, rendering stability and cursor response. Helmet highlights, reactor lighting and speech equalizer are unchanged.

The launcher now checks whether the positioned avatar's landed head would touch the measured taskbar/footer floor, within one CSS pixel. This includes the result of obstacle avoidance, rather than only the saved position. When elevated, marquee retains the full torso and the head's normal height while text continues scrolling in the visor. Landing and screen conversion remain available at the floor, including after horizontal movement or a deliberate return to the floor. Top placement and temporary upward relocation use the full body. Dragging cannot initiate screen conversion. Inspection controls also respect this floor constraint.

Verification: all 65 CyberBot tests, TypeScript and production build passed. Native Electron checks used physical drag/drop on the real CyberBot component: lifting it 160 pixels, moving sideways at that height, returning exactly to the measured floor, and moving horizontally along it. The landed bottom measured 777.600024 CSS pixels against a floor at 777.600037. Elevated text continued scrolling, the torso stayed visible and the head had no landing transform. Top-corner placement, obstacle relocation/restoration and reduced-motion dragging passed. The observed torso highlight opacity was 0.88 and the helmet remained 1. No renderer errors occurred. The existing build chunk-size warning remains.

## Informative marquee content

The marquee catalog now combines the application version with real registered-shortcut count, today's launch total and the configured launcher activation shortcut. Valid favorites and future scheduled launches are included when present. Favorite IDs that no longer identify registered shortcuts are excluded; scheduled entries at or below zero remaining seconds are excluded. A missing keyboard shortcut is omitted. Generic readiness, online/health assertions, branding-only entries and greetings are removed from the marquee catalog. Existing greeting speech remains available.

English and Spanish use matching variables for all new labels. Standalone avatars without application data fall back to the actual version. The legacy single-message selector now handles one-entry and empty catalogs without returning undefined; multi-entry catalogs still avoid immediate repeats. The App passes the real renderer state into the shared formatter, so per-second scheduler countdown updates do not change the text catalog unless its pending count changes.

Verification: all 66 CyberBot tests, TypeScript and production build passed. Tests cover stale/duplicate favorite IDs, pending versus due tasks, empty optional data, bilingual formatting and valid fallback catalogs. Native Electron inspection confirmed the real App's 75 registered shortcuts in the marquee. A mounted real avatar rendered Spanish and English catalogs derived from the isolated profile's actual library, favorite IDs, day counter and activation shortcut; both continued scrolling. The existing large-chunk build warning remains.

## Subdued interaction glow through dragging

Hover's outer shadow is reduced from a 14-pixel blur at alpha 0.35 to an 8-pixel blur at alpha 0.18. The avatar's interaction lighting stays active while either hovered or being dragged, independently of the focus/scan reaction. Its body filter remains the same before grab, while held and after release under the pointer. Filter transitions take 250 milliseconds in resting, levitating and dragging states; dragging retains its 40-millisecond transform transition.

Crest and ear bloom are also quieter. Their interaction filters remain stable during a held drag, including the ear light whose existing flight animation otherwise overrides a normal-priority filter declaration. Leaving the bot fades the outer glow away. Dragging still cancels the hover posture/scan; keeping the light does not restart those reactions on release.

Verification: the isolated real App recorded 31 dragging frames with uninterrupted, identical outer light. Computed body, crest and ear filters matched in hover, held drag and release. Pointer leave removed the outer light, and reduced motion retained the same subdued static highlight. The broader native checks passed for the alternating reactions, real scan stroke paint and natural completion, vector levitation, settling, portal return, marquee and stationary material lighting. The compiled native desktop notification loaded through file: and used the same 8-pixel, alpha-0.18 hover shadow; vector motion and reduced motion also passed. No renderer errors occurred. The private laboratory and installed profile remain untouched.
