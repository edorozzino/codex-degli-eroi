export const ABILITIES = [
  { id: 'str', name: 'Forza', short: 'FOR', desc: 'Potenza fisica: attacchi in mischia, sollevare, spingere, Atletica.' },
  { id: 'dex', name: 'Destrezza', short: 'DES', desc: 'Agilità e riflessi: CA, iniziativa, attacchi a distanza e con armi accurate.' },
  { id: 'con', name: 'Costituzione', short: 'COS', desc: 'Salute e resistenza: punti ferita, concentrazione sugli incantesimi.' },
  { id: 'int', name: 'Intelligenza', short: 'INT', desc: 'Ragionamento e memoria: incantesimi del mago, Arcano, Indagare.' },
  { id: 'wis', name: 'Saggezza', short: 'SAG', desc: 'Percezione e intuito: incantesimi di chierico, druido e ranger.' },
  { id: 'cha', name: 'Carisma', short: 'CAR', desc: 'Forza di personalità: incantesimi di bardo, stregone, warlock, paladino.' },
];
export const ABILITY_BY_ID = Object.fromEntries(ABILITIES.map(a => [a.id, a]));

export const SKILLS = [
  { id: 'acrobazia', name: 'Acrobazia', ability: 'dex', desc: 'Restare in piedi in situazioni difficili, capriole, tuffi, equilibrio.' },
  { id: 'addestrare', name: 'Addestrare animali', ability: 'wis', desc: 'Calmare un animale, intuirne le intenzioni, controllare una cavalcatura.' },
  { id: 'arcano', name: 'Arcano', ability: 'int', desc: 'Conoscenze su incantesimi, oggetti magici, simboli occulti e piani di esistenza.' },
  { id: 'atletica', name: 'Atletica', ability: 'str', desc: 'Scalare, saltare, nuotare, lottare e spingere.' },
  { id: 'furtivita', name: 'Furtività', ability: 'dex', desc: 'Nascondersi, muoversi senza farsi sentire, sgattaiolare.' },
  { id: 'indagare', name: 'Indagare', ability: 'int', desc: 'Cercare indizi, dedurre, trovare punti deboli e trappole nascoste.' },
  { id: 'inganno', name: 'Inganno', ability: 'cha', desc: 'Mentire in modo convincente, travestimenti, raggiri.' },
  { id: 'intimidire', name: 'Intimidire', ability: 'cha', desc: 'Influenzare con minacce, ostilità o violenza fisica.' },
  { id: 'intrattenere', name: 'Intrattenere', ability: 'cha', desc: 'Musica, danza, recitazione e narrazione davanti a un pubblico.' },
  { id: 'intuizione', name: 'Intuizione', ability: 'wis', desc: 'Capire le vere intenzioni di una creatura, scoprire bugie.' },
  { id: 'medicina', name: 'Medicina', ability: 'wis', desc: 'Stabilizzare un compagno morente, diagnosticare malattie.' },
  { id: 'natura', name: 'Natura', ability: 'int', desc: 'Conoscenze su terreni, piante, animali, meteo e cicli naturali.' },
  { id: 'percezione', name: 'Percezione', ability: 'wis', desc: 'Notare, vedere, sentire o percepire la presenza di qualcosa.' },
  { id: 'persuasione', name: 'Persuasione', ability: 'cha', desc: 'Influenzare con tatto, garbo e buona fede.' },
  { id: 'rapidita', name: 'Rapidità di mano', ability: 'dex', desc: 'Borseggiare, piazzare oggetti, giochi di prestigio.' },
  { id: 'religione', name: 'Religione', ability: 'int', desc: 'Conoscenze su divinità, riti, preghiere, gerarchie religiose.' },
  { id: 'sopravvivenza', name: 'Sopravvivenza', ability: 'wis', desc: 'Seguire tracce, cacciare, orientarsi, prevedere il tempo.' },
  { id: 'storia', name: 'Storia', ability: 'int', desc: 'Eventi storici, regni antichi, guerre, leggende.' },
];
export const SKILL_BY_ID = Object.fromEntries(SKILLS.map(s => [s.id, s]));

