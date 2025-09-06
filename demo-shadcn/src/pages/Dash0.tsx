import React from 'react'
import { ReactTableCSV } from '@poserjs/react-table-csv'
import { sampleCSV } from '../data/sample-csv'
import { localJsonData } from '../data/sample-json'

const Dash0: React.FC = () => (
  <div className="space-y-4">
    <h2 className="text-lg font-semibold">Quick Start: Local CSV and JSON</h2>
    <ReactTableCSV
      title="Local CSV (inline string)"
      csvString={sampleCSV}
      storageKey="demo-shadcn-dash0-csv"
      defaultSettings={{ version: '0.1', theme: 'lite', showFilterRow: true, showRowNumbers: true }}
    />
    <ReactTableCSV
      title="Local JSON (headers + data)"
      csvData={localJsonData}
      storageKey="demo-shadcn-dash0-json"
      defaultSettings={{ version: '0.1', theme: 'dark', showFilterRow: false, showRowNumbers: true }}
    />
  </div>
)

export default Dash0

