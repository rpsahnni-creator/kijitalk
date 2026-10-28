import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Deep green — primary brand color (from the KijiTalk logo)
        brand: {
          50: '#eefcf1',
          100: '#d7f7e0',
          200: '#aeedc1',
          300: '#7adf9c',
          400: '#46c727',
          500: '#2fa233',
          600: '#157a37',
          700: '#0f5c2a',
          800: '#0b4620',
          900: '#073018',
          950: '#041f0d',
        },
        // Yellow — secondary/accent color (from the KijiTalk logo)
        accent: {
          50: '#fffaeb',
          100: '#fff3c4',
          200: '#ffe58a',
          300: '#ffd54f',
          400: '#fdc403',
          500: '#e0ad00',
          600: '#b88e00',
          700: '#8f6e00',
          800: '#6b5300',
          900: '#473700',
          950: '#2e2400',
        },
        primary: {
          DEFAULT: '#157a37',
          dark: '#0f5c2a',
          light: '#2fa233',
        },
        secondary: { DEFAULT: '#fdc403' },
        success: { DEFAULT: '#2fa233' },
        warning: { DEFAULT: '#e0ad00' },
        error: { DEFAULT: '#EF4444' },
        info: { DEFAULT: '#2fa233' },
        surface: {
          light: '#FFFFFF',
          dark: '#07140d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cal Sans', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.08)',
        'card-dark': '0 4px 24px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
};

export default config;
