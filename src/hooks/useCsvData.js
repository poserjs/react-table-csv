import { useState, useEffect } from 'react';
import Papa from 'papaparse';

/**
 * Load CSV data from a string, URL, or pre-parsed object.
 * When fetching a URL, non-OK responses produce an error object with
 * `status` and `message` fields.
 */
const useCsvData = ({ csvString, csvURL, csvData }) => {
  const parseCSV = (csv) => {
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

  const normalizeParsed = (parsed) => {
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

  const [originalHeaders, setOriginalHeaders] = useState([]);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const loadData = async () => {
      try {
        setError(null);
        if (csvString) {
          const { headers, data } = parseCSV(csvString);
          setOriginalHeaders(headers);
          setData(data);
        } else if (csvData) {
          const { headers, data } = normalizeParsed(csvData);
          setOriginalHeaders(headers);
          setData(data);
        } else if (csvURL) {
          const res = await fetch(csvURL, { signal: controller.signal });
          if (!res.ok) {
            const err = new Error(res.statusText || 'Request failed');
            err.status = res.status;
            throw err;
          }
          const text = await res.text();
          if (controller.signal.aborted) return;
          const { headers, data } = parseCSV(text);
          if (controller.signal.aborted) return;
          setOriginalHeaders(headers);
          setData(data);
        } else {
          setError({
            status: 0,
            message: 'One of csvString, csvData, or csvURL must be provided.',
          });
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError({
            status: err.status || 0,
            message: err.message || 'Failed to load CSV data.',
          });
        }
      }
    };
    loadData();
    return () => controller.abort();
  }, [csvString, csvData, csvURL]);

  return { originalHeaders, data, error };
};

export default useCsvData;
