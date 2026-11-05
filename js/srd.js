// Schermate basate sulla D&D 5e API: grimorio, dettagli incantesimi, Forma selvatica,
// blocchi statistiche dei mostri, privilegi ufficiali di classe e ricerche nel glossario.
import { api, spellListFor, spellSummary, scaledDice, imageUrl, ftToM, CLASS_API } from './api.js';
import { CLASS_BY_ID } from './data/classes.js';
import { esc, openModal, closeModal, doRoll, toast } from './ui.js';
import { fmt, mod } from './rules.js';
import { uid } from './storage.js';

const SCHOOL_IT = { Abjuration: 'Abiurazione', Conjuration: 'Evocazione (conj.)', Divination: 'Divinazione', Enchantment: 'Ammaliamento', Evocation: 'Invocazione', Illusion: 'Illusione', Necromancy: 'Necromanzia', Transmutation: 'Trasmutazione' };
const lvLabel = (l) => (l === 0 ? 'Trucchetto' : `${l}° livello`);
// Sottoclassi presenti nell'SRD
export const SUBCLASS_API = {
  'Cammino del Berserker': 'berserker', 'Campione': 'champion', 'Giuramento di Devozione': 'devotion', 'Discendenza draconica': 'draconic',
  'Scuola di Invocazione': 'evocation', "L'Immondo": 'fiend', 'Cacciatore': 'hunter', 'Circolo della Terra': 'land', 'Dominio della Vita': 'life',
  'Collegio della Sapienza': 'lore', 'Via della Mano Aperta': 'open-hand', 'Furfante': 'thief',
};

const loading = '<p class="muted">⏳ Caricamento dalla D&amp;D 5e API…</p>';
const offline = (e) => `<div class="callout red">API non raggiungibile (${esc(e.message)}). Controlla la connessione: i dati già consultati restano disponibili dalla cache.</div>`;
const paras = (arr) => (arr || []).map(p => p.startsWith('|') ? `<pre class="srd-table">${esc(p)}</pre>` : `<p>${esc(p).replace(/\*\*\*?(.+?)\*\*\*?/g, '<b>$1</b>')}</p>`).join('');
const diceExpr = (s, m = 0) => String(s).replace(/\s*\+\s*MOD/i, m ? fmt(m) : '').replace(/\s+/g, '');
const rollBtn = (expr, label, text) => `<button class="btn small ghost" data-roll="${esc(expr)}" data-label="${esc(label)}">🎲 ${esc(text || expr)}</button>`;

// I pulsanti di tiro dentro le modali non arrivano al gestore globale: li gestiamo qui
function wireRolls(modal) {
  modal.addEventListener('click', (e) => {
    const r = e.target.closest('[data-roll]');
    if (r) { e.stopPropagation(); doRoll(r.dataset.roll, r.dataset.label); }
    if (e.target.closest('[data-close]')) closeModal();
  });
}

