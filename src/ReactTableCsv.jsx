import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import useCsvData from './hooks/useCsvData';
import useTableState from './hooks/useTableState';
import Toolbar from './components/Toolbar';
import SettingsPanel from './components/SettingsPanel';
import DataTable from './components/DataTable';
import styles from './ReactTableCsv.module.css';

const ReactTableCSV = ({
  csvString,
  csvURL,
  csvData,
  downloadFilename = 'data.csv',
  storageKey = 'react-table-csv-key',
  defaultSettings = '',
  onThemeChange,
}) => {
  const { originalHeaders, data, error } = useCsvData({ csvString, csvURL, csvData });
  const [customize, setCustomize] = useState(false);

  const table = useTableState({
    originalHeaders,
    storageKey,
    defaultSettings,
    customize,
    setCustomize,
  });

  // Notify parent (e.g., dashboard) when theme changes to keep wrappers in sync
  // Note: do not depend on onThemeChange reference to avoid render loops
  useEffect(() => {
    if (typeof onThemeChange === 'function') {
      try { onThemeChange(table.currentTheme); } catch { /* ignore */ }
    }
  }, [table.currentTheme]);

  // When leaving customize mode, auto-hide the Settings panel for a clearer UX
  useEffect(() => {
    if (!customize) {
      try { table.setShowStylePanel(false); } catch { /* ignore */ }
    }
  }, [customize]);

  const buildCsv = () => {
    if (!table.tableState.visibleHeaders.length) return null;
    const exportRows = table.tableState.rows.map((row) => {
      const o = {};
      table.tableState.visibleHeaders.forEach((h) => {
        o[h] = row[h];
      });
      return o;
    });
    const csv = Papa.unparse(exportRows, {
      header: true,
      columns: table.tableState.visibleHeaders,
      delimiter: ',',
      newline: '\r\n',
    });
    return '\ufeff' + csv;
  };

  const buildMarkdown = () => {
    if (!table.tableState.visibleHeaders.length) return null;
    const header = `| ${table.tableState.visibleHeaders.join(' | ')} |`;
    const separator = `| ${table.tableState.visibleHeaders.map(() => '---').join(' | ')} |`;
    const body = table.tableState.rows.map((row) => {
      const cells = table.tableState.visibleHeaders.map((h) => {
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
      navigator.clipboard.writeText(csv).catch(() => {});
    }
  };

  const handleCopyMarkdown = () => {
    const md = buildMarkdown();
    if (!md) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(md).catch(() => {});
    }
  };

  const handleCopyUrl = () => {
    try {
      const json = JSON.stringify(table.buildSettings());
      const url = new URL(window.location.href);
      url.searchParams.set('defaultSetting', json);
      const str = url.toString();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(str).catch(() => {});
      }
    } catch { /* ignore */ }
  };

  if (error) {
    const { status, message } = error;
    return <div>{status ? `${status}: ${message}` : message}</div>;
  }

  return (
    <div className={`${styles.root} ${styles[table.currentTheme] || styles.lite}`}>
      <div className={styles.container}>
        <div className={styles.card}>
          <Toolbar
            {...table}
            customize={customize}
            setCustomize={setCustomize}
            tableState={table.tableState}
            dataCount={data.length}
            headersCount={originalHeaders.length}
            handleCopyUrl={handleCopyUrl}
            handleCopyMarkdown={handleCopyMarkdown}
            handleCopyCsv={handleCopyCsv}
            handleDownload={handleDownload}
          />

          <SettingsPanel
            {...table}
            visibleHeaders={table.tableState.visibleHeaders}
            originalHeaders={originalHeaders}
            storageKey={storageKey}
          />

          <DataTable
            {...table}
            data={data}
            originalHeaders={originalHeaders}
            isCustomize={customize}
            onDataProcessed={table.setTableState}
          />
        </div>
      </div>
    </div>
  );
};

export default ReactTableCSV;
