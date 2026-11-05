// Classi D&D 5e. Ogni classe definisce dado vita, competenze, tabelle di incantesimi,
// risorse (punti ki, ira, punti stregoneria...) e privilegi per livello.
// Le funzioni ricevono (lvl, ctx) dove ctx = { mod: {str..cha}, prof, subclass, char }.

const tier = (lvl, table) => { let v = table[0][1]; for (const [l, x] of table) if (lvl >= l) v = x; return v; };

export const STD_ASI = [4, 8, 12, 16, 19];

export const CLASSES = [
  {
    id: 'barbaro', name: 'Barbaro', hitDie: 12, primary: ['str', 'con'], saves: ['str', 'con'],
    multiclassReq: { str: 13 }, armor: ['leggera', 'media', 'scudi'], weapons: 'Semplici e da guerra',
    skillChoices: { count: 2, from: ['addestrare', 'atletica', 'intimidire', 'natura', 'percezione', 'sopravvivenza'] },
    asi: STD_ASI, subclassLevel: 3, subclassLabel: 'Cammino primordiale',
    subclasses: ['Cammino del Berserker', 'Cammino del Combattente Totemico'],
    unarmored: { base: 10, abilities: ['dex', 'con'], shield: true },
    resources: (l) => [
      { id: 'ira', name: 'Ira', max: l >= 20 ? 99 : tier(l, [[1, 2], [3, 3], [6, 4], [12, 5], [17, 6]]), recharge: 'lungo',
        info: `Danni ira +${tier(l, [[1, 2], [9, 3], [16, 4]])}` },
    ],
    dice: (l) => [
      { label: 'Bonus danni Ira', value: `+${tier(l, [[1, 2], [9, 3], [16, 4]])}` },
      ...(l >= 9 ? [{ label: 'Critico brutale (dadi extra)', value: `+${tier(l, [[9, 1], [13, 2], [17, 3]])} dado arma` }] : []),
    ],
    features: {
      1: ['Ira', 'Difesa senza armatura (10 + DES + COS)'], 2: ['Attacco irruento', 'Percezione del pericolo'],
      3: ['Cammino primordiale'], 5: ['Attacco extra', 'Movimento veloce (+3 m)'], 7: ['Istinto ferino'],
      9: ['Critico brutale (1 dado)'], 11: ['Ira implacabile'], 13: ['Critico brutale (2 dadi)'],
      15: ['Ira persistente'], 17: ['Critico brutale (3 dadi)'], 18: ['Potenza indomabile'], 20: ['Campione primordiale (+4 FOR e COS)'],
    },
  },
  {
    id: 'bardo', name: 'Bardo', hitDie: 8, primary: ['cha', 'dex'], saves: ['dex', 'cha'],
    multiclassReq: { cha: 13 }, armor: ['leggera'], weapons: 'Semplici, balestre a mano, spade lunghe, stocchi, spade corte',
    skillChoices: { count: 3, from: 'any' },
    asi: STD_ASI, subclassLevel: 3, subclassLabel: 'Collegio bardico', subclasses: ['Collegio della Sapienza', 'Collegio del Valore'],
    spellcasting: { type: 'full', ability: 'cha', mode: 'known',
      cantrips: (l) => tier(l, [[1, 2], [4, 3], [10, 4]]),
      known: [4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 15, 16, 18, 19, 19, 20, 22, 22, 22] },
    resources: (l, c) => [
      { id: 'ispirazione', name: 'Ispirazione bardica', max: Math.max(1, c.mod.cha), recharge: l >= 5 ? 'breve' : 'lungo',
        die: `d${tier(l, [[1, 6], [5, 8], [10, 10], [15, 12]])}` },
    ],
    dice: (l) => [{ label: 'Dado Ispirazione bardica', value: `d${tier(l, [[1, 6], [5, 8], [10, 10], [15, 12]])}` },
      ...(l >= 2 ? [{ label: 'Canto di riposo', value: `d${tier(l, [[2, 6], [9, 8], [13, 10], [17, 12]])}` }] : [])],
    features: {
      1: ['Incantesimi', 'Ispirazione bardica (d6)'], 2: ['Factotum', 'Canto di riposo (d6)'], 3: ['Collegio bardico', 'Maestria (2 abilità)'],
      5: ['Ispirazione bardica (d8)', 'Fonte di ispirazione'], 6: ['Controfascino', 'Privilegio del collegio'], 9: ['Canto di riposo (d8)'],
      10: ['Ispirazione bardica (d10)', 'Maestria (2 abilità)', 'Segreti magici'], 13: ['Canto di riposo (d10)'],
      14: ['Segreti magici', 'Privilegio del collegio'], 15: ['Ispirazione bardica (d12)'], 17: ['Canto di riposo (d12)'],
      18: ['Segreti magici'], 20: ['Ispirazione superiore'],
    },
  },
  {
    id: 'chierico', name: 'Chierico', hitDie: 8, primary: ['wis', 'str', 'con'], saves: ['wis', 'cha'],
    multiclassReq: { wis: 13 }, armor: ['leggera', 'media', 'scudi'], weapons: 'Semplici',
    skillChoices: { count: 2, from: ['storia', 'intuizione', 'medicina', 'persuasione', 'religione'] },
    asi: STD_ASI, subclassLevel: 1, subclassLabel: 'Dominio divino',
    subclasses: ['Dominio della Vita', 'Dominio della Luce', 'Dominio della Guerra', 'Dominio della Tempesta', 'Dominio della Conoscenza', 'Dominio dell\'Inganno', 'Dominio della Natura'],
    spellcasting: { type: 'full', ability: 'wis', mode: 'prepared', cantrips: (l) => tier(l, [[1, 3], [4, 4], [10, 5]]), prepared: (l, c) => Math.max(1, c.mod.wis + l) },
    resources: (l) => l >= 2 ? [{ id: 'incanalare', name: 'Incanalare divinità', max: tier(l, [[2, 1], [6, 2], [18, 3]]), recharge: 'breve' }] : [],
    dice: (l) => l >= 5 ? [{ label: 'Distruggere non morti (GS)', value: tier(l, [[5, '½'], [8, '1'], [11, '2'], [14, '3'], [17, '4']]) }] : [],
    features: {
      1: ['Incantesimi', 'Dominio divino'], 2: ['Incanalare divinità (1/riposo)', 'Privilegio del dominio'], 5: ['Distruggere non morti (GS ½)'],
      6: ['Incanalare divinità (2/riposo)', 'Privilegio del dominio'], 8: ['Privilegio del dominio', 'Distruggere non morti (GS 1)'],
      10: ['Intervento divino'], 11: ['Distruggere non morti (GS 2)'], 14: ['Distruggere non morti (GS 3)'], 17: ['Privilegio del dominio', 'Distruggere non morti (GS 4)'],
      18: ['Incanalare divinità (3/riposo)'], 20: ['Intervento divino migliorato'],
    },
  },
  {
    id: 'druido', name: 'Druido', hitDie: 8, primary: ['wis', 'con'], saves: ['int', 'wis'],
    multiclassReq: { wis: 13 }, armor: ['leggera', 'media', 'scudi'], weapons: 'Bastoni, falcetti, dardi, giavellotti, mazze, pugnali, randelli, scimitarre, fionde, lance',
    skillChoices: { count: 2, from: ['arcano', 'addestrare', 'intuizione', 'medicina', 'natura', 'percezione', 'religione', 'sopravvivenza'] },
    asi: STD_ASI, subclassLevel: 2, subclassLabel: 'Circolo druidico', subclasses: ['Circolo della Terra', 'Circolo della Luna'],
    spellcasting: { type: 'full', ability: 'wis', mode: 'prepared', cantrips: (l) => tier(l, [[1, 2], [4, 3], [10, 4]]), prepared: (l, c) => Math.max(1, c.mod.wis + l) },
    resources: (l, c) => l >= 2 ? [{ id: 'forma', name: 'Forma selvatica', max: l >= 20 ? 99 : 2, recharge: 'breve',
      info: `GS max ${c.subclass === 'Circolo della Luna' ? (l >= 6 ? Math.floor(l / 3) : 1) : tier(l, [[2, '¼'], [4, '½'], [8, '1']])}; ${l >= 8 ? 'nuoto e volo' : l >= 4 ? 'nuoto, no volo' : 'no nuoto né volo'}; durata ${Math.floor(l / 2)} ore` }] : [],
    dice: (l, c) => l >= 2 ? [{ label: 'Forma selvatica: GS massimo', value: c.subclass === 'Circolo della Luna' ? (l >= 6 ? String(Math.floor(l / 3)) : '1') : tier(l, [[2, '¼'], [4, '½'], [8, '1']]) }] : [],
    features: {
      1: ['Druidico', 'Incantesimi'], 2: ['Forma selvatica', 'Circolo druidico'], 4: ['Forma selvatica migliorata (nuoto)'],
      6: ['Privilegio del circolo'], 8: ['Forma selvatica migliorata (volo)'], 10: ['Privilegio del circolo'],
      14: ['Privilegio del circolo'], 18: ['Corpo senza tempo', 'Incantesimi bestiali'], 20: ['Arcidruido'],
    },
  },
  {
    id: 'guerriero', name: 'Guerriero', hitDie: 10, primary: ['str', 'dex', 'con'], saves: ['str', 'con'],
    multiclassReq: { any: { str: 13, dex: 13 } }, armor: ['leggera', 'media', 'pesante', 'scudi'], weapons: 'Semplici e da guerra',
    skillChoices: { count: 2, from: ['acrobazia', 'addestrare', 'atletica', 'storia', 'intuizione', 'intimidire', 'percezione', 'sopravvivenza'] },
    asi: [4, 6, 8, 12, 14, 16, 19], subclassLevel: 3, subclassLabel: 'Archetipo marziale',
    subclasses: ['Campione', 'Maestro di battaglia', 'Cavaliere mistico'],
    subSpellcasting: { 'Cavaliere mistico': { type: 'third', ability: 'int', mode: 'known', cantrips: (l) => l < 3 ? 0 : tier(l, [[3, 2], [10, 3]]),
      known: [0, 0, 3, 4, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11, 11, 11, 12, 13] } },
    resources: (l, c) => {
      const r = [{ id: 'recuperare', name: 'Recuperare energie', max: 1, recharge: 'breve', die: `1d10+${l}` }];
      if (l >= 2) r.push({ id: 'impetuosa', name: 'Azione impetuosa', max: l >= 17 ? 2 : 1, recharge: 'breve' });
      if (l >= 9) r.push({ id: 'indomito', name: 'Indomito', max: tier(l, [[9, 1], [13, 2], [17, 3]]), recharge: 'lungo' });
      if (c.subclass === 'Maestro di battaglia' && l >= 3) r.push({ id: 'superiorita', name: 'Dadi superiorità', max: tier(l, [[3, 4], [7, 5], [15, 6]]), recharge: 'breve', die: `d${tier(l, [[3, 8], [10, 10], [18, 12]])}` });
      return r;
    },
    dice: (l, c) => [{ label: 'Recuperare energie', value: `1d10 + ${l}` },
      { label: 'Attacchi per azione', value: String(tier(l, [[1, 1], [5, 2], [11, 3], [20, 4]])) },
      ...(c.subclass === 'Maestro di battaglia' && l >= 3 ? [{ label: 'Dado superiorità', value: `d${tier(l, [[3, 8], [10, 10], [18, 12]])}` }] : []),
      ...(c.subclass === 'Campione' && l >= 3 ? [{ label: 'Critico migliorato', value: l >= 15 ? '18–20' : '19–20' }] : [])],
    features: {
      1: ['Stile di combattimento', 'Recuperare energie'], 2: ['Azione impetuosa (1)'], 3: ['Archetipo marziale'],
      5: ['Attacco extra'], 7: ['Privilegio dell\'archetipo'], 9: ['Indomito (1)'], 10: ['Privilegio dell\'archetipo'],
      11: ['Attacco extra (2)'], 13: ['Indomito (2)'], 15: ['Privilegio dell\'archetipo'], 17: ['Azione impetuosa (2)', 'Indomito (3)'],
      18: ['Privilegio dell\'archetipo'], 20: ['Attacco extra (3)'],
    },
  },
  {
    id: 'ladro', name: 'Ladro', hitDie: 8, primary: ['dex', 'int', 'cha'], saves: ['dex', 'int'],
    multiclassReq: { dex: 13 }, armor: ['leggera'], weapons: 'Semplici, balestre a mano, spade lunghe, stocchi, spade corte',
    skillChoices: { count: 4, from: ['acrobazia', 'atletica', 'inganno', 'intuizione', 'intimidire', 'indagare', 'percezione', 'intrattenere', 'persuasione', 'rapidita', 'furtivita'] },
    asi: [4, 8, 10, 12, 16, 19], subclassLevel: 3, subclassLabel: 'Archetipo ladresco',
    subclasses: ['Furfante', 'Assassino', 'Mistificatore arcano'],
    subSpellcasting: { 'Mistificatore arcano': { type: 'third', ability: 'int', mode: 'known', cantrips: (l) => l < 3 ? 0 : tier(l, [[3, 3], [10, 4]]),
      known: [0, 0, 3, 4, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11, 11, 11, 12, 13] } },
    resources: (l) => l >= 20 ? [{ id: 'colpo', name: 'Colpo di fortuna', max: 1, recharge: 'breve' }] : [],
    dice: (l) => [{ label: 'Attacco furtivo', value: `${Math.ceil(l / 2)}d6` }],
    features: {
      1: ['Maestria (2 abilità)', 'Attacco furtivo (1d6)', 'Gergo ladresco'], 2: ['Azione astuta'], 3: ['Archetipo ladresco'],
      5: ['Schivata prodigiosa'], 6: ['Maestria (2 abilità)'], 7: ['Elusione'], 9: ['Privilegio dell\'archetipo'],
      11: ['Talento affidabile'], 13: ['Privilegio dell\'archetipo'], 14: ['Percezione cieca'], 15: ['Mente sfuggente'],
      17: ['Privilegio dell\'archetipo'], 18: ['Inafferrabile'], 20: ['Colpo di fortuna'],
    },
  },
  {
    id: 'mago', name: 'Mago', hitDie: 6, primary: ['int', 'con', 'dex'], saves: ['int', 'wis'],
    multiclassReq: { int: 13 }, armor: [], weapons: 'Balestre leggere, bastoni, dardi, fionde, pugnali',
    skillChoices: { count: 2, from: ['arcano', 'storia', 'intuizione', 'indagare', 'medicina', 'religione'] },
    asi: STD_ASI, subclassLevel: 2, subclassLabel: 'Tradizione arcana',
    subclasses: ['Scuola di Abiurazione', 'Scuola di Ammaliamento', 'Scuola di Divinazione', 'Scuola di Evocazione', 'Scuola di Illusione', 'Scuola di Invocazione', 'Scuola di Necromanzia', 'Scuola di Trasmutazione'],
    spellcasting: { type: 'full', ability: 'int', mode: 'prepared', cantrips: (l) => tier(l, [[1, 3], [4, 4], [10, 5]]), prepared: (l, c) => Math.max(1, c.mod.int + l), spellbook: true },
    resources: (l) => [{ id: 'recupero', name: 'Recupero arcano', max: 1, recharge: 'lungo', info: `Recupera slot per un totale di ${Math.ceil(l / 2)} livelli (max 5°)` }],
    dice: () => [],
    features: {
      1: ['Incantesimi', 'Recupero arcano'], 2: ['Tradizione arcana'], 6: ['Privilegio della tradizione'], 10: ['Privilegio della tradizione'],
      14: ['Privilegio della tradizione'], 18: ['Padronanza degli incantesimi'], 20: ['Incantesimi distintivi'],
    },
  },
  {
    id: 'monaco', name: 'Monaco', hitDie: 8, primary: ['dex', 'wis'], saves: ['str', 'dex'],
    multiclassReq: { dex: 13, wis: 13 }, armor: [], weapons: 'Semplici, spade corte',
    skillChoices: { count: 2, from: ['acrobazia', 'atletica', 'storia', 'intuizione', 'religione', 'furtivita'] },
    asi: STD_ASI, subclassLevel: 3, subclassLabel: 'Tradizione monastica',
    subclasses: ['Via della Mano Aperta', 'Via dell\'Ombra', 'Via dei Quattro Elementi'],
    unarmored: { base: 10, abilities: ['dex', 'wis'], shield: false },
    resources: (l, c) => l >= 2 ? [{ id: 'ki', name: 'Punti Ki', max: l, recharge: 'breve', info: `CD Ki ${8 + c.prof + c.mod.wis}` }] : [],
    dice: (l, c) => [
      { label: 'Arti marziali', value: `d${tier(l, [[1, 4], [5, 6], [11, 8], [17, 10]])}` },
      { label: 'Movimento senza armatura', value: l >= 2 ? `+${tier(l, [[2, 3], [6, 4.5], [10, 6], [14, 7.5], [18, 9]])} m` : '—' },
      ...(l >= 2 ? [{ label: 'CD Ki', value: String(8 + c.prof + c.mod.wis) }] : []),
      ...(l >= 3 ? [{ label: 'Deviare proiettili (riduzione)', value: `1d10 + DES + ${l}` }] : []),
    ],
    features: {
      1: ['Difesa senza armatura (10 + DES + SAG)', 'Arti marziali (d4)'], 2: ['Ki', 'Movimento senza armatura (+3 m)', 'Raffica di colpi, Difesa paziente, Passo del vento'],
      3: ['Tradizione monastica', 'Deviare proiettili'], 4: ['Caduta lenta'], 5: ['Attacco extra', 'Colpo stordente', 'Arti marziali (d6)'],
      6: ['Colpi potenziati dal ki', 'Privilegio della tradizione'], 7: ['Elusione', 'Quiete della mente'], 10: ['Purezza del corpo'],
      11: ['Privilegio della tradizione', 'Arti marziali (d8)'], 13: ['Linguaggio del sole e della luna'], 14: ['Anima adamantina'],
      15: ['Corpo senza tempo'], 17: ['Privilegio della tradizione', 'Arti marziali (d10)'], 18: ['Corpo vuoto'], 20: ['Perfezione interiore'],
    },
  },
  {
    id: 'paladino', name: 'Paladino', hitDie: 10, primary: ['str', 'cha', 'con'], saves: ['wis', 'cha'],
    multiclassReq: { str: 13, cha: 13 }, armor: ['leggera', 'media', 'pesante', 'scudi'], weapons: 'Semplici e da guerra',
    skillChoices: { count: 2, from: ['atletica', 'intuizione', 'intimidire', 'medicina', 'persuasione', 'religione'] },
    asi: STD_ASI, subclassLevel: 3, subclassLabel: 'Giuramento sacro', subclasses: ['Giuramento di Devozione', 'Giuramento degli Antichi', 'Giuramento di Vendetta'],
    spellcasting: { type: 'half', ability: 'cha', mode: 'prepared', cantrips: () => 0, prepared: (l, c) => l < 2 ? 0 : Math.max(1, c.mod.cha + Math.floor(l / 2)) },
    resources: (l, c) => {
      const r = [{ id: 'imposizione', name: 'Imposizione delle mani (PF)', max: 5 * l, recharge: 'lungo' },
        { id: 'percezione', name: 'Percezione del divino', max: 1 + Math.max(0, c.mod.cha), recharge: 'lungo' }];
      if (l >= 3) r.push({ id: 'incanalare', name: 'Incanalare divinità', max: 1, recharge: 'breve' });
      return r;
    },
    dice: (l) => [{ label: 'Punizione divina', value: '2d8 (+1d8 per slot oltre il 1°, max 5d8; +1d8 vs non morti/immondi)' },
      ...(l >= 11 ? [{ label: 'Punizione divina migliorata', value: '+1d8 radiosi a ogni colpo in mischia' }] : [])],
    features: {
      1: ['Percezione del divino', 'Imposizione delle mani'], 2: ['Stile di combattimento', 'Incantesimi', 'Punizione divina'],
      3: ['Salute divina', 'Giuramento sacro'], 5: ['Attacco extra'], 6: ['Aura di protezione'], 7: ['Privilegio del giuramento'],
      10: ['Aura di coraggio'], 11: ['Punizione divina migliorata'], 14: ['Tocco purificatore'], 15: ['Privilegio del giuramento'],
      18: ['Aure migliorate (9 m)'], 20: ['Privilegio del giuramento'],
    },
  },
  {
    id: 'ranger', name: 'Ranger', hitDie: 10, primary: ['dex', 'wis'], saves: ['str', 'dex'],
    multiclassReq: { dex: 13, wis: 13 }, armor: ['leggera', 'media', 'scudi'], weapons: 'Semplici e da guerra',
    skillChoices: { count: 3, from: ['addestrare', 'atletica', 'intuizione', 'indagare', 'natura', 'percezione', 'furtivita', 'sopravvivenza'] },
    asi: STD_ASI, subclassLevel: 3, subclassLabel: 'Archetipo del ranger', subclasses: ['Cacciatore', 'Signore delle bestie'],
    spellcasting: { type: 'half', ability: 'wis', mode: 'known', cantrips: () => 0, known: [0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11] },
    resources: () => [],
    dice: (l) => l >= 20 ? [{ label: 'Sterminatore di nemici', value: '+SAG a tiro per colpire o danni, 1/turno' }] : [],
    features: {
      1: ['Nemico prescelto', 'Esploratore nato'], 2: ['Stile di combattimento', 'Incantesimi'], 3: ['Archetipo del ranger', 'Consapevolezza primordiale'],
      5: ['Attacco extra'], 6: ['Nemico prescelto e Esploratore nato migliorati'], 7: ['Privilegio dell\'archetipo'], 8: ['Andatura sul territorio'],
      10: ['Nascondersi in piena vista'], 11: ['Privilegio dell\'archetipo'], 14: ['Svanire'], 15: ['Privilegio dell\'archetipo'],
      18: ['Sensi ferini'], 20: ['Sterminatore di nemici'],
    },
  },
  {
    id: 'stregone', name: 'Stregone', hitDie: 6, primary: ['cha', 'con'], saves: ['con', 'cha'],
    multiclassReq: { cha: 13 }, armor: [], weapons: 'Balestre leggere, bastoni, dardi, fionde, pugnali',
    skillChoices: { count: 2, from: ['arcano', 'inganno', 'intuizione', 'intimidire', 'persuasione', 'religione'] },
    asi: STD_ASI, subclassLevel: 1, subclassLabel: 'Origine stregonesca', subclasses: ['Discendenza draconica', 'Magia selvaggia'],
    unarmoredSub: { 'Discendenza draconica': { base: 13, abilities: ['dex'], shield: true } },
    spellcasting: { type: 'full', ability: 'cha', mode: 'known', cantrips: (l) => tier(l, [[1, 4], [4, 5], [10, 6]]),
      known: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15] },
    resources: (l) => l >= 2 ? [{ id: 'stregoneria', name: 'Punti stregoneria', max: l, recharge: 'lungo',
      info: 'Creare slot: 1°=2, 2°=3, 3°=5, 4°=6, 5°=7 punti' }] : [],
    dice: (l) => l >= 3 ? [{ label: 'Metamagia conosciute', value: String(tier(l, [[3, 2], [10, 3], [17, 4]])) }] : [],
    features: {
      1: ['Incantesimi', 'Origine stregonesca'], 2: ['Fonte di magia (punti stregoneria)'], 3: ['Metamagia (2)'],
      6: ['Privilegio dell\'origine'], 10: ['Metamagia (3)'], 14: ['Privilegio dell\'origine'], 17: ['Metamagia (4)'],
      18: ['Privilegio dell\'origine'], 20: ['Ripristino stregonesco'],
    },
  },
  {
    id: 'warlock', name: 'Warlock', hitDie: 8, primary: ['cha', 'con'], saves: ['wis', 'cha'],
    multiclassReq: { cha: 13 }, armor: ['leggera'], weapons: 'Semplici',
    skillChoices: { count: 2, from: ['arcano', 'inganno', 'storia', 'intimidire', 'indagare', 'natura', 'religione'] },
    asi: STD_ASI, subclassLevel: 1, subclassLabel: 'Patrono ultraterreno', subclasses: ['Il Signore Fatato', 'L\'Immondo', 'Il Grande Antico'],
    spellcasting: { type: 'pact', ability: 'cha', mode: 'known', cantrips: (l) => tier(l, [[1, 2], [4, 3], [10, 4]]),
      known: [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15] },
    resources: (l) => l >= 11 ? [{ id: 'arcanum', name: 'Arcanum mistico', max: tier(l, [[11, 1], [13, 2], [15, 3], [17, 4]]), recharge: 'lungo', info: `Incantesimi di ${['6°', '6° e 7°', '6°–8°', '6°–9°'][tier(l, [[11, 0], [13, 1], [15, 2], [17, 3]])]} livello, 1/giorno ciascuno` }] : [],
    dice: (l) => [{ label: 'Suppliche occulte conosciute', value: String([0, 2, 2, 2, 3, 3, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8][l - 1]) }],
    features: {
      1: ['Patrono ultraterreno', 'Magia del patto'], 2: ['Suppliche occulte (2)'], 3: ['Dono del patto'], 5: ['Suppliche occulte (3)'],
      6: ['Privilegio del patrono'], 7: ['Suppliche occulte (4)'], 9: ['Suppliche occulte (5)'], 10: ['Privilegio del patrono'],
      11: ['Arcanum mistico (6°)'], 12: ['Suppliche occulte (6)'], 13: ['Arcanum mistico (7°)'], 14: ['Privilegio del patrono'],
      15: ['Arcanum mistico (8°)', 'Suppliche occulte (7)'], 17: ['Arcanum mistico (9°)'], 18: ['Suppliche occulte (8)'], 20: ['Maestro dell\'occulto'],
    },
  },
];

export const CLASS_BY_ID = Object.fromEntries(CLASSES.map(c => [c.id, c]));

// Slot incantesimo per livello incantatore (incantatori completi / multiclasse)
export const SLOT_TABLE = [
  [], [2], [3], [4, 2], [4, 3], [4, 3, 2], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1], [4, 3, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 3, 2, 2, 1, 1],
];

export function pactMagic(l) {
  if (l < 1) return null;
  return { slots: tier(l, [[1, 1], [2, 2], [11, 3], [17, 4]]), level: Math.min(5, Math.ceil(l / 2)) };
}

export const CANTRIP_DAMAGE_TIERS = (charLevel) => tier(charLevel, [[1, 1], [5, 2], [11, 3], [17, 4]]);
