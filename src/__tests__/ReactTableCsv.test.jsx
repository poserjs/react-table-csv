/* eslint-env jest */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
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
});
