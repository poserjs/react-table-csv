/* eslint-env jest */
import '@testing-library/jest-dom';
import React from 'react';
import { render } from '@testing-library/react';
import DataTable from '../components/DataTable';

describe('DataTable filtering', () => {
  it('handles null and undefined values without throwing', () => {
    const props = {
      data: [
        { id: null, name: 'Alice' },
        { id: undefined, name: 'Bob' },
        { id: 3, name: 'Carl' }
      ],
      originalHeaders: ['id', 'name'],
      columnStyles: {},
      columnOrder: ['id', 'name'],
      setColumnOrder: jest.fn(),
      hiddenColumns: new Set(),
      filters: { id: '3' },
      setFilters: jest.fn(),
      filterMode: {},
      setFilterMode: jest.fn(),
      dropdownFilters: {},
      setDropdownFilters: jest.fn(),
      showFilterRow: true,
      showRowNumbers: false,
      isCustomize: false,
      selectedColumn: null,
      setSelectedColumn: jest.fn(),
      showStylePanel: false,
      setShowStylePanel: jest.fn(),
      updateColumnStyle: jest.fn(),
      toggleColumnVisibility: jest.fn(),
      pinnedAnchor: null,
      setPinnedAnchor: jest.fn(),
      onDataProcessed: jest.fn(),
    };

    expect(() => render(<DataTable {...props} />)).not.toThrow();
  });
});
