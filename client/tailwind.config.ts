import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#E1F4FF',
          100: '#C6EAFF',
          200: '#83CFFC',
          300: '#0095EB',
          400: '#007EC7',
          500: '#015C91',
          600: '#005587',
          700: '#004872',
          800: '#003D61',
          900: '#01314D',
        },
        gray: {
          50:  '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EA',
          300: '#D2D5DB',
          400: '#9EA2AE',
          500: '#6D717F',
          600: '#4D5461',
          700: '#394050',
          800: '#212936',
          900: '#131927',
        },
      },
      fontFamily: {
        sans: [
          'Public Sans',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(165,163,174,0.3), 0 1px 2px -1px rgba(165,163,174,0.2)',
      },
    },
  },
  plugins: [],
};

export default config;
