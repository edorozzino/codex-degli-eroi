// Visualizzatore 3D del personaggio in stile dark fantasy:
// toni desaturati, luce di torcia calda, nebbia fredda, braci, vignettatura e grana.
// Il modello è generato proceduralmente da razza, classe, armatura e caratteristiche.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ARMOR_BY_ID, WEAPON_BY_ID } from './data/glossary.js';

// ---------- Texture procedurali ----------
const texCache = new Map();
function canvasTex(key, size, draw, repeat = 1) {
  if (texCache.has(key)) return texCache.get(key);
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  const g = cv.getContext('2d');
  draw(g, size);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  texCache.set(key, t);
  return t;
}
function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function blotches(g, size, r, alpha, n = 32) {
  const small = document.createElement('canvas'); small.width = small.height = n;
  const sg = small.getContext('2d'); const id = sg.createImageData(n, n);
  for (let i = 0; i < n * n; i++) { const v = r() * 255; id.data.set([v, v, v, 255], i * 4); }
  sg.putImageData(id, 0, 0);
  g.globalAlpha = alpha; g.imageSmoothingEnabled = true; g.globalCompositeOperation = 'overlay';
  g.drawImage(small, 0, 0, size, size); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}
function grain(g, size, r, amount) {
  const id = g.getImageData(0, 0, size, size);
  for (let i = 0; i < id.data.length; i += 4) { const n = (r() - 0.5) * amount; id.data[i] += n; id.data[i + 1] += n; id.data[i + 2] += n; }
  g.putImageData(id, 0, 0);
}
const TEX = {
  skin: () => canvasTex('skin', 256, (g, s) => { const r = rng(7); g.fillStyle = '#bbbbbb'; g.fillRect(0, 0, s, s); blotches(g, s, r, 0.35, 16); grain(g, s, r, 18); }),
  leather: () => canvasTex('leather', 256, (g, s) => {
    const r = rng(11); g.fillStyle = '#8a8a8a'; g.fillRect(0, 0, s, s); blotches(g, s, r, 0.6, 24); grain(g, s, r, 30);
    g.strokeStyle = 'rgba(0,0,0,0.35)'; for (let i = 0; i < 40; i++) { g.lineWidth = r() * 1.5; g.beginPath(); const x = r() * s, y = r() * s; g.moveTo(x, y); g.bezierCurveTo(x + r() * 40 - 20, y + r() * 40, x + r() * 60 - 30, y + r() * 60, x + r() * 80 - 40, y + r() * 80); g.stroke(); }
    g.setLineDash([4, 4]); g.strokeStyle = 'rgba(30,20,10,0.6)'; g.lineWidth = 1.5; [s * 0.1, s * 0.9].forEach(y => { g.beginPath(); g.moveTo(0, y); g.lineTo(s, y); g.stroke(); });
  }, 2),
  metal: () => canvasTex('metal', 256, (g, s) => {
    const r = rng(23); g.fillStyle = '#9a9a9a'; g.fillRect(0, 0, s, s); blotches(g, s, r, 0.5, 12); grain(g, s, r, 22);
    for (let i = 0; i < 160; i++) { g.strokeStyle = `rgba(${r() > 0.5 ? '255,255,255' : '0,0,0'},${0.08 + r() * 0.2})`; g.lineWidth = r() * 1.2; const x = r() * s, y = r() * s, a = r() * Math.PI, l = 5 + r() * 40; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    for (let i = 0; i < 12; i++) { g.fillStyle = `rgba(60,35,15,${0.15 + r() * 0.2})`; g.beginPath(); g.arc(r() * s, r() * s, 3 + r() * 14, 0, 7); g.fill(); }
  }, 1.5),
  chain: () => canvasTex('chain', 128, (g, s) => {
    g.fillStyle = '#222'; g.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 8) for (let x = (y / 8) % 2 ? 4 : 0; x < s; x += 8) { g.strokeStyle = '#b0b0b0'; g.lineWidth = 1.6; g.beginPath(); g.arc(x, y, 3.4, 0, 7); g.stroke(); }
    grain(g, s, rng(3), 30);
  }, 6),
  cloth: () => canvasTex('cloth', 256, (g, s) => {
    const r = rng(5); g.fillStyle = '#a0a0a0'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < s; i += 2) { g.fillStyle = `rgba(0,0,0,${0.06 + r() * 0.06})`; g.fillRect(0, i, s, 1); g.fillRect(i, 0, 1, s); }
    blotches(g, s, r, 0.55, 20); grain(g, s, r, 16);
    for (let i = 0; i < 25; i++) { g.fillStyle = `rgba(40,30,20,${0.08 + r() * 0.15})`; g.beginPath(); g.ellipse(r() * s, s - r() * s * 0.4, 10 + r() * 30, 5 + r() * 15, 0, 0, 7); g.fill(); }
  }, 2),
  fur: () => canvasTex('fur', 256, (g, s) => {
    const r = rng(9); g.fillStyle = '#6a6a6a'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 3000; i++) { const v = 60 + r() * 160; g.strokeStyle = `rgba(${v},${v},${v},0.5)`; g.lineWidth = 1; const x = r() * s, y = r() * s; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 4, y + 6 + r() * 8); g.stroke(); }
  }, 2),
  stone: () => canvasTex('stone', 512, (g, s) => {
    const r = rng(42); g.fillStyle = '#151311'; g.fillRect(0, 0, s, s);
    const n = 9, cs = s / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const v = 55 + r() * 40, ox = (y % 2) * cs / 2;
      g.fillStyle = `rgb(${v},${v * 0.95},${v * 0.88})`;
      const px = x * cs + ox + 3 + r() * 3, py = y * cs + 3 + r() * 3, w = cs - 7 - r() * 4, h = cs - 7 - r() * 4;
      g.beginPath(); g.roundRect ? g.roundRect(px, py, w, h, 8) : g.rect(px, py, w, h); g.fill();
    }
    blotches(g, s, r, 0.5, 32); grain(g, s, r, 26);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(30,40,20,${r() * 0.25})`; g.beginPath(); g.arc(r() * s, r() * s, 4 + r() * 20, 0, 7); g.fill(); }
  }, 4),
};

// ---------- Post processing: grading desaturato + vignettatura + grana ----------
const GradeShader = {
  uniforms: { tDiffuse: { value: null }, time: { value: 0 }, vignette: { value: 1.15 }, sat: { value: 0.72 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float time; uniform float vignette; uniform float sat; varying vec2 vUv;
    float rand(vec2 c){ return fract(sin(dot(c, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      float l = dot(c.rgb, vec3(0.299,0.587,0.114));
      vec3 col = mix(vec3(l), c.rgb, sat);
      // split toning: ombre verde-blu fredde, luci calde ambrate
      col = mix(col * vec3(0.86,0.95,1.02), col * vec3(1.08,0.98,0.84), smoothstep(0.15, 0.75, l));
      col = pow(col, vec3(1.06));
      float d = distance(vUv, vec2(0.5, 0.45));
      col *= smoothstep(0.95, 0.25, d * vignette);
      col += (rand(vUv * 800.0 + time) - 0.5) * 0.018;
      gl_FragColor = vec4(col, c.a);
    }`,
};

