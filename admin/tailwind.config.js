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
        dark: '#07090e',
        card: '#0f1422',
        'card-hover': '#161c2e',
        'solana-purple': '#9945FF',
        'solana-green': '#14F195',
        'solana-cyan': '#00C2FF',
        'solana-amber': '#F59E0B',
      },
    },
  },
  plugins: [],
};
