/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
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
        },
      },
    },
  },
  plugins: [],
};
