/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        base: '#0A0A0A',
        surface: '#151515',
        border: '#262626',
        ink: '#EDEDED',
        muted: '#8B8B8B',
        accent: '#3B82F6',
        danger: '#F04747',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        content: '600px',
      },
    },
  },
  plugins: [],
};
