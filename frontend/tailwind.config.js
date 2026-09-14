/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Vazirmatn', 'Tahoma', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: 'rgb(var(--foreground) / <alpha-value>)',
        cream: 'rgb(var(--background) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        wine: 'rgb(var(--primary) / <alpha-value>)',
        gold: 'rgb(var(--gold) / <alpha-value>)',
        line: 'rgb(var(--border) / <alpha-value>)',
      },
      boxShadow: {
        soft: 'var(--shadow-sm)',
        card: 'var(--shadow-md)',
        lift: 'var(--shadow-lg)',
        glow: '0 0 0 1px rgb(var(--primary) / .28), 0 18px 46px -14px rgb(var(--primary) / .5)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '100%': { transform: 'translateX(-100%)' },
        },
        float: {
          '0%,100%': { transform: 'translate(0,0)' },
          '50%': { transform: 'translate(18px,-22px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up .5s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in': 'fade-in .4s ease both',
        float: 'float 16s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
