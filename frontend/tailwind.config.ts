import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#edf5ff',
          100: '#d0e4ff',
          500: '#1f7aec',
          600: '#155bcc',
        },
        secondary: '#0f172a',
      },
    },
  },
  plugins: [],
};

export default config;
