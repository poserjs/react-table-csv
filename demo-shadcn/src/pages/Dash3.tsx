import React from 'react'
import { ReactDashboardCSV, DuckDBContainerState } from '@poserjs/react-table-csv'

interface Props {
  dbContainer: DuckDBContainerState
}

const Dash3: React.FC<Props> = ({ dbContainer }) => (
  <div className="space-y-4">
    <h2 className="text-lg font-semibold">DuckDB Shared · Page 1</h2>
    <ReactDashboardCSV
      layout={[2]}
      dbContainer={dbContainer}
      views={{
        'from-db-capitals': {
          title: 'DB: State Capitals',
          sql: 'SELECT * FROM cities.capitals',
          props: {
            defaultSettings: { version: '0.1', theme: 'lite', showFilterRow: true, showRowNumbers: true, tableMaxHeight: '100vh', tableMaxWidth: '100vh' },
            downloadFilename: 'state-capitals.csv'
          }
        },
        'from-db-cities': {
          title: 'DB: Cities (multi-year)',
          sql: 'SELECT * FROM cities.cities',
          props: {
            defaultSettings: { version: '0.1', theme: 'lite', showFilterRow: true, showRowNumbers: true, tableMaxHeight: '100vh', tableMaxWidth: '100vh' },
            downloadFilename: 'cities.csv'
          }
        }
      }}
    />
  </div>
)

export default Dash3

