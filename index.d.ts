import * as React from 'react';

export interface ReactTableCSVProps {
  csvString?: string | null;
  csvURL?: string | null;
  csvData?: unknown;
  downloadFilename?: string;
  storageKey?: string;
  defaultSettings?: string | null;
  theme?: 'lite' | 'dark' | 'solarized' | 'dracula' | 'monokai' | 'gruvbox';
}

export const ReactTableCSV: React.FC<ReactTableCSVProps>;
