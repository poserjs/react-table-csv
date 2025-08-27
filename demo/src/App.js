import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import './App.css';
import { ReactTableCSV, ReactDashboardCSV } from '@poserjs/react-table-csv';
import { sampleCSV } from './sample-csv';
const App = () => {
    const sampleSettings = '{"version":"0.1","theme":"dark","columnStyles":{"Department":{"splitBy":true,"type":"number"},"Position":{"groupBy":true},"Name":{"reducer":"cnt"},"Salary":{"reducer":"min-max","type":"number"},"Start Date":{"reducer":"min-max"},"Performance Rating":{"reducer":"min-max"}},"columnOrder":["Department","Position","Name","Salary","Start Date","Performance Rating"],"hiddenColumns":["Department"],"filters":{"Salary":">60000","Position":""},"dropdownFilters":{},"filterMode":{"Salary":"text"},"showFilterRow":false,"pinnedAnchor":null,"showRowNumbers":true}';
    return (_jsxs(_Fragment, { children: [_jsx("h1", { children: "@poserjs/react-table-csv" }), _jsx("div", { children: _jsx(ReactTableCSV, { csvString: sampleCSV, defaultSettings: sampleSettings }) }), _jsx("h2", { style: { marginTop: 24 }, children: "Dashboard Demo" }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: '1fr', gap: 16 }, children: _jsx(ReactDashboardCSV, { datasets: {
                        capitals: { title: 'US State Capitals', csvURL: 'http://localhost:5173/us-state-capitals.csv' },
                        cities: { title: 'US Top 1k Cities (multi-year)', csvURL: 'http://localhost:5173/us-cities-top-1k-multi-year.csv' },
                    }, views: {
                        'by-initial': {
                            title: 'States by Initial',
                            collapsed: false,
                            sql: `SELECT substr(t.state, 1, 1) AS Initial, t.state AS StateName, t.capital AS CapitalCity FROM capitals AS t ORDER BY 1 ASC, 2 ASC`,
                            props: {
                                defaultSettings: JSON.stringify({
                                    version: '0.1',
                                    theme: 'dark',
                                    columnStyles: {
                                        Initial: { groupBy: true },
                                        StateName: { reducer: 'cnt' },
                                    },
                                    columnOrder: ['Initial', 'StateName', 'CapitalCity'],
                                    filters: {},
                                    showRowNumbers: true,
                                }),
                                downloadFilename: 'us-state-capitals-by-initial.csv',
                            },
                        },
                        'n-states-sorted': {
                            title: "States starting with 'N'",
                            collapsed: true,
                            sql: `SELECT t.state AS StateName, t.capital AS CapitalCity, length(t.capital) AS CapitalLength, substr(t.capital,1,1) AS CapitalInitial FROM capitals AS t WHERE t.state LIKE 'N%' ORDER BY 3 DESC, 2 ASC`,
                            props: {
                                defaultSettings: JSON.stringify({
                                    version: '0.1',
                                    theme: 'lite',
                                    columnStyles: {
                                        CapitalInitial: { groupBy: true },
                                        CapitalLength: { type: 'number' },
                                    },
                                    columnOrder: ['CapitalInitial', 'StateName', 'CapitalCity', 'CapitalLength'],
                                    showFilterRow: true,
                                    filters: { StateName: 'N' },
                                    showRowNumbers: false,
                                }),
                                downloadFilename: 'n-states-capitals.csv',
                            },
                        },
                        'top-cities-2014': {
                            title: 'Top US Cities by Population (2014)',
                            collapsed: false,
                            sql: `SELECT c.State AS State, c.City AS City, c.year AS Year, c.Population AS Population FROM cities AS c WHERE c.year = 2014 ORDER BY c.Population DESC LIMIT 15`,
                            props: {
                                defaultSettings: JSON.stringify({
                                    version: '0.1',
                                    theme: 'lite',
                                    columnStyles: {
                                        Population: { type: 'number', numFormat: 'thousand' },
                                        Year: { type: 'number' },
                                    },
                                    columnOrder: ['State', 'City', 'Population', 'Year'],
                                    showFilterRow: true,
                                    showRowNumbers: true,
                                }),
                                downloadFilename: 'top-us-cities-2014.csv',
                            },
                        },
                    } }) }), _jsx("h2", { style: { marginTop: 24 }, children: "Dashboard NoSql Demo" }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: '1fr', gap: 16 }, children: _jsx(ReactDashboardCSV, { db: "none", datasets: {
                        capitals: { title: 'US State Capitals', csvURL: 'http://localhost:5173/us-state-capitals.csv' },
                        cities: { title: 'US Top 1k Cities (multi-year)', csvURL: 'http://localhost:5173/us-cities-top-1k-multi-year.csv' },
                    }, views: {
                        'capitals-all': {
                            title: 'All State Capitals',
                            collapsed: false,
                            dataset: 'capitals', // shows all rows/columns from this dataset
                        },
                        'cities-all': {
                            title: 'All Cities',
                            collapsed: false,
                            dataset: 'cities',
                        },
                    } }) })] }));
};
export default App;
