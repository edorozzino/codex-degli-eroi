// Schede base precaricate. Kael è riportato così com'è nel file "kael_scheda_completa.html"
// (formato della sua app originale) e viene convertito nel formato del Codex da importers.js.
export const KAEL_RAW = {
  version: 2,
  name: "Kael (Foglia Umida)",
  classLevel: "Monaco 2 / Druido 5 (Circolo della Luna)",
  level: 7, druidLevel: 5, xp: 23950,
  info: { race: "", background: "", alignment: "", languages: "Comune, Druidico", proficiencies: "Armi semplici, spade corte (Monaco). Armature leggere/medie non metalliche, scudi (Druido). Kit da erborista.", speed: "12 m" },
  stats: { str: 10, dex: 16, con: 14, int: 10, wis: 20, cha: 8 },
  saveProf: { str: false, dex: false, con: false, int: true, wis: true, cha: false },
  skills: [
    ["Acrobazia","dex"],["Addestrare Animali","wis"],["Arcano","int"],["Atletica","str"],["Furtività","dex"],["Indagare","int"],
    ["Inganno","cha"],["Intimidire","cha"],["Intrattenere","cha"],["Intuizione","wis"],["Medicina","wis"],["Natura","int"],
    ["Percezione","wis"],["Persuasione","cha"],["Rapidità di Mano","dex"],["Religione","int"],["Sopravvivenza","wis"],["Storia","int"]
  ].map(([name,stat])=>({name,stat,prof:0})),
  acBonus: 0, initBonus: 0,
  hp: { current: 52, max: 52, temp: 0 },
  hitDice: { current: 7, max: 7, die: 8 },
  deathSaves: { s: 0, f: 0 },
  conditions: "",
  concentration: "",
  activeForm: -1,
  resources: {
    ki: { label: "⚡ Punti Ki", current: 2, max: 2, rest: "breve" },
    wildShape: { label: "🐾 Forma Selvatica", current: 2, max: 2, rest: "breve" },
    slots1: { current: 4, max: 4 },
    slots2: { current: 3, max: 3 },
    slots3: { current: 2, max: 2 }
  },
  attacks: [
    { name: "Bastone + Randello Incantato", hit: "COMP+SAG", dmg: "1d8+SAG", type: "contundenti", notes: "Serve Randello Incantato attivo (Az. Bonus, 1 min). Dopo l'Attacco: colpo senz'armi bonus (Arti Marziali)." },
    { name: "Bastone (2 mani)", hit: "COMP+DES", dmg: "1d8+DES", type: "contundenti", notes: "Arma da monaco: usa DES." },
    { name: "Bastone (1 mano)", hit: "COMP+DES", dmg: "1d6+DES", type: "contundenti", notes: "" },
    { name: "Colpo senz'armi", hit: "COMP+DES", dmg: "1d4+DES", type: "contundenti", notes: "Arti Marziali: 1 colpo come Az. Bonus dopo l'Attacco. Raffica di Colpi (1 Ki): 2 colpi come Az. Bonus." },
    { name: "Produrre Fiamma (lancio)", hit: "COMP+SAG", dmg: "2d8", type: "fuoco", notes: "Gittata 9 m. Prima Azione per evocarla, poi la lanci (stessa Azione se già in mano)." }
  ],
  spells: [
    { name: "Produrre Fiamma", level: 0, roll: "2d8", upcast: "", save: "", attack: true, conc: false, desc: "Fiamma in mano: luce 3 m. Azione: lanciala entro 9 m. Attacco con incantesimo. 2d8 fuoco dal 5° livello del personaggio." },
    { name: "Guida", level: 0, roll: "1d4", upcast: "", save: "", attack: false, conc: true, desc: "Tocco, conc. 1 min. Il bersaglio aggiunge 1d4 a una prova di caratteristica." },
    { name: "Randello Incantato", level: 0, roll: "1d8+SAG", upcast: "", save: "", attack: false, conc: false, desc: "Az. Bonus, 1 min (NO concentrazione). Il bastone usa SAG per colpire e per i danni, dado d8. Lancialo prima del combattimento!" },
    { name: "Parola Guaritrice", level: 1, roll: "1d4+SAG", upcast: "1d4", save: "", attack: false, conc: false, desc: "Az. Bonus, 18 m. Cura. Perfetta per rialzare un alleato a 0 PF." },
    { name: "Cura Ferite", level: 1, roll: "1d8+SAG", upcast: "1d8", save: "", attack: false, conc: false, desc: "Tocco. Cura." },
    { name: "Fuoco Fatato", level: 1, roll: "", upcast: "", save: "DES", attack: false, conc: true, desc: "Cubo 6 m entro 18 m. Chi fallisce brilla: attacchi contro di lui con vantaggio, niente invisibilità. 1 min." },
    { name: "Intralciare", level: 1, roll: "", upcast: "", save: "FOR", attack: false, conc: true, desc: "Quadrato 6 m entro 27 m. Terreno difficile; chi fallisce è trattenuto (prova di FOR vs CD per liberarsi). 1 min." },
    { name: "Raggio di Luna", level: 2, roll: "2d10", upcast: "1d10", save: "COS", attack: false, conc: true, desc: "Cilindro raggio 1,5 m entro 36 m. Danno radiante a chi ci entra la prima volta nel turno o ci inizia il turno (metà se supera). Azione: spostalo di 18 m. 1 min." },
    { name: "Passare Senza Tracce", level: 2, roll: "", upcast: "", save: "", attack: false, conc: true, desc: "+10 Furtività a te e agli alleati entro 9 m. Non lasciate tracce. 1 ora." },
    { name: "Pelle di Corteccia", level: 2, roll: "", upcast: "", save: "", attack: false, conc: true, desc: "Tocco. La CA non può essere inferiore a 16. 1 ora. Inutile su Kael (CA 18), ottimo su forme bestiali o alleati." },
    { name: "Invocare Fulmini", level: 3, roll: "3d10", upcast: "1d10", save: "DES", attack: false, conc: true, desc: "Nube a 30 m d'altezza (serve l'aperto). Subito e poi con un'Azione ogni turno: fulmine in raggio 1,5 m entro 36 m (metà se supera). 4d10 se c'è già una tempesta. 10 min." }
  ],
  abilities: [
    { name: "Difesa Senza Armatura (Monaco)", desc: "Senza armatura né scudo: CA = 10 + DES + SAG." },
    { name: "Arti Marziali (Monaco)", desc: "Colpi senz'armi e armi da monaco (bastone) usano DES. Colpo senz'armi 1d4. Dopo l'Attacco con un colpo senz'armi o un'arma da monaco: un colpo senz'armi come Az. Bonus." },
    { name: "Ki (Monaco)", desc: "Punti Ki = livello da Monaco, recuperati con riposo breve. CD 16. Raffica di Colpi: dopo l'Attacco, 2 colpi senz'armi come Az. Bonus. Difesa Paziente: Schivata come Az. Bonus. Passo del Vento: Disimpegno o Scatto come Az. Bonus, salto raddoppiato." },
    { name: "Movimento Senza Armatura (Monaco)", desc: "+3 m alla velocità senza armatura né scudo." },
    { name: "Druidico", desc: "Conosci la lingua segreta dei druidi e puoi lasciare messaggi nascosti." },
    { name: "Lancio Rituale (Druido)", desc: "Puoi lanciare come rituale (+10 min, senza slot) gli incantesimi rituali preparati." },
    { name: "Forma Selvatica (Druido)", desc: "2 usi, ricaricati con riposo breve. Durata fino a 2 ore (metà livello druido). Bestie fino a GS 1, niente velocità di volare (fino al Druido 8), il nuoto è permesso. Prendi FOR/DES/COS e PF della bestia, tieni SAG/INT/CAR e le competenze. Non puoi lanciare incantesimi, ma mantieni la concentrazione. A 0 PF torni normale e il danno in eccesso passa a te." },
    { name: "Forma Selvatica da Combattimento (Luna)", desc: "Puoi trasformarti con un'Az. Bonus invece che con un'Azione. In forma, come Az. Bonus, spendi uno slot per curarti 1d8 PF per livello dello slot." },
    { name: "Forme del Circolo (Luna)", desc: "GS massimo 1 fino al Druido 5. Dal Druido 6: GS = livello druido / 3 (arrotondato per difetto)." }
  ],
  forms: [
    { name: "Orso Bruno", cr: "1", ac: 11, hp: 34, hpCur: 34, speed: "12 m, scalare 9 m", str: 19, dex: 10, con: 16,
      attacks: [{ name: "Morso", hit: "6", dmg: "1d8+4", notes: "perforanti" }, { name: "Artigli", hit: "6", dmg: "2d6+4", notes: "taglienti" }],
      traits: "Multiattacco: un morso e un artiglio.\nOlfatto acuto: vantaggio alle prove di Percezione basate sull'olfatto.\nCombo: Pelle di Corteccia prima → CA 16." },
    { name: "Lupo Crudele", cr: "1", ac: 14, hp: 37, hpCur: 37, speed: "15 m", str: 17, dex: 15, con: 15,
      attacks: [{ name: "Morso", hit: "5", dmg: "2d6+3", notes: "perforanti. TS FOR CD 13 o prono" }],
      traits: "Tattiche di Branco: vantaggio se un alleato è entro 1,5 m dal bersaglio.\nUdito e olfatto acuti.\nIl più veloce e resistente: ottimo per inseguire e buttare a terra." },
    { name: "Ragno Gigante", cr: "1", ac: 14, hp: 26, hpCur: 26, speed: "9 m, scalare 9 m", str: 14, dex: 16, con: 12,
      attacks: [{ name: "Morso", hit: "5", dmg: "1d8+3", notes: "perforanti + TS COS CD 11: 2d8 veleno (metà se supera)" }, { name: "Ragnatela (ricarica 5-6)", hit: "5", dmg: "", notes: "9/18 m: bersaglio trattenuto (CD 12 FOR per liberarsi)" }],
      traits: "Scalare come un ragno (anche sul soffitto).\nVista cieca 3 m, scurovisione 18 m.\nSenso della ragnatela, cammina sulle ragnatele.\nPerfetto per esplorare e per le imboscate." },
    { name: "Iena Gigante", cr: "1", ac: 12, hp: 45, hpCur: 45, speed: "15 m", str: 16, dex: 14, con: 14,
      attacks: [{ name: "Morso", hit: "5", dmg: "2d6+3", notes: "perforanti" }],
      traits: "Furia: quando porti una creatura a 0 PF col morso, Az. Bonus per muoverti di metà velocità e mordere ancora.\nTanti PF (45) per GS 1." },
    { name: "Piovra Gigante", cr: "1", ac: 11, hp: 52, hpCur: 52, speed: "3 m, nuotare 18 m", str: 17, dex: 13, con: 13,
      attacks: [{ name: "Tentacoli", hit: "5", dmg: "2d6+3", notes: "contundenti, portata 4,5 m. Afferrato e trattenuto (CD 16 per liberarsi)" }],
      traits: "Solo in acqua! Respira sott'acqua, fuori trattiene il fiato 1 ora.\nMimetismo subacqueo: vantaggio a Furtività sott'acqua.\nNube d'inchiostro (1/riposo): sfera 6 m di oscurità, poi Scatto." },
    { name: "Coccodrillo", cr: "1/2", ac: 12, hp: 19, hpCur: 19, speed: "6 m, nuotare 9 m", str: 15, dex: 10, con: 13,
      attacks: [{ name: "Morso", hit: "4", dmg: "1d10+2", notes: "perforanti. Afferrato (CD 12) e trattenuto" }],
      traits: "Trattiene il fiato 15 minuti." },
    { name: "Squalo di Scogliera", cr: "1/2", ac: 12, hp: 22, hpCur: 22, speed: "nuotare 12 m", str: 14, dex: 13, con: 13,
      attacks: [{ name: "Morso", hit: "4", dmg: "1d8+2", notes: "perforanti" }],
      traits: "Tattiche di Branco. Respira sott'acqua. Vista cieca 9 m." }
  ],
  strategies: [
    { title: "⚡ Tempesta + Orso (all'aperto)", tag: "Apertura · danno ad area", text:
"Serve l'aperto: la nube si forma a 30 m d'altezza.\n1° turno, Azione: Invocare Fulmini (slot 3°, concentrazione). Primo fulmine subito: 3d10 fulmine, TS DES CD 16 (metà se lo supera). Se c'è già una tempesta: 4d10.\n1° turno, Az. Bonus: Forma Selvatica in Orso Bruno (+34 PF da consumare prima dei tuoi).\nTurni successivi, Azione: un altro fulmine da 3d10. In forma bestiale chiedi al DM: è un'azione dell'incantesimo, non un nuovo lancio. Se non è ammesso, usa il Multiattacco: morso d20+6 → 1d8+4 e artigli d20+6 → 2d6+4.\nQuando subisci danni: TS COS per la concentrazione (CD 10 oppure metà danno)." },
    { title: "🛡️ Orso corazzato (tank)", tag: "Difesa · prima linea", text:
"Prima del combattimento: Pelle di Corteccia su te stesso (slot 2°, conc. 1 ora). La CA non scende sotto 16.\nAz. Bonus: Forma Selvatica in Orso Bruno. CA 16 invece di 11, 34 PF.\nOgni turno, Multiattacco: morso d20+6 → 1d8+4 perforanti, artigli d20+6 → 2d6+4 taglienti.\nPF della forma bassi? Az. Bonus: spendi uno slot per curarti 1d8 (slot 1°), 2d8 (slot 2°) o 3d8 (slot 3°).\nRiserva totale: 2 forme da 34 PF, più i 52 PF di Kael, più le cure con gli slot.\nPelle di Corteccia dura 1 ora: copre anche la seconda forma." },
    { title: "🌙 Raggio di Luna + Lupo", tag: "Apertura · controllo", text:
"1° turno, Azione: Raggio di Luna (slot 2°, conc.) sul gruppo nemico: 2d10 radiante, TS COS CD 16 (metà). Con lo slot 3° fa 3d10.\n1° turno, Az. Bonus: Forma Selvatica in Lupo Crudele (CA 14, 37 PF, 15 m).\nTurni successivi: morso d20+5 → 2d6+3. Il bersaglio fa un TS FOR CD 13 o cade prono, e gli alleati in mischia lo attaccano con vantaggio.\nTattiche di Branco: vantaggio quando un alleato è vicino al bersaglio.\nSpingi o tieni i nemici nel raggio: subiscono danno quando ci entrano o ci iniziano il turno. Per spostare il raggio (Azione) in forma bestiale chiedi al DM." },
    { title: "👊 Monaco col Randello (forma umana)", tag: "Mischia · danno costante", text:
"Prima del combattimento: Randello Incantato (Az. Bonus, 1 min, NON richiede concentrazione).\nAzione, Attacco col bastone: d20+8 → 1d8+5 contundenti.\nAz. Bonus, colpo senz'armi: d20+6 → 1d4+3.\nOppure Raffica di Colpi (1 Ki): due colpi, d20+6 → 1d4+3 e d20+6 → 1d4+3.\nCircondato? Difesa Paziente (1 Ki, Az. Bonus): Schivata, gli attacchi contro di te hanno svantaggio.\nPuoi abbinarlo a un incantesimo di concentrazione già attivo (es. Raggio di Luna lanciato il turno prima)." },
    { title: "🌿 Controllo del campo", tag: "Supporto al gruppo", text:
"Intralciare (slot 1°, conc.): quadrato 6 m entro 27 m, TS FOR CD 16 o trattenuto. Chi è trattenuto attacca con svantaggio e viene attaccato con vantaggio.\nFuoco Fatato (slot 1°, conc.): cubo 6 m, TS DES CD 16. Gli attacchi contro i bersagli hanno vantaggio e gli invisibili si vedono.\nDopo il lancio: Az. Bonus in Forma Selvatica e vai in mischia. Con il Lupo e Fuoco Fatato il vantaggio è quasi garantito.\nTiri salvezza dei nemici: lancia d20 per loro se il DM te lo chiede." },
    { title: "🌊 Combattimento in acqua", tag: "Ambiente acquatico", text:
"Piovra Gigante: 52 PF, nuoto 18 m. Tentacoli d20+5 (portata 4,5 m) → 2d6+3; il bersaglio è afferrato e trattenuto (CD 16). Usa la Nube d'Inchiostro per fuggire.\nCoccodrillo: morso d20+4 → 1d10+2 e il bersaglio è afferrato (CD 12).\nSqualo di Scogliera: morso d20+4 → 1d8+2, Tattiche di Branco, vista cieca 9 m.\nTrascina un nemico afferrato sott'acqua, lontano dal suo gruppo.\nSe prepari Respirare Sott'acqua (3° liv., rituale) tutto il gruppo può seguirti per 24 ore." },
    { title: "❤️ Emergenza e supporto", tag: "Cure · fuga", text:
"Alleato a 0 PF: Parola Guaritrice (Az. Bonus, 18 m): 1d4+5 con lo slot 1°, 2d4+5 con lo slot 2°.\nAttenzione: se usi l'Az. Bonus per un incantesimo, con l'Azione puoi lanciare solo un trucchetto.\nCura Ferite (tocco): 1d8+5, +1d8 per ogni slot superiore al 1°.\nKael in pericolo: Passo del Vento (1 Ki) per Disimpegno o Scatto, oppure Difesa Paziente (1 Ki).\nDopo un riposo breve: spendi Dadi Vita, ciascuno 1d8+2." },
    { title: "🌫️ Imboscata e furtività", tag: "Esplorazione", text:
"Passare Senza Tracce (slot 2°, conc. 1 ora): +10 a Furtività per tutto il gruppo.\nFurtività di Kael: d20+DES+10, più la competenza se ce l'hai.\nEsplora come Ragno Gigante: sale sui muri e sul soffitto e ha vista cieca 3 m. La Ragnatela (d20+5) blocca un nemico in fuga.\nApri l'agguato da lontano con Raggio di Luna. Lascia cadere Passare Senza Tracce quando inizia lo scontro, perché la concentrazione ti serve per il Raggio." }
  ],
  gold: 105,
  notes: "Inventario Funghi:\n- 1 fungo * (non identificato)\n- 2 funghi curativi (verde/bianchi)\n- 2 funghi psichedelici (neri/rossi)\n- 6 funghi curativi (simil porcini)\n\nTratto: 'La nebbia è mia amica.'",
  journeyNotes: "- Shadowmore\n\n- never winter\n\n- abbiamo diviso la chiave\n\n- dove la citta cresce sopra cio che non vede\n\n- fungo ?? \n\n- pugnale \n\n- medaglione\n\npressione,flusso coerenza\n\nenergia che\n\nprotcollo di produzione: preparare,regolare,condensare, stabilizzare, trasferire\n\nuna carica non e potere, e potere e riutilizzabile\n\n20 monete\n\n1 pozza a testa \n\nkit da cucito\n\n10 razioni\n\nroba alchimistica generica\n\n- contenre ,controllare,sopravvviere\n\nattiva prima leva, -> irtmo piu regolare \nattiva il ritorno -> ritmo regolare come primo\nregistrazione _> \n,testimonazione\n\nispirazione bardica \n\n- \n\n- 12 anni psichigi\n\nmarelli meccanici\n\nogni piastra , piccola radice,goccia,campana,clessidra,occhio,stella\n\n- 1 punto ispirazione\n\n- stella il primo apre, radice sostiene,goccia ricorda\n\n- venrik stor  m "
};