// ---------- Helpers geometria ----------
const V = (x, y, z) => new THREE.Vector3(x, y, z);
function limb(a, b, r, mat, rEnd) {
  const dir = new THREE.Vector3().subVectors(b, a); const len = dir.length();
  let geo;
  if (rEnd && rEnd !== r) geo = new THREE.CylinderGeometry(rEnd, r, len, 14, 1);
  else geo = new THREE.CapsuleGeometry(r, Math.max(0.001, len - r * 0.4), 6, 14);
  const m = new THREE.Mesh(geo, mat);
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(V(0, 1, 0), dir.normalize());
  m.castShadow = m.receiveShadow = true;
  return m;
}
function mesh(geo, mat, pos, scale, rot) {
  const m = new THREE.Mesh(geo, mat);
  if (pos) m.position.copy(pos);
  if (scale) m.scale.set(...scale);
  if (rot) m.rotation.set(...rot);
  m.castShadow = m.receiveShadow = true;
  return m;
}
function taperedCurve(points, r0, r1, mat, seg = 10) {
  const curve = new THREE.CatmullRomCurve3(points);
  const g = new THREE.Group();
  for (let i = 0; i < seg; i++) {
    const t0 = i / seg, t1 = (i + 1) / seg;
    const p0 = curve.getPoint(t0), p1 = curve.getPoint(t1);
    const r = r0 + (r1 - r0) * t0, rn = r0 + (r1 - r0) * t1;
    g.add(limb(p0, p1, r, mat, rn));
  }
  return g;
}
const col = (c) => new THREE.Color(c);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Colori di classe (tinte spente, tipiche del dark fantasy)
const CLASS_STYLE = {
  barbaro: { cloth: '#4a3a2a', accent: '#6b2a1f', glow: null, gear: ['fur', 'warpaint'], weapon: 'ascia-bipenne' },
  bardo: { cloth: '#5a2f3a', accent: '#a88a4a', glow: '#e0b060', gear: ['cape', 'hat'], weapon: 'stocco' },
  chierico: { cloth: '#7d7466', accent: '#b8973e', glow: '#ffd27a', gear: ['tabard', 'shield'], weapon: 'mazza' },
  druido: { cloth: '#3b4a2e', accent: '#6b5a33', glow: '#8fe07a', gear: ['cloak', 'antlers'], weapon: 'bastone' },
  guerriero: { cloth: '#3f3a36', accent: '#7a2a24', glow: null, gear: ['shield', 'cape'], weapon: 'spada-lunga' },
  ladro: { cloth: '#26252a', accent: '#4a3f36', glow: null, gear: ['hood', 'cloak', 'mask'], weapon: 'pugnale' },
  mago: { cloth: '#2c3550', accent: '#9a8a5a', glow: '#7ab8ff', gear: ['robe', 'hood'], weapon: 'bastone' },
  monaco: { cloth: '#7a5a2a', accent: '#4a2a1a', glow: null, gear: ['wraps', 'sash'], weapon: 'bastone' },
  paladino: { cloth: '#d8d0c0', accent: '#b8973e', glow: '#ffe7a0', gear: ['tabard', 'shield', 'cape'], weapon: 'spada-lunga' },
  ranger: { cloth: '#34402c', accent: '#5a4632', glow: null, gear: ['hood', 'cloak', 'quiver'], weapon: 'arco-lungo' },
  stregone: { cloth: '#5a1f1f', accent: '#c07a2a', glow: '#ff7a3a', gear: ['robe'], weapon: 'pugnale' },
  warlock: { cloth: '#1f1a26', accent: '#4a2a5a', glow: '#b07aff', gear: ['robe', 'hood', 'cloak'], weapon: 'pugnale' },
};

function weaponKind(id) {
  if (!id) return null;
  if (/spada|stocco|scimitarra|spadone/.test(id)) return id === 'spadone' ? 'greatsword' : 'sword';
  if (/ascia|falcione|alabarda/.test(id)) return id === 'ascia-bipenne' || id === 'alabarda' || id === 'falcione' ? 'greataxe' : 'axe';
  if (/mazza|morning|mazzafrusto|martello|maglio|randello/.test(id)) return /maglio|martello-guerra/.test(id) ? 'hammer' : 'mace';
  if (/bastone/.test(id)) return 'staff';
  if (/arco/.test(id)) return 'bow';
  if (/balestra/.test(id)) return 'crossbow';
  if (/lancia|picca|tridente|giavellotto/.test(id)) return 'spear';
  if (/pugnale|falcetto|dardo/.test(id)) return 'dagger';
  return 'sword';
}

