import { RACES, RACE_BY_ID, BACKGROUNDS, ALIGNMENTS } from './data/races.js';
import { CLASSES, CLASS_BY_ID } from './data/classes.js';
import { FEATS } from './data/feats.js';
import { ABILITIES, ABILITY_BY_ID, SKILLS, ARMORS, ARMOR_BY_ID, SHIELD, WEAPONS, WEAPON_BY_ID, CONDITIONS, TERMS, DICE } from './data/glossary.js';
import { AB, mod, fmt, derive, totalLevel, featAvailability, casterEntries } from './rules.js';
import { loadAll, saveAll, uid, exportJSON, defaultAppearance } from './storage.js';
import { esc, openModal, closeModal, doRoll, toast, getRollHistory, onRoll } from './ui.js';
import { openCreateWizard, openLevelUp, undoLastLevel } from './wizards.js';

const XP = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
const NOTE_TAGS = ['Sessione', 'PNG', 'Luogo', 'Missione', 'Bottino', 'Segreto', 'Altro'];
const TABS = [['scheda', 'Scheda'], ['magia', 'Magia & Risorse'], ['avanzamento', 'Avanzamento'], ['dadi', 'Dadi'], ['note', 'Note'], ['allineamento', 'Allineamento'], ['aspetto', 'Aspetto 3D']];

const state = { chars: loadAll(), currentId: null, tab: 'scheda', rollMode: 'normal', noteFilter: '', editingNote: null };
state.currentId = state.chars[0]?.id || null;
try { const t = localStorage.getItem('dnd5e-tab'); if (t) state.tab = t; } catch { /* storage non disponibile */ }

let viewer = null; let viewerLoading = null;
const cur = () => state.chars.find(c => c.id === state.currentId);
const $ = (s) => document.querySelector(s);

function persist() { const c = cur(); if (c) c.updated = Date.now(); saveAll(state.chars); }
function setPath(obj, path, value) {
  const keys = path.split('.'); let o = obj;
  for (let i = 0; i < keys.length - 1; i++) { o[keys[i]] ??= {}; o = o[keys[i]]; }
  o[keys.at(-1)] = value;
}
const classLine = (c) => c.classes.map(x => `${CLASS_BY_ID[x.id].name} ${x.level}${x.subclass ? ` (${x.subclass})` : ''}`).join(' / ');
const raceLine = (c, d) => d.sub && d.race.subraces.length > 1 ? d.sub.name : d.race?.name;

// ================= RENDER =================
function render() { renderList(); renderMain(); }

function renderList() {
  const el = $('#char-list');
  el.innerHTML = `<h4>Personaggi (${state.chars.length})</h4>` + (state.chars.map(c => {
    const d = derive(c);
    return `<button class="char-card ${c.id === state.currentId ? 'active' : ''}" data-select="${c.id}"><strong>${esc(c.name)}</strong><span>${esc(raceLine(c, d))} · Liv. ${d.lvl}</span><br><span>${esc(c.classes.map(x => CLASS_BY_ID[x.id].name + ' ' + x.level).join(' / '))}</span></button>`;
  }).join('') || '<p class="muted">Nessuna scheda. Crea il tuo primo eroe!</p>');
}

function renderMain() {
  const main = $('#main'); const c = cur();
  if (!c) {
    disposeViewer();
    main.innerHTML = `<div class="empty"><span class="sigil">⚔</span><h2>Benvenuto, avventuriero</h2><p class="muted">Crea più schede per D&amp;D 5e: la scheda si adatta a razza e classe (trucchetti, punti ki, ira, slot…),<br>ti guida nell'avanzamento di livello e mostra il tuo eroe in 3D.</p><button class="btn gold" data-action="new-char">+ Crea un personaggio</button></div>`;
    return;
  }
  const d = derive(c);
  const al = ALIGNMENTS.find(a => a.id === c.alignment);
  main.innerHTML = `
    <div class="char-header">
      <div>
        <input class="name-input" data-bind="name" value="${esc(c.name)}" aria-label="Nome del personaggio">
        <div class="subtitle">${esc(raceLine(c, d))} · ${esc(classLine(c))} · ${esc(BACKGROUNDS.find(b => b.id === c.background)?.name || '')}</div>
        <div class="badges" style="margin-top:6px">
          <span class="badge gold">Livello ${d.lvl}</span><span class="badge">Competenza ${fmt(d.prof)}</span>
          <span class="badge">${esc(al?.name || '')}</span>
          ${d.spell.isCaster ? '<span class="badge blue">✦ Incantatore</span>' : ''}
          ${d.resources.slice(0, 4).map(r => `<span class="badge red">${esc(r.name)}</span>`).join('')}
        </div>
      </div>
      <div class="row">
        <button class="btn gold" data-action="level-up" ${d.lvl >= 20 ? 'disabled' : ''}>▲ Sali di livello</button>
        <button class="btn ghost" data-action="export">⇩ Esporta</button>
        <button class="btn ghost" data-action="duplicate">⧉ Duplica</button>
        <button class="btn ghost" data-action="delete">🗑</button>
      </div>
    </div>
    <nav class="tabs">${TABS.map(([id, l]) => `<button class="tab ${state.tab === id ? 'active' : ''}" data-tab="${id}">${l}</button>`).join('')}</nav>
    <section id="tab-body"></section>`;
  const tb = $('#tab-body');
  if (state.tab !== 'aspetto') disposeViewer();
  ({ scheda: tabSheet, magia: tabMagic, avanzamento: tabAdvance, dadi: tabDice, note: tabNotes, allineamento: tabAlignment, aspetto: tabAppearance }[state.tab] || tabSheet)(tb, c, d);
}