// ---------- Incantesimi ----------
function spellDetailHtml(s, ctx) {
  const sum = spellSummary(s);
  const caster = ctx?.caster;
  const m = caster ? ctx.d.m[caster.ability] : 0;
  const dmgLine = [];
  if (sum.dmgChar) {
    const dice = scaledDice(sum.dmgChar, ctx?.d?.lvl || 1);
    dmgLine.push(`<div class="row">Danni al tuo livello: ${rollBtn(diceExpr(dice, m), s.name, `${dice} ${sum.dmgType || ''}`)}</div>`);
  }
  if (sum.dmgSlot) dmgLine.push(`<div class="row">Danni per slot: ${Object.entries(sum.dmgSlot).map(([l, v]) => rollBtn(diceExpr(v, m), `${s.name} (slot ${l}°)`, `${l}°: ${v}`)).join(' ')}</div>`);
  if (sum.heal) dmgLine.push(`<div class="row">Cura per slot: ${Object.entries(sum.heal).map(([l, v]) => rollBtn(diceExpr(v, m), `${s.name} (slot ${l}°)`, `${l}°: ${diceExpr(v, m)}`)).join(' ')}</div>`);
  return `
    <h3 style="margin-bottom:2px">${esc(s.name)}</h3>
    <div class="muted"><i>${lvLabel(s.level)} · ${esc(SCHOOL_IT[s.school?.name] || s.school?.name || '')}${s.ritual ? ' · rituale' : ''}${s.concentration ? ' · concentrazione' : ''}</i></div>
    <div class="grid g2" style="margin:8px 0;gap:4px 14px;font-size:.95rem">
      <div><b>Tempo di lancio:</b> ${esc(s.casting_time)}</div><div><b>Gittata:</b> ${esc(ftToM(s.range))}</div>
      <div><b>Componenti:</b> ${esc((s.components || []).join(', '))}${s.material ? ` <small class="muted">(${esc(s.material)})</small>` : ''}</div><div><b>Durata:</b> ${esc(s.duration)}</div>
      ${s.attack_type ? `<div><b>Attacco:</b> ${s.attack_type === 'ranged' ? 'a distanza' : 'in mischia'}${caster ? ` ${rollBtn('1d20' + fmt(caster.attack), 'Attacco: ' + s.name, 'd20' + fmt(caster.attack))}` : ''}</div>` : ''}
      ${s.dc ? `<div><b>Tiro salvezza:</b> ${esc(s.dc.dc_type?.name)}${caster ? ` CD ${caster.dc}` : ''} (${s.dc.dc_success === 'half' ? 'metà danni se riesce' : 'nessun effetto se riesce'})</div>` : ''}
      ${s.area_of_effect ? `<div><b>Area:</b> ${esc(s.area_of_effect.type)} ${(s.area_of_effect.size * 0.3).toLocaleString('it', { maximumFractionDigits: 1 })} m</div>` : ''}
      <div><b>Classi:</b> ${esc((s.classes || []).map(c => c.name).join(', '))}</div>
    </div>
    ${dmgLine.join('')}
    <div class="srd-desc">${paras(s.desc)}${s.higher_level?.length ? `<p><b>A livelli superiori.</b> ${esc(s.higher_level.join(' '))}</p>` : ''}</div>
    <small class="muted">Fonte: SRD 5.1 via dnd5eapi.co (testo in inglese)</small>`;
}

export function openSpellDetail(index, c, d) {
  const modal = openModal(`<header><h2>✦ Incantesimo</h2><button class="icon-btn" data-close>✕</button></header><div class="body">${loading}</div>`);
  wireRolls(modal);
  api.spell(index).then(s => {
    const caster = d.spell.casters.find(x => (s.classes || []).some(k => k.index === spellListFor(x.classId, c.classes.find(e => e.id === x.classId)?.subclass))) || d.spell.casters[0];
    modal.querySelector('.body').innerHTML = spellDetailHtml(s, { d, caster });
  }).catch(e => { modal.querySelector('.body').innerHTML = offline(e); });
}

