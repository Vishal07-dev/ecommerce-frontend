/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}", // Adjust according to your file structure
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
    require('@tailwindcss/forms'), // Optional, for better default form styling
    require('@tailwindcss/aspect-ratio'), // For aspect ratio on images
  ],
};
