import React, { useState, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Filter,
  X,
  Search,
  List,
  WrapText,
  EyeOff,
  GripVertical,
  Pin,
  PinOff,
  Settings as SettingsIcon,
  Scissors,
} from 'lucide-react';
import FilterDropdown from './FilterDropdown';
import styles from '../ReactTableCsv.module.css';
import sortRows from '../utils/sortRows';

const isIntegerString = (s) => typeof s === 'string' && /^\s*-?\d+\s*$/.test(s);
const coerceToBigInt = (v) => {
  if (typeof v === 'bigint') return v;
  if (typeof v === 'number' && Number.isInteger(v)) return BigInt(v);
  if (isIntegerString(v)) return BigInt(v.trim());
  return null;
};
const coerceToNumber = (v) => {
  if (typeof v === 'number') return Number.isNaN(v) ? null : v;
  if (typeof v === 'bigint') {
    const abs = v < 0n ? -v : v;
    return abs <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : null;
  }
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return Number.isNaN(n) ? null : n;
  }
  return null;
};
const compareValues = (a, b) => {
  if (a === b) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  const ai = coerceToBigInt(a);
  const bi = coerceToBigInt(b);
  if (ai !== null && bi !== null) return ai < bi ? -1 : ai > bi ? 1 : 0;
  const an = coerceToNumber(a);
  const bn = coerceToNumber(b);
  if (an !== null && bn !== null) return an - bn;
  return String(a).localeCompare(String(b));
};

