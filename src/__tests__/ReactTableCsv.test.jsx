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
});
