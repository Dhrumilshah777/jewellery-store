import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fdf8f0',
          100: '#f9ecd9',
          200: '#f2d9b3',
          300: '#e8bf82',
          400: '#dda04d',
          500: '#d4943d',
          600: '#b8722f',
          700: '#925429',
          800: '#784528',
          900: '#633b24',
        },
      },
    },
  },
  plugins: [],
};

export default config;
