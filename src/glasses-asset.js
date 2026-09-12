/**
 * Unbranded black smart eyewear concept, informed by the current Wayfarer
 * silhouette. Front +Z, temples -Z. Procedural geometry; no texture downloads.
 * Visual reference: https://www.ray-ban.com/usa/electronics/RW4012ray-ban%2Bmeta%2Bwayfarer%2B-%2Bgen%2B2-black/8056262721308
 */
export function createGlasses(THREE) {
  const glasses = new THREE.Group();
  glasses.name = 'black-wayfarer-glasses';

  const materials = {
    frame: new THREE.MeshPhysicalMaterial({
      color: 0x040506, metalness: 0.015, roughness: 0.34,
      clearcoat: 0.48, clearcoatRoughness: 0.23, envMapIntensity: 0.55,
    }),
    lens: new THREE.MeshPhysicalMaterial({
      color: 0x13251b, metalness: 0.025, roughness: 0.17,
      transparent: true, opacity: 0.94, depthWrite: false,
      clearcoat: 0.35, clearcoatRoughness: 0.13,
      reflectivity: 0.24, envMapIntensity: 0.35, side: THREE.DoubleSide,
    }),
    satin: new THREE.MeshPhysicalMaterial({
      color: 0x101212, metalness: 0.015, roughness: 0.35,
      clearcoat: 0.4, clearcoatRoughness: 0.3,
    }),
    metal: new THREE.MeshStandardMaterial({
      color: 0xa9b0ad, metalness: 0.91, roughness: 0.24,
      envMapIntensity: 0.8,
    }),
    darkMetal: new THREE.MeshStandardMaterial({
      color: 0x282e2c, metalness: 0.68, roughness: 0.27,
    }),
    optical: new THREE.MeshPhysicalMaterial({
      color: 0x091418, metalness: 0.22, roughness: 0.075,
      clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 0.75,
      iridescence: 0.22, iridescenceIOR: 1.3,
      iridescenceThicknessRange: [150, 260],
    }),
    inset: new THREE.MeshStandardMaterial({
      color: 0x030505, metalness: 0.05, roughness: 0.5,
    }),
  };

  function mesh(geometry, material, name, parent = glasses) {
    const object = new THREE.Mesh(geometry, material);
    object.name = name;
    object.castShadow = material !== materials.lens;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }

  // A gentle wrap makes the front feel molded, including in the reveal's
  // three-quarter view. Positive Y is very slightly forward of the lower rim.
  const faceZ = (x, y = 0) => -0.018 * Math.pow(Math.max(0, Math.abs(x) - 0.4), 2) + 0.028 * y;

  function outerContour(path) {
    path.moveTo(0.43, 0.61);
    path.bezierCurveTo(0.44, 0.84, 0.59, 0.97, 0.89, 1.015);
    path.bezierCurveTo(1.58, 1.10, 2.52, 1.065, 3.12, 0.975);
    path.bezierCurveTo(3.39, 0.935, 3.49, 0.83, 3.435, 0.585);
    path.bezierCurveTo(3.34, 0.18, 3.245, -0.415, 3.04, -0.725);
    path.bezierCurveTo(2.88, -0.96, 2.63, -1.03, 2.20, -1.025);
    path.bezierCurveTo(1.74, -1.02, 1.27, -0.995, 1.055, -0.91);
    path.bezierCurveTo(0.82, -0.82, 0.704, -0.66, 0.634, -0.37);
    path.bezierCurveTo(0.555, -0.035, 0.441, 0.38, 0.43, 0.61);
    path.closePath();
    return path;
  }

  // The top edge is wider than the bottom. Compound curves soften every
  // corner without turning the lenses into rectangles or simple ovals.
  function lensContour(path) {
    path.moveTo(0.69, 0.565);
    path.bezierCurveTo(0.69, 0.74, 0.795, 0.80, 1.00, 0.824);
    path.bezierCurveTo(1.63, 0.895, 2.485, 0.861, 2.955, 0.786);
    path.bezierCurveTo(3.115, 0.76, 3.183, 0.672, 3.145, 0.514);
    path.bezierCurveTo(3.058, 0.119, 2.977, -0.365, 2.807, -0.638);
    path.bezierCurveTo(2.676, -0.837, 2.473, -0.873, 2.177, -0.873);
    path.bezierCurveTo(1.714, -0.87, 1.357, -0.845, 1.166, -0.771);
    path.bezierCurveTo(0.998, -0.704, 0.895, -0.57, 0.845, -0.34);
    path.bezierCurveTo(0.779, -0.057, 0.699, 0.33, 0.69, 0.565);
    path.closePath();
    return path;
  }

  function moldedFront(shape, depth, bevelSize, curveSegments = 18) {
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth, steps: 1, curveSegments,
      bevelEnabled: true, bevelThickness: bevelSize,
      bevelSize, bevelSegments: 3,
    });
    const position = geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i), y = position.getY(i);
      position.setZ(i, position.getZ(i) - depth / 2 + faceZ(x, y));
    }
    // ExtrudeGeometry's bevel normals retain distinct polished front faces.
    geometry.computeVertexNormals();
    return geometry;
  }

  const rightFront = new THREE.Group();
  rightFront.name = 'right-front';
  glasses.add(rightFront);
  const rimShape = outerContour(new THREE.Shape());
  rimShape.holes.push(lensContour(new THREE.Path()));
  const rightRim = mesh(moldedFront(rimShape, 0.185, 0.035), materials.frame, 'right-rim', rightFront);

  // One indexed, slightly convex optical surface per lens: no transmission
  // render pass, no stacked transparent shells, and no baked-in reflections.
  function lensGeometry() {
    const contour = lensContour(new THREE.Shape()).getSpacedPoints(96).slice(0, -1);
    const center = new THREE.Vector2(1.91, -0.025);
    const positions = [center.x, center.y, faceZ(center.x, center.y) + 0.1];
    const indices = [];
    const segments = contour.length, rings = 6;
    for (let r = 1; r <= rings; r++) {
      const radius = r / rings;
      for (let j = 0; j < segments; j++) {
        const x = center.x + (contour[j].x - center.x) * radius;
        const y = center.y + (contour[j].y - center.y) * radius;
        positions.push(x, y, faceZ(x, y) + 0.027 + 0.073 * (1 - radius * radius));
      }
    }
    for (let j = 0; j < segments; j++) indices.push(0, 1 + (j + 1) % segments, 1 + j);
    for (let r = 0; r < rings - 1; r++) {
      const row = 1 + r * segments, nextRow = row + segments;
      for (let j = 0; j < segments; j++) {
        const n = (j + 1) % segments;
        indices.push(row + j, nextRow + n, nextRow + j, row + j, row + n, nextRow + n);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }
  const rightLens = mesh(lensGeometry(), materials.lens, 'right-lens', rightFront);
  rightLens.renderOrder = 2;

  function frontDisc(radius, material, name, x, y, z, parent) {
    const object = mesh(new THREE.CircleGeometry(radius, 32), material, name, parent);
    object.position.set(x, y, z);
    return object;
  }

  // A flush lens in each upper outside corner is legible at product scale.
  // Dark hardware and a fine lip keep these from becoming camera barrels.
  const opticX = 3.285, opticY = 0.745;
  const opticZ = faceZ(opticX, opticY) + 0.133;
  frontDisc(0.078, materials.inset, 'camera-recess', opticX, opticY, opticZ, rightFront);
  const cameraLip = mesh(new THREE.TorusGeometry(0.062, 0.007, 6, 32), materials.darkMetal, 'camera-lip', rightFront);
  cameraLip.position.set(opticX, opticY, opticZ + 0.004);
  frontDisc(0.053, materials.optical, 'inset-camera', opticX, opticY, opticZ + 0.007, rightFront);
  frontDisc(0.024, materials.inset, 'camera-pupil', opticX, opticY, opticZ + 0.009, rightFront);

  const leftFront = rightFront.clone(true);
  leftFront.name = 'left-front';
  leftFront.scale.x = -1;
  glasses.add(leftFront);
  const leftLens = leftFront.getObjectByName('right-lens');
  leftLens.name = 'left-lens';
  leftFront.getObjectByName('right-rim').name = 'left-rim';
  const leftSensor = leftFront.getObjectByName('inset-camera');
  leftSensor.name = 'inset-sensor';
  leftSensor.material = materials.satin;
  leftFront.remove(leftFront.getObjectByName('camera-pupil'));

  const bridgeShape = new THREE.Shape();
  bridgeShape.moveTo(-0.59, 0.744);
  bridgeShape.bezierCurveTo(-0.325, 0.843, 0.325, 0.843, 0.59, 0.744);
  bridgeShape.lineTo(0.602, 0.497);
  bridgeShape.bezierCurveTo(0.32, 0.664, -0.32, 0.664, -0.602, 0.497);
  bridgeShape.closePath();
  const bridge = mesh(moldedFront(bridgeShape, 0.18, 0.031, 22), materials.frame, 'sculpted-bridge');

  // Nose contact surfaces are integrated into the back of the acetate.
  for (const side of [-1, 1]) {
    const nose = mesh(new THREE.SphereGeometry(1, 20, 12), materials.satin, `nose-support-${side}`);
    nose.position.set(side * 0.625, 0.035, -0.128);
    nose.scale.set(0.105, 0.24, 0.14);
    nose.rotation.z = side * 0.22;
  }

  // Continuous rounded-rectangle cross-sections produce a sculpted arm with
  // a discreet electronics volume that tapers naturally around the ear.
  function sweptArm(curve, width, height, lengthSteps = 56) {
    const radialSteps = 12, positions = [], indices = [];
    const up = new THREE.Vector3(0, 1, 0);
    const horizontal = new THREE.Vector3(), vertical = new THREE.Vector3();
    for (let i = 0; i <= lengthSteps; i++) {
      const t = i / lengthSteps, point = curve.getPoint(t), tangent = curve.getTangent(t).normalize();
      horizontal.crossVectors(tangent, up).normalize();
      vertical.crossVectors(horizontal, tangent).normalize();
      for (let j = 0; j < radialSteps; j++) {
        const angle = j * Math.PI * 2 / radialSteps, cos = Math.cos(angle), sin = Math.sin(angle);
        const x = Math.sign(cos) * Math.pow(Math.abs(cos), 0.58) * width(t);
        const y = Math.sign(sin) * Math.pow(Math.abs(sin), 0.58) * height(t);
        positions.push(point.x + horizontal.x * x + vertical.x * y,
          point.y + horizontal.y * x + vertical.y * y,
          point.z + horizontal.z * x + vertical.z * y);
      }
    }
    for (let i = 0; i < lengthSteps; i++) {
      for (let j = 0; j < radialSteps; j++) {
        const n = (j + 1) % radialSteps, a = i * radialSteps + j, b = (i + 1) * radialSteps + j;
        const c = (i + 1) * radialSteps + n, d = i * radialSteps + n;
        indices.push(a, b, d, b, c, d);
      }
    }
    for (const end of [0, lengthSteps]) {
      const p = curve.getPoint(end / lengthSteps), center = positions.length / 3;
      positions.push(p.x, p.y, p.z);
      for (let j = 0; j < radialSteps; j++) {
        const a = end * radialSteps + j, b = end * radialSteps + (j + 1) % radialSteps;
        if (end === 0) indices.push(center, a, b);
        else indices.push(center, b, a);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  const rightTemple = new THREE.Group();
  rightTemple.name = 'right-temple';
  glasses.add(rightTemple);
  const armCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(3.32, 0.70, -0.155),
    new THREE.Vector3(3.405, 0.70, -0.38),
    new THREE.Vector3(3.425, 0.65, -1.05),
    new THREE.Vector3(3.37, 0.585, -1.92),
    new THREE.Vector3(3.265, 0.49, -2.52),
    new THREE.Vector3(3.09, 0.22, -3.08),
    new THREE.Vector3(2.98, -0.125, -3.45),
  ], false, 'centripetal');
  const armWidth = t => 0.112 - 0.041 * t;
  const armHeight = t => 0.19 - 0.135 * THREE.MathUtils.smoothstep(t, 0.30, 1);
  mesh(sweptArm(armCurve, armWidth, armHeight), materials.frame, 'sculpted-temple', rightTemple);

  // Small silver hinge tabs echo the understated side hardware of eyewear.
  const hingeTabShape = new THREE.Shape();
  hingeTabShape.moveTo(-0.13, -0.023);
  hingeTabShape.quadraticCurveTo(-0.15, 0, -0.13, 0.023);
  hingeTabShape.lineTo(0.125, 0.023);
  hingeTabShape.quadraticCurveTo(0.148, 0, 0.125, -0.023);
  hingeTabShape.closePath();
  const hingeTab = mesh(new THREE.ExtrudeGeometry(hingeTabShape, {
    depth: 0.009, steps: 1, curveSegments: 6,
    bevelEnabled: true, bevelSize: 0.007, bevelThickness: 0.006, bevelSegments: 2,
  }), materials.metal, 'silver-hinge-tab', rightTemple);
  hingeTab.rotation.y = Math.PI / 2;
  hingeTab.position.set(3.519, 0.717, -0.53);

  const hinge = mesh(new THREE.CylinderGeometry(0.054, 0.054, 0.225, 20), materials.darkMetal, 'hinge-barrel', rightTemple);
  hinge.position.set(3.323, 0.683, -0.228);
  for (const y of [0.571, 0.795]) {
    const screw = mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.008, 16), materials.metal, 'hinge-pin', rightTemple);
    screw.position.set(3.323, y, -0.228);
  }

  // Restrained inset microphone and three tiny speaker ports, visible only
  // when the cinematic camera reveals the side of the frame.
  const microphone = mesh(new THREE.CircleGeometry(0.013, 12), materials.inset, 'microphone', rightTemple);
  const microphoneT = 0.25;
  const microphoneNormal = new THREE.Vector3().crossVectors(armCurve.getTangent(microphoneT), new THREE.Vector3(0, 1, 0)).normalize();
  microphone.position.copy(armCurve.getPoint(microphoneT)).addScaledVector(microphoneNormal, armWidth(microphoneT) + 0.001);
  microphone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), microphoneNormal);
  for (let i = 0; i < 3; i++) {
    const port = mesh(new THREE.CircleGeometry(0.014, 12), materials.inset, 'speaker-port', rightTemple);
    const t = 0.44 + i * 0.015;
    const tangent = armCurve.getTangent(t).normalize();
    const horizontal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
    const down = new THREE.Vector3().crossVectors(horizontal, tangent).normalize().negate();
    port.position.copy(armCurve.getPoint(t)).addScaledVector(down, armHeight(t) + 0.001);
    port.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), down);
  }

  const leftTemple = rightTemple.clone(true);
  leftTemple.name = 'left-temple';
  leftTemple.scale.x = -1;
  glasses.add(leftTemple);

  const parts = {
    rightFront, leftFront, rightLens, leftLens, rightRim,
    leftRim: leftFront.getObjectByName('left-rim'), rightTemple, leftTemple, bridge,
  };
  glasses.userData.parts = parts;
  glasses.userData.materials = materials;
  glasses.userData.frontDirection = '+Z';
  const box = new THREE.Box3().setFromObject(glasses);
  const size = box.getSize(new THREE.Vector3());
  glasses.userData.dimensions = { width: size.x, height: size.y, depth: size.z };
  glasses.materials = materials;
  glasses.parts = parts;
  return glasses;
}

export default createGlasses;
