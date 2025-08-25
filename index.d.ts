import * as React from 'react';

export interface ReactTableCSVProps {
  csvString?: string | null;
  csvURL?: string | null;
  csvData?: unknown;
  downloadFilename?: string;
  storageKey?: string;
  defaultSettings?: string | null;
}

export const ReactTableCSV: React.FC<ReactTableCSVProps>;

export interface ReactDashboardCsvTable {
  id: string;
  sql: string;
  props?: ReactTableCSVProps;
}

export interface ReactDashboardCsvProps {
  csvUrls: string[];
  tables: ReactDashboardCsvTable[];
}

export const ReactDashboardCSV: React.FC<ReactDashboardCsvProps>;
