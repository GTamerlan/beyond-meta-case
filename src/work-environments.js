import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

function random(seed = 71) {
  let value = seed;
  return () => { value = (value * 1664525 + 1013904223) >>> 0; return value / 4294967296; };
}

function surface(kind, color, repeat = [1, 1]) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) return new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
  const rng = random(kind.length * 593);
  const base = new THREE.Color(color);
  base.convertLinearToSRGB();
  const image = context.createImageData(256, 256);
  const grain = kind === 'wood' ? 17 : kind === 'fabric' ? 12 : 7;
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const index = (y * 256 + x) * 4;
      const fiber = kind === 'wood' ? Math.sin(x * 0.35 + Math.sin(y * 0.025) * 1.3) * 7 : 0;
      const weave = kind === 'fabric' ? ((x % 3 === 0 || y % 3 === 0) ? -7 : 4) : 0;
      const noise = (rng() - 0.5) * grain + fiber + weave;
      image.data[index] = Math.max(0, Math.min(255, base.r * 255 + noise));
      image.data[index + 1] = Math.max(0, Math.min(255, base.g * 255 + noise));
      image.data[index + 2] = Math.max(0, Math.min(255, base.b * 255 + noise));
      image.data[index + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  if (kind === 'wood') {
    for (let i = 0; i < 90; i++) {
      const x = rng() * 256;
      context.strokeStyle = `rgba(53,30,17,${0.015 + rng() * 0.07})`;
      context.lineWidth = 0.3 + rng() * 0.8;
      context.beginPath();
      context.moveTo(x, 0);
      context.bezierCurveTo(x - 4, 80, x + 4, 180, x + 1, 256);
      context.stroke();
    }
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(...repeat);
  map.anisotropy = 4;
  return new THREE.MeshStandardMaterial({
    map, roughness: kind === 'wood' ? 0.66 : 0.9,
    bumpMap: map, bumpScale: kind === 'plaster' ? 0.016 : 0.008,
  });
}

function box(parent, material, width, height, depth, x, y, z, radius = 0) {
  const geometry = radius > 0
    ? new RoundedBoxGeometry(width, height, depth, 2, Math.min(radius, Math.min(width, height, depth) * 0.45))
    : new THREE.BoxGeometry(width, height, depth);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function cylinder(parent, material, top, bottom, height, x, y, z, radial = 20) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, height, radial), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function tube(parent, material, points, radius = 0.015, segments = 24) {
  const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, segments, radius, 7, false), material);
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function daylight(scene, { outdoor = false } = {}) {
  scene.add(new THREE.HemisphereLight(outdoor ? 0xedf4f5 : 0xf5f5ef, 0xaaa190, outdoor ? 2.4 : 1.55));
  const sun = new THREE.DirectionalLight(0xffe6bf, outdoor ? 3.4 : 2.9);
  sun.position.set(outdoor ? -4.5 : -6, outdoor ? 7 : 4.1, outdoor ? 5 : 3.3);
  sun.target.position.set(0, 0.9, -0.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -7;
  sun.shadow.camera.right = 7;
  sun.shadow.camera.top = 7;
  sun.shadow.camera.bottom = -7;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 24;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.035;
  sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(0xe4edec, outdoor ? 0.5 : 0.85);
  fill.position.set(4, 3, 6);
  scene.add(fill);
  return sun;
}

function leafyPlant(parent, x, y, z, size, materials, seed) {
  const rng = random(seed);
  const plant = new THREE.Group();
  plant.position.set(x, y, z);
  plant.scale.setScalar(size);
  parent.add(plant);
  const profile = [[0.25, 0], [0.28, 0.03], [0.36, 0.56], [0.38, 0.6], [0.38, 0.64],
    [0.34, 0.65], [0.32, 0.6], [0.25, 0.06]].map(([r, h]) => new THREE.Vector2(r, h));
  const pot = new THREE.Mesh(new THREE.LatheGeometry(profile, 40), materials.pot);
  pot.castShadow = pot.receiveShadow = true;
  plant.add(pot);
  cylinder(plant, materials.soil, 0.32, 0.32, 0.02, 0, 0.58, 0);
  tube(plant, materials.bark, [[0, 0.6, 0], [0.025, 1.2, 0.01], [-0.025, 1.9, 0], [0, 2.25, 0]], 0.025);
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.1);
  shape.bezierCurveTo(-0.06, -0.035, -0.055, 0.07, 0, 0.13);
  shape.bezierCurveTo(0.055, 0.07, 0.06, -0.035, 0, -0.1);
  const geometry = new THREE.ShapeGeometry(shape, 5);
  const leaves = new THREE.InstancedMesh(geometry, materials.leaf, 180);
  leaves.castShadow = true;
  const transform = new THREE.Object3D();
  let leafIndex = 0;
  for (let branch = 0; branch < 12; branch++) {
    const angle = branch * 2.39;
    const branchY = 1.12 + branch * 0.082;
    const reach = 0.38 + Math.sin(branch / 12 * Math.PI) * 0.16;
    const end = [Math.cos(angle) * reach, branchY + 0.36, Math.sin(angle) * reach];
    tube(plant, materials.bark, [[0, branchY, 0], [end[0] * 0.45, branchY + 0.14, end[2] * 0.45], end], 0.008, 8);
    for (let i = 0; i < 15; i++) {
      const t = 0.3 + rng() * 0.8;
      transform.position.set(end[0] * t + (rng() - 0.5) * 0.14,
        branchY + t * 0.36 + (rng() - 0.5) * 0.18,
        end[2] * t + (rng() - 0.5) * 0.14);
      transform.rotation.set(rng() * 1.8, angle + rng(), (rng() - 0.5) * 1.8);
      transform.scale.setScalar(0.8 + rng() * 0.65);
      transform.updateMatrix();
      leaves.setMatrixAt(leafIndex++, transform.matrix);
      leaves.setColorAt(leafIndex - 1, new THREE.Color().setHSL(0.23 + rng() * 0.04, 0.18 + rng() * 0.13, 0.22 + rng() * 0.12));
    }
  }
  leaves.instanceMatrix.needsUpdate = true;
  plant.add(leaves);
}

function deliveryScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe4ece8);
  scene.fog = new THREE.Fog(0xe4ece8, 18, 38);
  const plaster = surface('plaster', 0xe6dfd1, [3, 2]);
  const stone = surface('stone', 0xcac9bc, [2, 2]);
  const gravel = surface('stone', 0xa3a798, [12, 12]);
  const wood = surface('wood', 0x8b6140, [1, 2]);
  const paleWood = surface('wood', 0xb68d64, [1, 2]);
  const dark = new THREE.MeshStandardMaterial({ color: 0x292f2c, roughness: 0.55 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x425650, metalness: 0.45, roughness: 0.21, clearcoat: 0.8 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x555d55, metalness: 0.7, roughness: 0.29 });
  const garden = new THREE.MeshStandardMaterial({ color: 0x697d59, roughness: 1 });
  const light = new THREE.MeshStandardMaterial({ color: 0xfff0d3, emissive: 0xffde9f, emissiveIntensity: 0.25 });
  const vegetation = {
    pot: surface('plaster', 0xa57c5c), soil: new THREE.MeshStandardMaterial({ color: 0x514b3b, roughness: 1 }),
    bark: new THREE.MeshStandardMaterial({ color: 0x6d604c, roughness: 0.9 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.88, side: THREE.DoubleSide }),
  };
  daylight(scene, { outdoor: true });

  box(scene, gravel, 24, 0.12, 28, 0, -0.11, 5);
  box(scene, plaster, 10.8, 4.1, 0.32, 0, 2.04, -0.62);
  box(scene, plaster, 0.32, 4.1, 3.3, -5.25, 2.04, -2.1);
  box(scene, plaster, 0.32, 4.1, 3.3, 5.25, 2.04, -2.1);
  box(scene, plaster, 11.0, 0.22, 2.55, 0, 4.0, -0.02, 0.035);
  box(scene, dark, 10.55, 0.035, 2.1, 0, 3.865, -0.07);
  for (let x = -4.8; x <= 4.8; x += 0.28) box(scene, paleWood, 0.20, 0.055, 2.08, x, 3.82, -0.07, 0.015);
  for (const x of [-2, 2.6]) cylinder(scene, light, 0.08, 0.08, 0.014, x, 3.783, 0.45);

  // A recessed timber front door is the clear destination of the walking path.
  box(scene, dark, 2.6, 3.12, 0.12, 0.25, 1.70, -0.38, 0.025);
  box(scene, wood, 1.54, 2.95, 0.095, 0.65, 1.64, -0.27, 0.012);
  for (let x = 0.02; x < 1.35; x += 0.16) box(scene, dark, 0.008, 2.81, 0.008, x, 1.65, -0.216);
  box(scene, glass, 0.67, 2.93, 0.06, -0.51, 1.65, -0.27);
  box(scene, dark, 0.035, 2.96, 0.095, -0.875, 1.65, -0.23);
  box(scene, dark, 0.042, 2.96, 0.095, -0.15, 1.65, -0.23);
  box(scene, metal, 0.035, 0.67, 0.07, 1.14, 1.53, -0.165, 0.016);
  for (const y of [1.23, 1.82]) box(scene, metal, 0.024, 0.025, 0.08, 1.14, y, -0.205);
  box(scene, metal, 0.09, 0.16, 0.025, 1.61, 1.55, -0.42, 0.01);
  cylinder(scene, dark, 0.022, 0.022, 0.012, 1.61, 1.58, -0.398).rotation.x = Math.PI / 2;
  box(scene, stone, 3.15, 0.16, 1.72, 0.25, 0.10, 0.27, 0.022);
  box(scene, stone, 3.55, 0.10, 0.56, 0.25, 0.028, 1.22, 0.018);
  const mat = surface('fabric', 0x686052, [4, 3]);
  box(scene, mat, 1.33, 0.018, 0.57, 0.65, 0.192, 0.48, 0.008);

  // Warm interior glimpses are subtle behind dark, reflective glazing.
  for (const x of [-3.12, 3.57]) {
    box(scene, dark, 2.46, 2.09, 0.075, x, 1.98, -0.405);
    box(scene, glass, 2.33, 1.96, 0.04, x, 1.98, -0.353);
    box(scene, dark, 0.045, 2.00, 0.065, x, 1.98, -0.317);
    box(scene, stone, 2.58, 0.095, 0.23, x, 0.885, -0.305, 0.012);
    for (let i = 0; i < 7; i++) box(scene, new THREE.MeshStandardMaterial({ color: 0x667267, roughness: 0.8 }),
      0.024, 1.91, 0.01, x - 1 + i * 0.33, 1.99, -0.324);
  }

  for (let row = 0; row < 9; row++) {
    const z = 1.83 + row * 0.84;
    for (const x of [-0.44, 0.95]) box(scene, stone, 1.34, 0.09, 0.78, x, -0.014, z, 0.018);
  }
  box(scene, stone, 0.1, 0.17, 10.2, -1.2, 0, 5.3, 0.015);
  box(scene, stone, 0.1, 0.17, 10.2, 1.72, 0, 5.3, 0.015);
  leafyPlant(scene, -1.79, 0.10, 0.15, 0.96, vegetation, 15);
  leafyPlant(scene, 2.39, 0.02, 0.72, 1.10, vegetation, 26);

  // Planted borders use many small leaf clusters, with a low retaining edge.
  const rng = random(120);
  const shrubGeometry = new THREE.IcosahedronGeometry(1, 1);
  const shrubs = new THREE.InstancedMesh(shrubGeometry, garden, 190);
  const transform = new THREE.Object3D();
  for (let i = 0; i < 190; i++) {
    const side = i % 2 ? -1 : 1;
    transform.position.set(side < 0 ? -1.7 - rng() * 2.6 : 2.2 + rng() * 2.6, 0.08 + rng() * 0.18, 2.1 + rng() * 8);
    transform.scale.set(0.12 + rng() * 0.16, 0.13 + rng() * 0.25, 0.12 + rng() * 0.16);
    transform.rotation.set(rng(), rng() * 3, rng());
    transform.updateMatrix();
    shrubs.setMatrixAt(i, transform.matrix);
    shrubs.setColorAt(i, new THREE.Color().setHSL(0.22 + rng() * 0.035, 0.18 + rng() * 0.14, 0.26 + rng() * 0.1));
  }
  shrubs.castShadow = shrubs.receiveShadow = true;
  scene.add(shrubs);
  box(scene, plaster, 0.18, 1.45, 11, -4.7, 0.72, 5.5, 0.02);
  box(scene, plaster, 0.18, 1.45, 11, 4.7, 0.72, 5.5, 0.02);
  return scene;
}

function electricianScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xece8df);
  const plaster = surface('plaster', 0xe2ded2, [3, 2]);
  const warmPlaster = surface('plaster', 0xd7d1c3, [2, 2]);
  const concrete = surface('stone', 0xbdb9aa, [5, 5]);
  const wood = surface('wood', 0xb5936c, [2, 1]);
  const plywood = surface('wood', 0xc4ac86, [2, 2]);
  const fabric = surface('fabric', 0x5c6557, [3, 2]);
  const dark = new THREE.MeshStandardMaterial({ color: 0x343b37, roughness: 0.65 });
  const metal = new THREE.MeshStandardMaterial({ color: 0xa0a79f, metalness: 0.7, roughness: 0.37 });
  const cabinet = new THREE.MeshStandardMaterial({ color: 0xaaaFA6, metalness: 0.32, roughness: 0.51 });
  const paper = new THREE.MeshStandardMaterial({ color: 0xf0eee4, roughness: 0.9 });
  const line = new THREE.MeshStandardMaterial({ color: 0xb4baaf, roughness: 1 });
  const orange = new THREE.MeshStandardMaterial({ color: 0xb07649, roughness: 0.62 });
  const sun = daylight(scene);

  box(scene, concrete, 8, 0.12, 10, 0, -0.1, 2);
  box(scene, plaster, 7.2, 3.8, 0.16, 0, 1.87, -1.65);
  box(scene, warmPlaster, 0.16, 3.8, 8, 3.55, 1.87, 2.2);
  box(scene, plaster, 7.2, 0.12, 8, 0, 3.82, 2);
  // An actual window opening admits angled daylight onto the floor and bench.
  box(scene, plaster, 0.16, 1.08, 8, -3.55, 0.52, 2.2);
  box(scene, plaster, 0.16, 0.81, 8, -3.55, 3.41, 2.2);
  box(scene, plaster, 0.16, 1.86, 1.0, -3.55, 2.0, -1.05);
  box(scene, plaster, 0.16, 1.86, 4.0, -3.55, 2.0, 4.6);
  const windowFrame = new THREE.MeshStandardMaterial({ color: 0xe8e6dc, roughness: 0.56 });
  for (const z of [-0.51, 2.57]) box(scene, windowFrame, 0.19, 1.9, 0.065, -3.44, 2.01, z, 0.007);
  for (const y of [1.065, 2.955]) box(scene, windowFrame, 0.19, 0.065, 3.13, -3.44, y, 1.03, 0.007);
  box(scene, windowFrame, 0.19, 1.9, 0.05, -3.44, 2.01, 1.03);
  box(scene, windowFrame, 0.4, 0.07, 3.27, -3.36, 1.025, 1.03, 0.008);
  const outside = new THREE.MeshBasicMaterial({ color: 0xd6e0d0 });
  const windowBackdrop = box(scene, outside, 0.02, 3, 4.5, -4.6, 2, 0.8);
  windowBackdrop.castShadow = windowBackdrop.receiveShadow = false;
  sun.shadow.camera.left = sun.shadow.camera.bottom = -5;
  sun.shadow.camera.right = sun.shadow.camera.top = 5;

  const tape = new THREE.MeshStandardMaterial({ color: 0xeee9de, roughness: 1 });
  for (const x of [-2.15, 0.4, 2.8]) box(scene, tape, 0.06, 3.72, 0.006, x, 1.87, -1.562);
  box(scene, tape, 7.1, 0.055, 0.006, 0, 1.22, -1.557);
  const screw = new THREE.MeshStandardMaterial({ color: 0x92978c, metalness: 0.25, roughness: 0.8 });
  for (const x of [-2.12, 0.43, 2.83]) {
    for (let y = 0.25; y < 3.6; y += 0.43) {
      const fixing = new THREE.Mesh(new THREE.CircleGeometry(0.012, 8), screw);
      fixing.position.set(x, y, -1.55);
      scene.add(fixing);
    }
  }
  box(scene, wood, 7.0, 0.10, 0.035, 0, 0.015, -1.52, 0.006);
  box(scene, plywood, 1.32, 2.66, 0.06, -2.58, 1.36, -1.49, 0.01);
  for (const x of [-3.16, -2.59, -2.0]) box(scene, wood, 0.09, 2.76, 0.105, x, 1.38, -1.405, 0.009);

  // The electrical cabinet is fully closed. Only its enclosure, latch, hinges,
  // and protected conduit are visible; there are no open circuits or conductors.
  box(scene, dark, 1.27, 1.72, 0.045, 0.05, 1.99, -1.51, 0.025);
  box(scene, cabinet, 1.20, 1.66, 0.22, 0.05, 1.99, -1.36, 0.035);
  box(scene, cabinet, 1.115, 1.565, 0.035, 0.05, 1.99, -1.225, 0.023);
  box(scene, metal, 0.075, 0.19, 0.029, 0.49, 1.91, -1.191, 0.015);
  box(scene, dark, 0.018, 0.075, 0.005, 0.49, 1.91, -1.171, 0.005);
  for (const y of [1.50, 2.48]) cylinder(scene, metal, 0.024, 0.024, 0.16, -0.535, y, -1.26);
  box(scene, paper, 0.29, 0.105, 0.006, -0.21, 2.48, -1.201, 0.006);
  box(scene, line, 0.21, 0.01, 0.003, -0.21, 2.495, -1.196);
  box(scene, line, 0.14, 0.008, 0.003, -0.245, 2.466, -1.196);
  for (const x of [-0.25, 0.02, 0.29]) {
    tube(scene, metal, [[x, 2.83, -1.34], [x, 3.25, -1.34], [x + 0.07, 3.54, -1.35], [x + 0.40, 3.61, -1.36]], 0.025, 16);
    for (const y of [3.06, 3.40]) box(scene, metal, 0.075, 0.043, 0.06, x, y, -1.36, 0.01);
  }

  // A timber bench and prepared kit sit to the side of the closed panel.
  box(scene, wood, 2.4, 0.115, 0.92, 2.05, 0.94, -0.73, 0.02);
  for (const x of [1.03, 3.07]) {
    for (const z of [-1.09, -0.37]) box(scene, wood, 0.10, 0.89, 0.10, x, 0.435, z, 0.01);
  }
  box(scene, wood, 2.12, 0.12, 0.08, 2.05, 0.21, -0.4, 0.007);
  box(scene, plywood, 2.19, 0.055, 0.72, 2.05, 0.25, -0.73, 0.007);
  for (const x of [1.03, 3.07]) {
    const bolt = new THREE.Mesh(new THREE.CircleGeometry(0.013, 10), metal);
    bolt.position.set(x, 0.9, -0.259);
    scene.add(bolt);
  }

  const bag = new THREE.Group();
  bag.position.set(2.18, 1.003, -0.50);
  bag.rotation.y = -0.12;
  scene.add(bag);
  box(bag, fabric, 0.81, 0.43, 0.43, 0, 0.23, 0, 0.072);
  box(bag, dark, 0.78, 0.045, 0.42, 0, 0.035, 0, 0.02);
  box(bag, fabric, 0.70, 0.20, 0.075, 0, 0.22, 0.218, 0.022);
  for (const x of [-0.22, 0, 0.22]) box(bag, dark, 0.012, 0.16, 0.004, x, 0.21, 0.261);
  tube(bag, dark, [[-0.24, 0.4, 0.09], [-0.19, 0.66, 0.05], [0.19, 0.66, 0.05], [0.24, 0.4, 0.09]], 0.022, 24);
  tube(bag, dark, [[-0.24, 0.4, -0.10], [-0.17, 0.63, -0.08], [0.17, 0.63, -0.08], [0.24, 0.4, -0.10]], 0.019, 24);
  box(bag, metal, 0.56, 0.014, 0.018, 0, 0.437, 0.13, 0.005);
  box(bag, orange, 0.075, 0.22, 0.062, -0.25, 0.46, -0.045, 0.02).rotation.z = -0.18;
  box(bag, dark, 0.13, 0.19, 0.06, 0.23, 0.43, -0.07, 0.018).rotation.z = 0.12;

  const clipboard = new THREE.Group();
  clipboard.position.set(1.16, 1.33, -1.22);
  clipboard.rotation.set(-0.16, 0.07, -0.055);
  scene.add(clipboard);
  box(clipboard, wood, 0.44, 0.59, 0.018, 0, 0, 0, 0.016);
  box(clipboard, paper, 0.39, 0.52, 0.003, 0, -0.008, 0.012);
  box(clipboard, metal, 0.18, 0.065, 0.024, 0, 0.258, 0.026, 0.009);
  for (let i = 0; i < 6; i++) box(clipboard, line, i === 5 ? 0.17 : 0.29, 0.006, 0.002, i === 5 ? -0.06 : 0, 0.14 - i * 0.049, 0.015);
  for (let i = 0; i < 2; i++) {
    box(scene, i === 0 ? dark : orange, 0.46, 0.015, 0.34, 2.92, 1.014 + i * 0.09, -0.94, 0.009);
    box(scene, paper, 0.44, 0.065, 0.32, 2.92, 1.051 + i * 0.09, -0.94, 0.004);
    box(scene, i === 0 ? dark : orange, 0.46, 0.015, 0.34, 2.92, 1.09 + i * 0.09, -0.94, 0.009);
  }

  // Storage remains organized and the walking area is clear.
  box(scene, dark, 0.85, 0.30, 0.43, 1.45, 0.43, -0.72, 0.032);
  box(scene, metal, 0.26, 0.035, 0.025, 1.45, 0.46, -0.49, 0.01);
  const ladder = new THREE.Group();
  ladder.position.set(-2.31, 0.02, -0.58);
  ladder.rotation.set(-0.12, 0.11, 0.04);
  scene.add(ladder);
  for (const x of [-0.32, 0.32]) box(ladder, wood, 0.075, 1.84, 0.075, x, 0.92, 0, 0.015);
  for (const y of [0.25, 0.55, 0.85, 1.15, 1.45, 1.73]) box(ladder, wood, 0.62, 0.075, 0.105, 0, y, 0, 0.015);
  const expansionJoint = new THREE.MeshStandardMaterial({ color: 0xa4a396, roughness: 1 });
  for (const x of [-2, 0, 2]) box(scene, expansionJoint, 0.009, 0.002, 8, x, -0.038, 2);
  for (const z of [0.7, 2.7, 4.7]) box(scene, expansionJoint, 7.0, 0.002, 0.009, 0, -0.038, z);
  return scene;
}

