import './App.css';
import React from 'react';
import { ReactTableCSV, ReactDashboardCSV } from '@poserjs/react-table-csv';
import { sampleCSV } from './sample-csv';

const App: React.FC = () => {
  const sampleSettings = '{"version":"0.1","theme":"dark","columnStyles":{"Department":{"splitBy":true,"type":"number"},"Position":{"groupBy":true},"Name":{"reducer":"cnt"},"Salary":{"reducer":"min-max","type":"number"},"Start Date":{"reducer":"min-max"},"Performance Rating":{"reducer":"min-max"}},"columnOrder":["Department","Position","Name","Salary","Start Date","Performance Rating"],"hiddenColumns":["Department"],"filters":{"Salary":">60000","Position":""},"dropdownFilters":{},"filterMode":{"Salary":"text"},"showFilterRow":false,"pinnedAnchor":null,"showRowNumbers":true}';

  return (
    <>
      <h1>Demo</h1>
      <div>
        <ReactTableCSV csvString={sampleCSV} defaultSettings={sampleSettings} title="react-table-csv"/>
        <ReactTableCSV csvURL="http://localhost:5173/us-cities-demographics.csv" title="react-table-csv"/>
      </div>

      <h2 style={{ marginTop: 24 }}>Dashboard</h2>
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
                  columnStyles: {
                    Initial: { groupBy: true },
                    StateName: { reducer: 'cnt' },
                  },
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
                  columnStyles: {
                    CapitalInitial: { groupBy: true },
                    CapitalLength: { type: 'number' },
                  },
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
                  columnStyles: {
                    Population: { type: 'number', numFormat: 'thousand' },
                    Year: { type: 'number' },
                  },
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
                defaultSettings: {
                  version: '0.1',
                  theme: 'lite',
                  showFilterRow: true,
                  showRowNumbers: true,
                  tableMaxHeight: '100vh',
                  tableMaxWidth: '100vh',
                },
                downloadFilename: 'us-cities-demographics-all.csv',
              },
            },
          }}
        />
      </div>

      <h2>Dashboard NoSql Demo</h2>
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
              dataset: 'capitals', // shows all rows/columns from this dataset
              props: {
                defaultSettings: {
                  version: '0.1',
                  theme: 'lite',
                  showFilterRow: true,
                  showRowNumbers: true,
                  tableMaxHeight: '100vh',
                  tableMaxWidth: '100vh',
                },
                downloadFilename: 'capitals.csv',
              },
            },
            'cities-all': {
              title: 'All Cities',
              collapsed: false,
              dataset: 'cities',
              props: {
                defaultSettings: {
                  version: '0.1',
                  theme: 'lite',
                  showFilterRow: true,
                  showRowNumbers: true,
                  tableMaxHeight: '100vh',
                  tableMaxWidth: '100vh',
                },
                downloadFilename: 'cities-all.csv',
              },
            },
          }}
        />
      </div>

      <h2 style={{ marginTop: 24 }}>Dashboard DuckDB Attach Demo</h2>
      <div>
        <ReactDashboardCSV
          db="duckdb"
          layout={[2,1]}
          dbs={{
            cities: { dbURL: 'http://localhost:5173/cities.duckdb' },
          }}
          views={{
            'from-db-capitals': {
              title: 'DB: State Capitals',
              sql: 'SELECT * FROM cities.capitals',
              props: {
                defaultSettings: {
                  version: '0.1',
                  theme: 'lite',
                  showFilterRow: true,
                  showRowNumbers: true,
                  tableMaxHeight: '100vh',
                  tableMaxWidth: '100vh',
                },
                downloadFilename: 'state-capitals.csv',
              },
            },
            'from-db-cities': {
              title: 'DB: Cities (multi-year)',
              sql: 'SELECT * FROM cities.cities',
              props: {
                defaultSettings: {
                  version: '0.1',
                  theme: 'lite',
                  showFilterRow: true,
                  showRowNumbers: true,
                  tableMaxHeight: '100vh',
                  tableMaxWidth: '100vh',
                },
                downloadFilename: 'cities.csv',
              },
            },
            'from-db-demographics': {
              title: 'DB: Cities Demographics',
              sql: 'SELECT * FROM cities.demographics',
              props: {
                defaultSettings: {
                  version: '0.1',
                  theme: 'lite',
                  showFilterRow: true,
                  showRowNumbers: true,
                  tableMaxHeight: '100vh',
                  tableMaxWidth: '100vh',
                },
                downloadFilename: 'cities-demographics.csv',
              },
            },
          }}
        />
      </div>
    </>
  );
};

export default App;