function buildWeapon(kind, mats, accent) {
  const g = new THREE.Group();
  const wood = mats.wood, metal = mats.metal, leather = mats.leather;
  if (kind === 'sword' || kind === 'greatsword') {
    const L = kind === 'greatsword' ? 1.1 : 0.8;
    g.add(mesh(new THREE.BoxGeometry(0.045, L, 0.008), metal, V(0, L / 2 + 0.12, 0)));
    g.add(mesh(new THREE.ConeGeometry(0.032, 0.08, 4), metal, V(0, L + 0.16, 0), [1, 1, 0.25], [0, Math.PI / 4, 0]));
    g.add(mesh(new THREE.BoxGeometry(0.2, 0.025, 0.035), metal, V(0, 0.12, 0)));
    g.add(mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.16, 8), leather, V(0, 0.03, 0)));
    g.add(mesh(new THREE.SphereGeometry(0.028, 10, 8), metal, V(0, -0.06, 0)));
  } else if (kind === 'axe' || kind === 'greataxe') {
    const L = kind === 'greataxe' ? 1.1 : 0.6;
    g.add(mesh(new THREE.CylinderGeometry(0.02, 0.024, L, 8), wood, V(0, L / 2 - 0.1, 0)));
    const head = new THREE.Shape(); head.moveTo(0, -0.08); head.quadraticCurveTo(0.2, -0.16, 0.24, -0.02); head.quadraticCurveTo(0.26, 0.1, 0.22, 0.16); head.quadraticCurveTo(0.12, 0.06, 0, 0.06);
    const hg = new THREE.ExtrudeGeometry(head, { depth: 0.015, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.004, bevelSegments: 1 });
    const h1 = mesh(hg, metal, V(0.01, L - 0.18, -0.008)); g.add(h1);
    if (kind === 'greataxe') { const h2 = mesh(hg, metal, V(-0.01, L - 0.18, 0.008), null, [0, Math.PI, 0]); g.add(h2); }
  } else if (kind === 'mace' || kind === 'hammer') {
    g.add(mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.6, 8), wood, V(0, 0.2, 0)));
    if (kind === 'mace') {
      g.add(mesh(new THREE.SphereGeometry(0.06, 10, 8), metal, V(0, 0.52, 0)));
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.add(mesh(new THREE.BoxGeometry(0.012, 0.1, 0.05), metal, V(Math.cos(a) * 0.05, 0.52, Math.sin(a) * 0.05), null, [0, -a, 0])); }
    } else g.add(mesh(new THREE.BoxGeometry(0.22, 0.1, 0.1), metal, V(0, 0.52, 0)));
  } else if (kind === 'staff') {
    g.add(taperedCurve([V(0, -0.7, 0), V(0.01, 0, 0.01), V(-0.01, 0.6, 0), V(0.03, 0.85, 0.02)], 0.022, 0.016, wood, 6));
    if (accent) {
      const crystal = mesh(new THREE.OctahedronGeometry(0.05), new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 2.2, roughness: 0.2 }), V(0.03, 0.95, 0.02), [0.7, 1.4, 0.7]);
      crystal.userData.pulse = true; g.add(crystal);
      const pl = new THREE.PointLight(accent, 0.8, 2.2, 2); pl.position.copy(crystal.position); pl.userData.pulse = true; g.add(pl);
    }
  } else if (kind === 'bow') {
    const curve = new THREE.QuadraticBezierCurve3(V(0, -0.7, 0), V(0, 0, 0.32), V(0, 0.7, 0));
    g.add(mesh(new THREE.TubeGeometry(curve, 20, 0.014, 6), wood));
    g.add(limb(V(0, -0.7, 0), V(0, 0.7, 0), 0.002, mats.string));
  } else if (kind === 'crossbow') {
    g.add(mesh(new THREE.BoxGeometry(0.05, 0.5, 0.05), wood, V(0, 0.1, 0)));
    g.add(mesh(new THREE.TorusGeometry(0.22, 0.012, 6, 20, Math.PI), wood, V(0, 0.3, 0.02), null, [Math.PI / 2, 0, 0]));
  } else if (kind === 'spear') {
    g.add(mesh(new THREE.CylinderGeometry(0.018, 0.02, 1.7, 8), wood, V(0, 0.35, 0)));
    g.add(mesh(new THREE.ConeGeometry(0.035, 0.22, 4), metal, V(0, 1.3, 0), [1, 1, 0.35]));
  } else if (kind === 'dagger') {
    g.add(mesh(new THREE.BoxGeometry(0.035, 0.24, 0.006), metal, V(0, 0.2, 0)));
    g.add(mesh(new THREE.ConeGeometry(0.025, 0.06, 4), metal, V(0, 0.35, 0), [1, 1, 0.25], [0, Math.PI / 4, 0]));
    g.add(mesh(new THREE.BoxGeometry(0.1, 0.018, 0.025), metal, V(0, 0.08, 0)));
    g.add(mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.1, 8), leather, V(0, 0.02, 0)));
  }
  return g;
}

