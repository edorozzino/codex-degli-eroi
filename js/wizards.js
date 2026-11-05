// Creazione del personaggio e avanzamento di livello
import { RACES, RACE_BY_ID, getSubrace, BACKGROUNDS, ALIGNMENTS } from './data/races.js';
import { CLASSES, CLASS_BY_ID } from './data/classes.js';
import { FEATS, FEAT_BY_ID } from './data/feats.js';
import { ABILITIES, ABILITY_BY_ID, SKILLS, SKILL_BY_ID } from './data/glossary.js';
import { AB, mod, fmt, derive, multiclassOptions, featAvailability, asiSuggestions, featSuggestions, avgHitDie, totalLevel, profBonus } from './rules.js';
import { newCharacter } from './storage.js';
import { esc, openModal, closeModal, toast } from './ui.js';
import { roll } from './dice.js';
import { fillLevelFeatures } from './srd.js';

const STANDARD = [15, 14, 13, 12, 10, 8];
const PB_COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
const abShort = (a) => ABILITY_BY_ID[a].short;

// ================= CREAZIONE =================
export function openCreateWizard(onCreate) {
  const w = {
    name: '', raceId: 'umano', subraceId: 'umano-base', classId: 'guerriero', background: 'soldato', alignment: 'N',
    method: 'standard', assign: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 }, rolled: null,
    racialChoices: [], skills: [], featId: '', featChoice: '',
  };
  const modal = openModal('<header><h2>Nuovo personaggio</h2><button class="icon-btn" data-close>✕</button></header><div class="body"></div><footer><button class="btn ghost" data-close>Annulla</button><button class="btn gold" data-create>Crea personaggio</button></footer>');
  const body = modal.querySelector('.body');

  const recommend = () => {
    const cl = CLASS_BY_ID[w.classId];
    const order = [...cl.primary, ...AB.filter(a => !cl.primary.includes(a))];
    const pool = w.method === 'roll' && w.rolled ? [...w.rolled].sort((a, b) => b - a) : STANDARD;
    order.forEach((a, i) => { w.assign[a] = pool[i]; });
  };

  function render() {
    const race = RACE_BY_ID[w.raceId]; const sub = getSubrace(race, w.subraceId); const cl = CLASS_BY_ID[w.classId];
    const bg = BACKGROUNDS.find(b => b.id === w.background);
    const choose = sub?.choose;
    const extra = (race.extraSkill || 0) + (sub?.extraSkill || 0);
    const skillMax = cl.skillChoices.count + extra;
    const fromList = cl.skillChoices.from === 'any' || extra > 0 ? SKILLS.map(s => s.id) : cl.skillChoices.from;
    const locked = new Set([...(bg?.skills || []), ...(race.skills || [])]);
    w.skills = w.skills.filter(s => !locked.has(s));
    const pbSpent = w.method === 'point' ? AB.reduce((s, a) => s + (PB_COST[w.assign[a]] ?? 99), 0) : 0;
    const pool = w.method === 'roll' ? (w.rolled || []) : STANDARD;
    const used = AB.map(a => w.assign[a]);
    const dup = (w.method === 'standard' || w.method === 'roll') && pool.length && pool.slice().sort().join() !== used.slice().sort().join();
    const racial = (a) => (sub?.replaceBonus ? 0 : race.bonus[a] || 0) + (sub?.bonus?.[a] || 0) + (w.racialChoices.includes(a) ? (choose?.amount || 1) : 0);
    const raceCantrips = [...(race.cantrips || []), ...(sub?.cantrips || [])];

    body.innerHTML = `
      <div class="step"><h3 data-n="1">Identità</h3>
        <div class="grid g3">
          <label class="field"><span>Nome</span><input data-w="name" value="${esc(w.name)}" placeholder="Es. Aldric il Grigio"></label>
          <label class="field"><span>Background</span><select data-w="background">${BACKGROUNDS.map(b => `<option value="${b.id}" ${b.id === w.background ? 'selected' : ''}>${b.name}</option>`).join('')}</select></label>
          <label class="field"><span>Allineamento</span><select data-w="alignment">${ALIGNMENTS.map(a => `<option value="${a.id}" ${a.id === w.alignment ? 'selected' : ''}>${a.name}</option>`).join('')}</select></label>
        </div>
      </div>
      <div class="step"><h3 data-n="2">Razza</h3>
        <div class="choice-grid">${RACES.map(r => `<button class="choice ${r.id === w.raceId ? 'sel' : ''}" data-race="${r.id}"><strong>${r.name}</strong><small>${Object.entries(r.bonus).map(([a, v]) => `${abShort(a)} +${v}`).join(', ')}</small><small>${r.size}, ${r.speed} m</small></button>`).join('')}</div>
        ${race.subraces.length > 1 ? `<div class="row" style="margin-top:10px"><label class="field"><span>Sottorazza</span><select data-w="subraceId">${race.subraces.map(s => `<option value="${s.id}" ${s.id === sub.id ? 'selected' : ''}>${s.name}</option>`).join('')}</select></label></div>` : ''}
        <p class="muted" style="margin:8px 0 0">${[...race.traits, ...(sub?.traits || [])].map(esc).join(' · ')}</p>
        ${choose ? `<div class="callout" style="margin-top:8px">Scegli ${choose.count} caratteristiche per +${choose.amount}: ${AB.filter(a => !(choose.exclude || []).includes(a)).map(a => `<label style="margin-right:10px"><input type="checkbox" data-rc="${a}" ${w.racialChoices.includes(a) ? 'checked' : ''}> ${abShort(a)}</label>`).join('')}</div>` : ''}
        ${raceCantrips.length ? `<div class="callout blue" style="margin-top:8px">✦ Trucchetti razziali: ${raceCantrips.map(c => esc(c.name)).join(', ')} — la scheda gestirà la sezione incantesimi anche se la classe non è un incantatore.</div>` : ''}
      </div>
      <div class="step"><h3 data-n="3">Classe</h3>
        <div class="choice-grid">${CLASSES.map(c => `<button class="choice ${c.id === w.classId ? 'sel' : ''}" data-class="${c.id}"><strong>${c.name}</strong><small>d${c.hitDie} · ${c.primary.slice(0, 2).map(abShort).join('/')}</small><small>${c.spellcasting ? '✦ incantatore ' + ({ full: 'completo', half: 'parziale', pact: 'del patto' })[c.spellcasting.type] : resLabel(c)}</small></button>`).join('')}</div>
      </div>
      <div class="step"><h3 data-n="4">Caratteristiche</h3>
        <div class="row" style="margin-bottom:8px">
          ${[['standard', 'Serie standard'], ['point', 'Acquisto a punti (27)'], ['roll', 'Tira 4d6'], ['manual', 'Manuale']].map(([id, l]) => `<button class="btn small ${w.method === id ? 'gold' : 'ghost'}" data-method="${id}">${l}</button>`).join('')}
          ${w.method === 'roll' ? '<button class="btn small" data-reroll>🎲 Tira</button>' : ''}
          ${w.method !== 'manual' && w.method !== 'point' ? '<button class="btn small ghost" data-recommend>★ Assegna consigliato</button>' : ''}
        </div>
        <p class="muted" style="margin:0 0 8px">Consigliato per ${cl.name}: ${cl.primary.map(a => ABILITY_BY_ID[a].name).join(' > ')}.</p>
        <div class="ab-assign">${AB.map(a => `<label class="field"><span>${abShort(a)}</span>${abilityInput(w, a, pool)}<small>${racial(a) ? `+${racial(a)} razza` : '&nbsp;'}</small><strong>${w.assign[a] + racial(a)} (${fmt(mod(w.assign[a] + racial(a)))})</strong></label>`).join('')}</div>
        ${w.method === 'point' ? `<p class="${pbSpent > 27 ? 'warn' : 'muted'}">Punti spesi: ${pbSpent}/27</p>` : ''}
        ${dup ? '<p class="warn">Ogni valore della serie va usato una sola volta.</p>' : ''}
      </div>
      <div class="step"><h3 data-n="5">Abilità (${w.skills.length}/${skillMax})</h3>
        <p class="muted" style="margin:0 0 6px">Dal background (${esc(bg?.name)}) e dalla razza: ${[...locked].map(s => SKILL_BY_ID[s].name).join(', ') || '—'}</p>
        <div class="choice-grid">${fromList.map(id => { const s = SKILL_BY_ID[id]; const lk = locked.has(id); return `<button class="choice ${lk || w.skills.includes(id) ? 'sel' : ''}" data-skill="${id}" ${lk ? 'disabled' : ''}><strong>${s.name}</strong><small>${abShort(s.ability)}${lk ? ' · già competente' : ''}</small></button>`; }).join('')}</div>
      </div>
      ${sub?.bonusFeat ? `<div class="step"><h3 data-n="6">Talento iniziale</h3>${featPicker(w, null)}</div>` : ''}
    `;
  }

  function abilityInput(w, a, pool) {
    if (w.method === 'manual') return `<input type="number" min="3" max="20" data-ab="${a}" value="${w.assign[a]}">`;
    if (w.method === 'point') return `<div class="counter"><button data-pb="${a}:-1">−</button><b>${w.assign[a]}</b><button data-pb="${a}:1">+</button></div>`;
    if (!pool.length) return '<small>tira i dadi</small>';
    return `<select data-ab="${a}">${pool.map((v, i) => `<option value="${v}" ${w.assign[a] === v ? 'selected' : ''}>${v}</option>`).join('')}</select>`;
  }

  modal.addEventListener('input', (e) => { if (e.target.dataset.w === 'name') w.name = e.target.value; });
  modal.addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset.w === 'name') return;
    if (t.dataset.w) { w[t.dataset.w] = t.value; if (t.dataset.w === 'subraceId') w.racialChoices = []; }
    if (t.dataset.ab) w.assign[t.dataset.ab] = Math.max(3, Math.min(20, +t.value || 10));
    if (t.dataset.rc) {
      const sub = getSubrace(RACE_BY_ID[w.raceId], w.subraceId);
      if (t.checked && w.racialChoices.length < sub.choose.count) w.racialChoices.push(t.dataset.rc);
      else w.racialChoices = w.racialChoices.filter(x => x !== t.dataset.rc);
    }
    if (t.dataset.feat !== undefined) { w.featId = t.value; w.featChoice = FEAT_BY_ID[t.value]?.asi?.choose?.[0] || ''; }
    if (t.dataset.featchoice !== undefined) w.featChoice = t.value;
    render();
  });
  modal.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-close')) return closeModal();
    if (b.dataset.race) { w.raceId = b.dataset.race; w.subraceId = RACE_BY_ID[w.raceId].subraces[0].id; w.racialChoices = []; }
    if (b.dataset.class) { w.classId = b.dataset.class; w.skills = []; if (w.method === 'standard') recommend(); }
    if (b.dataset.method) {
      w.method = b.dataset.method;
      if (w.method === 'point') AB.forEach(a => { w.assign[a] = 8; });
      if (w.method === 'standard') recommend();
      if (w.method === 'roll' && !w.rolled) rollStats();
    }
    if (b.hasAttribute('data-reroll')) rollStats();
    if (b.hasAttribute('data-recommend')) recommend();
    if (b.dataset.pb) {
      const [a, dv] = b.dataset.pb.split(':'); const nv = w.assign[a] + +dv;
      if (nv >= 8 && nv <= 15) w.assign[a] = nv;
    }
    if (b.dataset.skill) {
      const cl = CLASS_BY_ID[w.classId]; const race = RACE_BY_ID[w.raceId]; const sub = getSubrace(race, w.subraceId);
      const max = cl.skillChoices.count + (race.extraSkill || 0) + (sub?.extraSkill || 0);
      if (w.skills.includes(b.dataset.skill)) w.skills = w.skills.filter(s => s !== b.dataset.skill);
      else if (w.skills.length < max) w.skills.push(b.dataset.skill);
    }
    if (b.hasAttribute('data-create')) return create();
    render();
  });

  function rollStats() {
    w.rolled = Array.from({ length: 6 }, () => roll('4d6kh3').total);
    recommend();
  }

  function create() {
    const race = RACE_BY_ID[w.raceId]; const sub = getSubrace(race, w.subraceId); const cl = CLASS_BY_ID[w.classId];
    if (sub?.choose && w.racialChoices.length !== sub.choose.count) return toast(`<strong>Scegli ${sub.choose.count} caratteristiche razziali</strong>`);
    if (w.method === 'point' && AB.reduce((s, a) => s + PB_COST[w.assign[a]], 0) > 27) return toast('<strong>Hai superato i 27 punti</strong>');
    const bg = BACKGROUNDS.find(b => b.id === w.background);
    const skills = {};
    [...(bg?.skills || []), ...w.skills].forEach(s => { skills[s] = 'prof'; });
    const c = newCharacter({
      name: w.name.trim() || 'Eroe senza nome', raceId: w.raceId, subraceId: sub.id, classId: w.classId, background: w.background,
      alignment: w.alignment, abilities: { ...w.assign }, skills, racialChoices: w.racialChoices, hitDie: cl.hitDie,
    });
    if (sub?.bonusFeat && w.featId) {
      const f = FEAT_BY_ID[w.featId];
      c.asiLog.push({ level: 1, cls: w.classId, featId: f.id, choice: w.featChoice, changes: f.asi && w.featChoice ? { [w.featChoice]: 1 } : {} });
    }
    // Equipaggiamento iniziale indicativo per l'anteprima 3D
    const starter = { barbaro: ['ascia-bipenne', 'giavellotto'], bardo: ['stocco', 'pugnale'], chierico: ['mazza', 'balestra-leggera'], druido: ['bastone', 'scimitarra'],
      guerriero: ['spada-lunga', 'balestra-leggera'], ladro: ['spada-corta', 'arco-corto', 'pugnale'], mago: ['bastone', 'pugnale'], monaco: ['bastone', 'colpo-senz-armi'],
      paladino: ['spada-lunga', 'giavellotto'], ranger: ['arco-lungo', 'spada-corta'], stregone: ['pugnale', 'balestra-leggera'], warlock: ['pugnale', 'balestra-leggera'] }[cl.id] || [];
    c.weapons = starter.map(id => ({ weaponId: id }));
    const armor = { barbaro: 'nessuna', bardo: 'cuoio', chierico: 'scaglie', druido: 'cuoio', guerriero: 'maglia', ladro: 'cuoio', mago: 'nessuna', monaco: 'nessuna', paladino: 'maglia', ranger: 'scaglie', stregone: 'nessuna', warlock: 'cuoio' }[cl.id];
    c.armorId = armor; c.shield = ['chierico', 'guerriero', 'paladino'].includes(cl.id);
    if (race.id === 'nano' || race.id === 'mezzorco') c.appearance.beard = race.id === 'nano';
    if (cl.id === 'monaco' || cl.id === 'barbaro') c.appearance.hairStyle = cl.id === 'monaco' ? 'calvo' : 'lunghi';
    closeModal();
    onCreate(c);
  }

  recommend();
  render();
}

