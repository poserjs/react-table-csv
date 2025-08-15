import Papa from 'papaparse';

export const parseCSV = (csv) => {
  const result = Papa.parse(csv, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
    transformHeader: (h) => (h || '').trim(),
    transform: (v) => (typeof v === 'string' ? v.trim() : v),
  });

  const headers = result.meta?.fields || [];
  const data = (result.data || []).map((row, idx) => {
    const obj = {};
    headers.forEach((h) => {
      obj[h] = row[h] !== undefined && row[h] !== null ? row[h] : '';
    });
    obj._id = idx + 1;
    return obj;
  });
  return { headers, data };
};

export const normalizeParsed = (parsed) => {
  const headers = parsed?.meta?.fields || parsed?.headers || [];
  const rows = parsed?.data || [];
  const data = rows.map((row, idx) => {
    const obj = {};
    headers.forEach((h) => {
      obj[h] = row[h] !== undefined && row[h] !== null ? row[h] : '';
    });
    obj._id = idx + 1;
    return obj;
  });
  return { headers, data };
};

export default { parseCSV, normalizeParsed };
