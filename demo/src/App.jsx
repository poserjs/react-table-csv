import './App.css'

import { ReactTableCSV } from "@poserjs/react-table-csv";
import { sampleCSV } from "./sample-csv";


function App() {
  const sampleSettings = '{"version":"0.1","theme":"dark","columnStyles":{"Department":{"splitBy":true,"type":"number"},"Position":{"groupBy":true},"Name":{"reducer":"cnt"},"Salary":{"reducer":"min-max","type":"number"},"Start Date":{"reducer":"min-max"},"Performance Rating":{"reducer":"min-max"}},"columnOrder":["Department","Position","Name","Salary","Start Date","Performance Rating"],"hiddenColumns":["Department"],"filters":{"Salary":">60000","Position":""},"dropdownFilters":{},"filterMode":{"Salary":"text"},"showFilterRow":false,"pinnedAnchor":null,"showRowNumbers":true}';

  return (
    <>
      <h1>@poserjs/react-table-csv</h1>
      <div>
        <ReactTableCSV csvString={sampleCSV} defaultSettings={sampleSettings}/>
      </div>
    </>
  )
}

export default App
