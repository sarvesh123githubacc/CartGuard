/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cg: {
          bg: '#0B0F14',
          panel: '#111820',
          'panel-2': '#151E28',
          border: '#1E2A36',
          text: '#E6EDF3',
          muted: '#8B98A5',
          safe: '#3DDC97',
          danger: '#F0616D',
          warn: '#F5B84B',
          accent: '#4CC9F0',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '12px',
        xl: '12px',
      }
    },
  },
  plugins: [],
}