const DataTable = ({
  data,
  originalHeaders,
  columnStyles,
  columnOrder,
  setColumnOrder,
  hiddenColumns,
  filters,
  setFilters,
  filterMode,
  setFilterMode,
  dropdownFilters,
  setDropdownFilters,
  showFilterRow,
  showRowNumbers,
  isCustomize,
  selectedColumn,
  setSelectedColumn,
  showStylePanel,
  setShowStylePanel,
  updateColumnStyle,
  toggleColumnVisibility,
  pinnedAnchor,
  setPinnedAnchor,
  tableMaxHeight,
  fontSize,
  onDataProcessed,
}) => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [pinnedOffsets, setPinnedOffsets] = useState({});
  const [headerHeight, setHeaderHeight] = useState(0);
  const [resizing, setResizing] = useState(null); // { col, startX, startWidth }
  const headerRefs = useRef({});
  const rowNumHeaderRef = useRef(null);
  const tableWrapRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const rowHeight = useMemo(() => Math.max(24, fontSize + 16), [fontSize]);
  const overscan = 10;
  const wrapStyle =
    tableMaxHeight && tableMaxHeight !== 'unlimited'
      ? { maxHeight: tableMaxHeight, overflowY: 'auto' }
      : {};

  const visibleHeaders = useMemo(() => {
    return columnOrder.filter(header => !hiddenColumns.has(header));
  }, [columnOrder, hiddenColumns]);

  // Infer column types when style type is 'auto'
  const inferredTypeMap = useMemo(() => {
    const map = {};
    for (const h of originalHeaders) {
      let hasAny = false;
      let allStrings = true;
      let allNumbers = true;
      let allIntegers = true;
      for (const row of data) {
        const v = row[h];
        if (v === '' || v === null || v === undefined) continue;
        hasAny = true;
        const t = typeof v;
        if (t === 'string') {
          allNumbers = false;
        } else if (t === 'number') {
          allStrings = false;
          if (!Number.isFinite(v)) { allNumbers = false; allIntegers = false; }
          else if (!Number.isInteger(v)) { allIntegers = false; }
        } else if (t === 'bigint') {
          allStrings = false;
        } else {
          allStrings = false;
          allNumbers = false;
          allIntegers = false;
        }
      }
      if (!hasAny) {
        map[h] = 'text';
      } else if (allStrings) {
        map[h] = 'text';
      } else if (allNumbers && !allIntegers) {
        map[h] = 'number';
      } else if (allNumbers && allIntegers) {
        map[h] = 'integer';
      } else {
        map[h] = 'text';
      }
    }
    return map;
  }, [data, originalHeaders]);

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

  const handleDragStart = (e, header) => {
    if (resizing) return; // ignore reorder while resizing
    setDraggedColumn(header);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e, header) => {
    e.preventDefault();
    if (!resizing && draggedColumn && draggedColumn !== header) {
      setDragOverColumn(header);
    }
  };
  const handleDragLeave = () => setDragOverColumn(null);
  const handleDrop = (e, targetHeader) => {
    e.preventDefault();
    if (draggedColumn && draggedColumn !== targetHeader) {
      const newOrder = [...columnOrder];
      const draggedIndex = newOrder.indexOf(draggedColumn);
      const targetIndex = newOrder.indexOf(targetHeader);
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

  // Column resizing handlers
  const MIN_COL_PX = 60;
  const startResize = (e, col) => {
    try {
      e.preventDefault();
      e.stopPropagation();
    } catch (err) {
      // Some environments (tests, older browsers) may not support these methods
    }
    const th = headerRefs.current[col];
    const startWidth = th ? th.getBoundingClientRect().width : 0;
    setResizing({ col, startX: e.clientX, startWidth });
    // Visual cursor feedback
    document.body.style.cursor = 'col-resize';
  };
  useEffect(() => {
    if (!resizing) return;
    const onMove = (e) => {
      const dx = e.clientX - resizing.startX;
      const next = Math.max(MIN_COL_PX, Math.round(resizing.startWidth + dx));
      updateColumnStyle(resizing.col, 'width', `${next}px`);
    };
    const onUp = () => {
      setResizing(null);
      document.body.style.cursor = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp, { once: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
    };
  }, [resizing, updateColumnStyle]);

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

  const toggleFilterMode = (column) => {
    const newMode = filterMode[column] === 'dropdown' ? 'text' : 'dropdown';
    setFilterMode(prev => ({
      ...prev,
      [column]: newMode
    }));
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

  const effectiveType = (column) => {
    const declared = columnStyles[column]?.type || 'auto';
    if (declared && declared !== 'auto') return declared;
    return inferredTypeMap[column] || 'text';
  };

  const getColumnStyle = (column) => {
    const s = columnStyles[column] || {};
    const type = effectiveType(column);
    const defaultAlign = (type === 'number' || type === 'integer') ? 'right' : 'left';
    const style = {
      color: s.color || 'inherit',
      fontWeight: s.bold ? 'bold' : 'normal',
      textAlign: s.align || defaultAlign,
      width: s.width || 'auto',
      minWidth: s.width || 'auto',
      maxWidth: s.width || 'none',
      whiteSpace: s.noWrap ? 'nowrap' : 'normal',
      overflow: s.noWrap ? 'hidden' : 'visible',
      textOverflow: s.noWrap ? 'ellipsis' : 'clip',
    };
    if (s.backgroundColor) {
      style.backgroundColor = s.backgroundColor;
    }
    return style;
  };

  const getHeaderStyle = (column) => {
    const s = columnStyles[column] || {};
    const type = effectiveType(column);
    const defaultAlign = (type === 'number' || type === 'integer') ? 'right' : 'left';
    return {
      textAlign: s.align || defaultAlign,
      width: s.width || 'auto',
      minWidth: s.width || 'auto',
      maxWidth: s.width || 'none',
      whiteSpace: s.noWrap ? 'nowrap' : 'normal',
      overflow: s.noWrap ? 'hidden' : 'visible',
      textOverflow: s.noWrap ? 'ellipsis' : 'clip',
    };
  };

  const formatNumberForDisplay = (header, value) => {
    const declaredType = columnStyles[header]?.type || 'auto';
    const type = effectiveType(header);
    const n = typeof value === 'number' ? value : parseFloat(value);
    const isNumber = (declaredType === 'number' || declaredType === 'integer') || (!isNaN(n) && declaredType !== 'text' && (type === 'number' || type === 'integer'));
    // Default number formats if none specified
    let fmt = columnStyles[header]?.numFormat || 'general';
    if (fmt === 'general' && isNumber) {
      fmt = type === 'integer' ? 'thousand' : 'thousand2';
    }
    if (!isNumber) return value;

    const abs = Math.abs(n);
    const neg = n < 0;
    const make = (opts) => new Intl.NumberFormat(undefined, { useGrouping: true, ...opts }).format;

    let text = String(value);
    switch (fmt) {
      case 'int':
        text = make({ useGrouping: false, minimumFractionDigits: 0, maximumFractionDigits: 0 })(n);
        break;
      case 'fixed2':
        text = make({ useGrouping: false, minimumFractionDigits: 2, maximumFractionDigits: 2 })(n);
        break;
      case 'thousand':
        text = make({ minimumFractionDigits: 0, maximumFractionDigits: 0 })(n);
        break;
      case 'thousand2':
        text = make({ minimumFractionDigits: 2, maximumFractionDigits: 2 })(n);
        break;
      case 'currency':
        text = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);
        break;
      case 'currency-red':
        text = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);
        return <span style={{ color: neg ? '#b91c1c' : 'inherit' }}>{text}</span>;
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
      default:
        return value;
    }
    return text;
  };

  const uniqueValues = useMemo(() => {
    const result = {};
    originalHeaders.forEach(header => {
      const values = new Set();
      data.forEach(row => {
        const val = row[header];
        if (val !== undefined && val !== null && val !== '') values.add(val);
      });
      result[header] = Array.from(values).sort(compareValues);
    });
    return result;
  }, [data, originalHeaders]);

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

    const textFns = Object.entries(filters)
      .map(([key, value]) => {
        if (!value) return null;
        const parsed = parseOp(value);
        const declaredType = columnStyles[key]?.type || 'auto';
        const effType = declaredType === 'auto' ? (inferredTypeMap[key] || 'text') : declaredType;
        const mode = (effType === 'number' || effType === 'integer') ? 'number' : 'text';
        const lower = String(value).toLowerCase();
        if (!parsed) {
          return (row) => String(row[key] ?? '').toLowerCase().includes(lower);
        }
        const { op, rhs } = parsed;
        return (row) => cmp(op, row[key], rhs, mode);
      })
      .filter(Boolean);

    const dropdownFns = Object.entries(dropdownFilters)
      .map(([key, selectedSet]) => {
        if (!selectedSet || selectedSet.size === 0) return null;
        return (row) => selectedSet.has(row[key]);
      })
      .filter(Boolean);

    if (textFns.length === 0 && dropdownFns.length === 0) return data;

    return data.filter((row) =>
      textFns.every((fn) => fn(row)) && dropdownFns.every((fn) => fn(row))
    );
  }, [data, filters, dropdownFilters, columnStyles, inferredTypeMap]);

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
      row._gid = key;
      out.push(row);
    }
    return out;
  }, [filteredData, originalHeaders, groupByColumns, reducersForColumn]);

  const displayedRows = groupByColumns.length > 0 ? groupedData : filteredData;

  const sortedRows = useMemo(
    () => sortRows(displayedRows, visibleHeaders, columnStyles),
    [displayedRows, visibleHeaders, columnStyles]
  );

  useLayoutEffect(() => {
    const el = tableWrapRef.current;
    if (el) {
      setContainerHeight(el.clientHeight);
    }
  }, [sortedRows, tableMaxHeight]);

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(
    sortedRows.length,
    Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan
  );
  const visibleRowsSlice = sortedRows.slice(startIndex, endIndex);
  const topPadding = startIndex * rowHeight;
  const bottomPadding = (sortedRows.length - endIndex) * rowHeight;

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

  useLayoutEffect(() => {
    const ref = showRowNumbers ? rowNumHeaderRef.current : headerRefs.current[visibleHeaders[0]];
    if (ref) {
      setHeaderHeight(ref.getBoundingClientRect().height);
    }
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
  }, [visibleHeaders, columnStyles, pinnedIndex, data, showFilterRow, showRowNumbers, isCustomize, selectedColumn]);

  useEffect(() => {
    const onResize = () => {
      if (pinnedIndex >= 0) {
        let left = showRowNumbers
          ? (rowNumHeaderRef.current ? rowNumHeaderRef.current.getBoundingClientRect().width : 0)
          : 0;
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
      const ref = showRowNumbers ? rowNumHeaderRef.current : headerRefs.current[visibleHeaders[0]];
      if (ref) {
        setHeaderHeight(ref.getBoundingClientRect().height);
      }
      if (tableWrapRef.current) {
        setContainerHeight(tableWrapRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [visibleHeaders, pinnedIndex, showRowNumbers, isCustomize]);

  useEffect(() => {
    if (onDataProcessed) {
      onDataProcessed({ visibleHeaders, rows: sortedRows });
    }
  }, [onDataProcessed, visibleHeaders, sortedRows]);

  return (
    <>
      {(!splitGroups || splitGroups.length === 0) ? (
        <div
          className={styles.tableWrap}
          style={wrapStyle}
          ref={tableWrapRef}
          onScroll={handleScroll}
        >
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
                    draggable={isCustomize && !resizing}
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
                            onClick={(isCustomize || showFilterRow) ? () => toggleHeaderSort(header) : undefined}
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
                          )}
                          {(isCustomize || showFilterRow) && (
                            <div className={styles.sortIcons}>
                              <ChevronUp size={12} className={isSortAsc(header) ? styles.sortActive : styles.sortInactive} />
                              <ChevronDown size={12} className={isSortDesc(header) ? styles.sortActive : styles.sortInactive} style={{ marginTop: '-3px' }} />
                            </div>
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
                      {isCustomize && (
                        <div
                          className={styles.colResizer}
                          onMouseDown={(e) => startResize(e, header)}
                          onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          role="separator"
                          aria-orientation="vertical"
                          aria-label={`Resize column ${header}`}
                        />
                      )}
                    </div>
                  </th>
                ))}
              </tr>

              {showFilterRow && (
                <tr className={styles.filterRow}>
                  {showRowNumbers && (
                    <th
                      className={`${styles.filterCell} ${styles.stickyFilter} ${styles.rowNoHead}`}
                      style={{ left: 0, top: `${headerHeight}px` }}
                    />
                  )}
                  {visibleHeaders.map(header => (
                    <th
                      key={`filter-${header}`}
                      className={`${styles.filterCell} ${isPinnedHeader(header) ? styles.stickyFilter : ''} ${isPinnedLast(header) ? styles.pinnedDivider : ''}`}
                      style={isPinnedHeader(header)
                        ? { left: `${pinnedOffsets[header] || 0}px`, top: `${headerHeight}px` }
                        : { top: `${headerHeight}px` }}
                    >
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
                                <X size={12} />
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
                                <X size={12} />
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
              {topPadding > 0 && (
                <tr className={styles.virtualSpacer}>
                  <td
                    colSpan={visibleHeaders.length + (showRowNumbers ? 1 : 0)}
                    style={{ height: `${topPadding}px` }}
                  />
                </tr>
              )}
              {visibleRowsSlice.map((row, i) => {
                const index = startIndex + i;
                const alt = index % 2 === 1;
                return (
                  <tr
                    key={row._id || row._gid || index}
                    className={`${styles.row} ${alt ? styles.rowAlt : ''}`}
                    style={{ height: `${rowHeight}px` }}
                  >
                    {showRowNumbers && (
                      <td
                        className={`${styles.cell} ${styles.stickyCell} ${styles.rowNoCell}`}
                        style={{ left: 0, textAlign: 'right', fontSize: `${fontSize}px` }}
                      >
                        {index + 1}
                      </td>
                    )}
                    {visibleHeaders.map((header) => (
                      <td
                        key={`${index}-${header}`}
                        className={`${styles.cell} ${isPinnedHeader(header) ? styles.stickyCell : ''} ${isPinnedLast(header) ? styles.pinnedDivider : ''}`}
                        style={
                          isPinnedHeader(header)
                            ? { ...getColumnStyle(header), fontSize: `${fontSize}px`, left: `${pinnedOffsets[header] || 0}px` }
                            : { ...getColumnStyle(header), fontSize: `${fontSize}px` }
                        }
                        title={columnStyles[header]?.noWrap ? row[header] : undefined}
                      >
                        <div className={styles.valueText} style={{ fontSize: `${fontSize}px` }}>
                          {formatNumberForDisplay(header, row[header])}
                        </div>
                      </td>
                    ))}
                  </tr>
                );
              })}
              {bottomPadding > 0 && (
                <tr className={styles.virtualSpacer}>
                  <td
                    colSpan={visibleHeaders.length + (showRowNumbers ? 1 : 0)}
                    style={{ height: `${bottomPadding}px` }}
                  />
                </tr>
              )}
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
              <div className={styles.tableWrap} style={wrapStyle}>
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
                          draggable={isCustomize && !resizing}
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
                      {isCustomize && (
                        <div
                          className={styles.colResizer}
                          onMouseDown={(e) => startResize(e, header)}
                          onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          role="separator"
                          aria-orientation="vertical"
                          aria-label={`Resize column ${header}`}
                        />
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
                      const rows = sortRows([...g.rows], visibleHeaders, columnStyles);
                      return rows;
                    })().map((row, index) => (
                      <tr key={row._id || row._gid || index} className={styles.row}>
                        {showRowNumbers && (
                          <td
                            className={`${styles.cell} ${styles.stickyCell} ${styles.rowNoCell}`}
                            style={{ left: 0, textAlign: 'right', fontSize: `${fontSize}px` }}
                          >
                            {index + 1}
                          </td>
                        )}
                        {visibleHeaders.map(header => (
                          <td
                            key={`${index}-${header}`}
                            className={`${styles.cell} ${isPinnedHeader(header) ? styles.stickyCell : ''} ${isPinnedLast(header) ? styles.pinnedDivider : ''}`}
                            style={isPinnedHeader(header)
                              ? { ...getColumnStyle(header), fontSize: `${fontSize}px`, left: `${pinnedOffsets[header] || 0}px` }
                              : { ...getColumnStyle(header), fontSize: `${fontSize}px` }}
                            title={columnStyles[header]?.noWrap ? row[header] : undefined}
                          >
                            <div className={styles.valueText} style={{ fontSize: `${fontSize}px` }}>
                              {formatNumberForDisplay(header, row[header])}
                            </div>
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
    </>
  );
};

export default DataTable;
