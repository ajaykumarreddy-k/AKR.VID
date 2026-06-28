# ArtKit Clone — Product Requirements Document

**Status:** Phase 1 shipped (9 of 12 tools fully working). Phase 2 specced, not built.
**Companion code:** `artkit-clone.zip` (delivered alongside this doc) — open `index.html` in any modern browser, no install, no build step.

---

## 1. Summary

A single-page gallery of small, independent browser tools that apply visual effects (halftone, ASCII art, dithering, glass distortion, blur, glitch, CRT/VHS, color remap, lego-mosaic, and — in Phase 2 — blob tracking and audio-reactive visuals) to an image, video, or webcam feed. Every tool runs **100% client-side**: nothing uploaded ever leaves the browser tab, there is no backend, no account, no build pipeline. It is meant to be cloned/extended by an AI coding agent, so this document is written to be handed to one.

## 2. Goals / Non-goals

**Goals**
- A working static site: `index.html` + a handful of per-tool `.html` files + one shared `engine.js` + one `styles.css`.
- Every Phase 1 tool actually processes pixels in the browser (Canvas2D), not a mockup.
- A shared, reusable engine so adding tool #13 doesn't mean re-solving file upload, drag-and-drop, the render loop, or export.
- Runs fully offline after the page loads once (no CDN dependency for Phase 1 tools).

**Non-goals (explicitly out of scope for this PRD)**
- User accounts, pricing/paywalls, analytics, or any server component.
- Mobile native apps.
- Pixel-perfect parity with any specific commercial product's proprietary algorithms — the goal is *the same category of effect*, built from first principles.

## 3. Users & use cases

Hobbyists and designers who want quick, no-signup, in-browser image/video stylization: retro halftone prints, ASCII-art renders, glitch/VHS aesthetics for social content, lego-mosaic novelty images, duotone color grading.

## 4. Tech stack & architecture

| Layer | Choice | Why |
|---|---|---|
| Markup/styling | Plain HTML + one shared `styles.css` | No build step; opens directly in a browser. |
| Logic | Vanilla JS (ES2017+), no framework | Zero install, zero bundler, smallest possible surface area to debug. |
| Image/video processing | Canvas2D (`getImageData`/`putImageData`, `drawImage`, `ctx.filter`) | Available everywhere, fast enough for these effects at typical photo/webcam resolutions. |
| Export | `canvas.toDataURL()` for PNG, `canvas.captureStream()` + `MediaRecorder` for WebM | Built into the browser, no server-side encoding needed. |
| Persistence | None — in-memory only per the no-`localStorage` constraint of this environment, and because there's nothing server-side to sync to anyway | Every reload starts clean; this matches the "no account" goal. |

**Core architectural idea:** every tool treats its input as *a stream of frames*. A frame is drawn into a hidden `srcCanvas` whether it came from a still image (drawn once) or a `<video>`/webcam (redrawn every `requestAnimationFrame`). Each tool supplies one pure-ish function, `render(ctx, srcCanvas, w, h, params)`, that reads the current frame and paints the effect. This is what makes most Phase 1 tools "just work" on video even though they were designed against still images — the engine's render loop calls the same function every frame.

## 5. Project structure

```
artkit-clone/
├── index.html              gallery home — lists all 12 tools as cards
├── styles.css              shared dark theme (design tokens at the top)
├── js/
│   └── engine.js           ArtKitTool class + UI control builders (mountSlider, mountChoice, mountColorSwatches)
└── tools/
    ├── _template.html      copy this to scaffold a new tool (see §10)
    ├── tonekit.html        ✅ halftone
    ├── asciikit.html       ✅ ASCII art
    ├── retroman.html       ✅ ordered dithering / pixel art
    ├── glassify.html       ✅ glass refraction (ripple / frosted)
    ├── blursuite.html      ✅ linear / zoom / radial / wave blur
    ├── superg.html         ✅ glitch (RGB split, slice displacement, block corruption)
    ├── scanline.html       ✅ CRT scanlines / VHS jitter / grain / vignette
    ├── recolor.html        ✅ hue rotate (animatable) / duotone
    ├── blocks.html         ✅ lego-style mosaic with studs & shading
    ├── babytrack.html      🚧 Phase 2 — pass-through placeholder, spec in §9
    ├── imagetrack.html     🚧 Phase 2 — pass-through placeholder, spec in §9
    └── triggerwave.html    🚧 Phase 2 — working live audio-energy meter, full beat-sync spec in §9
```

