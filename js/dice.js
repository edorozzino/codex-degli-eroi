// Parser e lanciatore di dadi: supporta espressioni tipo "2d6+3", "1d20+5", "4d6kh3", "d8"
export function roll(expr) {
  const clean = String(expr).replace(/\s+/g, '').toLowerCase();
  const parts = clean.match(/[+-]?[^+-]+/g) || [];
  let total = 0; const detail = [];
  for (const p of parts) {
    const sign = p.startsWith('-') ? -1 : 1;
    const body = p.replace(/^[+-]/, '');
    const m = /^(\d*)d(\d+)(kh(\d+)|kl(\d+))?$/.exec(body);
    if (m) {
      const n = Math.min(100, +(m[1] || 1)); const sides = +m[2];
      let rolls = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * sides));
      let kept = rolls;
      if (m[4]) kept = [...rolls].sort((a, b) => b - a).slice(0, +m[4]);
      if (m[5]) kept = [...rolls].sort((a, b) => a - b).slice(0, +m[5]);
      const sum = kept.reduce((a, b) => a + b, 0);
      total += sign * sum;
      detail.push({ term: (sign < 0 ? '-' : '') + body, rolls, kept, sides });
    } else if (/^\d+$/.test(body)) {
      total += sign * +body; detail.push({ term: (sign < 0 ? '-' : '+') + body });
    } else throw new Error('Espressione non valida: ' + expr);
  }
  return { expr, total, detail };
}

export function describe(r) {
  return r.detail.map(d => d.rolls ? `${d.term} [${d.rolls.join(', ')}]` : d.term).join(' ');
}

export function isCrit(r) {
  const d = r.detail.find(x => x.sides === 20);
  if (!d || d.kept.length !== 1) return null;
  return d.kept[0] === 20 ? 'crit' : d.kept[0] === 1 ? 'fumble' : null;
}
