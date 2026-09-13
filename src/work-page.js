import '@fontsource-variable/dm-sans';
import '@fontsource-variable/manrope';
import './work.css';
import { createIcons, ArrowUpRight, ArrowRight, ArrowDown, Play, Pause, RotateCcw, Glasses, MoveUpRight, Check, Plus, Minus, X, ScanLine, Navigation, ShoppingBag, Smartphone, CircleDot, ChevronRight, LockKeyhole, Volume2, Eye, Layers3, Wrench, CheckCheck, Copy, Download } from 'lucide';
import { workSources, walkthroughSteps, navigationLayers } from './work-content.js';
import { clamp, stageAt, nextProgress, newOrder, scanItem, requestReplacement, approveReplacement, confirmReplacement, orderCount } from './work-state.js';
import brief from './brief.md?raw';

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const icon = name => `<i data-lucide="${name}" aria-hidden="true"></i>`;
const icons = { ArrowUpRight, ArrowRight, ArrowDown, Play, Pause, RotateCcw, Glasses, MoveUpRight, Check, Plus, Minus, X, ScanLine, Navigation, ShoppingBag, Smartphone, CircleDot, ChevronRight, LockKeyhole, Volume2, Eye, Layers3, Wrench, CheckCheck, Copy, Download };
const refreshIcons = () => createIcons({ icons, attrs: { 'stroke-width': 1.6 } });
const sourceAliases = { 'shopper-scale': 'instacart', visioncouncil: 'vision-council', display: 'meta-display' };
const source = (id, label) => `<button class="source-link" data-source="${sourceAliases[id] || id}">${label} ${icon('arrow-up-right')}</button>`;
const logo = `<svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M5 25V7h11a8 8 0 0 1 0 16H9M16 7V2M24 15h6"/></svg>`;