function resLabel(c) {
  if (c.id === 'monaco') return 'Punti Ki';
  if (c.id === 'barbaro') return 'Ira';
  if (c.id === 'guerriero') return 'Azione impetuosa';
  if (c.id === 'ladro') return 'Attacco furtivo';
  return '';
}

function featPicker(w, ctx) {
  // ctx = { c, d, suggested } per il level-up; null per la creazione (nessun requisito d'armatura verificabile)
  const opts = FEATS.map(f => {
    const av = ctx ? featAvailability(f, ctx.c, ctx.d) : { ok: !f.prereq || !f.prereq.armor && !f.prereq.spellcaster };
    const sug = ctx && av.ok && f.tags.some(t => ctx.suggested.has(t));
    return { f, av, sug };
  }).sort((a, b) => (b.av.ok - a.av.ok) || (b.sug - a.sug) || a.f.name.localeCompare(b.f.name));
  const sel = FEAT_BY_ID[w.featId];
  return `
    <label class="field"><span>Talento</span><select data-feat>
      <option value="">— scegli un talento —</option>
      ${opts.map(({ f, av, sug }) => `<option value="${f.id}" ${f.id === w.featId ? 'selected' : ''} ${av.ok ? '' : 'disabled'}>${sug ? '★ ' : ''}${f.name}${f.asi ? ' (+1)' : ''}${av.ok ? '' : ' — ' + av.reason}</option>`).join('')}
    </select></label>
    ${sel ? `<div class="callout" style="margin-top:8px"><strong>${esc(sel.name)}</strong> — ${esc(sel.desc)}
      ${sel.asi ? `<div class="row" style="margin-top:6px">+1 a: <select data-featchoice>${sel.asi.choose.map(a => `<option value="${a}" ${w.featChoice === a ? 'selected' : ''}>${ABILITY_BY_ID[a].name}</option>`).join('')}</select></div>` : ''}</div>` : ''}
    ${ctx ? `<details style="margin-top:8px"><summary class="muted">Tutti i talenti e requisiti (${opts.filter(o => o.av.ok).length} disponibili)</summary><div class="table-wrap"><table class="table"><tr><th>Talento</th><th>Effetto</th><th>Stato</th></tr>
      ${opts.map(({ f, av, sug }) => `<tr class="${av.ok ? '' : 'locked'}"><td><strong>${f.name}</strong>${f.asi ? `<br><small>+1 ${f.asi.choose.map(abShort).join('/')}</small>` : ''}</td><td>${esc(f.desc)}</td><td>${av.ok ? (sug ? '<span class="ok">★ consigliato</span>' : '<span class="ok">disponibile</span>') : `<span class="warn">${esc(av.reason)}</span>`}</td></tr>`).join('')}
    </table></div></details>` : ''}`;
}

