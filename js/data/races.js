// Razze D&D 5e (regole base). I bonus caratteristica sono applicati automaticamente.
// "cantrips": trucchetti concessi dalla razza; "spells": incantesimi innati per livello.
export const RACES = [
  {
    id: 'umano', name: 'Umano', size: 'Media', speed: 9, height: 1.75, build: 1.0,
    bonus: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
    traits: ['Versatilità: +1 a tutte le caratteristiche', 'Un linguaggio extra a scelta'],
    languages: ['Comune', '+1 a scelta'],
    subraces: [
      { id: 'umano-base', name: 'Umano (standard)', bonus: {} },
      { id: 'umano-variante', name: 'Umano (variante)', bonus: {}, replaceBonus: true, choose: { count: 2, amount: 1 }, bonusFeat: true, extraSkill: 1,
        traits: ['+1 a due caratteristiche a scelta', 'Un talento al 1° livello', 'Una competenza in abilità extra'] },
    ],
  },
  {
    id: 'elfo', name: 'Elfo', size: 'Media', speed: 9, height: 1.8, build: 0.85,
    bonus: { dex: 2 },
    traits: ['Scurovisione 18 m', 'Sensi acuti (competenza in Percezione)', 'Retaggio fatato (vantaggio contro charme, immune al sonno magico)', 'Trance (riposo di 4 ore)'],
    skills: ['percezione'],
    languages: ['Comune', 'Elfico'],
    features: { pointyEars: true },
    subraces: [
      { id: 'alto-elfo', name: 'Alto Elfo', bonus: { int: 1 }, cantrips: [{ name: 'Trucchetto da mago (a scelta)', ability: 'int', choose: true }],
        traits: ['Addestramento nelle armi elfiche', 'Un trucchetto da mago (INT)', 'Un linguaggio extra'] },
      { id: 'elfo-boschi', name: 'Elfo dei Boschi', bonus: { wis: 1 }, speed: 10.5,
        traits: ['Piede lesto (velocità 10,5 m)', 'Maschera della natura (nascondersi in fenomeni naturali)', 'Addestramento nelle armi elfiche'] },
      { id: 'drow', name: 'Elfo Oscuro (Drow)', bonus: { cha: 1 }, cantrips: [{ name: 'Luci danzanti', ability: 'cha' }],
        spells: [{ level: 3, name: 'Luminescenza', per: 'riposo lungo' }, { level: 5, name: 'Oscurità', per: 'riposo lungo' }],
        traits: ['Scurovisione superiore 36 m', 'Sensibilità alla luce solare', 'Magia drow (CAR)'], skin: '#6b6f82' },
    ],
  },
  {
    id: 'nano', name: 'Nano', size: 'Media', speed: 7.5, height: 1.35, build: 1.35,
    bonus: { con: 2 },
    traits: ['Scurovisione 18 m', 'Resilienza nanica (vantaggio TS veleno, resistenza al veleno)', 'Esperto della pietra', 'Velocità non ridotta dall\'armatura pesante'],
    languages: ['Comune', 'Nanico'],
    features: { beard: true },
    subraces: [
      { id: 'nano-colline', name: 'Nano delle Colline', bonus: { wis: 1 }, hpPerLevel: 1, traits: ['Robustezza nanica: +1 PF per livello'] },
      { id: 'nano-montagne', name: 'Nano delle Montagne', bonus: { str: 2 }, armorProf: ['leggera', 'media'], traits: ['Competenza nelle armature leggere e medie'] },
    ],
  },
  {
    id: 'halfling', name: 'Halfling', size: 'Piccola', speed: 7.5, height: 0.95, build: 0.95,
    bonus: { dex: 2 },
    traits: ['Fortunato (ritira gli 1 naturali su d20)', 'Coraggioso (vantaggio contro paura)', 'Agilità halfling'],
    languages: ['Comune', 'Halfling'],
    subraces: [
      { id: 'piedelesto', name: 'Piedelesto', bonus: { cha: 1 }, traits: ['Furtività innata'] },
      { id: 'tozzo', name: 'Tozzo', bonus: { con: 1 }, traits: ['Resilienza dei tozzi (vantaggio TS veleno, resistenza al veleno)'] },
    ],
  },
  {
    id: 'dragonide', name: 'Dragonide', size: 'Media', speed: 9, height: 1.95, build: 1.3,
    bonus: { str: 2, cha: 1 },
    traits: ['Discendenza draconica', 'Arma a soffio (TS COS, CD 8 + COS + comp.)', 'Resistenza al danno della discendenza'],
    languages: ['Comune', 'Draconico'],
    features: { dragonHead: true },
    resources: [{ id: 'soffio', name: 'Arma a soffio', max: () => 1, recharge: 'breve' }],
    subraces: [
      { id: 'drago-rosso', name: 'Discendenza: Rosso (fuoco)', bonus: {}, skin: '#7a2a1e' },
      { id: 'drago-blu', name: 'Discendenza: Blu (fulmine)', bonus: {}, skin: '#2b4a7a' },
      { id: 'drago-verde', name: 'Discendenza: Verde (veleno)', bonus: {}, skin: '#2f5a33' },
      { id: 'drago-nero', name: 'Discendenza: Nero (acido)', bonus: {}, skin: '#222428' },
      { id: 'drago-bianco', name: 'Discendenza: Bianco (freddo)', bonus: {}, skin: '#b9c2c8' },
      { id: 'drago-oro', name: 'Discendenza: Oro (fuoco)', bonus: {}, skin: '#a8842e' },
      { id: 'drago-argento', name: 'Discendenza: Argento (freddo)', bonus: {}, skin: '#8f969c' },
      { id: 'drago-bronzo', name: 'Discendenza: Bronzo (fulmine)', bonus: {}, skin: '#7a5a2e' },
    ],
  },
  {
    id: 'gnomo', name: 'Gnomo', size: 'Piccola', speed: 7.5, height: 1.0, build: 0.9,
    bonus: { int: 2 },
    traits: ['Scurovisione 18 m', 'Astuzia gnomesca (vantaggio TS INT, SAG, CAR contro la magia)'],
    languages: ['Comune', 'Gnomesco'],
    features: { bigNose: true, pointyEars: true },
    subraces: [
      { id: 'gnomo-foreste', name: 'Gnomo delle Foreste', bonus: { dex: 1 }, cantrips: [{ name: 'Illusione minore', ability: 'int' }], traits: ['Illusionista nato', 'Parlare con le piccole bestie'] },
      { id: 'gnomo-rocce', name: 'Gnomo delle Rocce', bonus: { con: 1 }, traits: ['Conoscenze da artefice', 'Inventore (congegni meccanici)'] },
    ],
  },
  {
    id: 'mezzelfo', name: 'Mezzelfo', size: 'Media', speed: 9, height: 1.75, build: 0.95,
    bonus: { cha: 2 },
    traits: ['Scurovisione 18 m', 'Retaggio fatato', 'Versatilità nelle abilità (2 abilità a scelta)', '+1 a due caratteristiche a scelta (non CAR)'],
    languages: ['Comune', 'Elfico', '+1 a scelta'],
    features: { pointyEars: true, smallEars: true },
    extraSkill: 2,
    subraces: [{ id: 'mezzelfo-base', name: 'Mezzelfo', bonus: {}, choose: { count: 2, amount: 1, exclude: ['cha'] } }],
  },
  {
    id: 'mezzorco', name: 'Mezzorco', size: 'Media', speed: 9, height: 1.9, build: 1.35,
    bonus: { str: 2, con: 1 },
    traits: ['Scurovisione 18 m', 'Minaccioso (competenza in Intimidire)', 'Tenacia implacabile (1/riposo lungo resti a 1 PF)', 'Attacchi selvaggi (dado extra sui critici in mischia)'],
    skills: ['intimidire'],
    languages: ['Comune', 'Orchesco'],
    features: { tusks: true, pointyEars: true, smallEars: true },
    skin: '#6f7a5a',
    resources: [{ id: 'tenacia', name: 'Tenacia implacabile', max: () => 1, recharge: 'lungo' }],
    subraces: [{ id: 'mezzorco-base', name: 'Mezzorco', bonus: {} }],
  },
  {
    id: 'tiefling', name: 'Tiefling', size: 'Media', speed: 9, height: 1.78, build: 1.0,
    bonus: { cha: 2, int: 1 },
    traits: ['Scurovisione 18 m', 'Resistenza infernale (fuoco)', 'Retaggio infernale (CAR)'],
    languages: ['Comune', 'Infernale'],
    features: { horns: true, tail: true },
    skin: '#8a3b37',
    cantrips: [{ name: 'Taumaturgia', ability: 'cha' }],
    spells: [{ level: 3, name: 'Intimorire infernale (2° liv.)', per: 'riposo lungo' }, { level: 5, name: 'Oscurità', per: 'riposo lungo' }],
    subraces: [{ id: 'tiefling-base', name: 'Tiefling', bonus: {} }],
  },
  {
    id: 'personalizzata', name: 'Altra / non specificata', size: 'Media', speed: 9, height: 1.75, build: 1.0,
    bonus: {},
    traits: ['Razza non specificata: i bonus razziali sono già inclusi nei punteggi base'],
    languages: ['Comune'],
    subraces: [{ id: 'personalizzata-base', name: 'Altra razza', bonus: {} }],
  },
];