// Armature: type leggera/media/pesante; dexMax null = illimitato
export const ARMORS = [
  { id: 'nessuna', name: 'Nessuna armatura', type: 'nessuna', ac: 10, dexMax: null, desc: 'CA 10 + DES (o Difesa senza armatura se disponibile).' },
  { id: 'imbottita', name: 'Imbottita', type: 'leggera', ac: 11, dexMax: null, stealth: true, weight: 4, cost: '5 mo', desc: 'Strati trapuntati di stoffa. Svantaggio a Furtività.' },
  { id: 'cuoio', name: 'Cuoio', type: 'leggera', ac: 11, dexMax: null, weight: 5, cost: '10 mo', desc: 'Pettorale e spallacci di cuoio bollito nell\'olio.' },
  { id: 'cuoio-borchiato', name: 'Cuoio borchiato', type: 'leggera', ac: 12, dexMax: null, weight: 6.5, cost: '45 mo', desc: 'Cuoio rinforzato con rivetti di metallo.' },
  { id: 'pelle', name: 'Pelle', type: 'media', ac: 12, dexMax: 2, weight: 6, cost: '10 mo', desc: 'Pellicce e pelli spesse, tipica di barbari e druidi.' },
  { id: 'giaco', name: 'Giaco di maglia', type: 'media', ac: 13, dexMax: 2, weight: 10, cost: '50 mo', desc: 'Camicia di anelli metallici portata sotto gli abiti.' },
  { id: 'scaglie', name: 'Corazza di scaglie', type: 'media', ac: 14, dexMax: 2, stealth: true, weight: 22.5, cost: '50 mo', desc: 'Giubba coperta di scaglie metalliche sovrapposte. Svantaggio a Furtività.' },
  { id: 'corazza', name: 'Corazza a piastre', type: 'media', ac: 14, dexMax: 2, weight: 10, cost: '400 mo', desc: 'Pettorale metallico con protezioni in cuoio.' },
  { id: 'mezza', name: 'Mezza armatura', type: 'media', ac: 15, dexMax: 2, stealth: true, weight: 20, cost: '750 mo', desc: 'Piastre sagomate che coprono gran parte del corpo. Svantaggio a Furtività.' },
  { id: 'anelli', name: 'Cotta di anelli', type: 'pesante', ac: 14, dexMax: 0, stealth: true, weight: 20, cost: '30 mo', desc: 'Cuoio con anelli cuciti sopra. Svantaggio a Furtività.' },
  { id: 'maglia', name: 'Cotta di maglia', type: 'pesante', ac: 16, dexMax: 0, str: 13, stealth: true, weight: 27.5, cost: '75 mo', desc: 'Anelli intrecciati con imbottitura. FOR 13 richiesta. Svantaggio a Furtività.' },
  { id: 'strisce', name: 'Corazza a strisce', type: 'pesante', ac: 17, dexMax: 0, str: 15, stealth: true, weight: 30, cost: '200 mo', desc: 'Strisce verticali di metallo rivettate su cuoio. FOR 15 richiesta.' },
  { id: 'completa', name: 'Armatura completa', type: 'pesante', ac: 18, dexMax: 0, str: 15, stealth: true, weight: 32.5, cost: '1500 mo', desc: 'Piastre sagomate che coprono tutto il corpo. FOR 15 richiesta.' },
];
export const SHIELD = { id: 'scudo', name: 'Scudo', type: 'scudi', ac: 2, weight: 3, cost: '10 mo', desc: '+2 alla CA. Richiede una mano.' };
export const ARMOR_BY_ID = Object.fromEntries(ARMORS.map(a => [a.id, a]));

