/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: '#faf6f1',
          100: '#f0e6d9',
          200: '#e0cbb5',
          300: '#c9a882',
          400: '#b48658',
          500: '#8b5a2b',
          600: '#6f4e37',
          700: '#5a3f2e',
          800: '#4a3428',
          900: '#3e2d24'
        },
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          700: '#1d4ed8',
          900: '#1e3a8a'
        }
      },
      boxShadow: {
        soft: '0 10px 40px rgba(30, 58, 138, 0.12)'
      }
    }
  },
  plugins: []
};
