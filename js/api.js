// Client per la D&D 5e API (https://www.dnd5eapi.co) — dati SRD 5.1 (CC-BY-4.0), in inglese.
// Le risposte sono messe in cache in memoria e in localStorage (30 giorni) per ridurre le chiamate
// e permettere la consultazione offline di ciò che è già stato aperto.
export const API_BASE = 'https://www.dnd5eapi.co';
const REST = '/api/2014';
const TTL = 30 * 24 * 3600 * 1000;
const PREFIX = 'dnd5eapi:';
const mem = new Map();

// Indici delle classi nell'API
export const CLASS_API = {
  barbaro: 'barbarian', bardo: 'bard', chierico: 'cleric', druido: 'druid', guerriero: 'fighter', ladro: 'rogue',
  mago: 'wizard', monaco: 'monk', paladino: 'paladin', ranger: 'ranger', stregone: 'sorcerer', warlock: 'warlock',
};
// Le sottoclassi "a un terzo" usano la lista del mago
export const spellListFor = (classId, subclass) =>
  (classId === 'guerriero' && subclass === 'Cavaliere mistico') || (classId === 'ladro' && subclass === 'Mistificatore arcano') ? 'wizard' : CLASS_API[classId];

function readCache(key) {
  if (mem.has(key)) return mem.get(key);
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return undefined;
    const { t, v } = JSON.parse(raw);
    if (Date.now() - t > TTL) return undefined;
    mem.set(key, v);
    return v;
  } catch { return undefined; }
}
function writeCache(key, v) {
  mem.set(key, v);
  try { localStorage.setItem(PREFIX + key, JSON.stringify({ t: Date.now(), v })); }
  catch { /* quota piena: resta solo la cache in memoria */ }
}

const inflight = new Map();
async function fetchJSON(url, opts) {
  const res = await fetch(url, { ...opts, headers: { Accept: 'application/json', ...(opts?.headers || {}) } });
  if (!res.ok) throw new Error(`API ${res.status} su ${url.replace(API_BASE, '')}`);
  return res.json();
}

// GET REST: path relativo a /api/2014 oppure url completo restituito dall'API ("/api/2014/...")
export async function get(path) {
  const p = path.startsWith('/api/') ? path : REST + path;
  const cached = readCache(p);
  if (cached !== undefined) return cached;
  if (inflight.has(p)) return inflight.get(p);
  const pr = fetchJSON(API_BASE + p).then(v => { writeCache(p, v); return v; }).finally(() => inflight.delete(p));
  inflight.set(p, pr);
  return pr;
}

export async function gql(query) {
  const key = 'gql:' + query;
  const cached = readCache(key);
  if (cached !== undefined) return cached;
  const r = await fetchJSON(API_BASE + '/graphql/2014', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
  if (r.errors?.length) throw new Error(r.errors[0].message);
  writeCache(key, r.data);
  return r.data;
}

export const imageUrl = (p) => (p ? API_BASE + p : null);

// ---- Endpoint usati dall'app ----
export const api = {
  spells: () => get('/spells').then(r => r.results),
  classSpells: (cls) => get(`/classes/${cls}/spells`).then(r => r.results),
  spell: (index) => get(`/spells/${index}`),
  classLevel: (cls, level) => get(`/classes/${cls}/levels/${level}`),
  subclassLevel: (sub, level) => get(`/subclasses/${sub}/levels/${level}`),
  feature: (url) => get(url),
  beasts: () => gql('{ monsters(type: "beast", limit: 400) { index name challenge_rating size image hit_points speed { walk swim fly climb } } }').then(d => d.monsters),
  monster: (index) => get(`/monsters/${index}`),
  monsters: (name) => get(`/monsters${name ? `?name=${encodeURIComponent(name)}` : ''}`).then(r => r.results),
  magicItems: () => get('/magic-items').then(r => r.results),
  magicItem: (index) => get(`/magic-items/${index}`),
  conditions: () => get('/conditions').then(r => r.results),
  condition: (index) => get(`/conditions/${index}`),
};

// Riassunto compatto di un incantesimo da salvare nella scheda (così i tiri funzionano anche offline)
export function spellSummary(s) {
  const dmg = Array.isArray(s.damage) ? s.damage[0] : s.damage;
  return {
    index: s.index, name: s.name, level: s.level, school: s.school?.name,
    attack: s.attack_type || null, dc: s.dc ? { ability: s.dc.dc_type?.index, success: s.dc.dc_success } : null,
    dmgType: dmg?.damage_type?.name || null,
    dmgChar: dmg?.damage_at_character_level || null, dmgSlot: dmg?.damage_at_slot_level || null,
    heal: s.heal_at_slot_level || null, concentration: !!s.concentration, ritual: !!s.ritual,
  };
}

// Danno di un trucchetto al livello del personaggio / di un incantesimo al livello di slot
export function scaledDice(table, level) {
  if (!table) return null;
  let v = null;
  for (const k of Object.keys(table).map(Number).sort((a, b) => a - b)) if (level >= k) v = table[k];
  return v ?? table[Object.keys(table)[0]];
}

export function clearCache() {
  mem.clear();
  try { Object.keys(localStorage).filter(k => k.startsWith(PREFIX)).forEach(k => localStorage.removeItem(k)); } catch { /* ignora */ }
}

// "30 ft." → "9 m"
export const ftToM = (s) => String(s || '').replace(/(\d+)\s*(?:ft\.?|feet|foot)/g, (_, n) => `${(+n * 0.3).toLocaleString('it', { maximumFractionDigits: 1 })} m`);
