import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import useCsvData from './hooks/useCsvData';
import { Filter, X, Download, Copy, RefreshCw, Settings as SettingsIcon } from 'lucide-react';
import styles from './ReactTableCsv.module.css';
import SettingsPanel from './components/SettingsPanel';
import DataTable from './components/DataTable';

const SETTINGS_VERSION = '0.1';
const THEMES = ['lite', 'dark', 'solarized', 'dracula', 'monokai', 'gruvbox'];

const ReactTableCSV = ({ csvString, csvURL, csvData, downloadFilename = 'data.csv', storageKey = 'react-table-csv-key', defaultSettings = '' }) => {
  const { originalHeaders, data, error } = useCsvData({ csvString, csvURL, csvData });
  const [currentTheme, setCurrentTheme] = useState('lite');

  const cycleTheme = () => {
    const idx = THEMES.indexOf(currentTheme);
    const next = THEMES[(idx + 1) % THEMES.length];
    setCurrentTheme(next);
  };

  // State management
  // Per-column sorting is configured via columnStyles[col].sort:
  // 'none' | 'up' | 'down' | 'up numbers' | 'down numbers'
  const [filters, setFilters] = useState({});
  const [showFilterRow, setShowFilterRow] = useState(false);
  const [columnStyles, setColumnStyles] = useState({});
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [filterMode, setFilterMode] = useState({}); // 'text' or 'dropdown' for each column
  const [dropdownFilters, setDropdownFilters] = useState({}); // Set of selected values for dropdown filters
  const [columnOrder, setColumnOrder] = useState([]);
  const [hiddenColumns, setHiddenColumns] = useState(new Set());
  const [pinnedAnchor, setPinnedAnchor] = useState(null); // header name up to which columns are pinned
  const [showRowNumbers, setShowRowNumbers] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [tableState, setTableState] = useState({ visibleHeaders: [], rows: [] });
  const defaultSettingsObj = useMemo(() => {
    try {
      if (!defaultSettings) return null;
      const parsed = JSON.parse(defaultSettings);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }, [defaultSettings]);

  useEffect(() => {
    setColumnOrder(originalHeaders);
  }, [originalHeaders]);

  const pinnedIndex = useMemo(() => {
    if (!pinnedAnchor) return -1;
    return tableState.visibleHeaders.indexOf(pinnedAnchor);
  }, [pinnedAnchor, tableState.visibleHeaders]);

  // Toggle column visibility
  const toggleColumnVisibility = (column) => {
    const newHidden = new Set(hiddenColumns);
    if (newHidden.has(column)) {
      newHidden.delete(column);
    } else {
      newHidden.add(column);
    }
    setHiddenColumns(newHidden);
  };
  // Style management
  const updateColumnStyle = (column, styleType, value) => {
    setColumnStyles(prev => ({
      ...prev,
      [column]: {
        ...prev[column],
        [styleType]: value
      }
    }));
  };

  // Clear filters -> reset to defaults if provided, otherwise blank
  const clearAllFilters = () => {
    if (
      defaultSettingsObj &&
      (defaultSettingsObj.filters ||
        defaultSettingsObj.dropdownFilters ||
        defaultSettingsObj.filterMode != null)
    ) {
      const ds = defaultSettingsObj;
      setFilters(ds.filters || {});
      if (ds.dropdownFilters && typeof ds.dropdownFilters === 'object') {
        const obj = {};
        Object.entries(ds.dropdownFilters).forEach(([k, arr]) => {
          if (Array.isArray(arr)) obj[k] = new Set(arr);
        });
        setDropdownFilters(obj);
      } else {
        setDropdownFilters({});
      }
      if (ds.filterMode) {
        setFilterMode(ds.filterMode);
      } else {
        setFilterMode({});
      }
      if (typeof ds.showFilterRow === 'boolean') {
        setShowFilterRow(ds.showFilterRow);
      } else {
        setShowFilterRow(false);
      }
    } else {
      setFilters({});
      setDropdownFilters({});
      setFilterMode({});
      setShowFilterRow(false);
    }
  };


  // Settings (export/import + autosave to localStorage)
  // Avoid overwriting stored settings with initial empty state during first mount.
  const settingsRestoredRef = useRef(false);
  const buildSettings = useCallback(() => {
    const dropdown = {};
    Object.entries(dropdownFilters).forEach(([k, v]) => {
      dropdown[k] = Array.from(v || []);
    });
    return {
      version: SETTINGS_VERSION,
      theme: currentTheme,
      columnStyles,
      columnOrder,
      hiddenColumns: Array.from(hiddenColumns),
      filters,
      dropdownFilters: dropdown,
      filterMode,
      showFilterRow,
      pinnedAnchor,
      showRowNumbers,
      customize: customize,
    };
  }, [columnStyles, columnOrder, hiddenColumns, filters, dropdownFilters, filterMode, showFilterRow, pinnedAnchor, showRowNumbers, customize, currentTheme]);

  const applySettings = useCallback((s) => {
    try {
      if (!s || typeof s !== 'object') return;
      if (s.columnStyles) setColumnStyles(s.columnStyles);
      if (Array.isArray(s.columnOrder)) setColumnOrder(s.columnOrder.filter(h => originalHeaders.includes(h)));
      if (Array.isArray(s.hiddenColumns)) setHiddenColumns(new Set(s.hiddenColumns.filter(h => originalHeaders.includes(h))));
      if (s.filters && typeof s.filters === 'object') setFilters(s.filters);
      if (s.dropdownFilters && typeof s.dropdownFilters === 'object') {
        const obj = {};
        Object.entries(s.dropdownFilters).forEach(([k, arr]) => {
          if (Array.isArray(arr)) obj[k] = new Set(arr);
        });
        setDropdownFilters(obj);
      }
      if (s.filterMode && typeof s.filterMode === 'object') setFilterMode(s.filterMode);
      if (typeof s.showFilterRow === 'boolean') setShowFilterRow(s.showFilterRow);
      if (typeof s.pinnedAnchor === 'string' || s.pinnedAnchor === null) setPinnedAnchor(s.pinnedAnchor);
      if (typeof s.showRowNumbers === 'boolean') setShowRowNumbers(s.showRowNumbers);
      if (typeof s.customize === 'boolean') setCustomize(s.customize);
      if (typeof s.theme === 'string') setCurrentTheme(s.theme);
      // backward-compat: older settings may use `editable`
      if (typeof s.editable === 'boolean' && typeof s.customize !== 'boolean') setCustomize(s.editable);
    } catch {
      // ignore
    }
  }, [originalHeaders]);

  // Restore settings only after headers are known, and only once
  useEffect(() => {
    if (settingsRestoredRef.current) return;
    if (!originalHeaders || originalHeaders.length === 0) return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        applySettings(parsed);
      } else if (defaultSettingsObj) {
        applySettings(defaultSettingsObj);
      }
    } catch {
      if (defaultSettingsObj) {
        applySettings(defaultSettingsObj);
      }
    } finally {
      settingsRestoredRef.current = true;
    }
  }, [originalHeaders, storageKey, applySettings, defaultSettingsObj]);

  useEffect(() => {
    // autosave as soon as possible on changes (after initial restore)
    if (!settingsRestoredRef.current) return;
    try {
      const s = buildSettings();
      const json = JSON.stringify(s);
      window.localStorage.setItem(storageKey, json);
    } catch {
      // ignore
    }
  }, [
    // track all settings inputs explicitly to guarantee save triggers
    columnStyles,
    columnOrder,
    hiddenColumns,
    filters,
    dropdownFilters,
    filterMode,
    showFilterRow,
    pinnedAnchor,
    showRowNumbers,
    customize,
    currentTheme,
    storageKey,
    buildSettings,
  ]);

  const handleResetSettings = () => {
    if (defaultSettingsObj) {
      applySettings(defaultSettingsObj);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(defaultSettingsObj));
      } catch { /* ignore */ }
    } else {
      // fall back to clearing all to baseline defaults
      setColumnStyles({});
      setColumnOrder(originalHeaders);
      setHiddenColumns(new Set());
      setFilters({});
      setDropdownFilters({});
      setFilterMode({});
      setShowFilterRow(false);
      setPinnedAnchor(null);
      setShowRowNumbers(false);
      setCurrentTheme('lite');
      try { window.localStorage.removeItem(storageKey); } catch { /* ignore */ }
    }
  };

  const buildCsv = () => {
    if (!tableState.visibleHeaders.length) return null;
    const exportRows = tableState.rows.map((row) => {
      const o = {};
      tableState.visibleHeaders.forEach((h) => { o[h] = row[h]; });
      return o;
    });
    const csv = Papa.unparse(exportRows, {
      header: true,
      columns: tableState.visibleHeaders,
      delimiter: ',',
      newline: '\r\n',
    });
    return '\ufeff' + csv;
  };

  const buildMarkdown = () => {
    if (!tableState.visibleHeaders.length) return null;
    const header = `| ${tableState.visibleHeaders.join(' | ')} |`;
    const separator = `| ${tableState.visibleHeaders.map(() => '---').join(' | ')} |`;
    const body = tableState.rows.map(row => {
      const cells = tableState.visibleHeaders.map(h => {
        const v = row[h] == null ? '' : String(row[h]);
        return v.replace(/\|/g, '\\|');
      });
      return `| ${cells.join(' | ')} |`;
    });
    return [header, separator, ...body].join('\n');
  };

  const handleDownload = () => {
    const csv = buildCsv();
    if (!csv) return;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = downloadFilename || 'data.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyCsv = () => {
    const csv = buildCsv();
    if (!csv) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(csv).catch(() => { /* ignore clipboard error */ });
    }
  };

  const handleCopyMarkdown = () => {
    const md = buildMarkdown();
    if (!md) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(md).catch(() => { /* ignore clipboard error */ });
    }
  };

  const handleCopyUrl = () => {
    try {
      const json = JSON.stringify(buildSettings());
      const url = new URL(window.location.href);
      url.searchParams.set('defaultSetting', json);
      const str = url.toString();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(str).catch(() => { /* ignore clipboard error */ });
      }
    } catch { /* ignore */ }
  };

  // Computed editable flag used across UI
  const isCustomize = customize;

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className={`${styles.root} ${styles[currentTheme] || styles.lite}`}>
      <div className={styles.container}>
        <div className={styles.card}>
          {/* <div className={styles.header}>
            <h2 className={styles.title}>React Table CSV</h2>
            <p className={styles.subtitle}>Interactive CSV Data Viewer with Advanced Filtering, Sorting & Column Management</p>
          </div> */}

            <div className={styles.controls}>
              <div className={styles.controlsLeft}>
                {isCustomize && (
                  <>
                    <button
                      onClick={() => setShowFilterRow(!showFilterRow)}
                      className={`${styles.btn} ${showFilterRow ? styles.btnPrimaryActive : styles.btnSecondary}`}
                    >
                      <Filter size={18} />
                      {showFilterRow ? 'Hide Filters' : 'Show Filters'}
                    </button>

                    <button onClick={clearAllFilters} className={`${styles.btn} ${styles.btnSecondary}`}>
                      <X size={18} />
                      Reset Filters
                    </button>

                <button
                  onClick={() => setShowStylePanel(!showStylePanel)}
                  className={`${styles.btn} ${showStylePanel ? styles.btnAccentActive : styles.btnSecondary}`}
                >
                  <SettingsIcon size={18} />
                  {showStylePanel ? 'Hide Settings' : 'Settings'}
                </button>

                    <button onClick={handleResetSettings} className={`${styles.btn} ${styles.btnSecondary}`} title="Reset all settings to defaults">
                      <RefreshCw size={18} />
                      Reset Settings
                    </button>

                    <button onClick={handleCopyUrl} className={`${styles.btn} ${styles.btnSecondary}`} title="Copy URL with current settings">
                      Copy URL
                    </button>
                  </>
                )}

                <button onClick={handleCopyMarkdown} className={`${styles.btn} ${styles.btnSecondary}`} title="Copy current view as Markdown">
                  <Copy size={18} />
                  Copy Markdown
                </button>

                <button onClick={handleCopyCsv} className={`${styles.btn} ${styles.btnSecondary}`} title="Copy current view as CSV">
                  <Copy size={18} />
                  Copy CSV
                </button>

                <button onClick={handleDownload} className={`${styles.btn} ${styles.btnSecondary}`} title="Download current view as CSV">
                  <Download size={18} />
                  Download CSV
                </button>

                <label className={styles.checkboxRow} title="Toggle customize mode">
                  <input
                    type="checkbox"
                    checked={customize}
                    onChange={(e) => setCustomize(e.target.checked)}
                  />
                  <span>Customize</span>
                </label>
              </div>

            <div className={styles.info}>
              Showing {tableState.rows.length} of {data.length} rows | {tableState.visibleHeaders.length} of {originalHeaders.length} columns
            </div>
          </div>

          <SettingsPanel
            showStylePanel={showStylePanel}
            selectedColumn={selectedColumn}
            columnStyles={columnStyles}
            setSelectedColumn={setSelectedColumn}
            updateColumnStyle={updateColumnStyle}
            hiddenColumns={hiddenColumns}
            toggleColumnVisibility={toggleColumnVisibility}
            pinnedAnchor={pinnedAnchor}
            setPinnedAnchor={setPinnedAnchor}
            visibleHeaders={tableState.visibleHeaders}
            pinnedIndex={pinnedIndex}
            cycleTheme={cycleTheme}
            currentTheme={currentTheme}
            originalHeaders={originalHeaders}
            showRowNumbers={showRowNumbers}
            setShowRowNumbers={setShowRowNumbers}
            buildSettings={buildSettings}
            applySettings={applySettings}
            storageKey={storageKey}
          />

          {/* Table */}
          <DataTable
            data={data}
            originalHeaders={originalHeaders}
            columnStyles={columnStyles}
            columnOrder={columnOrder}
            setColumnOrder={setColumnOrder}
            hiddenColumns={hiddenColumns}
            filters={filters}
            setFilters={setFilters}
            filterMode={filterMode}
            setFilterMode={setFilterMode}
            dropdownFilters={dropdownFilters}
            setDropdownFilters={setDropdownFilters}
            showFilterRow={showFilterRow}
            showRowNumbers={showRowNumbers}
            isCustomize={isCustomize}
            selectedColumn={selectedColumn}
            setSelectedColumn={setSelectedColumn}
            showStylePanel={showStylePanel}
            setShowStylePanel={setShowStylePanel}
            updateColumnStyle={updateColumnStyle}
            toggleColumnVisibility={toggleColumnVisibility}
            pinnedAnchor={pinnedAnchor}
            setPinnedAnchor={setPinnedAnchor}
            onDataProcessed={setTableState}
          />
        </div>
      </div>
    </div>
  );
};

export default ReactTableCSV;
