# Beyond — Life doesn’t fit inside a screen.

An independent, interactive Meta AR-glasses strategy by Tamerlan Goglichidze for a YUCG application case.

## Contents

- Black Wayfarer-style Three.js concept glasses, a separately positioned optional control ring, and an automatic staggered spatial-screen reveal
- Animated illustrative workspace, grocery-shopping, and daily-assistant demos
- Fingertip screen-scaling demonstration with keyboard-accessible size control
- BLS employment-growth chart, Instacart active-shopper figure, and historical DHL pilot evidence
- Nanophotonics explainer with a not-to-scale optical-layer diagram
- Gaze, gesture, ring, and voice interaction concepts
- Two proposed launch segments and a gated five-year roadmap
- A sub-800-word consulting proposal with dated primary-source links
- Responsive layouts and reduced-motion support

The narrative and all demonstrations are proposals, not Meta product specifications. The experience requests no camera, microphone, or tracking permissions. No analytics or account connections are included.

## Run

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
```

Static output is in `dist/`. Relative asset paths support GitHub Pages project URLs. Pushes to `main` publish through the GitHub Actions workflow after Pages is enabled with GitHub Actions as its source.

## Sources and assets

Dated research is recorded in `src/sources.js`. The full proposal is in `src/brief.md`. The 3D geometry is original procedural work. Environment photographs are AI-generated illustrations, not evidence of real products or people using AR.

Research reviewed September 12, 2026.

The September 12 editorial redesign uses the Apple Vision Pro page as a reference for pacing, hierarchy, and restraint, with original copy and assets. The new light theme is in `src/editorial.css`; the previous dark-theme stylesheets remain as unused historical source. WebGL rendering stops when the object is at rest and is suspended offscreen. Spatial windows use a short entrance, not perpetual floating. The complete case is 754 words including headings and visible citation labels, excluding URL strings. Its executive summary, explicit hypothesis, three initiatives, cost tradeoffs, and decision gates follow the useful structural patterns in YUCG's supplied sample responses without copying their case content.

New product and social-preview images, with generation prompts, are documented in [ASSET-NOTES.md](./ASSET-NOTES.md). They are illustrative concepts, not actual Meta product photographs.

Frame silhouette visual reference: [Ray-Ban Meta Wayfarer Gen 2, black](https://www.ray-ban.com/usa/electronics/RW4012ray-ban%2Bmeta%2Bwayfarer%2B-%2Bgen%2B2-black/8056262721308). The procedural model is an independent visual concept, not an exact product model or a claim that this product supports full spatial AR. The opening plays once after scene readiness, can be replayed, and uses a static expanded composition for reduced motion.

New image assets were generated with the built-in image tool: `public/pinch-hand.png` (single right-hand pinch, transparent background, warm skin and cool rim light) and `public/grocery.jpg` (first-person grocery aisle, apples and greens left, partial cart right, no people or UI). The conceptual spatial panels depict what a wearer could see; the glasses are not represented as projecting visible images into free space.