// ---------- Costruzione del personaggio ----------
export function buildCharacter(c, d) {
  const root = new THREE.Group();
  const app = c.appearance || {};
  const race = d.race || {}; const sub = d.sub || {};
  const feats = race.features || {};
  const firstClass = c.classes[0]?.id || 'guerriero';
  const style = CLASS_STYLE[firstClass] || CLASS_STYLE.guerriero;
  const casterGlow = c.classes.map(x => CLASS_STYLE[x.id]?.glow).find(Boolean);
  const armor = ARMOR_BY_ID[c.armorId] || ARMOR_BY_ID.nessuna;
  const s = d.scores;

  // Influenza delle caratteristiche sul fisico
  const muscle = clamp(0.85 + (s.str - 10) * 0.035, 0.75, 1.45);
  const girth = clamp(0.9 + (s.con - 10) * 0.03, 0.8, 1.35) * (race.build || 1) ** 0.5;
  const lean = clamp(1 - (s.dex - 10) * 0.012, 0.85, 1.1);
  const posture = clamp((s.cha - 10) * 0.012, -0.08, 0.1);
  const small = race.size === 'Piccola';
  const headScale = small ? 1.25 : race.id === 'nano' ? 1.12 : 1;

  const skinColor = app.skin || sub.skin || race.skin || '#c9a184';
  const mats = {
    skin: new THREE.MeshStandardMaterial({ color: col(skinColor), map: TEX.skin(), roughness: 0.62, metalness: 0, bumpMap: TEX.skin(), bumpScale: 0.6 }),
    hair: new THREE.MeshStandardMaterial({ color: col(app.hair || '#2a1d14'), map: TEX.fur(), roughness: 0.8 }),
    cloth: new THREE.MeshStandardMaterial({ color: col(style.cloth), map: TEX.cloth(), roughness: 0.92, bumpMap: TEX.cloth(), bumpScale: 1.2, side: THREE.DoubleSide }),
    accent: new THREE.MeshStandardMaterial({ color: col(style.accent), map: TEX.cloth(), roughness: 0.85, side: THREE.DoubleSide }),
    cloak: new THREE.MeshStandardMaterial({ color: col(app.cloak || '#3a2a1f'), map: TEX.cloth(), roughness: 0.95, bumpMap: TEX.cloth(), bumpScale: 1.5, side: THREE.DoubleSide }),
    leather: new THREE.MeshStandardMaterial({ color: col('#5a3e28'), map: TEX.leather(), roughness: 0.72, bumpMap: TEX.leather(), bumpScale: 1.4 }),
    darkLeather: new THREE.MeshStandardMaterial({ color: col('#2e2219'), map: TEX.leather(), roughness: 0.7, bumpMap: TEX.leather(), bumpScale: 1.4 }),
    metal: new THREE.MeshStandardMaterial({ color: col(app.metal || '#8a8f94'), map: TEX.metal(), roughness: 0.42, metalness: 0.85, bumpMap: TEX.metal(), bumpScale: 0.8 }),
    chain: new THREE.MeshStandardMaterial({ color: col('#9a9a9a'), map: TEX.chain(), roughness: 0.45, metalness: 0.8, bumpMap: TEX.chain(), bumpScale: 2 }),
    gold: new THREE.MeshStandardMaterial({ color: col('#a8843a'), map: TEX.metal(), roughness: 0.35, metalness: 0.9 }),
    wood: new THREE.MeshStandardMaterial({ color: col('#4a3220'), map: TEX.leather(), roughness: 0.8 }),
    fur: new THREE.MeshStandardMaterial({ color: col('#5d5040'), map: TEX.fur(), roughness: 1, bumpMap: TEX.fur(), bumpScale: 3 }),
    bone: new THREE.MeshStandardMaterial({ color: col('#d8ccb0'), roughness: 0.55 }),
    eye: new THREE.MeshStandardMaterial({ color: col(app.eyes || '#6aa0c8'), emissive: col(app.eyes || '#6aa0c8'), emissiveIntensity: app.glow && (race.id === 'tiefling' || race.id === 'drow' || sub.id === 'drow') ? 1.6 : 0.25, roughness: 0.2 }),
    string: new THREE.MeshBasicMaterial({ color: '#ccc' }),
    dark: new THREE.MeshStandardMaterial({ color: '#111', roughness: 0.9 }),
  };

  const body = new THREE.Group(); root.add(body);
  const sh = 0.21 * muscle * lean;   // semi-larghezza spalle
  const hip = 0.14 * girth;
  const hipY = 0.95, chestY = 1.3, neckY = 1.5, headY = 1.64;

  // Bacino e torso
  const pelvis = mesh(new THREE.SphereGeometry(0.16, 20, 14), mats.cloth, V(0, hipY, 0), [hip / 0.16 * 1.05, 0.8, 0.85 * girth]);
  body.add(pelvis);
  const torsoGeo = new THREE.LatheGeometry([V(0.001, 0), V(0.15, 0.02), V(0.16, 0.12), V(0.19, 0.25), V(0.21, 0.36), V(0.19, 0.44), V(0.08, 0.5), V(0.001, 0.51)].map(p => new THREE.Vector2(p.x, p.y)), 24);
  const torsoMat = armor.type === 'pesante' || (armor.type === 'media' && /corazza|mezza/.test(armor.id)) ? mats.metal : armor.type === 'media' ? mats.chain : armor.type === 'leggera' ? mats.leather : (style.gear.includes('fur') ? mats.skin : mats.cloth);
  const torso = mesh(torsoGeo, torsoMat, V(0, hipY + 0.02, 0), [sh / 0.21 * 0.95, 1, 0.72 * girth]);
  torso.rotation.x = -posture;
  body.add(torso);
  // Collo e testa
  body.add(limb(V(0, neckY - 0.05, 0), V(0, neckY + 0.07, 0.01), 0.055 * muscle ** 0.5, mats.skin));
  const head = new THREE.Group(); head.position.set(0, headY, 0.01); head.scale.setScalar(headScale); body.add(head);
  buildHead(head, mats, race, feats, app, c);

  // Braccia
  const armR = 0.05 * muscle, foreR = 0.042 * muscle;
  for (const side of [-1, 1]) {
    const shoulder = V(side * sh, 1.43, 0);
    const elbow = V(side * (sh + 0.06), 1.15, -0.02);
    const wrist = V(side * (sh + 0.08), 0.9, 0.06);
    const bareArms = style.gear.includes('fur') || style.gear.includes('wraps');
    const sleeve = armor.type === 'pesante' ? mats.metal : armor.type === 'media' ? mats.chain : bareArms ? mats.skin : mats.cloth;
    body.add(limb(shoulder, elbow, armR, sleeve));
    body.add(limb(elbow, wrist, foreR, bareArms || armor.type === 'leggera' ? mats.skin : sleeve));
    body.add(mesh(new THREE.SphereGeometry(0.042 * muscle ** 0.5, 10, 8), armor.type === 'pesante' ? mats.metal : mats.skin, V(wrist.x, wrist.y - 0.05, wrist.z), [0.8, 1.2, 0.6]));
    // Spallacci e bracciali
    if (armor.type === 'pesante' || armor.type === 'media') {
      body.add(mesh(new THREE.SphereGeometry(0.09 * muscle, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), mats.metal, V(side * (sh + 0.01), 1.45, 0), [1.15, 0.8, 1.1], [0, 0, -side * 0.35]));
      body.add(mesh(new THREE.SphereGeometry(0.075 * muscle, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), mats.metal, V(side * (sh + 0.02), 1.41, 0), [1.1, 0.7, 1.05], [0, 0, -side * 0.5]));
    } else if (armor.type === 'leggera') {
      body.add(mesh(new THREE.SphereGeometry(0.075 * muscle, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mats.leather, V(side * sh, 1.44, 0), [1.1, 0.7, 1], [0, 0, -side * 0.35]));
    }
    if (armor.type !== 'nessuna' || style.gear.includes('wraps')) body.add(limb(V(wrist.x, wrist.y + 0.13, wrist.z - 0.02), V(wrist.x, wrist.y + 0.01, wrist.z), foreR * 1.15, style.gear.includes('wraps') ? mats.cloth : mats.darkLeather, foreR * 1.25));
  }

  // Gambe
  const legR = 0.068 * girth ** 0.7 * muscle ** 0.3;
  for (const side of [-1, 1]) {
    const hipJ = V(side * hip * 0.6, hipY - 0.03, 0);
    const knee = V(side * hip * 0.62, 0.5, 0.03);
    const ankle = V(side * hip * 0.6, 0.1, 0);
    const legMat = armor.type === 'pesante' ? mats.metal : armor.type === 'leggera' || armor.type === 'media' ? mats.darkLeather : mats.cloth;
    body.add(limb(hipJ, knee, legR, legMat));
    body.add(limb(knee, ankle, legR * 0.8, armor.type === 'pesante' ? mats.metal : mats.cloth));
    if (armor.type === 'pesante') body.add(mesh(new THREE.SphereGeometry(legR * 0.9, 10, 8), mats.metal, V(knee.x, knee.y, knee.z + 0.03), [1, 0.9, 0.8]));
    // stivali
    body.add(limb(V(ankle.x, 0.26, ankle.z), V(ankle.x, 0.06, ankle.z), legR * 0.95, armor.type === 'pesante' ? mats.metal : mats.darkLeather, legR * 1.05));
    body.add(mesh(new THREE.BoxGeometry(legR * 1.7, 0.07, 0.24), armor.type === 'pesante' ? mats.metal : mats.darkLeather, V(ankle.x, 0.035, 0.05)));
  }

  // Cintura
  body.add(mesh(new THREE.TorusGeometry(0.155, 0.022, 6, 24), mats.darkLeather, V(0, hipY + 0.07, 0), [hip / 0.14, 0.72 * girth / 0.72 * 0.75 + 0.25, 1], [Math.PI / 2, 0, 0]));
  body.add(mesh(new THREE.BoxGeometry(0.06, 0.05, 0.02), mats.gold, V(0, hipY + 0.07, 0.15 * girth * 0.8)));

  // ---- Equipaggiamento di classe ----
  const gear = new Set(style.gear);
  const torsoW = sh * 0.95, torsoD = 0.16 * girth;
  if (gear.has('robe')) {
    const robe = mesh(new THREE.CylinderGeometry(hip * 1.15, hip * 2.1, hipY - 0.02, 20, 3, true), mats.cloth, V(0, (hipY) / 2 + 0.02, 0), [1, 1, 0.85]);
    body.add(robe);
    body.add(mesh(new THREE.CylinderGeometry(hip * 2.1 + 0.005, hip * 2.1 + 0.005, 0.05, 20, 1, true), mats.accent, V(0, 0.045, 0), [1, 1, 0.85]));
  }
  if (gear.has('tabard') || (armor.type === 'pesante' && firstClass !== 'barbaro')) {
    const tab = mesh(new THREE.PlaneGeometry(0.2, 0.75, 1, 6), mats.accent.clone(), V(0, 1.0, torsoD + 0.06));
    tab.material.color = col(style.cloth); tab.rotation.x = 0.05; body.add(tab);
    const back = tab.clone(); back.position.z = -torsoD - 0.05; back.rotation.x = -0.05; body.add(back);
    if (gear.has('tabard')) body.add(mesh(new THREE.TorusGeometry(0.035, 0.008, 6, 16), mats.gold, V(0, 1.2, torsoD + 0.07)));
  }
  if (gear.has('fur')) {
    const mantle = mesh(new THREE.TorusGeometry(sh * 0.8, 0.07, 10, 24), mats.fur, V(0, 1.46, -0.01), [1, 0.75 * girth + 0.2, 1], [Math.PI / 2, 0, 0]);
    body.add(mantle);
    body.add(mesh(new THREE.CylinderGeometry(hip * 1.2, hip * 1.5, 0.35, 16, 1, true), mats.fur, V(0, hipY - 0.12, 0), [1, 1, 0.85]));
  }
  if (gear.has('sash')) {
    body.add(mesh(new THREE.TorusGeometry(0.16, 0.03, 6, 20), mats.accent, V(0, hipY + 0.1, 0), [hip / 0.14, 0.8, 1], [Math.PI / 2, 0, 0]));
    body.add(mesh(new THREE.PlaneGeometry(0.06, 0.3), mats.accent, V(0.08, hipY - 0.08, 0.13), null, [0, 0, 0.1]));
  }
  if (gear.has('cloak') || gear.has('cape')) {
    const len = gear.has('cape') ? 1.0 : 1.25;
    const geo = new THREE.CylinderGeometry(sh * 0.95, sh * 1.6, len, 18, 8, true, Math.PI * 0.55, Math.PI * 0.9);
    // ondulazione delle pieghe
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i); const a = Math.atan2(p.getZ(i), p.getX(i)); const k = (0.5 - y / len); p.setX(i, p.getX(i) + Math.sin(a * 9) * 0.012 * k); p.setZ(i, p.getZ(i) + Math.cos(a * 9) * 0.012 * k); }
    geo.computeVertexNormals();
    const cloak = mesh(geo, mats.cloak, V(0, 1.47 - len / 2, -0.04), [1, 1, 0.85 * girth]);
    cloak.userData.sway = true; body.add(cloak);
    if (s.cha >= 14) body.add(mesh(new THREE.CylinderGeometry(sh * 1.6 + 0.003, sh * 1.6 + 0.003, 0.03, 18, 1, true, Math.PI * 0.55, Math.PI * 0.9), mats.gold, V(0, 1.47 - len + 0.015, -0.04), [1, 1, 0.85 * girth]));
    body.add(mesh(new THREE.SphereGeometry(0.025, 8, 6), mats.gold, V(-sh * 0.55, 1.47, torsoD * 0.9)));
    body.add(mesh(new THREE.SphereGeometry(0.025, 8, 6), mats.gold, V(sh * 0.55, 1.47, torsoD * 0.9)));
  }
  if (gear.has('hood')) {
    const hood = mesh(new THREE.SphereGeometry(0.15, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.62), gear.has('robe') ? mats.cloth : mats.cloak, V(0, headY + 0.03 * headScale, -0.015), [headScale, headScale * 1.12, headScale * 1.12], [-0.25, 0, 0]);
    body.add(hood);
    body.add(mesh(new THREE.SphereGeometry(0.155, 18, 10, Math.PI * 0.15, Math.PI * 0.7, Math.PI * 0.45, Math.PI * 0.45), gear.has('robe') ? mats.cloth : mats.cloak, V(0, headY - 0.03, -0.03), [headScale * 1.05, headScale, headScale * 0.9], [0, Math.PI, 0]));
  }
  if (gear.has('mask')) head.add(mesh(new THREE.CylinderGeometry(0.1, 0.095, 0.07, 16, 1, true, -Math.PI * 0.45, Math.PI * 0.9), mats.dark, V(0, -0.05, 0.005), [1, 1, 1.05]));
  if (gear.has('antlers')) {
    for (const side of [-1, 1]) {
      head.add(taperedCurve([V(side * 0.06, 0.08, 0), V(side * 0.12, 0.17, -0.02), V(side * 0.15, 0.3, -0.05)], 0.012, 0.004, mats.wood, 4));
      head.add(taperedCurve([V(side * 0.12, 0.17, -0.02), V(side * 0.2, 0.22, -0.02)], 0.008, 0.003, mats.wood, 2));
    }
    head.add(mesh(new THREE.TorusGeometry(0.105, 0.008, 6, 20), mats.wood, V(0, 0.05, 0), [1, 1, 1], [Math.PI / 2 - 0.15, 0, 0]));
  }
  if (gear.has('hat')) {
    head.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.012, 24), mats.accent, V(0, 0.1, 0)));
    head.add(mesh(new THREE.CylinderGeometry(0.085, 0.105, 0.1, 18), mats.accent, V(0, 0.15, 0)));
    head.add(mesh(new THREE.ConeGeometry(0.015, 0.28, 6), mats.gold, V(0.08, 0.25, -0.05), null, [0.4, 0, -0.6]));
  }
  if (gear.has('quiver')) {
    const q = mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.5, 10), mats.leather, V(0.08, 1.25, -torsoD - 0.08), null, [0.25, 0, -0.35]);
    body.add(q);
    for (let i = 0; i < 5; i++) body.add(mesh(new THREE.ConeGeometry(0.012, 0.06, 4), mats.cloak, V(0.15 + i * 0.012, 1.52 + (i % 2) * 0.02, -torsoD - 0.16 + i * 0.01), null, [0.25, 0, -0.35]));
  }
  if (gear.has('warpaint')) head.add(mesh(new THREE.BoxGeometry(0.18, 0.025, 0.01), new THREE.MeshStandardMaterial({ color: '#5a1410', roughness: 1 }), V(0, 0.01, 0.105)));

  // Armi: prima arma in scheda o arma tipica della classe
  const wId = c.weapons?.[0]?.weaponId || style.weapon;
  const wk = weaponKind(wId);
  const rightHand = V(sh + 0.09, 0.85, 0.07);
  if (wk) {
    const w = buildWeapon(wk, mats, wk === 'staff' ? casterGlow : null);
    if (wk === 'bow') { w.position.set(-(sh + 0.1), 0.95, 0.12); w.rotation.set(0, Math.PI / 2, 0.1); }
    else if (wk === 'staff' || wk === 'spear') { w.position.copy(rightHand).add(V(0.01, 0.0, 0.02)); w.rotation.set(0.05, 0, -0.05); }
    else if (wk === 'greataxe' || wk === 'greatsword') { w.position.set(0.05, 1.0, -torsoD - 0.1); w.rotation.set(0, 0, 2.5); }
    else { w.position.copy(rightHand).add(V(0, 0.02, 0.02)); w.rotation.set(Math.PI - 0.15, 0, 0.05); }
    body.add(w);
  }
  if (c.shield || gear.has('shield') && c.shield !== false && armor.type !== 'nessuna') {
    const shield = new THREE.Group();
    shield.add(mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.03, 28), mats.wood, null, [1, 1, 1], [Math.PI / 2, 0, 0]));
    shield.add(mesh(new THREE.TorusGeometry(0.24, 0.015, 6, 28), mats.metal));
    shield.add(mesh(new THREE.SphereGeometry(0.06, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), mats.metal, V(0, 0, 0.015), null, [Math.PI / 2, 0, 0]));
    const em = mesh(new THREE.CircleGeometry(0.16, 24), mats.accent, V(0, 0, 0.017)); em.material = mats.accent.clone(); em.material.color = col(style.accent); shield.add(em);
    shield.position.set(-(sh + 0.15), 1.0, 0.05); shield.rotation.set(0, -Math.PI / 2 + 0.35, 0);
    body.add(shield);
  }
  // Magia nelle mani per incantatori senza bastone
  if (casterGlow && wk !== 'staff') {
    const orb = mesh(new THREE.IcosahedronGeometry(0.035, 1), new THREE.MeshStandardMaterial({ color: casterGlow, emissive: casterGlow, emissiveIntensity: 3, transparent: true, opacity: 0.85 }), V(-(sh + 0.09), 0.88, 0.14));
    orb.userData.pulse = true; orb.userData.float = true; body.add(orb);
    const pl = new THREE.PointLight(casterGlow, 0.7, 2, 2); pl.position.copy(orb.position); pl.userData.pulse = true; body.add(pl);
  }
  // Coda tiefling
  if (feats.tail) body.add(taperedCurve([V(0, 0.9, -0.12), V(0.05, 0.6, -0.3), V(0.18, 0.25, -0.35), V(0.3, 0.12, -0.2)], 0.03, 0.008, mats.skin, 12));

  // Scala per razza (altezza) e massa
  const H = (race.height || 1.75) / 1.75;
  const build = race.build || 1;
  const k = small ? 0.9 : 1;
  root.scale.set(H * Math.sqrt(build) * k + (small ? 0.1 : 0), H, H * Math.sqrt(build) * k + (small ? 0.1 : 0));
  root.userData.height = race.height || 1.75;
  root.userData.body = body; root.userData.head = head;
  return { root, mats };
}

