import { RACE_BY_ID, getSubrace } from './data/races.js';
import { CLASS_BY_ID, SLOT_TABLE, pactMagic, CANTRIP_DAMAGE_TIERS } from './data/classes.js';
import { FEAT_BY_ID } from './data/feats.js';
import { ABILITIES, SKILLS, ARMOR_BY_ID, WEAPON_BY_ID } from './data/glossary.js';

export const AB = ABILITIES.map(a => a.id);
export const mod = (s) => Math.floor((s - 10) / 2);
export const fmt = (n) => (n >= 0 ? '+' : '') + n;
export const profBonus = (lvl) => 2 + Math.floor((Math.max(1, lvl) - 1) / 4);
export const totalLevel = (c) => c.classes.reduce((s, x) => s + x.level, 0);

// Competenze armature ottenute in multiclasse (non dal primo livello)
const MULTI_ARMOR = {
  barbaro: ['scudi'], chierico: ['leggera', 'media', 'scudi'], druido: ['leggera', 'media', 'scudi'],
  guerriero: ['leggera', 'media', 'scudi'], paladino: ['leggera', 'media', 'scudi'], ranger: ['leggera', 'media', 'scudi'],
  bardo: ['leggera'], ladro: ['leggera'], warlock: ['leggera'],
};

export function raceInfo(c) {
  const race = RACE_BY_ID[c.raceId];
  const sub = getSubrace(race, c.subraceId);
  return { race, sub };
}

export function abilityScores(c) {
  const { race, sub } = raceInfo(c);
  const out = {}; const breakdown = {};
  for (const a of AB) { out[a] = c.abilities[a] || 10; breakdown[a] = [{ src: 'Base', v: out[a] }]; }
  const add = (a, v, src) => { if (!v) return; out[a] += v; breakdown[a].push({ src, v }); };
  if (race) {
    if (!sub?.replaceBonus) for (const a of AB) add(a, race.bonus[a], race.name);
    if (sub) for (const a of AB) add(a, sub.bonus?.[a], sub.name);
    for (const a of (c.racialChoices || [])) add(a, sub?.choose?.amount || 1, 'Scelta razziale');
  }
  for (const e of c.asiLog || []) {
    for (const [a, v] of Object.entries(e.changes || {})) add(a, v, e.featId ? FEAT_BY_ID[e.featId]?.name : `ASI liv. ${e.level}`);
  }
  // Campione primordiale (barbaro 20)
  if (c.classes.some(x => x.id === 'barbaro' && x.level >= 20)) { add('str', 4, 'Campione primordiale'); add('con', 4, 'Campione primordiale'); }
  for (const a of AB) out[a] = Math.min(out[a], c.classes.some(x => x.id === 'barbaro' && x.level >= 20) && (a === 'str' || a === 'con') ? 24 : 30);
  return { scores: out, breakdown };
}

export function feats(c) {
  return (c.asiLog || []).filter(e => e.featId).map(e => ({ ...FEAT_BY_ID[e.featId], level: e.level, choice: e.choice })).filter(f => f.id);
}

