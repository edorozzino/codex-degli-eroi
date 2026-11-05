# Codex degli Eroi — Gestore di schede D&D 5e

Applicazione web (HTML + JavaScript, nessun build) per creare e gestire **più schede di Dungeons & Dragons 5ª edizione**, con anteprima 3D del personaggio in stile dark fantasy.

## Funzionalità

- **Più personaggi**: crea, duplica, elimina, esporta/importa in JSON. Salvataggio automatico nel browser (localStorage).
- **Scheda che si adatta a razza e classe**
  - 9 razze con sottorazze (bonus caratteristica, tratti, velocità, competenze, trucchetti razziali come Taumaturgia del tiefling o il trucchetto dell'alto elfo).
  - 12 classi con dado vita, tiri salvezza, competenze, privilegi per livello e **risorse specifiche**: punti Ki (monaco), Ira (barbaro), Punti stregoneria, Ispirazione bardica, Forma selvatica, Incanalare divinità, Imposizione delle mani, Azione impetuosa, Dadi superiorità, Arcanum mistico...
  - **Incantesimi**: trucchetti conosciuti, incantesimi conosciuti/preparati, CD e attacco, slot per livello, magia del patto. Le sottoclassi incantatrici (Cavaliere mistico, Mistificatore arcano) sono gestite.
  - **Multiclasse**: requisiti verificati, risorse di tutte le classi insieme (es. druido + monaco = trucchetti/slot + punti Ki), slot combinati secondo le regole.
  - CA calcolata da armatura/scudo/Difesa senza armatura, avvisi di competenza e Forza minima.
- **Avanzamento di livello guidato**: scegli la classe (o una nuova in multiclasse), PF (media/tiro/manuale), elenco di ciò che ottieni (privilegi, risorse, trucchetti, slot), sottoclasse, e agli ASI **+2/+1+1 con suggerimenti** (caratteristiche primarie, punteggi dispari) oppure **talenti filtrati per requisiti** con quelli consigliati per la tua build. Annulla l'ultimo livello.
- **Dadi**: dadi del personaggio (dado vita, attacco furtivo, arti marziali, ispirazione, soffio...), attacchi e danni delle armi, lanciadadi con vantaggio/svantaggio ed espressioni (`2d6+3`, `4d6kh3`), storico. Ogni valore della scheda è cliccabile per tirare.
- **Note**: diario con categorie (Sessione, PNG, Luogo, Missione...) e ricerca.
- **Momenti di allineamento**: registra azioni che spostano il personaggio sugli assi Legale↔Caotico e Buono↔Malvagio; una bussola morale mostra la tendenza rispetto all'allineamento dichiarato.
- **Glossario**: abilità, caratteristiche, armature, armi, condizioni, regole, talenti, classi, razze, con ricerca.
- **Anteprima 3D** (Three.js): modello generato da razza (altezza, corporatura, orecchie, corna, coda, zanne, barba, testa draconica), caratteristiche (FOR → spalle e braccia, COS → torso, DES → snellezza, CAR → portamento e rifiniture), classe (cappucci, mantelli, vesti, aure magiche), armatura e prima arma. Atmosfera cupa: luce di braciere tremolante, nebbia fredda, braci, bloom, grading desaturato, vignettatura e grana. Esporta il ritratto in PNG.

## Avvio

Serve un server statico (i moduli ES non funzionano da `file://`):

```bash
cd dnd-character-manager
python3 -m http.server 8000
# apri http://localhost:8000
```

Funziona anche su GitHub Pages pubblicando la cartella. Three.js è incluso in `vendor/` (licenza MIT), quindi non servono CDN.

## Struttura

```
index.html
css/style.css
js/app.js          interfaccia e schede
js/wizards.js      creazione personaggio e avanzamento di livello
js/rules.js        calcoli (modificatori, CA, PF, slot, risorse, requisiti)
js/viewer3d.js     scena e modello 3D procedurale
js/dice.js         parser e lanciatore di dadi
js/storage.js      salvataggio ed esportazione
js/data/           razze, classi, talenti, glossario
vendor/three/      Three.js r160
```

## Note

I dati di gioco sono riassunti in italiano a scopo di consultazione; per i testi completi fai riferimento ai manuali ufficiali o all'SRD 5.1. Gli incantesimi si inseriscono a mano. Lo stile grafico si ispira all'estetica dark fantasy in generale e non usa asset di altri giochi.
