import React from 'react';
import { ReactDashboardCSV } from '@poserjs/react-table-csv';

const Dash2: React.FC = () => (
  <>
    <h2>NoSql Demo</h2>
    <div>
      <ReactDashboardCSV
        db="none"
        layout={[2]}
        datasets={{
          capitals: { title: 'US State Capitals', csvURL: 'http://localhost:5173/us-state-capitals.csv' },
          cities: { title: 'US Top 1k Cities (multi-year)', csvURL: 'http://localhost:5173/us-cities-top-1k-multi-year.csv' },
        }}
        views={{
          'capitals-all': {
            title: 'All State Capitals',
            collapsed: false,
            dataset: 'capitals',
            props: { defaultSettings: { version: '0.1', theme: 'lite', showFilterRow: true, showRowNumbers: true, tableMaxHeight: '100vh', tableMaxWidth: '100vh' }, downloadFilename: 'capitals.csv' },
          },
          'cities-all': {
            title: 'All Cities',
            collapsed: false,
            dataset: 'cities',
            props: { defaultSettings: { version: '0.1', theme: 'lite', showFilterRow: true, showRowNumbers: true, tableMaxHeight: '100vh', tableMaxWidth: '100vh' }, downloadFilename: 'cities-all.csv' },
          },
        }}
      />
    </div>
  </>
);

export default Dash2;