export function openSpellBrowser(c, d, onChange) {
  const lists = c.classes.map(x => ({ classId: x.id, api: spellListFor(x.id, x.subclass), caster: d.spell.casters.find(k => k.classId === x.id) })).filter(x => x.caster);
  const extra = d.spell.featCantrips || d.spell.raceCantrips.some(r => r.choose) ? ['wizard', 'cleric', 'druid', 'bard', 'sorcerer', 'warlock'] : [];
  const sources = [...lists.map(x => ({ api: x.api, label: CLASS_BY_ID[x.classId].name + (x.api === 'wizard' && x.classId !== 'mago' ? ' (lista mago)' : '') })),
    ...extra.filter(a => !lists.some(l => l.api === a)).map(a => ({ api: a, label: `Lista ${a} (razza/talento)` }))];
  if (!sources.length) return toast('<strong>Nessuna lista di incantesimi</strong><div>Questo personaggio non ha classi incantatrici.</div>');
  const maxLevel = Math.max(d.spell.slots.length, d.spell.pact?.level || 0);
  const st = { src: sources[0].api, level: 'all', q: '', sel: null, list: null, err: null };
  const modal = openModal(`<header><h2>📚 Grimorio SRD</h2><button class="icon-btn" data-close>✕</button></header>
    <div class="body"><div class="row" style="margin-bottom:10px">
      <select id="sb-src">${sources.map(s => `<option value="${s.api}">${esc(s.label)}</option>`).join('')}</select>
      <select id="sb-lv"><option value="all">Tutti i livelli</option>${Array.from({ length: 10 }, (_, l) => `<option value="${l}">${lvLabel(l)}</option>`).join('')}</select>
      <input id="sb-q" placeholder="Cerca (inglese)…" style="flex:1">
    </div>
    <p class="muted" style="margin:0 0 8px">Puoi lanciare incantesimi fino al <b>${maxLevel || 0}° livello</b>. Trucchetti: ${countCantrips(c, d)}/${d.spell.totalCantrips}.</p>
    <div class="srd-browser"><div id="sb-list" class="srd-list"></div><div id="sb-detail" class="srd-detail"><p class="muted">Seleziona un incantesimo per i dettagli.</p></div></div></div>`);
  wireRolls(modal);
  const listEl = modal.querySelector('#sb-list'); const detEl = modal.querySelector('#sb-detail');
  const has = (idx) => c.cantrips.some(x => x?.index === idx) || c.spells.some(x => x.index === idx);

  function drawList() {
    if (st.err) { listEl.innerHTML = offline(st.err); return; }
    if (!st.list) { listEl.innerHTML = loading; return; }
    const q = st.q.toLowerCase();
    const items = st.list.filter(s => (st.level === 'all' || s.level === +st.level) && (!q || s.name.toLowerCase().includes(q)));
    listEl.innerHTML = items.map(s => `<button class="srd-row ${st.sel === s.index ? 'sel' : ''} ${s.level > maxLevel ? 'locked' : ''}" data-spell="${s.index}">
      <span>${has(s.index) ? '✓ ' : ''}${esc(s.name)}</span><small>${s.level === 0 ? 'T' : s.level + '°'}</small></button>`).join('') || '<p class="muted">Nessun risultato.</p>';
  }
  function load() {
    st.list = null; st.err = null; drawList();
    api.classSpells(st.src).then(l => { st.list = l; drawList(); }).catch(e => { st.err = e; drawList(); });
  }
  function select(index) {
    st.sel = index; drawList(); detEl.innerHTML = loading;
    api.spell(index).then(s => {
      const caster = lists.find(x => x.api === st.src)?.caster || d.spell.casters[0];
      const can = s.level <= maxLevel || s.level === 0;
      detEl.innerHTML = `<div class="row" style="margin-bottom:8px">${has(s.index) ? '<span class="ok">✓ Già nella scheda</span>' : `<button class="btn small gold" data-add="${s.index}" ${can ? '' : 'disabled'}>+ Aggiungi ${s.level === 0 ? 'trucchetto' : 'incantesimo'}</button>`}
        ${can ? '' : '<span class="warn">Livello non ancora accessibile</span>'}</div>` + spellDetailHtml(s, { d, caster });
      detEl.querySelector('[data-add]')?.addEventListener('click', () => {
        const sum = spellSummary(s);
        if (s.level === 0) {
          if (countCantrips(c, d) >= d.spell.totalCantrips) toast(`<strong>Attenzione</strong><div>Hai già ${d.spell.totalCantrips} trucchetti: aggiunto comunque.</div>`);
          c.cantrips.push(sum);
        } else c.spells.push({ id: uid(), ...sum, prepared: true });
        onChange(); select(index);
      });
    }).catch(e => { detEl.innerHTML = offline(e); });
  }
  modal.querySelector('#sb-src').addEventListener('change', (e) => { st.src = e.target.value; load(); });
  modal.querySelector('#sb-lv').addEventListener('change', (e) => { st.level = e.target.value; drawList(); });
  modal.querySelector('#sb-q').addEventListener('input', (e) => { st.q = e.target.value; drawList(); });
  listEl.addEventListener('click', (e) => { const b = e.target.closest('[data-spell]'); if (b) select(b.dataset.spell); });
  load();
}
const countCantrips = (c, d) => c.cantrips.length + d.spell.raceCantrips.filter(r => !r.choose).length;

// ---------- Forma selvatica ----------
export function wildShapeLimits(c) {
  const dr = c.classes.find(x => x.id === 'druido');
  if (!dr || dr.level < 2) return null;
  const moon = dr.subclass === 'Circolo della Luna';
  const cr = moon ? (dr.level >= 6 ? Math.floor(dr.level / 3) : 1) : dr.level >= 8 ? 1 : dr.level >= 4 ? 0.5 : 0.25;
  return { cr, swim: dr.level >= 4, fly: dr.level >= 8, level: dr.level, moon };
}
const crLabel = (v) => ({ 0.125: '⅛', 0.25: '¼', 0.5: '½' }[v] || String(v));

