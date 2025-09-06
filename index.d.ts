import * as React from 'react';

export interface ReactTableCSVProps {
  csvString?: string | null;
  csvURL?: string | null;
  csvData?: unknown;
  downloadFilename?: string;
  storageKey?: string;
  defaultSettings?: string | Record<string, any> | null;
  title?: string;
  collapsed?: boolean;
  maxWidth?: string;
  maxHeight?: string;
  fontSize?: number;
}

export const ReactTableCSV: React.FC<ReactTableCSVProps>;

export interface ReactDashboardCsvView {
  title?: string;
  sql?: string;
  dataset?: string;
  props?: ReactTableCSVProps;
  collapsed?: boolean;
}

export interface ReactDashboardCsvProps {
  datasets?: Record<string, {
    title?: string;
    csvURL?: string | null;     // remote URL to CSV
    csvString?: string | null;  // raw CSV string
    csvData?: unknown;          // pre-parsed object with {headers,data} or Papa result
    format?: {
      type?: 'csv' | 'json';
      header?: boolean;
      separator?: string;
      escape?: string;
      columns?: string[];
    };
  }>;
  dbs?: Record<string, {
    title?: string;
    dbURL: string;             // remote URL to a DuckDB database file
  }>;
  views?: Record<string, ReactDashboardCsvView>;
  db?: 'duckdb' | 'none';
  /**
   * Layout rows as counts of tables per HTML table row.
   * Example: [2, 1, 3] -> first row has 2 tables, second row 1, third row 3.
   * If omitted, defaults to 1 table per row. Extra views beyond the array
   * are also rendered one per row.
   */
  layout?: number[];
}

export const ReactDashboardCSV: React.FC<ReactDashboardCsvProps>;
