import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import useCsvData from './hooks/useCsvData';
import useTableState from './hooks/useTableState';
import Toolbar from './components/Toolbar';
import SettingsPanel from './components/SettingsPanel';
import DataTable from './components/DataTable';
import styles from './ReactTableCsv.module.css';
import { Filter, Settings as SettingsIcon, Plus, Minus } from 'lucide-react';

const ReactTableCSV = ({
  csvString,
  csvURL,
  csvData,
  downloadFilename = 'data.csv',
  storageKey = 'react-table-csv-key',
  defaultSettings = '',
  title,
  collapsed: collapsedProp = false,
  maxHeight = 'unlimited',
  maxWidth = 'unlimited',
  fontSize: fontSizeProp = 13,
}) => {
  const { originalHeaders, data, error } = useCsvData({ csvString, csvURL, csvData });
  const [customize, setCustomize] = useState(false);
  const [collapsed, setCollapsed] = useState(!!collapsedProp);

  // Sync internal collapsed state when prop changes
  useEffect(() => { setCollapsed(!!collapsedProp); }, [collapsedProp]);

  const table = useTableState({
    originalHeaders,
    storageKey,
    defaultSettings,
    customize,
    setCustomize,
    defaultMaxHeight: maxHeight,
    defaultMaxWidth: maxWidth,
    defaultFontSize: fontSizeProp,
  });

  // Auto-sync Settings panel visibility with customize mode
  useEffect(() => {
    try { table.setShowStylePanel(!!customize); } catch { /* ignore */ }
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
  const tableBody = (
    <>
      {!title && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 8 }}>
          <button
            onClick={() => table.setShowFilterRow(!table.showFilterRow)}
            className={`${styles.iconBtn} ${styles.headerBtn} ${table.showFilterRow ? styles.iconBtnActive : ''}`}
            title={table.showFilterRow ? 'Hide Filters' : 'Show Filters'}
          >
            <Filter size={16} />
          </button>
          <button
            onClick={() => setCustomize((c) => !c)}
            className={`${styles.iconBtn} ${styles.headerBtn} ${customize ? styles.iconBtnActive : ''}`}
            title="Toggle customize mode"
          >
            <SettingsIcon size={16} />
          </button>
        </div>
      )}

      {customize && (
        <Toolbar
          {...table}
          tableState={table.tableState}
          dataCount={data.length}
          headersCount={originalHeaders.length}
          handleCopyUrl={handleCopyUrl}
          handleCopyMarkdown={handleCopyMarkdown}
          handleCopyCsv={handleCopyCsv}
          handleDownload={handleDownload}
        />
      )}

      <SettingsPanel
        {...table}
        visibleHeaders={table.tableState.visibleHeaders}
        originalHeaders={originalHeaders}
        data={data}
        storageKey={storageKey}
      />

      <DataTable
        {...table}
        data={data}
        originalHeaders={originalHeaders}
        isCustomize={customize}
        onDataProcessed={table.setTableState}
      />
    </>
  );

  if (!title) {
    return (
      <div
        className={`${styles.root} ${styles[table.currentTheme] || styles.lite}`}
        style={{
          ...(table.tableMaxHeight === 'unlimited' ? { minHeight: '100vh' } : {}),
          ...(table.tableMaxWidth !== 'unlimited' ? { maxWidth: table.tableMaxWidth, margin: '0 auto' } : {}),
          minWidth: '320px',
        }}
      >
        <div className={styles.container}>
          <div className={styles.card}>{tableBody}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={styles[table.currentTheme] || styles.lite}
      style={{
        marginBottom: 16,
        border: '1px solid var(--border)',
        borderRadius: 6,
        background: 'var(--surface)',
        maxWidth: table.tableMaxWidth === 'unlimited' ? '100%' : table.tableMaxWidth,
        minWidth: '320px',
        overflowX: 'hidden',
        ...(table.tableMaxWidth !== 'unlimited' ? { marginLeft: 'auto', marginRight: 'auto' } : {}),
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'var(--control-bg)',
          borderBottom: '1px solid var(--border)',
          color: 'var(--text)',
        }}
      >
        <div style={{ fontWeight: 600 }}>{title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => table.setShowFilterRow(!table.showFilterRow)}
            className={`${styles.iconBtn} ${styles.headerBtn} ${table.showFilterRow ? styles.iconBtnActive : ''}`}
            title={table.showFilterRow ? 'Hide Filters' : 'Show Filters'}
          >
            <Filter size={16} />
          </button>
          <button
            onClick={() => setCustomize((c) => !c)}
            className={`${styles.iconBtn} ${styles.headerBtn} ${customize ? styles.iconBtnActive : ''}`}
            title="Toggle customize mode"
          >
            <SettingsIcon size={16} />
          </button>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={`${styles.iconBtn} ${styles.headerBtn}`}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <Plus size={16} /> : <Minus size={16} />}
          </button>
        </div>
      </div>
      <div style={{ padding: 8, display: collapsed ? 'none' : 'block', maxWidth: '100%', minWidth: '320px', overflowX: 'hidden' }}>
        <div className={styles.root} style={{ minHeight: 0 }}>
          <div className={styles.container}>
            <div className={styles.card}>{tableBody}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReactTableCSV;
