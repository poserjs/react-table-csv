/* eslint-env jest */
import { parseCSV, normalizeParsed } from '../csv';

describe('csv utils', () => {
  test('parseCSV trims headers and applies dynamic typing', () => {
    const csv = ' name , age \n Alice , 30 \n Bob , 25 \n';
    const { headers, data } = parseCSV(csv);
    expect(headers).toEqual(['name', 'age']);
    expect(data).toEqual([
      { name: 'Alice', age: 30, _id: 1 },
      { name: 'Bob', age: 25, _id: 2 },
    ]);
    expect(typeof data[0].age).toBe('number');
  });

  test('parseCSV replaces missing values with empty strings', () => {
    const csv = 'name,age\nAlice,30\nBob,\n';
    const { data } = parseCSV(csv);
    expect(data[1].age).toBe('');
  });

  test('normalizeParsed replaces null/undefined with empty strings and sequences _id', () => {
    const parsed = {
      headers: ['name', 'age'],
      data: [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: null },
        { name: 'Eve' },
      ],
    };
    const { data } = normalizeParsed(parsed);
    expect(data).toEqual([
      { name: 'Alice', age: 30, _id: 1 },
      { name: 'Bob', age: '', _id: 2 },
      { name: 'Eve', age: '', _id: 3 },
    ]);
  });
});
