/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sih-orange': '#F97316',
        'sih-green': '#16A34A',
        'sih-blue': '#2563EB',
        'light-bg': '#F9FAFB',
        'dark-charcoal': '#1A202C',
        'electric-blue': '#2563EB',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
        '32': '128px',
      },
      transitionDuration: {
        '150': '150ms',
      },
      screens: {
        'xs': '475px',
      },
      minHeight: {
        'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
      },
      maxWidth: {
        'screen-sm': '100vw',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'zoom-in': {
          '0%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        'slide-in-from-top': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'slide-in-from-bottom': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'slide-in-from-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-in-from-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in-0': 'fade-in 0.2s ease-out',
        'zoom-in-95': 'zoom-in 0.2s ease-out',
        'animate-in': 'fade-in 0.2s ease-out, zoom-in 0.2s ease-out',
        'animate-out': 'fade-in 0.2s ease-out reverse, zoom-in 0.2s ease-out reverse',
        'slide-in-from-top-2': 'slide-in-from-top 0.2s ease-out',
        'slide-in-from-bottom-2': 'slide-in-from-bottom 0.2s ease-out',
        'slide-in-from-left-2': 'slide-in-from-left 0.2s ease-out',
        'slide-in-from-right-2': 'slide-in-from-right 0.2s ease-out',
      },
    },
  },
  plugins: [],
}