/**
 * Slim titanium AR eyewear concept. The geometry is a visual design, not a
 * representation of a validated optical or electronics package.
 * Front +Z, temples -Z, overall front width approximately 7 units.
 */
export function createGlasses(THREE) {
  const glasses = new THREE.Group();
  glasses.name = 'slim-titanium-glasses';

  const materials = {
    frame: new THREE.MeshPhysicalMaterial({
      color: 0x81949e, metalness: 0.92, roughness: 0.22,
      clearcoat: 0.3, clearcoatRoughness: 0.18, envMapIntensity: 1.4,
    }),
    lens: new THREE.MeshPhysicalMaterial({
      color: 0xbadce8, metalness: 0.02, roughness: 0.075,
      transparent: true, opacity: 0.17, depthWrite: false,
      clearcoat: 1, clearcoatRoughness: 0.06,
      reflectivity: 0.35, envMapIntensity: 0.62,
      iridescence: 0.09, iridescenceIOR: 1.3,
      iridescenceThicknessRange: [140, 230], side: THREE.DoubleSide,
    }),
    polished: new THREE.MeshStandardMaterial({
      color: 0xc0ccd0, metalness: 0.97, roughness: 0.17,
      envMapIntensity: 1.15,
    }),
    satin: new THREE.MeshStandardMaterial({
      color: 0x45525b, metalness: 0.7, roughness: 0.29,
    }),
    tips: new THREE.MeshPhysicalMaterial({
      color: 0x48545b, metalness: 0.12, roughness: 0.36,
      clearcoat: 0.3, clearcoatRoughness: 0.28,
    }),
    pads: new THREE.MeshPhysicalMaterial({
      color: 0xc5d6dc, metalness: 0, roughness: 0.22,
      transparent: true, opacity: 0.45, depthWrite: false,
      clearcoat: 0.5, side: THREE.DoubleSide,
    }),
    optical: new THREE.MeshPhysicalMaterial({
      color: 0x162a36, metalness: 0.35, roughness: 0.1,
      clearcoat: 1, iridescence: 0.65,
      iridescenceThicknessRange: [170, 280],
    }),
  };

  function mesh(geometry, material, name, parent = glasses) {
    const object = new THREE.Mesh(geometry, material);
    object.name = name;
    object.castShadow = !material.transparent;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }

  // The frame gently wraps away from the face at the outer corners.
  const faceZ = x => -0.019 * Math.pow(Math.max(0, Math.abs(x) - 0.35), 2);
  const vector = (x, y, z = faceZ(x)) => new THREE.Vector3(x, y, z);

  function lensShape() {
    const shape = new THREE.Shape();
    shape.moveTo(0.76, 0.86);
    shape.bezierCurveTo(0.49, 0.86, 0.36, 0.72, 0.36, 0.47);
    shape.lineTo(0.37, -0.47);
    shape.bezierCurveTo(0.37, -0.73, 0.52, -0.87, 0.80, -0.88);
    shape.bezierCurveTo(1.39, -0.90, 2.21, -0.90, 2.77, -0.87);
    shape.bezierCurveTo(3.07, -0.85, 3.25, -0.71, 3.27, -0.43);
    shape.lineTo(3.30, 0.45);
    shape.bezierCurveTo(3.31, 0.72, 3.15, 0.87, 2.87, 0.88);
    shape.bezierCurveTo(2.24, 0.90, 1.40, 0.89, 0.76, 0.86);
    shape.closePath();
    return shape;
  }

  const shape = lensShape();
  const contour = shape.getSpacedPoints(160).slice(0, -1);
  const rimCurve = new THREE.CatmullRomCurve3(
    contour.map(point => vector(point.x, point.y)), true, 'centripetal',
  );

  // Precision wire rims are dramatically slimmer than an acetate silhouette.
  const rightFront = new THREE.Group();
  rightFront.name = 'right-front';
  glasses.add(rightFront);
  const rightRim = mesh(
    new THREE.TubeGeometry(rimCurve, 160, 0.032, 10, true),
    materials.frame, 'right-rim', rightFront,
  );

  // A smooth indexed lens surface has a very small optical bow and no expensive
  // transmission pass. Its transparent pale tint lets the fine rear arms show.
  function createLensGeometry() {
    const center = new THREE.Vector2(1.82, 0.0);
    const vertices = [center.x, center.y, faceZ(center.x) + 0.033];
    const indices = [];
    const segments = contour.length;
    const rings = 9;
    for (let row = 1; row <= rings; row++) {
      const radius = (row / rings) * 0.989;
      for (let j = 0; j < segments; j++) {
        const x = center.x + (contour[j].x - center.x) * radius;
        const y = center.y + (contour[j].y - center.y) * radius;
        vertices.push(x, y, faceZ(x) + 0.003 + 0.03 * (1 - radius * radius));
      }
    }
    for (let j = 0; j < segments; j++) {
      const next = (j + 1) % segments;
      indices.push(0, 1 + j, 1 + next);
    }
    for (let row = 0; row < rings - 1; row++) {
      const start = 1 + row * segments;
      const after = start + segments;
      for (let j = 0; j < segments; j++) {
        const next = (j + 1) % segments;
        indices.push(start + j, after + j, after + next);
        indices.push(start + j, after + next, start + next);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }
  const rightLens = mesh(createLensGeometry(), materials.lens, 'right-lens', rightFront);
  rightLens.renderOrder = 2;

  function tube(points, radius, material, name, parent = glasses, segments = 32) {
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
    return mesh(new THREE.TubeGeometry(curve, segments, radius, 10, false), material, name, parent);
  }

  // One fine arched bridge is deliberately lighter than the lens rims.
  const bridgeCurve = new THREE.CubicBezierCurve3(
    vector(-0.38, 0.34, 0.006), vector(-0.19, 0.56, 0.021),
    vector(0.19, 0.56, 0.021), vector(0.38, 0.34, 0.006),
  );
  const bridge = mesh(
    new THREE.TubeGeometry(bridgeCurve, 36, 0.031, 10, false),
    materials.frame, 'titanium-bridge',
  );

  // A tiny machined endpiece connects each rounded lens rim to its hinge.
  const rightEndpiece = tube([
    vector(3.27, 0.55), vector(3.36, 0.56, -0.165),
    vector(3.43, 0.55, -0.23),
  ], 0.047, materials.frame, 'right-endpiece', rightFront, 20);
  const endpieceCap = mesh(new THREE.SphereGeometry(1, 20, 12), materials.frame, 'sensor-endpiece', rightFront);
  endpieceCap.position.set(3.335, 0.555, -0.142);
  endpieceCap.scale.set(0.081, 0.053, 0.03);

  // The small camera reads as a discreet inset, not a protruding camera barrel.
  const optic = mesh(new THREE.CircleGeometry(0.025, 28), materials.optical, 'inset-camera', rightFront);
  optic.position.set(3.337, 0.556, -0.108);
  const opticalRing = mesh(new THREE.TorusGeometry(0.028, 0.004, 6, 28), materials.polished, 'camera-lip', rightFront);
  opticalRing.position.copy(optic.position);
  opticalRing.position.z += 0.002;

  const leftFront = rightFront.clone(true);
  leftFront.name = 'left-front';
  leftFront.scale.x = -1;
  glasses.add(leftFront);
  const leftLens = leftFront.getObjectByName('right-lens');
  leftLens.name = 'left-lens';
  leftFront.getObjectByName('right-rim').name = 'left-rim';
  leftFront.getObjectByName('right-endpiece').name = 'left-endpiece';
  // Only one visible optical inset keeps the front exceptionally clean.
  leftFront.remove(leftFront.getObjectByName('inset-camera'));
  leftFront.remove(leftFront.getObjectByName('camera-lip'));

  for (const side of [-1, 1]) {
    tube([
      vector(side * 0.37, 0.07, -0.012),
      vector(side * 0.33, -0.08, -0.12),
      vector(side * 0.31, -0.20, -0.18),
    ], 0.014, materials.polished, `nose-pad-arm-${side}`, glasses, 18);
    const pad = mesh(new THREE.SphereGeometry(1, 20, 14), materials.pads, `clear-nose-pad-${side}`);
    pad.scale.set(0.059, 0.157, 0.038);
    pad.position.set(side * 0.315, -0.235, -0.185);
    pad.rotation.z = side * 0.22;
    pad.rotation.y = side * 0.24;
    pad.renderOrder = 1;
  }

  // Rounded rectangular arm sections retain a slim machined profile from every
  // angle, instead of turning into bulky side panels when the product rotates.
  function sweptArm(curve, halfWidth, halfHeight, lengthSteps = 66) {
    const radialSteps = 12;
    const positions = [];
    const indices = [];
    const up = vector(0, 1, 0);
    const horizontal = new THREE.Vector3();
    const vertical = new THREE.Vector3();
    for (let i = 0; i <= lengthSteps; i++) {
      const t = i / lengthSteps;
      const point = curve.getPoint(t);
      const tangent = curve.getTangent(t).normalize();
      horizontal.crossVectors(tangent, up).normalize();
      vertical.crossVectors(horizontal, tangent).normalize();
      const width = halfWidth(t);
      const height = halfHeight(t);
      for (let j = 0; j < radialSteps; j++) {
        const angle = j * Math.PI * 2 / radialSteps;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const x = Math.sign(cos) * Math.pow(Math.abs(cos), 0.65) * width;
        const y = Math.sign(sin) * Math.pow(Math.abs(sin), 0.65) * height;
        positions.push(
          point.x + horizontal.x * x + vertical.x * y,
          point.y + horizontal.y * x + vertical.y * y,
          point.z + horizontal.z * x + vertical.z * y,
        );
      }
    }
    for (let i = 0; i < lengthSteps; i++) {
      for (let j = 0; j < radialSteps; j++) {
        const next = (j + 1) % radialSteps;
        const a = i * radialSteps + j;
        const b = (i + 1) * radialSteps + j;
        const c = (i + 1) * radialSteps + next;
        const d = i * radialSteps + next;
        indices.push(a, b, d, b, c, d);
      }
    }
    for (const end of [0, lengthSteps]) {
      const point = curve.getPoint(end / lengthSteps);
      const centerIndex = positions.length / 3;
      positions.push(point.x, point.y, point.z);
      for (let j = 0; j < radialSteps; j++) {
        const a = end * radialSteps + j;
        const b = end * radialSteps + (j + 1) % radialSteps;
        if (end === 0) indices.push(centerIndex, a, b);
        else indices.push(centerIndex, b, a);
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
    vector(3.425, 0.548, -0.238), vector(3.474, 0.533, -0.55),
    vector(3.457, 0.49, -1.25), vector(3.355, 0.43, -2.12),
    vector(3.218, 0.338, -2.87), vector(3.084, 0.095, -3.46),
    vector(3.002, -0.10, -3.77),
  ], false, 'centripetal');
  mesh(sweptArm(
    armCurve, t => 0.033 - 0.011 * t,
    t => 0.064 - 0.035 * t,
  ), materials.frame, 'fine-titanium-temple', rightTemple);

  // A short, soft ear tip follows the same curve and stays visually slender.
  const tipCurve = new THREE.CatmullRomCurve3([
    armCurve.getPoint(0.77), armCurve.getPoint(0.84),
    armCurve.getPoint(0.92), armCurve.getPoint(1),
  ], false, 'centripetal');
  mesh(sweptArm(tipCurve, () => 0.030, t => 0.043 - 0.006 * t, 26), materials.tips, 'soft-ear-tip', rightTemple);

  const hinge = mesh(new THREE.CylinderGeometry(0.041, 0.041, 0.13, 24), materials.satin, 'micro-hinge', rightTemple);
  hinge.position.set(3.429, 0.547, -0.264);
  for (const y of [0.481, 0.613]) {
    const screw = mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.006, 20), materials.polished, 'hinge-pin', rightTemple);
    screw.position.set(3.429, y, -0.264);
  }

  const leftTemple = rightTemple.clone(true);
  leftTemple.name = 'left-temple';
  leftTemple.scale.x = -1;
  glasses.add(leftTemple);

  const parts = { rightFront, leftFront, rightLens, leftLens, rightRim,
    leftRim: leftFront.getObjectByName('left-rim'), rightTemple, leftTemple,
    bridge, rightEndpiece };
  glasses.userData.parts = parts;
  glasses.userData.materials = materials;
  glasses.userData.frontDirection = '+Z';
  glasses.userData.dimensions = { width: 7.04, height: 1.87, depth: 3.86 };
  // Preserve both the existing scene API and a direct material alias.
  glasses.materials = materials;
  glasses.parts = parts;
  return glasses;
}

export default createGlasses;
