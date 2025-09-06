import React from 'react';
import { ReactDashboardCSV } from '@poserjs/react-table-csv';

const Dash1: React.FC = () => (
  <>
    <h2 style={{ marginTop: 24 }}>HTTP Sources</h2>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
      <ReactDashboardCSV
        datasets={{
          capitals: { title: 'US State Capitals', csvURL: 'http://localhost:5173/us-state-capitals.csv' },
          cities: { title: 'US Top 1k Cities (multi-year)', csvURL: 'http://localhost:5173/us-cities-top-1k-multi-year.csv' },
          demographics: { title: 'US Cities Demographics', csvURL: 'http://localhost:5173/us-cities-demographics.csv' },
        }}
        views={{
          'by-initial': {
            title: 'States by Initial',
            collapsed: false,
            sql: `SELECT substr(t.state, 1, 1) AS Initial, t.state AS StateName, t.capital AS CapitalCity FROM capitals AS t ORDER BY 1 ASC, 2 ASC`,
            props: {
              defaultSettings: {
                version: '0.1',
                theme: 'dark',
                columnStyles: { Initial: { groupBy: true }, StateName: { reducer: 'cnt' } },
                columnOrder: ['Initial', 'StateName', 'CapitalCity'],
                filters: {},
                showRowNumbers: true,
              },
              downloadFilename: 'us-state-capitals-by-initial.csv',
            },
          },
          'n-states-sorted': {
            title: "States starting with 'N'",
            collapsed: true,
            sql: `SELECT t.state AS StateName, t.capital AS CapitalCity, length(t.capital) AS CapitalLength, substr(t.capital,1,1) AS CapitalInitial FROM capitals AS t WHERE t.state LIKE 'N%' ORDER BY 3 DESC, 2 ASC`,
            props: {
              defaultSettings: {
                version: '0.1',
                theme: 'lite',
                columnStyles: { CapitalInitial: { groupBy: true }, CapitalLength: { type: 'number' } },
                columnOrder: ['CapitalInitial', 'StateName', 'CapitalCity', 'CapitalLength'],
                showFilterRow: true,
                filters: { StateName: 'N' },
                showRowNumbers: false,
              },
              downloadFilename: 'n-states-capitals.csv',
            },
          },
          'top-cities-2014': {
            title: 'Top US Cities by Population (2014)',
            collapsed: false,
            sql: `SELECT c.State AS State, c.City AS City, c.year AS Year, c.Population AS Population FROM cities AS c WHERE c.year = 2014 ORDER BY c.Population DESC LIMIT 15`,
            props: {
              defaultSettings: {
                version: '0.1',
                theme: 'lite',
                columnStyles: { Population: { type: 'number', numFormat: 'thousand' }, Year: { type: 'number' } },
                columnOrder: ['State', 'City', 'Population', 'Year'],
                showFilterRow: true,
                showRowNumbers: true,
                tableMaxHeight: '100vh',
                tableMaxWidth: '100vh',
              },
              downloadFilename: 'top-us-cities-2014.csv',
            },
          },
          'demographics-all': {
            title: 'US Cities Demographics (All Columns)',
            collapsed: false,
            sql: `SELECT * FROM demographics AS d`,
            props: {
              defaultSettings: { version: '0.1', theme: 'lite', showFilterRow: true, showRowNumbers: true, tableMaxHeight: '100vh', tableMaxWidth: '100vh' },
              downloadFilename: 'us-cities-demographics-all.csv',
            },
          },
        }}
      />
    </div>
  </>
);

export default Dash1;

