export default function sortRows(rows, visibleHeaders, columnStyles) {
  const sorts = visibleHeaders
    .map(h => ({ col: h, mode: columnStyles[h]?.sort || 'none' }))
    .filter(s => s.mode && s.mode !== 'none');
  if (sorts.length === 0) return rows;

  const toNum = (v) => {
    if (typeof v === 'number') return v;
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
  };

  const cmp = (a, b, mode, col) => {
    const numeric = mode.includes('numbers');
    const asc = mode.startsWith('up');
    let av = a[col];
    let bv = b[col];
    if (numeric) {
      const an = toNum(av);
      const bn = toNum(bv);
      if (an === null && bn === null) return 0;
      if (an === null) return asc ? 1 : -1;
      if (bn === null) return asc ? -1 : 1;
      return asc ? an - bn : bn - an;
    }
    if (av == null && bv == null) return 0;
    if (av == null) return asc ? 1 : -1;
    if (bv == null) return asc ? -1 : 1;
    const res = String(av).localeCompare(String(bv));
    return asc ? res : -res;
  };

  const out = [...rows];
  out.sort((a, b) => {
    for (const s of sorts) {
      const r = cmp(a, b, s.mode, s.col);
      if (r !== 0) return r;
    }
    return 0;
  });
  return out;
}
