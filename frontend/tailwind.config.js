/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ink: '#0A0A0F',
        surface: '#111118',
        panel: '#1A1A24',
        border: '#2A2A38',
        accent: '#7C6AF7',
        'accent-glow': '#A89BFA',
        live: '#22C55E',
        caption: '#E8E6FF',
        muted: '#6B6B8A',
      },
    },
  },
  plugins: [],
};