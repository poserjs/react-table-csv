import React from 'react';
import { X, Download, Copy, RefreshCw, Settings as SettingsIcon } from 'lucide-react';
import styles from '../ReactTableCsv.module.css';

const Toolbar = ({
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
        <button onClick={clearAllFilters} className={styles.btn}>
          <X size={18} />
          Reset Filters
        </button>

        <button
          onClick={() => setShowStylePanel(!showStylePanel)}
          className={`${styles.btn} ${showStylePanel ? styles.btnAccentActive : ''}`}
        >
          <SettingsIcon size={18} />
          {showStylePanel ? 'Hide Settings' : 'Settings'}
        </button>

        <button onClick={resetSettings} className={styles.btn} title="Reset all settings to defaults">
          <RefreshCw size={18} />
          Reset Settings
        </button>

        <button onClick={handleCopyUrl} className={styles.btn} title="Copy URL with current settings">
          Copy URL
        </button>

        <button onClick={handleCopyMarkdown} className={styles.btn} title="Copy current view as Markdown">
          <Copy size={18} />
          Copy Markdown
        </button>

        <button onClick={handleCopyCsv} className={styles.btn} title="Copy current view as CSV">
          <Copy size={18} />
          Copy CSV
        </button>

        <button onClick={handleDownload} className={styles.btn} title="Download current view as CSV">
          <Download size={18} />
          Download CSV
        </button>
      </div>

      <div className={styles.info}>
        Showing {tableState.rows.length} of {dataCount} rows | {tableState.visibleHeaders.length} of {headersCount} columns
      </div>
    </div>
  );
};

export default Toolbar;

