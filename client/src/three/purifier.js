/**
 * ─────────────────────────────────────────────────────────────
 *  PROCEDURAL WATER PURIFIER — built entirely from Three.js geometry.
 *  No external model files, no textures on disk: every surface is
 *  either a MeshPhysicalMaterial or an in-memory canvas texture.
 *
 *  Coordinate convention: the unit stands on y = 0, roughly 1.6 units tall.
 * ─────────────────────────────────────────────────────────────
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/** The five purification stages, top → bottom (the camera flies through them). */
export const STAGES = [
  { key: 'sediment', label: 'Sediment', note: 'Sand, silt, rust', colour: '#c08457', y: 0.84 },
  { key: 'carbon', label: 'Carbon Block', note: 'Chlorine, odour, colour', colour: '#7c8ba1', y: 0.69 },
  { key: 'ro', label: 'RO Membrane', note: 'Dissolved salts & metals', colour: '#38bdf8', y: 0.54 },
  { key: 'uv', label: 'UV Chamber', note: 'Bacteria & viruses', colour: '#a78bfa', y: 0.39 },
  { key: 'mineral', label: 'Mineral Cartridge', note: 'Taste, pH & minerals', colour: '#22d3ee', y: 0.24 }
];

/* ── tiny canvas helper for the LED display ─────────────────── */
function ledTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#04070f';
  g.fillRect(0, 0, 256, 128);
  g.strokeStyle = 'rgba(34,211,238,0.55)';
  g.lineWidth = 3;
  g.strokeRect(6, 6, 244, 116);

  g.fillStyle = '#67e8f9';
  g.font = 'bold 46px monospace';
  g.fillText('018', 24, 62);
  g.font = 'bold 20px monospace';
  g.fillStyle = '#a5f3fc';
  g.fillText('ppm', 106, 62);

  g.font = 'bold 17px monospace';
  g.fillStyle = '#22d3ee';
  g.fillText('UV ON', 24, 96);
  g.fillStyle = '#0ea5e9';
  g.fillText('RO+UF', 122, 96);
  g.beginPath();
  g.arc(226, 90, 7, 0, Math.PI * 2);
  g.fillStyle = '#22d3ee';
  g.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/* ── flowing water stream shader (tap → glass) ─────────────── */
function streamMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uColor: { value: new THREE.Color('#67e8f9') }
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 p = position;
        p.x += sin(uv.y * 18.0 + uv.x * 6.0) * 0.004;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uOpacity;
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        float flow = sin((vUv.y * 22.0) - uTime * 7.0) * 0.5 + 0.5;
        float core = smoothstep(0.0, 0.42, 1.0 - abs(vUv.x - 0.5) * 2.0);
        float edgeY = smoothstep(0.0, 0.06, vUv.y) * smoothstep(0.0, 0.14, 1.0 - vUv.y);
        float a = (0.26 + flow * 0.34) * core * edgeY * uOpacity;
        gl_FragColor = vec4(uColor * (0.85 + flow * 0.55), a);
      }
    `
  });
}

/* ── tank water: gentle surface waves + clarity tint ────────── */
function tankWaterMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uMurk: { value: 1 }, // 1 = dirty brown, 0 = crystal clear
      uOpacity: { value: 0.95 }
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vPos;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 p = position;
        p.y += sin(p.x * 9.0 + uTime * 1.6) * 0.006 + cos(p.z * 11.0 - uTime * 1.9) * 0.005;
        vPos = p;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uMurk;
      uniform float uOpacity;
      varying vec3 vPos;
      varying vec2 vUv;
      void main() {
        vec3 clean = vec3(0.16, 0.72, 0.86);
        vec3 dirty = vec3(0.28, 0.22, 0.12);
        vec3 col = mix(clean, dirty, clamp(uMurk, 0.0, 1.0));

        // caustic-like bands inside the volume
        float bands = sin(vPos.y * 26.0 + uTime * 2.2) * 0.5 + 0.5;
        float swirl = sin(vPos.x * 14.0 - uTime * 1.1) * cos(vPos.z * 12.0 + uTime * 0.8);
        col += vec3(0.06, 0.16, 0.2) * bands * (1.0 - uMurk);
        col += vec3(0.02, 0.05, 0.06) * swirl;

        float top = smoothstep(0.0, 0.5, vUv.y);
        float alpha = (0.5 + 0.42 * top) * uOpacity;
        gl_FragColor = vec4(col, alpha);
      }
    `
  });
}