// ---------- Scheda ----------
function tabSheet(el, c, d) {
  const hpCur = c.hp.current ?? d.hpMax;
  const hdUsed = c.hitDiceUsed || {};
  const featuresByClass = c.classes.map(x => {
    const cl = CLASS_BY_ID[x.id];
    const list = Object.entries(cl.features).filter(([l]) => +l <= x.level).flatMap(([l, fs]) => fs.map(f => `<li><span class="lvl">${cl.name.slice(0, 3)} ${l}</span>${esc(f)}</li>`));
    return list.join('');
  }).join('');
  el.innerHTML = `
  <div class="grid sheet-grid">
    <div class="stack">
      <div class="panel"><h3>Caratteristiche</h3>
        <div class="abilities">${ABILITIES.map(a => `<div class="ability" data-roll="1d20${fmt(d.m[a.id])}" data-label="Prova di ${a.name}" title="${esc(d.breakdown[a.id].map(b => `${b.src}: ${b.v}`).join('\n'))}">
          <div class="lbl">${a.short}</div><div class="modv">${fmt(d.m[a.id])}</div><span class="score">${d.scores[a.id]}</span></div>`).join('')}</div>
        <details style="margin-top:10px"><summary class="muted">Modifica punteggi base</summary>
          <div class="ab-assign" style="margin-top:8px">${AB.map(a => `<label class="field"><span>${ABILITY_BY_ID[a].short}</span><input type="number" min="1" max="30" data-bind="abilities.${a}" data-num value="${c.abilities[a]}"></label>`).join('')}</div>
          <small>I bonus di razza, ASI e talenti si sommano automaticamente.</small></details>
      </div>
      <div class="panel"><h3>Tiri salvezza</h3>
        <ul class="list">${ABILITIES.map(a => `<li><span class="dot ${d.saves[a.id].prof ? 'on' : ''}"></span><span class="rollable" data-roll="1d20${fmt(d.saves[a.id].bonus)}" data-label="TS ${a.name}">${a.name}</span><span class="val">${fmt(d.saves[a.id].bonus)}</span></li>`).join('')}</ul>
      </div>
    </div>
    <div class="stack">
      <div class="panel">
        <div class="stat-boxes">
          <div class="stat-box shield-ac" title="${esc(d.ac.label)}"><div class="big">${d.ac.value}</div><div class="lbl">CA</div></div>
          <div class="stat-box rollable" data-roll="1d20${fmt(d.initiative)}" data-label="Iniziativa"><div class="big">${fmt(d.initiative)}</div><div class="lbl">Iniziativa</div></div>
          <div class="stat-box"><div class="big">${d.speed}</div><div class="lbl">Velocità (m)</div></div>
        </div>
        <div class="row" style="margin-top:10px">
          <label class="field" style="flex:1"><span>Armatura</span><select data-bind="armorId">${ARMORS.map(a => `<option value="${a.id}" ${a.id === c.armorId ? 'selected' : ''}>${a.name}${a.type !== 'nessuna' ? ` (${a.type}, CA ${a.ac})` : ''}</option>`).join('')}</select></label>
          <label class="row" style="gap:4px"><input type="checkbox" data-bind="shield" ${c.shield ? 'checked' : ''}> Scudo</label>
          <label class="field"><span>Bonus CA</span><input type="number" data-bind="acBonus" data-num value="${c.acBonus || 0}"></label>
        </div>
        <small class="muted">${esc(d.ac.label)}</small>
        ${d.ac.warnings.map(w => `<div class="warn">⚠ ${esc(w)}</div>`).join('')}
      </div>
      <div class="panel"><div class="row between"><h3 style="margin:0">Punti ferita</h3><span class="big" style="font-family:var(--font-head);font-size:1.3rem">${hpCur} / ${d.hpMax}${c.hp.temp ? ` <span style="color:var(--magic)">+${c.hp.temp}</span>` : ''}</span></div>
        <div class="hp-bar" style="margin:8px 0"><div style="width:${Math.max(0, Math.min(100, hpCur / d.hpMax * 100))}%"></div></div>
        <div class="row">
          <input type="number" id="hp-amount" min="0" value="" placeholder="PF" style="width:80px">
          <button class="btn small" data-action="damage">Danno</button>
          <button class="btn small ghost" data-action="heal">Cura</button>
          <button class="btn small ghost" data-action="temp">PF temp.</button>
        </div>
        <h4 style="margin-top:12px">Dadi vita</h4>
        <div class="row">${Object.entries(d.hitDice).map(([die, n]) => `<div class="resource" style="padding:6px 10px"><b>d${die}</b> ${n - (hdUsed[die] || 0)}/${n}
          <button class="btn small ghost" data-action="spend-hd" data-die="${die}" ${n - (hdUsed[die] || 0) <= 0 ? 'disabled' : ''}>Spendi</button></div>`).join('')}</div>
        <h4 style="margin-top:12px">Tiri contro la morte</h4>
        <div class="row">Successi ${[0, 1, 2].map(i => `<button class="dot ${c.deathSaves.ok > i ? 'on' : ''}" data-death="ok:${i}"></button>`).join('')}
          &nbsp; Fallimenti ${[0, 1, 2].map(i => `<button class="dot ${c.deathSaves.ko > i ? 'exp' : ''}" data-death="ko:${i}"></button>`).join('')}
          <button class="btn small ghost" data-roll="1d20" data-label="Tiro contro la morte">🎲</button></div>
      </div>
      <div class="panel"><h3>Attacchi</h3>
        <div class="table-wrap"><table class="table"><tr><th>Arma</th><th>Colpire</th><th>Danni</th><th></th></tr>
        ${d.attacks.map((a, i) => `<tr><td><strong>${esc(a.name)}</strong><br><small>${esc(a.base.props.join(', ') || a.base.cat)} · ${ABILITY_BY_ID[a.ability].short}</small></td>
          <td><button class="btn small ghost" data-roll="1d20${fmt(a.toHit)}" data-label="Attacco: ${esc(a.name)}">${fmt(a.toHit)}</button></td>
          <td><button class="btn small ghost" data-roll="${esc(a.damage)}" data-label="Danni: ${esc(a.name)}">${esc(a.damage)}</button>${a.versatile ? `<br><button class="btn small ghost" data-roll="${esc(a.versatile)}" data-label="Danni (2 mani)">${esc(a.versatile)} 2m</button>` : ''}<br><small>${esc(a.type)}</small></td>
          <td><button class="icon-btn" data-action="del-weapon" data-i="${i}" title="Rimuovi">✕</button></td></tr>`).join('')}
        </table></div>
        <div class="row" style="margin-top:8px"><select id="add-weapon">${WEAPONS.map(w => `<option value="${w.id}">${w.name} (${w.dmg})</option>`).join('')}</select><button class="btn small" data-action="add-weapon">+ Aggiungi</button></div>
        <small class="muted">La prima arma è quella impugnata dal modello 3D.</small>
      </div>
    </div>
    <div class="stack">
      <div class="panel"><div class="row between"><h3 style="margin:0">Abilità</h3><small class="muted">Percezione passiva ${d.passive}</small></div>
        <small class="muted">Clic sul pallino: nessuna → competenza → maestria</small>
        <ul class="list" style="margin-top:6px">${SKILLS.map(s => { const k = d.skills[s.id]; return `<li><button class="dot ${k.prof === 'prof' ? 'on' : k.prof === 'exp' ? 'exp' : ''}" data-skill="${s.id}" title="${k.fromRace ? 'Competenza razziale' : ''}"></button>
          <span class="rollable" data-roll="1d20${fmt(k.bonus)}" data-label="${s.name}" title="${esc(s.desc)}">${s.name}</span><span class="ab-tag">${ABILITY_BY_ID[s.ability].short}</span><span class="val" style="margin-left:0">${fmt(k.bonus)}</span></li>`; }).join('')}</ul>
      </div>
      <div class="panel"><h3>Competenze &amp; linguaggi</h3>
        <p style="margin:0 0 6px"><b>Armature:</b> ${[...d.armorProf].join(', ') || 'nessuna'}<br><b>Armi:</b> ${esc(c.classes.map(x => CLASS_BY_ID[x.id].weapons).join('; '))}<br><b>Linguaggi razziali:</b> ${esc((d.race?.languages || []).join(', '))}</p>
        <label class="field"><span>Linguaggi e strumenti</span><textarea data-bind="languages" rows="2">${esc(c.languages)}</textarea></label>
        <label class="field" style="margin-top:6px"><span>Equipaggiamento e monete</span><textarea data-bind="equipment" rows="3">${esc(c.equipment)}</textarea></label>
      </div>
      <div class="panel"><h3>Privilegi e tratti</h3>
        <h4>Razza</h4><ul class="list feature-list">${[...(d.race?.traits || []), ...(d.sub?.traits || [])].map(t => `<li>${esc(t)}</li>`).join('')}</ul>
        <h4 style="margin-top:10px">Classi</h4><ul class="list feature-list">${featuresByClass}</ul>
        ${d.feats.length ? `<h4 style="margin-top:10px">Talenti</h4><ul class="list feature-list">${d.feats.map(f => `<li><span class="lvl">Liv. ${f.level}</span><b>${esc(f.name)}</b>${f.choice ? ` (${ABILITY_BY_ID[f.choice].short})` : ''} — <small>${esc(f.desc)}</small></li>`).join('')}</ul>` : ''}
        <label class="field" style="margin-top:8px"><span>Altri tratti (personalità, ideali, legami, difetti)</span><textarea data-bind="traitsText" rows="3">${esc(c.traitsText)}</textarea></label>
      </div>
    </div>
  </div>`;
}

