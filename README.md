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

## Scheda base di Kael

Al primo avvio in un browser l'app carica la scheda di **Kael (Foglia Umida)**, Druido 5 (Circolo della Luna) / Monaco 2, presa dalla sua scheda originale (`js/data/presets.js`), con incantesimi collegati all'SRD, strategie, forme selvatiche e diario nelle Note.
- **↺ Ripristina base** (nell'intestazione della scheda) la riporta ai valori iniziali.
- Se la elimini non ricompare da sola: c'è il pulsante **+ Scheda base** nella lista dei personaggi.
- **⇪ Importa** accetta anche i file `.txt` salvati con 💾 Salva dalla scheda originale di Kael e li converte.

## Offline e installazione

- Un **service worker** (`sw.js`) salva l'app nella cache del browser: dopo la prima visita funziona anche **senza connessione** (schede, dadi, 3D, glossario). Online carica sempre l'ultima versione.
- I dati SRD già consultati (incantesimi, mostri, immagini) restano in cache e sono disponibili offline.
- L'app chiede al browser la **memoria persistente**, così le schede non vengono cancellate per liberare spazio. Lo stato è in fondo alla pagina, con il pulsante "🔒 Rendi persistente" se non è stata concessa.
- È **installabile** come app (📲 Installa su Chrome/Edge/Android; su iPhone: Condividi → Aggiungi a Home).

## Dati online: D&D 5e API

L'app usa la **[D&D 5e API](https://www.dnd5eapi.co)** (dati SRD 5.1, gratuita, senza chiave, CORS aperto) per:

| Funzione | Endpoint |
|---|---|
| Grimorio: incantesimi della propria classe filtrati per livello, con dettagli, danni scalati al livello del personaggio/slot e tiri | `/api/2014/classes/{classe}/spells`, `/api/2014/spells/{index}` |
| Testi ufficiali dei privilegi nel wizard di avanzamento e nella scheda (anche sottoclassi SRD) | `/api/2014/classes/{classe}/levels/{n}`, `/api/2014/subclasses/{sub}/levels/{n}`, `/api/2014/features/{index}` |
| Forma selvatica: bestie con GS e limiti di nuoto/volo del tuo druido (Circolo della Luna incluso), con immagini e blocco statistiche con tiri | GraphQL `/graphql/2014` (`monsters(type: "beast")`), `/api/2014/monsters/{index}` |
| Glossario online: incantesimi, oggetti magici, mostri | `/api/2014/spells`, `/api/2014/magic-items`, `/api/2014/monsters` |

Le risposte vengono salvate in cache nel browser per 30 giorni; quello che hai già consultato resta disponibile anche offline. Gli incantesimi aggiunti alla scheda salvano un riassunto (livello, scuola, danni, CD) così i tiri funzionano senza rete. I testi SRD sono in inglese. Contenuti SRD 5.1 © Wizards of the Coast, licenza CC-BY-4.0.

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
js/api.js          client D&D 5e API con cache
js/srd.js          grimorio, Forma selvatica, mostri, privilegi SRD
js/dice.js         parser e lanciatore di dadi
js/storage.js      salvataggio ed esportazione
js/offline.js      service worker, memoria persistente e installazione
js/importers.js    schede base e import dal formato della scheda di Kael
js/data/           razze, classi, talenti, glossario
vendor/three/      Three.js r160
sw.js              service worker (cache offline)
manifest.webmanifest, icons/  installazione come app
```

## Note

I dati di gioco sono riassunti in italiano a scopo di consultazione; per i testi completi fai riferimento ai manuali ufficiali o all'SRD 5.1. Gli incantesimi si possono scegliere dal grimorio SRD o inserire a mano (per quelli non SRD). Lo stile grafico si ispira all'estetica dark fantasy in generale e non usa asset di altri giochi.
