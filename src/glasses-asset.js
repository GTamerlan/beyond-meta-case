/**
 * Procedural, unbranded smart sunglasses. All dimensions are in arbitrary units.
 * Front faces +Z; temples extend toward -Z. No textures or external assets.
 * Parts and materials are exposed in group.userData for presentation animation.
 */
export function createGlasses(THREE) {
  const glasses = new THREE.Group();
  glasses.name = 'smart-sunglasses';

  const materials = {
    frame: new THREE.MeshPhysicalMaterial({
      color: 0x101318, metalness: 0.24, roughness: 0.24,
      clearcoat: 1, clearcoatRoughness: 0.18, envMapIntensity: 1.25,
    }),
    satin: new THREE.MeshPhysicalMaterial({
      color: 0x171b21, metalness: 0.18, roughness: 0.33,
      clearcoat: 0.55, clearcoatRoughness: 0.28,
    }),
    rubber: new THREE.MeshStandardMaterial({
      color: 0x080b0f, roughness: 0.46, metalness: 0.08,
    }),
    lens: new THREE.MeshPhysicalMaterial({
      color: 0x263f52, metalness: 0.32, roughness: 0.16,
      transparent: true, opacity: 0.85, depthWrite: false,
      clearcoat: 1, clearcoatRoughness: 0.12,
      reflectivity: 0.92, envMapIntensity: 1.35,
      side: THREE.DoubleSide,
    }),
    metal: new THREE.MeshStandardMaterial({
      color: 0xa7b1ba, metalness: 0.88, roughness: 0.23,
    }),
    darkMetal: new THREE.MeshStandardMaterial({
      color: 0x3b4650, metalness: 0.8, roughness: 0.26,
    }),
    camera: new THREE.MeshPhysicalMaterial({
      color: 0x07141b, metalness: 0.43, roughness: 0.11,
      clearcoat: 1, clearcoatRoughness: 0.08,
    }),
    iris: new THREE.MeshPhysicalMaterial({
      color: 0x203d58, metalness: 0.45, roughness: 0.13,
      iridescence: 1, iridescenceIOR: 1.32,
      iridescenceThicknessRange: [180, 360], clearcoat: 1,
    }),
    glint: new THREE.MeshBasicMaterial({
      color: 0xb9e5fa, transparent: true, opacity: 0.62,
    }),
    indicator: new THREE.MeshBasicMaterial({ color: 0xb9e3d2 }),
  };

  function mesh(geometry, material, name, parent = glasses) {
    const object = new THREE.Mesh(geometry, material);
    object.name = name;
    object.castShadow = material !== materials.lens;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }

  // A flatter brow and a tapered, soft-square lower rim give the frame its
  // wayfarer silhouette. Coordinates describe the right half of the front.
  function outerContour(path) {
    path.moveTo(0.36, 0.69);
    path.bezierCurveTo(0.37, 0.95, 0.52, 1.06, 0.86, 1.07);
    path.bezierCurveTo(1.51, 1.10, 2.56, 1.07, 3.03, 1.00);
    path.bezierCurveTo(3.32, 0.97, 3.44, 0.86, 3.39, 0.58);
    path.bezierCurveTo(3.33, 0.13, 3.20, -0.51, 3.02, -0.79);
    path.bezierCurveTo(2.88, -1.00, 2.64, -1.04, 2.28, -1.04);
    path.lineTo(1.09, -1.00);
    path.bezierCurveTo(0.80, -0.98, 0.65, -0.85, 0.58, -0.56);
    path.bezierCurveTo(0.51, -0.23, 0.37, 0.40, 0.36, 0.69);
    path.closePath();
    return path;
  }

  function lensContour(path) {
    path.moveTo(0.67, 0.61);
    path.bezierCurveTo(0.66, 0.77, 0.77, 0.82, 0.96, 0.83);
    path.bezierCurveTo(1.65, 0.86, 2.39, 0.83, 2.82, 0.78);
    path.bezierCurveTo(3.02, 0.76, 3.11, 0.68, 3.07, 0.50);
    path.bezierCurveTo(3.00, 0.09, 2.92, -0.39, 2.78, -0.60);
    path.bezierCurveTo(2.68, -0.75, 2.51, -0.77, 2.25, -0.77);
    path.lineTo(1.17, -0.73);
    path.bezierCurveTo(0.98, -0.72, 0.88, -0.64, 0.83, -0.44);
    path.bezierCurveTo(0.77, -0.14, 0.68, 0.37, 0.67, 0.61);
    path.closePath();
    return path;
  }

  const rightFront = new THREE.Group();
  rightFront.name = 'right-front';
  glasses.add(rightFront);
  const rimShape = outerContour(new THREE.Shape());
  rimShape.holes.push(lensContour(new THREE.Path()));
  const rimGeometry = new THREE.ExtrudeGeometry(rimShape, {
    depth: 0.265, steps: 1, curveSegments: 20,
    bevelEnabled: true, bevelThickness: 0.05,
    bevelSize: 0.047, bevelSegments: 4,
  });
  const rightRim = mesh(rimGeometry, materials.frame, 'right-rim', rightFront);
  rightRim.position.z = -0.115;

  // The glass has a subtle convex face. Its opaque tint and clearcoat work
  // with a studio environment without relying on costly scene transmission.
  const lensGeometry = new THREE.ExtrudeGeometry(lensContour(new THREE.Shape()), {
    depth: 0.036, steps: 1, curveSegments: 24,
    bevelEnabled: true, bevelThickness: 0.013,
    bevelSize: 0.014, bevelSegments: 3,
  });
  const lensPosition = lensGeometry.attributes.position;
  for (let i = 0; i < lensPosition.count; i++) {
    const x = (lensPosition.getX(i) - 1.84) / 1.29;
    const y = (lensPosition.getY(i) - 0.045) / 0.84;
    const bow = 0.055 * Math.max(0, 1 - x * x) * Math.max(0, 1 - y * y);
    lensPosition.setZ(i, lensPosition.getZ(i) + bow);
  }
  lensGeometry.computeVertexNormals();
  const rightLens = mesh(lensGeometry, materials.lens, 'right-lens', rightFront);
  rightLens.position.z = 0.06;
  rightLens.renderOrder = 2;

  function frontCylinder(radius, depth, material, name, x, y, z, parent) {
    const object = mesh(new THREE.CylinderGeometry(radius, radius, depth, 32), material, name, parent);
    object.rotation.x = Math.PI / 2;
    object.position.set(x, y, z);
    return object;
  }

  function cameraModule(parent, x, y) {
    const camera = new THREE.Group();
    camera.name = 'optical-camera';
    parent.add(camera);
    frontCylinder(0.135, 0.035, materials.rubber, 'camera-recess', x, y, 0.2, camera);
    frontCylinder(0.112, 0.031, materials.darkMetal, 'camera-barrel', x, y, 0.225, camera);
    const ring = mesh(new THREE.TorusGeometry(0.096, 0.010, 8, 40), materials.metal, 'camera-ring', camera);
    ring.position.set(x, y, 0.245);
    frontCylinder(0.086, 0.011, materials.camera, 'camera-glass', x, y, 0.248, camera);
    frontCylinder(0.057, 0.006, materials.iris, 'camera-iris', x, y, 0.257, camera);
    frontCylinder(0.027, 0.007, materials.camera, 'camera-pupil', x, y, 0.263, camera);
    const glint = mesh(new THREE.SphereGeometry(0.014, 12, 8), materials.glint, 'camera-glint', camera);
    glint.scale.set(1.25, 0.55, 0.18);
    glint.position.set(x - 0.025, y + 0.034, 0.271);
    return camera;
  }

  cameraModule(rightFront, 3.20, 0.73);

  // Subtle brow pins are separate geometry, so reflections remain crisp.
  for (const x of [2.77, 2.89]) {
    frontCylinder(0.022, 0.012, materials.metal, 'brow-pin', x, 0.92, 0.201, rightFront);
  }
  const leftFront = rightFront.clone(true);
  leftFront.name = 'left-front';
  leftFront.scale.x = -1;
  glasses.add(leftFront);
  const leftLens = leftFront.getObjectByName('right-lens');
  leftLens.name = 'left-lens';
  leftFront.getObjectByName('right-rim').name = 'left-rim';

  // A continuous sculpted bridge leaves the natural inverted-U nose opening.
  const bridgeShape = new THREE.Shape();
  bridgeShape.moveTo(-0.59, 0.77);
  bridgeShape.bezierCurveTo(-0.29, 0.93, 0.29, 0.93, 0.59, 0.77);
  bridgeShape.lineTo(0.58, 0.46);
  bridgeShape.bezierCurveTo(0.26, 0.66, -0.26, 0.66, -0.58, 0.46);
  bridgeShape.closePath();
  const bridge = mesh(new THREE.ExtrudeGeometry(bridgeShape, {
    depth: 0.245, steps: 1, curveSegments: 24,
    bevelEnabled: true, bevelThickness: 0.055,
    bevelSize: 0.049, bevelSegments: 4,
  }), materials.frame, 'bridge');
  bridge.position.z = -0.11;

  // Integrated rear nose supports are soft ellipsoids, tucked behind the rim.
  for (const side of [-1, 1]) {
    const nose = mesh(new THREE.SphereGeometry(1, 24, 16), materials.satin, `nose-support-${side}`);
    nose.position.set(side * 0.56, -0.01, -0.19);
    nose.scale.set(0.115, 0.32, 0.18);
    nose.rotation.z = side * 0.2;
  }

  const rightTemple = new THREE.Group();
  rightTemple.name = 'right-temple';
  glasses.add(rightTemple);

  // Model the entire arm as a bevelled side silhouette, then bend it inward
  // toward the ear. The electronics housing transitions into a slender tip.
  const armShape = new THREE.Shape();
  armShape.moveTo(0.025, 0.82);
  armShape.bezierCurveTo(0.20, 0.93, 0.56, 0.90, 0.96, 0.86);
  armShape.bezierCurveTo(1.49, 0.82, 1.89, 0.72, 2.19, 0.62);
  armShape.bezierCurveTo(2.48, 0.53, 2.76, 0.51, 2.98, 0.36);
  armShape.bezierCurveTo(3.24, 0.17, 3.43, -0.09, 3.52, -0.33);
  armShape.bezierCurveTo(3.57, -0.47, 3.48, -0.56, 3.39, -0.47);
  armShape.bezierCurveTo(3.16, -0.19, 3.02, 0.01, 2.82, 0.09);
  armShape.bezierCurveTo(2.57, 0.20, 2.38, 0.20, 2.15, 0.19);
  armShape.bezierCurveTo(1.61, 0.17, 1.15, 0.22, 0.71, 0.27);
  armShape.bezierCurveTo(0.35, 0.30, 0.11, 0.35, 0.025, 0.43);
  armShape.closePath();

  function inwardBend(distance) {
    return -0.092 * Math.pow(Math.max(0, distance - 1.23), 2);
  }

  function armGeometry(shape, depth, bevelSize = 0.045) {
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth, steps: 1, curveSegments: 20,
      bevelEnabled: true, bevelThickness: bevelSize,
      bevelSize, bevelSegments: 4,
    });
    const position = geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      const distance = position.getX(i);
      const y = position.getY(i);
      const thickness = position.getZ(i);
      position.setXYZ(i, 3.19 + thickness + inwardBend(distance), y, -distance - 0.07);
    }
    geometry.computeVertexNormals();
    return geometry;
  }
  const arm = mesh(armGeometry(armShape, 0.27, 0.058), materials.frame, 'sculpted-arm', rightTemple);

  // A flush control surface sits on the broad outer housing, with a fine seam.
  const panelShape = new THREE.Shape();
  panelShape.moveTo(0.61, 0.73);
  panelShape.bezierCurveTo(0.75, 0.78, 1.25, 0.73, 1.64, 0.64);
  panelShape.bezierCurveTo(1.77, 0.61, 1.78, 0.40, 1.62, 0.36);
  panelShape.bezierCurveTo(1.18, 0.34, 0.82, 0.37, 0.63, 0.41);
  panelShape.bezierCurveTo(0.54, 0.44, 0.53, 0.69, 0.61, 0.73);
  panelShape.closePath();
  const control = mesh(armGeometry(panelShape, 0.008, 0.017), materials.satin, 'touch-panel', rightTemple);
  control.position.x = 0.274;

  // Cylinders are oriented along X on the temple's external side.
  function sideCylinder(radius, depth, material, name, distance, y, parent, outer = 3.492) {
    const object = mesh(new THREE.CylinderGeometry(radius, radius, depth, 24), material, name, parent);
    object.rotation.z = Math.PI / 2;
    object.position.set(outer + inwardBend(distance), y, -distance - 0.07);
    return object;
  }
  sideCylinder(0.085, 0.021, materials.darkMetal, 'hinge-seat', 0.25, 0.64, rightTemple);
  sideCylinder(0.052, 0.025, materials.metal, 'hinge-screw', 0.25, 0.64, rightTemple);
  const screwSlot = mesh(new THREE.BoxGeometry(0.006, 0.011, 0.059), materials.rubber, 'hinge-screw-slot', rightTemple);
  screwSlot.position.set(3.507, 0.64, -0.32);
  screwSlot.rotation.x = -0.45;

  // The hinge is visible from above and from the interior of the frame.
  const hinge = mesh(new THREE.CylinderGeometry(0.091, 0.091, 0.38, 24), materials.darkMetal, 'hinge-barrel', rightTemple);
  hinge.position.set(3.24, 0.60, -0.17);
  for (const y of [0.44, 0.60, 0.76]) {
    const knuckle = mesh(new THREE.TorusGeometry(0.092, 0.009, 6, 24), materials.metal, 'hinge-knuckle', rightTemple);
    knuckle.rotation.x = Math.PI / 2;
    knuckle.position.set(3.24, y, -0.17);
  }

  // Tiny speaker apertures on the underside and a microphone on the side.
  for (let i = 0; i < 5; i++) {
    const d = 1.88 + i * 0.078;
    sideCylinder(0.018, 0.008, materials.rubber, 'speaker-port', d, 0.305, rightTemple, 3.484);
  }
  sideCylinder(0.025, 0.009, materials.rubber, 'microphone-port', 0.47, 0.58, rightTemple, 3.488);

  const leftTemple = rightTemple.clone(true);
  leftTemple.name = 'left-temple';
  leftTemple.scale.x = -1;
  glasses.add(leftTemple);

  // One understated status indicator; the other camera remains symmetrical.
  frontCylinder(0.012, 0.009, materials.indicator, 'status-light', -3.13, 0.46, 0.205, glasses);

  glasses.userData.parts = {
    rightFront, leftFront, rightLens, leftLens,
    rightTemple, leftTemple, bridge,
  };
  glasses.userData.materials = materials;
  glasses.userData.frontDirection = '+Z';
  glasses.userData.dimensions = { width: 7.04, height: 2.21, depth: 3.99 };
  return glasses;
}

export default createGlasses;