// ---------- Magia & Risorse ----------
function tabMagic(el, c, d) {
  const sp = d.spell;
  const used = c.used || {};
  const cantripSources = [...sp.casters.filter(x => x.cantrips).map(x => x.name), ...(sp.featCantrips ? ['Talento'] : [])];
  const raceCantripNames = sp.raceCantrips.map(x => x.name);
  const ownCantrips = c.cantrips || [];
  const classCantripMax = sp.casters.reduce((s, x) => s + x.cantrips, 0) + sp.featCantrips;
  const spellsMax = sp.casters.reduce((s, x) => s + (x.known ?? x.prepared ?? 0), 0);
  el.innerHTML = `
  <div class="grid g2">
    <div class="stack">
      <div class="panel"><div class="row between"><h3 style="margin:0">Risorse di classe e razza</h3>
        <div class="row"><button class="btn small ghost" data-action="short-rest">☾ Riposo breve</button><button class="btn small" data-action="long-rest">✦ Riposo lungo</button></div></div>
        <div class="grid" style="margin-top:10px">${d.resources.map(r => {
          const u = used[r.key] || 0; const inf = r.max >= 99; const big = r.max > 20;
          return `<div class="resource"><div class="row between"><b>${esc(r.name)}</b><small class="muted">${esc(r.source)} · riposo ${r.recharge}</small></div>
            ${inf ? '<div class="ok">Illimitato</div>' : big ? `<div class="row" style="margin:6px 0"><div class="counter"><button data-res="${esc(r.key)}:1">−</button><b>${r.max - u}</b> / ${r.max}<button data-res="${esc(r.key)}:-1">+</button></div>
              <input type="number" min="1" style="width:70px" id="pool-${esc(r.key)}" placeholder="qtà"><button class="btn small ghost" data-pool="${esc(r.key)}">Usa</button></div>`
              : `<div class="pips">${Array.from({ length: r.max }, (_, i) => `<button class="pip ${i < u ? 'used' : ''}" data-respip="${esc(r.key)}:${i}" title="${i < u ? 'Usato' : 'Disponibile'}"></button>`).join('')}</div>`}
            ${r.die ? `<button class="btn small ghost" data-roll="${r.die.startsWith('d') ? '1' + r.die : r.die}" data-label="${esc(r.name)}">🎲 ${esc(r.die)}</button>` : ''}
            ${r.info ? `<small class="muted">${esc(r.info)}</small>` : ''}</div>`;
        }).join('') || '<p class="muted">Nessuna risorsa speciale a questo livello.</p>'}</div>
      </div>
      ${sp.isCaster ? `<div class="panel"><h3>Incantatore</h3>
        <div class="table-wrap"><table class="table"><tr><th>Fonte</th><th>Caratt.</th><th>CD</th><th>Attacco</th><th>Trucchetti</th><th>Incantesimi</th></tr>
        ${sp.casters.map(x => `<tr><td><b>${esc(x.name)}</b><br><small>${({ full: 'completo', half: 'parziale', third: '1/3', pact: 'patto' })[x.type]}</small></td><td>${ABILITY_BY_ID[x.ability].short}</td><td>${x.dc}</td>
          <td><button class="btn small ghost" data-roll="1d20${fmt(x.attack)}" data-label="Attacco con incantesimo">${fmt(x.attack)}</button></td><td>${x.cantrips}</td>
          <td>${x.known != null ? `${x.known} conosciuti` : `${x.prepared} preparati${x.spellbook ? '<br><small>+ libro degli incantesimi</small>' : ''}`}</td></tr>`).join('')}
        ${sp.raceCantrips.length ? `<tr><td><b>${esc(d.race.name)}</b><br><small>razziale</small></td><td>${sp.raceCantrips.map(x => ABILITY_BY_ID[x.ability].short).join('/')}</td>
          <td>${sp.raceCantrips.map(x => 8 + d.prof + d.m[x.ability]).join('/')}</td><td>${sp.raceCantrips.map(x => fmt(d.prof + d.m[x.ability])).join('/')}</td><td>${sp.raceCantrips.length}</td><td>${sp.raceSpells.map(s => esc(s.name)).join(', ') || '—'}</td></tr>` : ''}
        </table></div>
        <p class="muted" style="margin:6px 0 0">I trucchetti a danno tirano <b>${sp.cantripTier}</b> dado/i (livello personaggio ${d.lvl}).</p>
      </div>` : ''}
    </div>
    <div class="stack">
      ${sp.slots.length || sp.pact ? `<div class="panel"><h3>Slot incantesimo</h3>
        ${sp.casters.length > 1 && sp.slots.length ? `<p class="muted" style="margin:0 0 6px">Multiclasse: livello da incantatore combinato ${sp.casterLevel}.</p>` : ''}
        ${sp.slots.map((n, i) => { const u = c.slotsUsed?.[i + 1] || 0; return `<div class="slot-row"><span class="lv">${i + 1}° liv.</span><div class="pips">${Array.from({ length: n }, (_, k) => `<button class="pip slot ${k < u ? 'used' : ''}" data-slot="${i + 1}:${k}"></button>`).join('')}</div><small class="muted">${n - u}/${n}</small></div>`; }).join('')}
        ${sp.pact ? `<div class="slot-row"><span class="lv" style="color:#c8a0f0">Patto</span><div class="pips">${Array.from({ length: sp.pact.slots }, (_, k) => `<button class="pip pact ${k < (c.pactUsed || 0) ? 'used' : ''}" data-pact="${k}"></button>`).join('')}</div><small class="muted">slot di ${sp.pact.level}° (riposo breve)</small></div>` : ''}
      </div>` : ''}
      ${sp.isCaster ? `<div class="panel"><div class="row between"><h3 style="margin:0">Trucchetti</h3><span class="badge blue">${ownCantrips.length + raceCantripNames.length} / ${sp.totalCantrips}</span></div>
        ${cantripSources.length ? `<small class="muted">Da: ${esc(cantripSources.join(', '))}${raceCantripNames.length ? ' + razza' : ''}</small>` : ''}
        <ul class="list" style="margin-top:6px">
          ${raceCantripNames.map(n => `<li>✧ ${esc(n)} <small class="muted">(${esc(d.race.name)})</small></li>`).join('')}
          ${ownCantrips.map((n, i) => `<li>✧ ${esc(n)}<button class="icon-btn" style="margin-left:auto" data-action="del-cantrip" data-i="${i}">✕</button></li>`).join('')}
        </ul>
        ${ownCantrips.length < classCantripMax || raceCantripNames.some(n => /scelta/.test(n)) ? `<div class="row" style="margin-top:6px"><input id="new-cantrip" placeholder="Nome trucchetto (es. Fiamma sacra)" style="flex:1"><button class="btn small" data-action="add-cantrip">+</button></div>` : '<small class="ok">Trucchetti al completo.</small>'}
      </div>
      ${spellsMax || sp.slots.length || sp.pact ? `<div class="panel"><div class="row between"><h3 style="margin:0">Incantesimi</h3><span class="badge blue">${(c.spells || []).filter(s => s.prepared).length} preparati · max ${spellsMax}</span></div>
        <div class="table-wrap"><table class="table"><tr><th>Prep.</th><th>Nome</th><th>Liv.</th><th></th></tr>
          ${(c.spells || []).slice().sort((a, b) => a.level - b.level).map(s => `<tr><td><input type="checkbox" data-spellprep="${s.id}" ${s.prepared ? 'checked' : ''}></td><td>${esc(s.name)}</td><td>${s.level}°</td><td><button class="icon-btn" data-action="del-spell" data-id="${s.id}">✕</button></td></tr>`).join('')}
        </table></div>
        <div class="row" style="margin-top:6px"><input id="new-spell" placeholder="Nome incantesimo" style="flex:1"><select id="new-spell-lv">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(l => `<option value="${l}">${l}°</option>`).join('')}</select><button class="btn small" data-action="add-spell">+</button></div>
      </div>` : ''}` : `<div class="panel"><h3>Magia</h3><p class="muted">Questo personaggio non lancia incantesimi. Diventerà un incantatore con una classe magica in multiclasse, con sottoclassi come <i>Cavaliere mistico</i> o <i>Mistificatore arcano</i>, o con il talento <i>Iniziato alla magia</i>.</p></div>`}
    </div>
  </div>`;
}

