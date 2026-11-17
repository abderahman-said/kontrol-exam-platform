/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#effbf7',
          100: '#d6f5eb',
          200: '#b0ecda',
          300: '#79dec2',
          400: '#3dc7a4',
          500: '#02936c', // لون اللوجو الأساسي (أخضر كَنترول الزمردي)
          600: '#027d5c',
          700: '#03644b',
          800: '#05503d',
          900: '#064234',
        },
        navy: {
          50: '#f0f5fa',
          100: '#dbe5f0',
          200: '#bccfe3',
          300: '#94b2d1',
          400: '#648eb9',
          500: '#4170a0',
          600: '#305885',
          700: '#27476c',
          800: '#063154',
          900: '#03243f', // لون اللوجو الداكن الأساسي (كحلي كَنترول الملكي)
          950: '#02182b',
        }
      }
    },
  },
  plugins: [],
}
