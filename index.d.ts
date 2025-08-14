import * as React from 'react';

export interface ReactTableCSVProps {
  csvString?: string | null;
  csvURL?: string | null;
  csvData?: unknown;
  downloadFilename?: string;
  storageKey?: string;
  defaultSettings?: string | null;
  theme?: string;
}

export const ReactTableCSV: React.FC<ReactTableCSVProps>;
