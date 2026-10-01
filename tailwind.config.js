export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
      colors: {
        tw: {
          navy: "#0F1F3D",
          blue: "#1A56DB",
          lightblue: "#EBF5FF",
          teal: "#0E9F6E",
          amber: "#D97706",
          red: "#E02424",
          gray: "#F9FAFB",
        },
      },
    },
  },
  plugins: [],
};