/* ── caustic light pattern projected on the floor ──────────── */
function causticMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 0.55 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uOpacity;
      varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){
        vec2 i = floor(p), f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1,0)), u.x),
                   mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
      }
      void main() {
        vec2 p = (vUv - 0.5) * 5.0;
        float n = 0.0;
        n += noise(p * 1.5 + vec2(uTime * 0.28, uTime * 0.19));
        n += noise(p * 2.7 - vec2(uTime * 0.21, uTime * 0.31)) * 0.6;
        n += noise(p * 5.1 + vec2(uTime * 0.12, -uTime * 0.24)) * 0.3;
        float caustic = pow(n / 1.9, 2.4) * 1.7;
        float vign = smoothstep(1.0, 0.15, length(vUv - 0.5) * 1.6);
        vec3 tint = mix(vec3(0.12, 0.6, 0.78), vec3(0.55, 0.95, 1.0), caustic);
        gl_FragColor = vec4(tint, caustic * vign * uOpacity);
      }
    `
  });
}

/**
 * Build the purifier.
 * @param {{ cheap?: boolean }} opts
 */
export function buildPurifier({ cheap = false } = {}) {
  const group = new THREE.Group();
  const refs = {};

  /* ── metal body ─────────────────────────────────────────── */
  const metal = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#25313f'),
    metalness: 0.95,
    roughness: 0.3,
    clearcoat: 0.8,
    clearcoatRoughness: 0.22,
    envMapIntensity: 0.85
  });
  refs.metal = metal;

  const darkMetal = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#0d1520'),
    metalness: 0.98,
    roughness: 0.28,
    clearcoat: 0.7,
    envMapIntensity: 0.9
  });

  const body = new THREE.Mesh(new RoundedBoxGeometry(0.8, 0.86, 0.62, 5, 0.06), metal);
  body.position.y = 0.53;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);
  refs.body = body;

  // base plinth
  const base = new THREE.Mesh(new RoundedBoxGeometry(0.92, 0.1, 0.74, 4, 0.03), darkMetal);
  base.position.y = 0.05;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // collar that seats the tank on the body (kills the "floating" look)
  const collar = new THREE.Mesh(new RoundedBoxGeometry(0.72, 0.07, 0.56, 4, 0.03), darkMetal);
  collar.position.y = 0.98;
  group.add(collar);

  // top cap
  const cap = new THREE.Mesh(new RoundedBoxGeometry(0.7, 0.1, 0.54, 4, 0.045), darkMetal);
  cap.position.y = 1.6;
  cap.castShadow = true;
  group.add(cap);

  // cyan accent seams
  const seamMat = new THREE.MeshStandardMaterial({
    color: '#67e8f9',
    emissive: new THREE.Color('#22d3ee'),
    emissiveIntensity: 2.4,
    roughness: 0.4,
    metalness: 0
  });
  const seam = new THREE.Mesh(new THREE.BoxGeometry(0.806, 0.012, 0.626), seamMat);
  seam.position.y = 0.945;
  group.add(seam);
  refs.seam = seam;

  /* ── glass tank + water ─────────────────────────────────── */
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#eaf7ff'),
    metalness: 0,
    roughness: cheap ? 0.12 : 0.04,
    transmission: cheap ? 0 : 1,
    thickness: cheap ? 0 : 1.1,
    ior: 1.46,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    transparent: true,
    opacity: cheap ? 0.22 : 1,
    envMapIntensity: 1.6,
    side: THREE.DoubleSide
  });
  const tank = new THREE.Mesh(new RoundedBoxGeometry(0.66, 0.56, 0.5, 5, 0.05), glassMat);
  tank.position.y = 1.29;
  group.add(tank);
  refs.tank = tank;

  const waterMat = tankWaterMaterial();
  const water = new THREE.Mesh(new THREE.BoxGeometry(0.59, 0.44, 0.43, 22, 26, 16), waterMat);
  water.position.y = 1.25;
  group.add(water);
  refs.water = water;
  refs.waterMat = waterMat;

  /* ── UV tube (glowing) ──────────────────────────────────── */
  const uvMat = new THREE.MeshStandardMaterial({
    color: '#c4b5fd',
    emissive: new THREE.Color('#7dd3fc'),
    emissiveIntensity: 4.2,
    roughness: 0.2,
    metalness: 0.1
  });
  const uvTube = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.4, 16), uvMat);
  uvTube.position.set(0, 1.28, -0.17);
  group.add(uvTube);
  refs.uvTube = uvTube;
  refs.uvMat = uvMat;

  const uvLight = new THREE.PointLight(new THREE.Color('#5eead4'), 0.6, 1.6, 2);
  uvLight.position.set(0, 1.24, -0.14);
  group.add(uvLight);
  refs.uvLight = uvLight;

  /* ── LED display (canvas texture) ───────────────────────── */
  const ledMat = new THREE.MeshBasicMaterial({ map: ledTexture(), toneMapped: false });
  const led = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.15), ledMat);
  led.position.set(0, 0.78, 0.312);
  group.add(led);
  refs.led = led;

  /* ── tap + spout ────────────────────────────────────────── */
  const tapGroup = new THREE.Group();
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.2, 14), metal);
  arm.rotation.z = Math.PI / 2;
  arm.position.set(0, 0.72, 0.42);
  tapGroup.add(arm);

  const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.031, 14, 12), metal);
  elbow.position.set(0.0, 0.72, 0.5);
  tapGroup.add(elbow);

  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.023, 0.018, 0.11, 14), metal);
  spout.position.set(0.0, 0.665, 0.5);
  tapGroup.add(spout);

  const handle = new THREE.Mesh(new THREE.CapsuleGeometry(0.016, 0.08, 4, 8), darkMetal);
  handle.position.set(0.0, 0.79, 0.36);
  handle.rotation.x = 0.35;
  tapGroup.add(handle);
  group.add(tapGroup);
  refs.tap = tapGroup;
  refs.streamOrigin = new THREE.Vector3(0.0, 0.6, 0.5);

  /* ── water stream from the tap ──────────────────────────── */
  const streamMat = streamMaterial();
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.012, 0.46, 12, 1, true), streamMat);
  stream.position.set(0.0, 0.36, 0.5);
  group.add(stream);
  refs.stream = stream;
  refs.streamMat = streamMat;

  // splash rings at the impact point
  const ringMat = new THREE.MeshBasicMaterial({
    color: '#a5f3fc',
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const rings = [];
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(new THREE.RingGeometry(0.02, 0.028, 32), ringMat.clone());
    r.rotation.x = -Math.PI / 2;
    r.position.set(0, 0.11, 0.5);
    group.add(r);
    rings.push(r);
  }
  refs.rings = rings;

  /* ── 5 internal filter stages (visible on the cutaway) ──── */
  const stageObjects = [];
  const stageGroups = [];
  STAGES.forEach((stage, i) => {
    const g = new THREE.Group();
    g.position.set(0, stage.y, 0);

    const shellMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(stage.colour),
      metalness: 0.35,
      roughness: 0.25,
      transmission: cheap ? 0 : 0.85,
      thickness: 0.5,
      transparent: true,
      opacity: 0.9,
      emissive: new THREE.Color(stage.colour),
      emissiveIntensity: 0.35,
      clearcoat: 1
    });
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.2, 20, 1, true), shellMat);
    shell.rotation.z = Math.PI / 2;
    g.add(shell);

    // glowing marker ring the camera flies through
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.105, 0.006, 8, 40),
      new THREE.MeshStandardMaterial({
        color: stage.colour,
        emissive: new THREE.Color(stage.colour),
        emissiveIntensity: 2.6,
        roughness: 0.3
      })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.z = 0;
    g.add(ring);

    const stageLight = new THREE.PointLight(new THREE.Color(stage.colour), 0.06, 1.1, 2);
    stageLight.position.z = 0.12;
    g.add(stageLight);

    g.userData = { index: i, stage, shellMat, ring, stageLight };
    group.add(g);
    stageGroups.push(g);
    stageObjects.push(shell, ring);
  });
  refs.stageGroups = stageGroups;

  /* ── interior "flow tunnel" for the fly-through ─────────── */
  const tunnelMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uOpacity;
      varying vec2 vUv;
      void main(){
        float bands = sin(vUv.y * 46.0 - uTime * 4.0) * 0.5 + 0.5;
        float a = (0.25 + bands * 0.75) * uOpacity;
        vec3 col = mix(vec3(0.1, 0.55, 0.8), vec3(0.65, 0.95, 1.0), bands);
        gl_FragColor = vec4(col, a);
      }
    `
  });
  const tunnel = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.82, 24, 1, true), tunnelMat);
  tunnel.position.set(0, 0.55, 0);
  group.add(tunnel);
  refs.tunnel = tunnel;
  refs.tunnelMat = tunnelMat;

  const interiorLight = new THREE.PointLight(new THREE.Color('#7fe9ff'), 0, 1.0, 2);
  interiorLight.position.set(0, 0.55, 0.12);
  group.add(interiorLight);
  refs.interiorLight = interiorLight;

  /* ── floating bubbles inside the tank ───────────────────── */
  const bubbleCount = cheap ? 40 : 110;
  const bGeo = new THREE.BufferGeometry();
  const bPos = new Float32Array(bubbleCount * 3);
  const bSeed = new Float32Array(bubbleCount);
  for (let i = 0; i < bubbleCount; i++) {
    bPos[i * 3] = (Math.random() - 0.5) * 0.48;
    bPos[i * 3 + 1] = 1.04 + Math.random() * 0.42;
    bPos[i * 3 + 2] = (Math.random() - 0.5) * 0.36;
    bSeed[i] = Math.random();
  }
  bGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3));
  bGeo.setAttribute('aSeed', new THREE.BufferAttribute(bSeed, 1));
  const bubbleMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 0.9 } },
    vertexShader: /* glsl */ `
      uniform float uTime;
      attribute float aSeed;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        p.y = 1.03 + mod(p.y - 1.03 + uTime * (0.05 + aSeed * 0.07), 0.43);
        p.x += sin(uTime * (0.7 + aSeed) + aSeed * 12.0) * 0.02;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (6.0 + aSeed * 14.0) / max(0.35, -mv.z);
        vAlpha = 0.35 + aSeed * 0.5;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float edge = smoothstep(0.5, 0.18, d);
        gl_FragColor = vec4(vec3(0.75, 0.97, 1.0), edge * vAlpha * uOpacity);
      }
    `
  });
  const bubbles = new THREE.Points(bGeo, bubbleMat);
  group.add(bubbles);
  refs.bubbles = bubbles;
  refs.bubbleMat = bubbleMat;

  /* ── caustic light pool on the floor ────────────────────── */
  const caustics = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4, 1, 1), causticMaterial());
  caustics.rotation.x = -Math.PI / 2;
  caustics.position.y = 0.004;
  group.add(caustics);
  refs.caustics = caustics;

  return { group, refs };
}