document.querySelector('#app').innerHTML = `
<div class="reading-progress" aria-hidden="true"></div>
<header class="nav">
  <a class="brand" href="#top" aria-label="Beyond home">${logo}beyond<span>/ work</span></a>
  <nav aria-label="Main navigation"><a href="#walkthrough">The experience</a><a href="#how">How it works</a><a href="#plan">The plan</a></nav>
  <div class="nav-actions"><button id="motion-toggle" class="icon-button" aria-label="Pause decorative motion" aria-pressed="false">${icon('pause')}</button><button class="button small dark brief-open">Read the case ${icon('arrow-up-right')}</button></div>
</header>
<main id="top">
  <section class="hero wrap">
    <div class="hero-topline"><span><b class="live-dot"></b> AN INDEPENDENT STRATEGY FOR META</span><span>YUCG CASE STUDY · 2026—2031</span></div>
    <div class="hero-heading">
      <h1>Good work.<br><span>Hands free.</span></h1>
      <div class="hero-intro"><span class="mini-label">KEEP THE PHONE. FREE THE HANDS.</span><p>The next reason to buy smart glasses?<br>Making a real day’s work easier.</p><a class="text-link" href="#walkthrough">Step into the experience ${icon('arrow-down')}</a></div>
    </div>

    <div class="store-shell" id="walkthrough">
      <div class="scene-toolbar"><span class="scene-name"><span class="tiny-dot"></span> THE NEIGHBORHOOD MARKET <em>Interactive concept</em></span><div class="view-toggle" role="group" aria-label="Store camera"><button data-view="overview" aria-pressed="true">${icon('layers3')} Store view</button><button data-view="eyes" aria-pressed="false">${icon('glasses')} Through the glasses</button></div></div>
      <div class="store-stage" id="store-stage" data-view="overview">
        <canvas id="store-canvas" role="img" aria-label="Interactive 3D concept: a worker walks a grocery-store route with AR guidance. Use the view buttons and timeline to explore."></canvas>
        <div class="scene-loading"><span class="loading-orbit"></span><span>Setting up your shift</span></div>
        <div class="scene-fallback" hidden><span>${icon('shopping-bag')}</span><h3>Your next step. In view.</h3><p>The interactive 3D view is unavailable on this device. Use the six steps below to explore the same workflow.</p></div>
        <div class="store-caption"><span class="mini-label">ONE WORKER. ONE ORDER.</span><p>Follow the route.<br>See the difference.</p></div>
        <div class="hud-frame" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
        <div class="hud-direction"><span class="direction-symbol">${icon('move-up-right')}</span><div><span id="hud-location">NEIGHBORHOOD MARKET</span><strong id="hud-task">Pick up your next task.</strong></div><span class="hud-pulse"></span></div>
        <div class="hud-item"><div class="mini-carton"><span>OAT</span></div><div><span class="mini-label">NEXT ON THE LIST</span><strong id="hud-item-name">Oat milk</strong><span id="hud-item-detail">One item at a time. Nothing extra.</span></div>${icon('scan-line')}</div>
        <button id="ar-toggle" class="ar-toggle" aria-pressed="true">${icon('eye')} AR guidance <span>On</span></button>
        <span class="scene-label">SPATIAL AR VISUALIZATION · PROPOSED FUTURE EXPERIENCE</span>
      </div>
      <div class="playback-bar"><button id="walk-play" class="play-button" aria-label="Play store walkthrough">${icon('play')}</button><div class="progress-wrap"><label for="walk-progress">Explore the shift <span id="walk-percent">0%</span></label><input id="walk-progress" type="range" min="0" max="1000" value="0" aria-label="Progress through the store walkthrough"/></div><button id="walk-reset" class="icon-button" aria-label="Restart walkthrough">${icon('rotate-ccw')}</button><span class="playback-note">DRAG TO EXPLORE</span></div>
    </div>
    <div class="walk-steps" role="group" aria-label="Jump to a step in the shopping experience">${walkthroughSteps.map((s, n) => `<button data-step="${n}" aria-pressed="${n === 0}"><span class="step-number">${String(n + 1).padStart(2, '0')}</span><span>${s.title}</span><b></b></button>`).join('')}</div>
    <div class="walk-explainer"><div><span id="walk-kicker" class="mini-label">${walkthroughSteps[0].kicker}</span><h3 id="walk-title">${walkthroughSteps[0].title}</h3></div><p id="walk-detail">${walkthroughSteps[0].detail}</p><span class="concept-note">A simulated order in a fictional store. No live tracking, worker accounts or camera access.</span></div>
  </section>

  <section class="thesis wrap section" id="opportunity">
    <div class="section-top"><span class="eyebrow">01 / THE OPPORTUNITY</span><span class="side-note">START WITH A JOB, NOT EVERYONE.</span></div>
    <h2>A phone is a great tool.<br><span>Until your hands have a job.</span></h2>
    <div class="thesis-grid"><p class="lead">Picking groceries. Carrying bags. Finding a doorstep. The phone already runs the work. Glasses could put the next step where the work happens.</p><div class="worker-segment"><span class="mini-label">THE FIRST BUYERS</span><h3>Independent grocery<br>& food delivery workers.</h3><p>Start with frequent grocery shoppers, where item finding, checking and customer messages repeat throughout a shift.</p></div></div>
    <div class="evidence-row"><article><div class="data-number">600<span>k</span></div><h3>Monthly active shoppers.</h3><p>Instacart · December 2025. A reachable worker community, not a forecast of glasses sales.</p>${source('shopper-scale', 'Instacart · Feb 26, 2026')}</article><article class="purpose-stat"><span class="visual-asterisk" aria-hidden="true">✳</span><h3>Give curiosity<br>a daily purpose.</h3><p>Unclear need and cost are reported barriers. A useful shift is a stronger test than another product demo.</p>${source('visioncouncil', 'The Vision Council · Sep 12, 2025')}</article><article><div class="data-number orange">10<span>%</span></div><h3>A target. Not a claim.</h3><p>Proposed pilot goal: less in-store task time, with no increase in errors and sustained voluntary use.</p><span class="fact-label">PROPOSED TEST THRESHOLD · NOT MEASURED</span></article></div>
  </section>

  <section class="navigation-section" id="how"><div class="wrap section">
    <div class="section-top"><span class="eyebrow">02 / THE NAVIGATION LAYER</span><span class="side-note">WHAT HAS TO HAPPEN BEHIND THE ARROW.</span></div>
    <div class="section-heading"><h2>Directions that<br><em>belong in the world.</em></h2><p>A floating arrow is the easy part.<br>Knowing where it belongs is the real work.</p></div>
    <div class="navigation-lab">
      <div class="map-visual" data-layer="0" aria-label="Interactive conceptual indoor navigation diagram"><div class="map-top"><span class="mini-label">INDOOR NAVIGATION / CONCEPT</span><span class="map-live">DATA → DIRECTION</span></div>
        <div class="map-perspective"><div class="floor-grid"></div><div class="aisle-block aisle-one"><span>PANTRY</span></div><div class="aisle-block aisle-two"><span>DAIRY</span></div><div class="aisle-block aisle-three"><span>PRODUCE</span></div><svg class="map-route" viewBox="0 0 500 400" fill="none" aria-hidden="true"><path class="route-shadow" d="M80 355 L80 300 Q80 275 110 275 L365 275 Q400 275 400 240 L400 180 Q400 150 370 150 L300 150"/><path class="route-line" d="M80 355 L80 300 Q80 275 110 275 L365 275 Q400 275 400 240 L400 180 Q400 150 370 150 L300 150"/></svg><span class="map-person"><span></span></span><span class="map-target">${icon('scan-line')}</span><div class="tracking-points">${Array.from({ length: 15 }, (_, n) => `<i style="--n:${n}"></i>`).join('')}</div><div class="map-floating-card"><span>${icon('navigation')} AISLE 03</span><strong>Oat milk</strong><span>Match the product. Confirm.</span></div></div>
        <div class="map-bottom"><span><i class="map-key mint"></i> Worker position</span><span><i class="map-key coral"></i> Planned route</span><span id="map-stage-label">Approved order data</span></div>
      </div>
      <div class="layer-controls">${navigationLayers.map((l, n) => `<button class="layer-control" data-layer="${n}" aria-pressed="${n === 0}"><span class="layer-num">0${n + 1}</span><div><h3>${l.title}</h3><p>${l.short}</p></div>${icon('plus')}</button>`).join('')}<div class="layer-detail"><p id="layer-detail">${navigationLayers[0].detail}</p><span id="layer-limit">${navigationLayers[0].limit}</span></div></div>
    </div>
    <div class="reality-note"><span>${icon('layers3')}</span><p><strong>Start with the information. Earn the spatial layer.</strong> Near-term display cards can show the next aisle and item. World-anchored arrows need supported tracking hardware and reliable indoor localization; this demo is a future concept, not a feature of ordinary Ray-Ban Meta glasses.</p>${source('tracking', 'How spatial tracking works')}</div>
  </div></section>

  <section class="task-lab wrap section" id="try-it"><div class="section-top"><span class="eyebrow">03 / A LITTLE LESS FRICTION</span><span class="side-note">TRY IT YOURSELF.</span></div><div class="section-heading"><h2>Right item.<br><span>Your confirmation.</span></h2><p>The glasses help you choose.<br>They don’t choose for you.</p></div>
    <div class="scan-lab"><div class="shelf-demo"><div class="shelf-demo-heading"><span class="mini-label">THE SHOPPING LIST</span><strong>Oat milk + apples</strong><span>Choose a product to simulate a scan.</span></div><div class="product-selection"><button class="scan-product" data-scan="dairy"><span class="carton dairy"><span class="carton-label">DAIRY<br><b>MILK</b></span><i></i></span><strong>Dairy milk</strong><span>Different product</span></button><button class="scan-product" data-scan="oat"><span class="carton oat"><span class="carton-label">OAT<br><b>MILK</b></span><i></i></span><strong>Oat milk</strong><span>Requested item</span></button><button class="scan-product" data-scan="apples"><span class="apples"><i></i><i></i><i></i><b></b></span><strong>Apples</strong><span>Requested item</span></button></div><span class="shelf-edge"></span><div class="shelf-actions"><button class="text-link" id="request-substitute">Item unavailable? Try a replacement ${icon('arrow-right')}</button><button class="icon-button" id="scan-reset" aria-label="Reset product demo">${icon('rotate-ccw')}</button></div></div>
      <div class="scan-result"><span class="mini-label">WHAT THE WORKER SEES</span><div class="scan-window"><div class="scan-window-top"><span>${icon('scan-line')} PRODUCT CHECK</span><span id="order-counter">0 / 2</span></div><div class="scan-status-symbol" id="scan-symbol">${icon('scan-line')}</div><h3 id="scan-heading">Look. Check. Confirm.</h3><p id="scan-message" aria-live="polite">Choose a product to try the scan.</p><button id="approve-substitute" class="button mint" hidden>Simulate customer approval ${icon('check')}</button><div class="order-ticks"><span id="milk-tick">${icon('circle-dot')} Oat milk</span><span id="apples-tick">${icon('circle-dot')} Apples</span></div></div><span class="simulation-label">BROWSER SIMULATION · NOT COMPUTER VISION</span></div></div>
  </section>

  <section class="product-section wrap section" id="system"><div class="section-top"><span class="eyebrow">04 / ONE CONNECTED WORKFLOW</span><span class="side-note">NO NEED TO REBUILD THE PHONE.</span></div><div class="product-grid"><div class="product-copy"><h2>The phone stays.<br><span>The work moves.</span></h2><p>Accounts, connectivity and the original app stay on the phone. The glasses show just enough to do the next thing.</p><div class="product-tabs" role="group" aria-label="Explore the proposed device system"><button data-product="glasses" aria-pressed="true">${icon('glasses')} Glasses</button><button data-product="phone" aria-pressed="false">${icon('smartphone')} + Phone</button><button data-product="ring" aria-pressed="false">${icon('circle-dot')} + Optional ring</button></div><div class="product-description" aria-live="polite"><span class="mini-label" id="product-label">INFORMATION, IN VIEW</span><h3 id="product-heading">One useful step at a time.</h3><p id="product-copy">Start with glanceable instructions on supported display glasses. Bigger spatial experiences come later.</p></div>${source('display', 'Display glasses + Neural Band · Sep 2025')}</div><div class="product-stage"><div class="product-orbit"></div><canvas id="product-canvas" aria-label="Interactive original black-glasses concept with a companion phone and optional input ring. Choose a device layer to explore." role="img"></canvas><span class="product-fallback" hidden>Glasses + phone + optional ring</span><div class="product-stage-label"><span>ORIGINAL 3D CONCEPT</span><span>NOT A PRODUCT SPECIFICATION</span></div></div></div>
    <div class="workflow-cards"><article><span class="workflow-icon">${icon('shopping-bag')}</span><span class="mini-label">FIND WORK</span><h3>The next paid task.</h3><p>Approved partner apps could surface grocery or food-delivery jobs. The worker chooses whether to accept.</p><span class="small-print">Existing opportunities, not a promise of new jobs.</span></article><article><span class="workflow-icon">${icon('volume2')}</span><span class="mini-label">MAKE IT YOURS</span><h3>Help that adapts.</h3><p>Opt into preferred display styles and familiar routes. Review or clear that memory. Confirm messages before sending.</p><button id="assistant-open" class="text-link">Try your preferences ${icon('arrow-right')}</button></article><article><span class="workflow-icon">${icon('wrench')}</span><span class="mini-label">EXPAND CAREFULLY</span><h3>Then, the next trade.</h3><p>Self-employed electricians could access job details, reference manuals and customer messages with their hands occupied.</p><span class="small-print">Later-stage hypothesis. Not a substitute for training.</span></article></div>
  </section>

  <section class="plan-section" id="plan"><div class="wrap section"><div class="section-top"><span class="eyebrow">05 / THE FIVE-YEAR PLAN</span><span class="side-note">VALUE FIRST. SCALE SECOND.</span></div><div class="section-heading"><h2>Make the first shift<br><em>worth a second.</em></h2><p>A worker buys a tool, not a promise.<br>Let the trial make the case.</p></div><div class="plan-tabs" role="tablist" aria-label="Implementation phases"><button role="tab" id="plan-tab-0" aria-selected="true" aria-controls="plan-panel" data-phase="0"><span>YEAR 1</span><strong>Prove the work.</strong>${icon('arrow-up-right')}</button><button role="tab" id="plan-tab-1" aria-selected="false" aria-controls="plan-panel" tabindex="-1" data-phase="1"><span>YEARS 2—3</span><strong>Earn the purchase.</strong>${icon('arrow-up-right')}</button><button role="tab" id="plan-tab-2" aria-selected="false" aria-controls="plan-panel" tabindex="-1" data-phase="2"><span>YEARS 4—5</span><strong>Expand the use.</strong>${icon('arrow-up-right')}</button></div><div class="plan-panel" id="plan-panel" role="tabpanel" aria-labelledby="plan-tab-0"><div class="plan-number" aria-hidden="true">01</div><div><span class="mini-label" id="plan-kicker">CONTROLLED GROCERY PILOT</span><h3 id="plan-title">Let a real shift answer.</h3><p id="plan-copy">Interview nonbuyers. Compare paid, comparable phone-only and glasses-assisted shifts. Test comfort, mistakes, task time and voluntary use.</p></div><div class="plan-gate"><span class="mini-label">THE DECISION GATE</span><p id="plan-gate">Proposed target: at least 10% less in-store task time, no increase in errors, and sustained voluntary use. A small trial does not establish safety.</p></div></div>
    <div class="access-row"><div><span class="access-number">01</span><h3>Borrow before buying.</h3><p>Proposed month-long loans through retailers, with prescription fitting and clear returns.</p></div><div><span class="access-number">02</span><h3>Price the real costs.</h3><p>Hardware, support, returns and AI services. No invented margins or guaranteed income.</p></div><div><span class="access-number">03</span><h3>Share the evidence.</h3><p>Show actual trial results in worker communities. Seek partner co-funding only for measured value.</p></div></div><div class="price-note"><strong>$799</strong><p>Meta Ray-Ban Display launch price, including Neural Band.<br><span>September 17, 2025 · a purchase hurdle, not our proposed price.</span></p>${source('display', 'The launch announcement')}</div></div></section>

  <footer class="footer wrap"><span class="eyebrow">THE AMBITION IS SIMPLE.</span><h2>Make digital work<br><span>fit the physical world.</span></h2><div class="footer-actions"><button class="button dark brief-open">Read Tamerlan’s proposal ${icon('arrow-up-right')}</button><button class="text-link sources-open">The research behind it ${icon('arrow-right')}</button></div><div class="footer-bottom"><a class="brand" href="#top">${logo}beyond<span>/ work</span></a><p>Tamerlan Goglichidze · YUCG application case</p><a class="text-link" href="#top">Back to top ${icon('arrow-up-right')}</a></div><p class="disclaimer">An independent proposal, not affiliated with Meta, Walmart, Instacart, Amazon or YUCG. All 3D scenes, routes and interfaces are illustrative concepts. No partnerships, product capabilities or productivity gains are implied by the simulations. Secondary research only; no original customer interviews. No camera, microphone, account connection or analytics. Research reviewed September 12, 2026.</p></footer>
</main>

<dialog id="brief-dialog" aria-labelledby="brief-heading"><div class="dialog-header"><div><span class="mini-label">TAMERLAN GOGLICHIDZE · YUCG CASE</span><h2 id="brief-heading">Win through work.</h2></div><button class="close-dialog icon-button" aria-label="Close case">${icon('x')}</button></div><div class="dialog-body brief-body" id="brief-content"></div><div class="dialog-footer"><button id="copy-brief" class="button dark">${icon('copy')} Copy with sources</button><span id="copy-status" aria-live="polite"></span></div></dialog>
<dialog id="sources-dialog" aria-labelledby="sources-heading"><div class="dialog-header"><div><span class="mini-label">THE RESEARCH FILE</span><h2 id="sources-heading">Evidence, with limits.</h2></div><button class="close-dialog icon-button" aria-label="Close sources">${icon('x')}</button></div><div class="dialog-body"><p class="method-note">Published facts are separate from our proposals. Trial targets are hypothetical. The walkthrough is a simulation, not primary evidence of demand or performance.</p>${workSources.map((s, n) => `<article class="source-entry" id="source-${s.id}"><span class="mini-label">${String(n + 1).padStart(2, '0')} / ${s.date}</span><h3><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.title} ${icon('arrow-up-right')}</a></h3><p>${s.fact}</p><p class="source-limit"><strong>What it doesn’t prove:</strong> ${s.limit}</p></article>`).join('')}</div></dialog>
<dialog id="assistant-dialog" aria-labelledby="assistant-heading"><div class="dialog-header"><div><span class="mini-label">LOCAL INTERFACE SIMULATION</span><h2 id="assistant-heading">Your work. Your settings.</h2></div><button class="close-dialog icon-button" aria-label="Close preferences">${icon('x')}</button></div><div class="dialog-body"><p>Try a quieter, larger or more familiar display. These preferences stay only in this page session. This is not a live AI assistant.</p><div class="preference-controls"><label><input type="checkbox" id="pref-optin"/> Opt into preferences for this demo</label><label>Display size<select id="pref-size" disabled><option value="standard">Standard</option><option value="large">Larger text</option></select></label><label>Interruptions<select id="pref-noise" disabled><option value="normal">Show task updates</option><option value="quiet">Only actions that need me</option></select></label></div><div class="preference-preview"><span class="mini-label">YOUR NEXT STEP</span><h3>Oat milk · aisle 03</h3><p id="pref-notification">Task update: continue to the next item.</p></div><button id="clear-preferences" class="text-link">Clear this session’s preferences ${icon('rotate-ccw')}</button><p class="small-print" id="pref-status" aria-live="polite">Personalization is off. No preferences have been stored.</p></div></dialog>
`;