## 6. Shared engine API (`js/engine.js`)

Every tool page does the same five things, so they all go through one class:

```js
const tool = new ArtKit.ArtKitTool({
  canvasId: 'canvas',     // output <canvas> in the page
  onRender: render,       // your effect function, see below
  params: {},             // mutated live by the UI controls
});

tool.bindUpload(fileInputEl, dropTargetEl);  // wires <input type=file> + drag&drop
tool.openCamera();                            // getUserMedia, starts the render loop
tool.exportPNG('name.png');
tool.exportWebM('name.webm', 5000);           // records 5s of the live canvas
tool.refresh();                               // re-render once (for still images after a slider change)
```

Your effect function's contract:

```js
// w/h already match the source's natural size; ctx.canvas is sized to match too.
function render(ctx, srcCanvas, w, h, params) {
  // srcCanvas is the CURRENT raw frame (image, or this instant of video/webcam)
  // paint your effect onto ctx
}
```

Three UI builders cover every control seen across the tools:

```js
ArtKit.mountSlider(containerEl, { key, label, min, max, step, value, params, onChange });
ArtKit.mountChoice(containerEl, { key, label, options: [...], value, params, onChange });
ArtKit.mountColorSwatches(containerEl, { key, label, colors: ['#...'], value, params, onChange });
```

Each builder writes the chosen value into `params[key]` and calls `onChange` — tool pages almost always pass `onChange: () => tool.refresh()`.

