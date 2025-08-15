import { useState, useEffect } from 'react';
import { parseCSV, normalizeParsed } from '../utils/csv';

/**
 * Load CSV data from a string, URL, or pre-parsed object.
 * When fetching a URL, non-OK responses produce an error object with
 * `status` and `message` fields.
 */
const useCsvData = ({ csvString, csvURL, csvData }) => {
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