// Armi: props: accurata, leggera, pesante, portata, lancio, due mani, versatile, munizioni, ricarica
export const WEAPONS = [
  { id: 'randello', name: 'Randello', cat: 'semplice', range: 'mischia', dmg: '1d4', type: 'contundente', props: ['leggera'], monk: true },
  { id: 'pugnale', name: 'Pugnale', cat: 'semplice', range: 'mischia', dmg: '1d4', type: 'perforante', props: ['accurata', 'leggera', 'lancio 6/18 m'], monk: true },
  { id: 'randello-grande', name: 'Randello pesante', cat: 'semplice', range: 'mischia', dmg: '1d8', type: 'contundente', props: ['due mani'] },
  { id: 'ascia', name: 'Ascia', cat: 'semplice', range: 'mischia', dmg: '1d6', type: 'tagliente', props: ['leggera', 'lancio 6/18 m'], monk: true },
  { id: 'giavellotto', name: 'Giavellotto', cat: 'semplice', range: 'mischia', dmg: '1d6', type: 'perforante', props: ['lancio 9/36 m'], monk: true },
  { id: 'martello-leggero', name: 'Martello leggero', cat: 'semplice', range: 'mischia', dmg: '1d4', type: 'contundente', props: ['leggera', 'lancio 6/18 m'], monk: true },
  { id: 'mazza', name: 'Mazza', cat: 'semplice', range: 'mischia', dmg: '1d6', type: 'contundente', props: [], monk: true },
  { id: 'bastone', name: 'Bastone ferrato', cat: 'semplice', range: 'mischia', dmg: '1d6', versatile: '1d8', type: 'contundente', props: ['versatile'], monk: true },
  { id: 'falcetto', name: 'Falcetto', cat: 'semplice', range: 'mischia', dmg: '1d4', type: 'tagliente', props: ['leggera'], monk: true },
  { id: 'lancia', name: 'Lancia', cat: 'semplice', range: 'mischia', dmg: '1d6', versatile: '1d8', type: 'perforante', props: ['lancio 6/18 m', 'versatile'], monk: true },
  { id: 'balestra-leggera', name: 'Balestra leggera', cat: 'semplice', range: 'distanza', dmg: '1d8', type: 'perforante', props: ['munizioni 24/96 m', 'ricarica', 'due mani'] },
  { id: 'dardo', name: 'Dardo', cat: 'semplice', range: 'distanza', dmg: '1d4', type: 'perforante', props: ['accurata', 'lancio 6/18 m'] },
  { id: 'arco-corto', name: 'Arco corto', cat: 'semplice', range: 'distanza', dmg: '1d6', type: 'perforante', props: ['munizioni 24/96 m', 'due mani'] },
  { id: 'fionda', name: 'Fionda', cat: 'semplice', range: 'distanza', dmg: '1d4', type: 'contundente', props: ['munizioni 9/36 m'] },
  { id: 'ascia-battaglia', name: 'Ascia da battaglia', cat: 'guerra', range: 'mischia', dmg: '1d8', versatile: '1d10', type: 'tagliente', props: ['versatile'] },
  { id: 'mazzafrusto', name: 'Mazzafrusto', cat: 'guerra', range: 'mischia', dmg: '1d8', type: 'contundente', props: [] },
  { id: 'falcione', name: 'Falcione', cat: 'guerra', range: 'mischia', dmg: '1d10', type: 'tagliente', props: ['pesante', 'portata', 'due mani'] },
  { id: 'ascia-bipenne', name: 'Ascia bipenne', cat: 'guerra', range: 'mischia', dmg: '1d12', type: 'tagliente', props: ['pesante', 'due mani'] },
  { id: 'spadone', name: 'Spadone', cat: 'guerra', range: 'mischia', dmg: '2d6', type: 'tagliente', props: ['pesante', 'due mani'] },
  { id: 'alabarda', name: 'Alabarda', cat: 'guerra', range: 'mischia', dmg: '1d10', type: 'tagliente', props: ['pesante', 'portata', 'due mani'] },
  { id: 'lancia-cavaliere', name: 'Lancia da cavaliere', cat: 'guerra', range: 'mischia', dmg: '1d12', type: 'perforante', props: ['portata', 'speciale'] },
  { id: 'spada-lunga', name: 'Spada lunga', cat: 'guerra', range: 'mischia', dmg: '1d8', versatile: '1d10', type: 'tagliente', props: ['versatile'] },
  { id: 'maglio', name: 'Maglio', cat: 'guerra', range: 'mischia', dmg: '2d6', type: 'contundente', props: ['pesante', 'due mani'] },
  { id: 'morning-star', name: 'Morning star', cat: 'guerra', range: 'mischia', dmg: '1d8', type: 'perforante', props: [] },
  { id: 'picca', name: 'Picca', cat: 'guerra', range: 'mischia', dmg: '1d10', type: 'perforante', props: ['pesante', 'portata', 'due mani'] },
  { id: 'stocco', name: 'Stocco', cat: 'guerra', range: 'mischia', dmg: '1d8', type: 'perforante', props: ['accurata'] },
  { id: 'scimitarra', name: 'Scimitarra', cat: 'guerra', range: 'mischia', dmg: '1d6', type: 'tagliente', props: ['accurata', 'leggera'] },
  { id: 'spada-corta', name: 'Spada corta', cat: 'guerra', range: 'mischia', dmg: '1d6', type: 'perforante', props: ['accurata', 'leggera'], monk: true },
  { id: 'tridente', name: 'Tridente', cat: 'guerra', range: 'mischia', dmg: '1d6', versatile: '1d8', type: 'perforante', props: ['lancio 6/18 m', 'versatile'] },
  { id: 'piccone', name: 'Piccone da guerra', cat: 'guerra', range: 'mischia', dmg: '1d8', type: 'perforante', props: [] },
  { id: 'martello-guerra', name: 'Martello da guerra', cat: 'guerra', range: 'mischia', dmg: '1d8', versatile: '1d10', type: 'contundente', props: ['versatile'] },
  { id: 'frusta', name: 'Frusta', cat: 'guerra', range: 'mischia', dmg: '1d4', type: 'tagliente', props: ['accurata', 'portata'] },
  { id: 'balestra-mano', name: 'Balestra a mano', cat: 'guerra', range: 'distanza', dmg: '1d6', type: 'perforante', props: ['munizioni 9/36 m', 'leggera', 'ricarica'] },
  { id: 'balestra-pesante', name: 'Balestra pesante', cat: 'guerra', range: 'distanza', dmg: '1d10', type: 'perforante', props: ['munizioni 30/120 m', 'pesante', 'ricarica', 'due mani'] },
  { id: 'arco-lungo', name: 'Arco lungo', cat: 'guerra', range: 'distanza', dmg: '1d8', type: 'perforante', props: ['munizioni 45/180 m', 'pesante', 'due mani'] },
  { id: 'colpo-senz-armi', name: 'Colpo senz\'armi', cat: 'semplice', range: 'mischia', dmg: '1', type: 'contundente', props: [], monk: true, unarmed: true },
];
export const WEAPON_BY_ID = Object.fromEntries(WEAPONS.map(w => [w.id, w]));

