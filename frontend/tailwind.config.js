import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f4f6f2',
          100: '#e8ede4',
          200: '#d2dcc9',
          300: '#b3c4a6',
          400: '#93a983',
          500: '#7A8B6A',
          600: '#617254',
          700: '#4d5a43',
          800: '#3d4736',
          900: '#2f372a',
        },
        sage: '#7A8B6A',
        terracotta: {
          50: '#faf3ef',
          100: '#f3e4da',
          200: '#e6c5b3',
          300: '#d6a086',
          400: '#cd8264',
          500: '#C4775A',
          600: '#a85f44',
          700: '#8a4c38',
          800: '#6d3d2e',
          900: '#553227',
        },
        cream: '#F7F3EA',
        espresso: '#2F2925',
        ivory: '#FFFDF8',
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Lexend"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06)',
      },
    },
  },
  plugins: [typography],
};
