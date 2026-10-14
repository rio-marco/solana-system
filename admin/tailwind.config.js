/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0D6EFD',
        'primary-light': '#E7F1FF',
        success: '#198754',
        warning: '#FFC107',
        danger: '#DC3545',
        'bg-primary': '#F8F9FA',
        'bg-sidebar': '#FFFFFF',
        'bg-header': '#FFFFFF',
        card: '#FFFFFF',
        'card-hover': '#F1F3F5',
      },
    },
  },
  plugins: [],
};
