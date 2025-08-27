const isIntegerString = (s) => typeof s === 'string' && /^\s*-?\d+\s*$/.test(s);
const coerceToBigInt = (v) => {
  if (typeof v === 'bigint') return v;
  if (typeof v === 'number' && Number.isInteger(v)) return BigInt(v);
  if (isIntegerString(v)) return BigInt(v.trim());
  return null;
};
const coerceToNumber = (v) => {
  if (typeof v === 'number') return Number.isNaN(v) ? null : v;
  if (typeof v === 'bigint') {
    const abs = v < 0n ? -v : v;
    return abs <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : null;
  }
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return Number.isNaN(n) ? null : n;
  }
  return null;
};

export default function sortRows(rows, visibleHeaders, columnStyles) {
  const sorts = visibleHeaders
    .map(h => ({ col: h, mode: columnStyles[h]?.sort || 'none' }))
    .filter(s => s.mode && s.mode !== 'none');
  if (sorts.length === 0) return rows;

  const cmp = (a, b, mode, col) => {
    const numeric = mode.includes('numbers');
    const asc = mode.startsWith('up');
    let av = a[col];
    let bv = b[col];
    if (numeric) {
      const ai = coerceToBigInt(av);
      const bi = coerceToBigInt(bv);
      if (ai !== null && bi !== null) {
        const r = ai < bi ? -1 : ai > bi ? 1 : 0;
        return asc ? r : -r;
      }
      const an = coerceToNumber(av);
      const bn = coerceToNumber(bv);
      if (an === null && bn === null) return 0;
      if (an === null) return asc ? 1 : -1;
      if (bn === null) return asc ? -1 : 1;
      const r = an - bn;
      return asc ? r : -r;
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
