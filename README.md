# Beyond / Work — Good work. Hands free.

A work-first, interactive Meta-glasses strategy by Tamerlan Goglichidze for his YUCG application. Published at https://gtamerlan.github.io/beyond-meta-case/.

## The experience

- A procedural 3D grocery store with a moving worker and shopping cart, six task stages, a scrubber, overhead and glasses-eye cameras, and optional AR guidance.
- An indoor-navigation explainer separating approved partner data, store maps, future spatial tracking and deliberate confirmation.
- A product-check simulation that rejects the wrong product. Replacement requires both simulated customer approval and explicit worker confirmation.
- A black-glasses, companion-phone and optional-ring 3D system with selectable layers and drag interaction.
- A fictional partner-job preview and session-only, opt-in interface preferences.
- A three-phase, five-year implementation plan, seven dated sources with limitations, and the user's complete proposal with copy support.
- Desktop/mobile layouts, keyboard controls, reduced motion and a visible motion toggle. The 3D renderers pause offscreen.

## Evidence and privacy

All store geometry, workers, task data and interfaces are original procedural concepts. The site has no camera, microphone, eye tracking, accounts, analytics or backend. No job is accepted or customer contacted. Preferences live only in the open page.

The spatial AR view is a future concept, not a current Meta-glasses specification. Partner integrations and the ring are proposals. The 10% time-saving threshold is a proposed pilot target, not measured performance. The 600,000 shopper figure is platform reach, not glasses demand. The $799 figure is a dated launch price, not a proposed retail quote.

The latest user-provided proposal is preserved in `src/brief.md` (779 visible words with headings and citation labels). Facts and their limits are in `src/work-content.js`. An extra Google ARCore source explains general tracking principles, not Meta compatibility. Research reviewed September 12, 2026.

## Development and deployment

```sh
npm ci
npm run dev
node --test test/work-state.test.js
npm run build
```

Vite builds to `dist/`, with relative asset URLs for GitHub Pages. The entry point is `src/work-page.js`; `src/work.css` owns the new visual system. The previous design's modules remain unreferenced in repository history/workspace and are not included in the app bundle.

The GitHub Actions workflow publishes pushes to `main`. The new social preview is a browser render of this site's own original 3D scene, not an image of a real deployment.
