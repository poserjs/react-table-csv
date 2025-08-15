import React from 'react';
import { Filter, X, Download, Copy, RefreshCw, Settings as SettingsIcon } from 'lucide-react';
import styles from '../ReactTableCsv.module.css';

const Toolbar = ({
  customize,
  setCustomize,
  showFilterRow,
  setShowFilterRow,
  clearAllFilters,
  showStylePanel,
  setShowStylePanel,
  resetSettings,
  handleCopyUrl,
  handleCopyMarkdown,
  handleCopyCsv,
  handleDownload,
  tableState,
  dataCount,
  headersCount,
}) => {
  return (
    <div className={styles.controls}>
      <div className={styles.controlsLeft}>
        {customize && (
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

            <button onClick={resetSettings} className={`${styles.btn} ${styles.btnSecondary}`} title="Reset all settings to defaults">
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
          <input type="checkbox" checked={customize} onChange={(e) => setCustomize(e.target.checked)} />
          <span>Customize</span>
        </label>
      </div>

      <div className={styles.info}>
        Showing {tableState.rows.length} of {dataCount} rows | {tableState.visibleHeaders.length} of {headersCount} columns
      </div>
    </div>
  );
};

export default Toolbar;

