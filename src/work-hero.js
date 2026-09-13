import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createGlasses } from './glasses-asset.js';

/** Black eyewear hero; the page supplies its own accessible work-window UI. */
export function initWorkHero(canvas) {
  const inactive = { setMotion() {}, destroy() {} };
  if (!canvas?.getContext) return inactive;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas, alpha: true, antialias: true, powerPreference: 'low-power',
    });
  } catch {
    canvas.dataset.heroState = 'unavailable';
    return inactive;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-5, 5, 2.5, -2.5, 0.1, 40);
  camera.position.set(0, 0.85, 15);
  camera.lookAt(0, -0.05, -0.8);

  let environment;
  function lightStudio() {
    const room = new RoomEnvironment();
    const generator = new THREE.PMREMGenerator(renderer);
    const nextEnvironment = generator.fromScene(room, 0.045);
    scene.environment = nextEnvironment.texture;
    environment?.dispose();
    environment = nextEnvironment;
    room.dispose();
    generator.dispose();
  }
  lightStudio();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8b9486, 2.1));
  const key = new THREE.DirectionalLight(0xfffdf7, 3.1);
  key.position.set(-3, 5.5, 7);
  scene.add(key);
  const edge = new THREE.DirectionalLight(0xf1fff8, 2.1);
  edge.position.set(5, 3.5, -4);
  scene.add(edge);

  const glasses = createGlasses(THREE);
  scene.add(glasses);
  const materials = glasses.userData.materials;
  materials.frame.roughness = 0.26;
  materials.frame.clearcoat = 0.65;
  materials.frame.clearcoatRoughness = 0.19;
  materials.frame.envMapIntensity = 0.65;
  materials.lens.color.set(0x152019);
  materials.lens.opacity = 0.96;
  materials.lens.envMapIntensity = 0.4;

  // Articulate the existing temples about their hinges for one gentle arrival.
  // Their final position is the original asset's fully open resting geometry.
  const hinges = [-1, 1].map(side => {
    const temple = side === 1 ? glasses.parts.rightTemple : glasses.parts.leftTemple;
    const pivot = new THREE.Group();
    pivot.position.set(side * 3.323, 0.683, -0.228);
    temple.position.sub(pivot.position);
    pivot.add(temple);
    glasses.add(pivot);
    return { pivot, side };
  });

  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = shadowCanvas.height = 128;
  const context = shadowCanvas.getContext('2d');
  if (context) {
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(28,41,32,.24)');
    gradient.addColorStop(0.35, 'rgba(28,41,32,.12)');
    gradient.addColorStop(0.7, 'rgba(28,41,32,.035)');
    gradient.addColorStop(1, 'rgba(28,41,32,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
  }
  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(7.9, 1.25),
    new THREE.MeshBasicMaterial({
      map: shadowTexture, transparent: true, depthWrite: false, opacity: 0.8,
    }),
  );
  shadow.position.set(0.1, -1.73, -2.3);
  scene.add(shadow);

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let motionEnabled = true, visible = true, destroyed = false, contextLost = false;
  let raf = 0, lastTime = 0, elapsed = 0, arrival = reducedMotion.matches ? 1 : 0;
  let yaw = 0, pitch = 0, targetYaw = 0, targetPitch = 0, mobile = false;
  const canRender = () => !destroyed && !contextLost && visible && !document.hidden;
  const canAnimate = () => motionEnabled && !reducedMotion.matches;

  function pose(dt) {
    const animate = canAnimate();
    const smoothing = animate ? 1 - Math.exp(-6 * dt) : 1;
    yaw = THREE.MathUtils.lerp(yaw, targetYaw, smoothing);
    pitch = THREE.MathUtils.lerp(pitch, targetPitch, smoothing);
    arrival = animate ? Math.min(1, arrival + dt / 1.5) : 1;
    const reveal = 1 - Math.pow(1 - arrival, 3);
    const breath = reducedMotion.matches ? 0 : Math.sin(elapsed * 0.48) * 0.014;
    glasses.position.set((mobile ? -0.40 : -1.05) - (1 - reveal) * 0.08, (mobile ? -0.84 : -0.43) + breath - (1 - reveal) * 0.12, 0);
    glasses.rotation.set(0.24 + pitch + (1 - reveal) * 0.05, -0.34 + yaw - (1 - reveal) * 0.16, -0.08);
    glasses.scale.setScalar((mobile ? 1.04 : 0.99) - (1 - reveal) * 0.02);
    for (const { pivot, side } of hinges) pivot.rotation.y = side * (1 - reveal) * 0.3;
    shadow.position.y = mobile ? -2.13 : -1.73;
    shadow.scale.x = 1 - breath * 0.55;
    shadow.material.opacity = 0.75 - breath * 1.3;
  }

  function frame(time) {
    raf = 0;
    if (!canRender()) return;
    const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 1 / 60;
    lastTime = time;
    if (canAnimate()) elapsed += dt;
    pose(dt);
    renderer.render(scene, camera);
    canvas.dataset.heroState = 'ready';
    if (canAnimate()) raf = requestAnimationFrame(frame);
  }

  function start() {
    if (raf || !canRender()) return;
    lastTime = 0;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
    lastTime = 0;
  }

  function resize() {
    if (destroyed || contextLost) return;
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const aspect = bounds.width / bounds.height;
    mobile = aspect < 1.45;
    // Preserve the entire silhouette on narrow canvases, with open space over
    // both shoulders for the page's floating work windows.
    const halfHeight = Math.max(2.6, (mobile ? 4.55 : 5.5) / aspect);
    camera.left = -halfHeight * aspect;
    camera.right = halfHeight * aspect;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(bounds.width, bounds.height, false);
    start();
  }

  function pointerMove(event) {
    if (!canAnimate() || event.pointerType === 'touch') return;
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const x = THREE.MathUtils.clamp((event.clientX - bounds.left) / bounds.width, 0, 1) - 0.5;
    const y = THREE.MathUtils.clamp((event.clientY - bounds.top) / bounds.height, 0, 1) - 0.5;
    targetYaw = x * 0.035;
    targetPitch = y * 0.016;
    start();
  }

  function pointerLeave() {
    targetYaw = targetPitch = 0;
    start();
  }

  function visibilityChange() { if (canRender()) start(); else stop(); }
  function motionChange() {
    if (reducedMotion.matches) targetYaw = targetPitch = 0;
    stop();
    start();
  }
  function lost(event) {
    event.preventDefault();
    contextLost = true;
    canvas.dataset.heroState = 'context-lost';
    stop();
  }
  function restored() {
    if (destroyed) return;
    contextLost = false;
    lightStudio();
    resize();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    visibilityChange();
  }, { rootMargin: '80px' });
  intersectionObserver.observe(canvas);
  canvas.addEventListener('pointermove', pointerMove, { passive: true });
  canvas.addEventListener('pointerleave', pointerLeave, { passive: true });
  canvas.addEventListener('webglcontextlost', lost);
  canvas.addEventListener('webglcontextrestored', restored);
  document.addEventListener('visibilitychange', visibilityChange);
  reducedMotion.addEventListener('change', motionChange);
  canvas.dataset.heroState = 'loading';
  pose(0);
  resize();

  return {
    setMotion(enabled) {
      if (destroyed) return;
      motionEnabled = Boolean(enabled);
      stop();
      start();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('pointerleave', pointerLeave);
      canvas.removeEventListener('webglcontextlost', lost);
      canvas.removeEventListener('webglcontextrestored', restored);
      document.removeEventListener('visibilitychange', visibilityChange);
      reducedMotion.removeEventListener('change', motionChange);
      const geometries = new Set(), sceneMaterials = new Set();
      scene.traverse(object => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) [object.material].flat().forEach(material => sceneMaterials.add(material));
      });
      geometries.forEach(geometry => geometry.dispose());
      sceneMaterials.forEach(material => material.dispose());
      shadowTexture.dispose();
      environment?.dispose();
      renderer.dispose();
      delete canvas.dataset.heroState;
    },
  };
}
