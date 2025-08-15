/* eslint-env jest */
import { renderHook, act } from '@testing-library/react';
import useTableState from './useTableState';

describe('applySettings', () => {
  it('appends new headers to columnOrder when saved settings are missing them', () => {
    const saved = { columnOrder: ['b', 'a'] };
    const { result, rerender } = renderHook(
      (props) =>
        useTableState({
          ...props,
          storageKey: 'test',
          setCustomize: jest.fn(),
        }),
      {
        initialProps: { originalHeaders: ['a', 'b'] },
      }
    );

    act(() => {
      result.current.applySettings(saved);
    });
    expect(result.current.columnOrder).toEqual(['b', 'a']);

    rerender({ originalHeaders: ['a', 'b', 'c'] });

    act(() => {
      result.current.applySettings(saved);
    });
    expect(result.current.columnOrder).toEqual(['b', 'a', 'c']);
  });
});

