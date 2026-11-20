/**
 * ══════════════════════════════════════════════════════════════════
 *  CINEMATIC SCENE — one continuous WebGL shot list behind the page.
 *  Scroll progress (0 → 1) scrubs a smooth camera path:
 *  dolly · orbit · zoom · tilt · crane, plus a fly-through of the
 *  purifier's five filter stages.
 *
 *  Loaded from npm with pinned versions (three 0.169.0, gsap 3.12.5).
 * ══════════════════════════════════════════════════════════════════
 */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { buildPurifier, buildShowroomUnit, STAGES } from './purifier.js';
import { SECTION_BOUNDS, range, smooth } from '../lib/scroll.js';

/* ── the shot list: scroll progress → camera keyframe ─────────────
 * Keyframes are positioned on the SAME weighted timeline the DOM
 * sections use, so picture and copy never drift apart.            */
const B = SECTION_BOUNDS;
const JB = B[2]; // the journey section
const JP = (k) => JB.start + (JB.end - JB.start) * k; // journey-relative progress
const MID = (i) => (B[i].start + B[i].end) / 2;

const SHOTS = [
  { p: 0.0, pos: [0.0, 1.18, 3.6], look: [0, 0.92, 0], fov: 40 }, // SCENE 1 · hero, wide dolly
  { p: MID(0), pos: [1.45, 1.3, 2.9], look: [0, 0.98, 0], fov: 42 }, // hero orbit
  { p: MID(1), pos: [0.6, 0.42, 2.3], look: [0, 0.72, 0], fov: 55 }, // SCENE 2 · problem, low tilt
  { p: JP(0.06), pos: [0.0, 1.46, 1.62], look: [0, 1.22, 0], fov: 46 }, // SCENE 3 · push into the tank
  { p: JP(0.18), pos: [0.13, 0.98, 0.72], look: [0, 0.86, 0], fov: 48 }, // stage 1 · sediment
  { p: JP(0.32), pos: [0.11, 0.84, 0.66], look: [0, 0.72, 0], fov: 50 }, // stage 2 · carbon
  { p: JP(0.46), pos: [0.1, 0.69, 0.62], look: [0, 0.56, 0], fov: 52 }, // stage 3 · RO membrane
  { p: JP(0.6), pos: [0.09, 0.54, 0.58], look: [0, 0.41, 0], fov: 52 }, // stage 4 · UV
  { p: JP(0.72), pos: [0.08, 0.4, 0.55], look: [0, 0.26, 0], fov: 52 }, // stage 5 · minerals
  { p: MID(3), pos: [1.15, 1.42, 2.4], look: [0, 0.98, 0], fov: 38 }, // SCENE 4 · pure water
  { p: MID(4), pos: [0.0, 1.72, 4.7], look: [0, 0.9, 0], fov: 46 }, // SCENE 5 · lineup wide
  { p: MID(5), pos: [2.7, 2.7, 3.4], look: [0, 0.45, 0], fov: 48 }, // SCENE 6 · services crane
  { p: MID(6), pos: [-2.3, 1.25, 3.1], look: [0, 1.0, 0], fov: 44 }, // SCENE 7 · booking
  { p: MID(7), pos: [-1.2, 1.6, 3.6], look: [0, 1.0, 0], fov: 42 }, // SCENE 8 · trust
  { p: 1.0, pos: [0.0, 1.12, 5.8], look: [0, 1.0, 0], fov: 40 } // SCENE 9 · outro pull-back
];

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;

function sampleShot(p) {
  const pp = clamp01(p);
  for (let i = 0; i < SHOTS.length - 1; i++) {
    const a = SHOTS[i];
    const b = SHOTS[i + 1];
    if (pp >= a.p && pp <= b.p) {
      const raw = (pp - a.p) / Math.max(0.0001, b.p - a.p);
      // gentle ease so the camera "settles" on each keyframe like a real dolly
      const t = lerp(smooth(raw), easeInOut(raw), 0.55);
      return {
        pos: a.pos.map((v, k) => lerp(v, b.pos[k], t)),
        look: a.look.map((v, k) => lerp(v, b.look[k], t)),
        fov: lerp(a.fov, b.fov, t)
      };
    }
  }
  const last = SHOTS[SHOTS.length - 1];
  return { pos: [...last.pos], look: [...last.look], fov: last.fov };
}