export const CONDITIONS = [
  { name: 'Accecato', desc: 'Fallisce prove basate sulla vista; attacchi contro di lui con vantaggio, i suoi con svantaggio.' },
  { name: 'Affascinato', desc: 'Non può attaccare chi lo ha affascinato; questi ha vantaggio nelle prove sociali.' },
  { name: 'Afferrato', desc: 'Velocità 0. Termina se chi afferra è incapacitato o viene allontanato.' },
  { name: 'Assordato', desc: 'Non sente e fallisce prove basate sull\'udito.' },
  { name: 'Avvelenato', desc: 'Svantaggio a tiri per colpire e prove di caratteristica.' },
  { name: 'Incapacitato', desc: 'Non può effettuare azioni o reazioni.' },
  { name: 'Invisibile', desc: 'Impossibile da vedere senza aiuto; i suoi attacchi hanno vantaggio, quelli contro di lui svantaggio.' },
  { name: 'Paralizzato', desc: 'Incapacitato, non si muove né parla; fallisce TS FOR e DES; colpi in mischia entro 1,5 m sono critici.' },
  { name: 'Pietrificato', desc: 'Trasformato in sostanza inanimata; resistenza a tutti i danni; incapacitato.' },
  { name: 'Prono', desc: 'Si muove solo strisciando; svantaggio agli attacchi; vantaggio a chi lo attacca entro 1,5 m.' },
  { name: 'Spaventato', desc: 'Svantaggio a prove e attacchi finché vede la fonte della paura; non può avvicinarsi.' },
  { name: 'Stordito', desc: 'Incapacitato, non si muove, parla a fatica; fallisce TS FOR e DES; attacchi contro con vantaggio.' },
  { name: 'Trattenuto', desc: 'Velocità 0; svantaggio agli attacchi e ai TS DES; attacchi contro con vantaggio.' },
  { name: 'Privo di sensi', desc: 'Incapacitato, prono, lascia cadere ciò che tiene; colpi in mischia entro 1,5 m sono critici.' },
  { name: 'Indebolimento', desc: '6 livelli cumulativi: svantaggio prove → velocità dimezzata → svantaggio attacchi/TS → PF max dimezzati → velocità 0 → morte.' },
];

