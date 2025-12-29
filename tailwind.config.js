/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/frontend/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'SF Pro Text',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        ios: {
          bg: '#F2F2F7',
          card: 'rgba(255, 255, 255, 0.8)',
          'card-dark': 'rgba(28, 28, 30, 0.8)',
          blue: '#007AFF',
          green: '#34C759',
          red: '#FF3B30',
          orange: '#FF9500',
          yellow: '#FFCC00',
          gray: {
            1: '#8E8E93',
            2: '#AEAEB2',
            3: '#C7C7CC',
            4: '#D1D1D6',
            5: '#E5E5EA',
            6: '#F2F2F7',
          },
        },
      },
      borderRadius: {
        'ios': '16px',
        'ios-lg': '24px',
        'ios-xl': '32px',
      },
      boxShadow: {
        'ios': '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'ios-lg': '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
        'ios-inset': 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      },
      backdropBlur: {
        'ios': '20px',
      },
      animation: {
        'ios-bounce': 'ios-bounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'ios-fade-in': 'ios-fade-in 0.3s ease-out',
        'ios-slide-up': 'ios-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
      keyframes: {
        'ios-bounce': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.95)' },
        },
        'ios-fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'ios-slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
};