/* ── film-grain / vignette / chromatic aberration pass ────────── */
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uAmount: { value: 1 },
    uGrain: { value: 0.05 },
    uVignette: { value: 0.85 }
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime, uAmount, uGrain, uVignette;
    varying vec2 vUv;
    void main() {
      vec2 uv = vUv;
      vec2 dir = uv - 0.5;
      float r2 = dot(dir, dir);

      // chromatic aberration grows toward the frame edges
      float ca = 0.0016 * (0.3 + r2 * 2.4) * uAmount;
      vec4 col;
      col.r = texture2D(tDiffuse, uv + dir * ca).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - dir * ca).b;
      col.a = 1.0;

      // vignette
      float vig = smoothstep(1.0, 0.3, length(dir) * 1.2);
      col.rgb *= mix(1.0, vig, uVignette);

      // animated film grain
      float g = fract(sin(dot(uv * vec2(1234.5, 5678.9) + fract(uTime) * 91.7, vec2(12.9898, 78.233))) * 43758.5453);
      col.rgb += (g - 0.5) * uGrain;

      gl_FragColor = col;
    }
  `
};

/** Soft radial sprite used for the anamorphic flare + dust. */
function radialTexture(inner = 'rgba(255,255,255,0.95)', outer = 'rgba(255,255,255,0)') {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, inner);
  grad.addColorStop(0.45, 'rgba(160,240,255,0.35)');
  grad.addColorStop(1, outer);
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export default function CinematicScene({ progressRef, activeModel = 0 }) {
  const mountRef = useRef(null);
  const activeModelRef = useRef(activeModel);
  activeModelRef.current = activeModel;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // quality: auto-detected, and overridable with ?quality=low|high
    const forced = new URLSearchParams(window.location.search).get('quality');
    const isSmall = window.matchMedia('(max-width: 820px)').matches;
    const lowMem = (navigator.deviceMemory || navigator.hardwareConcurrency || 8) <= 4;
    const cheap = forced ? forced === 'low' : isSmall || lowMem;

    /* ── renderer ───────────────────────────────────────────── */
    const renderer = new THREE.WebGLRenderer({
      antialias: !cheap,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cheap ? 1.5 : 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = !cheap;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = null;
    scene.fog = new THREE.FogExp2(0x04070f, 0.085);

    const camera = new THREE.PerspectiveCamera(42, mount.clientWidth / mount.clientHeight, 0.05, 60);
    camera.position.set(0, 1.18, 3.6);

    /* ── environment reflections (procedural, no HDR file) ──── */
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;

    /* ── the purifier ───────────────────────────────────────── */
    const { group: purifier, refs } = buildPurifier({ cheap });
    scene.add(purifier);

    /* ── floor: dark reflective disc ────────────────────────── */
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(9, 64),
      new THREE.MeshStandardMaterial({
        color: 0x03060c,
        metalness: 0.55,
        roughness: 0.62,
        envMapIntensity: 0.08
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    /* ── lighting rig ───────────────────────────────────────── */
    const hemi = new THREE.HemisphereLight(0xdff3ff, 0x04070f, 0.32);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffffff, 1.9);
    key.position.set(3.2, 5.4, 3.4);
    key.castShadow = !cheap;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 14;
    key.shadow.bias = -0.0008;
    key.shadow.radius = 4;
    scene.add(key);

    const rim = new THREE.DirectionalLight(0x22d3ee, 1.7);
    rim.position.set(-3.6, 2.4, -3.2);
    scene.add(rim);

    const fill = new THREE.DirectionalLight(0x8be9ff, 0.5);
    fill.position.set(-2.4, 1.2, 3.2);
    scene.add(fill);

    // red-tinted "problem" light — fades in for scene 2 only
    const problemLight = new THREE.PointLight(0xff3b30, 0, 6, 2);
    problemLight.position.set(-1.1, 0.85, 1.4);
    scene.add(problemLight);

    // warm-white "pure" light that blooms for scene 4
    const pureLight = new THREE.PointLight(0xeafcff, 0, 6, 2);
    pureLight.position.set(1.4, 1.7, 1.6);
    scene.add(pureLight);

    /* ── volumetric god rays (additive cones) ───────────────── */
    const rays = new THREE.Group();
    const rayMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: { uTime: { value: 0 }, uOpacity: { value: 0.07 } },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime, uOpacity;
        varying vec2 vUv;
        void main(){
          // soft around the cone (sin gives a seamless wrap) + soft top/bottom
          float around = pow(sin(vUv.x * 3.141592), 1.4);
          float vertical = smoothstep(0.0, 0.55, vUv.y) * smoothstep(1.0, 0.75, vUv.y);
          float flick = 0.7 + 0.3 * sin(uTime * 0.6 + vUv.y * 6.0);
          float a = around * vertical * flick * uOpacity;
          gl_FragColor = vec4(vec3(0.55, 0.92, 1.0), a);
        }
      `
    });
    for (let i = 0; i < 3; i++) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(1.15, 7.0, 28, 1, true), rayMat);
      cone.position.set(Math.cos(i * 1.9) * 1.5, 1.0, Math.sin(i * 1.9) * 1.2 - 0.4);
      cone.rotation.z = Math.cos(i) * 0.22;
      cone.rotation.x = Math.sin(i * 1.3) * 0.14;
      rays.add(cone);
    }
    scene.add(rays);

    /* ── anamorphic lens flare ──────────────────────────────── */
    const flareTex = radialTexture();
    const flareMat = new THREE.SpriteMaterial({
      map: flareTex,
      color: 0x66e6ff,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false
    });
    const flareH = new THREE.Sprite(flareMat);
    flareH.scale.set(3.4, 0.1, 1);
    flareH.position.set(0, 1.42, 0.12);
    scene.add(flareH);

    const flareCore = new THREE.Sprite(flareMat.clone());
    flareCore.scale.set(0.3, 0.3, 1);
    flareCore.position.set(0, 1.36, 0.1);
    scene.add(flareCore);

    /* ── floating dust motes ────────────────────────────────── */
    const dustCount = cheap ? 220 : 750;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    const dustSeed = new Float32Array(dustCount);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 9;
      dustPos[i * 3 + 1] = Math.random() * 5.2;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1;
      dustSeed[i] = Math.random();
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    dustGeo.setAttribute('aSeed', new THREE.BufferAttribute(dustSeed, 1));
    const dustMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uOpacity: { value: 0.5 }, uTex: { value: radialTexture() } },
      vertexShader: /* glsl */ `
        uniform float uTime;
        attribute float aSeed;
        varying float vA;
        void main(){
          vec3 p = position;
          p.y = mod(p.y + uTime * (0.045 + aSeed * 0.09), 5.2);
          p.x += sin(uTime * 0.35 + aSeed * 20.0) * 0.16;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (7.0 + aSeed * 13.0) / max(0.4, -mv.z);
          vA = 0.18 + aSeed * 0.55;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uOpacity;
        varying float vA;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float a = smoothstep(0.5, 0.0, d) * vA * uOpacity;
          gl_FragColor = vec4(vec3(0.72, 0.94, 1.0), a);
        }
      `
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    /* ── impurities: the murky "before" water (scene 2) ─────── */
    const impCount = cheap ? 160 : 520;
    const impGeo = new THREE.BufferGeometry();
    const impPos = new Float32Array(impCount * 3);
    const impSeed = new Float32Array(impCount);
    for (let i = 0; i < impCount; i++) {
      const r = 0.5 + Math.random() * 1.9;
      const a = Math.random() * Math.PI * 2;
      impPos[i * 3] = Math.cos(a) * r;
      impPos[i * 3 + 1] = Math.random() * 2.4;
      impPos[i * 3 + 2] = Math.sin(a) * r * 0.75;
      impSeed[i] = Math.random();
    }
    impGeo.setAttribute('position', new THREE.BufferAttribute(impPos, 3));
    impGeo.setAttribute('aSeed', new THREE.BufferAttribute(impSeed, 1));
    const impMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 } },
      vertexShader: /* glsl */ `
        uniform float uTime;
        attribute float aSeed;
        varying float vA;
        void main(){
          vec3 p = position;
          p.y = mod(p.y + uTime * (0.1 + aSeed * 0.2), 2.6);
          p.x += sin(uTime * 0.8 + aSeed * 30.0) * 0.1;
          p.z += cos(uTime * 0.6 + aSeed * 18.0) * 0.1;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (13.0 + aSeed * 26.0) / max(0.4, -mv.z);
          vA = 0.25 + aSeed * 0.6;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uOpacity;
        varying float vA;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float a = smoothstep(0.5, 0.05, d) * vA * uOpacity;
          gl_FragColor = vec4(vec3(0.55, 0.36, 0.2), a);
        }
      `
    });
    const impurities = new THREE.Points(impGeo, impMat);
    scene.add(impurities);

    /* ── splash droplets (slow-motion hero moment) ──────────── */
    const dropCount = cheap ? 60 : 190;
    const dropGeo = new THREE.BufferGeometry();
    const dropState = [];
    const dropPos = new Float32Array(dropCount * 3);
    for (let i = 0; i < dropCount; i++) {
      dropState.push({
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: Math.random(),
        speed: 0.5 + Math.random()
      });
      dropPos[i * 3 + 1] = -50;
    }
    dropGeo.setAttribute('position', new THREE.BufferAttribute(dropPos, 3));
    const dropMat = new THREE.PointsMaterial({
      map: radialTexture(),
      alphaTest: 0.05,
      color: 0xbdf3ff,
      size: 0.045,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });
    const drops = new THREE.Points(dropGeo, dropMat);
    scene.add(drops);

    /* ── showroom lineup (4 units in the background) ────────── */
    const showroom = new THREE.Group();
    const showroomUnits = [];
    ['#22d3ee', '#38bdf8', '#0ea5e9', '#67e8f9'].forEach((col, i) => {
      const unit = buildShowroomUnit(col);
      unit.group.position.set(-2.16 + i * 1.44, 0, -2.35);
      unit.group.rotation.y = (i - 1.5) * 0.16;
      unit.group.userData.baseY = 0;
      showroom.add(unit.group);
      showroomUnits.push(unit.group);
    });
    scene.add(showroom);

    /* ══════════════ POST-PROCESSING ══════════════ */
    let composer = null;
    let bloom = null;
    let bokeh = null;
    let grade = null;

    if (!cheap) {
      composer = new EffectComposer(renderer);
      composer.setSize(mount.clientWidth, mount.clientHeight);
      composer.addPass(new RenderPass(scene, camera));

      bokeh = new BokehPass(scene, camera, { focus: 3.6, aperture: 0.00006, maxblur: 0.006 });
      composer.addPass(bokeh);

      bloom = new UnrealBloomPass(
        new THREE.Vector2(mount.clientWidth, mount.clientHeight),
        0.42, // strength
        0.65, // radius
        0.78 // threshold
      );
      composer.addPass(bloom);

      grade = new ShaderPass(GradeShader);
      composer.addPass(grade);

      composer.addPass(new OutputPass());
    }

    /* ══════════════ INTERACTION STATE ══════════════ */
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const onPointerMove = (e) => {
      pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cheap ? 1.5 : 2));
      renderer.setSize(w, h);
      if (composer) composer.setSize(w, h);
      if (bloom) bloom.setSize(w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    /* ══════════════ ANIMATION LOOP ══════════════ */
    const clock = new THREE.Clock();
    let frame = 0;
    let raf = 0;
    let visible = true;
    const onVisibility = () => {
      visible = !document.hidden;
      if (visible) clock.getDelta();
    };
    document.addEventListener('visibilitychange', onVisibility);

    const lookTarget = new THREE.Vector3();
    const tmp = new THREE.Vector3();

    function render() {
      raf = requestAnimationFrame(render);
      if (!visible) return;

      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const p = clamp01(progressRef?.current ?? 0);

      /* camera path + parallax sway */
      const shot = sampleShot(p);
      if (!reduceMotion) {
        pointer.x += (pointer.tx - pointer.x) * 0.045;
        pointer.y += (pointer.ty - pointer.y) * 0.045;
      }
      const swayX = pointer.x * 0.22;
      const swayY = -pointer.y * 0.13;
      const handheld = reduceMotion ? 0 : Math.sin(t * 0.7) * 0.008;

      // ── portrait fit: dolly back on tall/narrow screens (never inside close-ups)
      const aspect = camera.aspect || 1.6;
      const portraitFit = aspect < 1.25 ? Math.min(2.3, 1.25 / Math.max(0.42, aspect)) : 1;
      const closeness = clamp01((1.5 - shot.pos[2]) / 1.2);
      const fit = 1 + (portraitFit - 1) * (1 - closeness);

      camera.position.set(
        shot.look[0] + (shot.pos[0] - shot.look[0]) * fit + swayX + handheld,
        shot.look[1] + (shot.pos[1] - shot.look[1]) * fit + swayY + Math.cos(t * 0.53) * 0.006,
        shot.look[2] + (shot.pos[2] - shot.look[2]) * fit
      );
      lookTarget.set(shot.look[0] + swayX * 0.35, shot.look[1] + swayY * 0.4, shot.look[2]);
      camera.lookAt(lookTarget);
      // crane-style roll for the low "problem" shot and the high crane shot
      camera.rotation.z += Math.sin(p * Math.PI * 2) * 0.012;

      if (Math.abs(camera.fov - shot.fov) > 0.01) {
        camera.fov = shot.fov;
        camera.updateProjectionMatrix();
      }

      /* ── story beats, all derived from the same progress value ── */
      const jSpan = JB.end - JB.start;
      const murk =
        p < B[1].start
          ? 0.16
          : p < JB.start
            ? 0.16 + 0.84 * smooth(range(p, B[1].start, B[1].start + (B[1].end - B[1].start) * 0.65))
            : 1 - smooth(range(p, JB.start, JB.start + jSpan * 0.8));
      const inside =
        smooth(range(p, JB.start + jSpan * 0.04, JB.start + jSpan * 0.16)) *
        (1 - smooth(range(p, JB.end - jSpan * 0.12, JB.end + jSpan * 0.03)));
      const pure =
        smooth(range(p, B[3].start - 0.012, B[3].start + 0.03)) *
        (1 - smooth(range(p, B[3].end, B[3].end + 0.03)));
      const show =
        smooth(range(p, B[4].start, B[4].start + 0.02)) *
        (1 - smooth(range(p, B[5].end - 0.02, B[5].end + 0.02)));
      const impurity =
        smooth(range(p, B[1].start - 0.02, B[1].start + 0.025)) *
        (1 - smooth(range(p, B[1].end - 0.02, B[1].end + 0.03)));

      /* ── animated water ── */
      refs.waterMat.uniforms.uTime.value = t;
      refs.waterMat.uniforms.uMurk.value = clamp01(murk * 0.95);
      refs.streamMat.uniforms.uTime.value = t;
      refs.bubbleMat.uniforms.uTime.value = t;
      refs.caustics.material.uniforms.uTime.value = t;
      refs.caustics.material.uniforms.uOpacity.value = 0.2 + 0.32 * (1 - murk);

      // slow hero rotation + subtle float
      const spin = reduceMotion ? 0.35 : 0.35 + t * 0.055;
      purifier.rotation.y = lerp(
        purifier.rotation.y,
        Math.sin(spin) * 0.15 + (p < B[0].end ? Math.sin(t * 0.24) * 0.1 : 0),
        0.05
      );

      // UV tube pulse
      const pulse = 0.85 + Math.sin(t * 3.1) * 0.15;
      refs.uvMat.emissiveIntensity = 2.2 * pulse + pure * 1.1;
      refs.uvLight.intensity = 0.55 * pulse;

      // accent seam glows brighter as the water gets cleaner
      refs.seam.material.emissiveIntensity = 0.9 + (1 - murk) * 1.6;

      // the five stage markers light up one by one during the fly-through
      const stageProgress = range(p, JB.start + jSpan * 0.12, JB.start + jSpan * 0.8);
      refs.stageGroups.forEach((g, i) => {
        const d = g.userData;
        const local = clamp01((stageProgress - i / STAGES.length) * STAGES.length);
        d.shellMat.emissiveIntensity = 0.12 + local * 0.8;
        d.ring.material.emissiveIntensity = 0.5 + local * 1.6;
        d.stageLight.intensity = 0.02 + local * 0.16;
        g.rotation.y = Math.sin(t * 0.35 + i) * 0.12;
      });

      // cutaway — fade the metal shell so the camera can fly inside
      refs.metal.transparent = inside > 0.01;
      refs.metal.opacity = lerp(1, 0.26, inside);
      refs.metal.depthWrite = inside < 0.5;
      refs.metal.side = THREE.DoubleSide;
      refs.tank.visible = true;

      // interior tunnel + light for the stage fly-through
      refs.tunnelMat.uniforms.uTime.value = t;
      refs.tunnelMat.uniforms.uOpacity.value = inside * 0.16;
      refs.tunnel.visible = inside > 0.02;
      refs.interiorLight.intensity = inside * 0.1;

      // splash rings at the tap impact point
      refs.rings.forEach((ring, i) => {
        const phase = (t * 0.85 + i * 0.33) % 1;
        ring.scale.setScalar(0.5 + phase * 5);
        ring.material.opacity = (1 - phase) * 0.4 * (1 - murk * 0.5);
      });

      // droplets — slow motion during the "pure water" hero moment
      const slowmo = pure > 0.35 ? 0.32 : 1;
      const arr = dropGeo.attributes.position.array;
      for (let i = 0; i < dropCount; i++) {
        const d = dropState[i];
        d.life -= dt * d.speed * slowmo;
        if (d.life <= 0) {
          d.life = 1;
          d.x = 0;
          d.y = 0.13;
          d.z = 0.5;
          const a = Math.random() * Math.PI * 2;
          const sp = 0.25 + Math.random() * 0.55;
          d.vx = Math.cos(a) * sp * 0.45;
          d.vy = 0.55 + Math.random() * 0.75;
          d.vz = Math.sin(a) * sp * 0.45;
        }
        d.vy -= 1.6 * dt * slowmo * d.speed;
        d.x += d.vx * dt * slowmo;
        d.y += d.vy * dt * slowmo;
        d.z += d.vz * dt * slowmo;
        if (d.y < 0.05) d.life = 0;
        arr[i * 3] = d.x;
        arr[i * 3 + 1] = d.y;
        arr[i * 3 + 2] = d.z;
      }
      dropGeo.attributes.position.needsUpdate = true;

      // impurities live only in the "problem" chapter
      impMat.uniforms.uTime.value = t;
      impMat.uniforms.uOpacity.value = impurity;
      problemLight.intensity = impurity * 2.6;

      // pure-water light bloom
      pureLight.intensity = pure * 3.4;
      hemi.intensity = 0.3 + pure * 0.5;
      key.intensity = 1.5 + pure * 1.2;
      rim.intensity = 1.5 + pure * 0.7;

      // god rays + anamorphic flare breathe with the light level
      rayMat.uniforms.uTime.value = t;
      rayMat.uniforms.uOpacity.value = 0.035 + pure * 0.075 + (1 - murk) * 0.02;
      rays.rotation.y = t * 0.02;
      flareMat.opacity = 0.07 + pure * 0.18 + Math.sin(t * 1.7) * 0.015;
      flareCore.material.opacity = flareMat.opacity * 1.25;

      // dust motes
      dustMat.uniforms.uTime.value = t;
      dustMat.uniforms.uOpacity.value = 0.2 + pure * 0.35;

      // showroom lineup: fades in for the product scene, highlights the picked model
      showroom.visible = show > 0.02;
      showroomUnits.forEach((u, i) => {
        const target = i === activeModelRef.current ? 1.14 : 0.92;
        u.scale.setScalar(lerp(u.scale.x, 0.62 * target * (0.55 + show * 0.45), 0.08));
        u.position.y = Math.sin(t * 0.7 + i * 1.2) * 0.03;
        u.rotation.y = lerp(u.rotation.y, (i - 1.5) * 0.16 + Math.sin(t * 0.25 + i) * 0.06, 0.05);
      });

      /* ── post-processing uniforms ── */
      if (grade) {
        grade.uniforms.uTime.value = t;
        grade.uniforms.uGrain.value = 0.042 + murk * 0.018;
        grade.uniforms.uAmount.value = 0.65 + (1 - murk) * 0.55;
      }
      if (bokeh) {
        bokeh.uniforms.focus.value = camera.position.distanceTo(tmp.set(0, 1.1, 0));
        bokeh.uniforms.maxblur.value = p > B[6].start ? 0.011 : 0.005;
      }
      if (bloom) bloom.strength = 0.34 + pure * 0.4 + (1 - murk) * 0.06;

      frame += 1;
      if (composer) composer.render();
      else renderer.render(scene, camera);
    }

    // debug handle (used by the QA harness; harmless in production)
    if (typeof window !== 'undefined') {
      window.__aqua = {
        scene, camera, renderer, refs, rays, flareH, flareCore, dust, showroom, purifier, floor, caustics: refs.caustics,
        setProgress(v) {
          if (progressRef) progressRef.current = v;
        },
        sample(x, y) {
          const gl = renderer.getContext();
          const px = new Uint8Array(4);
          if (composer) composer.render(); else renderer.render(scene, camera);
          gl.readPixels(Math.round(x), Math.round(y), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
          return [px[0], px[1], px[2]];
        }
      };
    }

    render();

    /* ── cleanup ───────────────────────────────────────────── */
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('visibilitychange', onVisibility);
      ro.disconnect();

      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => {
            Object.values(m).forEach((v) => {
              if (v && v.isTexture) v.dispose();
            });
            m.dispose();
          });
        }
      });
      envRT.dispose();
      pmrem.dispose();
      composer?.dispose?.();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [progressRef]);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-[100dvh] w-full"
      style={{ contain: 'strict' }}
    />
  );
}
