export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--primary-color)",
          50: "color-mix(in srgb, var(--primary-color) 5%, white)",
          100: "color-mix(in srgb, var(--primary-color) 10%, white)",
          200: "color-mix(in srgb, var(--primary-color) 20%, white)",
          300: "color-mix(in srgb, var(--primary-color) 40%, white)",
          400: "color-mix(in srgb, var(--primary-color) 70%, white)",
          500: "var(--primary-color)",
          600: "var(--primary-color)",
          700: "color-mix(in srgb, var(--primary-color) 80%, black)",
          800: "color-mix(in srgb, var(--primary-color) 60%, black)",
          900: "color-mix(in srgb, var(--primary-color) 40%, black)",
        },
      },
    },
  },
  plugins: [],
};