function buildHead(head, mats, race, feats, app, c) {
  const skin = mats.skin;
  if (feats.dragonHead) {
    head.add(mesh(new THREE.SphereGeometry(0.11, 18, 14), skin, V(0, 0.01, -0.01), [0.95, 1, 1.05]));
    head.add(mesh(new THREE.BoxGeometry(0.11, 0.08, 0.16), skin, V(0, -0.03, 0.11), [1, 1, 1]));
    head.add(mesh(new THREE.ConeGeometry(0.055, 0.08, 6), skin, V(0, -0.04, 0.2), [1, 0.7, 1], [Math.PI / 2, 0, 0]));
    head.add(mesh(new THREE.BoxGeometry(0.1, 0.03, 0.14), skin, V(0, -0.08, 0.09)));
    for (const sd of [-1, 1]) {
      head.add(mesh(new THREE.SphereGeometry(0.016, 8, 6), mats.eye, V(sd * 0.05, 0.02, 0.085)));
      head.add(taperedCurve([V(sd * 0.05, 0.07, -0.05), V(sd * 0.08, 0.12, -0.15), V(sd * 0.07, 0.13, -0.25)], 0.022, 0.004, mats.bone, 6));
      for (let i = 0; i < 3; i++) head.add(mesh(new THREE.ConeGeometry(0.012, 0.06, 4), mats.bone, V(sd * 0.09, -0.02 - i * 0.03, -0.04 - i * 0.02), null, [0, 0, sd * -1.6]));
    }
    return;
  }
  // cranio + mascella
  head.add(mesh(new THREE.SphereGeometry(0.105, 22, 18), skin, V(0, 0.01, 0), [0.88, 1.05, 1]));
  const jawW = race.id === 'mezzorco' || race.id === 'nano' ? 1.08 : race.id === 'elfo' ? 0.8 : 0.92;
  head.add(mesh(new THREE.SphereGeometry(0.085, 18, 14), skin, V(0, -0.05, 0.022), [jawW, 0.85, 0.95]));
  // naso
  const nose = feats.bigNose ? 1.8 : race.id === 'mezzorco' ? 1.3 : 1;
  head.add(mesh(new THREE.ConeGeometry(0.016 * nose, 0.05 * nose, 6), skin, V(0, -0.015, 0.105), null, [Math.PI / 2 - 0.4, 0, 0]));
  // sopracciglia (arcata) e occhi
  head.add(mesh(new THREE.BoxGeometry(0.15, 0.022, 0.03), skin, V(0, 0.035, 0.085), null, [0.2, 0, 0]));
  for (const sd of [-1, 1]) {
    head.add(mesh(new THREE.SphereGeometry(0.013, 10, 8), mats.eye, V(sd * 0.036, 0.015, 0.087)));
    head.add(mesh(new THREE.BoxGeometry(0.04, 0.008, 0.01), mats.hair, V(sd * 0.038, 0.045, 0.098), null, [0, 0, sd * -0.15]));
    // orecchie
    if (feats.pointyEars) {
      const L = feats.smallEars ? 0.06 : 0.1;
      head.add(mesh(new THREE.ConeGeometry(0.02, L, 5), skin, V(sd * 0.095, 0.02 + L * 0.25, -0.01), [0.5, 1, 1], [0.2, 0, sd * -1.0]));
    } else head.add(mesh(new THREE.SphereGeometry(0.022, 8, 6), skin, V(sd * 0.093, 0.0, -0.005), [0.5, 1, 0.8]));
  }
  // bocca
  head.add(mesh(new THREE.BoxGeometry(0.04, 0.005, 0.01), new THREE.MeshStandardMaterial({ color: '#4a2520', roughness: 0.8 }), V(0, -0.06, 0.098)));
  if (feats.tusks) for (const sd of [-1, 1]) head.add(mesh(new THREE.ConeGeometry(0.008, 0.035, 6), mats.bone, V(sd * 0.025, -0.055, 0.095), null, [0, 0, sd * 0.15]));
  if (feats.horns) for (const sd of [-1, 1]) head.add(taperedCurve([V(sd * 0.05, 0.08, 0.02), V(sd * 0.1, 0.16, -0.02), V(sd * 0.13, 0.17, -0.1), V(sd * 0.12, 0.12, -0.16)], 0.022, 0.004, mats.dark, 10));
  if (app.scar) head.add(mesh(new THREE.BoxGeometry(0.004, 0.07, 0.006), new THREE.MeshStandardMaterial({ color: '#7a3a34', roughness: 0.5 }), V(0.04, 0.01, 0.098), null, [0, 0, 0.3]));
  // capelli
  const style = app.hairStyle || 'corti';
  if (style !== 'calvo') {
    head.add(mesh(new THREE.SphereGeometry(0.11, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), mats.hair, V(0, 0.018, -0.008), [0.92, 1.05, 1.04], [-0.25, 0, 0]));
    if (style === 'lunghi') head.add(mesh(new THREE.CylinderGeometry(0.095, 0.08, 0.28, 16, 1, true, Math.PI * 0.5, Math.PI), mats.hair, V(0, -0.1, -0.025), [1, 1, 0.9], [0.1, 0, 0]));
    if (style === 'coda') head.add(taperedCurve([V(0, 0.03, -0.1), V(0, -0.05, -0.14), V(0, -0.2, -0.15), V(0, -0.3, -0.13)], 0.03, 0.012, mats.hair, 8));
    if (style === 'treccia') for (let i = 0; i < 7; i++) head.add(mesh(new THREE.SphereGeometry(0.026 - i * 0.002, 8, 6), mats.hair, V(0, -0.02 - i * 0.045, -0.12 - Math.sin(i * 0.5) * 0.02)));
    if (style === 'cresta') for (let i = 0; i < 6; i++) head.add(mesh(new THREE.ConeGeometry(0.018, 0.07, 5), mats.hair, V(0, 0.11 - i * 0.012, 0.04 - i * 0.03), null, [-0.3 - i * 0.2, 0, 0]));
  }
  if (app.beard || feats.beard) {
    const big = feats.beard ? 1.5 : 1;
    head.add(mesh(new THREE.SphereGeometry(0.07, 14, 10, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.65), mats.hair, V(0, -0.06, 0.035), [1.2, 1.1 * big, 1]));
    if (feats.beard) head.add(mesh(new THREE.ConeGeometry(0.05, 0.14, 10), mats.hair, V(0, -0.16, 0.06), [1, 1, 0.7], [Math.PI + 0.15, 0, 0]));
    head.add(mesh(new THREE.TorusGeometry(0.02, 0.008, 6, 12, Math.PI), mats.hair, V(0, -0.04, 0.1), null, [0, 0, Math.PI]));
  }
}

