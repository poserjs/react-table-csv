import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

const SETTINGS_VERSION = '0.1';
const THEMES = ['lite', 'dark', 'solarized', 'dracula', 'monokai', 'gruvbox'];

const useTableState = ({
  originalHeaders = [],
  storageKey,
  defaultSettings,
  customize,
  setCustomize,
}) => {
  const [currentTheme, setCurrentTheme] = useState('lite');
  const cycleTheme = () => {
    const idx = THEMES.indexOf(currentTheme);
    const next = THEMES[(idx + 1) % THEMES.length];
    setCurrentTheme(next);
  };

  const [filters, setFilters] = useState({});
  const [showFilterRow, setShowFilterRow] = useState(false);
  const [columnStyles, setColumnStyles] = useState({});
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [filterMode, setFilterMode] = useState({});
  const [dropdownFilters, setDropdownFilters] = useState({});
  const [columnOrder, setColumnOrder] = useState([]);
  const [hiddenColumns, setHiddenColumns] = useState(new Set());
  const [pinnedAnchor, setPinnedAnchor] = useState(null);
  const [showRowNumbers, setShowRowNumbers] = useState(false);
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

  const toggleColumnVisibility = (column) => {
    const newHidden = new Set(hiddenColumns);
    if (newHidden.has(column)) {
      newHidden.delete(column);
    } else {
      newHidden.add(column);
    }
    setHiddenColumns(newHidden);
  };

  const updateColumnStyle = (column, styleType, value) => {
    setColumnStyles((prev) => ({
      ...prev,
      [column]: {
        ...prev[column],
        [styleType]: value,
      },
    }));
  };

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
      customize,
    };
  }, [
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
  ]);

  const applySettings = useCallback(
    (s) => {
      try {
        if (!s || typeof s !== 'object') return;
        if (s.columnStyles) setColumnStyles(s.columnStyles);
        if (Array.isArray(s.columnOrder)) {
          const filtered = s.columnOrder.filter((h) =>
            originalHeaders.includes(h)
          );
          const missing = originalHeaders.filter((h) => !filtered.includes(h));
          setColumnOrder([...filtered, ...missing]);
        }
        if (Array.isArray(s.hiddenColumns))
          setHiddenColumns(new Set(s.hiddenColumns.filter((h) => originalHeaders.includes(h))));
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
        if (typeof s.pinnedAnchor === 'string' || s.pinnedAnchor === null)
          setPinnedAnchor(s.pinnedAnchor);
        if (typeof s.showRowNumbers === 'boolean') setShowRowNumbers(s.showRowNumbers);
        if (typeof s.customize === 'boolean') setCustomize(s.customize);
        if (typeof s.theme === 'string') setCurrentTheme(s.theme);
        if (typeof s.editable === 'boolean' && typeof s.customize !== 'boolean')
          setCustomize(s.editable);
      } catch {
        // ignore
      }
    },
    [originalHeaders, setCustomize]
  );

  useEffect(() => {
    if (settingsRestoredRef.current) return;
    if (!originalHeaders || originalHeaders.length === 0) return;
    try {
      const json = window.localStorage.getItem(storageKey);
      if (json) {
        const parsed = JSON.parse(json);
        if (parsed.version === SETTINGS_VERSION) {
          applySettings(parsed);
        }
      }
      if (defaultSettingsObj) {
        applySettings(defaultSettingsObj);
      }
    } finally {
      settingsRestoredRef.current = true;
    }
  }, [originalHeaders, storageKey, applySettings, defaultSettingsObj]);

  useEffect(() => {
    if (!settingsRestoredRef.current) return;
    try {
      const s = buildSettings();
      const json = JSON.stringify(s);
      window.localStorage.setItem(storageKey, json);
    } catch {
      // ignore
    }
  }, [
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

  const resetSettings = () => {
    const initial = defaultSettingsObj
      ? { ...defaultSettingsObj }
      : {
          columnStyles: {},
          columnOrder: originalHeaders,
          hiddenColumns: [],
          filters: {},
          dropdownFilters: {},
          filterMode: {},
          showFilterRow: false,
          pinnedAnchor: null,
          showRowNumbers: false,
          theme: 'lite',
          customize: false,
        };

    if (typeof initial.customize !== 'boolean') initial.customize = false;

    applySettings(initial);
    setShowStylePanel(false);

    try {
      if (defaultSettingsObj) {
        window.localStorage.setItem(storageKey, JSON.stringify(initial));
      } else {
        window.localStorage.removeItem(storageKey);
      }
    } catch {
      /* ignore */
    }

    return initial;
  };

  return {
    filters,
    setFilters,
    showFilterRow,
    setShowFilterRow,
    columnStyles,
    setColumnStyles,
    showStylePanel,
    setShowStylePanel,
    selectedColumn,
    setSelectedColumn,
    filterMode,
    setFilterMode,
    dropdownFilters,
    setDropdownFilters,
    columnOrder,
    setColumnOrder,
    hiddenColumns,
    toggleColumnVisibility,
    pinnedAnchor,
    setPinnedAnchor,
    showRowNumbers,
    setShowRowNumbers,
    currentTheme,
    cycleTheme,
    tableState,
    setTableState,
    pinnedIndex,
    clearAllFilters,
    updateColumnStyle,
    buildSettings,
    applySettings,
    resetSettings,
  };
};

export default useTableState;

