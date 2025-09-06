import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(214.3 31.8% 91.4%)',
        input: 'hsl(214.3 31.8% 91.4%)',
        ring: 'hsl(215 20.2% 65.1%)',
        background: 'hsl(210 20% 98%)',
        foreground: 'hsl(222.2 47.4% 11.2%)',
        primary: {
          DEFAULT: 'hsl(221.2 83.2% 53.3%)',
          foreground: 'white',
        },
        muted: {
          DEFAULT: 'hsl(210 40% 96.1%)',
          foreground: 'hsl(215.4 16.3% 46.9%)',
        },
      },
      borderRadius: {
        lg: '0.5rem',
      },
    },
  },
  plugins: [],
} satisfies Config