// ================= AVANZAMENTO =================
export function applyLevel(c, lu) {
  const n = structuredClone(c);
  const newLevel = totalLevel(n) + 1;
  let entry = n.classes.find(x => x.id === lu.classId);
  if (!entry) { entry = { id: lu.classId, level: 0, subclass: '' }; n.classes.push(entry); }
  entry.level += 1;
  if (lu.subclass) entry.subclass = lu.subclass;
  n.levelHistory.push({ charLevel: newLevel, classId: lu.classId, hp: lu.hp });
  const cl = CLASS_BY_ID[lu.classId];
  if (cl.asi.includes(entry.level) && lu.asiMode) {
    if (lu.asiMode === 'feat' && lu.featId) {
      const f = FEAT_BY_ID[lu.featId];
      n.asiLog.push({ level: newLevel, cls: lu.classId, featId: f.id, choice: lu.featChoice, changes: f.asi && lu.featChoice ? { [lu.featChoice]: 1 } : {} });
    } else if (lu.asiMode === 'asi2' && lu.asiA) n.asiLog.push({ level: newLevel, cls: lu.classId, changes: { [lu.asiA]: 2 } });
    else if (lu.asiMode === 'asi11' && lu.asiA && lu.asiB) n.asiLog.push({ level: newLevel, cls: lu.classId, changes: { [lu.asiA]: 1, [lu.asiB]: 1 } });
  }
  // Nuova classe in multiclasse: competenze nelle abilità limitate (ladro 1, bardo 1, ranger 1) → l'utente le spunta in scheda
  return n;
}

