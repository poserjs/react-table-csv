import React, { useState, useMemo, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import Papa from 'papaparse';
import { ChevronUp, ChevronDown, Filter, X, Type, AlignLeft, AlignCenter, AlignRight, Columns, Search, List, WrapText, Eye, EyeOff, GripVertical, Paintbrush, Pin, PinOff, Download, Scissors, Hash, RefreshCw, Settings as SettingsIcon } from 'lucide-react';
import styles from './ReactTableCsv.module.css';

// Dropdown component for multi-select filtering
const FilterDropdown = ({ values, selectedValues, onSelectionChange, onClose }) => {
  const dropdownRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const filteredValues = values.filter(val => 
    val.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = () => {
    if (selectedValues.size === values.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(values));
    }
  };

  return (
    <div ref={dropdownRef} className={styles.dropdown}>
      <div className={styles.dropdownHeader}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search values..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>

      <div className={styles.dropdownSelectAll}>
        <button onClick={handleSelectAll} className={styles.selectAllButton}>
          <span>Select All</span>
          <span className={styles.counter}>{selectedValues.size}/{values.length}</span>
        </button>
      </div>

      <div className={styles.dropdownList}>
        {filteredValues.length === 0 ? (
          <div className={styles.emptyState}>No matches found</div>
        ) : (
          filteredValues.map(value => (
            <label key={value} className={styles.dropdownItem} onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={selectedValues.has(value)}
                onChange={(e) => {
                  const newSelection = new Set(selectedValues);
                  if (e.target.checked) {
                    newSelection.add(value);
                  } else {
                    newSelection.delete(value);
                  }
                  onSelectionChange(newSelection);
                }}
                className={styles.checkbox}
              />
              <span className={styles.valueText} title={value}>
                {value}
              </span>
            </label>
          ))
        )}
      </div>

      <div className={styles.dropdownFooter}>
        <button onClick={onClose} className={styles.applyButton}>
          Apply Filter
        </button>
      </div>
    </div>
  );
};

const SETTINGS_VERSION = '0.1';

const ReactTableCSV = ({ csvString, csvURL, csvData, downloadFilename = 'data.csv', storageKey = 'react-table-csv-key', defaultSettings = '', theme = 'lite' }) => {
  // Parse CSV using PapaParse for robust handling (quotes, commas, BOM)
  const parseCSV = (csv) => {
    const result = Papa.parse(csv, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      transformHeader: (h) => (h || '').trim(),
      transform: (v) => (typeof v === 'string' ? v.trim() : v),
    });

    // const headers = result.meta?.fields || [];
    // const data = (result.data || []).map((row) => {
    //   const obj = {};
    //   headers.forEach((h) => {
    //     obj[h] = row[h] !== undefined && row[h] !== null ? row[h] : '';
    //   });
    //   return obj;
    // });
    // const result = Papa.parse(csv, {
    //   header: true,
    //   skipEmptyLines: true,
    //   dynamicTyping: true,
    //   transformHeader: (h) => (h || '').trim(),
    //   transform: (v) => (typeof v === 'string' ? v.trim() : v),
    // });

    const headers = result.meta?.fields || [];
    const data = (result.data || []).map((row, idx) => {
      const obj = {};
      headers.forEach((h) => {
        obj[h] = row[h] !== undefined && row[h] !== null ? row[h] : '';
      });
      // assign stable internal id starting from 1
      obj._id = idx + 1;
      return obj;
    })
    return { headers, data };
  };

  const normalizeParsed = (parsed) => {
    const headers = parsed?.meta?.fields || parsed?.headers || [];
    const rows = parsed?.data || [];
    const data = rows.map((row, idx) => {
      const obj = {};
      headers.forEach((h) => {
        obj[h] = row[h] !== undefined && row[h] !== null ? row[h] : '';
      });
      obj._id = idx + 1;
      return obj;
    });
    return { headers, data };
  };

  const [originalHeaders, setOriginalHeaders] = useState([]);
  const [data, setData] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        if (csvString) {
          const { headers, data } = parseCSV(csvString);
          setOriginalHeaders(headers);
          setData(data);
        } else if (csvData) {
          const { headers, data } = normalizeParsed(csvData);
          setOriginalHeaders(headers);
          setData(data);
        } else if (csvURL) {
          const res = await fetch(csvURL);
          const text = await res.text();
          const { headers, data } = parseCSV(text);
          setOriginalHeaders(headers);
          setData(data);
        } else {
          setError('One of csvString, csvData, or csvURL must be provided.');
        }
      } catch (e) {
        setError('Failed to load CSV data.');
      }
    };
    loadData();
  }, [csvString, csvData, csvURL]);

  if (error) {
    return <div>{error}</div>;
  }

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
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [columnOrder, setColumnOrder] = useState([]);
  const [hiddenColumns, setHiddenColumns] = useState(new Set());
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [pinnedAnchor, setPinnedAnchor] = useState(null); // header name up to which columns are pinned
  const [pinnedOffsets, setPinnedOffsets] = useState({}); // header -> left offset in px
  const headerRefs = useRef({});
  const rowNumHeaderRef = useRef(null);
  const [showRowNumbers, setShowRowNumbers] = useState(false);
  const [customize, setCustomize] = useState(false);
  const defaultSettingsObj = useMemo(() => {
    try {
      if (!defaultSettings) return null;
      const parsed = JSON.parse(defaultSettings);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }, [defaultSettings]);

  // Visible headers based on order and hidden state
  const visibleHeaders = useMemo(() => {
    return columnOrder.filter(header => !hiddenColumns.has(header));
  }, [columnOrder, hiddenColumns]);

  const pinnedIndex = useMemo(() => {
    if (!pinnedAnchor) return -1;
    return visibleHeaders.indexOf(pinnedAnchor);
  }, [pinnedAnchor, visibleHeaders]);

  const isPinnedHeader = (header) => {
    if (pinnedIndex < 0) return false;
    const idx = visibleHeaders.indexOf(header);
    return idx > -1 && idx <= pinnedIndex;
  };

  const isPinnedLast = (header) => {
    if (pinnedIndex < 0) return false;
    return visibleHeaders.indexOf(header) === pinnedIndex;
  };

  // Get unique values for each column
  useEffect(() => {
    setColumnOrder(originalHeaders);
  }, [originalHeaders]);

  const uniqueValues = useMemo(() => {
    const result = {};
    originalHeaders.forEach(header => {
      const values = new Set();
      data.forEach(row => {
        if (row[header] !== undefined && row[header] !== null && row[header] !== '') {
          values.add(row[header]);
        }
      });
      result[header] = Array.from(values).sort((a, b) => {
        if (!isNaN(a) && !isNaN(b)) {
          return parseFloat(a) - parseFloat(b);
        }
        return a.toString().localeCompare(b.toString());
      });
    });
    return result;
  }, [data, originalHeaders]);

  // Drag and drop handlers
  const handleDragStart = (e, header) => {
    setDraggedColumn(header);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, header) => {
    e.preventDefault();
    if (draggedColumn && draggedColumn !== header) {
      setDragOverColumn(header);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e, targetHeader) => {
    e.preventDefault();
    if (draggedColumn && draggedColumn !== targetHeader) {
      const newOrder = [...columnOrder];
      const draggedIndex = newOrder.indexOf(draggedColumn);
      const targetIndex = newOrder.indexOf(targetHeader);
      
      // Remove dragged column and insert at target position
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedColumn);
      
      setColumnOrder(newOrder);
    }
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

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

  // Sorting helpers
  const toggleHeaderSort = (col) => {
    const curr = columnStyles[col]?.sort || 'none';
    const next = curr === 'none' ? 'up' : curr === 'up' ? 'down' : 'none';
    updateColumnStyle(col, 'sort', next);
  };
  const isSortAsc = (col) => {
    const s = columnStyles[col]?.sort;
    return s === 'up' || s === 'up numbers';
  };
  const isSortDesc = (col) => {
    const s = columnStyles[col]?.sort;
    return s === 'down' || s === 'down numbers';
  };

  // Filtering function
  const filteredData = useMemo(() => {
    const parseOp = (s) => {
      const t = String(s).trim();
      const m = t.match(/^(>=|<=|<>|>|<|=)\s*(.*)$/);
      if (!m) return null;
      return { op: m[1], rhs: m[2] };
    };
    const cmp = (op, a, b, mode) => {
      if (mode === 'number') {
        const an = typeof a === 'number' ? a : parseFloat(a);
        const bn = typeof b === 'number' ? b : parseFloat(b);
        if (isNaN(an) || isNaN(bn)) return false;
        switch (op) {
          case '>': return an > bn;
          case '<': return an < bn;
          case '>=': return an >= bn;
          case '<=': return an <= bn;
          case '=': return an === bn;
          case '<>': return an !== bn;
          default: return false;
        }
      } else {
        const as = a == null ? '' : String(a).toLowerCase();
        const bs = String(b).toLowerCase();
        const c = as.localeCompare(bs);
        switch (op) {
          case '>': return c > 0;
          case '<': return c < 0;
          case '>=': return c >= 0;
          case '<=': return c <= 0;
          case '=': return as === bs;
          case '<>': return as !== bs;
          default: return false;
        }
      }
    };
    return data.filter(row => {
      // Check text filters
      const passesTextFilters = Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const r = row[key];
        const parsed = parseOp(value);
        const declaredType = columnStyles[key]?.type || 'auto';
        const mode = declaredType === 'number' ? 'number' : (declaredType === 'text' ? 'text' : (typeof r === 'number' ? 'number' : 'text'));
        if (!parsed) {
          // substring search
          return r?.toString().toLowerCase().includes(String(value).toLowerCase());
        }
        const { op, rhs } = parsed;
        return cmp(op, r, rhs, mode);
      });
      
      // Check dropdown filters
      const passesDropdownFilters = Object.entries(dropdownFilters).every(([key, selectedSet]) => {
        if (!selectedSet || selectedSet.size === 0) return true;
        return selectedSet.has(row[key]);
      });
      
      return passesTextFilters && passesDropdownFilters;
    });
  }, [data, filters, dropdownFilters]);

  const groupByColumns = useMemo(() => {
    return originalHeaders.filter(h => columnStyles[h]?.groupBy);
  }, [originalHeaders, columnStyles]);

  const reducersForColumn = useMemo(() => {
    const map = {};
    originalHeaders.forEach(h => {
      let r = columnStyles[h]?.reducer || 'first';
      if (r === 'unique_concat') r = 'unique concat';
      if (r === 'unique_cnt') r = 'unique cnt';
      map[h] = r;
    });
    return map;
  }, [originalHeaders, columnStyles]);

  const groupedData = useMemo(() => {
    if (!groupByColumns || groupByColumns.length === 0) return filteredData;
    const keySep = '\u001F';
    const groups = new Map();
    filteredData.forEach(row => {
      const keyVals = groupByColumns.map(h => row[h] ?? '');
      const key = keyVals.join(keySep);
      let g = groups.get(key);
      if (!g) {
        g = { acc: {}, count: 0 };
        // init acc
        originalHeaders.forEach(h => {
          if (groupByColumns.includes(h)) {
            g.acc[h] = row[h];
          } else {
            const reducer = reducersForColumn[h];
            switch (reducer) {
              case 'sum':
              case 'avg':
                g.acc[h] = { sum: 0, count: 0 };
                break;
              case 'cnt':
                g.acc[h] = 0;
                break;
              case 'rowcnt':
                g.acc[h] = 0;
                break;
              case 'min':
                g.acc[h] = { val: undefined };
                break;
              case 'max':
                g.acc[h] = { val: undefined };
                break;
              case 'min-max':
                g.acc[h] = { min: undefined, max: undefined };
                break;
              case 'concat':
                g.acc[h] = [];
                break;
              case 'unique_concat':
              case 'unique concat':
              case 'unique_cnt':
              case 'unique cnt':
              case 'unique rowcnt':
                g.acc[h] = new Set();
                break;
              case 'last':
                g.acc[h] = undefined;
                break;
              case 'first':
              default:
                g.acc[h] = undefined;
                break;
            }
          }
        });
        groups.set(key, g);
      }
      g.count += 1;
      // accumulate
      originalHeaders.forEach(h => {
        if (groupByColumns.includes(h)) return;
        const reducer = reducersForColumn[h];
        const v = row[h];
        switch (reducer) {
          case 'sum': {
            const n = typeof v === 'number' ? v : parseFloat(v);
            if (!isNaN(n)) { g.acc[h].sum += n; g.acc[h].count += 1; }
            break;
          }
          case 'avg': {
            const n = typeof v === 'number' ? v : parseFloat(v);
            if (!isNaN(n)) { g.acc[h].sum += n; g.acc[h].count += 1; }
            break;
          }
          case 'cnt': {
            if (v !== null && v !== undefined && v !== '') {
              g.acc[h] += 1;
            }
            break;
          }
          case 'rowcnt': {
            g.acc[h] += 1;
            break;
          }
          case 'min': {
            const val = g.acc[h].val;
            if (val === undefined || v < val) g.acc[h].val = v;
            break;
          }
          case 'max': {
            const val = g.acc[h].val;
            if (val === undefined || v > val) g.acc[h].val = v;
            break;
          }
          case 'min-max': {
            if (g.acc[h].min === undefined || v < g.acc[h].min) g.acc[h].min = v;
            if (g.acc[h].max === undefined || v > g.acc[h].max) g.acc[h].max = v;
            break;
          }
          case 'concat': {
            g.acc[h].push(v);
            break;
          }
          case 'unique_concat':
          case 'unique concat': {
            if (v !== null && v !== undefined && v !== '') g.acc[h].add(v);
            break;
          }
          case 'unique_cnt':
          case 'unique cnt': {
            if (v !== null && v !== undefined && v !== '') g.acc[h].add(v);
            break;
          }
          case 'unique rowcnt': {
            g.acc[h].add(v);
            break;
          }
          case 'last': {
            g.acc[h] = v;
            break;
          }
          case 'first':
          default: {
            if (g.acc[h] === undefined) g.acc[h] = v;
            break;
          }
        }
      });
    });
    // finalize
    const out = [];
    for (const [key, g] of groups) {
      const row = {};
      originalHeaders.forEach(h => {
        if (groupByColumns.includes(h)) {
          row[h] = g.acc[h];
        } else {
          const reducer = reducersForColumn[h];
          const acc = g.acc[h];
          switch (reducer) {
            case 'sum':
              row[h] = acc.sum;
              break;
            case 'avg':
              row[h] = acc.count > 0 ? acc.sum / acc.count : '';
              break;
            case 'cnt':
            case 'rowcnt':
              row[h] = acc;
              break;
            case 'min':
              row[h] = acc.val;
              break;
            case 'max':
              row[h] = acc.val;
              break;
            case 'min-max':
              if (acc.min === undefined && acc.max === undefined) row[h] = '';
              else row[h] = `${acc.min} - ${acc.max}`;
              break;
            case 'concat':
              row[h] = acc.join(', ');
              break;
            case 'unique_concat':
            case 'unique concat':
              row[h] = Array.from(acc).join(', ');
              break;
            case 'unique_cnt':
            case 'unique cnt':
              row[h] = acc.size;
              break;
            case 'unique rowcnt':
              row[h] = acc.size;
              break;
            case 'last':
            case 'first':
            default:
              row[h] = acc;
              break;
          }
        }
      });
      // stable group key
      row._gid = key;
      out.push(row);
    }
    return out;
  }, [filteredData, originalHeaders, groupByColumns, reducersForColumn]);

  const displayedRows = groupByColumns.length > 0 ? groupedData : filteredData;

  const sortedRows = useMemo(() => {
    const sorts = visibleHeaders
      .map(h => ({ col: h, mode: columnStyles[h]?.sort || 'none' }))
      .filter(s => s.mode && s.mode !== 'none');
    if (sorts.length === 0) return displayedRows;
    const toNum = (v) => {
      if (typeof v === 'number') return v;
      const n = parseFloat(v);
      return isNaN(n) ? null : n;
    };
    const cmp = (a, b, mode, col) => {
      const numeric = mode.includes('numbers');
      const asc = mode.startsWith('up');
      let av = a[col];
      let bv = b[col];
      if (numeric) {
        const an = toNum(av);
        const bn = toNum(bv);
        if (an === null && bn === null) return 0;
        if (an === null) return asc ? 1 : -1;
        if (bn === null) return asc ? -1 : 1;
        return asc ? an - bn : bn - an;
      }
      // text compare
      if (av == null && bv == null) return 0;
      if (av == null) return asc ? 1 : -1;
      if (bv == null) return asc ? -1 : 1;
      const res = String(av).localeCompare(String(bv));
      return asc ? res : -res;
    };
    const rows = [...displayedRows];
    rows.sort((a, b) => {
      for (const s of sorts) {
        const r = cmp(a, b, s.mode, s.col);
        if (r !== 0) return r;
      }
      return 0;
    });
    return rows;
  }, [displayedRows, visibleHeaders, columnStyles]);

  // Split-by configuration: render separate tables for unique combinations
  const splitByColumns = useMemo(() => {
    return originalHeaders.filter(h => columnStyles[h]?.splitBy);
  }, [originalHeaders, columnStyles]);

  const splitGroups = useMemo(() => {
    if (!splitByColumns || splitByColumns.length === 0) return null;
    const sep = '\u001F';
    const groups = new Map();
    displayedRows.forEach(row => {
      const keyVals = splitByColumns.map(h => row[h] ?? '');
      const key = keyVals.join(sep);
      if (!groups.has(key)) {
        groups.set(key, { keyVals, rows: [] });
      }
      groups.get(key).rows.push(row);
    });
    return Array.from(groups.values());
  }, [displayedRows, splitByColumns]);

  // Toggle filter mode for a column
  const toggleFilterMode = (column) => {
    const newMode = filterMode[column] === 'dropdown' ? 'text' : 'dropdown';
    setFilterMode(prev => ({
      ...prev,
      [column]: newMode
    }));
    
    // Clear the filter when switching modes
    if (newMode === 'text') {
      setDropdownFilters(prev => {
        const newFilters = { ...prev };
        delete newFilters[column];
        return newFilters;
      });
    } else {
      setFilters(prev => {
        const newFilters = { ...prev };
        delete newFilters[column];
        return newFilters;
      });
    }
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

  const getColumnStyle = (column) => {
    const s = columnStyles[column] || {};
    const style = {
      color: s.color || 'inherit',
      fontWeight: s.bold ? 'bold' : 'normal',
      textAlign: s.align || 'left',
      width: s.width || 'auto',
      minWidth: s.width || 'auto',
      maxWidth: s.width || 'none',
      whiteSpace: s.noWrap ? 'nowrap' : 'normal',
      overflow: s.noWrap ? 'hidden' : 'visible',
      textOverflow: s.noWrap ? 'ellipsis' : 'clip'
    };
    if (s.backgroundColor) {
      style.backgroundColor = s.backgroundColor;
    }
    return style;
  };

  // Header style should not inherit text color, background, or bold from column styles
  const getHeaderStyle = (column) => {
    const s = columnStyles[column] || {};
    return {
      textAlign: s.align || 'left',
      width: s.width || 'auto',
      minWidth: s.width || 'auto',
      maxWidth: s.width || 'none',
      whiteSpace: s.noWrap ? 'nowrap' : 'normal',
      overflow: s.noWrap ? 'hidden' : 'visible',
      textOverflow: s.noWrap ? 'ellipsis' : 'clip'
    };
  };

  // Display formatting helpers
  const formatNumberForDisplay = (header, value) => {
    const fmt = columnStyles[header]?.numFormat || 'general';
    const declaredType = columnStyles[header]?.type || 'auto';
    const n = typeof value === 'number' ? value : parseFloat(value);
    const isNumber = declaredType === 'number' || (!isNaN(n) && declaredType !== 'text');
    if (!isNumber) return value;

    const abs = Math.abs(n);
    const neg = n < 0;
    const make = (opts) => new Intl.NumberFormat(undefined, { useGrouping: true, ...opts }).format;

    let text = String(value);
    switch (fmt) {
      case 'int': {
        text = make({ useGrouping: false, minimumFractionDigits: 0, maximumFractionDigits: 0 })(n);
        break;
      }
      case 'fixed2': {
        text = make({ useGrouping: false, minimumFractionDigits: 2, maximumFractionDigits: 2 })(n);
        break;
      }
      case 'thousand': {
        text = make({ minimumFractionDigits: 0, maximumFractionDigits: 0 })(n);
        break;
      }
      case 'thousand2': {
        text = make({ minimumFractionDigits: 2, maximumFractionDigits: 2 })(n);
        break;
      }
      case 'currency': {
        text = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);
        break;
      }
      case 'currency-red': {
        text = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);
        return <span style={{ color: neg ? '#b91c1c' : 'inherit' }}>{text}</span>;
      }
      case 'currency-paren-red': {
        const base = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(abs);
        const out = neg ? `(${base})` : base;
        return <span style={{ color: neg ? '#b91c1c' : 'inherit' }}>{out}</span>;
      }
      case 'paren-red': {
        const base = make({ minimumFractionDigits: 2, maximumFractionDigits: 2 })(abs);
        const out = neg ? `(${base})` : base;
        return <span style={{ color: neg ? '#b91c1c' : 'inherit' }}>{out}</span>;
      }
      case 'general':
      default: {
        return value;
      }
    }
    return text;
  };

  // Clear filters -> reset to defaults if provided, otherwise blank
  const clearAllFilters = () => {
    if (defaultSettingsObj && (defaultSettingsObj.filters || defaultSettingsObj.dropdownFilters || defaultSettingsObj.filterMode != null)) {
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
      if (ds.filterMode) setFilterMode(ds.filterMode);
      if (typeof ds.showFilterRow === 'boolean') setShowFilterRow(ds.showFilterRow);
    } else {
      setFilters({});
      setDropdownFilters({});
    }
  };


  // Compute sticky left offsets for pinned columns based on header widths
  // Use layout effect to avoid 1-frame visual gaps when toggling row numbers
  useLayoutEffect(() => {
    if (pinnedIndex < 0) {
      setPinnedOffsets({});
      return;
    }
    let left = showRowNumbers ? (rowNumHeaderRef.current ? rowNumHeaderRef.current.getBoundingClientRect().width : 0) : 0;
    const offsets = {};
    for (let i = 0; i <= pinnedIndex; i++) {
      const h = visibleHeaders[i];
      offsets[h] = left;
      const el = headerRefs.current[h];
      const width = el ? el.getBoundingClientRect().width : 0;
      left += width;
    }
    setPinnedOffsets(offsets);
  }, [visibleHeaders, columnStyles, pinnedIndex, data, showFilterRow, showRowNumbers]);

  useEffect(() => {
    const onResize = () => {
      // Recompute offsets on resize
      if (pinnedIndex >= 0) {
        let left = showRowNumbers ? (rowNumHeaderRef.current ? rowNumHeaderRef.current.getBoundingClientRect().width : 0) : 0;
        const offsets = {};
        for (let i = 0; i <= pinnedIndex; i++) {
          const h = visibleHeaders[i];
          offsets[h] = left;
          const el = headerRefs.current[h];
          const width = el ? el.getBoundingClientRect().width : 0;
          left += width;
        }
        setPinnedOffsets(offsets);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [visibleHeaders, pinnedIndex, showRowNumbers]);

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
  }, [columnStyles, columnOrder, hiddenColumns, filters, dropdownFilters, filterMode, showFilterRow, pinnedAnchor, showRowNumbers, customize]);

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
      // backward-compat: older settings may use `editable`
      if (typeof s.editable === 'boolean' && typeof s.customize !== 'boolean') setCustomize(s.editable);
    } catch (e) {
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
    } catch (e) {
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
    } catch (e) {
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
    storageKey,
    buildSettings,
  ]);

  const handleExportSettings = () => {
    try {
      const json = JSON.stringify(buildSettings());
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(json).catch(() => { /* ignore clipboard error */ });
      }
    } catch (e) { /* ignore */ }
  };

  const handleImportSettings = () => {
    const input = window.prompt('Paste settings JSON:');
    if (!input) return;
    try {
      const parsed = JSON.parse(input);
      applySettings(parsed);
      // save right away
      window.localStorage.setItem(storageKey, JSON.stringify(parsed));
    } catch (e) {
      alert('Invalid JSON. Settings not applied.');
    }
  };

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
      try { window.localStorage.removeItem(storageKey); } catch { /* ignore */ }
    }
  };

  const handleDownload = () => {
    if (!visibleHeaders.length) return;
    const baseRows = groupByColumns.length > 0 ? groupedData : filteredData;
    // Apply multi-column sorting to export as well
    const sorts = visibleHeaders
      .map(h => ({ col: h, mode: columnStyles[h]?.sort || 'none' }))
      .filter(s => s.mode && s.mode !== 'none');
    const rows = sorts.length ? [...baseRows].sort((a, b) => {
      const toNum = (v) => {
        if (typeof v === 'number') return v;
        const n = parseFloat(v);
        return isNaN(n) ? null : n;
      };
      for (const s of sorts) {
        const numeric = s.mode.includes('numbers');
        const asc = s.mode.startsWith('up');
        let av = a[s.col];
        let bv = b[s.col];
        let r = 0;
        if (numeric) {
          const an = toNum(av), bn = toNum(bv);
          if (an === null && bn === null) r = 0; else if (an === null) r = 1; else if (bn === null) r = -1; else r = an - bn;
        } else {
          if (av == null && bv == null) r = 0; else if (av == null) r = 1; else if (bv == null) r = -1; else r = String(av).localeCompare(String(bv));
        }
        if (r !== 0) return asc ? r : -r;
      }
      return 0;
    }) : baseRows;
    const exportRows = rows.map((row) => {
      const o = {};
      visibleHeaders.forEach((h) => { o[h] = row[h]; });
      return o;
    });
    const csv = Papa.unparse(exportRows, {
      header: true,
      columns: visibleHeaders,
      delimiter: ',',
      newline: '\r\n',
    });
    const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = downloadFilename || 'data.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
    } catch (e) { /* ignore */ }
  };

  // Computed editable flag used across UI
  const isCustomize = customize;

  return (
    <div className={`${styles.root} ${theme === 'dark' ? styles.dark : styles.lite}`}>
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
              Showing {displayedRows.length} of {data.length} rows | {visibleHeaders.length} of {originalHeaders.length} columns
            </div>
          </div>

          {showStylePanel && (
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
                      {(visibleHeaders.indexOf(selectedColumn) <= pinnedIndex && pinnedIndex>=0) ? <Pin size={14} /> : <PinOff size={14} />}
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



                    <label className={styles.checkboxRow}>
                      <input
                        type="checkbox"
                        checked={!!columnStyles[selectedColumn]?.groupBy}
                        onChange={(e) => updateColumnStyle(selectedColumn, 'groupBy', e.target.checked)}
                      />
                      <List size={16} />
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
                        <option value="unique cnt">unique cnt</option>
                        </select>
                      </div>
                    )}

                    <label className={styles.checkboxRow}>
                      <input
                        type="checkbox"
                        checked={!!columnStyles[selectedColumn]?.splitBy}
                        onChange={(e) => updateColumnStyle(selectedColumn, 'splitBy', e.target.checked)}
                      />
                      <Scissors size={16} />
                      <span>Split table by this column</span>
                    </label>
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
          )}

          {/* Table */}
          {(!splitGroups || splitGroups.length === 0) ? (
            <div className={styles.tableWrap}>
              <table className={styles.table} style={{ tableLayout: 'auto' }}>
                <thead>
                  <tr className={styles.theadRow}>
                    {showRowNumbers && (
                      <th
                        ref={rowNumHeaderRef}
                        className={`${styles.th} ${styles.stickyHead} ${styles.rowNoHead}`}
                        style={{ left: 0, textAlign: 'right' }}
                      >
                        #
                      </th>
                    )}
                    {visibleHeaders.map(header => (
                      <th 
                        key={header}
                        ref={(el) => { headerRefs.current[header] = el; }}
                        className={`${styles.th} ${dragOverColumn === header ? styles.thDragOver : ''} ${isPinnedHeader(header) ? styles.stickyHead : ''} ${isPinnedLast(header) ? styles.pinnedDivider : ''}`}
                        style={isPinnedHeader(header) ? { ...getHeaderStyle(header), left: `${pinnedOffsets[header] || 0}px` } : getHeaderStyle(header)}
                        draggable={isCustomize}
                        onDragStart={isCustomize ? (e) => handleDragStart(e, header) : undefined}
                        onDragOver={isCustomize ? (e) => handleDragOver(e, header) : undefined}
                        onDragLeave={isCustomize ? handleDragLeave : undefined}
                        onDrop={isCustomize ? (e) => handleDrop(e, header) : undefined}
                        onDragEnd={isCustomize ? handleDragEnd : undefined}
                      >
                        <div className={styles.thInner}>
                          <div className={styles.headerTop}>
                            <div className={styles.thLeft}>
                              {isCustomize && <GripVertical size={14} />}
                              <span 
                              onClick={isCustomize ? () => toggleHeaderSort(header) : undefined}
                              title={(() => {
                                const hasGroup = groupByColumns.length > 0;
                                const isGrouped = groupByColumns.includes(header);
                                const red = reducersForColumn && reducersForColumn[header];
                                const label = hasGroup && !isGrouped && red ? `${header} (${red})` : header;
                                return columnStyles[header]?.noWrap ? `${label} (no-wrap enabled)` : label;
                              })()}
                            >
                              {groupByColumns.length > 0 && !groupByColumns.includes(header) && reducersForColumn[header]
                                ? `${header} (${reducersForColumn[header]})`
                                : header}
                              </span>
                            </div>
                            <div className={styles.headerRight}>
                              {isCustomize && (
                                <>
                                  <button
                                    className={`${styles.iconBtn} ${selectedColumn === header && showStylePanel ? styles.iconBtnActive : ''}`}
                                    title={selectedColumn === header && showStylePanel ? 'Close settings' : 'Customize this column'}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (selectedColumn === header && showStylePanel) {
                                        setSelectedColumn('');
                                        setShowStylePanel(false);
                                      } else {
                                        setSelectedColumn(header);
                                        setShowStylePanel(true);
                                      }
                                    }}
                                  >
                                    <SettingsIcon size={14} />
                                  </button>
                                  <div className={styles.sortIcons}>
                                    <ChevronUp size={12} className={isSortAsc(header) ? styles.sortActive : styles.sortInactive} />
                                    <ChevronDown size={12} className={isSortDesc(header) ? styles.sortActive : styles.sortInactive} style={{ marginTop: '-3px' }} />
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          {isCustomize && selectedColumn === header && (
                            <div className={styles.headerBottom}>
                              <button
                                className={`${styles.iconBtn} ${columnStyles[header]?.groupBy ? styles.iconBtnActive : ''}`}
                                title={columnStyles[header]?.groupBy ? 'Ungroup by this column' : 'Group by this column'}
                                onClick={(e) => { e.stopPropagation(); updateColumnStyle(header, 'groupBy', !columnStyles[header]?.groupBy); }}
                              >
                                <List size={14} />
                              </button>
                              <button
                                className={`${styles.iconBtn} ${columnStyles[header]?.splitBy ? styles.iconBtnActive : ''}`}
                                title={columnStyles[header]?.splitBy ? 'Remove from split' : 'Split by this column'}
                                onClick={(e) => { e.stopPropagation(); updateColumnStyle(header, 'splitBy', !columnStyles[header]?.splitBy); }}
                              >
                                <Scissors size={14} />
                              </button>
                              <button
                                className={`${styles.iconBtn} ${columnStyles[header]?.noWrap ? styles.iconBtnActive : ''}`}
                                title={columnStyles[header]?.noWrap ? 'Disable no-wrap' : 'Enable no-wrap'}
                                onClick={(e) => { e.stopPropagation(); updateColumnStyle(header, 'noWrap', !columnStyles[header]?.noWrap); }}
                              >
                                <WrapText size={14} />
                              </button>
                              <button
                                className={`${styles.iconBtn} ${(visibleHeaders.indexOf(header) <= pinnedIndex && pinnedIndex>=0) ? styles.iconBtnActive : ''}`}
                                title={(visibleHeaders.indexOf(header) <= pinnedIndex && pinnedIndex>=0) ? 'Unpin to left of this column' : 'Pin up to this column'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const idx = visibleHeaders.indexOf(header);
                                  if (idx <= 0) {
                                    setPinnedAnchor(null);
                                  } else {
                                    // toggle pin: if currently pinned through this header, unpin to previous; else pin to this header
                                    if (pinnedIndex === idx) {
                                      setPinnedAnchor(visibleHeaders[idx-1] || null);
                                    } else {
                                      setPinnedAnchor(header);
                                    }
                                  }
                                }}
                              >
                                {(visibleHeaders.indexOf(header) <= pinnedIndex && pinnedIndex>=0) ? <Pin size={14} /> : <PinOff size={14} />}
                              </button>
                              <button
                                className={styles.iconBtn}
                                title={'Hide column'}
                                onClick={(e) => { e.stopPropagation(); toggleColumnVisibility(header); }}
                              >
                                <EyeOff size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                  
                  {/* Filter Row */}
                  {showFilterRow && (
                    <tr className={styles.filterRow}>
                      {showRowNumbers && (
                        <th className={styles.filterCell} />
                      )}
                      {visibleHeaders.map(header => (
                        <th key={`filter-${header}`} className={styles.filterCell}>
                          <div className={styles.filterCellInner}>
                            <button
                              onClick={() => toggleFilterMode(header)}
                              className={`${styles.iconBtn} ${filterMode[header] === 'dropdown' ? styles.iconBtnActive : ''}`}
                              title={filterMode[header] === 'dropdown' ? 'Switch to text filter' : 'Switch to dropdown filter'}
                            >
                              {filterMode[header] === 'dropdown' ? <List size={14} /> : <Search size={14} />}
                            </button>
                            
                            {filterMode[header] === 'dropdown' ? (
                              <div className={styles.flex1Relative}>
                                <button
                                  onClick={() => setActiveDropdown(activeDropdown === header ? null : header)}
                                  className={styles.dropdownTrigger}
                                >
                                  <span className={styles.truncate}>
                                    {dropdownFilters[header]?.size > 0
                                      ? `${dropdownFilters[header].size} selected`
                                      : `Select ${header}...`}
                                  </span>
                                  <ChevronDown size={14} />
                                </button>
                                
                                {activeDropdown === header && (
                                  <FilterDropdown
                                    values={uniqueValues[header]}
                                    selectedValues={dropdownFilters[header] || new Set()}
                                    onSelectionChange={(newSelection) => {
                                      setDropdownFilters(prev => ({
                                        ...prev,
                                        [header]: newSelection
                                      }));
                                    }}
                                    onClose={() => setActiveDropdown(null)}
                                  />
                                )}
                                
                                {dropdownFilters[header]?.size > 0 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDropdownFilters(prev => {
                                        const newFilters = { ...prev };
                                        delete newFilters[header];
                                        return newFilters;
                                      });
                                    }}
                                    className={styles.clearFilterBtn}
                                  >
                                    <X size={14} />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className={styles.flex1Relative}>
                                <input
                                  type="text"
                                  placeholder={`Filter ${header}...`}
                                  value={filters[header] || ''}
                                  onChange={(e) => setFilters(prev => ({
                                    ...prev,
                                    [header]: e.target.value
                                  }))}
                                  className={styles.textFilter}
                                />
                                {filters[header] && (
                                  <button
                                    onClick={() => setFilters(prev => ({
                                      ...prev,
                                      [header]: ''
                                    }))}
                                    className={styles.clearFilterBtnSmall}
                                  >
                                    <X size={14} />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  )}
                </thead>
                
                <tbody>
                  {sortedRows.map((row, index) => (
                    <tr 
                      key={row._id || row._gid || index}
                      className={styles.row}
                    >
                      {showRowNumbers && (
                        <td className={`${styles.cell} ${styles.stickyCell} ${styles.rowNoCell}`} style={{ left: 0, textAlign: 'right' }}>
                          {index + 1}
                        </td>
                      )}
                      {visibleHeaders.map(header => (
                        <td 
                          key={`${index}-${header}`}
                          className={`${styles.cell} ${isPinnedHeader(header) ? styles.stickyCell : ''} ${isPinnedLast(header) ? styles.pinnedDivider : ''}`}
                          style={isPinnedHeader(header) ? { ...getColumnStyle(header), left: `${pinnedOffsets[header] || 0}px` } : getColumnStyle(header)}
                          title={columnStyles[header]?.noWrap ? row[header] : undefined}
                        >
                          {formatNumberForDisplay(header, row[header])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              {sortedRows.length === 0 && (
                <div className={styles.emptyStateTable}>
                  <Filter size={40} />
                  <p>No data matches your filters</p>
                  <span>Try adjusting your filter criteria</span>
                </div>
              )}
            </div>
          ) : (
            <div>
              {splitGroups.map((g, i) => (
                <div key={i} className={styles.splitSection}>
                  <h2 className={styles.splitTitle}>
                    {splitByColumns.map((h, idx) => `${h}: ${g.keyVals[idx]}`).join(' • ')}
                  </h2>
                  <div className={styles.tableWrap}>
                    <table className={styles.table} style={{ tableLayout: 'auto' }}>
                      <thead>
                        <tr className={styles.theadRow}>
                          {showRowNumbers && (
                            <th className={`${styles.th} ${styles.stickyHead} ${styles.rowNoHead}`} style={{ left: 0, textAlign: 'right' }}>
                              #
                            </th>
                          )}
                          {visibleHeaders.map(header => (
                            <th 
                              key={header}
                              ref={(el) => { headerRefs.current[header] = el; }}
                              className={`${styles.th} ${dragOverColumn === header ? styles.thDragOver : ''} ${isPinnedHeader(header) ? styles.stickyHead : ''} ${isPinnedLast(header) ? styles.pinnedDivider : ''}`}
                              style={isPinnedHeader(header) ? { ...getHeaderStyle(header), left: `${pinnedOffsets[header] || 0}px` } : getHeaderStyle(header)}
                              draggable={isCustomize}
                              onDragStart={isCustomize ? (e) => handleDragStart(e, header) : undefined}
                              onDragOver={isCustomize ? (e) => handleDragOver(e, header) : undefined}
                              onDragLeave={isCustomize ? handleDragLeave : undefined}
                              onDrop={isCustomize ? (e) => handleDrop(e, header) : undefined}
                              onDragEnd={isCustomize ? handleDragEnd : undefined}
                            >
                              <div className={styles.thInner}>
                                <div className={styles.headerTop}>
                                  <div className={styles.thLeft}>
                                    {isCustomize && <GripVertical size={14} />}
                                    <span>
                                      {groupByColumns.length > 0 && !groupByColumns.includes(header) && reducersForColumn[header]
                                        ? `${header} (${reducersForColumn[header]})`
                                        : header}
                                    </span>
                                  </div>
                                  <div className={styles.headerRight}>
                                    {isCustomize && (
                                      <>
                                        <button
                                          className={`${styles.iconBtn} ${selectedColumn === header && showStylePanel ? styles.iconBtnActive : ''}`}
                                          title={selectedColumn === header && showStylePanel ? 'Close settings' : 'Customize this column'}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (selectedColumn === header && showStylePanel) {
                                              setSelectedColumn('');
                                              setShowStylePanel(false);
                                            } else {
                                              setSelectedColumn(header);
                                              setShowStylePanel(true);
                                            }
                                          }}
                                        >
                                          <SettingsIcon size={14} />
                                        </button>
                                        <div className={styles.sortIcons}>
                                          <ChevronUp size={12} className={isSortAsc(header) ? styles.sortActive : styles.sortInactive} />
                                          <ChevronDown size={12} className={isSortDesc(header) ? styles.sortActive : styles.sortInactive} style={{ marginTop: '-3px' }} />
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                                {isCustomize && selectedColumn === header && (
                                  <div className={styles.headerBottom}>
                                    <button
                                      className={`${styles.iconBtn} ${columnStyles[header]?.groupBy ? styles.iconBtnActive : ''}`}
                                      title={columnStyles[header]?.groupBy ? 'Ungroup by this column' : 'Group by this column'}
                                      onClick={(e) => { e.stopPropagation(); updateColumnStyle(header, 'groupBy', !columnStyles[header]?.groupBy); }}
                                    >
                                      <List size={14} />
                                    </button>
                                    <button
                                      className={`${styles.iconBtn} ${columnStyles[header]?.splitBy ? styles.iconBtnActive : ''}`}
                                      title={columnStyles[header]?.splitBy ? 'Remove from split' : 'Split by this column'}
                                      onClick={(e) => { e.stopPropagation(); updateColumnStyle(header, 'splitBy', !columnStyles[header]?.splitBy); }}
                                    >
                                      <Scissors size={14} />
                                    </button>
                                    <button
                                      className={`${styles.iconBtn} ${columnStyles[header]?.noWrap ? styles.iconBtnActive : ''}`}
                                      title={columnStyles[header]?.noWrap ? 'Disable no-wrap' : 'Enable no-wrap'}
                                      onClick={(e) => { e.stopPropagation(); updateColumnStyle(header, 'noWrap', !columnStyles[header]?.noWrap); }}
                                    >
                                      <WrapText size={14} />
                                    </button>
                                    <button
                                      className={`${styles.iconBtn} ${(visibleHeaders.indexOf(header) <= pinnedIndex && pinnedIndex>=0) ? styles.iconBtnActive : ''}`}
                                      title={(visibleHeaders.indexOf(header) <= pinnedIndex && pinnedIndex>=0) ? 'Unpin to left of this column' : 'Pin up to this column'}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const idx = visibleHeaders.indexOf(header);
                                        if (idx <= 0) {
                                          setPinnedAnchor(null);
                                        } else {
                                          if (pinnedIndex === idx) {
                                            setPinnedAnchor(visibleHeaders[idx-1] || null);
                                          } else {
                                            setPinnedAnchor(header);
                                          }
                                        }
                                      }}
                                    >
                                      {(visibleHeaders.indexOf(header) <= pinnedIndex && pinnedIndex>=0) ? <Pin size={14} /> : <PinOff size={14} />}
                                    </button>
                                    <button
                                      className={styles.iconBtn}
                                      title={'Hide column'}
                                      onClick={(e) => { e.stopPropagation(); toggleColumnVisibility(header); }}
                                    >
                                      <EyeOff size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </th>
                          ))}
                        </tr>
                        {i === 0 && showFilterRow && (
                          <tr className={styles.filterRow}>
                            {showRowNumbers && (
                              <th className={styles.filterCell} />
                            )}
                            {visibleHeaders.map(header => (
                              <th key={`filter-split-${i}-${header}`} className={styles.filterCell}>
                                <div className={styles.filterCellInner}>
                                  <button
                                    onClick={() => toggleFilterMode(header)}
                                    className={`${styles.iconBtn} ${filterMode[header] === 'dropdown' ? styles.iconBtnActive : ''}`}
                                    title={filterMode[header] === 'dropdown' ? 'Switch to text filter' : 'Switch to dropdown filter'}
                                  >
                                    {filterMode[header] === 'dropdown' ? <List size={14} /> : <Search size={14} />}
                                  </button>

                                  {filterMode[header] === 'dropdown' ? (
                                    <div className={styles.flex1Relative}>
                                      <button
                                        onClick={() => setActiveDropdown(activeDropdown === header ? null : header)}
                                        className={styles.dropdownTrigger}
                                      >
                                        <span className={styles.truncate}>
                                          {dropdownFilters[header]?.size > 0
                                            ? `${dropdownFilters[header].size} selected`
                                            : `Select ${header}...`}
                                        </span>
                                        <ChevronDown size={14} />
                                      </button>

                                      {activeDropdown === header && (
                                        <FilterDropdown
                                          values={uniqueValues[header]}
                                          selectedValues={dropdownFilters[header] || new Set()}
                                          onSelectionChange={(newSelection) => {
                                            setDropdownFilters(prev => ({
                                              ...prev,
                                              [header]: newSelection
                                            }));
                                          }}
                                          onClose={() => setActiveDropdown(null)}
                                        />
                                      )}

                                      {dropdownFilters[header]?.size > 0 && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setDropdownFilters(prev => {
                                              const newFilters = { ...prev };
                                              delete newFilters[header];
                                              return newFilters;
                                            });
                                          }}
                                          className={styles.clearFilterBtn}
                                        >
                                          <X size={14} />
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <div className={styles.flex1Relative}>
                                      <input
                                        type="text"
                                        placeholder={`Filter ${header}...`}
                                        value={filters[header] || ''}
                                        onChange={(e) => setFilters(prev => ({
                                          ...prev,
                                          [header]: e.target.value
                                        }))}
                                        className={styles.textFilter}
                                      />
                                      {filters[header] && (
                                        <button
                                          onClick={() => setFilters(prev => ({
                                            ...prev,
                                            [header]: ''
                                          }))}
                                          className={styles.clearFilterBtnSmall}
                                        >
                                          <X size={14} />
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </th>
                            ))}
                          </tr>
                        )}
                      </thead>
                      <tbody>
                        {(() => {
                          // Apply multi-sort to each split group as well
                          const rows = [...g.rows];
                          const sorts = visibleHeaders
                            .map(h => ({ col: h, mode: columnStyles[h]?.sort || 'none' }))
                            .filter(s => s.mode && s.mode !== 'none');
                          if (sorts.length) {
                            const toNum = (v) => {
                              if (typeof v === 'number') return v;
                              const n = parseFloat(v);
                              return isNaN(n) ? null : n;
                            };
                            const cmp = (a, b, mode, col) => {
                              const numeric = mode.includes('numbers');
                              const asc = mode.startsWith('up');
                              let av = a[col];
                              let bv = b[col];
                              if (numeric) {
                                const an = toNum(av);
                                const bn = toNum(bv);
                                if (an === null && bn === null) return 0;
                                if (an === null) return asc ? 1 : -1;
                                if (bn === null) return asc ? -1 : 1;
                                return asc ? an - bn : bn - an;
                              }
                              if (av == null && bv == null) return 0;
                              if (av == null) return asc ? 1 : -1;
                              if (bv == null) return asc ? -1 : 1;
                              const res = String(av).localeCompare(String(bv));
                              return asc ? res : -res;
                            };
                            rows.sort((a, b) => {
                              for (const s of sorts) {
                                const r = cmp(a, b, s.mode, s.col);
                                if (r !== 0) return r;
                              }
                              return 0;
                            });
                          }
                          return rows;
                        })().map((row, index) => (
                          <tr key={row._id || row._gid || index} className={styles.row}>
                            {showRowNumbers && (
                              <td className={`${styles.cell} ${styles.stickyCell} ${styles.rowNoCell}`} style={{ left: 0, textAlign: 'right' }}>
                                {index + 1}
                              </td>
                            )}
                            {visibleHeaders.map(header => (
                              <td
                                key={`${index}-${header}`}
                                className={`${styles.cell} ${isPinnedHeader(header) ? styles.stickyCell : ''} ${isPinnedLast(header) ? styles.pinnedDivider : ''}`}
                                style={isPinnedHeader(header) ? { ...getColumnStyle(header), left: `${pinnedOffsets[header] || 0}px` } : getColumnStyle(header)}
                                title={columnStyles[header]?.noWrap ? row[header] : undefined}
                              >
                                {formatNumberForDisplay(header, row[header])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReactTableCSV;