export function openWildShape(c) {
  const lim = wildShapeLimits(c);
  if (!lim) return;
  const modal = openModal(`<header><h2>🐺 Forma selvatica</h2><button class="icon-btn" data-close>✕</button></header>
    <div class="body"><p class="muted" style="margin-top:0">Druido ${lim.level}${lim.moon ? ' (Circolo della Luna)' : ''}: GS massimo <b>${crLabel(lim.cr)}</b>, ${lim.fly ? 'volo e nuoto consentiti' : lim.swim ? 'nuoto consentito, niente volo' : 'niente nuoto né volo'}. Bestie dall'SRD.</p>
    <div class="row" style="margin-bottom:8px"><input id="ws-q" placeholder="Cerca bestia…" style="flex:1"><label><input type="checkbox" id="ws-all"> Mostra anche quelle non ancora disponibili</label></div>
    <div id="ws-list" class="beast-grid">${loading}</div></div>`);
  wireRolls(modal);
  let beasts = null; let q = ''; let all = false;
  const ok = (b) => b.challenge_rating <= lim.cr && (lim.swim || !b.speed.swim) && (lim.fly || !b.speed.fly);
  const draw = () => {
    const el = modal.querySelector('#ws-list');
    const list = beasts.filter(b => (all || ok(b)) && (!q || b.name.toLowerCase().includes(q))).sort((a, b) => b.challenge_rating - a.challenge_rating || a.name.localeCompare(b.name));
    el.innerHTML = list.map(b => `<button class="beast ${ok(b) ? '' : 'locked'}" data-beast="${b.index}">
      ${b.image ? `<img src="${imageUrl(b.image)}" alt="" loading="lazy" onerror="this.remove()">` : '<span class="beast-ph">🐾</span>'}
      <strong>${esc(b.name)}</strong><small>GS ${crLabel(b.challenge_rating)} · ${b.hit_points} PF · ${esc(b.size)}</small>
      <small>${['walk', 'swim', 'fly', 'climb'].filter(k => b.speed[k]).map(k => ({ walk: '🚶', swim: '🌊', fly: '🪶', climb: '🧗' })[k] + ' ' + ftToM(b.speed[k])).join(' ')}</small></button>`).join('') || '<p class="muted">Nessuna bestia.</p>';
  };
  modal.querySelector('#ws-q').addEventListener('input', (e) => { q = e.target.value.toLowerCase(); if (beasts) draw(); });
  modal.querySelector('#ws-all').addEventListener('change', (e) => { all = e.target.checked; if (beasts) draw(); });
  modal.querySelector('#ws-list').addEventListener('click', (e) => { const b = e.target.closest('[data-beast]'); if (b) openMonster(b.dataset.beast, () => openWildShape(c)); });
  api.beasts().then(l => { beasts = l; draw(); }).catch(e => { modal.querySelector('#ws-list').innerHTML = offline(e); });
}

