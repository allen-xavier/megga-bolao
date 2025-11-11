import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        megga: {
          midnight: '#080B1B',
          surface: '#101632',
          navy: '#151D3F',
          purple: '#2D1C63',
          indigo: '#3B2785',
          magenta: '#C147E9',
          teal: '#37C2A0',
          lime: '#5BD174',
          yellow: '#FFD447',
          rose: '#FF5C8D',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 25px 65px -25px rgba(64, 38, 160, 0.65)',
      },
      backgroundImage: {
        'megga-gradient': 'linear-gradient(180deg, #080B1B 0%, #101632 55%, #080B1B 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
