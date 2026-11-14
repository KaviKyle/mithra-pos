/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Noto Sans Sinhala', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': '0.625rem',   // 10px
        '3xl': '1.875rem',   // 30px
        '4xl': '2.25rem',    // 36px
        '5xl': '3rem',       // 48px
        '6xl': '3.75rem',    // 60px
      },
      colors: {
        primary: '#1a1a1a',
        'primary-hover': '#333333',
        danger: '#dc2626',
        success: '#16a34a',
        warning: '#f59e0b',
        'lankaqr': '#0055a4',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [],
};
