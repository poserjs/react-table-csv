import React, { createContext, useContext, useEffect, useState } from 'react';

const errorToString = (e) => {
  try {
    if (!e) return 'Unknown error';
    if (typeof e === 'string') return e;
    return e.stack || e.message || JSON.stringify(e);
  } catch {
    return String(e);
  }
};

const DuckDBContext = createContext(null);

export const useDuckDB = () => useContext(DuckDBContext);

const ReactDuckDBContainer = ({ dbs, db = 'duckdb', children }) => {
  const [state, setState] = useState({ ddb: null, runQuery: null, loading: true, error: null, duckdb: null });

  useEffect(() => {
    let cancelled = false;
    let worker = null;
    let ddb = null;
    let duckdb;
    (async () => {
      setState({ ddb: null, runQuery: null, loading: true, error: null, duckdb: null });
      try {
        if (db === 'none') {
          if (!cancelled) setState({ ddb: null, runQuery: null, loading: false, error: null, duckdb: null });
          return;
        }

        try {
          // @ts-ignore
          duckdb = await import('@duckdb/duckdb-wasm');
        } catch (e) {
          if (!cancelled) setState({ ddb: null, runQuery: null, loading: false, error: `duckdb-wasm not available: ${errorToString(e)}`, duckdb: null });
          return;
        }

        let bundle = null;
        try {
          const bundles = duckdb.getJsDelivrBundles?.() || duckdb.getBundledAssets?.();
          bundle = duckdb.selectBundle ? await duckdb.selectBundle(bundles) : bundles;
        } catch (e) {
          if (!cancelled) setState({ ddb: null, runQuery: null, loading: true, error: `Failed to select duckdb-wasm bundle: ${errorToString(e)}`, duckdb });
        }

        if (duckdb.createWorker) {
          worker = await duckdb.createWorker(bundle?.mainWorker);
        }

        if (duckdb.create && worker) {
          ddb = await duckdb.create(worker);
        } else if (duckdb.AsyncDuckDB && worker) {
          const logger = duckdb.ConsoleLogger ? new duckdb.ConsoleLogger() : undefined;
          ddb = new duckdb.AsyncDuckDB(logger, worker);
          await ddb.instantiate?.(bundle?.mainModule, bundle?.pthreadWorker);
        }

        if (!ddb) {
          if (!cancelled) setState({ ddb: null, runQuery: null, loading: false, error: 'duckdb-wasm unsupported version', duckdb });
          return;
        }

        const runQuery = async (sql) => {
          if (ddb.query) return ddb.query(sql);
          const conn = await ddb.connect();
          const res = await conn.query(sql);
          await conn.close?.();
          return res;
        };

        for (const [dbName, meta] of Object.entries(dbs || {})) {
          const dbUrl = meta?.dbURL;
          if (!dbUrl) continue;
          const fileName = `${dbName}.duckdb`;
          try {
            if (ddb.registerFileURL) {
              await ddb.registerFileURL(fileName, dbUrl, duckdb.DuckDBDataProtocol.HTTP);
            } else if (ddb.registerFileBuffer) {
              const resp = await fetch(dbUrl);
              const buf = new Uint8Array(await resp.arrayBuffer());
              await ddb.registerFileBuffer(fileName, buf);
            }
            await runQuery(`ATTACH '${fileName}' AS "${dbName}" (READ_ONLY)`);
          } catch (e) {
            if (!cancelled) setState({ ddb, runQuery, loading: false, error: `Failed to attach DB '${dbName}': ${errorToString(e)}`, duckdb });
            return;
          }
        }

        if (!cancelled) setState({ ddb, runQuery, loading: false, error: null, duckdb });
      } catch (e) {
        if (!cancelled) setState({ ddb: null, runQuery: null, loading: false, error: e.message || String(e), duckdb });
      }
    })();
    return () => {
      cancelled = true;
      ddb?.terminate?.();
      worker?.terminate?.();
    };
  }, [dbs, db]);

  return (
    <DuckDBContext.Provider value={state}>
      {children}
    </DuckDBContext.Provider>
  );
};

export default ReactDuckDBContainer;
