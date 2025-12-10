/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        appBlack: "#050505",
        appBlackSoft: "#0b0b0b",
        appBlackRaised: "#111111",
        appBorder: "#1f1f1f",
        appRed: "#e50914",
        appRedDark: "#b0060f",
        appRedSoft: "#ff4b5c",
        appTextMuted: "#9ca3af",
      },
      boxShadow: {
        appSoft: "0 10px 25px rgba(0,0,0,0.5)",
      },
      borderRadius: {
        appLg: "1rem",
        appXl: "1.5rem",
      },
    },
  },
  plugins: [],
};
