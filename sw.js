// Service worker: rende l'app disponibile offline.
// - File dell'app: prima la rete (così online hai sempre l'ultima versione), cache se sei offline.
// - D&D 5e API e immagini: prima la cache (i dati SRD non cambiano), poi la rete.
// - Google Fonts: dalla cache, aggiornati in background.
const VERSION = 'codex-v1';
const APP_CACHE = `${VERSION}-app`;
const DATA_CACHE = 'codex-dati-srd';      // non legata alla versione: sopravvive agli aggiornamenti
const FONT_CACHE = 'codex-font';

const APP_FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/app.js', 'js/api.js', 'js/offline.js', 'js/dice.js', 'js/importers.js', 'js/rules.js', 'js/srd.js', 'js/storage.js', 'js/ui.js', 'js/viewer3d.js', 'js/wizards.js',
  'js/data/classes.js', 'js/data/feats.js', 'js/data/glossary.js', 'js/data/presets.js', 'js/data/races.js',
  'vendor/three/build/three.module.min.js', 'vendor/three/addons/controls/OrbitControls.js',
  'vendor/three/addons/postprocessing/EffectComposer.js', 'vendor/three/addons/postprocessing/MaskPass.js', 'vendor/three/addons/postprocessing/OutputPass.js',
  'vendor/three/addons/postprocessing/Pass.js', 'vendor/three/addons/postprocessing/RenderPass.js', 'vendor/three/addons/postprocessing/ShaderPass.js',
  'vendor/three/addons/postprocessing/UnrealBloomPass.js', 'vendor/three/addons/shaders/CopyShader.js',
  'vendor/three/addons/shaders/LuminosityHighPassShader.js', 'vendor/three/addons/shaders/OutputShader.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-192.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(APP_CACHE).then(c => c.addAll(APP_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = [APP_CACHE, DATA_CACHE, FONT_CACHE];
    for (const k of await caches.keys()) if (!keep.includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

async function networkFirst(req) {
  const cache = await caches.open(APP_CACHE);
  try {
    const res = await fetch(req, { cache: 'no-cache' });
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    const hit = await cache.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' ? await cache.match('index.html') : null);
    if (hit) return hit;
    throw new Error('offline');
  }
}

async function cacheFirst(req, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
  return res;
}

async function staleWhileRevalidate(req, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(req);
  const net = fetch(req).then(res => { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; }).catch(() => hit);
  return hit || net;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; // le query GraphQL (POST) restano nella cache di localStorage dell'app
  const url = new URL(req.url);
  if (url.origin === self.location.origin) event.respondWith(networkFirst(req));
  else if (url.hostname === 'www.dnd5eapi.co') event.respondWith(cacheFirst(req, DATA_CACHE));
  else if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') event.respondWith(staleWhileRevalidate(req, FONT_CACHE));
});

// L'app può chiedere quanto spazio occupa la cache o di svuotarla
self.addEventListener('message', async (event) => {
  if (event.data === 'clear-data-cache') { await caches.delete(DATA_CACHE); event.source?.postMessage('data-cache-cleared'); }
});
