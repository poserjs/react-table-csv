/* eslint-env jest */
import { THEMES, cycleTheme } from '../themeUtils';

describe('cycleTheme', () => {
  it('returns next theme for each theme', () => {
    THEMES.forEach((theme, idx) => {
      const expected = THEMES[(idx + 1) % THEMES.length];
      expect(cycleTheme(theme)).toBe(expected);
    });
  });

  it('wraps around from last theme to first', () => {
    const last = THEMES[THEMES.length - 1];
    expect(cycleTheme(last)).toBe(THEMES[0]);
  });
});

