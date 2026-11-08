/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
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
        },
        // Yellow (#FFFF00) — accent. 300–400 as fills with dark text; darker
        // olive shades keep yellow-family text readable on white.
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
        },
      },
    },
  },
  plugins: [],
};