refreshIcons();
const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
let motion = !reducedQuery.matches;
let scene, productScene, progress = 0, playing = false, storeVisible = false, lastTick = 0, frame = 0, activeStage = -1;
let chosenView = 'overview', arEnabled = true;
function setMotion(enabled) {
  motion = enabled;
  document.documentElement.dataset.motion = enabled ? 'on' : 'off';
  $('#motion-toggle').setAttribute('aria-pressed', String(!enabled));
  $('#motion-toggle').setAttribute('aria-label', enabled ? 'Pause decorative motion' : 'Enable decorative motion');
  $('#motion-toggle').innerHTML = icon(enabled ? 'pause' : 'play');
  scene?.setMotion?.(enabled); productScene?.setMotion?.(enabled);
  if (!enabled) setPlaying(false);
  refreshIcons();
}
setMotion(motion);
$('#motion-toggle').addEventListener('click', () => setMotion(!motion));
reducedQuery.addEventListener('change', e => setMotion(!e.matches));

const hudTasks = ['Choose your next job.', 'Head to the dairy aisle.', 'Check the exact product.', 'Pick the next item.', 'Review, then check out.', 'Next stop: the doorstep.'];
const hudLocations = ['AVAILABLE WORK / DEMO', 'STORE ROUTE / AISLE 03', 'PRODUCT CHECK / OAT MILK', 'PRODUCE / APPLES', 'CHECKOUT / ORDER REVIEW', 'WALKING DIRECTIONS / DELIVERY'];
function updateWalk(value, manual = false) {
  progress = clamp(value);
  if (manual) setPlaying(false);
  scene?.setProgress(progress);
  $('#walk-progress').value = Math.round(progress * 1000);
  $('#walk-percent').textContent = `${Math.round(progress * 100)}%`;
  $('#walk-progress').style.setProperty('--progress', `${progress * 100}%`);
  const index = stageAt(progress, walkthroughSteps);
  if (index === activeStage) return;
  activeStage = index;
  const step = walkthroughSteps[index];
  $('#walk-kicker').textContent = step.kicker;
  $('#walk-title').textContent = step.title;
  $('#walk-detail').textContent = step.detail;
  $('#hud-task').textContent = hudTasks[index] || step.task;
  $('.direction-symbol').innerHTML = icon(index === 0 ? 'shopping-bag' : index === 2 || index === 3 ? 'scan-line' : index === 4 ? 'check' : 'navigation');
  $('#hud-location').textContent = hudLocations[index] || step.location;
  $('#hud-item-name').textContent = index >= 3 ? index >= 4 ? 'Ready for the next step' : 'Apples' : 'Oat milk';
  $('.hud-item > div:first-child').className = index === 3 ? 'mini-apple' : 'mini-carton';
  $('.hud-item > div:first-child').hidden = index >= 4;
  $('#hud-item-detail').textContent = index >= 4 ? 'Confirm before moving on.' : 'Verify the item. Keep the choice yours.';
  $$('.walk-steps button').forEach((b, n) => { b.setAttribute('aria-pressed', String(index === n)); b.classList.toggle('is-complete', n < index); });
  $('#store-stage').dataset.step = String(index);
  refreshIcons();
}
function tick(time) {
  frame = 0;
  if (!playing || !storeVisible || document.hidden) { lastTick = 0; return; }
  if (!lastTick) lastTick = time;
  updateWalk(nextProgress(progress, Math.min((time - lastTick) / 1000, .08)));
  lastTick = time;
  if (progress >= 1) { setPlaying(false); return; }
  frame = requestAnimationFrame(tick);
}
function kick() { if (playing && storeVisible && !document.hidden && !frame) { lastTick = 0; frame = requestAnimationFrame(tick); } }
function setPlaying(next) {
  playing = next;
  const button = $('#walk-play');
  button.innerHTML = icon(next ? 'pause' : 'play');
  button.setAttribute('aria-label', next ? 'Pause store walkthrough' : 'Play store walkthrough');
  button.setAttribute('aria-pressed', String(next));
  refreshIcons();
  if (!next && frame) { cancelAnimationFrame(frame); frame = 0; lastTick = 0; }
  kick();
}
$('#walk-play').addEventListener('click', () => { if (progress >= 1) updateWalk(0); setPlaying(!playing); });
$('#walk-reset').addEventListener('click', () => updateWalk(0, true));
$('#walk-progress').addEventListener('input', e => updateWalk(Number(e.target.value) / 1000, true));
$$('[data-step]').forEach(b => b.addEventListener('click', () => updateWalk(walkthroughSteps[Number(b.dataset.step)].progress, true)));
$$('[data-view]').forEach(b => b.addEventListener('click', () => {
  chosenView = b.dataset.view; scene?.setView(chosenView);
  $('#store-stage').dataset.view = chosenView;
  $$('[data-view]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
}));
$('#ar-toggle').addEventListener('click', () => {
  arEnabled = !arEnabled; scene?.setAR(arEnabled);
  $('#ar-toggle').setAttribute('aria-pressed', String(arEnabled));
  $('#ar-toggle span').textContent = arEnabled ? 'On' : 'Off';
  $('#store-stage').classList.toggle('ar-off', !arEnabled);
});
new IntersectionObserver(entries => { storeVisible = entries[0].isIntersecting; if (storeVisible) kick(); }, { threshold: .08 }).observe($('#store-stage'));
document.addEventListener('visibilitychange', kick);
updateWalk(0);
function sceneFailure() { $('.scene-loading').hidden = true; $('.scene-fallback').hidden = false; $('#store-stage').classList.add('no-webgl'); }
import('./store-scene.js').then(({ initStoreScene }) => {
  scene = initStoreScene($('#store-canvas'), { onReady() { $('.scene-loading').hidden = true; $('#store-stage').classList.add('is-ready'); }, onError: sceneFailure });
  scene?.setMotion?.(motion); scene?.setView(chosenView); scene?.setAR(arEnabled); scene?.setProgress(progress);
  if (motion) setTimeout(() => { if (progress === 0 && motion && scene) setPlaying(true); }, 900);
}).catch(sceneFailure);

$$('.layer-control').forEach(b => b.addEventListener('click', () => {
  const index = Number(b.dataset.layer), layer = navigationLayers[index];
  $('.map-visual').dataset.layer = String(index);
  $('#layer-detail').textContent = layer.detail;
  $('#layer-limit').textContent = layer.limit;
  $('#map-stage-label').textContent = layer.title;
  $$('.layer-control').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
}));

let order = newOrder();
$('#approve-substitute').insertAdjacentHTML('afterend', `<button id="confirm-substitute" class="button mint" hidden>Confirm alternate-brand oat milk ${icon('check')}</button>`);
function updateOrder() {
  $('#scan-message').textContent = order.message;
  $('#order-counter').textContent = `${orderCount(order)} / 2`;
  $('#scan-heading').textContent = order.replacement === 'awaiting' ? 'The customer decides.' : order.replacement === 'approved' ? 'Your turn to confirm.' : orderCount(order) === 2 ? 'Both items confirmed.' : orderCount(order) ? 'One less thing to check.' : order.message.startsWith('Different') ? 'Close isn’t correct.' : 'Look. Check. Confirm.';
  $('#approve-substitute').hidden = order.replacement !== 'awaiting';
  $('#confirm-substitute').hidden = order.replacement !== 'approved';
  $('#milk-tick').innerHTML = `${icon(order.milk !== 'pending' ? 'check' : 'circle-dot')} ${order.milk === 'replaced' ? 'Alternate oat milk' : 'Oat milk'}`;
  $('#apples-tick').innerHTML = `${icon(order.apples !== 'pending' ? 'check' : 'circle-dot')} Apples`;
  $('#milk-tick').classList.toggle('done', order.milk !== 'pending');
  $('#apples-tick').classList.toggle('done', order.apples !== 'pending');
  $('#scan-symbol').innerHTML = icon(orderCount(order) === 2 ? 'check-check' : order.message.startsWith('Different') ? 'x' : 'scan-line');
  $('.scan-window').classList.toggle('is-complete', orderCount(order) === 2);
  $$('.scan-product').forEach(b => b.classList.toggle('picked', b.dataset.scan === 'oat' && order.milk !== 'pending' || b.dataset.scan === 'apples' && order.apples !== 'pending'));
  refreshIcons();
}
$$('[data-scan]').forEach(b => b.addEventListener('click', () => { order = scanItem(order, b.dataset.scan); updateOrder(); }));
$('#request-substitute').addEventListener('click', () => { order = requestReplacement(order); updateOrder(); });
$('#approve-substitute').addEventListener('click', () => { order = approveReplacement(order); updateOrder(); });
$('#confirm-substitute').addEventListener('click', () => { order = confirmReplacement(order); updateOrder(); });
$('#scan-reset').addEventListener('click', () => { order = newOrder(); updateOrder(); });

const productCopy = {
  glasses: ['INFORMATION, IN VIEW', 'One useful step at a time.', 'Start with glanceable instructions on supported display glasses. Bigger spatial experiences come later.'],
  phone: ['ACCOUNTS, APPS, CONNECTIVITY', 'A companion, not a replacement.', 'The original app still handles the account and approved task data. Keep the phone available whenever an action needs it.'],
  ring: ['OPTIONAL INPUT EXPERIMENT', 'A quiet click. A clear choice.', 'Test a ring for deliberate clicks and scrolling. Existing controls come first; the ring is not a launch requirement.'],
};
let productLayer = 'glasses';
$$('[data-product]').forEach(b => b.addEventListener('click', () => {
  productLayer = b.dataset.product; productScene?.setLayer(productLayer);
  $$('[data-product]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  const data = productCopy[productLayer];
  ['label', 'heading', 'copy'].forEach((key, n) => $(`#product-${key}`).textContent = data[n]);
}));
const productObserver = new IntersectionObserver(entries => {
  if (!entries[0].isIntersecting) return;
  productObserver.disconnect();
  import('./work-product.js').then(({ initWorkProduct }) => {
    productScene = initWorkProduct($('#product-canvas')); productScene?.setMotion?.(motion); productScene?.setLayer(productLayer);
    if ($('#product-canvas').dataset.productState === 'unavailable') $('.product-fallback').hidden = false;
  }).catch(() => { $('.product-fallback').hidden = false; });
}, { rootMargin: '350px' });
productObserver.observe($('#product-canvas'));

const phases = [
  ['CONTROLLED GROCERY PILOT', 'Let a real shift answer.', 'Interview nonbuyers. Compare paid, comparable phone-only and glasses-assisted shifts. Test comfort, mistakes, task time and voluntary use.', 'Proposed target: at least 10% less in-store task time, no increase in errors, and sustained voluntary use. A small trial does not establish safety.'],
  ['COMMERCIAL DISTRIBUTION & RETENTION', 'Turn the trial into a choice.', 'Track trial-to-purchase conversion and six-month use. Add platforms only through separate agreements; stop where unreliable store data erases the benefit.', 'Require positive contribution after trial, acquisition, support and returns. Do not scale simply because the demo is exciting.'],
  ['SELF-EMPLOYED TRADES & WIDER AR', 'Take proven functions further.', 'Test job details, reference manuals and customer messages with self-employed electricians. Add richer spatial AR only where tracking, power and comfort are ready.', 'A second segment must earn its own evidence. Measure task benefit and willingness to pay; do not transfer grocery results to skilled trades.'],
];
function setPhase(index, focus = false) {
  const buttons = $$('[data-phase]');
  buttons.forEach((b, n) => { b.setAttribute('aria-selected', String(index === n)); b.tabIndex = index === n ? 0 : -1; });
  const data = phases[index];
  $('#plan-panel').setAttribute('aria-labelledby', `plan-tab-${index}`);
  $('.plan-number').textContent = `0${index + 1}`;
  ['kicker', 'title', 'copy', 'gate'].forEach((key, n) => $(`#plan-${key}`).textContent = data[n]);
  if (focus) buttons[index].focus();
}
$$('[data-phase]').forEach((b, index) => {
  b.addEventListener('click', () => setPhase(index));
  b.addEventListener('keydown', e => {
    const next = e.key === 'ArrowRight' ? (index + 1) % 3 : e.key === 'ArrowLeft' ? (index + 2) % 3 : e.key === 'Home' ? 0 : e.key === 'End' ? 2 : null;
    if (next !== null) { e.preventDefault(); setPhase(next, true); }
  });
});

const escape = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function renderMarkdown(text) {
  return text.trim().split(/\n\s*\n/).map(block => {
    let html = escape(block).replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    if (html.startsWith('# ')) return '';
    if (html.startsWith('## ')) return `<h3>${html.slice(3)}</h3>`;
    return `<p>${html}</p>`;
  }).join('');
}
$('#brief-content').innerHTML = renderMarkdown(brief);
$('.workflow-cards article:first-child .small-print').insertAdjacentHTML('beforebegin', `<button id="job-open" class="text-link">See an example task ${icon('arrow-right')}</button>`);
document.body.insertAdjacentHTML('beforeend', `<dialog id="job-dialog" aria-labelledby="job-heading"><div class="dialog-header"><div><span class="mini-label">PARTNER APP CONCEPT · NOT A LIVE OFFER</span><h2 id="job-heading">Find work. Then do it.</h2></div><button class="close-dialog icon-button" aria-label="Close example task">${icon('x')}</button></div><div class="dialog-body"><p>Existing partner platforms could show available jobs here, with their payment, eligibility and order details. The glasses don’t create the work or set its pay.</p><div class="job-preview"><span class="mini-label">FICTIONAL ORDER / THE NEIGHBORHOOD MARKET</span><h3>Shop & deliver.</h3><p>Review the order. Choose whether to accept. Then bring just the next useful instruction into view.</p><div class="job-items"><span>Oat milk</span><span>Apples</span></div><button id="accept-demo-task" class="button dark">Try this example ${icon('arrow-right')}</button><p class="small-print">Starts the store animation only. No job is accepted, no purchase is made, and no account is connected.</p></div></div></dialog>`);
const dialogs = $$('dialog');
let lastFocused;
function openDialog(id, sourceId) {
  lastFocused = document.activeElement;
  dialogs.forEach(d => { if (d.open) d.close(); });
  const d = $(`#${id}`); d.showModal(); document.body.classList.add('dialog-open');
  d.querySelector('.close-dialog').focus();
  if (sourceId) setTimeout(() => $(`#source-${sourceId}`)?.scrollIntoView({ block: 'start', behavior: 'instant' }), 40);
}
$$('.brief-open').forEach(b => b.addEventListener('click', () => openDialog('brief-dialog')));
$$('.sources-open,[data-source]').forEach(b => b.addEventListener('click', () => openDialog('sources-dialog', b.dataset.source)));
$('#assistant-open').addEventListener('click', () => openDialog('assistant-dialog'));
$('#job-open').addEventListener('click', () => openDialog('job-dialog'));
$('#accept-demo-task').addEventListener('click', () => {
  $('#job-dialog').close(); updateWalk(0, true);
  $('#walkthrough').scrollIntoView({ behavior: motion ? 'smooth' : 'instant', block: 'start' });
  if (motion) setPlaying(true); else updateWalk(.18, true);
});
dialogs.forEach(d => {
  $('.close-dialog', d).addEventListener('click', () => d.close());
  d.addEventListener('close', () => { if (!dialogs.some(x => x.open)) { document.body.classList.remove('dialog-open'); lastFocused?.focus({ preventScroll: true }); } });
  d.addEventListener('click', e => { if (e.target === d) { const r = d.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close(); } });
});
$('#copy-brief').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(brief); $('#copy-status').textContent = 'Copied, including dated source links.'; }
  catch { $('#copy-status').textContent = 'Select the proposal text above to copy it.'; }
});
function updatePreferences() {
  const opted = $('#pref-optin').checked;
  $('#pref-size').disabled = $('#pref-noise').disabled = !opted;
  $('.preference-preview').classList.toggle('large', opted && $('#pref-size').value === 'large');
  $('#pref-notification').textContent = opted && $('#pref-noise').value === 'quiet' ? 'Quiet mode. We’ll show the next action that needs your confirmation.' : 'Task update: continue to the next item.';
  $('#pref-status').textContent = opted ? 'Preferences are active only in this open page. Nothing is sent or saved elsewhere.' : 'Personalization is off. No preferences have been stored.';
}
['pref-optin', 'pref-size', 'pref-noise'].forEach(id => $(`#${id}`).addEventListener('change', updatePreferences));
$('#clear-preferences').addEventListener('click', () => { $('#pref-optin').checked = false; $('#pref-size').value = 'standard'; $('#pref-noise').value = 'normal'; updatePreferences(); });

const revealObserver = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); revealObserver.unobserve(e.target); } }), { threshold: .08 });
$$('.section-heading, .thesis h2, .evidence-row, .navigation-lab, .scan-lab, .product-grid, .workflow-cards, .access-row').forEach(el => { el.classList.add('reveal'); revealObserver.observe(el); });
function scrollProgress() { const height = document.documentElement.scrollHeight - innerHeight; $('.reading-progress').style.transform = `scaleX(${height > 0 ? scrollY / height : 0})`; }
addEventListener('scroll', scrollProgress, { passive: true });
addEventListener('pagehide', () => { if (frame) cancelAnimationFrame(frame); scene?.destroy(); productScene?.destroy(); });
refreshIcons();
