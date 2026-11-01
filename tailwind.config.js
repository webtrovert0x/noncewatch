/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4f9',
          100: '#dce5f1',
          200: '#bed0e6',
          300: '#94b3d6',
          400: '#6390c2',
          500: '#4172ad',
          600: '#305891',
          700: '#274676',
          800: '#1e355c',
          900: '#0f1c32',
          950: '#0a1220',
        },
        brand: {
          primary: '#0f1c32',     // Deep Navy
          accent: '#1e40af',      // Classic Navy Blue
          light: '#3b82f6',       // Bright Accent Blue
          surface: '#f8fafc',     // Crisp background
          card: '#ffffff',        // Clean white
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