// ---------- Avanzamento ----------
function tabAdvance(el, c, d) {
  const nextXp = XP[d.lvl] ?? null;
  const planner = c.classes.map(x => {
    const cl = CLASS_BY_ID[x.id];
    const rows = [];
    for (let l = x.level + 1; l <= Math.min(20, x.level + 6); l++) {
      const tags = [];
      if (cl.asi.includes(l)) tags.push('<span class="badge gold">ASI / talento</span>');
      if (l === cl.subclassLevel) tags.push(`<span class="badge red">${esc(cl.subclassLabel)}</span>`);
      rows.push(`<tr><td>${cl.name} ${l}</td><td>${(cl.features[l] || []).map(esc).join(', ') || '<span class="muted">—</span>'} ${tags.join(' ')}</td></tr>`);
    }
    return rows.join('');
  }).join('');
  const featsOk = FEATS.map(f => ({ f, av: featAvailability(f, c, d) }));
  el.innerHTML = `
  <div class="grid g2">
    <div class="stack">
      <div class="panel"><h3>Livello ed esperienza</h3>
        <div class="row"><span style="font-family:var(--font-head);font-size:2rem">${d.lvl}</span>
          <label class="field"><span>Punti esperienza</span><input type="number" min="0" data-bind="xp" data-num value="${c.xp || 0}" style="width:120px"></label>
          ${nextXp != null ? `<span class="muted">Prossimo livello a ${nextXp.toLocaleString('it')} PE</span>` : ''}</div>
        ${nextXp != null ? `<div class="hp-bar temp" style="margin:8px 0"><div style="width:${Math.min(100, ((c.xp || 0) - XP[d.lvl - 1]) / (nextXp - XP[d.lvl - 1]) * 100)}%"></div></div>` : ''}
        ${nextXp != null && (c.xp || 0) >= nextXp ? '<div class="callout">Hai abbastanza esperienza per salire di livello!</div>' : ''}
        <div class="row" style="margin-top:10px"><button class="btn gold" data-action="level-up" ${d.lvl >= 20 ? 'disabled' : ''}>▲ Sali di livello</button>
          <button class="btn ghost" data-action="undo-level" ${c.levelHistory.length <= 1 ? 'disabled' : ''}>↶ Annulla ultimo livello</button></div>
      </div>
      <div class="panel"><h3>Prossimi livelli</h3>
        <div class="table-wrap"><table class="table"><tr><th>Livello</th><th>Cosa ottieni</th></tr>${planner || '<tr><td colspan="2">Livello massimo</td></tr>'}</table></div>
      </div>
      <div class="panel"><h3>Cronologia</h3>
        <div class="table-wrap"><table class="table"><tr><th>Liv.</th><th>Classe</th><th>PF</th><th>Scelta</th></tr>
        ${c.levelHistory.map(h => { const a = c.asiLog.find(e => e.level === h.charLevel); return `<tr><td>${h.charLevel}</td><td>${CLASS_BY_ID[h.classId].name}</td><td>${h.hp}${h.charLevel === 1 ? ' (max)' : ''} ${fmt(d.m.con)}</td>
          <td>${a ? (a.featId ? esc(FEATS.find(f => f.id === a.featId)?.name) : Object.entries(a.changes).map(([k, v]) => `${ABILITY_BY_ID[k].short} +${v}`).join(', ')) : ''}</td></tr>`; }).join('')}
        </table></div>
      </div>
    </div>
    <div class="stack">
      <div class="panel"><h3>Multiclasse</h3>
        <p class="muted" style="margin-top:0">Requisiti: almeno 13 nelle caratteristiche primarie della classe attuale <i>e</i> della nuova.</p>
        <div class="table-wrap"><table class="table"><tr><th>Classe</th><th>Requisito</th><th></th></tr>
        ${CLASSES.map(cl => { const r = cl.multiclassReq; const txt = r.any ? Object.entries(r.any).map(([a, v]) => `${ABILITY_BY_ID[a].short} ${v}`).join(' o ') : Object.entries(r).map(([a, v]) => `${ABILITY_BY_ID[a].short} ${v}`).join(' e ');
          const ok = r.any ? Object.entries(r.any).some(([a, v]) => d.scores[a] >= v) : Object.entries(r).every(([a, v]) => d.scores[a] >= v);
          return `<tr class="${ok ? '' : 'locked'}"><td>${cl.name}</td><td>${txt}</td><td>${ok ? '<span class="ok">✓</span>' : '<span class="warn">✗</span>'}</td></tr>`; }).join('')}
        </table></div>
      </div>
      <div class="panel"><h3>Talenti accessibili ora</h3>
        <p class="muted" style="margin-top:0">${featsOk.filter(x => x.av.ok).length} talenti disponibili con i punteggi e le competenze attuali.</p>
        <ul class="list">${featsOk.map(({ f, av }) => `<li class="${av.ok ? '' : 'locked'}" title="${esc(f.desc)}"><span>${av.ok ? '✓' : '✗'}</span><span><b>${esc(f.name)}</b>${f.asi ? ` <small>(+1 ${f.asi.choose.map(a => ABILITY_BY_ID[a].short).join('/')})</small>` : ''}<br><small class="muted">${esc(av.ok ? f.desc : av.reason)}</small></span></li>`).join('')}</ul>
      </div>
    </div>
  </div>`;
}

