import React from 'react';
import { ReactDashboardCSV } from '@poserjs/react-table-csv';

const Dash3: React.FC = () => (
  <>
    <h2 style={{ marginTop: 24 }}>Attached DuckDB</h2>
    <div>
      <ReactDashboardCSV
        layout={[2,1]}
        dbs={{ cities: { dbURL: 'http://localhost:5173/cities.duckdb' } }}
        views={{
          'from-db-capitals': {
            title: 'DB: State Capitals',
            sql: 'SELECT * FROM cities.capitals',
            props: { defaultSettings: { version: '0.1', theme: 'lite', showFilterRow: true, showRowNumbers: true, tableMaxHeight: '100vh', tableMaxWidth: '100vh' }, downloadFilename: 'state-capitals.csv' },
          },
          'from-db-cities': {
            title: 'DB: Cities (multi-year)',
            sql: 'SELECT * FROM cities.cities',
            props: { defaultSettings: { version: '0.1', theme: 'lite', showFilterRow: true, showRowNumbers: true, tableMaxHeight: '100vh', tableMaxWidth: '100vh' }, downloadFilename: 'cities.csv' },
          },
          'from-db-demographics': {
            title: 'DB: Cities Demographics',
            sql: 'SELECT * FROM cities.demographics',
            props: { defaultSettings: { version: '0.1', theme: 'lite', showFilterRow: true, showRowNumbers: true, tableMaxHeight: '100vh', tableMaxWidth: '100vh' }, downloadFilename: 'cities-demographics.csv' },
          },
        }}
      />
    </div>
  </>
);

export default Dash3;

