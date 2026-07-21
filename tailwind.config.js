/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef1f8',
          100: '#d7deee',
          200: '#aebcdd',
          300: '#8497c4',
          400: '#5b71a5',
          500: '#3d5280',
          600: '#2c3d61',
          700: '#212f4a',
          800: '#182238',
          900: '#111827',
          950: '#0b0f1a',
        },
        ember: {
          50: '#fff7ec',
          100: '#ffecd3',
          200: '#ffd5a5',
          300: '#ffb76d',
          400: '#ff9333',
          500: '#f9760f',
          600: '#ea5a08',
          700: '#c1420a',
          800: '#9a3510',
          900: '#7c2d10',
        },
      },
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
