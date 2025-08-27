import * as React from 'react';

export interface ReactTableCSVProps {
  csvString?: string | null;
  csvURL?: string | null;
  csvData?: unknown;
  downloadFilename?: string;
  storageKey?: string;
  defaultSettings?: string | null;
  title?: string;
  collapsed?: boolean;
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
  }>;
  views?: Record<string, ReactDashboardCsvView>;
  db?: 'duckdb' | 'none';
}

export const ReactDashboardCSV: React.FC<ReactDashboardCsvProps>;
