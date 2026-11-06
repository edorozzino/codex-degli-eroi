// Utilità di interfaccia condivise
import { roll, describe, isCrit } from './dice.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function openModal(html, { onClose } = {}) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `<div class="modal-backdrop" data-modal-backdrop><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`;
  const bd = root.firstElementChild;
  // Chiude cliccando fuori dalla finestra, ma solo con un clic vero:
  // non trascinando la barra di scorrimento (che appartiene allo sfondo),
  // non scorrendo col dito o con un trascinamento iniziato dentro la finestra.
  let downOnBackdrop = null;
  bd.addEventListener('pointerdown', (e) => {
    const onScrollbar = e.clientX >= bd.clientWidth || e.clientY >= bd.clientHeight;
    downOnBackdrop = e.target === bd && !onScrollbar && e.isPrimary ? { x: e.clientX, y: e.clientY, t: Date.now() } : null;
  });
  bd.addEventListener('click', (e) => {
    const d = downOnBackdrop; downOnBackdrop = null;
    if (!d || e.target !== bd) return;
    const moved = Math.hypot(e.clientX - d.x, e.clientY - d.y);
    if (moved < 10 && Date.now() - d.t < 800) closeModal();
  });
  root._onClose = onClose;
  return bd.querySelector('.modal');
}
export function closeModal() {
  const root = document.getElementById('modal-root');
  root.innerHTML = '';
  root._onClose?.(); root._onClose = null;
}
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.getElementById('modal-root').innerHTML) closeModal(); });

const rollHistory = [];
export const getRollHistory = () => rollHistory;
let historyListener = null;
export const onRoll = (fn) => { historyListener = fn; };

export function doRoll(expr, label = '', mode = 'normal') {
  let e = expr;
  if (mode !== 'normal' && /^1?d20/.test(expr)) e = expr.replace(/^1?d20/, mode === 'adv' ? '2d20kh1' : '2d20kl1');
  let r;
  try { r = roll(e); } catch (err) { toast(`<strong>Errore</strong><div>${esc(err.message)}</div>`); return null; }
  const crit = isCrit(r);
  const entry = { label, expr: e, total: r.total, detail: describe(r), crit, time: new Date() };
  rollHistory.unshift(entry); if (rollHistory.length > 50) rollHistory.pop();
  toast(`<span class="total">${r.total}</span><strong>${esc(label || 'Tiro')}</strong><div class="muted">${esc(e)} → ${esc(entry.detail)}</div>${crit === 'crit' ? '<div class="ok">Critico!</div>' : crit === 'fumble' ? '<div class="warn">1 naturale…</div>' : ''}`, crit);
  historyListener?.();
  return entry;
}

export function toast(html, cls = '') {
  const log = document.getElementById('roll-log');
  const el = document.createElement('div');
  el.className = 'toast ' + (cls || '');
  el.innerHTML = html;
  log.prepend(el);
  while (log.children.length > 4) log.lastChild.remove();
  setTimeout(() => el.remove(), 5000);
}
