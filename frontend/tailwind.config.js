/**
 * Tailwind CSS config для MUSSON BLOG (UX/UI STYLE GUIDE)
 */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ["var(--font-coustard)", "Georgia", "serif"],
        serif: ["var(--font-lora)", "Georgia", "serif"],
      },
      colors: {
        heading: "#333333",
        text: "#444444",
        accent: "#CE6607",
        accentDark: "#A35208",
        bg: "#fff",
      },
      lineHeight: {
        tight: "1.1",
        relaxed: "1.8",
      },
      letterSpacing: {
        wide: ".02em",
        wider: ".04em",
      },
      maxWidth: {
        content: "720px",
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            figure: null,
          },
        },
        lg: {
          css: {
            figure: null,
          },
        },
      }),
    },
  },
  safelist: [
    "fa", "fa-book-open", "fa-chevron-left", "fa-chevron-right",
    "prose", "prose-lg", "prose-xl", "prose-sm", "prose-invert"
  ],
  plugins: [require("@tailwindcss/typography")],
};
