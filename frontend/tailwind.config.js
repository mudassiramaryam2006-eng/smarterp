/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // SmartERP "console" palette — a modernized take on Tally's classic
        // blue terminal screen with an amber function-key accent.
        console: {
          bg: '#0B1D33',
          panel: '#0F2743',
          panel2: '#14304F',
          border: '#1E3A5C',
          text: '#E9F1FC',
          muted: '#8CA3C2',
        },
        amber: {
          DEFAULT: '#F2B705',
          dim: '#B98C08',
        },
        cyan: {
          DEFAULT: '#4FD1C5',
          dim: '#2E9B90',
        },
        danger: '#FF6B6B',
        success: '#4ADE80',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
      },
      keyframes: {
        'flicker-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'flicker-in': 'flicker-in 120ms ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