export function derive(c) {
  const lvl = Math.max(1, totalLevel(c));
  const prof = profBonus(lvl);
  const { scores, breakdown } = abilityScores(c);
  const m = Object.fromEntries(AB.map(a => [a, mod(scores[a])]));
  const { race, sub } = raceInfo(c);
  const fts = feats(c);
  const first = CLASS_BY_ID[c.classes[0]?.id];

  // Tiri salvezza
  const saveProf = new Set(first?.saves || []);
  for (const f of fts) if (f.grantsSave && f.choice) saveProf.add(f.choice);
  const saves = Object.fromEntries(AB.map(a => [a, { prof: saveProf.has(a), bonus: m[a] + (saveProf.has(a) ? prof : 0) }]));

  // Abilità
  const jack = c.classes.some(x => x.id === 'bardo' && x.level >= 2);
  const reliable = c.classes.some(x => x.id === 'ladro' && x.level >= 11);
  const raceSkills = new Set(race?.skills || []);
  const skills = Object.fromEntries(SKILLS.map(s => {
    let p = c.skills?.[s.id] || (raceSkills.has(s.id) ? 'prof' : null);
    let b = m[s.ability];
    if (p === 'prof') b += prof; else if (p === 'exp') b += prof * 2; else if (jack) b += Math.floor(prof / 2);
    return [s.id, { prof: p, bonus: b, fromRace: raceSkills.has(s.id) }];
  }));

  // Armature
  const armorProf = new Set(first?.armor || []);
  c.classes.slice(1).forEach(x => (MULTI_ARMOR[x.id] || []).forEach(a => armorProf.add(a)));
  (sub?.armorProf || []).forEach(a => armorProf.add(a));
  fts.forEach(f => (f.grantsArmor || []).forEach(a => armorProf.add(a)));

  const ac = armorClass(c, m, scores, armorProf);

  // PF
  const hpBonusPerLevel = (sub?.hpPerLevel || 0) + fts.reduce((s, f) => s + (f.hpPerLevel || 0), 0);
  const hpRolls = (c.levelHistory || []).reduce((s, h) => s + (h.hp || 0), 0);
  const hpMax = Math.max(1, hpRolls + lvl * (m.con + hpBonusPerLevel));

  // Dadi vita
  const hitDice = {};
  for (const x of c.classes) { const d = CLASS_BY_ID[x.id].hitDie; hitDice[d] = (hitDice[d] || 0) + x.level; }

  // Velocità
  let speed = sub?.speed || race?.speed || 9;
  const armor = ARMOR_BY_ID[c.armorId] || ARMOR_BY_ID.nessuna;
  const monk = c.classes.find(x => x.id === 'monaco');
  if (monk && monk.level >= 2 && armor.type === 'nessuna' && !c.shield) speed += [0, 0, 3, 3, 3, 3, 4.5, 4.5, 4.5, 4.5, 6, 6, 6, 6, 7.5, 7.5, 7.5, 7.5, 9, 9, 9][monk.level];
  const barb = c.classes.find(x => x.id === 'barbaro');
  if (barb && barb.level >= 5 && armor.type !== 'pesante') speed += 3;
  if (fts.some(f => f.id === 'mobile')) speed += 3;
  if (armor.str && scores.str < armor.str && race?.id !== 'nano') speed -= 3;

  const initiative = m.dex + (fts.some(f => f.id === 'allerta') ? 5 : 0) + (jack ? Math.floor(prof / 2) : 0);
  const passive = 10 + skills.percezione.bonus + (fts.some(f => f.id === 'osservatore') ? 5 : 0);

  return {
    lvl, prof, scores, breakdown, m, saves, skills, armorProf, ac, hpMax, hitDice, speed, initiative, passive,
    race, sub, feats: fts, spell: spellcasting(c, m, prof, lvl), resources: resources(c, m, prof), dice: diceInfo(c, m, prof, lvl),
    attacks: attacks(c, m, prof), reliable,
  };
}

