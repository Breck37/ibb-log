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
          bg: 'rgb(var(--forge-bg) / <alpha-value>)',
          surface: 'rgb(var(--forge-surface) / <alpha-value>)',
          elevated: 'rgb(var(--forge-elevated) / <alpha-value>)',
          border: 'rgb(var(--forge-border) / <alpha-value>)',
          muted: 'rgb(var(--forge-muted) / <alpha-value>)',
          text: 'rgb(var(--forge-text) / <alpha-value>)',
          secondary: '#7C3AED',
          'secondary-text': 'rgb(var(--forge-secondary-text) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
};