// Dati SRD 5.1 (dnd5eapi.co) degli incantesimi di Kael, salvati qui per usarli anche offline
export const KAEL_SRD = {
 "barkskin": {
  "index": "barkskin",
  "name": "Barkskin",
  "level": 2,
  "school": "Transmutation",
  "attack": null,
  "dc": null,
  "dmgType": null,
  "dmgChar": null,
  "dmgSlot": null,
  "heal": null,
  "concentration": true,
  "ritual": false
 },
 "call-lightning": {
  "index": "call-lightning",
  "name": "Call Lightning",
  "level": 3,
  "school": "Conjuration",
  "attack": null,
  "dc": null,
  "dmgType": "Lightning",
  "dmgChar": null,
  "dmgSlot": {
   "3": "3d10",
   "4": "4d10",
   "5": "5d10",
   "6": "6d10",
   "7": "7d10",
   "8": "8d10",
   "9": "9d10"
  },
  "heal": null,
  "concentration": true,
  "ritual": false
 },
 "cure-wounds": {
  "index": "cure-wounds",
  "name": "Cure Wounds",
  "level": 1,
  "school": "Evocation",
  "attack": null,
  "dc": null,
  "dmgType": null,
  "dmgChar": null,
  "dmgSlot": null,
  "heal": {
   "1": "1d8 + MOD",
   "2": "2d8 + MOD",
   "3": "3d8 + MOD",
   "4": "4d8 + MOD",
   "5": "5d8 + MOD",
   "6": "6d8 + MOD",
   "7": "7d8 + MOD",
   "8": "8d8 + MOD",
   "9": "9d8 + MOD"
  },
  "concentration": false,
  "ritual": false
 },
 "entangle": {
  "index": "entangle",
  "name": "Entangle",
  "level": 1,
  "school": "Conjuration",
  "attack": null,
  "dc": {
   "ability": "str",
   "success": "none"
  },
  "dmgType": null,
  "dmgChar": null,
  "dmgSlot": null,
  "heal": null,
  "concentration": true,
  "ritual": false
 },
 "faerie-fire": {
  "index": "faerie-fire",
  "name": "Faerie Fire",
  "level": 1,
  "school": "Evocation",
  "attack": null,
  "dc": {
   "ability": "dex",
   "success": "none"
  },
  "dmgType": null,
  "dmgChar": null,
  "dmgSlot": null,
  "heal": null,
  "concentration": true,
  "ritual": false
 },
 "guidance": {
  "index": "guidance",
  "name": "Guidance",
  "level": 0,
  "school": "Divination",
  "attack": null,
  "dc": null,
  "dmgType": null,
  "dmgChar": null,
  "dmgSlot": null,
  "heal": null,
  "concentration": true,
  "ritual": false
 },
 "healing-word": {
  "index": "healing-word",
  "name": "Healing Word",
  "level": 1,
  "school": "Evocation",
  "attack": null,
  "dc": null,
  "dmgType": null,
  "dmgChar": null,
  "dmgSlot": null,
  "heal": {
   "1": "1d4 + MOD",
   "2": "2d4 + MOD",
   "3": "3d4 + MOD",
   "4": "4d4 + MOD",
   "5": "5d4 + MOD",
   "6": "6d4 + MOD",
   "7": "7d4 + MOD",
   "8": "8d4 + MOD",
   "9": "9d4 + MOD"
  },
  "concentration": false,
  "ritual": false
 },
 "moonbeam": {
  "index": "moonbeam",
  "name": "Moonbeam",
  "level": 2,
  "school": "Evocation",
  "attack": null,
  "dc": {
   "ability": "con",
   "success": "half"
  },
  "dmgType": "Radiant",
  "dmgChar": null,
  "dmgSlot": {
   "2": "2d10",
   "3": "3d10",
   "4": "4d10",
   "5": "5d10",
   "6": "6d10",
   "7": "7d10",
   "8": "8d10",
   "9": "9d10"
  },
  "heal": null,
  "concentration": true,
  "ritual": false
 },
 "pass-without-trace": {
  "index": "pass-without-trace",
  "name": "Pass Without Trace",
  "level": 2,
  "school": "Abjuration",
  "attack": null,
  "dc": null,
  "dmgType": null,
  "dmgChar": null,
  "dmgSlot": null,
  "heal": null,
  "concentration": true,
  "ritual": false
 },
 "produce-flame": {
  "index": "produce-flame",
  "name": "Produce Flame",
  "level": 0,
  "school": "Conjuration",
  "attack": "ranged",
  "dc": null,
  "dmgType": "Fire",
  "dmgChar": {
   "1": "1d8",
   "5": "2d8",
   "11": "3d8",
   "17": "4d8"
  },
  "dmgSlot": null,
  "heal": null,
  "concentration": false,
  "ritual": false
 },
 "shillelagh": {
  "index": "shillelagh",
  "name": "Shillelagh",
  "level": 0,
  "school": "Transmutation",
  "attack": null,
  "dc": null,
  "dmgType": null,
  "dmgChar": null,
  "dmgSlot": null,
  "heal": null,
  "concentration": false,
  "ritual": false
 }
};
