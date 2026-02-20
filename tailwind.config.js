/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#454dcc',
          dim: '#373ea3',
        },
        forge: {
          bg: '#0B0D12',
          surface: '#141821',
          elevated: '#1A1F2E',
          border: '#1E2230',
          muted: '#A1A1AA',
          secondary: '#7C3AED',
          'secondary-text': '#C4B5FD',
        },
      },
    },
  },
  plugins: [],
};