export const TERMS = [
  { name: 'Bonus di competenza', desc: '+2 ai livelli 1–4, +3 ai 5–8, +4 ai 9–12, +5 ai 13–16, +6 ai 17–20. Si basa sul livello totale del personaggio.' },
  { name: 'Vantaggio / Svantaggio', desc: 'Tira 2d20 e tieni il risultato più alto (vantaggio) o più basso (svantaggio). Non si cumulano.' },
  { name: 'Classe Armatura (CA)', desc: 'Il valore da raggiungere per colpirti. Dipende da armatura, scudo e Destrezza.' },
  { name: 'Dadi vita', desc: 'Un dado per livello, del tipo della classe. Si spendono durante un riposo breve per recuperare PF (dado + COS). Se ne recupera metà con un riposo lungo.' },
  { name: 'Tiro salvezza', desc: 'd20 + modificatore caratteristica (+ competenza se competente) contro una CD.' },
  { name: 'CD incantesimi', desc: '8 + bonus di competenza + modificatore della caratteristica da incantatore.' },
  { name: 'Attacco con incantesimo', desc: 'd20 + bonus di competenza + modificatore della caratteristica da incantatore.' },
  { name: 'Concentrazione', desc: 'Quando subisci danni: TS COS con CD 10 o metà del danno (il più alto) per mantenere l\'incantesimo.' },
  { name: 'Riposo breve', desc: 'Almeno 1 ora. Puoi spendere dadi vita; alcune risorse si ricaricano (ki, Incanalare divinità, slot del warlock...).' },
  { name: 'Riposo lungo', desc: 'Almeno 8 ore. Recuperi tutti i PF, metà dei dadi vita e tutti gli slot incantesimo.' },
  { name: 'Multiclasse', desc: 'Per prendere un livello in una nuova classe servono 13 nelle caratteristiche primarie sia della classe attuale che della nuova.' },
  { name: 'Aumento dei punteggi di caratteristica (ASI)', desc: 'Ad alcuni livelli di classe: +2 a una caratteristica o +1 a due (max 20), oppure un talento.' },
  { name: 'Trucchetti', desc: 'Incantesimi di livello 0, lanciabili a volontà. I danni scalano al livello 5, 11 e 17 del personaggio.' },
  { name: 'Tiri contro la morte', desc: 'A 0 PF: d20 ogni turno, 10+ successo, <10 fallimento. 3 successi = stabile, 3 fallimenti = morte. 20 naturale = 1 PF.' },
];

export const DICE = [4, 6, 8, 10, 12, 20, 100];
