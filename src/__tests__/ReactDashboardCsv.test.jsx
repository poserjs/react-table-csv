/* eslint-env jest */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ReactDashboardCSV from '../ReactDashboardCsv';
import ReactDuckDBContainer, { useDuckDB } from '../ReactDuckDBContainer';

// Cap each test to 10 seconds max
jest.setTimeout(10000);

// Mock duckdb-wasm to avoid loading real WASM in tests
jest.mock('@duckdb/duckdb-wasm', () => {
  const dbState = { files: {} };
  const db = {
    registerFileURL: async (name /* , url, proto */) => {
      dbState.files[name] = 'url';
    },
    registerFileText: async (name /* , text */) => {
      dbState.files[name] = 'text';
    },
    query: async (sql) => {
      // Swallow CREATE TABLE statements
      if (/^\s*CREATE\s+TABLE/i.test(sql)) {
        return { toArray: () => [] };
      }
      // Swallow ATTACH statements
      if (/^\s*ATTACH/i.test(sql)) {
        return { toArray: () => [] };
      }
      // Return predictable rows for SELECT in tests
      if (/FROM\s+capitals/i.test(sql)) {
        return {
          toArray: () => [{ Initial: 'A', StateName: 'Alabama', CapitalCity: 'Montgomery' }],
        };
      }
      if (/FROM\s+cities/i.test(sql)) {
        return {
          toArray: () => [{ State: 'CA', City: 'Los Angeles', Year: 2014, Population: 100 }],
        };
      }
      if (/FROM\s+numbers/i.test(sql)) {
        return {
          toArray: () => [
            { A: 1, B: 2 },
            { A: 3, B: 4 },
          ],
        };
      }
      if (/FROM\s+stats\.numbers/i.test(sql)) {
        return {
          toArray: () => [
            { A: 10, B: 20 },
          ],
        };
      }
      // Fallback single row
      return { toArray: () => [{ A: 1, B: 2 }] };
    },
  };
  return {
    getJsDelivrBundles: () => ({}),
    selectBundle: async (x) => x,
    createWorker: async () => ({}),
    create: async () => db,
    DuckDBDataProtocol: { HTTP: 0 },
  };
});

describe('ReactDashboardCSV', () => {
  it('renders view titles and tables from datasets and views', async () => {
    render(
      <ReactDashboardCSV
        datasets={{
          capitals: { csvString: 'state,capital\nAlabama,Montgomery' },
          cities: { csvString: 'City,State,Population,lat,lon,year\nLos Angeles,CA,100,0,0,2014' },
        }}
        views={{
          byInitial: {
            title: 'States by Initial',
            sql: 'SELECT substr(state,1,1) AS Initial, state AS StateName, capital AS CapitalCity FROM capitals',
          },
          topCities: {
            title: 'Top Cities',
            sql: 'SELECT City AS City, State, year AS Year, Population FROM cities',
          },
        }}
      />
    );

    // Titles visible
    expect(await screen.findByText('States by Initial', {}, { timeout: 2000 })).toBeInTheDocument();
    expect(screen.getByText('Top Cities', { timeout: 2000 })).toBeInTheDocument();

    // Data from the rendered tables appears
    await screen.findByText('Montgomery', {}, { timeout: 2000 });
    await screen.findByText('Los Angeles', {}, { timeout: 2000 });
  });

  it('preserves theme across collapse/expand', async () => {
    render(
      <ReactDashboardCSV
        datasets={{ sample: { csvString: 'a,b\n1,2' } }}
        views={{
          sampleView: {
            title: 'Sample View',
            sql: 'SELECT A, B FROM sample',
            props: { defaultSettings: JSON.stringify({ version: '0.1', theme: 'lite' }) },
          },
        }}
      />
    );

    // Wait for table to render
    await screen.findByText('Sample View', {}, { timeout: 2000 });
    await screen.findByText('2', {}, { timeout: 2000 });

    // Enter customize -> settings -> change theme
    fireEvent.click(screen.getByTitle('Toggle customize mode'));
    fireEvent.click(screen.getAllByTitle('Customize this column')[0]);
    fireEvent.click(screen.getByText(/Theme:/)); // cycles to dark per theme order

    // Collapse
    fireEvent.click(screen.getByTitle('Collapse'));

    // Expand
    fireEvent.click(screen.getByTitle('Expand'));

    // Still shows row text and the wrapper has class for the new theme
    await screen.findByText(/Showing\s+1\s+of\s+1\s+rows/, {}, { timeout: 2000 });

    // Find the header element and walk up to the theme wrapper to assert class includes 'dark'
    const headerEl = screen.getByText('Sample View');
    let node = headerEl.parentElement;
    let foundClass = '';
    while (node) {
      if (node.className && typeof node.className === 'string' && node.className.includes('dark')) {
        foundClass = node.className;
        break;
      }
      node = node.parentElement;
    }
    expect(foundClass).toContain('dark');
  });

  it('respects CSV format options', async () => {
    render(
      <ReactDashboardCSV
        datasets={{
          numbers: {
            csvString: '1|2\n3|4',
            format: { type: 'csv', header: false, separator: '|', columns: ['A', 'B'] },
          },
        }}
        views={{
          nums: { title: 'Nums', sql: 'SELECT A, B FROM numbers' },
        }}
      />
    );

    await screen.findByText('Nums', {}, { timeout: 2000 });
    await screen.findByText('4', {}, { timeout: 2000 });
  });

  it('runs queries against attached databases', async () => {
    render(
      <ReactDashboardCSV
        dbs={{ stats: { dbURL: 'https://example.com/stats.duckdb' } }}
        views={{
          statsView: { title: 'Stats View', sql: 'SELECT A, B FROM stats.numbers' },
        }}
      />
    );

    await screen.findByText('Stats View', {}, { timeout: 2000 });
    await screen.findByText('20', {}, { timeout: 2000 });
  });

  it('uses a shared DuckDB container', async () => {
    const Wrapper = () => {
      const container = useDuckDB();
      return (
        <ReactDashboardCSV
          dbContainer={container}
          views={{
            statsView: { title: 'Stats View', sql: 'SELECT A, B FROM stats.numbers' },
          }}
        />
      );
    };

    render(
      <ReactDuckDBContainer dbs={{ stats: { dbURL: 'https://example.com/stats.duckdb' } }}>
        <Wrapper />
      </ReactDuckDBContainer>
    );

    await screen.findByText('Stats View', {}, { timeout: 2000 });
    await screen.findByText('20', {}, { timeout: 2000 });
  });
});
