/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
      colors: {
        nav: "#1D1A24",
        bg: "#282634",
        'text-main': '#928F9E',
        'text-gray': '#BBB9C7',
        'purple-main': '#C85CD1',
        'purple-hover': '#4338CA',
        'bg-card': '#312F3D',
        'bg-card-hover': '#312E3D',
      },
      fontWeight: {
        550: '550',
      },
      letterSpacing: {
        tightest: '-0.14px',
      },
      lineHeight: {
        tight: '16px',
      },
      fontSize: {
        sm: '14px',
      },
      height: {
        16: '64px',
      },
      margin: {
        '4': '16px',
      },
    },
  },
  plugins: [],
};