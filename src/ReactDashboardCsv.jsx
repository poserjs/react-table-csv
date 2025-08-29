import React, { useEffect, useState } from 'react';
import ReactTableCSV from './ReactTableCsv';
import { normalizeParsed } from './utils/csv';

const errorToString = (e) => {
  try {
    if (!e) return 'Unknown error';
    if (typeof e === 'string') return e;
    return e.stack || e.message || JSON.stringify(e);
  } catch {
    return String(e);
  }
};

const ReactDashboardCsv = ({ datasets = {}, views = {}, db = 'duckdb', layout }) => {
  const [results, setResults] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // If no DB is requested, skip duckdb initialization
        if (db === 'none') {
          if (!cancelled) {
            setResults({});
            setLoading(false);
          }
          return;
        }

        // Dynamically import duckdb-wasm
        let duckdb;
        try {
          // @ts-ignore
          duckdb = await import('@duckdb/duckdb-wasm');
        } catch (e) {
          setError(`duckdb-wasm not available: ${errorToString(e)}`);
          setLoading(false);
          return;
        }

        // Resolve bundle across versions
        let bundle = null;
        try {
          const bundles = duckdb.getJsDelivrBundles?.() || duckdb.getBundledAssets?.();
          bundle = duckdb.selectBundle ? await duckdb.selectBundle(bundles) : bundles;
        } catch (e) {
          setError(`Failed to select duckdb-wasm bundle: ${errorToString(e)}`);
        }

        // Create worker
        let worker = null;
        if (duckdb.createWorker) {
          worker = await duckdb.createWorker(bundle?.mainWorker);
        }

        // Initialize DB supporting both modern and legacy APIs
        let ddb = null;
        if (duckdb.create && worker) {
          // Modern API
          ddb = await duckdb.create(worker);
        } else if (duckdb.AsyncDuckDB && worker) {
          // Legacy API
          const logger = duckdb.ConsoleLogger ? new duckdb.ConsoleLogger() : undefined;
          ddb = new duckdb.AsyncDuckDB(logger, worker);
          await ddb.instantiate?.(bundle?.mainModule, bundle?.pthreadWorker);
        }

        if (!ddb) {
          setError('duckdb-wasm unsupported version');
          setLoading(false);
          return;
        }

        // Helper to run queries across versions
        const runQuery = async (sql) => {
          if (ddb.query) return ddb.query(sql);
          const conn = await ddb.connect();
          const res = await conn.query(sql);
          await conn.close?.();
          return res;
        };

        // Helper: build CSV text from {headers, data}
        const buildCsvText = (obj) => {
          const { headers, data } = normalizeParsed(obj);
          const esc = (v) => {
            const s = v == null ? '' : String(v);
            if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
            return s;
          };
          const lines = [headers.join(',')];
          for (const row of data) {
            lines.push(headers.map((h) => esc(row[h])).join(','));
          }
          return lines.join('\n');
        };

        // Register datasets and materialize as tables
        for (const [key, meta] of Object.entries(datasets || {})) {
          const name = key; // use dataset key as table name
          try {
            const srcUrl = meta?.csvURL;
            const srcCsv = meta?.csvString;
            const srcCsvData = meta?.csvData;

            if (!srcUrl && !srcCsv && !srcCsvData) {
              // No source provided; skip silently
              continue;
            }

            if (srcUrl) {
              if (ddb.registerFileURL) {
                await ddb.registerFileURL(name, srcUrl, duckdb.DuckDBDataProtocol.HTTP);
                await runQuery(`CREATE TABLE "${name}" AS SELECT * FROM read_csv('${name}', delim=',', header=true)`);
              } else {
                await runQuery(`CREATE TABLE "${name}" AS FROM read_csv('${srcUrl}', DELIM=',', HEADER=TRUE)`);
              }
              continue;
            }

            // csv string or csvData path requires registering file text
            if (!ddb.registerFileText) {
              throw new Error('duckdb-wasm does not support registerFileText in this environment');
            }

            let csvText = srcCsv;
            if (!csvText && srcCsvData) {
              try {
                csvText = buildCsvText(srcCsvData);
              } catch (err) {
                throw new Error(`Failed to construct CSV text for dataset '${name}': ${errorToString(err)}`);
              }
            }
            await ddb.registerFileText(name, csvText);
            await runQuery(`CREATE TABLE "${name}" AS SELECT * FROM read_csv('${name}', delim=',', header=true)`);
          } catch (e) {
            setError(`Failed to create table '${name}': ${errorToString(e)}`);
          }
        }
        // All tables loaded; run configured queries

        // Execute queries for each view config
        const res = {};
        const datasetKeys = Object.keys(datasets || {});
        for (const [vid, v] of Object.entries(views || {})) {
          try {
            // If SQL is undefined, fall back to selecting all rows from the underlying dataset
            let sql = v.sql;
            if (!sql) {
              const dsName = v.dataset || (datasetKeys.length === 1 ? datasetKeys[0] : null);
              if (dsName) sql = `SELECT * FROM "${dsName}"`;
            }
            if (!sql) {
              res[vid] = { headers: [], data: [] };
              continue;
            }

            const q = await runQuery(sql);

            // Get rows from duckdb-wasm result across versions
            const rawRows = q?.toArray?.() || (Array.isArray(q) ? q : []);

            // Convert duckdb proxy rows to plain JSON objects when available
            const jsonRows = Array.isArray(rawRows)
              ? rawRows.map((r) => (r && typeof r.toJSON === 'function' ? r.toJSON() : r))
              : [];

            // Derive column headers from multiple possible shapes
            let headers = [];
            if (jsonRows && jsonRows.length > 0 && jsonRows[0] && typeof jsonRows[0] === 'object' && !Array.isArray(jsonRows[0])) {
              // Rows are objects already
              headers = Object.keys(jsonRows[0]);
            } else if (q?.schema?.fields && Array.isArray(q.schema.fields)) {
              // Arrow-style schema
              headers = q.schema.fields.map((f) => f.name);
            } else if (Array.isArray(q?.columns)) {
              // Some duckdb versions expose columns metadata
              headers = q.columns.map((c) => c?.name).filter(Boolean);
            }

            // Helper to coerce Date values to ISO strings for stable display/export
            const coerceValues = (obj) => {
              const out = {};
              for (const k of headers) {
                const v = obj[k];
                if (v && typeof v === 'object' && typeof v.toISOString === 'function') {
                  out[k] = v.toISOString();
                } else {
                  out[k] = v;
                }
              }
              return out;
            };

            // Normalize rows so each row is an object keyed by headers
            let data = [];
            if (Array.isArray(jsonRows)) {
              if (jsonRows.length > 0 && Array.isArray(jsonRows[0]) && headers.length > 0) {
                // Rows are arrays -> map to objects using headers
                data = jsonRows.map((row) => {
                  const obj = {};
                  for (let i = 0; i < headers.length; i += 1) obj[headers[i]] = row[i];
                  return coerceValues(obj);
                });
              } else if (jsonRows.length > 0 && jsonRows[0] && typeof jsonRows[0] === 'object' && !Array.isArray(jsonRows[0])) {
                // Already objects
                data = jsonRows.map(coerceValues);
              } else {
                data = [];
              }
            }
            res[vid] = { headers, data };
          } catch (e) {
            res[vid] = { headers: [], data: [] };
            setError(`Query failed for '${vid}': ${errorToString(e)}\nSQL: ${v.sql || '(auto SELECT *)'}`);
          }
        }

        if (!cancelled) {
          setResults(res);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [datasets, views, db]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div><pre>{error}</pre></div>;

  // Prepare an ordered list of view entries
  const viewEntries = Object.entries(views || {});

  // Helper to chunk view entries according to layout counts
  const buildRows = () => {
    // Normalize layout: if not provided, or empty, default to [1, 1, ...]
    if (!Array.isArray(layout) || layout.length === 0) {
      return viewEntries.map((e) => [e]);
    }
    const rows = [];
    let idx = 0;
    for (let i = 0; i < layout.length && idx < viewEntries.length; i += 1) {
      const raw = layout[i];
      const count = Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1;
      const row = [];
      for (let c = 0; c < count && idx < viewEntries.length; c += 1, idx += 1) {
        row.push(viewEntries[idx]);
      }
      rows.push(row);
    }
    // Any remaining views are rendered 1 per row
    while (idx < viewEntries.length) {
      rows.push([viewEntries[idx]]);
      idx += 1;
    }
    return rows;
  };

  const rows = buildRows();

  return (
    <div style={{ display: 'inline-block' }}>
      {rows.map((row, rowIndex) => (
        <table key={`row-${rowIndex}`} style={{ borderCollapse: 'separate', borderSpacing: 12, marginBottom: 12 }}>
          <tbody>
            <tr>
              {row.map(([vid, v]) => {
                const mergedProps = { ...(v.props || {}) };
                if (!mergedProps.storageKey) mergedProps.storageKey = `react-table-csv-${vid}`;
                // When db is 'none', pass through the underlying dataset directly to ReactTableCSV
                let passthroughProps = {};
                if (db === 'none') {
                  const datasetKeys = Object.keys(datasets || {});
                  const dsName = v.dataset || (datasetKeys.length === 1 ? datasetKeys[0] : null);
                  const ds = dsName ? datasets[dsName] : null;
                  if (ds) {
                    if (ds.csvData) {
                      passthroughProps = { csvData: ds.csvData };
                    } else if (ds.csvString) {
                      passthroughProps = { csvString: ds.csvString };
                    } else if (ds.csvURL) {
                      passthroughProps = { csvURL: ds.csvURL };
                    }
                  }
                }
                const normalizeUnit = (val) => (typeof val === 'number' ? `${val}px` : val);
                const extractMaxWidth = () => {
                  if (mergedProps.maxWidth != null) return mergedProps.maxWidth;
                  // Try to read from defaultSettings JSON if provided
                  try {
                    const ds = mergedProps.defaultSettings ? JSON.parse(mergedProps.defaultSettings) : null;
                    if (ds && typeof ds.tableMaxWidth === 'string') return ds.tableMaxWidth;
                  } catch (err) {
                    /* ignore parse errors */
                  }
                  return 'unlimited';
                };
                const rawMaxWidth = extractMaxWidth();
                const viewMaxWidth = normalizeUnit(rawMaxWidth);
                const isUnlimited = viewMaxWidth === 'unlimited' || viewMaxWidth === '100%' || viewMaxWidth === 'auto';
                const cellInnerStyle = isUnlimited
                  ? { minWidth: '320px', overflowX: 'hidden' }
                  : { maxWidth: viewMaxWidth, minWidth: '320px', overflowX: 'hidden' };
                return (
                  <td key={`cell-${vid}`} style={{ verticalAlign: 'top', width: isUnlimited ? 'auto' : viewMaxWidth }}>
                    <div style={cellInnerStyle}>
                      <ReactTableCSV
                        title={v?.title || vid}
                        collapsed={!!v?.collapsed}
                        {...(db === 'duckdb' ? { csvData: results[vid] || { headers: [], data: [] } } : {})}
                        {...passthroughProps}
                        {...mergedProps}
                      />
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      ))}
    </div>
  );
};

export default ReactDashboardCsv;