export function undoLastLevel(c) {
  if (c.levelHistory.length <= 1) return c;
  const last = c.levelHistory.pop();
  const entry = c.classes.find(x => x.id === last.classId);
  entry.level -= 1;
  const cl = CLASS_BY_ID[entry.id];
  if (entry.level < cl.subclassLevel) entry.subclass = '';
  if (entry.level <= 0) c.classes = c.classes.filter(x => x !== entry);
  c.asiLog = c.asiLog.filter(e => e.level !== last.charLevel);
  return c;
}

export function openLevelUp(c, onApply) {
  const before = derive(c);
  if (before.lvl >= 20) return toast('<strong>Livello 20 raggiunto</strong><div>Il tuo eroe è leggenda.</div>');
  const lu = { srdOpen: true, classId: c.classes[0].id, hpMode: 'avg', hp: null, subclass: '', asiMode: 'asi2', asiA: '', asiB: '', featId: '', featChoice: '' };
  const modal = openModal(`<header><h2>Avanzamento al livello ${before.lvl + 1}</h2><button class="icon-btn" data-close>✕</button></header><div class="body"></div><footer><button class="btn ghost" data-close>Annulla</button><button class="btn gold" data-apply>Conferma livello</button></footer>`);
  const body = modal.querySelector('.body');
  const options = multiclassOptions(c);

  function render() {
    const cl = CLASS_BY_ID[lu.classId];
    const existing = c.classes.find(x => x.id === lu.classId);
    const clsLevel = (existing?.level || 0) + 1;
    const isAsi = cl.asi.includes(clsLevel);
    const needSub = clsLevel === cl.subclassLevel && !existing?.subclass;
    const avg = avgHitDie(cl.hitDie);
    if (lu.hpMode === 'avg') lu.hp = avg;
    const preview = applyLevel(c, { ...lu, hp: lu.hp ?? avg });
    const after = derive(preview);
    const gain = (lu.hp ?? avg) + (after.hpMax - before.hpMax - (lu.hp ?? avg)); // include COS e bonus
    const newFeatures = cl.features[clsLevel] || [];
    const resDiff = diffResources(before.resources, after.resources);
    const spDiff = diffSpells(before.spell, after.spell);
    const sugg = asiSuggestions(c, before, lu.classId);
    const featSug = featSuggestions(c, before, lu.classId);
    const nextAsi = cl.asi.find(l => l > clsLevel);

    body.innerHTML = `
      <div class="step"><h3 data-n="1">Scegli la classe</h3>
        <p class="muted" style="margin:0 0 8px">Puoi salire in una classe esistente o prenderne una nuova (multiclasse: servono 13 nelle caratteristiche primarie).</p>
        <div class="choice-grid">${options.map(o => `<button class="choice ${o.cls.id === lu.classId ? 'sel' : ''}" data-cls="${o.cls.id}" ${o.ok ? '' : 'disabled'}>
          <strong>${o.cls.name} ${o.existing ? o.existing.level + ' → ' + (o.existing.level + 1) : '(nuova)'}</strong><small>d${o.cls.hitDie}</small><small class="${o.ok ? '' : 'warn'}">${o.ok ? (o.existing ? 'Classe attuale' : 'Multiclasse') : esc(o.reason)}</small></button>`).join('')}</div>
      </div>

      <div class="step"><h3 data-n="2">Punti ferita</h3>
        <div class="row">
          <button class="btn small ${lu.hpMode === 'avg' ? 'gold' : 'ghost'}" data-hp="avg">Media (${avg})</button>
          <button class="btn small ${lu.hpMode === 'roll' ? 'gold' : 'ghost'}" data-hp="roll">🎲 Tira 1d${cl.hitDie}</button>
          <button class="btn small ${lu.hpMode === 'manual' ? 'gold' : 'ghost'}" data-hp="manual">Manuale</button>
          ${lu.hpMode === 'manual' ? `<input type="number" min="1" max="${cl.hitDie}" data-hpval value="${lu.hp ?? avg}">` : ''}
          <span>Dado: <b>${lu.hp ?? avg}</b> + COS ${fmt(before.m.con)}${after.hpMax - before.hpMax - (lu.hp ?? avg) - after.m.con ? ' + bonus' : ''} = <b class="diff-up">+${gain} PF</b> (max ${before.hpMax} → ${after.hpMax})</span>
        </div>
        <p class="muted" style="margin:6px 0 0">Dadi vita: ${Object.entries(after.hitDice).map(([d, n]) => `${n}d${d}`).join(' + ')}</p>
      </div>

      <div class="step"><h3 data-n="3">Cosa ottieni</h3>
        <ul class="list">
          ${after.prof !== before.prof ? `<li class="diff-new">Bonus di competenza ${fmt(before.prof)} → ${fmt(after.prof)}</li>` : ''}
          ${newFeatures.map(f => `<li><span class="diff-new">✦</span> ${esc(f)}</li>`).join('') || '<li class="muted">Nessun nuovo privilegio di classe a questo livello.</li>'}
          ${resDiff.map(r => `<li><span class="diff-up">▲</span> ${esc(r)}</li>`).join('')}
          ${spDiff.map(r => `<li><span style="color:var(--magic)">✧</span> ${esc(r)}</li>`).join('')}
          ${after.spell.cantripTier !== before.spell.cantripTier ? `<li><span style="color:var(--magic)">✧</span> I trucchetti a danno ora tirano ${after.spell.cantripTier} dadi</li>` : ''}
        </ul>
        ${nextAsi ? `<p class="muted">Prossimo aumento di caratteristica/talento come ${cl.name}: livello di classe ${nextAsi}.</p>` : ''}
        <details class="srd-box" ${lu.srdOpen ? 'open' : ''}><summary>📜 Testi ufficiali SRD di ${esc(cl.name)} ${clsLevel} (D&amp;D 5e API)</summary><div id="lu-srd"></div></details>
      </div>

      ${needSub ? `<div class="step"><h3 data-n="4">${esc(cl.subclassLabel)}</h3>
        <div class="choice-grid">${cl.subclasses.map(s => `<button class="choice ${lu.subclass === s ? 'sel' : ''}" data-sub="${esc(s)}"><strong>${esc(s)}</strong>${cl.subSpellcasting?.[s] ? '<small style="color:var(--magic)">✦ ottiene incantesimi e trucchetti</small>' : ''}${s === 'Maestro di battaglia' ? '<small>Dadi superiorità</small>' : ''}</button>`).join('')}</div>
        <label class="field" style="margin-top:8px"><span>…oppure scrivi un'altra sottoclasse</span><input data-subtext value="${cl.subclasses.includes(lu.subclass) ? '' : esc(lu.subclass)}" placeholder="Nome sottoclasse"></label>
      </div>` : ''}

      ${isAsi ? `<div class="step"><h3 data-n="${needSub ? 5 : 4}">Aumento dei punteggi di caratteristica o talento</h3>
        <div class="row" style="margin-bottom:10px">
          <button class="btn small ${lu.asiMode === 'asi2' ? 'gold' : 'ghost'}" data-asi="asi2">+2 a una caratteristica</button>
          <button class="btn small ${lu.asiMode === 'asi11' ? 'gold' : 'ghost'}" data-asi="asi11">+1 a due caratteristiche</button>
          <button class="btn small ${lu.asiMode === 'feat' ? 'gold' : 'ghost'}" data-asi="feat">Talento</button>
        </div>
        ${lu.asiMode === 'feat' ? featPicker(lu, { c, d: before, suggested: featSug }) : `
          <p class="muted" style="margin:0 0 6px">Suggerimenti in base alle tue classi e ai punteggi dispari (un +1 su un punteggio dispari aumenta subito il modificatore). Massimo 20.</p>
          <div class="choice-grid">${sugg.map(s => {
            const picked = lu.asiA === s.a || lu.asiB === s.a;
            const max = lu.asiMode === 'asi2' ? s.score + 2 > 20 : s.capped;
            return `<button class="choice ${picked ? 'sel' : ''} ${s.priority >= 3 && !max ? 'suggested' : ''}" data-ab="${s.a}" ${max && !picked ? 'disabled' : ''}>
              <strong>${ABILITY_BY_ID[s.a].name} ${s.score} (${fmt(mod(s.score))})</strong>
              <small>→ ${Math.min(20, s.score + (lu.asiMode === 'asi2' ? 2 : 1))} (${fmt(mod(Math.min(20, s.score + (lu.asiMode === 'asi2' ? 2 : 1))))})</small>
              <small>${s.tips.join(' · ') || '&nbsp;'}</small></button>`;
          }).join('')}</div>`}
      </div>` : ''}
    `;
    const det = body.querySelector('.srd-box');
    det.addEventListener('toggle', () => { lu.srdOpen = det.open; if (det.open) fillLevelFeatures(body.querySelector('#lu-srd'), lu.classId, clsLevel, lu.subclass || existing?.subclass); });
    if (lu.srdOpen) fillLevelFeatures(body.querySelector('#lu-srd'), lu.classId, clsLevel, lu.subclass || existing?.subclass);
  }

  modal.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-close')) return closeModal();
    if (b.dataset.cls) { lu.classId = b.dataset.cls; lu.subclass = ''; lu.asiA = lu.asiB = ''; lu.featId = ''; if (lu.hpMode === 'roll') lu.hp = roll(`1d${CLASS_BY_ID[lu.classId].hitDie}`).total; }
    if (b.dataset.hp) {
      lu.hpMode = b.dataset.hp;
      const hd = CLASS_BY_ID[lu.classId].hitDie;
      if (lu.hpMode === 'roll') { lu.hp = roll(`1d${hd}`).total; toast(`<span class="total">${lu.hp}</span><strong>Dado vita d${hd}</strong>`); }
      if (lu.hpMode === 'manual') lu.hp = lu.hp ?? avgHitDie(hd);
    }
    if (b.dataset.sub) lu.subclass = b.dataset.sub;
    if (b.dataset.asi) { lu.asiMode = b.dataset.asi; lu.asiA = lu.asiB = ''; }
    if (b.dataset.ab) {
      const a = b.dataset.ab;
      if (lu.asiMode === 'asi2') lu.asiA = lu.asiA === a ? '' : a;
      else if (lu.asiA === a) { lu.asiA = lu.asiB; lu.asiB = ''; }
      else if (lu.asiB === a) lu.asiB = '';
      else if (!lu.asiA) lu.asiA = a; else lu.asiB = a;
    }
    if (b.hasAttribute('data-apply')) return apply();
    render();
  });
  modal.addEventListener('change', (e) => {
    const t = e.target;
    if (t.hasAttribute('data-hpval')) lu.hp = Math.max(1, Math.min(CLASS_BY_ID[lu.classId].hitDie, +t.value || 1));
    if (t.hasAttribute('data-subtext')) lu.subclass = t.value.trim();
    if (t.dataset.feat !== undefined) { lu.featId = t.value; lu.featChoice = FEAT_BY_ID[t.value]?.asi?.choose?.[0] || ''; }
    if (t.dataset.featchoice !== undefined) lu.featChoice = t.value;
    render();
  });

  function apply() {
    const cl = CLASS_BY_ID[lu.classId];
    const existing = c.classes.find(x => x.id === lu.classId);
    const clsLevel = (existing?.level || 0) + 1;
    if (clsLevel === cl.subclassLevel && !existing?.subclass && !lu.subclass) return toast(`<strong>Scegli: ${esc(cl.subclassLabel)}</strong>`);
    if (cl.asi.includes(clsLevel)) {
      if (lu.asiMode === 'feat' && !lu.featId) return toast('<strong>Scegli un talento</strong>');
      if (lu.asiMode === 'asi2' && !lu.asiA) return toast('<strong>Scegli la caratteristica da aumentare</strong>');
      if (lu.asiMode === 'asi11' && (!lu.asiA || !lu.asiB)) return toast('<strong>Scegli due caratteristiche</strong>');
    }
    const hp = lu.hp ?? avgHitDie(cl.hitDie);
    const n = applyLevel(c, { ...lu, hp });
    closeModal();
    onApply(n, { classId: lu.classId, clsLevel, hpGain: hp });
  }

  render();
}

