/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sena: {
          green: '#39A900',
          navy: '#00324D',
          blue: '#0072B1',
          bg: '#F4F6F8',
          text: '#1E293B',
        }
      }
    },
  },
  plugins: [],
}