/** @type {import('tailwindcss').Config} */
export const content = [
  "./src/**/*.{html,ts}", // Adjust according to your file structure
];
export const dark = 'class';
export const theme = {
  extend: {
    animation: {
      fadeIn: 'fadeIn 1s ease-in-out forwards',
      slideUp: 'slideUp 0.8s ease-out forwards',
      marquee: 'marquee 25s linear infinite'
    },
    keyframes: {
      fadeIn: {
        from: { opacity: '0', transform: 'translateY(20px)' },
        to: { opacity: '1', transform: 'translateY(0)' }
      },
      slideUp: {
        from: { opacity: '0', transform: 'translateY(30px)' },
        to: { opacity: '1', transform: 'translateY(0)' }
      },
      marquee: {
        '0%': { transform: 'translateX(0%)' },
        '100%': { transform: 'translateX(-50%)' }
      }
    }
  }
};
export const plugins = [
  require('@tailwindcss/line-clamp'),
  require('@tailwindcss/forms'), // Optional, for better default form styling
  require('@tailwindcss/aspect-ratio'), // For aspect ratio on images
];
