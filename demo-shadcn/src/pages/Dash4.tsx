import React from 'react'
import { ReactDashboardCSV, DuckDBContainerState } from '@poserjs/react-table-csv'

interface Props {
  dbContainer: DuckDBContainerState
}

const Dash4: React.FC<Props> = ({ dbContainer }) => (
  <div className="space-y-4">
    <h2 className="text-lg font-semibold">DuckDB Shared · Page 2</h2>
    <ReactDashboardCSV
      layout={[1]}
      dbContainer={dbContainer}
      views={{
        'from-db-demographics': {
          title: 'DB: Cities Demographics',
          sql: 'SELECT * FROM cities.demographics',
          props: {
            defaultSettings: { version: '0.1', theme: 'lite', showFilterRow: true, showRowNumbers: true, tableMaxHeight: '100vh', tableMaxWidth: '100vh' },
            downloadFilename: 'cities-demographics.csv'
          }
        }
      }}
    />
  </div>
)

export default Dash4