// ---------- Dadi ----------
function tabDice(el, c, d) {
  const groups = {};
  d.dice.forEach(x => { (groups[x.group] ??= []).push(x); });
  const hist = getRollHistory();
  el.innerHTML = `
  <div class="grid g2">
    <div class="stack">
      <div class="panel"><h3>Lanciadadi</h3>
        <div class="row" style="margin-bottom:10px">${[['normal', 'Normale'], ['adv', 'Vantaggio'], ['dis', 'Svantaggio']].map(([m, l]) => `<button class="btn small ${state.rollMode === m ? 'gold' : 'ghost'}" data-rollmode="${m}">${l}</button>`).join('')}</div>
        <div class="dice-buttons">${DICE.map(n => `<button class="die-btn" data-roll="1d${n}" data-label="d${n}">d${n}</button>`).join('')}</div>
        <div class="row" style="margin-top:12px"><input id="dice-expr" placeholder="Es. 2d6+3, 4d6kh3, 1d20+5" style="flex:1"><button class="btn" data-action="roll-expr">Tira</button></div>
      </div>
      <div class="panel"><h3>Dadi del personaggio</h3>
        ${Object.entries(groups).map(([g, list]) => `<h4 style="margin-top:8px">${esc(g)}</h4><ul class="list">${list.map(x => {
          const m = /^(\d*d\d+(?:\s*[+-]\s*\d+)?)/.exec(String(x.value).replace(/\s/g, ''));
          return `<li><span>${esc(x.label)}</span><span class="val" style="font-family:var(--font-body)">${m ? `<button class="btn small ghost" data-roll="${esc(m[1].startsWith('d') ? '1' + m[1] : m[1])}" data-label="${esc(x.label)}">${esc(x.value)}</button>` : esc(x.value)}</span></li>`;
        }).join('')}</ul>`).join('')}
        <h4 style="margin-top:8px">Armi</h4><ul class="list">${d.attacks.map(a => `<li><span>${esc(a.name)}</span><span class="val" style="font-family:var(--font-body)">
          <button class="btn small ghost" data-roll="1d20${fmt(a.toHit)}" data-label="Attacco: ${esc(a.name)}">d20${fmt(a.toHit)}</button>
          <button class="btn small ghost" data-roll="${esc(a.damage)}" data-label="Danni: ${esc(a.name)}">${esc(a.damage)}</button></span></li>`).join('') || '<li class="muted">Nessuna arma</li>'}</ul>
        ${d.spell.casters.length ? `<h4 style="margin-top:8px">Magia</h4><ul class="list">${d.spell.casters.map(x => `<li>${esc(x.name)}<span class="val" style="font-family:var(--font-body)">CD ${x.dc} · <button class="btn small ghost" data-roll="1d20${fmt(x.attack)}" data-label="Attacco con incantesimo">d20${fmt(x.attack)}</button></span></li>`).join('')}</ul>` : ''}
      </div>
    </div>
    <div class="panel"><h3>Storico tiri</h3>
      <div class="history" id="roll-history">${historyHtml(hist)}</div>
      <h4 style="margin-top:14px">Guida rapida</h4>
      <ul class="list"><li><b>d20</b> attacchi, prove e tiri salvezza</li><li><b>Dado vita</b> recupero PF nel riposo breve (+COS)</li><li><b>Critico</b> raddoppia i dadi di danno (non i modificatori)</li><li><b>4d6kh3</b> generazione caratteristiche (tieni i 3 migliori)</li></ul>
    </div>
  </div>`;
}
const historyHtml = (hist) => hist.map(h => `<div class="gloss-item"><span style="float:right;font-family:var(--font-head);font-size:1.2rem" class="${h.crit === 'crit' ? 'ok' : h.crit === 'fumble' ? 'warn' : ''}">${h.total}</span><strong>${esc(h.label || h.expr)}</strong><br><small class="muted">${esc(h.expr)} → ${esc(h.detail)} · ${h.time.toLocaleTimeString('it')}</small></div>`).join('') || '<p class="muted">Ancora nessun tiro. Clicca su qualsiasi valore della scheda per tirare.</p>';
onRoll(() => { const h = document.getElementById('roll-history'); if (h) h.innerHTML = historyHtml(getRollHistory()); });