**Full engine source is in the delivered zip at `js/engine.js`** (it passed `node --check` and is exercised by all 9 live tools — treat it as stable; extend, don't rewrite).

## 7. Tool catalog

| Tool | Status | Media | Badge | Core technique |
|---|---|---|---|---|
| ToneKit | ✅ Shipped | Image, Video | — | Per-cell brightness sampling → shape size mapping (halftone) |
| ASCIIKit | ✅ Shipped | Image, Video | — | Per-cell brightness → character ramp lookup |
| Retroman | ✅ Shipped | Image | — | Downscale + ordered (Bayer) dithering + palette quantization |
| Glassify | ✅ Shipped | Image, Video | — | Per-pixel coordinate displacement (ripple / cell-jitter) |
| BlurSuite | ✅ Shipped | Image, Video | — | Multi-sample additive compositing (linear/zoom/radial) + row-offset wave |
| Super-G | ✅ Shipped | Image, Video | — | True per-channel RGB split (additive blending) + slice displacement + corruption blocks |
| Scanline | ✅ Shipped | Image, Video | — | Scanline overlay + band displacement + per-pixel noise + radial vignette |
| ReColor | ✅ Shipped | Image, Video | — | `ctx.filter: hue-rotate()` (animatable) or luminance→duotone gradient mapping |
| Blocks | ✅ Shipped | Image, Video | — | Per-cell average color → rounded block + stud + shading |
| BabyTrack | 🚧 Phase 2 | Video | "Most Popular" | Frame-diff blob detection + centroid tracking (spec in §9.1) |
| ImageTrack | 🚧 Phase 2 | Image | — | Single-frame blob/feature detection (spec in §9.1) |
| TriggerWave | 🚧 Phase 2 | Video+Audio | "Experimental" | Web Audio `AnalyserNode` beat detection (spec in §9.2); **live energy meter already works today** |

## 8. Functional spec — Phase 1 (shipped)

Each entry below is the contract the shipped code implements; the code itself lives in `tools/<name>.html` in the zip. Two are reproduced in full here as worked examples.

### 8.1 ToneKit — halftone

**Params:** `shape` (Square/Circle/Cross/Triangle/Line), `sampleSize` (4–60px grid), `scale` (0.1–1.5), `rotation` (0–360°), `mode` (Monochrome/Original Color), `color` (swatch).
**Algorithm:** walk the source in a `sampleSize`-px grid; for each cell read the center pixel's brightness `(r+g+b)/3/255`; draw `shape` at the cell center with radius `brightness * (sampleSize/2) * scale`; the whole canvas is rotated around its center by `rotation` before drawing.

```js
function render(ctx, src, w, h, p) {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
  const data = src.getContext('2d').getImageData(0, 0, w, h).data;
  const cell = p.sampleSize, maxR = (cell / 2) * p.scale;
  ctx.save();
  ctx.translate(w / 2, h / 2); ctx.rotate(p.rotation * Math.PI / 180); ctx.translate(-w / 2, -h / 2);
  for (let y = 0; y < h; y += cell) {
    for (let x = 0; x < w; x += cell) {
      const i = (y * w + x) * 4;
      const r = data[i], g = data[i+1], b = data[i+2];
      const radius = ((r+g+b)/3/255) * maxR;
      ctx.fillStyle = p.mode === 'Original Color' ? `rgb(${r},${g},${b})` : p.color;
      drawShape(ctx, p.shape, x + cell/2, y + cell/2, radius); // see tools/tonekit.html for drawShape()
    }
  }
  ctx.restore();
}
```

### 8.2 Super-G — glitch

**Params:** `rgbShift` (0–20px), `bands` (0–25), `sliceShift` (0–80px), `corruption` (0–20 blocks), `animate` (Off/On), plus a "Re-roll Glitch" button.
**Algorithm:** (1) isolate each of R/G/B into its own single-channel `ImageData`, then draw all three back with `globalCompositeOperation = 'lighter'` at small horizontal offsets — a *true* chromatic-aberration split, not a tinted blend; (2) redraw a handful of random horizontal bands of the source at a random horizontal offset (slice displacement); (3) paint a handful of small random-colored rectangles (block corruption). A deterministic `pseudoRandom(a,b)` (sine-hash) seed drives all the randomness so the same seed reproduces the same glitch — `animate=On` feeds `performance.now()` as the seed for continuous variation.

Full implementation: `tools/superg.html`.

### 8.3 ASCIIKit, Retroman, Glassify, BlurSuite, Scanline, ReColor, Blocks

Same shape of spec (params table → grid/per-pixel pass → `putImageData` or `drawImage` composites). Rather than duplicate ~600 lines of working code into this document, **the authoritative spec for each is its file in the zip** — every file is self-contained, under 130 lines, and follows the exact same five-step page skeleton (upload wiring → `ArtKit.ArtKitTool` construction → `render()` → control mounting → export buttons), so reading any one teaches you all of them. Param tables:

| Tool | Params |
|---|---|
| ASCIIKit | `ramp` (Classic/Blocks/Binary/Detailed), `cell` (6–28px), `fontScale` (0.5–1.3), `mode`, `color` |
| Retroman | `method` (Ordered Bayer/Nearest Color), `pixel` (2–16px block), `palette` (B&W/Game Boy/Sepia) |
| Glassify | `mode` (Ripple/Frosted), `amplitude`, `wavelength`, `cellSize`, `animate` |
| BlurSuite | `mode` (Linear/Zoom/Radial/Wave), `strength`, `steps` (sample quality), `angle`, `wavePeriod`, `animate` |
| Scanline | `scanlineOpacity`, `jitter`, `noise`, `vignette` (Off/On), `animate` |
| ReColor | `mode` (Hue Rotate/Duotone), `hue`, `saturation`, `animate`, `colorA`/`colorB` swatches |
| Blocks | `cell` (6–50px), `studs` (Off/On) |

## 9. Functional spec — Phase 2 (not yet built)

These three need a fundamentally different technique (temporal feature tracking; audio DSP) rather than a per-frame pixel filter, so they're specced here for whoever (human or AI agent) implements them next, instead of being rushed into Phase 1.

### 9.1 BabyTrack / ImageTrack — blob tracking

**What the screenshots show:** numbered boxes around bright regions of a video/image, with connector lines and a velocity-like number — i.e., detect a handful of "blobs," and for video, track each blob's centroid frame-to-frame and label its movement.

**Algorithm (no external CV library, pure Canvas2D + JS):**
1. **Detect candidate blobs in a frame:** threshold the frame to a binary mask (brightness > a slider-controlled cutoff, or for ImageTrack, simple Otsu-style auto-threshold). Run 4-connected flood fill / connected-component labeling over the mask to get a list of regions; keep the top-N by area as "blobs," each with a bounding box and centroid.
2. **Track across frames (BabyTrack only):** for each new frame's blobs, match against the previous frame's blobs by nearest centroid (greedy nearest-neighbor assignment, reject matches beyond a max-distance threshold); unmatched new blobs start a new track ID, unmatched old tracks expire after a few missed frames.
3. **Render:** draw each tracked blob's bounding box + a label; draw lines between currently-tracked centroids (mirrors the "connector graph" look in the reference screenshots); the number shown can be displacement-per-frame (a simple velocity proxy) rather than a literal computer-vision metric.

**Function-signature skeleton to implement** (drop into `tools/babytrack.html`, replacing the placeholder `render()`):

```js
function detectBlobs(imageData, w, h, threshold) { /* -> [{x,y,w,h,cx,cy}, ...] */ }
function matchTracks(prevTracks, newBlobs, maxDist) { /* -> updated track list with stable ids */ }
function render(ctx, src, w, h, p) {
  const frame = src.getContext('2d').getImageData(0, 0, w, h);
  const blobs = detectBlobs(frame, w, h, p.threshold);
  tracks = matchTracks(tracks, blobs, p.maxJump);     // `tracks` persists across calls (module-level)
  ctx.drawImage(src, 0, 0, w, h);
  drawTrackOverlay(ctx, tracks, p.regionStyle);         // boxes/lines/labels per the "Region Style" control
}
```
**Params to expose:** `threshold`, `maxBlobs`, `maxJump` (px/frame before a track is dropped), `regionStyle` (Basic/Cross/Label/Frame/Grid/... — purely a drawing style, can be a `switch` in `drawTrackOverlay`), `shape` (rect/circle).
**Perf note:** connected-component labeling on a full-res frame every tick is the likely bottleneck — downscale the mask (e.g. to 160px wide) before labeling, then scale box coordinates back up.

### 9.2 TriggerWave — beat-synced visuals

**Already working today:** `tools/triggerwave.html` loads an audio file, runs it through a Web Audio `AnalyserNode`, computes a 0–1 "energy" value every animation frame, and drives a simple reactive circle plus a live meter in the sidebar. That's the hard, unglamorous infrastructure piece (`AudioContext`, `createMediaElementSource`, `getByteFrequencyData`) already solved.

**What's left:**
1. **Beat detection**, not just raw energy: keep a short rolling average of `energy`; flag a "beat" when the instantaneous value exceeds the rolling average by a configurable multiplier (a classic simple-and-good-enough onset detector) — debounce with a short refractory window (~150ms) so one beat doesn't fire twice.
2. **Visual presets reacting to beats**, e.g. flash/scale/color-shift on the canvas, parameterized like the other tools (pick 2–3 presets, not a generic plugin system, to stay in scope).
3. **Export with audio**: `canvas.captureStream()` only carries video; merge in an audio track via `audioCtx.createMediaStreamDestination()` connected in parallel to the analyser, then add that stream's audio track to the canvas's `MediaStream` before handing it to `MediaRecorder`. This is the one Phase 1 tools never needed (they're silent), so it's net-new wiring, not a copy of `exportWebM`.

```js
// skeleton additions to triggerwave.html
function isBeat(energy, rollingAvg, lastBeatTime, now) {
  return energy > rollingAvg * 1.4 && now - lastBeatTime > 150;
}
function buildExportStream(canvas, audioDestNode) {
  const videoStream = canvas.captureStream(30);
  const audioTrack = audioDestNode.stream.getAudioTracks()[0];
  return new MediaStream([...videoStream.getVideoTracks(), audioTrack]);
}
```

## 10. How to add a new tool (for whoever — human or AI — does this next)

1. Copy `tools/_template.html` to `tools/yourtool.html`.
2. Replace every `TOOLNAME` placeholder (title, `.tool-logo`).
3. For each parameter, add a `<div id="ctrl-yourParam"></div>` row in the sidebar markup, then call the matching `ArtKit.mount*` builder for it at the bottom of the `<script>`.
4. Write `render(ctx, src, w, h, p)`. Read pixels with `src.getContext('2d').getImageData(0,0,w,h)` when you need per-pixel access; otherwise just `ctx.drawImage(src, ...)` / canvas composite ops, which are far cheaper.
5. If the effect should animate even on a still image (most "Glass"/"Glitch"-style effects benefit from this), add an `animate` `mountChoice` Off/On that calls `tool.startLoop()` / `tool.stopLoop()` — videos already loop automatically, so guard with `if (tool.isVideo) return;`.
6. Add a card object to the `TOOLS` array in `/index.html` (`key`, `name`, `badge`, `tags`, `desc`, `href`, `stub`, and an inline-SVG `thumb` — keep thumbnails abstract/geometric, generated by code, not photographs, so there's no image-licensing question).
7. Manually verify: open `index.html`, click through to the new card, upload a test image *and* a test video, drag-and-drop a file, move every slider, click every export button, and reload the page once to confirm no leftover state breaks a fresh load.

## 11. Non-functional requirements

- **Privacy:** no network calls for processing — files never leave the browser. State this on the homepage if/when copy is added.
- **Offline:** after the first load, every Phase 1 tool works with no internet connection (no CDN scripts are used).
- **Browser support:** Chrome/Edge/Firefox current versions. `ctx.filter` (used by ReColor's hue-rotate) and `MediaRecorder` (used by WebM export) are unsupported or partial in older Safari — note this rather than silently failing; consider feature-detecting and hiding the WebM export button when `canvas.captureStream` is undefined (the engine already checks this and shows an alert).
- **Performance:** per-pixel JS loops (`getImageData`/`putImageData`) are the ceiling on resolution/frame-rate for several tools (Super-G, Glassify, Scanline's noise pass, ReColor's duotone). At 1080p video these will not hit 30fps in plain JS; that's an accepted Phase-1 tradeoff documented here rather than silently shipped as a bug. If this becomes a real complaint, the fix is moving the hot loops to a `WebGL`/fragment-shader pass per tool — a larger rewrite, intentionally deferred.
- **Important caveat — running via `file://` vs. a local server:** double-clicking `index.html` works for every upload/drag-drop/export feature. The one exception is the **"Open Camera" button** (`getUserMedia`), which browsers only allow from a "secure context" (`https://` or `http://localhost`) — it will silently fail or throw a permission error over a bare `file://` URL in Chrome. To use the camera feature, serve the folder locally first, e.g. `python3 -m http.server 8000` or `npx serve`, then open `http://localhost:8000`.

## 12. Direction for an AI coding agent picking this up

If you (an AI agent) are asked to extend this project, do the following in order:

1. **Read `js/engine.js` and one shipped tool (`tools/tonekit.html` is the simplest) before writing anything.** The pattern is intentionally identical across every tool file — don't introduce a second pattern.
2. **Phase 2 priority order:** ImageTrack (single-frame, simplest of the three) → BabyTrack (adds temporal tracking on top of ImageTrack's detector) → TriggerWave's beat-detector + audio-muxed export (independent of the other two, can be done in parallel).
3. **Don't add a build step, a framework, or a package.json unless explicitly asked.** The entire point of this project is "open the HTML file and it works."
4. **Don't add third-party CDN scripts to Phase 1 tools** — they're offline-capable today; keep them that way. If a Phase 2 feature genuinely needs a library (e.g. a CV library for blob detection at scale), call that out explicitly as a dependency change rather than adding it silently.
5. **Acceptance bar for any new/changed tool:** upload an image, upload a video, drag-and-drop a file, every slider/control visibly changes the output, "Export PNG" downloads a file, "Export WebM" downloads a file for video sources, and the page has no console errors on load or while interacting.
6. **When in doubt about a visual detail** (exact dot pattern density, exact blur falloff curve, etc.), prefer matching the *category* of effect described in §7/§8/§9 over guessing at a specific reference implementation's internals — there is no proprietary algorithm to reverse-engineer here, only a style of effect to recreate.

---

*End of PRD. Runnable code for every Phase 1 tool, the shared engine, and the two Phase 2 starters (placeholder pass-through + working audio meter) ships in `artkit-clone.zip` alongside this document.*
