/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        shell: "#050816",
        card: "#0b1020",
        accent: "#14f4ff",
        accentSoft: "#0dd6c9",
        neutralSoft: "#8b9bb7",
      },
    },
  },
  plugins: [],
};