// ---------- Mostri ----------
export function monsterHtml(m) {
  const ab = [['strength', 'FOR'], ['dexterity', 'DES'], ['constitution', 'COS'], ['intelligence', 'INT'], ['wisdom', 'SAG'], ['charisma', 'CAR']];
  const ac = (m.armor_class || []).map(a => `${a.value}${a.type && a.type !== 'dex' ? ` (${a.type})` : ''}`).join(', ');
  const act = (a) => {
    const btns = [];
    if (a.attack_bonus != null) btns.push(rollBtn('1d20' + fmt(a.attack_bonus), `${m.name}: ${a.name}`, 'd20' + fmt(a.attack_bonus)));
    (a.damage || []).forEach(dm => { if (dm.damage_dice) btns.push(rollBtn(diceExpr(dm.damage_dice), `${m.name}: ${a.name} (danni)`, `${dm.damage_dice} ${dm.damage_type?.name || ''}`)); });
    return `<div class="gloss-item"><strong>${esc(a.name)}</strong> ${btns.join(' ')}<div>${esc(a.desc)}</div></div>`;
  };
  return `<div class="statblock">
    ${m.image ? `<img class="mon-img" src="${imageUrl(m.image)}" alt="${esc(m.name)}" onerror="this.remove()">` : ''}
    <h3 style="margin-bottom:0">${esc(m.name)}</h3><div class="muted"><i>${esc(m.size)} ${esc(m.type)}, ${esc(m.alignment)}</i></div>
    <p><b>CA</b> ${esc(ac)} · <b>PF</b> ${m.hit_points} ${m.hit_dice ? rollBtn(m.hit_points_roll || m.hit_dice, `${m.name}: PF`, m.hit_dice) : ''} · <b>Velocità</b> ${esc(Object.entries(m.speed || {}).map(([k, v]) => `${k} ${ftToM(v)}`).join(', '))}</p>
    <div class="mon-abilities">${ab.map(([k, l]) => `<div class="stat-box rollable" data-roll="1d20${fmt(mod(m[k]))}" data-label="${esc(m.name)}: ${l}"><div class="lbl">${l}</div><b>${m[k]}</b> (${fmt(mod(m[k]))})</div>`).join('')}</div>
    <p style="font-size:.93rem">${m.proficiencies?.length ? `<b>Competenze</b> ${esc(m.proficiencies.map(p => `${p.proficiency.name.replace(/^(Skill|Saving Throw): /, '')} ${fmt(p.value)}`).join(', '))}<br>` : ''}
      <b>Sensi</b> ${esc(Object.entries(m.senses || {}).map(([k, v]) => `${k.replace(/_/g, ' ')} ${ftToM(v)}`).join(', '))}<br>
      ${m.damage_resistances?.length ? `<b>Resistenze</b> ${esc(m.damage_resistances.join(', '))}<br>` : ''}${m.damage_immunities?.length ? `<b>Immunità</b> ${esc(m.damage_immunities.join(', '))}<br>` : ''}
      <b>Linguaggi</b> ${esc(m.languages || '—')} · <b>GS</b> ${crLabel(m.challenge_rating)} (${m.xp} PE)</p>
    ${(m.special_abilities || []).map(a => `<div class="gloss-item"><strong>${esc(a.name)}.</strong> ${esc(a.desc)}</div>`).join('')}
    ${m.actions?.length ? `<h4 style="margin-top:10px">Azioni</h4>${m.actions.map(act).join('')}` : ''}
    ${m.reactions?.length ? `<h4 style="margin-top:10px">Reazioni</h4>${m.reactions.map(act).join('')}` : ''}
    ${m.legendary_actions?.length ? `<h4 style="margin-top:10px">Azioni leggendarie</h4>${m.legendary_actions.map(act).join('')}` : ''}
    <small class="muted">Fonte: SRD 5.1 via dnd5eapi.co</small></div>`;
}

export function openMonster(index, back) {
  const modal = openModal(`<header><h2>${back ? '<button class="icon-btn" data-back title="Indietro">←</button> ' : ''}Blocco statistiche</h2><button class="icon-btn" data-close>✕</button></header><div class="body">${loading}</div>`);
  wireRolls(modal);
  if (back) modal.querySelector('[data-back]').addEventListener('click', (e) => { e.stopPropagation(); back(); });
  api.monster(index).then(m => { modal.querySelector('.body').innerHTML = monsterHtml(m); }).catch(e => { modal.querySelector('.body').innerHTML = offline(e); });
}

// ---------- Privilegi ufficiali di classe ----------
async function featureBlock(f) {
  try {
    const det = await api.feature(f.url);
    return `<details class="srd-feature"><summary><b>${esc(f.name)}</b></summary>${paras(det.desc)}</details>`;
  } catch { return `<div class="srd-feature"><b>${esc(f.name)}</b></div>`; }
}

// Riempie el con i privilegi SRD del livello indicato (usato nell'avanzamento)
export async function fillLevelFeatures(el, classId, level, subclass) {
  if (!el) return;
  el.innerHTML = loading;
  try {
    const cls = CLASS_API[classId];
    const lv = await api.classLevel(cls, level);
    let feats = lv.features || [];
    const sub = SUBCLASS_API[subclass];
    if (sub) { try { const sl = await api.subclassLevel(sub, level); feats = feats.concat(sl.features || []); } catch { /* livello senza privilegi di sottoclasse */ } }
    const blocks = await Promise.all(feats.map(featureBlock));
    const spec = lv.class_specific ? Object.entries(lv.class_specific).map(([k, v]) => `<span class="badge">${esc(k.replace(/_/g, ' '))}: ${esc(typeof v === 'object' ? (v.dice_count ? `${v.dice_count}d${v.dice_value}` : Object.values(v).join('/')) : v)}</span>`).join(' ') : '';
    el.innerHTML = `${blocks.join('') || '<p class="muted">Nessun privilegio SRD a questo livello.</p>'}${spec ? `<div class="badges" style="margin-top:6px">${spec}</div>` : ''}
      <small class="muted">Testi ufficiali SRD (inglese) via dnd5eapi.co${subclass && !sub ? ' — la sottoclasse scelta non è nell\'SRD' : ''}</small>`;
  } catch (e) { el.innerHTML = offline(e); }
}

