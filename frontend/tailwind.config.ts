import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Crimson (#DC143C) — primary brand color
        brand: {
          50: '#fff0f3',
          100: '#ffdde4',
          200: '#ffc0cd',
          300: '#ff91a7',
          400: '#fb5274',
          500: '#f02a52',
          600: '#dc143c',
          700: '#b80d30',
          800: '#990f2e',
          900: '#82112d',
          950: '#480313',
        },
        // DarkGreen (#006400) — secondary color
        leaf: {
          50: '#effbef',
          100: '#d8f5d8',
          200: '#b2eab3',
          300: '#7dd87f',
          400: '#45bd49',
          500: '#22a127',
          600: '#12801a',
          700: '#006400',
          800: '#055109',
          900: '#07420b',
          950: '#012503',
          DEFAULT: '#006400',
        },
        // Yellow (#FFFF00) — accent color. Use 300–400 as fills with dark text;
        // the darker olive shades keep yellow-family text readable on white.
        accent: {
          50: '#ffffe6',
          100: '#ffffbf',
          200: '#ffff85',
          300: '#ffff33',
          400: '#ffff00',
          500: '#e5e500',
          600: '#a8a300',
          700: '#7a7600',
          800: '#5c5900',
          900: '#3d3b00',
          950: '#242300',
        },
        // "Correct"/success feedback uses the same DarkGreen family.
        success: {
          50: '#effbef',
          100: '#d8f5d8',
          200: '#b2eab3',
          300: '#7dd87f',
          400: '#45bd49',
          500: '#22a127',
          600: '#12801a',
          700: '#006400',
          800: '#055109',
          900: '#07420b',
          950: '#012503',
          DEFAULT: '#22a127',
        },
        primary: {
          DEFAULT: '#dc143c',
          dark: '#b80d30',
          light: '#f02a52',
        },
        secondary: { DEFAULT: '#006400' },
        warning: { DEFAULT: '#e5e500' },
        error: { DEFAULT: '#EF4444' },
        info: { DEFAULT: '#006400' },
        surface: {
          light: '#FFFFFF',
          dark: '#14060a',
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
        'card-hover': '0 10px 30px -12px rgba(153,15,46,0.28)',
        'card-dark': '0 4px 24px rgba(0,0,0,0.3)',
        glow: '0 0 0 6px rgba(220,20,60,0.12)',
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
