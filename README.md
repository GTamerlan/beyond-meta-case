# Beyond — Your world, beyond the screen

An independent, interactive Meta AR-glasses strategy by Tamerlan Goglichidze for a YUCG application case.

## Contents

- Slim titanium-style Three.js glasses, optional control ring, and scroll-driven spatial-screen reveal
- Animated illustrative workspace, grocery-shopping, and daily-assistant demos
- Fingertip screen-scaling demonstration with keyboard-accessible size control
- BLS employment-growth chart, Instacart active-shopper figure, and historical DHL pilot evidence
- Nanophotonics explainer with an animated, not-to-scale optical-layer diagram
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

New image assets were generated with the built-in image tool: `public/pinch-hand.png` (single right-hand pinch, transparent background, warm skin and cool rim light) and `public/grocery.jpg` (first-person grocery aisle, apples and greens left, partial cart right, no people or UI). The conceptual spatial panels depict what a wearer could see; the glasses are not represented as projecting visible images into free space.
