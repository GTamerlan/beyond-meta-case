import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createGlasses } from './glasses-asset.js';
import { createRing } from './ring-asset.js';

const CREAM = 0xf6f5f0;
const LAYERS = new Set(['glasses', 'phone', 'ring']);

function roundedShape(width, height, radius) {
  const shape = new THREE.Shape();
  const x = -width / 2, y = -height / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

function createPhone() {
  const phone = new THREE.Group();
  phone.name = 'paired-phone';
  const metal = new THREE.MeshStandardMaterial({ color: 0x393b39, metalness: 0.75, roughness: 0.29 });
  const black = new THREE.MeshPhysicalMaterial({ color: 0x111312, roughness: 0.25, clearcoat: 0.55 });
  const screen = new THREE.MeshBasicMaterial({ color: 0xe8e9e2 });
  const paper = new THREE.MeshBasicMaterial({ color: 0xfdfcf7 });
  const ink = new THREE.MeshBasicMaterial({ color: 0x656d66 });
  const softInk = new THREE.MeshBasicMaterial({ color: 0xc3c9bf });
  const accent = new THREE.MeshBasicMaterial({ color: 0x929f7e });

  function face(width, height, radius, material, x, y, z) {
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(roundedShape(width, height, radius), 10), material);
    mesh.position.set(x, y, z);
    phone.add(mesh);
    return mesh;
  }

  const shell = new THREE.ExtrudeGeometry(roundedShape(1.56, 3.06, 0.22), {
    depth: 0.14, steps: 1, bevelEnabled: true,
    bevelSize: 0.035, bevelThickness: 0.025, bevelSegments: 3, curveSegments: 12,
  });
  shell.translate(0, 0, -0.07);
  phone.add(new THREE.Mesh(shell, metal));
  face(1.52, 3.02, 0.205, black, 0, 0, 0.099);
  face(1.40, 2.89, 0.17, screen, 0, 0, 0.103);
  face(0.38, 0.085, 0.042, black, 0, 1.315, 0.109);
  face(0.35, 0.035, 0.017, black, 0, -1.31, 0.109);

  // Quiet document and progress shapes make the phone recognizable without
  // introducing labels or fictitious application content into the product view.
  face(1.15, 1.33, 0.095, paper, 0, 0.335, 0.112);
  face(0.62, 0.046, 0.02, ink, -0.14, 0.77, 0.116);
  for (let i = 0; i < 4; i++) {
    face(i === 3 ? 0.53 : 0.88, 0.028, 0.012, softInk,
      i === 3 ? -0.175 : 0, 0.56 - i * 0.15, 0.116);
  }
  face(0.28, 0.06, 0.028, accent, -0.30, -0.08, 0.116);
  face(1.15, 0.5, 0.09, paper, 0, -0.77, 0.112);
  face(0.67, 0.033, 0.015, softInk, 0.10, -0.69, 0.116);
  face(0.48, 0.027, 0.013, softInk, 0.005, -0.85, 0.116);
  const dot = new THREE.Mesh(new THREE.CircleGeometry(0.075, 24), accent);
  dot.position.set(-0.40, -0.77, 0.117);
  phone.add(dot);
  const button = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.31, 0.065), metal);
  button.position.set(0.802, 0.62, 0);
  phone.add(button);
  return phone;
}

function collectMaterials(group) {
  const materials = new Set();
  group.traverse(object => {
    if (!object.material) return;
    for (const material of [object.material].flat()) materials.add(material);
  });
  return [...materials].map(material => ({
    material, opacity: material.opacity, transparent: material.transparent,
    depthWrite: material.depthWrite,
  }));
}

function reveal(group, materials, amount) {
  group.visible = amount > 0.002;
  for (const original of materials) {
    const fading = amount < 0.995;
    const transparent = fading || original.transparent;
    if (original.material.transparent !== transparent) {
      original.material.transparent = transparent;
      original.material.needsUpdate = true;
    }
    original.material.opacity = original.opacity * amount;
    original.material.depthWrite = fading ? false : original.depthWrite;
  }
}

function createConnection(points) {
  const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
  const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(40));
  const material = new THREE.LineDashedMaterial({
    color: 0x9a9e90, transparent: true, opacity: 0, dashSize: 0.055,
    gapSize: 0.055, depthWrite: false,
  });
  const line = new THREE.Line(geometry, material);
  line.computeLineDistances();
  const marker = new THREE.Mesh(new THREE.SphereGeometry(0.027, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0x84916f, transparent: true, opacity: 0 }));
  return { curve, line, marker };
}

