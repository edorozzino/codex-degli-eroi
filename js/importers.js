// Conversione di schede da altri formati e gestione delle schede base precaricate.
import { RACES } from './data/races.js';
import { CLASSES, CLASS_BY_ID } from './data/classes.js';
import { SKILLS } from './data/glossary.js';
import { KAEL_RAW, KAEL_SRD } from './data/presets.js';
import { newCharacter, uid } from './storage.js';

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

// Nomi italiani → indice SRD, per collegare gli incantesimi al grimorio della D&D 5e API
const SPELL_IT = {
  'produrre fiamma': 'produce-flame', 'guida': 'guidance', 'randello incantato': 'shillelagh', 'parola guaritrice': 'healing-word',
  'cura ferite': 'cure-wounds', 'fuoco fatato': 'faerie-fire', 'intralciare': 'entangle', 'raggio di luna': 'moonbeam',
  'passare senza tracce': 'pass-without-trace', 'pelle di corteccia': 'barkskin', 'invocare fulmini': 'call-lightning',
};

// Riconosce il file salvato dall'app della scheda di Kael ("💾 Salva" → .txt con JSON)
export const isKaelAppFormat = (d) => d && typeof d === 'object' && d.stats && 'classLevel' in d && Array.isArray(d.skills);

// "Monaco 2 / Druido 5 (Circolo della Luna)" → [{id:'monaco', level:2}, {id:'druido', level:5, subclass:'Circolo della Luna'}]
export function parseClassLevel(text) {
  const out = [];
  for (const part of String(text || '').split('/')) {
    const m = /([A-Za-zÀ-ÿ' ]+?)\s*(\d+)\s*(?:\(([^)]+)\))?/.exec(part.trim());
    if (!m) continue;
    const cls = CLASSES.find(c => norm(c.name) === norm(m[1]));
    if (cls) out.push({ id: cls.id, level: Math.max(1, Math.min(20, +m[2])), subclass: (m[3] || '').trim() });
  }
  return out;
}

export function fromKaelApp(d, { presetId = null } = {}) {
  const st = d.stats || {};
  const abilities = Object.fromEntries(['str', 'dex', 'con', 'int', 'wis', 'cha'].map(a => [a, parseInt(st[a]) || 10]));
  let classes = parseClassLevel(d.classLevel);
  if (!classes.length) classes = [{ id: 'guerriero', level: Math.max(1, parseInt(d.level) || 1), subclass: '' }];
  // La prima classe è quella dei tiri salvezza competenti (regola della multiclasse)
  const saves = Object.entries(d.saveProf || {}).filter(([, v]) => v).map(([k]) => k).sort().join();
  const firstIdx = classes.findIndex(c => CLASS_BY_ID[c.id].saves.slice().sort().join() === saves);
  if (firstIdx > 0) classes.unshift(...classes.splice(firstIdx, 1));
  const first = CLASS_BY_ID[classes[0].id];
  const lvl = classes.reduce((s, c) => s + c.level, 0);

  const race = RACES.find(r => d.info?.race && norm(d.info.race).startsWith(norm(r.name))) || RACES.find(r => r.id === 'personalizzata');
  const c = newCharacter({
    name: d.name || 'Eroe importato', raceId: race.id, subraceId: race.subraces[0].id, classId: first.id,
    background: '', alignment: 'N', abilities, skills: {}, racialChoices: [], hitDie: first.hitDie,
  });
  c.classes = classes;
  if (presetId) c.presetId = presetId;

  // Livelli: il 1° col dado massimo della prima classe, gli altri divisi per ottenere i PF massimi del file
  const conMod = Math.floor((abilities.con - 10) / 2);
  const order = classes.flatMap(x => Array.from({ length: x.level }, () => x.id));
  order.unshift(...order.splice(order.indexOf(first.id), 1));
  const target = Math.max(order.length, (parseInt(d.hp?.max) || 0) - lvl * conMod);
  const rest = Math.max(0, target - first.hitDie);
  c.levelHistory = order.map((id, i) => ({
    charLevel: i + 1, classId: id,
    hp: i === 0 ? first.hitDie : Math.floor(rest / Math.max(1, order.length - 1)) + (i <= rest % Math.max(1, order.length - 1) ? 1 : 0),
  }));
  const hpMax = parseInt(d.hp?.max) || null;
  c.hp = { current: d.hp && hpMax && +d.hp.current !== hpMax ? Math.max(0, +d.hp.current) : null, temp: parseInt(d.hp?.temp) || 0 };
  c.deathSaves = { ok: d.deathSaves?.s || 0, ko: d.deathSaves?.f || 0 };
  if (d.hitDice) c.hitDiceUsed = { [d.hitDice.die || first.hitDie]: Math.max(0, (d.hitDice.max || lvl) - (d.hitDice.current ?? d.hitDice.max ?? lvl)) };
  c.xp = parseInt(d.xp) || 0;
  c.acBonus = parseInt(d.acBonus) || 0;

  for (const s of d.skills || []) {
    const sk = SKILLS.find(x => norm(x.name) === norm(s.name));
    if (sk && s.prof) c.skills[sk.id] = s.prof === 2 ? 'exp' : 'prof';
  }

  // Risorse: il file salva i punti rimasti, il Codex quelli usati
  const res = d.resources || {};
  const usedOf = (r) => Math.max(0, (r?.max || 0) - (r?.current ?? r?.max ?? 0));
  if (res.ki) c.used['Monaco:ki'] = usedOf(res.ki);
  if (res.wildShape) c.used['Druido:forma'] = usedOf(res.wildShape);
  for (const [k, r] of Object.entries(res)) if (k.startsWith('slots')) c.slotsUsed[parseInt(k.slice(5))] = usedOf(r);

  // Armi: il Codex calcola colpire/danni da solo partendo dall'arma
  const atk = (d.attacks || []).map(a => norm(a.name));
  if (atk.some(n => n.includes('bastone'))) c.weapons.push({ weaponId: 'bastone' });
  if (atk.some(n => n.includes('senz'))) c.weapons.push({ weaponId: 'colpo-senz-armi' });
  if (!c.weapons.length && first.id === 'monaco') c.weapons.push({ weaponId: 'colpo-senz-armi' });

  // Incantesimi: collegati all'SRD quando possibile, con la descrizione italiana del file
  for (const s of d.spells || []) {
    const idx = SPELL_IT[norm(s.name)];
    const srd = idx && KAEL_SRD[idx];
    const entry = { ...(srd || {}), index: srd ? idx : undefined, name: s.name, level: parseInt(s.level) || 0, desc: s.desc || '', concentration: !!(s.conc ?? srd?.concentration) };
    if (!entry.index) delete entry.index;
    if (entry.level === 0) c.cantrips.push(entry);
    else c.spells.push({ id: uid(), ...entry, prepared: true });
  }

  c.languages = [d.info?.languages, d.info?.proficiencies].filter(Boolean).join('\n');
  const tratto = /Tratto:\s*(.+)/.exec(d.notes || '');
  c.traitsText = tratto ? tratto[1].trim() : '';
  c.equipment = [String(d.notes || '').replace(/\n*Tratto:.+/, '').trim(), d.gold != null ? `Monete d'oro: ${d.gold}` : ''].filter(Boolean).join('\n\n');

  const now = Date.now(); let t = 0;
  const note = (title, body, tag) => c.notes.push({ id: uid(), title, body, tag, date: now - (t++) * 1000 });
  if (d.journeyNotes) note('Diario di viaggio', d.journeyNotes.trim(), 'Sessione');
  if (d.conditions) note('Condizioni attive', d.conditions, 'Altro');
  for (const s of d.strategies || []) note(s.title, `${s.tag ? s.tag + '\n\n' : ''}${s.text}`, 'Strategia');
  if (d.forms?.length) note('Forme selvatiche preferite', d.forms.map(f =>
    `${f.name} (GS ${f.cr}) — CA ${f.ac}, PF ${f.hp}, velocità ${f.speed}; FOR ${f.str} DES ${f.dex} COS ${f.con}\n` +
    (f.attacks || []).map(a => `  • ${a.name}: d20+${a.hit}${a.dmg ? ` → ${a.dmg}` : ''}${a.notes ? ` (${a.notes})` : ''}`).join('\n') +
    (f.traits ? `\n  ${f.traits.replace(/\n/g, '\n  ')}` : '')).join('\n\n'), 'Strategia');
  if (d.abilities?.length) note('Privilegi (note della scheda originale)', d.abilities.map(a => `${a.name}: ${a.desc}`).join('\n\n'), 'Altro');
  if (d.spells?.length) note('Incantesimi (note della scheda originale)', d.spells.map(s => `${s.name} (${s.level ? s.level + '°' : 'trucchetto'}): ${s.desc}`).join('\n\n'), 'Altro');

  c.appearance.hairStyle = 'lunghi';
  return c;
}

// ---- Schede base ----
export const PRESETS = { kael: { name: 'Kael (Foglia Umida)', build: () => fromKaelApp(KAEL_RAW, { presetId: 'kael' }) } };
const SEED_KEY = 'dnd5e-preset-seeded';

// Aggiunge le schede base non ancora caricate in questo browser (una volta sola: se le elimini non tornano)
export function seedPresets(chars) {
  let seeded = [];
  try { seeded = JSON.parse(localStorage.getItem(SEED_KEY)) || []; } catch { /* storage non disponibile */ }
  const added = [];
  for (const [id, p] of Object.entries(PRESETS)) {
    if (seeded.includes(id) || chars.some(c => c.presetId === id)) continue;
    const c = p.build(); chars.push(c); added.push(c); seeded.push(id);
  }
  try { localStorage.setItem(SEED_KEY, JSON.stringify(seeded)); } catch { /* ignora */ }
  return added;
}

// Riporta una scheda base ai valori iniziali mantenendo lo stesso id
export function resetPreset(c) {
  const fresh = PRESETS[c.presetId]?.build();
  if (!fresh) return c;
  fresh.id = c.id;
  return fresh;
}
