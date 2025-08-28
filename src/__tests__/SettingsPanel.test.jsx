/* eslint-env jest */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import SettingsPanel from '../components/SettingsPanel';

const noop = () => {};

describe('SettingsPanel', () => {
  it('shows column position when a column is selected', () => {
    render(
      <SettingsPanel
        showStylePanel
        selectedColumn="id"
        columnStyles={{}}
        setSelectedColumn={noop}
        updateColumnStyle={noop}
        hiddenColumns={new Set()}
        toggleColumnVisibility={noop}
        setPinnedAnchor={noop}
        visibleHeaders={['id', 'name']}
        pinnedIndex={-1}
        cycleTheme={noop}
        currentTheme="lite"
        originalHeaders={['id', 'name']}
        showRowNumbers={false}
        setShowRowNumbers={noop}
        buildSettings={() => ({})}
        applySettings={noop}
        storageKey="test"
        tableMaxHeight="unlimited"
        setTableMaxHeight={noop}
        tableMaxWidth="unlimited"
        setTableMaxWidth={noop}
        fontSize={13}
        setFontSize={noop}
      />
    );

    expect(screen.getByText('Position: #1 of 2')).toBeInTheDocument();
  });
});
