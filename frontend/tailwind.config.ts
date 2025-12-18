import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        megga: {
          midnight: '#0c0d12',
          surface: '#111218',
          navy: '#141821',
          purple: '#1a1c25',
          indigo: '#1e2633',
          magenta: '#1f2a3a',
          teal: '#1ea7a4',
          lime: '#19c37d',
          yellow: '#f7b500',
          rose: '#d14f7a',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 25px 65px -25px rgba(0, 0, 0, 0.65)',
      },
      backgroundImage: {
        'megga-gradient': 'linear-gradient(180deg, #0c0d12 0%, #0f1117 55%, #0c0d12 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
