/* eslint-env jest */
import { buildSettings } from '../settingsUtils';

describe('buildSettings', () => {
  it('builds settings from state', () => {
    const state = {
      currentTheme: 'dark',
      columnStyles: { col1: { width: 100 } },
      columnOrder: ['col1', 'col2'],
      hiddenColumns: new Set(['col2']),
      filters: { col1: 'foo' },
      dropdownFilters: { col2: new Set(['a', 'b']) },
      filterMode: { col1: 'contains' },
      showFilterRow: true,
      pinnedAnchor: 'col1',
      showRowNumbers: true,
      customize: true,
    };
    expect(buildSettings(state)).toMatchSnapshot();
  });

  it('converts dropdown filters to arrays', () => {
    const state = {
      currentTheme: 'lite',
      columnStyles: {},
      columnOrder: [],
      hiddenColumns: new Set(),
      filters: {},
      dropdownFilters: { col1: new Set(['x']) },
      filterMode: {},
      showFilterRow: false,
      pinnedAnchor: null,
      showRowNumbers: false,
      customize: false,
    };
    const result = buildSettings(state);
    expect(Array.isArray(result.dropdownFilters.col1)).toBe(true);
    expect(result.dropdownFilters.col1).toEqual(['x']);
  });
});