export const RACE_BY_ID = Object.fromEntries(RACES.map(r => [r.id, r]));

export function getSubrace(race, subId) {
  return race?.subraces?.find(s => s.id === subId) || race?.subraces?.[0];
}

export const BACKGROUNDS = [
  { id: 'accolito', name: 'Accolito', skills: ['intuizione', 'religione'] },
  { id: 'artigiano', name: 'Artigiano di gilda', skills: ['intuizione', 'persuasione'] },
  { id: 'ciarlatano', name: 'Ciarlatano', skills: ['inganno', 'rapidita'] },
  { id: 'criminale', name: 'Criminale', skills: ['inganno', 'furtivita'] },
  { id: 'eremita', name: 'Eremita', skills: ['medicina', 'religione'] },
  { id: 'eroe', name: 'Eroe popolare', skills: ['addestrare', 'sopravvivenza'] },
  { id: 'forestiero', name: 'Forestiero', skills: ['atletica', 'sopravvivenza'] },
  { id: 'intrattenitore', name: 'Intrattenitore', skills: ['acrobazia', 'intrattenere'] },
  { id: 'marinaio', name: 'Marinaio', skills: ['atletica', 'percezione'] },
  { id: 'monello', name: 'Monello', skills: ['rapidita', 'furtivita'] },
  { id: 'nobile', name: 'Nobile', skills: ['storia', 'persuasione'] },
  { id: 'sapiente', name: 'Sapiente', skills: ['arcano', 'storia'] },
  { id: 'soldato', name: 'Soldato', skills: ['atletica', 'intimidire'] },
];

export const ALIGNMENTS = [
  { id: 'LB', name: 'Legale Buono', law: 1, good: 1 },
  { id: 'NB', name: 'Neutrale Buono', law: 0, good: 1 },
  { id: 'CB', name: 'Caotico Buono', law: -1, good: 1 },
  { id: 'LN', name: 'Legale Neutrale', law: 1, good: 0 },
  { id: 'N', name: 'Neutrale Puro', law: 0, good: 0 },
  { id: 'CN', name: 'Caotico Neutrale', law: -1, good: 0 },
  { id: 'LM', name: 'Legale Malvagio', law: 1, good: -1 },
  { id: 'NM', name: 'Neutrale Malvagio', law: 0, good: -1 },
  { id: 'CM', name: 'Caotico Malvagio', law: -1, good: -1 },
];
