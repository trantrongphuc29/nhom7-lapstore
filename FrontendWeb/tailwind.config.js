module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#0066ff",
        "background-light": "#f5f7f8",
        "background-dark": "#0f1723",
      },
      fontFamily: {
        "display": ["Lexend", "sans-serif"]
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
