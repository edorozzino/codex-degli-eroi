const KEY = 'dnd5e-schede-v1';

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export function loadAll() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}

export function saveAll(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { console.warn('Salvataggio non riuscito', e); }
}

export function defaultAppearance() {
  return { skin: '', hair: '#2a1d14', hairStyle: 'corti', beard: false, eyes: '#6aa0c8', scar: false, cloak: '#3a2a1f', metal: '#8a8f94', glow: true };
}

export function newCharacter({ name, raceId, subraceId, classId, background, alignment, abilities, skills, racialChoices, hitDie }) {
  return {
    id: uid(), name, player: '', raceId, subraceId, background, alignment,
    abilities, racialChoices: racialChoices || [], skills: skills || {},
    classes: [{ id: classId, level: 1, subclass: '' }],
    levelHistory: [{ charLevel: 1, classId, hp: hitDie }],
    asiLog: [],
    hp: { current: null, temp: 0 }, hitDiceUsed: {}, deathSaves: { ok: 0, ko: 0 },
    armorId: 'nessuna', shield: false, acBonus: 0, weapons: [],
    used: {}, slotsUsed: {}, pactUsed: 0,
    cantrips: [], spells: [],
    notes: [], alignmentMoments: [], languages: '', equipment: '', traitsText: '',
    xp: 0, inspiration: false,
    appearance: defaultAppearance(),
    created: Date.now(), updated: Date.now(),
  };
}

export function exportJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