export function openClassFeatures(c) {
  const modal = openModal(`<header><h2>📜 Privilegi di classe (SRD)</h2><button class="icon-btn" data-close>✕</button></header><div class="body" id="cf-body">${loading}</div>`);
  wireRolls(modal);
  const body = modal.querySelector('#cf-body');
  Promise.all(c.classes.map(async x => {
    const levels = await Promise.all(Array.from({ length: x.level }, (_, i) => api.classLevel(CLASS_API[x.id], i + 1)));
    const sub = SUBCLASS_API[x.subclass];
    const subLevels = sub ? await Promise.all(Array.from({ length: x.level }, (_, i) => api.subclassLevel(sub, i + 1).catch(() => null))) : [];
    const rows = await Promise.all(levels.map(async (lv, i) => {
      const fs = [...(lv.features || []), ...(subLevels[i]?.features || [])];
      if (!fs.length) return '';
      return `<h4 style="margin-top:10px">Livello ${i + 1}</h4>${(await Promise.all(fs.map(featureBlock))).join('')}`;
    }));
    return `<h3>${esc(CLASS_BY_ID[x.id].name)} ${x.level}${x.subclass ? ` — ${esc(x.subclass)}${sub ? '' : ' <small class="muted">(non SRD)</small>'}` : ''}</h3>${rows.join('')}`;
  })).then(parts => { body.innerHTML = parts.join('<hr style="border-color:var(--line)">') + '<small class="muted">Fonte: SRD 5.1 via dnd5eapi.co (testo in inglese)</small>'; })
    .catch(e => { body.innerHTML = offline(e); });
}

// ---------- Glossario online ----------
export function renderSrdGlossary(el, section, q, ctx) {
  const loaders = { 'srd-spells': api.spells, 'srd-items': api.magicItems, 'srd-monsters': () => api.monsters() };
  el.innerHTML = loading;
  loaders[section]().then(list => {
    const items = list.filter(x => !q || x.name.toLowerCase().includes(q));
    el.innerHTML = `<p class="muted" style="margin-top:0">${items.length} risultati${items.length > 80 ? ' (primi 80, affina la ricerca)' : ''} · dati SRD in inglese</p>` +
      items.slice(0, 80).map(x => `<div class="gloss-item srd-item" data-srd="${x.index}"><strong class="rollable">${esc(x.name)}</strong>${x.level != null ? ` <small class="muted">${lvLabel(x.level)}</small>` : ''}<div class="srd-slot"></div></div>`).join('');
  }).catch(e => { el.innerHTML = offline(e); });
  el.onclick = (e) => {
    const r = e.target.closest('[data-roll]');
    if (r) { e.stopPropagation(); return void doRoll(r.dataset.roll, r.dataset.label); }
    const it = e.target.closest('.srd-item > strong')?.parentElement; if (!it) return;
    const slot = it.querySelector('.srd-slot');
    if (slot.innerHTML) { slot.innerHTML = ''; return; }
    slot.innerHTML = loading;
    const idx = it.dataset.srd;
    const p = section === 'srd-spells' ? api.spell(idx).then(s => spellDetailHtml(s, ctx))
      : section === 'srd-items' ? api.magicItem(idx).then(m => `<div class="muted"><i>${esc(m.equipment_category?.name || '')} · ${esc(m.rarity?.name || '')}</i></div>${paras(m.desc)}`)
        : api.monster(idx).then(monsterHtml);
    p.then(h => { slot.innerHTML = `<div class="srd-inline">${h}</div>`; }).catch(err => { slot.innerHTML = offline(err); });
  };
}