export function armorClass(c, m, scores, armorProf) {
  const armor = ARMOR_BY_ID[c.armorId] || ARMOR_BY_ID.nessuna;
  const options = [];
  if (armor.type === 'nessuna') {
    options.push({ v: 10 + m.dex, label: 'Senza armatura (10 + DES)' });
    for (const x of c.classes) {
      const cl = CLASS_BY_ID[x.id];
      const un = cl.unarmored || cl.unarmoredSub?.[x.subclass];
      if (un && (un.shield || !c.shield)) options.push({ v: un.base + un.abilities.reduce((s, a) => s + m[a], 0), label: `Difesa senza armatura (${cl.name})` });
    }
  } else {
    const dex = armor.dexMax == null ? m.dex : Math.min(m.dex, armor.dexMax + (armor.type === 'media' && (c.asiLog || []).some(e => e.featId === 'arc-medie-maestro') ? 1 : 0));
    options.push({ v: armor.ac + dex, label: armor.name });
  }
  const best = options.reduce((a, b) => (b.v > a.v ? b : a));
  let total = best.v + (c.shield ? 2 : 0) + (Number(c.acBonus) || 0);
  if ((c.asiLog || []).some(e => e.featId === 'doppie-armi') && c.dualWield) total += 1;
  const warnings = [];
  if (armor.type !== 'nessuna' && !armorProf.has(armor.type)) warnings.push(`Non sei competente in armature ${armor.type}: svantaggio a FOR/DES e niente incantesimi.`);
  if (c.shield && !armorProf.has('scudi')) warnings.push('Non sei competente negli scudi.');
  if (armor.str && scores.str < armor.str) warnings.push(`FOR ${armor.str} richiesta: velocità -3 m.`);
  if (armor.stealth) warnings.push('Svantaggio alle prove di Furtività.');
  return { value: total, label: best.label + (c.shield ? ' + scudo' : ''), warnings };
}

// Classi da incantatore effettive (incluse sottoclassi come Cavaliere mistico)
export function casterEntries(c) {
  return c.classes.map(x => {
    const cl = CLASS_BY_ID[x.id];
    const sc = cl.spellcasting || cl.subSpellcasting?.[x.subclass];
    return sc ? { cls: cl, entry: x, sc } : null;
  }).filter(Boolean);
}

export function spellcasting(c, m, prof, lvl) {
  const entries = casterEntries(c);
  const { race, sub } = raceInfo(c);
  const raceCantrips = [...(race?.cantrips || []), ...(sub?.cantrips || [])];
  const raceSpells = [...(race?.spells || []), ...(sub?.spells || [])].filter(s => lvl >= s.level);
  const featCantrips = feats(c).reduce((s, f) => s + (f.grantsCantrips || 0), 0);
  const casters = entries.map(({ cls, entry, sc }) => ({
    classId: cls.id, name: cls.name + (cls.spellcasting ? '' : ` (${entry.subclass})`), ability: sc.ability, type: sc.type, mode: sc.mode,
    dc: 8 + prof + m[sc.ability], attack: prof + m[sc.ability],
    cantrips: sc.cantrips(entry.level),
    known: sc.mode === 'known' ? (sc.known?.[entry.level - 1] || 0) : null,
    prepared: sc.mode === 'prepared' ? sc.prepared(entry.level, { mod: m }) : null,
    spellbook: !!sc.spellbook,
  }));

  // Slot: single-class usa la propria tabella; multiclasse combina
  const nonPact = entries.filter(e => e.sc.type !== 'pact');
  let casterLevel = 0;
  if (nonPact.length === 1) {
    const { sc, entry } = nonPact[0];
    casterLevel = sc.type === 'full' ? entry.level : sc.type === 'half' ? (entry.level >= 2 ? Math.ceil(entry.level / 2) : 0) : (entry.level >= 3 ? Math.ceil(entry.level / 3) : 0);
  } else {
    for (const { sc, entry } of nonPact) casterLevel += sc.type === 'full' ? entry.level : sc.type === 'half' ? Math.floor(entry.level / 2) : Math.floor(entry.level / 3);
  }
  const slots = SLOT_TABLE[Math.min(20, casterLevel)] || [];
  const wl = c.classes.find(x => x.id === 'warlock');
  const pact = wl ? pactMagic(wl.level) : null;
  const totalCantrips = casters.reduce((s, x) => s + x.cantrips, 0) + raceCantrips.length + featCantrips;
  return {
    casters, slots, casterLevel, pact, raceCantrips, raceSpells, featCantrips, totalCantrips,
    cantripTier: CANTRIP_DAMAGE_TIERS(lvl), isCaster: casters.length > 0 || raceCantrips.length > 0 || featCantrips > 0,
  };
}