// ---------- Scena ----------
export function createViewer(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.35;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0b0d10');
  scene.fog = new THREE.FogExp2('#14181d', 0.11);

  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 60);
  camera.position.set(1.4, 1.45, 3.6);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.0, 0); controls.enableDamping = true; controls.minDistance = 1.2; controls.maxDistance = 7;
  controls.maxPolarAngle = Math.PI * 0.52; controls.autoRotate = true; controls.autoRotateSpeed = 0.6;

  // Luci: chiave lunare fredda, torcia calda tremolante, controluce
  scene.add(new THREE.HemisphereLight('#6a7a90', '#2a1c10', 0.9));
  const fill = new THREE.SpotLight('#ffd6a8', 18, 9, 0.6, 0.6, 1.6); fill.position.set(-1.2, 2.6, 2.8); fill.target.position.set(0, 1, 0); fill.castShadow = true; fill.shadow.mapSize.set(1024, 1024); scene.add(fill, fill.target);
  const moon = new THREE.DirectionalLight('#9fb4d6', 1.6); moon.position.set(-3, 5, 2); moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024); moon.shadow.camera.left = -2; moon.shadow.camera.right = 2; moon.shadow.camera.top = 3; moon.shadow.camera.bottom = -1; moon.shadow.bias = -0.0005;
  scene.add(moon);
  const torch = new THREE.PointLight('#ff8a3a', 20, 8, 2); torch.position.set(1.6, 1.7, 1.2); torch.castShadow = true; torch.shadow.mapSize.set(512, 512); scene.add(torch);
  const rim = new THREE.DirectionalLight('#8fb0e0', 3.2); rim.position.set(0.5, 2.5, -4); scene.add(rim);

  // Braciere con fiamma
  const brazier = new THREE.Group(); brazier.position.set(1.6, 0, 1.2);
  const iron = new THREE.MeshStandardMaterial({ color: '#2a2622', map: TEX.metal(), roughness: 0.6, metalness: 0.7 });
  brazier.add(mesh(new THREE.CylinderGeometry(0.2, 0.12, 0.18, 12, 1, true), iron, V(0, 1.12, 0)));
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; brazier.add(limb(V(Math.cos(a) * 0.15, 1.05, Math.sin(a) * 0.15), V(Math.cos(a) * 0.28, 0, Math.sin(a) * 0.28), 0.015, iron)); }
  const flameMat = new THREE.MeshBasicMaterial({ color: '#ffb060', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  const flames = [];
  for (let i = 0; i < 5; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.07 - i * 0.008, 0.3 - i * 0.03, 8), flameMat.clone()); f.position.set((Math.random() - 0.5) * 0.1, 1.32, (Math.random() - 0.5) * 0.1); f.material.color.setHSL(0.07 + i * 0.01, 1, 0.55); brazier.add(f); flames.push(f); }
  scene.add(brazier);

  // Pavimento di pietra con detriti
  const stone = TEX.stone();
  const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 48), new THREE.MeshStandardMaterial({ color: '#777', map: stone, bumpMap: stone, bumpScale: 4, roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const rockMat = new THREE.MeshStandardMaterial({ color: '#3a3632', map: stone, roughness: 1 });
  for (let i = 0; i < 14; i++) { const a = Math.random() * Math.PI * 2, r = 1.8 + Math.random() * 3; const rk = mesh(new THREE.DodecahedronGeometry(0.1 + Math.random() * 0.35, 0), rockMat, V(Math.cos(a) * r, 0.05, Math.sin(a) * r - 1), [1, 0.6, 1], [Math.random(), Math.random(), 0]); scene.add(rk); }
  // colonne in rovina sullo sfondo
  for (const [x, z, h] of [[-2.2, -2.5, 3.2], [2.6, -3, 1.6], [-3.5, 0.5, 2.2]]) {
    const colm = mesh(new THREE.CylinderGeometry(0.28, 0.32, h, 12), rockMat, V(x, h / 2, z)); scene.add(colm);
  }

  // Braci e polvere
  const N = 260; const pg = new THREE.BufferGeometry(); const pos = new Float32Array(N * 3); const spd = new Float32Array(N);
  for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * 5; pos[i * 3 + 1] = Math.random() * 3.5; pos[i * 3 + 2] = (Math.random() - 0.5) * 5; spd[i] = 0.1 + Math.random() * 0.35; }
  pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const sprite = canvasTex('ember', 64, (g, s) => { const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(255,220,160,1)'); gr.addColorStop(0.3, 'rgba(255,130,40,0.7)'); gr.addColorStop(1, 'rgba(255,80,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); });
  const embers = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.04, map: sprite, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: '#ffa860' }));
  scene.add(embers);

  // Post processing
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.55, 0.6, 0.82); composer.addPass(bloom);
  const grade = new ShaderPass(GradeShader); composer.addPass(grade);
  composer.addPass(new OutputPass());

  let character = null; let disposed = false; const clock = new THREE.Clock();

  function resize() {
    const w = container.clientWidth || 400, h = container.clientHeight || 500;
    renderer.setSize(w, h); composer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(container); resize();

  function disposeObj(o) {
    o.traverse(n => { if (n.geometry) n.geometry.dispose(); if (n.material) n.material.dispose?.(); });
  }

  function update(c, d) {
    if (character) { scene.remove(character.root); disposeObj(character.root); }
    character = buildCharacter(c, d);
    scene.add(character.root);
    const h = character.root.userData.height;
    controls.target.set(0, h * 0.55, 0);
    const dist = 1.6 + h * 1.15;
    const dir = camera.position.clone().sub(controls.target).normalize();
    camera.position.copy(controls.target).addScaledVector(dir, dist);
  }

  function animate() {
    if (disposed) return;
    requestAnimationFrame(animate);
    const dt = Math.min(0.05, clock.getDelta()); const t = clock.elapsedTime;
    torch.intensity = 20 + Math.sin(t * 13) * 1.5 + Math.sin(t * 7.3) * 1.2 + (Math.random() - 0.5) * 1.5;
    flames.forEach((f, i) => { f.scale.y = 0.8 + Math.sin(t * (10 + i * 2) + i) * 0.25; f.rotation.y = t * (1 + i * 0.3); });
    const p = pg.attributes.position;
    for (let i = 0; i < N; i++) { let y = p.getY(i) + spd[i] * 0.016; if (y > 3.5) y = 0; p.setY(i, y); p.setX(i, p.getX(i) + Math.sin(t + i) * 0.0008); }
    p.needsUpdate = true;
    if (character) {
      const b = character.root.userData.body;
      b.scale.y = 1 + Math.sin(t * 1.6) * 0.004;
      b.rotation.y = Math.sin(t * 0.4) * 0.03;
      character.root.userData.head.rotation.y = Math.sin(t * 0.3) * 0.15;
      character.root.traverse(n => {
        if (n.userData.pulse) { if (n.isLight) n.intensity = 0.6 + Math.sin(t * 3) * 0.25; else n.material.emissiveIntensity = 2 + Math.sin(t * 3) * 0.8; }
        if (n.userData.float) n.position.y = 0.88 + Math.sin(t * 2) * 0.015;
        if (n.userData.sway) n.rotation.x = 0.04 + Math.sin(t * 1.1) * 0.025;
      });
    }
    grade.uniforms.time.value = t;
    controls.update();
    composer.render(dt);
  }
  animate();

  return {
    update,
    setAutoRotate(v) { controls.autoRotate = v; },
    screenshot() { composer.render(); return renderer.domElement.toDataURL('image/png'); },
    dispose() { disposed = true; ro.disconnect(); controls.dispose(); renderer.dispose(); if (character) disposeObj(character.root); renderer.domElement.remove(); },
  };
}
