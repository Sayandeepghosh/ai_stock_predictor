/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-dark': '#0f172a',
        'brand-card': '#1e293b',
        'brand-accent': '#38bdf8',
        'up-green': '#10b981',
        'down-red': '#ef4444',
      }
    },
  },
  plugins: [],
}
