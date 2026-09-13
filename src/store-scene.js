import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// All geometry and label textures are authored locally. Distances are in metres.
const ROUTE = [
  [0, 4.2, 7.15], [.10, 2.4, 4.9], [.18, 2.4, 2.9],
  [.34, 2.4, -.9], [.42, 2.4, -1.9], [.49, 2.4, -4.7],
  [.56, -1.9, -4.7], [.62, -6.4, -4.7], [.69, -6.5, -.8],
  [.76, -6.5, 2.6], [.83, -5.5, 4.9], [.91, -3.5, 6.2],
  [1, .5, 7.2],
];

const PALETTE = {
  background: 0xeeeae3, floor: 0xf0ece3, teal: 0x173e39, mint: 0x71f4be,
  orange: 0xfc9a51, oak: 0xd3b48b, white: 0xf9f7f0, metal: 0x88918b,
};

function routeAt(value, target = new THREE.Vector3()) {
  const p = THREE.MathUtils.clamp(value, 0, 1);
  let segment = 0;
  while (segment < ROUTE.length - 2 && p > ROUTE[segment + 1][0]) segment++;
  const a = ROUTE[segment], b = ROUTE[segment + 1];
  const t = (p - a[0]) / (b[0] - a[0]);
  // Round the corners without moving the six named stops off their positions.
  const previous = ROUTE[Math.max(0, segment - 1)];
  const after = ROUTE[Math.min(ROUTE.length - 1, segment + 2)];
  const smooth = (v0, v1, v2, v3) => {
    const m1 = (v2 - v0) * .20;
    const m2 = (v3 - v1) * .20;
    return (2*t*t*t - 3*t*t + 1)*v1 + (t*t*t - 2*t*t + t)*m1
      + (-2*t*t*t + 3*t*t)*v2 + (t*t*t - t*t)*m2;
  };
  return target.set(smooth(previous[1], a[1], b[1], after[1]), 0,
    smooth(previous[2], a[2], b[2], after[2]));
}

/**
 * The page owns scroll progress. Calling setProgress is the only way the worker advances.
 * onReady fires after the first successful frame; onError receives an Error.
 */
