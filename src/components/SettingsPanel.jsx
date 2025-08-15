import React from 'react';
import { Hash, SunMoon, Type, Paintbrush, AlignLeft, AlignCenter, AlignRight, Columns, List, WrapText, Eye, EyeOff, Pin, PinOff, Scissors, X } from 'lucide-react';
import styles from '../ReactTableCsv.module.css';

const SettingsPanel = ({
  showStylePanel,
  selectedColumn,
  columnStyles,
  setSelectedColumn,
  updateColumnStyle,
  hiddenColumns,
  toggleColumnVisibility,
  setPinnedAnchor,
  visibleHeaders,
  pinnedIndex,
  cycleTheme,
  currentTheme,
  originalHeaders,
  showRowNumbers,
  setShowRowNumbers,
  buildSettings,
  applySettings,
  storageKey,
}) => {
  const handleExportSettings = () => {
    try {
      const json = JSON.stringify(buildSettings());
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(json).catch(() => {});
      }
    } catch {
      /* ignore */
    }
  };

  const handleImportSettings = () => {
    const input = window.prompt('Paste settings JSON:');
    if (!input) return;
    try {
      const parsed = JSON.parse(input);
      applySettings(parsed);
      window.localStorage.setItem(storageKey, JSON.stringify(parsed));
    } catch {
      alert('Invalid JSON. Settings not applied.');
    }
  };

  if (!showStylePanel) return null;

  return (
    <div className={styles.stylePanel}>
      <div className={styles.styleSection}>
        <label className={styles.label}>Table Options:</label>
        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={showRowNumbers}
            onChange={(e) => setShowRowNumbers(e.target.checked)}
          />
          <Hash size={16} />
          <span>Show row numbers</span>
        </label>
        <div className={styles.reducerGroup}>
          <button className={styles.btn} onClick={handleExportSettings} title="Copy settings JSON to clipboard">Export settings</button>
          <button className={styles.btn} onClick={handleImportSettings} title="Paste settings JSON to import">Import settings</button>
          <button className={styles.btn} onClick={cycleTheme} title="Cycle table theme">
            <SunMoon size={16} />
            Theme: {currentTheme}
          </button>
        </div>
      </div>

      <div className={styles.styleSection}>
        <label className={styles.label}>Select Column to Style:</label>
        <select
          className={styles.select}
          value={selectedColumn || ''}
          onChange={(e) => setSelectedColumn(e.target.value)}
        >
          <option value="">Choose a column...</option>
          {originalHeaders.map(header => (
            <option key={header} value={header}>
              {header} {hiddenColumns.has(header) ? '(hidden)' : ''}
            </option>
          ))}
        </select>
        {selectedColumn && (
          <span className={styles.positionInfo}>
            Position: #{visibleHeaders.indexOf(selectedColumn) + 1} of {originalHeaders.length}
          </span>
        )}
      </div>

      {selectedColumn && (
        <div className={styles.styleOptions}>
          {/* Line 2: Group/Reducer/Split plus No wrap, Pin, Hide as labeled controls */}
          <div className={styles.headerBottom}>
            <label className={styles.checkboxRow} title="Group by this column">
              <input
                type="checkbox"
                checked={!!columnStyles[selectedColumn]?.groupBy}
                onChange={(e) => updateColumnStyle(selectedColumn, 'groupBy', e.target.checked)}
              />
              <List size={14} />
              <span>Group by this column</span>
            </label>
            {!columnStyles[selectedColumn]?.groupBy && (
              <div className={styles.reducerGroup}>
                <label className={styles.smallLabel}>Reducer:</label>
                <select
                  className={styles.select}
                  value={columnStyles[selectedColumn]?.reducer || 'first'}
                  onChange={(e) => updateColumnStyle(selectedColumn, 'reducer', e.target.value)}
                >
                  <option value="first">first</option>
                  <option value="last">last</option>
                  <option value="cnt">cnt</option>
                  <option value="rowcnt">rowcnt</option>
                  <option value="unique cnt">unique cnt</option>
                  <option value="unique rowcnt">unique rowcnt</option>
                  <option value="sum">sum</option>
                  <option value="avg">avg</option>
                  <option value="min">min</option>
                  <option value="max">max</option>
                  <option value="min-max">min - max</option>
                  <option value="concat">concat</option>
                  <option value="unique concat">unique concat</option>
                </select>
              </div>
            )}
            <label className={styles.checkboxRow} title="Split table by this column">
              <input
                type="checkbox"
                checked={!!columnStyles[selectedColumn]?.splitBy}
                onChange={(e) => updateColumnStyle(selectedColumn, 'splitBy', e.target.checked)}
              />
              <Scissors size={14} />
              <span>Split table by this column</span>
            </label>
            <label className={styles.checkboxRow} title="No wrap">
              <input
                type="checkbox"
                checked={!!columnStyles[selectedColumn]?.noWrap}
                onChange={(e) => updateColumnStyle(selectedColumn, 'noWrap', e.target.checked)}
              />
              <WrapText size={14} />
              <span>No wrap</span>
            </label>
            <label className={styles.checkboxRow} title="Pin up to this column">
              <input
                type="checkbox"
                checked={(() => {
                  const idx = visibleHeaders.indexOf(selectedColumn);
                  return pinnedIndex >= 0 && idx > -1 && idx <= pinnedIndex;
                })()}
                onChange={(e) => {
                  const checked = e.target.checked;
                  const idx = visibleHeaders.indexOf(selectedColumn);
                  if (!checked) {
                    if (idx <= 0) setPinnedAnchor(null); else setPinnedAnchor(visibleHeaders[idx - 1] || null);
                  } else {
                    setPinnedAnchor(selectedColumn);
                  }
                }}
              />
              {(visibleHeaders.indexOf(selectedColumn) <= pinnedIndex && pinnedIndex >= 0) ? <Pin size={14} /> : <PinOff size={14} />}
              <span>Pin up to this column</span>
            </label>
            <label className={styles.checkboxRow} title="Hide column">
              <input
                type="checkbox"
                checked={hiddenColumns.has(selectedColumn)}
                onChange={() => toggleColumnVisibility(selectedColumn)}
              />
              {hiddenColumns.has(selectedColumn) ? <Eye size={14} /> : <EyeOff size={14} />}
              <span>{hiddenColumns.has(selectedColumn) ? 'Hidden' : 'Visible'}</span>
            </label>
          </div>

          <div className={styles.optionRow}>
            <div className={styles.colorGroup}>
              <Type size={16} />
              <label className={styles.smallLabel}>Text:</label>
              <input
                type="color"
                value={columnStyles[selectedColumn]?.color || '#000000'}
                onChange={(e) => updateColumnStyle(selectedColumn, 'color', e.target.value)}
                className={styles.colorInput}
                title="Text color"
              />
            </div>

            <div className={styles.colorGroup}>
              <Paintbrush size={16} />
              <label className={styles.smallLabel}>Background:</label>
              <input
                type="color"
                value={columnStyles[selectedColumn]?.backgroundColor || '#ffffff'}
                onChange={(e) => updateColumnStyle(selectedColumn, 'backgroundColor', e.target.value)}
                className={styles.colorInput}
                title="Background color"
              />
              <button
                onClick={() => updateColumnStyle(selectedColumn, 'backgroundColor', 'transparent')}
                className={styles.smallBtn}
                title="Reset to transparent"
              >
                Clear
              </button>
            </div>

            <button
              onClick={() => updateColumnStyle(selectedColumn, 'bold', !columnStyles[selectedColumn]?.bold)}
              className={`${styles.btnToggle} ${columnStyles[selectedColumn]?.bold ? styles.active : ''}`}
            >
              <Type size={16} />
              Bold
            </button>

            <div className={styles.alignGroup}>
              <button
                onClick={() => updateColumnStyle(selectedColumn, 'align', 'left')}
                className={`${styles.alignBtn} ${columnStyles[selectedColumn]?.align === 'left' || !columnStyles[selectedColumn]?.align ? styles.active : ''}`}
              >
                <AlignLeft size={16} />
              </button>
              <button
                onClick={() => updateColumnStyle(selectedColumn, 'align', 'center')}
                className={`${styles.alignBtn} ${columnStyles[selectedColumn]?.align === 'center' ? styles.active : ''}`}
              >
                <AlignCenter size={16} />
              </button>
              <button
                onClick={() => updateColumnStyle(selectedColumn, 'align', 'right')}
                className={`${styles.alignBtn} ${columnStyles[selectedColumn]?.align === 'right' ? styles.active : ''}`}
              >
                <AlignRight size={16} />
              </button>
            </div>

            <div className={styles.widthGroup}>
              <Columns size={16} />
              <span className={styles.muted}>Width:</span>
              <input
                type="text"
                placeholder="auto"
                value={columnStyles[selectedColumn]?.width?.replace('auto', '').replace('px', '').replace('%', '') || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  const unit = columnStyles[selectedColumn]?.width?.includes('%') ? '%' : 'px';
                  if (!value) {
                    updateColumnStyle(selectedColumn, 'width', 'auto');
                  } else if (!isNaN(value)) {
                    updateColumnStyle(selectedColumn, 'width', `${value}${unit}`);
                  }
                }}
                className={styles.widthInput}
              />
              <select
                value={columnStyles[selectedColumn]?.width?.includes('%') ? '%' : 'px'}
                onChange={(e) => {
                  const currentWidth = columnStyles[selectedColumn]?.width;
                  if (currentWidth && currentWidth !== 'auto') {
                    const numValue = parseInt(currentWidth);
                    if (!isNaN(numValue)) {
                      updateColumnStyle(selectedColumn, 'width', `${numValue}${e.target.value}`);
                    }
                  }
                }}
                className={styles.unitSelect}
              >
                <option value="px">px</option>
                <option value="%">%</option>
              </select>
            </div>

            {/* Line 4: Sort, Type, Number format */}
            <div className={styles.headerBottom}>
              <div className={styles.reducerGroup}>
                <label className={styles.smallLabel}>Sort:</label>
                <select
                  className={styles.select}
                  value={columnStyles[selectedColumn]?.sort || 'none'}
                  onChange={(e) => updateColumnStyle(selectedColumn, 'sort', e.target.value)}
                >
                  <option value="none">none</option>
                  <option value="up">up</option>
                  <option value="down">down</option>
                  <option value="up numbers">up numbers</option>
                  <option value="down numbers">down numbers</option>
                </select>
              </div>
              <div className={styles.reducerGroup}>
                <label className={styles.smallLabel}>Type:</label>
                <select
                  className={styles.select}
                  value={columnStyles[selectedColumn]?.type || 'auto'}
                  onChange={(e) => updateColumnStyle(selectedColumn, 'type', e.target.value)}
                >
                  <option value="auto">auto</option>
                  <option value="text">text</option>
                  <option value="number">number</option>
                </select>
              </div>
              <div className={styles.reducerGroup}>
                <label className={styles.smallLabel}>Number format:</label>
                <select
                  className={styles.select}
                  value={columnStyles[selectedColumn]?.numFormat || 'general'}
                  onChange={(e) => updateColumnStyle(selectedColumn, 'numFormat', e.target.value)}
                >
                  <option value="general">general</option>
                  <option value="int">no decimals</option>
                  <option value="fixed2">2 decimals</option>
                  <option value="thousand">thousands</option>
                  <option value="thousand2">thousands + 2 decimals</option>
                  <option value="currency">$ currency</option>
                  <option value="currency-red">$ currency, red if negative</option>
                  <option value="currency-paren-red">$ currency, parentheses + red if negative</option>
                  <option value="paren-red">parentheses + red if negative</option>
                </select>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Hidden columns list */}
      {hiddenColumns.size > 0 && (
        <div className={styles.hiddenColumns}>
          <p className={styles.hiddenTitle}>Hidden Columns:</p>
          <div className={styles.hiddenList}>
            {Array.from(hiddenColumns).map(col => (
              <button
                key={col}
                onClick={() => toggleColumnVisibility(col)}
                className={styles.hiddenPill}
                title="Click to show column"
              >
                <EyeOff size={14} />
                {col}
                <X size={14} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;