// ---------- Note ----------
function tabNotes(el, c) {
  const q = state.noteFilter.toLowerCase();
  const notes = (c.notes || []).filter(n => !q || (n.title + n.body + n.tag).toLowerCase().includes(q)).sort((a, b) => b.date - a.date);
  const editing = (c.notes || []).find(n => n.id === state.editingNote);
  el.innerHTML = `
  <div class="grid g2">
    <div class="panel"><h3>${editing ? 'Modifica nota' : 'Nuova nota'}</h3>
      <div class="stack">
        <div class="row"><input id="note-title" placeholder="Titolo" style="flex:1" value="${esc(editing?.title || '')}"><select id="note-tag">${NOTE_TAGS.map(t => `<option ${editing?.tag === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
        <textarea id="note-body" rows="8" placeholder="Cosa è successo? Chi avete incontrato? Quali indizi?">${esc(editing?.body || '')}</textarea>
        <div class="row"><button class="btn" data-action="save-note">${editing ? 'Salva modifiche' : '+ Aggiungi nota'}</button>${editing ? '<button class="btn ghost" data-action="cancel-note">Annulla</button>' : ''}</div>
      </div>
    </div>
    <div class="panel"><div class="row between"><h3 style="margin:0">Diario (${(c.notes || []).length})</h3><input id="note-filter" placeholder="Cerca…" value="${esc(state.noteFilter)}"></div>
      <div style="margin-top:8px">${notes.map(n => `<div class="gloss-item"><div class="row between"><strong>${esc(n.title || 'Senza titolo')}</strong><span><span class="badge">${esc(n.tag)}</span>
        <button class="icon-btn" data-action="edit-note" data-id="${n.id}">✎</button><button class="icon-btn" data-action="del-note" data-id="${n.id}">✕</button></span></div>
        <small class="muted">${new Date(n.date).toLocaleString('it')}</small><div style="white-space:pre-wrap">${esc(n.body)}</div></div>`).join('') || '<p class="muted">Nessuna nota.</p>'}</div>
    </div>
  </div>`;
}

// ---------- Allineamento ----------
function alignmentState(c) {
  const base = ALIGNMENTS.find(a => a.id === c.alignment) || ALIGNMENTS[4];
  let law = base.law * 4, good = base.good * 4;
  for (const m of c.alignmentMoments || []) { law += +m.law || 0; good += +m.good || 0; }
  law = Math.max(-6, Math.min(6, law)); good = Math.max(-6, Math.min(6, good));
  const toAxis = (v) => (v >= 2 ? 1 : v <= -2 ? -1 : 0);
  const trend = ALIGNMENTS.find(a => a.law === toAxis(law) && a.good === toAxis(good));
  return { base, law, good, trend };
}
function tabAlignment(el, c) {
  const s = alignmentState(c);
  const order = ['LB', 'NB', 'CB', 'LN', 'N', 'CN', 'LM', 'NM', 'CM'];
  const x = (1 - (s.law + 6) / 12) * 100; const y = (1 - (s.good + 6) / 12) * 100;
  el.innerHTML = `
  <div class="grid g2">
    <div class="panel"><h3>Bussola morale</h3>
      <div class="align-grid">${order.map(id => { const a = ALIGNMENTS.find(z => z.id === id); return `<div class="align-cell ${a.id === s.base.id ? 'base' : ''} ${a.id === s.trend.id && a.id !== s.base.id ? 'trend' : ''}">${a.name}</div>`; }).join('')}
        <div class="align-marker" style="left:${x}%;top:${y}%" title="Tendenza attuale"></div></div>
      <p style="margin-top:10px">Allineamento dichiarato: <b>${s.base.name}</b>.<br>Tendenza dalle azioni: <b>${s.trend.name}</b>
      ${s.trend.id !== s.base.id ? `<br><span class="warn">Il comportamento recente si sta allontanando dall'allineamento dichiarato.</span> <button class="btn small ghost" data-action="adopt-align" data-id="${s.trend.id}">Adotta ${s.trend.name}</button>` : '<br><span class="ok">Le azioni sono coerenti con l\'allineamento.</span>'}</p>
      <label class="field"><span>Allineamento dichiarato</span><select data-bind="alignment">${ALIGNMENTS.map(a => `<option value="${a.id}" ${a.id === c.alignment ? 'selected' : ''}>${a.name}</option>`).join('')}</select></label>
      <small class="muted">Asse orizzontale: Legale ↔ Caotico · Asse verticale: Buono ↔ Malvagio. Ogni momento sposta il segnalino.</small>
    </div>
    <div class="panel"><h3>Momenti di allineamento</h3>
      <div class="stack">
        <textarea id="moment-desc" rows="3" placeholder="Es. Ha risparmiato il bandito che implorava pietà, contro gli ordini del capitano."></textarea>
        <div class="row">
          <label class="field"><span>Ordine ↔ Caos</span><select id="moment-law"><option value="2">Molto legale (+2)</option><option value="1">Legale (+1)</option><option value="0" selected>Neutro</option><option value="-1">Caotico (−1)</option><option value="-2">Molto caotico (−2)</option></select></label>
          <label class="field"><span>Bene ↔ Male</span><select id="moment-good"><option value="2">Molto buono (+2)</option><option value="1">Buono (+1)</option><option value="0" selected>Neutro</option><option value="-1">Malvagio (−1)</option><option value="-2">Molto malvagio (−2)</option></select></label>
          <button class="btn" data-action="add-moment">+ Registra</button>
        </div>
      </div>
      <div style="margin-top:14px">${(c.alignmentMoments || []).slice().reverse().map(m => `<div class="moment"><div class="row between"><small class="muted">${new Date(m.date).toLocaleDateString('it')} · Liv. ${m.level || '?'}</small>
        <span>${m.law ? `<span class="badge">${m.law > 0 ? 'Legale' : 'Caotico'} ${fmt(+m.law)}</span>` : ''} ${m.good ? `<span class="badge ${m.good > 0 ? 'gold' : 'red'}">${m.good > 0 ? 'Buono' : 'Malvagio'} ${fmt(+m.good)}</span>` : ''}<button class="icon-btn" data-action="del-moment" data-id="${m.id}">✕</button></span></div>${esc(m.desc)}</div>`).join('') || '<p class="muted">Nessun momento registrato.</p>'}</div>
    </div>
  </div>`;
}

// ---------- Aspetto 3D ----------
function tabAppearance(el, c, d) {
  const ap = { ...defaultAppearance(), ...(c.appearance || {}) };
  const defaultSkin = d.sub?.skin || d.race?.skin || '#c9a184';
  el.innerHTML = `
  <div class="viewer-wrap">
    <div class="viewer" id="viewer"><div class="caption">${esc(c.name)}<small>${esc(raceLine(c, d))} · ${esc(classLine(c))}</small></div></div>
    <div class="stack">
      <div class="panel"><h3>Aspetto</h3>
        <div class="grid g2">
          <label class="field"><span>Pelle</span><input type="color" data-bind="appearance.skin" value="${ap.skin || defaultSkin}"></label>
          <label class="field"><span>Capelli</span><input type="color" data-bind="appearance.hair" value="${ap.hair}"></label>
          <label class="field"><span>Occhi</span><input type="color" data-bind="appearance.eyes" value="${ap.eyes}"></label>
          <label class="field"><span>Mantello</span><input type="color" data-bind="appearance.cloak" value="${ap.cloak}"></label>
          <label class="field"><span>Metallo</span><input type="color" data-bind="appearance.metal" value="${ap.metal}"></label>
          <label class="field"><span>Acconciatura</span><select data-bind="appearance.hairStyle">${['calvo', 'corti', 'lunghi', 'coda', 'treccia', 'cresta'].map(h => `<option ${ap.hairStyle === h ? 'selected' : ''}>${h}</option>`).join('')}</select></label>
        </div>
        <div class="row" style="margin-top:8px">
          <label><input type="checkbox" data-bind="appearance.beard" ${ap.beard ? 'checked' : ''}> Barba</label>
          <label><input type="checkbox" data-bind="appearance.scar" ${ap.scar ? 'checked' : ''}> Cicatrice</label>
          <label><input type="checkbox" data-bind="appearance.glow" ${ap.glow ? 'checked' : ''}> Occhi luminosi</label>
        </div>
        <div class="row" style="margin-top:10px"><button class="btn small ghost" data-action="reset-skin">Pelle razziale</button><button class="btn small ghost" data-action="toggle-rotate">⟳ Rotazione</button><button class="btn small" data-action="screenshot">📷 Ritratto</button></div>
      </div>
      <div class="panel"><h3>Cosa influenza il modello</h3>
        <ul class="list" style="font-size:.92rem">
          <li><b>Razza</b>: altezza, corporatura, orecchie, corna, coda, zanne, barba, testa draconica</li>
          <li><b>FOR ${d.scores.str}</b>: spalle e braccia</li>
          <li><b>COS ${d.scores.con}</b>: robustezza del torso</li>
          <li><b>DES ${d.scores.dex}</b>: figura più slanciata</li>
          <li><b>CAR ${d.scores.cha}</b>: portamento${d.scores.cha >= 14 ? ', bordure dorate' : ''}</li>
          <li><b>Classe</b>: abiti, cappuccio, mantello, aura magica</li>
          <li><b>Armatura</b> (${esc(ARMOR_BY_ID[c.armorId]?.name)}) e <b>prima arma</b> della scheda</li>
        </ul>
      </div>
    </div>
  </div>`;
  mountViewer(c, d);
}

async function mountViewer(c, d) {
  const host = document.getElementById('viewer');
  if (!host) return;
  try {
    if (!viewerLoading) viewerLoading = import('./viewer3d.js');
    const mod3d = await viewerLoading;
    if (!document.getElementById('viewer')) return;
    if (viewer && viewer.host !== host) disposeViewer();
    if (!viewer) { viewer = mod3d.createViewer(host); viewer.host = host; }
    viewer.update(c, d);
  } catch (e) {
    console.error(e);
    host.insertAdjacentHTML('beforeend', `<p class="warn" style="padding:20px">Impossibile avviare il visualizzatore 3D (WebGL non disponibile?).<br>${esc(e.message)}</p>`);
  }
}
function disposeViewer() { if (viewer) { viewer.dispose(); viewer = null; } }

// ---------- Glossario ----------
function openGlossary(section = 'abilita') {
  const sections = [['abilita', 'Abilità'], ['caratteristiche', 'Caratteristiche'], ['armature', 'Armature'], ['armi', 'Armi'], ['condizioni', 'Condizioni'], ['regole', 'Regole'], ['talenti', 'Talenti'], ['classi', 'Classi'], ['razze', 'Razze']];
  let q = '';
  const modal = openModal(`<header><h2>📖 Glossario</h2><button class="icon-btn" data-close>✕</button></header><div class="body"><div class="row" style="margin-bottom:10px"><input id="gloss-q" placeholder="Cerca nel glossario…" style="flex:1"></div><nav class="tabs" id="gloss-tabs"></nav><div id="gloss-body"></div></div>`);
  const match = (...s) => !q || s.join(' ').toLowerCase().includes(q);
  function draw() {
    modal.querySelector('#gloss-tabs').innerHTML = sections.map(([id, l]) => `<button class="tab ${id === section ? 'active' : ''}" data-gsec="${id}">${l}</button>`).join('');
    const b = modal.querySelector('#gloss-body');
    const item = (title, desc, extra = '') => `<div class="gloss-item"><strong>${esc(title)}</strong>${extra ? ` <small class="muted">${extra}</small>` : ''}<div>${esc(desc)}</div></div>`;
    if (section === 'abilita') b.innerHTML = SKILLS.filter(s => match(s.name, s.desc)).map(s => item(s.name, s.desc, ABILITY_BY_ID[s.ability].name)).join('');
    if (section === 'caratteristiche') b.innerHTML = ABILITIES.filter(a => match(a.name, a.desc)).map(a => item(`${a.name} (${a.short})`, a.desc)).join('') + item('Modificatore', 'Modificatore = (punteggio − 10) / 2, arrotondato per difetto. 10–11 = +0, 12–13 = +1, 8–9 = −1…');
    if (section === 'armature') b.innerHTML = `<div class="table-wrap"><table class="table"><tr><th>Armatura</th><th>Tipo</th><th>CA</th><th>FOR</th><th>Furtività</th><th>Peso</th><th>Costo</th></tr>
      ${[...ARMORS.filter(a => a.type !== 'nessuna'), SHIELD].filter(a => match(a.name, a.desc, a.type)).map(a => `<tr title="${esc(a.desc)}"><td><b>${a.name}</b><br><small class="muted">${esc(a.desc)}</small></td><td>${a.type}</td><td>${a.id === 'scudo' ? '+2' : a.ac + (a.dexMax == null ? ' + DES' : a.dexMax ? ' + DES (max 2)' : '')}</td><td>${a.str || '—'}</td><td>${a.stealth ? 'Svantaggio' : '—'}</td><td>${a.weight} kg</td><td>${a.cost}</td></tr>`).join('')}</table></div>
      ${item('Indossare e togliere', 'Leggera: 1 min / 1 min. Media: 5 min / 1 min. Pesante: 10 min / 5 min. Scudo: 1 azione.')}`;
    if (section === 'armi') b.innerHTML = `<div class="table-wrap"><table class="table"><tr><th>Arma</th><th>Categoria</th><th>Danni</th><th>Proprietà</th></tr>
      ${WEAPONS.filter(w => match(w.name, w.type, w.props.join(' '), w.cat)).map(w => `<tr><td><b>${w.name}</b></td><td>${w.cat}, ${w.range}</td><td>${w.dmg}${w.versatile ? ` (${w.versatile})` : ''} ${w.type}</td><td>${w.props.join(', ') || '—'}</td></tr>`).join('')}</table></div>`;
    if (section === 'condizioni') b.innerHTML = CONDITIONS.filter(x => match(x.name, x.desc)).map(x => item(x.name, x.desc)).join('');
    if (section === 'regole') b.innerHTML = TERMS.filter(x => match(x.name, x.desc)).map(x => item(x.name, x.desc)).join('');
    if (section === 'talenti') b.innerHTML = FEATS.filter(f => match(f.name, f.desc)).map(f => item(f.name, f.desc, [f.asi ? `+1 ${f.asi.choose.map(a => ABILITY_BY_ID[a].short).join('/')}` : '', f.prereq ? 'con requisiti' : ''].filter(Boolean).join(' · '))).join('');
    if (section === 'classi') b.innerHTML = CLASSES.filter(cl => match(cl.name, cl.subclasses.join(' '))).map(cl => item(cl.name, `Dado vita d${cl.hitDie}. TS: ${cl.saves.map(a => ABILITY_BY_ID[a].short).join(', ')}. Armature: ${cl.armor.join(', ') || 'nessuna'}. Armi: ${cl.weapons}. ${cl.subclassLabel} al livello ${cl.subclassLevel}: ${cl.subclasses.join(', ')}. ASI ai livelli ${cl.asi.join(', ')}.`, cl.spellcasting ? '✦ incantatore' : '')).join('');
    if (section === 'razze') b.innerHTML = RACES.filter(r => match(r.name, r.traits.join(' '))).map(r => item(r.name, `${Object.entries(r.bonus).map(([a, v]) => `${ABILITY_BY_ID[a].short} +${v}`).join(', ')}. Taglia ${r.size}, velocità ${r.speed} m. ${r.traits.join('; ')}. Sottorazze: ${r.subraces.map(s => s.name).join(', ')}.`)).join('');
    if (!b.innerHTML.trim()) b.innerHTML = '<p class="muted">Nessun risultato.</p>';
  }
  modal.addEventListener('click', (e) => {
    const t = e.target.closest('[data-gsec],[data-close]'); if (!t) return;
    if (t.hasAttribute('data-close')) return closeModal();
    section = t.dataset.gsec; draw();
  });
  modal.querySelector('#gloss-q').addEventListener('input', (e) => { q = e.target.value.toLowerCase().trim(); draw(); });
  draw();
}

// ================= EVENTI =================
document.addEventListener('click', (e) => {
  if (e.target.closest('#modal-root')) return;
  const c = cur();
  const t = e.target.closest('[data-action],[data-select],[data-tab],[data-roll],[data-skill],[data-respip],[data-res],[data-pool],[data-slot],[data-pact],[data-death],[data-rollmode]');
  if (!t) return;
  if (t.dataset.select) { state.currentId = t.dataset.select; state.editingNote = null; return render(); }
  if (t.dataset.tab) { state.tab = t.dataset.tab; try { localStorage.setItem('dnd5e-tab', state.tab); } catch { /* ignora */ } return renderMain(); }
  if (t.dataset.roll) return void doRoll(t.dataset.roll, t.dataset.label, t.dataset.roll.includes('d20') ? state.rollMode : 'normal');
  if (t.dataset.rollmode) { state.rollMode = t.dataset.rollmode; return renderMain(); }
  if (c && t.dataset.skill) {
    const k = t.dataset.skill; const v = c.skills[k];
    c.skills[k] = v === 'prof' ? 'exp' : v === 'exp' ? null : 'prof';
    persist(); return renderMain();
  }
  if (c && t.dataset.respip) {
    const [key, i] = t.dataset.respip.split(/:(?=\d+$)/); const u = c.used[key] || 0;
    c.used[key] = +i < u ? +i : +i + 1; persist(); return renderMain();
  }
  if (c && t.dataset.res) {
    const [key, dv] = t.dataset.res.split(/:(?=-?\d+$)/); const r = derive(c).resources.find(x => x.key === key);
    c.used[key] = Math.max(0, Math.min(r.max, (c.used[key] || 0) + +dv)); persist(); return renderMain();
  }
  if (c && t.dataset.pool) {
    const key = t.dataset.pool; const inp = document.getElementById('pool-' + key); const n = +inp?.value || 0;
    const r = derive(c).resources.find(x => x.key === key);
    c.used[key] = Math.min(r.max, (c.used[key] || 0) + n); persist(); return renderMain();
  }
  if (c && t.dataset.slot) {
    const [lv, i] = t.dataset.slot.split(':').map(Number); const u = c.slotsUsed[lv] || 0;
    c.slotsUsed[lv] = i < u ? i : i + 1; persist(); return renderMain();
  }
  if (c && t.dataset.pact) { const i = +t.dataset.pact; c.pactUsed = i < (c.pactUsed || 0) ? i : i + 1; persist(); return renderMain(); }
  if (c && t.dataset.death) {
    const [k, i] = t.dataset.death.split(':'); c.deathSaves[k] = c.deathSaves[k] > +i ? +i : +i + 1; persist(); return renderMain();
  }
  const a = t.dataset.action; if (!a) return;
  const actions = {
    'new-char': () => openCreateWizard((nc) => { state.chars.push(nc); state.currentId = nc.id; state.tab = 'scheda'; persist(); render(); toast(`<strong>${esc(nc.name)}</strong><div>è pronto all'avventura.</div>`); }),
    'open-glossary': () => openGlossary(),
    'level-up': () => openLevelUp(c, (n, info) => {
      Object.assign(c, n); c.hp.current = (c.hp.current ?? null) === null ? null : c.hp.current + info.hpGain + derive(c).m.con;
      persist(); render();
      toast(`<strong>Livello ${totalLevel(c)}!</strong><div>${esc(CLASS_BY_ID[info.classId].name)} ${info.clsLevel}</div>`, 'crit');
    }),
    'undo-level': () => { if (confirm('Annullare l\'ultimo livello acquisito?')) { undoLastLevel(c); persist(); render(); } },
    export: () => exportJSON(c, `${c.name.replace(/[^\w-]+/g, '_')}.json`),
    duplicate: () => { const n = structuredClone(c); n.id = uid(); n.name += ' (copia)'; state.chars.push(n); state.currentId = n.id; persist(); render(); },
    delete: () => { if (confirm(`Eliminare definitivamente ${c.name}?`)) { state.chars = state.chars.filter(x => x.id !== c.id); state.currentId = state.chars[0]?.id || null; persist(); render(); } },
    damage: () => hpChange(c, 'damage'), heal: () => hpChange(c, 'heal'), temp: () => hpChange(c, 'temp'),
    'spend-hd': () => {
      const die = t.dataset.die; const d = derive(c);
      const r = doRoll(`1d${die}${fmt(d.m.con)}`, `Dado vita d${die}`); if (!r) return;
      c.hitDiceUsed[die] = (c.hitDiceUsed[die] || 0) + 1;
      c.hp.current = Math.min(d.hpMax, (c.hp.current ?? d.hpMax) + Math.max(0, r.total)); persist(); renderMain();
    },
    'add-weapon': () => { c.weapons.push({ weaponId: $('#add-weapon').value }); persist(); renderMain(); },
    'del-weapon': () => { c.weapons.splice(+t.dataset.i, 1); persist(); renderMain(); },
    'short-rest': () => { const d = derive(c); d.resources.filter(r => r.recharge === 'breve').forEach(r => { c.used[r.key] = 0; }); c.pactUsed = 0; persist(); renderMain(); toast('<strong>Riposo breve</strong><div>Risorse a riposo breve e slot del patto ripristinati. Spendi i dadi vita dalla Scheda.</div>'); },
    'long-rest': () => {
      const d = derive(c); c.used = {}; c.slotsUsed = {}; c.pactUsed = 0; c.hp.current = d.hpMax; c.hp.temp = 0; c.deathSaves = { ok: 0, ko: 0 };
      // recupera metà dei dadi vita (minimo 1)
      let rec = Math.max(1, Math.floor(d.lvl / 2));
      for (const die of Object.keys(c.hitDiceUsed).sort((x, y) => y - x)) { const g = Math.min(rec, c.hitDiceUsed[die]); c.hitDiceUsed[die] -= g; rec -= g; }
      persist(); renderMain(); toast('<strong>Riposo lungo</strong><div>PF, slot, risorse e metà dei dadi vita recuperati.</div>');
    },
    'add-cantrip': () => { const v = $('#new-cantrip').value.trim(); if (v) { c.cantrips.push(v); persist(); renderMain(); } },
    'del-cantrip': () => { c.cantrips.splice(+t.dataset.i, 1); persist(); renderMain(); },
    'add-spell': () => { const v = $('#new-spell').value.trim(); if (v) { c.spells.push({ id: uid(), name: v, level: +$('#new-spell-lv').value, prepared: true }); persist(); renderMain(); } },
    'del-spell': () => { c.spells = c.spells.filter(s => s.id !== t.dataset.id); persist(); renderMain(); },
    'roll-expr': () => { const v = $('#dice-expr').value.trim(); if (v) doRoll(v, v, v.startsWith('1d20') || v.startsWith('d20') ? state.rollMode : 'normal'); },
    'save-note': () => {
      const title = $('#note-title').value.trim(), body = $('#note-body').value.trim(), tag = $('#note-tag').value;
      if (!title && !body) return;
      const ex = c.notes.find(n => n.id === state.editingNote);
      if (ex) Object.assign(ex, { title, body, tag }); else c.notes.push({ id: uid(), title, body, tag, date: Date.now() });
      state.editingNote = null; persist(); renderMain();
    },
    'edit-note': () => { state.editingNote = t.dataset.id; renderMain(); },
    'cancel-note': () => { state.editingNote = null; renderMain(); },
    'del-note': () => { if (confirm('Eliminare la nota?')) { c.notes = c.notes.filter(n => n.id !== t.dataset.id); persist(); renderMain(); } },
    'add-moment': () => {
      const desc = $('#moment-desc').value.trim(); if (!desc) return toast('<strong>Descrivi il momento</strong>');
      c.alignmentMoments.push({ id: uid(), desc, law: +$('#moment-law').value, good: +$('#moment-good').value, date: Date.now(), level: totalLevel(c) });
      persist(); renderMain();
    },
    'del-moment': () => { c.alignmentMoments = c.alignmentMoments.filter(m => m.id !== t.dataset.id); persist(); renderMain(); },
    'adopt-align': () => { c.alignment = t.dataset.id; persist(); render(); },
    'reset-skin': () => { c.appearance.skin = ''; persist(); renderMain(); },
    'toggle-rotate': () => { state.autoRotate = !(state.autoRotate ?? true); viewer?.setAutoRotate(state.autoRotate); },
    screenshot: () => { if (!viewer) return; const a2 = document.createElement('a'); a2.href = viewer.screenshot(); a2.download = `${c.name}-ritratto.png`; a2.click(); },
  };
  actions[a]?.();
});