export function initStoreScene(canvas, { onReady = () => {}, onError = () => {} } = {}) {
  let renderer, destroyed = false, failed = false, ready = false;
  let raf = 0, visible = true, frameTime = 0, targetProgress = .18, progress = .18;
  let mode = 'eyes', arEnabled = true, motionEnabled = true, stride = 0;
  let gaitSpeed = 0, gaitPhase = 0, headingResidual = 0, needsRebase = true;
  const disposables = new Set();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const noop = () => {};
  const inert = { setProgress: noop, setView: noop, setAR: noop, setMotion: noop, destroy: noop };
  const reportError = error => {
    if (failed || destroyed) return;
    failed = true;
    cancelAnimationFrame(raf);
    raf = 0;
    onError(error instanceof Error ? error : new Error(String(error)));
  };

  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(PALETTE.background);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.24;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  } catch (error) {
    reportError(error);
    return inert;
  }

  try {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PALETTE.background);
  scene.fog = new THREE.Fog(PALETTE.background, 58, 100);
  const camera = new THREE.PerspectiveCamera(42, 1, .06, 100);
  const world = new THREE.Group();
  scene.add(world);
  const register = resource => { disposables.add(resource); return resource; };
  const standard = (color, extra = {}) => register(new THREE.MeshStandardMaterial({ color, roughness: .67, ...extra }));
  const basic = (color, extra = {}) => register(new THREE.MeshBasicMaterial({ color, ...extra }));
  const boxGeometry = register(new THREE.BoxGeometry(1, 1, 1));
  const roundGeometry = register(new RoundedBoxGeometry(1, 1, 1, 2, .055));
  const sphereGeometry = register(new THREE.SphereGeometry(1, 14, 10));
  const cylinderGeometry = register(new THREE.CylinderGeometry(1, 1, 1, 12));
  const oak = standard(PALETTE.oak, { roughness: .72 });
  const dark = standard(PALETTE.teal, { roughness: .52 });
  const white = standard(PALETTE.white);
  const charcoal = standard(0x242e2b, { roughness: .72 });
  const steel = standard(PALETTE.metal, { metalness: .68, roughness: .30 });
  const rubber = standard(0x303b36, { roughness: .94 });
  const orange = standard(PALETTE.orange);
  const glass = standard(0xc8d9d2, { transparent: true, opacity: .22, roughness: .2, metalness: .18, depthWrite: false });
  const warmWhite = standard(0xe2ded1);

  function mesh(geometry, material, position, scale, parent = world, shadow = true) {
    const object = new THREE.Mesh(geometry, material);
    if (position) object.position.set(...position);
    if (scale) object.scale.set(...scale);
    object.castShadow = shadow;
    object.receiveShadow = shadow;
    parent.add(object);
    return object;
  }
  function box(position, size, material = oak, parent = world, rounded = true, shadow = true) {
    return mesh(rounded ? roundGeometry : boxGeometry, material, position, size, parent, shadow);
  }
  function cylinderBetween(a, b, radius, material, parent = world) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
    const direction = end.clone().sub(start);
    const object = mesh(cylinderGeometry, material, start.clone().add(end).multiplyScalar(.5).toArray(),
      [radius, direction.length(), radius], parent, false);
    object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    return object;
  }
  function texture(width, height, paint) {
    const surface = document.createElement('canvas');
    surface.width = width; surface.height = height;
    const context = surface.getContext('2d');
    paint(context, width, height);
    const result = register(new THREE.CanvasTexture(surface));
    result.colorSpace = THREE.SRGBColorSpace;
    result.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    return result;
  }
  function sign(label, sublabel, { width = 2, height = .6, color = '#173e39', background = '#f9f7f0' } = {}) {
    const map = texture(768, 256, (ctx, w, h) => {
      ctx.fillStyle = background; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '600 70px Arial, sans-serif';
      ctx.fillText(label, w / 2, sublabel ? h * .39 : h * .53);
      if (sublabel) { ctx.font = '400 29px Arial, sans-serif'; ctx.fillText(sublabel, w / 2, h * .75); }
    });
    const panel = new THREE.Mesh(register(new THREE.PlaneGeometry(width, height)),
      basic(0xffffff, { map, side: THREE.DoubleSide }));
    return panel;
  }
  const shadowMap = texture(128, 128, (ctx, w, h) => {
    const gradient = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w/2);
    gradient.addColorStop(0, 'rgba(18,34,26,.26)'); gradient.addColorStop(.5, 'rgba(18,34,26,.12)');
    gradient.addColorStop(1, 'rgba(18,34,26,0)'); ctx.fillStyle = gradient; ctx.fillRect(0,0,w,h);
  });
  const shadowMaterial = basic(0xffffff, { map: shadowMap, transparent: true, depthWrite: false });
  const planeGeometry = register(new THREE.PlaneGeometry(1, 1));
  function contactShadow(x, z, width, depth, parent = world) {
    const object = mesh(planeGeometry, shadowMaterial, [x,.014,z], [width,depth,1], parent, false);
    object.rotation.x = -Math.PI / 2;
    return object;
  }

  scene.add(new THREE.HemisphereLight(0xfffcf3, 0x8c9d88, 2.2));
  const sun = new THREE.DirectionalLight(0xfff0d6, 3.2);
  sun.position.set(-7, 16, 11); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 45 });
  sun.shadow.bias = -.0003; sun.shadow.normalBias = .035; sun.shadow.radius = 3;
  sun.target.position.set(0, 0, 0); scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(0xecfffa, 1.1);
  fill.position.set(8, 8, -6); scene.add(fill);

  // A raised, softly bevelled floor gives the overview a deliberate architectural base.
  box([0,-.22,0], [18.6,.42,16.6], white, world, true);
  box([0,-.025,0], [18.2,.09,16.2], standard(PALETTE.floor), world, true);
  const grout = register(new THREE.LineBasicMaterial({ color:0xdedace, transparent:true, opacity:.45 }));
  const tileLines = [];
  for (let i = -7; i <= 7; i++) tileLines.push(-9,.025,i*1.05,9,.025,i*1.05);
  for (let i = -8; i <= 8; i++) tileLines.push(i*1.05,.025,-8,i*1.05,.025,8);
  const lineGeometry = register(new THREE.BufferGeometry());
  lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(tileLines, 3));
  world.add(new THREE.LineSegments(lineGeometry, grout));
  box([0,1.65,-8], [18.2,3.35,.18], warmWhite, world, false);
  box([-9,1.65,0], [.18,3.35,16], warmWhite, world, false);
  box([0,.16,-7.84], [18,.22,.09], dark, world, false);
  box([-8.84,.16,0], [.09,.22,16], dark, world, false);
  // Fine oak battens and a restrained wall wordmark.
  for (let x = -3.8; x <= 4.2; x += .18) box([x,2.59,-7.84], [.035,1.15,.08], oak, world, false, false);
  const wordmark = sign('THE DAILY MARKET', 'Good food. A little closer.', { width: 4.1, height: 1.03 });
  wordmark.position.set(.25,2.61,-7.74); world.add(wordmark);
  const fresh = sign('Fresh, every day.', '', { width: 3.35, height: .6 });
  fresh.position.set(-6.5,2.5,-7.85); world.add(fresh);

  // A deterministic palette keeps the generated merchandise looking curated.
  let randomState = 8192;
  const random = () => { randomState = (randomState * 1664525 + 1013904223) >>> 0; return randomState / 4294967296; };
  const scratch = new THREE.Object3D();
  function instances(geometry, material, transforms) {
    const result = new THREE.InstancedMesh(geometry, material, transforms.length);
    transforms.forEach((item, i) => {
      scratch.position.set(...item.position); scratch.scale.set(...item.scale);
      scratch.rotation.set(0, item.rotation || 0, 0); scratch.updateMatrix();
      result.setMatrixAt(i, scratch.matrix);
      if (item.color !== undefined) result.setColorAt(i, new THREE.Color(item.color));
    });
    result.instanceMatrix.needsUpdate = true;
    if (result.instanceColor) result.instanceColor.needsUpdate = true;
    world.add(result); return result;
  }
  const productLabel = category => texture(256, 320, (ctx,w,h) => {
    ctx.fillStyle = '#f8f2df'; ctx.fillRect(0,0,w,h);
    ctx.fillStyle = '#173e39'; ctx.fillRect(20,22,w-40,7);
    ctx.textAlign = 'center'; ctx.font = '700 44px Arial, sans-serif';
    ctx.fillText(category, w/2, 104);
    ctx.font = '400 20px Arial, sans-serif'; ctx.fillText('DAILY GOODS',w/2,143);
    ctx.strokeStyle = '#627f66'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.ellipse(w/2,217,28,39,-.4,0,Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w/2-12,249); ctx.lineTo(w/2+15,189); ctx.stroke();
    ctx.font = '400 16px Arial, sans-serif'; ctx.fillText('SIMPLY GOOD',w/2,290);
  });
  const columns = [-3.8, 0, 4.2];
  const aisleNames = [['01','Pantry'],['02','Everyday'],['03','Dairy & oat']];
  const categories = ['PASTA', 'GRAINS', 'OAT'];
  const productColors = [
    [0xd99264,0x9aac74,0xc8b89a,0xe2bf79],
    [0x8ca8a2,0xcc8273,0xc3ac7c,0xe4d6af],
    [0xe9e0c9,0x98b6a2,0xc7d2bc,0xdfc995],
  ];
  columns.forEach((x, aisle) => {
    const centerZ = -1.2;
    contactShadow(x, centerZ, 2.8, 6.4);
    box([x,.15,centerZ], [1.4,.28,5.25], dark);
    box([x,1.12,centerZ], [.09,1.9,5.17], oak);
    for (const end of [-3.82,1.42]) {
      box([x,1.12,end], [1.4,2.16,.09], oak);
      box([x,2.15,end], [1.43,.09,.15], dark);
    }
    const cartons = [], labels = [], caps = [];
    for (let level = 0; level < 4; level++) {
      const y = .38 + level * .45;
      box([x,y,centerZ], [1.42,.07,5.25], oak);
      for (const side of [-1,1]) {
        box([x+side*.716,y+.021,centerZ], [.02,.08,5.12], white, world, false, false);
        // One slender label rail, dotted with small shelf-edge price marks.
        for (let label = 0; label < 6; label++) {
          box([x+side*.73,y+.02,-3.42+label*.83], [.005,.023,.09], dark, world, false, false);
        }
        for (let n = 0; n < 17; n++) {
          if (random() < .045) continue;
          const height = aisle === 2 ? .34 : .28 + random()*.07;
          const z = -3.55 + n*.291;
          const productX = x+side*.39;
          const color = productColors[aisle][Math.floor(n/4+level)%4];
          cartons.push({ position:[productX,y+.04+height/2,z], scale:[.23,height,.205], rotation:side*Math.PI/2, color });
          labels.push({ position:[productX+side*.106,y+.04+height/2,z], scale:[.16,height*.77,1], rotation:side*Math.PI/2 });
          if (aisle === 2) caps.push({ position:[productX,y+height+.057,z+.036], scale:[.035,.036,.035], color:0xf9f6e9 });
        }
      }
    }
    instances(roundGeometry, white, cartons);
    instances(planeGeometry, basic(0xffffff, { map:productLabel(categories[aisle]) }), labels);
    if (caps.length) instances(cylinderGeometry, white, caps);
    // Low, discreet supports put aisle markers above eye level without a ceiling.
    cylinderBetween([x,2.2,.45],[x,2.72,.45],.018,dark);
    const plaque = sign(`${aisleNames[aisle][0]}   ${aisleNames[aisle][1]}`, '', { width:1.9,height:.40,color:'#f9f7f0',background:'#173e39' });
    plaque.position.set(x,2.68,.50); world.add(plaque);
  });

  // Back-wall chilled cabinets, including trim, inset light, and glazed doors.
  const chilledProduct = standard(0xadbdad);
  for (let i=0; i<4; i++) {
    const x=-2.4+i*1.65;
    box([x,1.13,-7.30],[1.58,2.22,.90],dark);
    box([x,1.16,-6.822],[1.39,1.87,.02],standard(0xc0cfc4),world,false,false);
    for (let level=0; level<4; level++) {
      const y=.45+level*.43;
      box([x,y,-6.69],[1.37,.045,.27],white,world,false,false);
      for (let n=0;n<6;n++) {
        box([x-.55+n*.22,y+.15,-6.67],[.13,.25,.13], n%2 ? white : chilledProduct,world,true,false);
      }
    }
    box([x,2.14,-6.79],[1.34,.027,.03],basic(0xfff9d7),world,false,false);
    box([x,1.18,-6.48],[1.38,1.94,.018],glass,world,false,false);
    cylinderBetween([x+.59,.90,-6.43],[x+.59,1.43,-6.43],.015,steel);
  }

  // Produce is kept in shallow, slatted oak bins, not floating spheres.
  contactShadow(-6.5,-6.15,4.7,2.8);
  box([-6.5,.38,-6.15],[3.62,.68,1.76],dark);
  box([-6.5,.75,-6.15],[3.85,.10,1.97],oak);
  const produceItems = [];
  for (let bin=0;bin<3;bin++) {
    const x=-7.70+bin*1.2;
    box([x,.83,-6.12],[1.11,.12,1.58],oak);
    for (const side of [-1,1]) {
      box([x+side*.57,.96,-6.12],[.045,.25,1.64],oak,world,false);
      for (let slat=0;slat<3;slat++) box([x,.84+slat*.075,-6.12+side*.83],[1.13,.035,.035],oak,world,false);
    }
    for (let row=0;row<5;row++) for(let column=0;column<4;column++) {
      produceItems.push({position:[x-.37+column*.245+(random()-.5)*.02,.97+random()*.05,-6.75+row*.30],
        scale:bin===1?[.115,.15,.12]:[.13,.12,.13],color:bin===0?0xd3a54e:bin===1?0x7f9e59:0xc56c50});
    }
    const label = sign(['Citrus','Pears','Apples'][bin], '', {width:.70,height:.19});
    label.position.set(x,.83,-5.17); world.add(label);
  }
  instances(sphereGeometry, white, produceItems);
  // A planted herb display makes the end of the store feel lived-in.
  const leaf = standard(0x63866a);
  for (let i=0;i<3;i++) {
    const x=6.6+i*.57;
    mesh(cylinderGeometry,oak,[x,.60,-6.58],[.22,.65,.22]);
    for(let j=0;j<6;j++) {
      const angle=j*Math.PI/3;
      const foliage=mesh(sphereGeometry,leaf,[x+Math.sin(angle)*.14,1.14+random()*.2,-6.58+Math.cos(angle)*.14],[.11,.38,.12]);
      foliage.rotation.z=Math.sin(angle)*.45;
    }
  }
  box([7.15,.29,-6.58],[2.25,.12,1.16],oak);

  // Checkout island: inset belt, terminal, paper bags, and a discreet lamp.
  contactShadow(-3.2,3.65,4.1,2.6);
  box([-3.2,.52,3.65],[3.12,1.01,1.26],oak);
  box([-3.2,1.04,3.65],[3.3,.13,1.40],white);
  box([-3.82,1.119,3.65],[1.6,.025,1.13],charcoal);
  for (let i=0;i<15;i++) box([-4.50+i*.1,1.135,3.65],[.009,.004,1.04],rubber,world,false,false);
  cylinderBetween([-2.05,1.10,3.45],[-2.05,1.55,3.45],.055,dark);
  const terminal=box([-2.05,1.54,3.40],[.49,.34,.065],dark); terminal.rotation.x=-.17;
  const screen=sign('Ready', '', {width:.40,height:.24,color:'#71f4be',background:'#173e39'});
  screen.position.set(-2.05,1.54,3.44); screen.rotation.x=-.17; world.add(screen);
  for (let i=0;i<2;i++) {
    const x=-2.67+i*.35;
    box([x,1.35,3.50],[.28,.48,.23],oak);
    const handle=new THREE.Line(register(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x-.07,1.56,3.5),new THREE.Vector3(x-.07,1.68,3.5),
      new THREE.Vector3(x+.07,1.68,3.5),new THREE.Vector3(x+.07,1.56,3.5),
    ])), register(new THREE.LineBasicMaterial({color:0xa98559}))); world.add(handle);
  }
  cylinderBetween([-1.83,0,3.13],[-1.83,2.7,3.13],.022,dark);
  const checkoutSign=sign('CHECKOUT', '', {width:1.55,height:.35,color:'#f9f7f0',background:'#173e39'});
  checkoutSign.position.set(-1.83,2.69,3.17); world.add(checkoutSign);
  // Entry gates and small floor plates orient the route immediately.
  for(const x of [1.15,5.7]) {
    box([x,.54,7.15],[.16,1.04,.55],dark);
    box([x,1.095,7.15],[.17,.05,.57],oak);
  }
  const entrySign = sign('IN', '', {width:.7,height:.3,color:'#173e39',background:'#f0ece3'});
  entrySign.rotation.x=-Math.PI/2; entrySign.position.set(4.2,.032,7.65); world.add(entrySign);
  const exitSign = sign('EXIT  →', '', {width:1.15,height:.3,color:'#173e39',background:'#f0ece3'});
  exitSign.rotation.x=-Math.PI/2; exitSign.position.set(-.2,.032,7.65); world.add(exitSign);

  // Bake the stationary fixtures by material. Hundreds of shelf parts then cost
  // a handful of draw calls; moving objects and transparent surfaces stay separate.
  const staticBatches=new Map();
  world.children.forEach(object=>{
    if(!object.isMesh || object.isInstancedMesh || object.material.transparent) return;
    const key=`${object.material.uuid}-${object.castShadow}-${object.receiveShadow}`;
    if(!staticBatches.has(key)) staticBatches.set(key,[]);
    staticBatches.get(key).push(object);
  });
  staticBatches.forEach(objects=>{
    if(objects.length<2) return;
    const geometries=objects.map(object=>{
      object.updateMatrix();
      const geometry=object.geometry.index?object.geometry.toNonIndexed():object.geometry.clone();
      return geometry.applyMatrix4(object.matrix);
    });
    const geometry=mergeGeometries(geometries,false);
    geometries.forEach(item=>item.dispose());
    if(!geometry) return;
    register(geometry);
    const combined=new THREE.Mesh(geometry,objects[0].material);
    combined.castShadow=objects[0].castShadow; combined.receiveShadow=objects[0].receiveShadow;
    world.add(combined); objects.forEach(object=>world.remove(object));
  });

  // Worker rig. Body proportions, bent elbows, a cap and shoes make the gait readable.
  const worker = new THREE.Group(); world.add(worker);
  const person = new THREE.Group(); worker.add(person);
  const skin = standard(0xb88363, {roughness:.83});
  const hair = standard(0x362923);
  const trousers = standard(0x414a42);
  const shirt = standard(0xe7e5d8);
  const vest = standard(0x246256);
  const hips = new THREE.Group(); hips.position.y=.88; person.add(hips);
  box([0,.035,0],[.39,.22,.255],trousers,hips);
  const torso=new THREE.Group(); torso.position.set(0,1.16,0); person.add(torso);
  box([0,.03,0],[.49,.51,.29],vest,torso);
  box([0,.19,.155],[.10,.21,.027],shirt,torso);
  box([.13,.11,.156],[.095,.055,.011],white,torso,false,false);
  box([-.14,-.08,.157],[.13,.12,.018],dark,torso);
  cylinderBetween([0,1.43,0],[0,1.53,0],.077,skin,person);
  mesh(sphereGeometry,skin,[0,1.65,.015],[.147,.192,.139],person);
  mesh(sphereGeometry,hair,[0,1.75,-.014],[.148,.105,.141],person);
  mesh(sphereGeometry,skin,[0,1.644,.145],[.031,.043,.038],person);
  for(const side of [-1,1]) {
    mesh(sphereGeometry,skin,[side*.143,1.655,0],[.027,.047,.032],person);
    mesh(sphereGeometry,charcoal,[side*.052,1.686,.136],[.009,.009,.006],person,false);
  }
  box([0,1.787,.036],[.31,.065,.27],dark,person);
  box([0,1.769,.162],[.30,.025,.13],dark,person);
  // A tiny pair of dark frames is visible in close overview without becoming a headset.
  for(const side of [-1,1]) box([side*.071,1.683,.145],[.113,.056,.014],charcoal,person);
  cylinderBetween([-.13,1.685,.14],[.13,1.685,.14],.008,charcoal,person);
  const legs=[];
  for(const side of [-1,1]) {
    const leg=new THREE.Group(); leg.position.set(side*.112,.89,0); person.add(leg);
    mesh(register(new THREE.CapsuleGeometry(.085,.30,4,8)),trousers,[0,-.21,0],[1,1,1],leg);
    const lower=new THREE.Group(); lower.position.y=-.42; leg.add(lower);
    mesh(register(new THREE.CapsuleGeometry(.065,.27,4,8)),trousers,[0,-.18,0],[1,1,1],lower);
    box([0,-.378,.055],[.16,.105,.30],white,lower);
    box([0,-.424,.055],[.163,.025,.306],rubber,lower);
    legs.push({leg,lower,side});
  }
  const arms=[];
  for(const side of [-1,1]) {
    const arm=new THREE.Group(); arm.position.set(side*.273,1.385,.018); person.add(arm);
    cylinderBetween([0,0,0],[side*.018,-.235,.20],.072,shirt,arm);
    cylinderBetween([side*.018,-.235,.20],[side*.025,-.35,.51],.049,skin,arm);
    mesh(sphereGeometry,skin,[side*.025,-.35,.51],[.058,.065,.052],arm);
    arms.push({arm,side});
  }

  // The wire cart is mostly slender rods, with a tapered basket and four casters.
  const cart=new THREE.Group(); cart.position.z=.98; worker.add(cart);
  box([0,.25,.01],[.71,.045,.91],steel,cart);
  for(const x of [-.32,.32]) {
    cylinderBetween([x,.23,-.40],[x,.93,-.45],.024,steel,cart);
    cylinderBetween([x,.23,.40],[x,.66,.39],.021,steel,cart);
  }
  cylinderBetween([-.38,1.036,-.47],[.38,1.036,-.47],.033,dark,cart);
  for(const y of [.54,.68,.82,.96]) {
    const width=.30+(y-.54)*.18;
    const back=-.32-(y-.54)*.28;
    const front=.38+(y-.54)*.20;
    cylinderBetween([-width,y,back],[width,y,back],.009,steel,cart);
    cylinderBetween([-width,y,front],[width,y,front],.009,steel,cart);
    cylinderBetween([-width,y,back],[-width,y,front],.009,steel,cart);
    cylinderBetween([width,y,back],[width,y,front],.009,steel,cart);
  }
  for(let n=0;n<8;n++) {
    const z=-.32+n*.1;
    cylinderBetween([-.30,.54,z],[-.375,.96,z*1.2],.008,steel,cart);
    cylinderBetween([.30,.54,z],[.375,.96,z*1.2],.008,steel,cart);
    cylinderBetween([-.30,.54,z],[.30,.54,z],.008,steel,cart);
  }
  for(let n=0;n<7;n++) {
    const x=-.29+n*.097;
    cylinderBetween([x,.54,-.32],[x*1.25,.96,-.438],.008,steel,cart);
    cylinderBetween([x,.54,.38],[x*1.25,.96,.464],.008,steel,cart);
  }
  const wheels=[];
  for(const x of [-.30,.30]) for(const z of [-.34,.36]) {
    cylinderBetween([x,.25,z],[x,.13,z],.016,steel,cart);
    const wheel=mesh(cylinderGeometry,rubber,[x,.113,z],[.095,.045,.095],cart);
    wheel.rotation.z=Math.PI/2; wheels.push(wheel);
  }
  const cartMilk=box([-.10,.74,.10],[.18,.34,.18],white,cart);
  box([-.10,.76,.194],[.13,.23,.009],standard(0x8aaa8e),cartMilk);
  // Correct the label's transform to be local to the carton.
  cartMilk.children[0].position.set(0,.02,.505);
  cartMilk.children[0].scale.set(.72,.65,.05);
  const cartProduce=mesh(sphereGeometry,standard(0xd0a95e),[.16,.68,-.03],[.15,.12,.14],cart);
  const workerShadow=contactShadow(0,0,1.15,1.35,worker);
  contactShadow(0,.98,1.4,1.6,worker);

  // AR graphics share the same world coordinates as the route and merchandise.
  const augmented = new THREE.Group(); world.add(augmented);
  const routePoints=Array.from({length:240},(_,i)=>routeAt(i/239).setY(.047));
  const routeCurve=new THREE.CatmullRomCurve3(routePoints);
  const ribbonMaterial=basic(PALETTE.mint,{transparent:true,opacity:.23,depthWrite:false});
  const ribbon=mesh(register(new THREE.TubeGeometry(routeCurve,240,.033,5,false)),ribbonMaterial,null,null,augmented,false);
  ribbon.renderOrder=1;
  const arrowShape=new THREE.Shape();
  arrowShape.moveTo(0,.21); arrowShape.lineTo(-.18,-.05); arrowShape.lineTo(-.115,-.115);
  arrowShape.lineTo(0,.055); arrowShape.lineTo(.115,-.115); arrowShape.lineTo(.18,-.05); arrowShape.closePath();
  const arrowGeometry=register(new THREE.ShapeGeometry(arrowShape)); arrowGeometry.rotateX(Math.PI/2);
  const arrowMaterial=basic(0xffffff,{transparent:true,opacity:.91,depthWrite:false,side:THREE.DoubleSide});
  const routeArrows=new THREE.InstancedMesh(arrowGeometry,arrowMaterial,62); augmented.add(routeArrows);
  routeArrows.renderOrder=2;
  const arrowProgress=[];
  for(let i=0;i<62;i++) {
    const p=(i+.5)/62;
    const position=routeAt(p).setY(.065), ahead=routeAt(Math.min(1,p+.002));
    scratch.position.copy(position); scratch.rotation.set(0,Math.atan2(ahead.x-position.x,ahead.z-position.z),0);
    scratch.scale.setScalar(1); scratch.updateMatrix(); routeArrows.setMatrixAt(i,scratch.matrix); arrowProgress.push(p);
  }
  const mintColor=new THREE.Color(PALETTE.mint), orangeColor=new THREE.Color(PALETTE.orange), dimColor=new THREE.Color(0x609f84);
  const markerMaterial=basic(PALETTE.mint,{transparent:true,opacity:.84,depthWrite:false,side:THREE.DoubleSide});
  const haloMaterial=basic(PALETTE.mint,{transparent:true,opacity:.13,depthWrite:false,side:THREE.DoubleSide});
  const marker=mesh(register(new THREE.RingGeometry(.50,.53,48)),markerMaterial,[0,.071,0],null,augmented,false);
  marker.rotation.x=-Math.PI/2;
  const halo=mesh(register(new THREE.CircleGeometry(.50,48)),haloMaterial,[0,.069,0],null,augmented,false); halo.rotation.x=-Math.PI/2;
  // A small, depth-independent locator keeps the worker legible behind gondolas.
  // It exists only in overview; the eye-level view retains physical occlusion.
  const workerLocator=new THREE.Group(); augmented.add(workerLocator);
  const locatorTexture=texture(128,128,(ctx,w,h)=>{
    const glow=ctx.createRadialGradient(w/2,h/2,12,w/2,h/2,57);
    glow.addColorStop(0,'rgba(251,169,103,.28)'); glow.addColorStop(1,'rgba(251,169,103,0)');
    ctx.fillStyle=glow; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='rgba(252,164,99,.84)'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.arc(w/2,h/2,37,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle='#f5a269'; ctx.beginPath(); ctx.arc(w/2,h/2,13,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#fff7e9'; ctx.lineWidth=2; ctx.stroke();
  });
  const locatorSprite=new THREE.Sprite(register(new THREE.SpriteMaterial({map:locatorTexture,
    transparent:true,depthTest:false,depthWrite:false,toneMapped:false})));
  locatorSprite.position.y=2.87; locatorSprite.scale.set(.64,.64,1); locatorSprite.renderOrder=10;
  workerLocator.add(locatorSprite);
  const locatorStem=cylinderBetween([0,1.98,0],[0,2.64,0],.006,
    basic(0xf4aa72,{transparent:true,opacity:.40,depthTest:false,depthWrite:false,toneMapped:false}),workerLocator);
  locatorStem.renderOrder=9;
  const targetGroup=new THREE.Group(); augmented.add(targetGroup);
  const targetMaterial=basic(PALETTE.orange,{transparent:true,opacity:.88,depthWrite:false,toneMapped:false});
  const targetGlowMaterial=basic(PALETTE.orange,{transparent:true,opacity:.12,depthWrite:false,
    blending:THREE.AdditiveBlending,toneMapped:false});
  // Four fine rounded brackets locate one carton, with a faint halo instead of a box.
  const halfWidth=.148, halfHeight=.19, bracket=.078, radius=.019;
  for(const xSide of [-1,1]) for(const ySide of [-1,1]) {
    const corner=new THREE.Vector3(xSide*halfWidth,ySide*halfHeight,0);
    const start=new THREE.Vector3(xSide*halfWidth,ySide*(halfHeight-bracket),0);
    const arcStart=new THREE.Vector3(xSide*halfWidth,ySide*(halfHeight-radius),0);
    const arcEnd=new THREE.Vector3(xSide*(halfWidth-radius),ySide*halfHeight,0);
    const end=new THREE.Vector3(xSide*(halfWidth-bracket),ySide*halfHeight,0);
    const curve=new THREE.CurvePath();
    curve.add(new THREE.LineCurve3(start,arcStart));
    curve.add(new THREE.QuadraticBezierCurve3(arcStart,corner,arcEnd));
    curve.add(new THREE.LineCurve3(arcEnd,end));
    mesh(register(new THREE.TubeGeometry(curve,14,.0025,6,false)),targetMaterial,null,null,targetGroup,false);
    mesh(register(new THREE.TubeGeometry(curve,14,.009,6,false)),targetGlowMaterial,null,null,targetGroup,false);
  }
  const targetBacking=mesh(planeGeometry,basic(PALETTE.orange,{transparent:true,opacity:.014,depthWrite:false,
    side:THREE.DoubleSide}),[0,0,-.005],[halfWidth*2,halfHeight*2,1],targetGroup,false);
  targetBacking.renderOrder=3;
  const itemSign=sign('Oat milk', '1 × 1 L · shelf 3', {width:1.08,height:.36,color:'#173e39',background:'#ecfff5'});
  itemSign.material.transparent=true; itemSign.material.depthWrite=false;
  itemSign.position.set(0,1.15,0); targetGroup.add(itemSign);
  const produceMarkerMaterial=register(targetMaterial.clone()); produceMarkerMaterial.color.copy(mintColor);
  const produceMarker=mesh(register(new THREE.RingGeometry(.65,.69,48)),produceMarkerMaterial,[-6.5,1.17,-6.13],null,augmented,false);
  produceMarker.rotation.x=-Math.PI/2;
  const produceLabel=sign('Fresh produce', '2 pears · picked', {width:1.2,height:.36,color:'#173e39',background:'#ecfff5'});
  produceLabel.material.transparent=true; produceLabel.material.depthWrite=false;
  produceLabel.position.set(-6.5,1.75,-5.42); augmented.add(produceLabel);

  const position=new THREE.Vector3(), nextPosition=new THREE.Vector3(), behindPosition=new THREE.Vector3();
  const direction=new THREE.Vector3(0,0,-1), forward=new THREE.Vector3();
  const cameraTarget=new THREE.Vector3(), desiredCamera=new THREE.Vector3();
  const desiredLook=new THREE.Vector3(), actualLook=new THREE.Vector3(0,.3,0);
  const milkTarget=new THREE.Vector3(3.77,1.37,-1.9), produceTarget=new THREE.Vector3(-6.5,1.0,-6.13);
  const labelQuaternion=new THREE.Quaternion(), desiredOrientation=new THREE.Quaternion();
  const viewRotation=new THREE.Matrix4(), arrowColor=new THREE.Color();
  // Arc distance gives wheels and reverse scrubbing the same physical route metric.
  const distanceSamples=new Float32Array(769), samplePrevious=routeAt(0), sampleCurrent=new THREE.Vector3();
  for(let i=1;i<distanceSamples.length;i++) {
    routeAt(i/(distanceSamples.length-1),sampleCurrent);
    distanceSamples[i]=distanceSamples[i-1]+sampleCurrent.distanceTo(samplePrevious);
    samplePrevious.copy(sampleCurrent);
  }
  const distanceAt=value=>{
    const index=THREE.MathUtils.clamp(value,0,1)*(distanceSamples.length-1);
    const lower=Math.floor(index), upper=Math.min(lower+1,distanceSamples.length-1);
    return THREE.MathUtils.lerp(distanceSamples[lower],distanceSamples[upper],index-lower);
  };
  let previousDistance=distanceAt(0);
  let yaw=Math.PI, cameraInitialized=false;
  const widthHeight={width:0,height:0};
  const host=canvas.parentElement || canvas;

  function sizeRenderer() {
    if(destroyed || failed) return;
    const rect=canvas.getBoundingClientRect();
    const width=Math.max(1,Math.round(rect.width || host.clientWidth || 640));
    const height=Math.max(1,Math.round(rect.height || host.clientHeight || 480));
    if(width!==widthHeight.width || height!==widthHeight.height) {
      widthHeight.width=width; widthHeight.height=height;
      renderer.setSize(width,height,false); camera.aspect=width/height;
      camera.updateProjectionMatrix(); requestFrame();
    }
  }
  function update(time,dt) {
    const snap=reducedMotion.matches || !motionEnabled || needsRebase;
    // A short final smoothing pass absorbs scroll-event quantisation. The page
    // may interpolate its own progress; this pass adds no spring overshoot.
    const ease=snap?1:1-Math.exp(-16*dt);
    progress=THREE.MathUtils.lerp(progress,targetProgress,ease);
    if(Math.abs(progress-targetProgress)<.000015) progress=targetProgress;
    routeAt(progress,position);
    const distance=distanceAt(progress), signedSpeed=(distance-previousDistance)/dt;
    previousDistance=distance;
    // Replay the gait backwards when scrolling back; cap cadence during a fast
    // scrub so small limbs never flicker through dozens of steps per second.
    const desiredGaitSpeed=snap?0:THREE.MathUtils.clamp(signedSpeed,-2.15,2.15);
    gaitSpeed=snap?0:THREE.MathUtils.lerp(gaitSpeed,desiredGaitSpeed,1-Math.exp(-10*dt));
    gaitPhase=snap?distance*6.8:gaitPhase+gaitSpeed*6.8*dt;
    stride=snap?0:THREE.MathUtils.lerp(stride,THREE.MathUtils.smoothstep(Math.abs(gaitSpeed),.025,1.3),1-Math.exp(-10*dt));
    // A symmetric tangent remains defined at both ends and doesn't flip the
    // camera when the reader changes scrolling direction.
    routeAt(Math.min(1,progress+.006),nextPosition);
    routeAt(Math.max(0,progress-.006),behindPosition);
    direction.copy(nextPosition).sub(behindPosition).setY(0);
    if(direction.lengthSq()<.00001) direction.set(Math.sin(yaw),0,Math.cos(yaw));
    direction.normalize();
    const desiredYaw=Math.atan2(direction.x,direction.z);
    const turn=Math.atan2(Math.sin(desiredYaw-yaw),Math.cos(desiredYaw-yaw));
    const yawStep=turn*(snap?1:1-Math.exp(-8*dt));
    yaw+=yawStep; headingResidual=Math.abs(turn-yawStep);
    worker.position.copy(position); worker.rotation.y=yaw;
    const phase=gaitPhase;
    person.position.y=(1-Math.cos(phase*2))*.007*stride;
    torso.rotation.x=.035+Math.cos(phase*2)*.012*stride;
    torso.rotation.z=Math.sin(phase)*.018*stride;
    for(const {leg,lower,side} of legs) {
      const swing=Math.sin(phase+(side===1?Math.PI:0));
      leg.rotation.x=swing*.34*stride;
      lower.rotation.x=-Math.max(0,-swing)*.51*stride;
    }
    for(const {arm,side} of arms) arm.rotation.x=Math.sin(phase+(side===1?Math.PI:0))*.085*stride;
    cart.rotation.y=snap?0:THREE.MathUtils.lerp(cart.rotation.y,THREE.MathUtils.clamp(-yawStep/dt*.024,-.07,.07),1-Math.exp(-8*dt));
    wheels.forEach(wheel=>{wheel.rotation.x=-distance/.095;});
    workerShadow.scale.set(1.15,1.35,1);
    cartMilk.visible=progress>=.43; cartProduce.visible=progress>=.635;

    marker.position.set(position.x,.071,position.z);
    halo.position.set(position.x,.069,position.z);
    // Guidance moves with the story rather than starting an idle animation.
    const pulse=snap?1:1+Math.sin(progress*Math.PI*10)*.025;
    marker.scale.setScalar(pulse); halo.scale.setScalar(pulse);
    workerLocator.visible=mode==='overview'; workerLocator.position.copy(position);
    locatorSprite.scale.set(.64*pulse,.64*pulse,1);
    const cueFade=(start,end)=>THREE.MathUtils.smoothstep(progress,start,start+.02)
      *(1-THREE.MathUtils.smoothstep(progress,end-.02,end));
    const itemFade=cueFade(.29,.55), produceFade=cueFade(.54,.70);
    targetGroup.visible=itemFade>.001;
    targetGroup.position.set(3.48,1.49,-1.804); targetGroup.rotation.y=-Math.PI/2;
    targetMaterial.color.copy(orangeColor).lerp(mintColor,THREE.MathUtils.smoothstep(progress,.425,.445));
    targetGlowMaterial.color.copy(targetMaterial.color);
    targetMaterial.opacity=.88*itemFade; targetGlowMaterial.opacity=.12*itemFade;
    targetBacking.material.opacity=.014*itemFade; itemSign.material.opacity=itemFade;
    itemSign.visible=mode==='overview';
    produceMarker.visible=produceFade>.001; produceMarkerMaterial.opacity=.88*produceFade;
    produceLabel.visible=produceMarker.visible && mode==='overview';
    produceLabel.material.opacity=produceFade;
    produceMarker.scale.setScalar(pulse);
    augmented.visible=arEnabled;
    for(let i=0;i<arrowProgress.length;i++) {
      const distance=arrowProgress[i]-progress;
      const completed=1-THREE.MathUtils.smoothstep(distance,-.055,-.005);
      const upcoming=THREE.MathUtils.smoothstep(distance,-.025,0)
        *(1-THREE.MathUtils.smoothstep(distance,.035,.105));
      arrowColor.copy(mintColor).lerp(dimColor,completed).lerp(orangeColor,upcoming);
      routeArrows.setColorAt(i,arrowColor);
    }
    routeArrows.instanceColor.needsUpdate=true;
    arrowMaterial.opacity=.85;

    if(mode==='overview') {
      cameraTarget.set(position.x*.14,.22,position.z*.10-.3);
      // Fit the architectural base at narrow aspect ratios as well as desktop sizes.
      const fit=Math.max(1,1.38/camera.aspect);
      desiredCamera.set(cameraTarget.x+13.3*fit,17.6*fit,cameraTarget.z+19.2*fit);
      desiredLook.copy(cameraTarget);
      camera.fov=42;
    } else {
      forward.set(Math.sin(yaw),0,Math.cos(yaw));
      desiredCamera.copy(position).addScaledVector(forward,.12);
      desiredCamera.y=1.67+(snap?0:Math.sin(phase*2)*.007*stride);
      desiredLook.copy(desiredCamera).addScaledVector(forward,4); desiredLook.y=1.40;
      // Aim toward an actual item during each pick, with eased entry and departure.
      const focusWindow=(start,end) => {
        if(progress<start || progress>end) return 0;
        return THREE.MathUtils.smoothstep(progress,start,start+.035)*(1-THREE.MathUtils.smoothstep(progress,end-.035,end));
      };
      desiredLook.lerp(milkTarget,focusWindow(.30,.47)*.96);
      desiredLook.lerp(produceTarget,focusWindow(.575,.65)*.96);
      camera.fov=66;
    }
    const cameraEase=snap || !cameraInitialized?1:1-Math.exp(-(mode==='eyes'?8:5)*dt);
    if(mode==='eyes') {
      // Position stays on the smoothed route. Smoothing position a second time
      // could trail through the cart or shelves during a rapid scroll reversal.
      camera.position.copy(desiredCamera); actualLook.copy(desiredLook);
      viewRotation.lookAt(camera.position,desiredLook,camera.up);
      desiredOrientation.setFromRotationMatrix(viewRotation);
      camera.quaternion.slerp(desiredOrientation,cameraEase);
    } else {
      camera.position.lerp(desiredCamera,cameraEase); actualLook.lerp(desiredLook,cameraEase);
      camera.lookAt(actualLook); desiredOrientation.copy(camera.quaternion);
    }
    camera.updateProjectionMatrix(); cameraInitialized=true; needsRebase=false;
    targetGroup.getWorldQuaternion(labelQuaternion);
    itemSign.quaternion.copy(labelQuaternion.invert().multiply(camera.quaternion));
    produceLabel.quaternion.copy(camera.quaternion);
    // Hide both the worker and their shadow in first person. The cart stays visible.
    person.visible=mode!=='eyes'; workerShadow.visible=mode!=='eyes';
  }
  function render(time) {
    raf=0;
    if(destroyed || failed || !visible || document.hidden) return;
    const dt=frameTime?Math.min((time-frameTime)/1000,.05):1/60;
    frameTime=time;
    try {
      update(time,dt); renderer.render(scene,camera);
      if(!ready) {ready=true;onReady();}
    } catch(error) {reportError(error);return;}
    const moving=Math.abs(progress-targetProgress)>.000015 || stride>.001 || Math.abs(gaitSpeed)>.001 || headingResidual>.0005 || Math.abs(cart.rotation.y)>.0005;
    const cameraMoving=camera.position.distanceToSquared(desiredCamera)>.00001 || actualLook.distanceToSquared(desiredLook)>.00001
      || camera.quaternion.angleTo(desiredOrientation)>.0005;
    if(moving || cameraMoving) requestFrame(); else frameTime=0;
  }
  function requestFrame() {
    if(!raf && !destroyed && !failed && visible && !document.hidden) raf=requestAnimationFrame(render);
  }
  function visibilityChanged() {
    frameTime=0;
    if(document.hidden) {needsRebase=true;cancelAnimationFrame(raf);raf=0;} else requestFrame();
  }
  function motionChanged() { requestFrame(); }
  function contextLost(event) {
    event.preventDefault();
    reportError(new Error('The interactive store lost its graphics context. Reload the page to restore the 3D view.'));
  }
  const resizeObserver=new ResizeObserver(sizeRenderer); resizeObserver.observe(host);
  const intersectionObserver=new IntersectionObserver(entries=>{
    visible=entries[0]?.isIntersecting??true;
    frameTime=0;
    if(visible) requestFrame(); else {needsRebase=true;cancelAnimationFrame(raf);raf=0;}
  },{rootMargin:'120px'});
  intersectionObserver.observe(canvas);
  document.addEventListener('visibilitychange',visibilityChanged);
  reducedMotion.addEventListener('change',motionChanged);
  canvas.addEventListener('webglcontextlost',contextLost,false);
  sizeRenderer(); requestFrame();

  return {
    setProgress(value) {
      if(!Number.isFinite(value) || destroyed || failed) return;
      const next=THREE.MathUtils.clamp(value,0,1);
      if(Math.abs(next-targetProgress)<.0000001) return;
      targetProgress=next;
      requestFrame();
    },
    setView(value) {
      if(value!=='overview' && value!=='eyes') return;
      if(mode===value) return;
      mode=value;
      // Enter eye level immediately so the camera never travels through shelving.
      cameraInitialized=false; requestFrame();
    },
    setAR(value) {arEnabled=Boolean(value);requestFrame();},
    setMotion(value) {motionEnabled=Boolean(value);requestFrame();},
    destroy() {
      if(destroyed) return;
      destroyed=true; cancelAnimationFrame(raf); raf=0;
      resizeObserver.disconnect(); intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange',visibilityChanged);
      reducedMotion.removeEventListener('change',motionChanged);
      canvas.removeEventListener('webglcontextlost',contextLost,false);
      scene.traverse(object=>{if(object.isInstancedMesh) object.dispose();});
      disposables.forEach(resource=>resource.dispose()); disposables.clear();
      renderer.dispose(); scene.clear();
    },
  };
  } catch(error) {
    disposables.forEach(resource=>resource.dispose()); disposables.clear();
    renderer.dispose(); reportError(error); return inert;
  }
}
