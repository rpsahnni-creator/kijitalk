/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
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
      },
    },
  },
  plugins: [],
};
