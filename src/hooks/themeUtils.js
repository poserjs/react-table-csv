export const THEMES = ['lite', 'dark', 'solarized', 'dracula', 'monokai', 'gruvbox'];

export const cycleTheme = (currentTheme) => {
  const idx = THEMES.indexOf(currentTheme);
  return THEMES[(idx + 1) % THEMES.length];
};

