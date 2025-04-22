/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        scaleIn: {
          '0%': { transform: 'scale(0.8)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
      },
      animation: {
        scaleIn: 'scaleIn 0.2s ease-out',
      },
      fontFamily: {
        snpro: ['"SN Pro"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
