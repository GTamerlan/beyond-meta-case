/**
 * Small titanium thumb-control ring, centered at the origin with its hole
 * along Z. Outer diameter is approximately 1.02 and band width is 0.4.
 * The control surface sits on +Y. No fonts, textures, or external assets.
 */
export function createRing(THREE) {
  const ring = new THREE.Group();
  ring.name = 'thumb-control-ring';

  const materials = {
    titanium: new THREE.MeshPhysicalMaterial({
      color: 0x333b45, metalness: 0.94, roughness: 0.26,
      clearcoat: 0.3, clearcoatRoughness: 0.23,
      envMapIntensity: 1.3,
    }),
    innerMetal: new THREE.MeshStandardMaterial({
      color: 0xa9b0b8, metalness: 0.97, roughness: 0.2,
      envMapIntensity: 1.15,
    }),
    edgeMetal: new THREE.MeshStandardMaterial({
      color: 0x727e89, metalness: 0.98, roughness: 0.18,
      envMapIntensity: 1.15,
    }),
    touch: new THREE.MeshPhysicalMaterial({
      color: 0x161c22, metalness: 0.38, roughness: 0.29,
      clearcoat: 0.55, clearcoatRoughness: 0.23,
    }),
    groove: new THREE.MeshStandardMaterial({
      color: 0x090d12, metalness: 0.35, roughness: 0.4,
    }),
  };

  function add(geometry, material, name) {
    const object = new THREE.Mesh(geometry, material);
    object.name = name;
    object.castShadow = true;
    object.receiveShadow = true;
    ring.add(object);
    return object;
  }

  // Lathed profiles preserve a continuous curved band and soft machined lips.
  // The crown is flattened slightly to support a discreet thumb touchstrip.
  function lathe(profile, material, name, flattenCrown = false) {
    const geometry = new THREE.LatheGeometry(
      profile.map(([radius, axial]) => new THREE.Vector2(radius, axial)),
      96,
    );
    geometry.rotateX(Math.PI / 2);
    if (flattenCrown) {
      const position = geometry.attributes.position;
      for (let i = 0; i < position.count; i++) {
        if (position.getY(i) > 0.491) position.setY(i, 0.491);
      }
      geometry.computeVertexNormals();
    }
    return add(geometry, material, name);
  }

  const body = lathe([
    [0.392, -0.174],
    [0.400, -0.190],
    [0.418, -0.199],
    [0.468, -0.199],
    [0.489, -0.187],
    [0.502, -0.163],
    [0.507, -0.115],
    [0.507, 0.115],
    [0.502, 0.163],
    [0.489, 0.187],
    [0.468, 0.199],
    [0.418, 0.199],
    [0.400, 0.190],
    [0.392, 0.174],
    [0.392, -0.174],
  ], materials.titanium, 'graphite-titanium-body', true);

  // A contrasting inner sleeve rounds inward for a comfortable, believable fit.
  const innerBand = lathe([
    [0.402, -0.187],
    [0.389, -0.183],
    [0.378, -0.171],
    [0.373, -0.144],
    [0.371, -0.095],
    [0.371, 0.095],
    [0.373, 0.144],
    [0.378, 0.171],
    [0.389, 0.183],
    [0.402, 0.187],
  ].reverse(), materials.innerMetal, 'polished-inner-band');

  // Fine concentric bevels are restrained accents, not ornamental jewelry.
  for (const side of [-1, 1]) {
    const rimProfile = [
      [0.414, side * 0.1992],
      [0.418, side * 0.2000],
      [0.427, side * 0.2000],
      [0.431, side * 0.1992],
    ];
    if (side > 0) rimProfile.reverse();
    lathe(rimProfile, materials.edgeMetal, `machined-rim-${side}`);
  }

  function roundedRectangle(width, height, radius) {
    const x = -width / 2;
    const y = -height / 2;
    const shape = new THREE.Shape();
    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + height - radius);
    shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    shape.lineTo(x + radius, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);
    shape.closePath();
    return shape;
  }

  function crownPlate(width, height, radius, depth, bevel, material, name, y, z = 0) {
    const geometry = new THREE.ExtrudeGeometry(roundedRectangle(width, height, radius), {
      depth, steps: 1, curveSegments: 8,
      bevelEnabled: true, bevelThickness: bevel,
      bevelSize: bevel, bevelSegments: 2,
    });
    geometry.rotateX(-Math.PI / 2);
    const object = add(geometry, material, name);
    object.position.set(0, y, z);
    return object;
  }

  const bezel = crownPlate(
    0.172, 0.279, 0.037, 0.008, 0.003,
    materials.edgeMetal, 'touchstrip-bezel', 0.490,
  );
  const touchStrip = crownPlate(
    0.151, 0.255, 0.030, 0.006, 0.0025,
    materials.touch, 'thumb-scroll-surface', 0.499,
  );

  // Tactile click location and scroll cues remain visible in close product shots.
  const clickButton = crownPlate(
    0.080, 0.025, 0.011, 0.003, 0.0015,
    materials.edgeMetal, 'thumb-click-button', 0.507, 0.081,
  );
  for (const z of [-0.065, -0.043, -0.021]) {
    crownPlate(
      0.050, 0.003, 0.0014, 0.0005, 0.0003,
      materials.groove, 'scroll-grip-line', 0.507, z,
    );
  }

  ring.userData.parts = { body, innerBand, bezel, touchStrip, clickButton };
  ring.userData.materials = materials;
  ring.userData.axis = '+Z';
  ring.userData.controlDirection = '+Y';
  return ring;
}

export default createRing;
