/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f4f7ff',
          100: '#e6ebff',
          200: '#c6d1ff',
          300: '#9fb0ff',
          400: '#6f84fb',
          500: '#4a5cf0',
          600: '#3640d6',
          700: '#2c31ab',
          800: '#252a86',
          900: '#1f2366',
        },
        accent: {
          400: '#ff8a5c',
          500: '#ff6b35',
          600: '#e8541f',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Segoe UI"', 'sans-serif'],
        display: ['"Fraunces"', 'serif'],
      },
      boxShadow: {
        card: '0 4px 24px -8px rgba(31,35,102,0.12)',
        cardHover: '0 12px 32px -8px rgba(31,35,102,0.22)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        fadeUp: { '0%': { opacity: 0, transform: 'translateY(12px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        scaleIn: { '0%': { opacity: 0, transform: 'scale(.96)' }, '100%': { opacity: 1, transform: 'scale(1)' } },
      },
      animation: {
        fadeUp: 'fadeUp .5s ease both',
        scaleIn: 'scaleIn .25s ease both',
      }
    },
  },
  plugins: [],
}
