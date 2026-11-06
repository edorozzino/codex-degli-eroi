// Funzionamento offline e salvataggio persistente:
// registra il service worker, chiede al browser di non cancellare i dati salvati,
// mostra lo stato e offre l'installazione come app.
import { toast } from './ui.js';
import { clearCache } from './api.js';

const st = { sw: 'checking', persisted: null, usage: null, quota: null, installEvent: null, installed: false };
const supportsSW = 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1');

const mb = (b) => (b / 1048576).toLocaleString('it', { maximumFractionDigits: 1 }) + ' MB';

async function refreshStorage() {
  try {
    if (navigator.storage?.persisted) st.persisted = await navigator.storage.persisted();
    if (navigator.storage?.estimate) { const e = await navigator.storage.estimate(); st.usage = e.usage; st.quota = e.quota; }
  } catch { /* API non disponibile */ }
  render();
}

export async function requestPersistence(manual = false) {
  if (!navigator.storage?.persist) { if (manual) toast('<strong>Non supportato</strong><div>Questo browser non permette di rendere persistente la memoria.</div>'); return false; }
  const ok = await navigator.storage.persist().catch(() => false);
  st.persisted = ok;
  if (manual) toast(ok ? '<strong>Memoria persistente attiva</strong><div>Il browser non cancellerà le schede per liberare spazio.</div>'
    : '<strong>Il browser non ha concesso la memoria persistente</strong><div>Installa l\'app o aggiungi il sito ai preferiti e riprova. Esporta comunque le schede come backup.</div>', ok ? 'crit' : '');
  render();
  return ok;
}

function render() {
  const el = document.getElementById('offline-status');
  if (!el) return;
  const swTxt = { checking: '⏳ Preparazione offline…', ready: '✓ Disponibile offline', updated: '✓ Disponibile offline (aggiornata)', unsupported: '✗ Offline non disponibile in questo browser', error: '⚠ Cache offline non attiva' }[st.sw];
  el.innerHTML = `
    <span class="${st.sw === 'ready' || st.sw === 'updated' ? 'ok' : st.sw === 'checking' ? 'muted' : 'warn'}">${swTxt}</span>
    <span class="${st.persisted ? 'ok' : 'muted'}">${st.persisted == null ? '' : st.persisted ? '🔒 Memoria persistente' : '🔓 Memoria non persistente'}</span>
    ${st.usage != null ? `<span class="muted">Spazio usato: ${mb(st.usage)}</span>` : ''}
    ${st.persisted === false ? '<button class="btn small ghost" data-offline="persist">🔒 Rendi persistente</button>' : ''}
    ${st.installEvent && !st.installed ? '<button class="btn small gold" data-offline="install">📲 Installa app</button>' : ''}
    <button class="btn small ghost" data-offline="clear" title="Svuota i dati SRD scaricati dalla D&D 5e API">🧹 Svuota cache SRD</button>`;
  const top = document.getElementById('install-btn');
  if (top) top.hidden = !(st.installEvent && !st.installed);
}

document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-offline]');
  if (!b) return;
  const a = b.dataset.offline;
  if (a === 'persist') requestPersistence(true);
  if (a === 'install' && st.installEvent) {
    st.installEvent.prompt();
    const { outcome } = await st.installEvent.userChoice.catch(() => ({}));
    if (outcome === 'accepted') { st.installed = true; st.installEvent = null; requestPersistence(); }
    render();
  }
  if (a === 'clear') {
    if (!confirm('Svuotare la cache dei dati SRD (incantesimi, mostri, immagini)? Le tue schede NON vengono toccate.')) return;
    clearCache();
    if ('caches' in window) await caches.delete('codex-dati-srd');
    toast('<strong>Cache SRD svuotata</strong><div>I dati verranno riscaricati alla prossima consultazione.</div>');
    refreshStorage();
  }
});

window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); st.installEvent = e; render(); });
window.addEventListener('appinstalled', () => { st.installed = true; st.installEvent = null; render(); requestPersistence(); });

export function initOffline() {
  render();
  if (!supportsSW) { st.sw = 'unsupported'; render(); refreshStorage(); return; }
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('./sw.js').then(reg => {
    navigator.serviceWorker.ready.then(() => { st.sw = 'ready'; render(); refreshStorage(); });
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      w?.addEventListener('statechange', () => {
        if (w.state === 'activated' && hadController) { st.sw = 'updated'; render(); toast('<strong>App aggiornata</strong><div>La nuova versione è salvata per l\'uso offline.</div>'); }
      });
    });
  }).catch(err => { console.warn('Service worker non registrato', err); st.sw = 'error'; render(); });
  // Chiede la memoria persistente al primo salvataggio dell'utente (molti browser la concedono in silenzio)
  requestPersistence();
  refreshStorage();
}

export const offlineState = st;
