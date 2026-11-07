import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Wine — primary brand color
        brand: {
          50: '#fbeef3',
          100: '#f6dae3',
          200: '#eeb4c7',
          300: '#e283a2',
          400: '#d7517d',
          500: '#bf2c5c',
          600: '#952248',
          700: '#741b38',
          800: '#57142a',
          900: '#3a0d1c',
          950: '#250912',
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
        // Green — reserved for "correct"/"success" feedback only, kept independent
        // of brand so a wine (or any other) primary color never reads as an error.
        success: {
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
          DEFAULT: '#2fa233',
        },
        primary: {
          DEFAULT: '#952248',
          dark: '#741b38',
          light: '#bf2c5c',
        },
        secondary: { DEFAULT: '#fdc403' },
        warning: { DEFAULT: '#e0ad00' },
        error: { DEFAULT: '#EF4444' },
        info: { DEFAULT: '#952248' },
        surface: {
          light: '#FFFFFF',
          dark: '#1a0a10',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-inter)', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)',
        'card-hover': '0 10px 30px -12px rgba(87,20,42,0.25)',
        'card-dark': '0 4px 24px rgba(0,0,0,0.3)',
        glow: '0 0 0 6px rgba(191,44,92,0.12)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.3s ease-out both',
        'pulse-ring': 'pulse-ring 1.6s cubic-bezier(0.2,0.6,0.4,1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