export function resources(c, m, prof) {
  const { race } = raceInfo(c);
  const list = [];
  for (const r of race?.resources || []) list.push({ ...r, max: r.max(), source: race.name });
  for (const x of c.classes) {
    const cl = CLASS_BY_ID[x.id];
    for (const r of cl.resources(x.level, { mod: m, prof, subclass: x.subclass, char: c })) list.push({ ...r, source: cl.name });
  }
  if (feats(c).some(f => f.id === 'fortunato')) list.push({ id: 'fortuna', name: 'Punti fortuna', max: 3, recharge: 'lungo', source: 'Talento' });
  // Risorse con lo stesso id (es. Incanalare divinità da chierico + paladino) restano separate per fonte
  return list.map(r => ({ ...r, key: `${r.source}:${r.id}` }));
}

export function diceInfo(c, m, prof, lvl) {
  const out = [];
  for (const x of c.classes) {
    const cl = CLASS_BY_ID[x.id];
    out.push({ group: cl.name, label: 'Dado vita', value: `d${cl.hitDie} (${x.level}×)` });
    for (const d of cl.dice(x.level, { mod: m, prof, subclass: x.subclass })) out.push({ group: cl.name, ...d });
  }
  const { race } = raceInfo(c);
  if (race?.id === 'dragonide') {
    const d = lvl >= 16 ? 5 : lvl >= 11 ? 4 : lvl >= 6 ? 3 : 2;
    out.push({ group: race.name, label: 'Arma a soffio', value: `${d}d6 (CD ${8 + m.con + prof})` });
  }
  if (race?.id === 'mezzorco') out.push({ group: race.name, label: 'Attacchi selvaggi', value: '+1 dado arma sui critici in mischia' });
  out.push({ group: 'Generale', label: 'Trucchetti a danno', value: `${CANTRIP_DAMAGE_TIERS(lvl)} dado/i (scala a 5, 11, 17)` });
  out.push({ group: 'Generale', label: 'Tiro per colpire / prove / TS', value: 'd20' });
  return out;
}

export function martialArtsDie(c) {
  const monk = c.classes.find(x => x.id === 'monaco');
  if (!monk) return null;
  return monk.level >= 17 ? 10 : monk.level >= 11 ? 8 : monk.level >= 5 ? 6 : 4;
}

const dieSize = (s) => { const mm = /1d(\d+)/.exec(s); return mm ? +mm[1] : s === '1' ? 1 : 0; };

export function attacks(c, m, prof) {
  const ma = martialArtsDie(c);
  return (c.weapons || []).map(w => {
    const base = WEAPON_BY_ID[w.weaponId];
    if (!base) return null;
    const finesse = base.props.includes('accurata');
    const ranged = base.range === 'distanza';
    const isMonkWeapon = ma && (base.monk) && !base.props.includes('pesante') && !base.props.includes('due mani');
    let ability = ranged ? 'dex' : 'str';
    if ((finesse || isMonkWeapon) && m.dex > m.str) ability = 'dex';
    let dmg = base.dmg;
    if (isMonkWeapon && ma > dieSize(base.dmg)) dmg = `1d${ma}`;
    const bonus = m[ability] + (w.proficient !== false ? prof : 0) + (Number(w.magic) || 0);
    const dmgMod = m[ability] + (Number(w.magic) || 0);
    return { ...w, name: w.name || base.name, base, ability, toHit: bonus, damage: `${dmg}${dmgMod ? fmt(dmgMod) : ''}`, versatile: base.versatile ? `${base.versatile}${dmgMod ? fmt(dmgMod) : ''}` : null, type: base.type };
  }).filter(Boolean);
}

