/* eslint-env jest */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReactTableCSV from '../ReactTableCsv';

describe('ReactTableCSV', () => {
  it('displays row and column info in the header', () => {
    const csvData = {
      headers: ['id', 'name'],
      data: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ]
    };

    render(<ReactTableCSV csvData={csvData} title="Sample" />);

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

    fireEvent.click(screen.getByTitle('Toggle customize mode'));
    fireEvent.click(screen.getAllByTitle('Customize this column')[0]);
    fireEvent.click(screen.getByText(/Theme:/));

    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) || '{}');
      expect(saved.theme).toBeDefined();
      expect(saved.theme).toBe('dark');
    });
  });

  it('renders customize toggle in header', () => {
    const csvData = {
      headers: ['id', 'name'],
      data: [
        { id: 1, name: 'Alice' },
      ],
    };

    render(<ReactTableCSV csvData={csvData} title="Sample" />);

    expect(screen.getByTitle('Toggle customize mode')).toBeInTheDocument();
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
    const cell = screen.getByText('Alice');
    expect(cell).not.toBeVisible();

    // Expand and expect content to be visible
    fireEvent.click(screen.getByTitle('Expand'));
    expect(cell).toBeVisible();
  });

  it('allows sorting when filters are visible without customize mode', () => {
    const csvData = {
      headers: ['id'],
      data: [
        { id: 2 },
        { id: 1 },
      ],
    };

    render(<ReactTableCSV csvData={csvData} />);

    fireEvent.click(screen.getByTitle('Show Filters'));

    const rowsBefore = screen.getAllByRole('row');
    expect(rowsBefore[2]).toHaveTextContent('2');

    const idHeader = screen.getAllByText('id').find(el => el.tagName === 'SPAN');
    fireEvent.click(idHeader);

    const rowsAfter = screen.getAllByRole('row');
    expect(rowsAfter[2]).toHaveTextContent('1');
  });
});