/** Two quiet, first-person work environments; instructions stay in the DOM. */
export function initWorkEnvironments(canvas) {
  const inactive = { setEnvironment() {}, setMotion() {}, destroy() {} };
  if (!canvas?.getContext) return inactive;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'low-power' });
  } catch {
    canvas.dataset.environmentState = 'unavailable';
    return inactive;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;

  const scenes = { delivery: deliveryScene(), electrician: electricianScene() };
  let environment;
  function buildReflections() {
    const room = new RoomEnvironment();
    const generator = new THREE.PMREMGenerator(renderer);
    const next = generator.fromScene(room, 0.07);
    environment?.dispose();
    environment = next;
    for (const scene of Object.values(scenes)) {
      scene.environment = environment.texture;
      scene.environmentIntensity = 0.18;
    }
    room.dispose();
    generator.dispose();
  }
  buildReflections();
  const camera = new THREE.PerspectiveCamera(46, 1, 0.05, 60);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const basePosition = new THREE.Vector3();
  const target = new THREE.Vector3();
  let selected = 'delivery', motionEnabled = true, visible = true, mobile = false;
  let destroyed = false, contextLost = false, raf = 0, previousTime = 0, elapsed = 0;
  const canDraw = () => !destroyed && !contextLost && visible && !document.hidden;
  const canAnimate = () => motionEnabled && !reducedMotion.matches;

  function frameCamera() {
    if (selected === 'delivery') {
      basePosition.set(0.28, 1.7, mobile ? 6.7 : 7.3);
      target.set(0.28, 1.60, -0.35);
      camera.fov = mobile ? 57 : 43;
    } else {
      basePosition.set(0.13, 1.70, mobile ? 3.55 : 4.2);
      target.set(0.13, 1.66, -1.4);
      camera.fov = mobile ? 56 : 46;
    }
    camera.updateProjectionMatrix();
  }

  function frame(time) {
    raf = 0;
    if (!canDraw()) return;
    const dt = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 1 / 60;
    previousTime = time;
    if (canAnimate()) elapsed += dt;
    const breath = reducedMotion.matches ? 0 : Math.sin(elapsed * 0.64) * 0.004;
    camera.position.copy(basePosition);
    camera.position.y += breath;
    camera.lookAt(target);
    renderer.render(scenes[selected], camera);
    canvas.dataset.environmentState = 'ready';
    // Static first-person environments deliberately rest between interactions.
    // No ambient camera movement or repeated draw loop competes with the task card.
  }

  function start() {
    if (raf || !canDraw()) return;
    previousTime = 0;
    raf = requestAnimationFrame(frame);
  }
  function stop() { cancelAnimationFrame(raf); raf = 0; previousTime = 0; }
  function resize() {
    if (destroyed || contextLost) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    camera.aspect = rect.width / rect.height;
    mobile = camera.aspect < 1.2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(rect.width, rect.height, false);
    frameCamera();
    renderer.shadowMap.needsUpdate = true;
    start();
  }
  function visibilityChange() { if (canDraw()) start(); else stop(); }
  function motionChange() { stop(); start(); }
  function lost(event) {
    event.preventDefault();
    contextLost = true;
    canvas.dataset.environmentState = 'unavailable';
    stop();
  }
  function restored() {
    if (destroyed) return;
    contextLost = false;
    buildReflections();
    resize();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    visibilityChange();
  }, { rootMargin: '60px' });
  intersectionObserver.observe(canvas);
  document.addEventListener('visibilitychange', visibilityChange);
  reducedMotion.addEventListener('change', motionChange);
  canvas.addEventListener('webglcontextlost', lost);
  canvas.addEventListener('webglcontextrestored', restored);
  frameCamera();
  resize();

  return {
    setEnvironment(next) {
      if (destroyed || !Object.hasOwn(scenes, next)) return;
      selected = next;
      frameCamera();
      renderer.shadowMap.needsUpdate = true;
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
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', visibilityChange);
      reducedMotion.removeEventListener('change', motionChange);
      canvas.removeEventListener('webglcontextlost', lost);
      canvas.removeEventListener('webglcontextrestored', restored);
      const geometries = new Set(), materials = new Set(), textures = new Set();
      for (const scene of Object.values(scenes)) {
        scene.traverse(object => {
          if (object.geometry) geometries.add(object.geometry);
          if (object.material) [object.material].flat().forEach(material => materials.add(material));
          object.shadow?.map?.dispose();
        });
      }
      for (const material of materials) {
        for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
        material.dispose();
      }
      geometries.forEach(geometry => geometry.dispose());
      textures.forEach(texture => texture.dispose());
      environment?.dispose();
      renderer.dispose();
      delete canvas.dataset.environmentState;
    },
  };
}
