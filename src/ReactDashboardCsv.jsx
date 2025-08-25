import React, { useEffect, useState } from 'react';
import ReactTableCSV from './ReactTableCsv';

const ReactDashboardCsv = ({ csvUrls = [], tables = [] }) => {
  const [results, setResults] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        let duckdb;
        try {
          // @ts-ignore
          duckdb = await import('duckdb-wasm');
        } catch (e) {
          setError('duckdb-wasm not available');
          setLoading(false);
          return;
        }

        let db;
        if (duckdb.create) {
          const worker = await duckdb.createWorker?.();
          db = await duckdb.create(worker);
        } else if (duckdb.AsyncDuckDB) {
          const worker = new duckdb.AsyncDuckDBWorker();
          db = new duckdb.AsyncDuckDB(worker);
          await db.instantiate?.();
        }

        for (let i = 0; i < csvUrls.length; i += 1) {
          const url = csvUrls[i];
          const name = `table_${i}`;
          try {
            if (db.registerFileURL) {
              await db.registerFileURL(name, url, { direct: true });
              await db.query(`CREATE TABLE ${name} AS SELECT * FROM read_csv_auto('${name}')`);
            } else {
              await db.query(`CREATE TABLE ${name} AS FROM read_csv_auto('${url}')`);
            }
          } catch {
            // ignore failures for individual files
          }
        }

        const res = {};
        for (const t of tables) {
          try {
            const q = await db.query(t.sql);
            res[t.id] = q.toArray?.() || q;
          } catch {
            res[t.id] = [];
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
  }, [csvUrls, tables]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      {tables.map((t) => (
        <ReactTableCSV key={t.id} csvData={results[t.id] || []} {...t.props} />
      ))}
    </div>
  );
};

export default ReactDashboardCsv;