/** A contained, local-only product scene. The page owns labels and controls. */
export function initWorkProduct(canvas) {
  const inert = { setLayer() {}, setMotion() {}, destroy() {} };
  if (!canvas?.getContext) return inert;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power' });
  } catch {
    canvas.dataset.productState = 'unavailable';
    return inert;
  }

  const previousTouchAction = canvas.style.touchAction;
  canvas.style.touchAction = 'pan-y';
  canvas.dataset.productState = 'ready';
  canvas.dataset.productLayer = 'glasses';
  renderer.setClearColor(CREAM, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-5.3, 5.3, 3.8, -3.8, 0.1, 45);
  camera.position.set(0, 1.1, 16);
  camera.lookAt(0, -0.25, -0.8);
  const studio = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(studio, 0.055);
  scene.environment = environment.texture;
  studio.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9b9d8c, 2.5));
  const key = new THREE.DirectionalLight(0xffffff, 3.1);
  key.position.set(-3, 5, 7);
  scene.add(key);
  const edge = new THREE.DirectionalLight(0xfffaf0, 2);
  edge.position.set(5, 3, -4);
  scene.add(edge);

  const system = new THREE.Group();
  scene.add(system);
  const glasses = createGlasses(THREE);
  const phone = createPhone();
  const ring = createRing(THREE);
  system.add(glasses, phone, ring);
  const phoneMaterials = collectMaterials(phone);
  const ringMaterials = collectMaterials(ring);
  phone.rotation.set(-0.13, -0.36, -0.14);
  ring.rotation.set(0.40, -0.55, -0.24);
  const phoneConnection = createConnection([[0.48, -0.05, 0], [1.15, -0.40, 0.2], [1.57, -0.65, 0.35]]);
  const ringConnection = createConnection([[1.75, 0.83, 0.1], [2.37, 0.91, 0.1], [2.87, 0.64, 0.35]]);
  for (const connection of [phoneConnection, ringConnection]) system.add(connection.line, connection.marker);

  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const context = shadowCanvas.getContext('2d');
  if (context) {
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(46,48,40,.22)');
    gradient.addColorStop(0.45, 'rgba(46,48,40,.09)');
    gradient.addColorStop(1, 'rgba(46,48,40,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
  }
  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(8.1, 2),
    new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false }));
  shadow.position.set(-0.25, -1.74, -2.25);
  scene.add(shadow);

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let layer = 'glasses', phoneAmount = 0, ringAmount = 0, arrival = reducedMotion.matches ? 1 : 0;
  let visible = true, destroyed = false, contextLost = false, motionEnabled = true;
  let raf = 0, previousTime = 0, elapsed = 0;
  let yaw = 0, pitch = 0, targetYaw = 0, targetPitch = 0, pointer = null;
  const canDraw = () => !destroyed && !contextLost && visible && !document.hidden;

  function pose(dt) {
    const reduced = reducedMotion.matches;
    const smooth = reduced || !motionEnabled ? 1 : 1 - Math.exp(-7 * dt);
    const phoneTarget = layer === 'glasses' ? 0 : 1;
    const ringTarget = layer === 'ring' ? 1 : 0;
    phoneAmount = THREE.MathUtils.lerp(phoneAmount, phoneTarget, smooth);
    ringAmount = THREE.MathUtils.lerp(ringAmount, ringTarget, smooth);
    arrival = reduced || !motionEnabled ? 1 : Math.min(1, arrival + dt / 1.1);
    yaw = THREE.MathUtils.lerp(yaw, targetYaw, smooth);
    pitch = THREE.MathUtils.lerp(pitch, targetPitch, smooth);
    const entry = 1 - Math.pow(1 - arrival, 3);
    const breathe = reduced ? 0 : Math.sin(elapsed * 0.65) * 0.035;
    system.rotation.set(pitch, yaw, 0);
    glasses.position.set(-0.23 - phoneAmount * 0.76, 0.16 + phoneAmount * 0.80 + breathe - (1 - entry) * 0.22, 0);
    glasses.rotation.set(0.22 + (1 - entry) * 0.055, -0.34 + (reduced ? 0 : Math.sin(elapsed * 0.23) * 0.026), -0.075);
    glasses.scale.setScalar((0.98 - phoneAmount * 0.16) * (0.97 + entry * 0.03));
    phone.position.set(2.09 - ringAmount * 0.22, -1.04 - (1 - phoneAmount) * 0.28, 0.45);
    phone.scale.setScalar(0.86 + phoneAmount * 0.04);
    ring.position.set(3.31, 0.74 + (1 - ringAmount) * 0.18 + breathe * 0.5, 0.5);
    ring.scale.setScalar(0.77 + ringAmount * 0.07);
    reveal(phone, phoneMaterials, phoneAmount);
    reveal(ring, ringMaterials, ringAmount);
    for (const [connection, amount, offset] of [[phoneConnection, phoneAmount, 0], [ringConnection, ringAmount, 0.45]]) {
      connection.line.visible = connection.marker.visible = amount > 0.002;
      connection.line.material.opacity = amount * 0.48;
      connection.marker.material.opacity = amount * 0.72;
      connection.marker.position.copy(connection.curve.getPoint(reduced ? 0.5 : (elapsed * 0.13 + offset) % 1));
    }
    shadow.scale.set(1 + phoneAmount * 0.07, 1 - phoneAmount * 0.16, 1);
    shadow.material.opacity = 0.78 + (1 - breathe) * 0.08;
  }

  function frame(time) {
    raf = 0;
    if (!canDraw()) return;
    const dt = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 1 / 60;
    previousTime = time;
    if (motionEnabled && !reducedMotion.matches) elapsed += dt;
    pose(dt);
    renderer.render(scene, camera);
    if (motionEnabled && !reducedMotion.matches) raf = requestAnimationFrame(frame);
  }

  function start() {
    if (!canDraw() || raf) return;
    previousTime = 0;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
    previousTime = 0;
  }

  function resize() {
    if (destroyed || contextLost) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const aspect = rect.width / rect.height;
    const halfHeight = Math.max(3.75, 5.15 / aspect);
    camera.left = -halfHeight * aspect;
    camera.right = halfHeight * aspect;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(rect.width, rect.height, false);
    start();
  }

  function visibilityChange() {
    if (canDraw()) start(); else stop();
  }

  function pointerDown(event) {
    if (event.button !== 0 || !canDraw()) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, yaw: targetYaw, pitch: targetPitch, touch: event.pointerType === 'touch' };
    if (!pointer.touch) canvas.setPointerCapture?.(event.pointerId);
  }

  function pointerMove(event) {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    // Let a vertical touch gesture scroll the document without fighting it.
    if (pointer.touch && Math.abs(dy) > Math.abs(dx) + 8) { pointer = null; return; }
    targetYaw = THREE.MathUtils.clamp(pointer.yaw + dx * 0.0035, -0.38, 0.38);
    targetPitch = THREE.MathUtils.clamp(pointer.pitch + dy * 0.002, -0.12, 0.16);
    start();
  }

  function pointerUp(event) {
    if (!pointer || pointer.id !== event.pointerId) return;
    if (canvas.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    pointer = null;
  }

  function motionChange() { stop(); start(); }
  function lost(event) {
    event.preventDefault();
    contextLost = true;
    canvas.dataset.productState = 'context-lost';
    stop();
  }
  function restored() {
    contextLost = false;
    canvas.dataset.productState = 'ready';
    resize();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    visibilityChange();
  }, { rootMargin: '80px' });
  intersectionObserver.observe(canvas);
  document.addEventListener('visibilitychange', visibilityChange);
  reducedMotion.addEventListener('change', motionChange);
  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerup', pointerUp);
  canvas.addEventListener('pointercancel', pointerUp);
  canvas.addEventListener('lostpointercapture', pointerUp);
  canvas.addEventListener('webglcontextlost', lost);
  canvas.addEventListener('webglcontextrestored', restored);
  pose(0);
  resize();

  return {
    setLayer(nextLayer) {
      if (destroyed || !LAYERS.has(nextLayer)) return;
      layer = nextLayer;
      canvas.dataset.productLayer = nextLayer;
      start();
    },
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
      pointer = null;
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', visibilityChange);
      reducedMotion.removeEventListener('change', motionChange);
      canvas.removeEventListener('pointerdown', pointerDown);
      canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('pointerup', pointerUp);
      canvas.removeEventListener('pointercancel', pointerUp);
      canvas.removeEventListener('lostpointercapture', pointerUp);
      canvas.removeEventListener('webglcontextlost', lost);
      canvas.removeEventListener('webglcontextrestored', restored);
      const geometries = new Set(), materials = new Set();
      scene.traverse(object => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) [object.material].flat().forEach(material => materials.add(material));
      });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      shadowTexture.dispose();
      environment.dispose();
      renderer.dispose();
      canvas.style.touchAction = previousTouchAction;
      delete canvas.dataset.productState;
      delete canvas.dataset.productLayer;
    },
  };
}
