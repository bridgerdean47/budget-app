/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // dark cyber theme
        shell: "#050816",
        card: "#0b1020",
        accent: "#14f4ff",
        accentSoft: "#0dd6c9",
        neutralSoft: "#8b9bb7",

        // sage + cream theme
        sageBg: "#F4F3EC",       // main background
        sageCard: "#FFFFFF",     // card background
        sageAccent: "#4D7C5A",   // main green
        sageAccentSoft: "#A3B18A",
        sageBorder: "#D3D3C4",
        sageText: "#1F2933",
      },
    },
  },
  plugins: [],
};
