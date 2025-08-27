/* eslint-env jest */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReactDashboardCSV from '../ReactDashboardCsv';

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

    // Row/column info from ReactTableCSV appears (1 row, 3 columns for capitals view)
    await waitFor(() => {
      expect(
        screen.getAllByText(/Showing\s+1\s+of\s+1\s+rows/).length
      ).toBeGreaterThanOrEqual(1);
    }, { timeout: 2000 });
  });

  it('preserves theme and settings across collapse/expand and syncs header theme', async () => {
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
    await screen.findByText(/Showing\s+1\s+of\s+1\s+rows/, {}, { timeout: 2000 });

    // Enter customize -> settings -> change theme
    fireEvent.click(screen.getByLabelText('Customize'));
    fireEvent.click(screen.getByText('Settings'));
    fireEvent.click(screen.getByText(/Theme:/)); // cycles to dark per theme order

    // Collapse
    fireEvent.click(screen.getByText('Collapse'));

    // Expand
    fireEvent.click(screen.getByText('Expand'));

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
});