// ---- Avanzamento ----
export function meetsReq(req, scores) {
  if (!req) return true;
  if (req.any) return Object.entries(req.any).some(([a, v]) => scores[a] >= v);
  return Object.entries(req).every(([a, v]) => scores[a] >= v);
}
const reqText = (req) => req.any ? Object.entries(req.any).map(([a, v]) => `${a.toUpperCase()} ${v}`).join(' o ') : Object.entries(req).map(([a, v]) => `${a.toUpperCase()} ${v}`).join(' e ');

export function multiclassOptions(c) {
  const { scores } = abilityScores(c);
  const currentOk = c.classes.every(x => meetsReq(CLASS_BY_ID[x.id].multiclassReq, scores));
  return Object.values(CLASS_BY_ID).map(cl => {
    const existing = c.classes.find(x => x.id === cl.id);
    if (existing) return { cls: cl, ok: existing.level < 20, existing, reason: existing.level >= 20 ? 'Livello massimo' : '' };
    const ok = currentOk && meetsReq(cl.multiclassReq, scores);
    let reason = '';
    if (!meetsReq(cl.multiclassReq, scores)) reason = `Richiede ${reqText(cl.multiclassReq)}`;
    else if (!currentOk) reason = 'Le classi attuali non soddisfano i requisiti di multiclasse';
    return { cls: cl, ok, existing: null, reason };
  });
}

export function featAvailability(feat, c, d) {
  const p = feat.prereq;
  if ((c.asiLog || []).some(e => e.featId === feat.id) && feat.id !== 'resiliente' && feat.id !== 'iniziato') return { ok: false, reason: 'Già posseduto' };
  if (!p) return { ok: true };
  if (p.ability && !meetsReq(p.ability, d.scores)) return { ok: false, reason: `Richiede ${reqText(p.ability)}` };
  if (p.anyAbility && !meetsReq({ any: p.anyAbility }, d.scores)) return { ok: false, reason: `Richiede ${reqText({ any: p.anyAbility })}` };
  if (p.armor && !d.armorProf.has(p.armor)) return { ok: false, reason: `Richiede competenza nelle armature ${p.armor}` };
  if (p.spellcaster && !d.spell.casters.length && !d.spell.raceCantrips.length) return { ok: false, reason: 'Richiede la capacità di lanciare incantesimi' };
  return { ok: true };
}

// Suggerimenti ASI: caratteristiche primarie + punteggi dispari (un +1 aumenta il modificatore)
export function asiSuggestions(c, d, classId) {
  const cl = CLASS_BY_ID[classId];
  const primaries = new Set(c.classes.flatMap(x => CLASS_BY_ID[x.id].primary.slice(0, 2)).concat(cl.primary));
  return AB.map(a => {
    const s = d.scores[a];
    const tips = [];
    if (primaries.has(a)) tips.push('primaria');
    if (s % 2 === 1 && s < 20) tips.push('dispari: +1 aumenta il mod.');
    if (a === 'con') tips.push('PF e concentrazione');
    return { a, score: s, capped: s >= 20, tips, priority: (primaries.has(a) ? 2 : 0) + (s % 2 === 1 ? 1 : 0) + (cl.primary[0] === a ? 2 : 0) };
  }).sort((x, y) => y.priority - x.priority);
}

export function featSuggestions(c, d, classId) {
  const cl = CLASS_BY_ID[classId];
  const t = new Set();
  if (['guerriero', 'paladino', 'barbaro'].includes(classId)) ['mischia', 'difesa'].forEach(x => t.add(x));
  if (['ranger', 'ladro'].includes(classId)) ['distanza', 'movimento', 'utilità'].forEach(x => t.add(x));
  if (cl.spellcasting || d.spell.casters.length) t.add('magia');
  if (['bardo', 'warlock'].includes(classId)) t.add('sociale');
  if (classId === 'monaco') ['movimento', 'difesa'].forEach(x => t.add(x));
  if (['chierico', 'druido'].includes(classId)) t.add('supporto');
  return t;
}

export const avgHitDie = (d) => Math.floor(d / 2) + 1;