function diffResources(a, b) {
  const out = [];
  const map = Object.fromEntries(a.map(r => [r.key, r]));
  for (const r of b) {
    const o = map[r.key];
    const max = r.max >= 99 ? '∞' : r.max;
    if (!o) out.push(`Nuova risorsa: ${r.name} (${max}${r.die ? ', ' + r.die : ''})`);
    else {
      if (o.max !== r.max) out.push(`${r.name}: ${o.max >= 99 ? '∞' : o.max} → ${max}`);
      if (o.die !== r.die && r.die) out.push(`${r.name}: dado ${o.die} → ${r.die}`);
      if (o.recharge !== r.recharge) out.push(`${r.name}: ora si ricarica con riposo ${r.recharge}`);
    }
  }
  return out;
}

function diffSpells(a, b) {
  const out = [];
  const ac = Object.fromEntries(a.casters.map(x => [x.name, x]));
  for (const x of b.casters) {
    const o = ac[x.name];
    if (!o) out.push(`Incantatore: ${x.name} (${ABILITY_BY_ID[x.ability].name}, CD ${x.dc})`);
    if ((o?.cantrips || 0) !== x.cantrips && x.cantrips) out.push(`Trucchetti ${x.name}: ${o?.cantrips || 0} → ${x.cantrips}`);
    if (x.known != null && (o?.known || 0) !== x.known) out.push(`Incantesimi conosciuti ${x.name}: ${o?.known || 0} → ${x.known}`);
    if (x.prepared != null && (o?.prepared || 0) !== x.prepared) out.push(`Incantesimi preparabili ${x.name}: ${o?.prepared || 0} → ${x.prepared}`);
  }
  const sl = (s) => s.map((n, i) => `${i + 1}°:${n}`).join(' ');
  if (sl(a.slots) !== sl(b.slots)) out.push(`Slot incantesimo: ${sl(b.slots) || '—'}`);
  if (JSON.stringify(a.pact) !== JSON.stringify(b.pact) && b.pact) out.push(`Magia del patto: ${b.pact.slots} slot di ${b.pact.level}° livello`);
  return out;
}

export { STANDARD, profBonus };