function hpChange(c, kind) {
  const n = +$('#hp-amount').value || 0; if (!n) return;
  const d = derive(c); let hp = c.hp.current ?? d.hpMax;
  if (kind === 'damage') { let dmg = n; if (c.hp.temp) { const ab = Math.min(c.hp.temp, dmg); c.hp.temp -= ab; dmg -= ab; } hp = Math.max(0, hp - dmg); }
  if (kind === 'heal') { hp = Math.min(d.hpMax, hp + n); if (hp > 0) c.deathSaves = { ok: 0, ko: 0 }; }
  if (kind === 'temp') c.hp.temp = Math.max(c.hp.temp || 0, n);
  c.hp.current = hp; persist(); renderMain();
  if (hp === 0) toast('<strong>A terra!</strong><div>Effettua i tiri contro la morte.</div>', 'fumble');
}

// Binding dei campi: change → salva e ridisegna; textarea/nome → salva senza ridisegnare
document.addEventListener('change', (e) => {
  const t = e.target; const c = cur();
  if (t.closest('#modal-root')) return;
  if (t.id === 'import-file') return importFile(t);
  if (c && t.dataset.spellprep) { const s = c.spells.find(x => x.id === t.dataset.spellprep); s.prepared = t.checked; persist(); return renderMain(); }
  if (!c || !t.dataset.bind) return;
  let v = t.type === 'checkbox' ? t.checked : t.value;
  if (t.hasAttribute('data-num')) v = Number(v) || 0;
  setPath(c, t.dataset.bind, v);
  if (t.dataset.bind === 'armorId' || t.dataset.bind === 'shield') { /* l'arma/armatura si riflette anche nel 3D */ }
  persist();
  if (t.tagName === 'TEXTAREA' || t.dataset.bind === 'name') return renderList();
  if (t.dataset.bind.startsWith('appearance.') && viewer) { viewer.update(c, derive(c)); return; }
  render();
});
document.addEventListener('input', (e) => {
  const t = e.target; const c = cur();
  if (t.id === 'note-filter') { state.noteFilter = t.value; const pos = t.selectionStart; renderMain(); const n = document.getElementById('note-filter'); n.focus(); n.setSelectionRange(pos, pos); return; }
  if (!c || !t.dataset.bind) return;
  if (t.tagName === 'TEXTAREA' || t.dataset.bind === 'name') { setPath(c, t.dataset.bind, t.value); persist(); }
  if (t.type === 'color' && viewer) { setPath(c, t.dataset.bind, t.value); viewer.update(c, derive(c)); }
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const map = { 'dice-expr': 'roll-expr', 'new-cantrip': 'add-cantrip', 'new-spell': 'add-spell', 'hp-amount': 'damage' };
  const act = map[e.target.id]; if (act) document.querySelector(`[data-action="${act}"]`)?.click();
});

function importFile(input) {
  const f = input.files[0]; if (!f) return;
  f.text().then(txt => {
    const data = JSON.parse(txt);
    const list = Array.isArray(data) ? data : [data];
    for (const ch of list) {
      if (!ch.classes || !ch.raceId) throw new Error('File non valido');
      ch.id = uid(); ch.appearance = { ...defaultAppearance(), ...(ch.appearance || {}) };
      state.chars.push(ch); state.currentId = ch.id;
    }
    persist(); render(); toast(`<strong>Importati ${list.length} personaggi</strong>`);
  }).catch(err => toast(`<strong>Importazione fallita</strong><div>${esc(err.message)}</div>`, 'fumble'));
  input.value = '';
}

// Migrazione minima per schede salvate con versioni precedenti
for (const c of state.chars) {
  c.used ??= {}; c.slotsUsed ??= {}; c.hitDiceUsed ??= {}; c.notes ??= []; c.alignmentMoments ??= []; c.weapons ??= []; c.cantrips ??= []; c.spells ??= [];
  c.deathSaves ??= { ok: 0, ko: 0 }; c.appearance = { ...defaultAppearance(), ...(c.appearance || {}) }; c.asiLog ??= [];
}

render();
export { casterEntries };
