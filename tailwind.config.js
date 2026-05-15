/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // KIPL Brand Colors
        primary: {
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#4CAF50', // Main green
          600: '#43A047',
          700: '#388E3C',
          800: '#2E7D32',
          900: '#1B5E20', // Dark green
        },
        alert: {
          info: '#2196F3',
          warning: '#F57C00',
          urgent: '#FF9800',
          critical: '#D32F2F',
        },
        status: {
          compliant: '#4CAF50',
          due60: '#FDD835',
          due30: '#F57C00',
          due7: '#FF5722',
          expired: '#D32F2F',
          pending: '#9E9E9E',
        }
      },
    },
  },
  plugins: [],
}