/**
 * A deliberately lightweight stand-in for the showroom lineup.
 * Four full purifiers in one scene would mean ~24 extra point lights and
 * four transmission materials — far too expensive. This keeps the silhouette
 * (body, glass tank, cap, glowing seam) with zero lights and cheap materials.
 */
export function buildShowroomUnit(colour = '#22d3ee') {
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: '#243040',
    metalness: 0.9,
    roughness: 0.34,
    envMapIntensity: 0.7
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colour),
    emissive: new THREE.Color(colour),
    emissiveIntensity: 1.6,
    roughness: 0.35,
    metalness: 0.2
  });
  const tankMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(colour),
    metalness: 0,
    roughness: 0.15,
    transparent: true,
    opacity: 0.32,
    clearcoat: 1,
    envMapIntensity: 1.1
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.08, 24), bodyMat);
  base.position.y = 0.04;

  const body = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.72, 0.5, 3, 0.05), bodyMat);
  body.position.y = 0.44;

  const seam = new THREE.Mesh(new THREE.BoxGeometry(0.624, 0.012, 0.504), glowMat);
  seam.position.y = 0.78;

  const tank = new THREE.Mesh(new RoundedBoxGeometry(0.52, 0.44, 0.42, 3, 0.04), tankMat);
  tank.position.y = 1.06;

  const cap = new THREE.Mesh(new RoundedBoxGeometry(0.58, 0.09, 0.46, 3, 0.04), bodyMat);
  cap.position.y = 1.3;

  const led = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.1), glowMat);
  led.position.set(0, 0.6, 0.251);

  group.add(base, body, seam, tank, cap, led);
  return { group, refs: {} };
}

export default buildPurifier;
