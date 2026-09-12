import '@fontsource-variable/manrope';
import '@fontsource-variable/dm-sans';
import './style.css';
import { initGlasses } from './scene.js';

document.querySelector('#app').innerHTML = `
<header class="nav"><a class="brand" href="#top" aria-label="Beyond home">beyond<span>®</span></a><nav aria-label="Main navigation"><a href="#opportunity">The opportunity</a><a href="#experience">The experience</a><a href="#roadmap">The plan</a></nav><button class="source-open nav-source">The evidence <span>↗</span></button></header>
<main><section class="hero" id="top"><div class="hero-topline"><span>AN INDEPENDENT STRATEGY FOR META</span><span>YUCG CASE STUDY / 2026—2031</span></div><h1>Your world.<br><span>Beyond the screen.</span></h1><div class="hero-stage" id="hero-stage"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="model-loader">Bringing a new perspective into view.</div><canvas id="glasses-canvas" tabindex="0" aria-label="Interactive 3D concept glasses. Drag or use arrow keys to rotate. Press R to reset." role="img"></canvas></div><div class="hero-footer"><p>The ambition: replace the phone.<br>The strategy: earn it, one task at a time.</p><a class="hero-cta" href="#opportunity">Explore the strategy <span>↓</span></a><span class="model-note">ORIGINAL 3D CONCEPT<br>DRAG TO EXPLORE</span></div></section><section class="intro section" id="opportunity"><div class="eyebrow">01 / THE OPPORTUNITY</div><div class="intro-grid"><h2>A world of possibility.<br><em>One small rectangle.</em></h2><p>The smartphone puts everything in your hand. What if you could put your hand down?</p></div></section></main>`;
initGlasses();
