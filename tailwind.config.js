/** @type {import('tailwindcss').Config} */
import forms from "@tailwindcss/forms";

const config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [forms],
};

export default config;
