export const SETTINGS_VERSION = '0.1';

export const buildSettings = ({
  currentTheme,
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
  tableMaxHeight,
  tableMaxWidth,
  fontSize,
}) => {
  const dropdown = {};
  if (dropdownFilters && typeof dropdownFilters === 'object') {
    Object.entries(dropdownFilters).forEach(([k, v]) => {
      dropdown[k] = Array.from(v || []);
    });
  }
  return {
    version: SETTINGS_VERSION,
    theme: currentTheme,
    columnStyles,
    columnOrder,
    hiddenColumns: Array.from(hiddenColumns || []),
    filters,
    dropdownFilters: dropdown,
    filterMode,
    showFilterRow,
    pinnedAnchor,
    showRowNumbers,
    customize,
    tableMaxHeight,
    tableMaxWidth,
    fontSize,
  };
};

