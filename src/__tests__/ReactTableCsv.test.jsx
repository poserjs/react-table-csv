/* eslint-env jest */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReactTableCSV from '../ReactTableCsv';

describe('ReactTableCSV', () => {
  it('renders row and column info', () => {
    const csvData = {
      headers: ['id', 'name'],
      data: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ]
    };

    render(<ReactTableCSV csvData={csvData} />);

    expect(
      screen.getByText('Showing 2 of 2 rows | 2 of 2 columns')
    ).toBeInTheDocument();
  });

  it('saves theme changes to localStorage', async () => {
    const storageKey = 'theme-test';
    window.localStorage.removeItem(storageKey);
    const csvData = {
      headers: ['id', 'name'],
      data: [
        { id: 1, name: 'Alice' },
      ]
    };

    render(<ReactTableCSV csvData={csvData} storageKey={storageKey} />);

    fireEvent.click(screen.getByText('Customize'));
    fireEvent.click(screen.getByText('Settings'));
    fireEvent.click(screen.getByText(/Theme:/));

    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) || '{}');
      expect(saved.theme).toBeDefined();
      expect(saved.theme).toBe('dark');
    });
  });

  it('resets toggles to default values', () => {
    const csvData = {
      headers: ['id', 'name'],
      data: [
        { id: 1, name: 'Alice' },
      ],
    };

    render(<ReactTableCSV csvData={csvData} />);

    const customizeCheckbox = screen.getByLabelText('Customize');
    fireEvent.click(customizeCheckbox);

    fireEvent.click(screen.getByText('Show Filters'));
    fireEvent.click(screen.getByText('Settings'));

    fireEvent.click(screen.getByText('Reset Settings'));

    expect(customizeCheckbox).not.toBeChecked();

    fireEvent.click(customizeCheckbox);

    expect(screen.getByText('Show Filters')).toBeInTheDocument();
    expect(screen.queryByText('Hide Filters')).not.toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.queryByText('Hide Settings')).not.toBeInTheDocument();
  });

  it('respects the collapsed prop and toggles', () => {
    const csvData = {
      headers: ['id', 'name'],
      data: [
        { id: 1, name: 'Alice' },
      ],
    };

    render(<ReactTableCSV csvData={csvData} title="Sample" collapsed />);

    // Table content rendered but hidden initially
    const info = screen.getByText('Showing 1 of 1 rows | 2 of 2 columns');
    expect(info).not.toBeVisible();

    // Expand and expect content to be visible
    fireEvent.click(screen.getByText('Expand'));
    expect(info).toBeVisible();
  });
});
