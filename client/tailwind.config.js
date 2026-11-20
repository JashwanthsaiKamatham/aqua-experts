/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 900: '#04070F', 800: '#070C18', 700: '#0B1220', 600: '#111A2B' },
        aqua: {
          50: '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          300: '#67E8F9',
          400: '#22D3EE',
          500: '#06B6D4',
          600: '#0891B2',
          700: '#0E7490'
        },
        frost: '#F8FAFC'
      },
      fontFamily: {
        display: ['Sora', 'Syne', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        glass: '0 24px 60px -20px rgba(4, 12, 28, 0.55)',
        glow: '0 0 40px -8px rgba(34, 211, 238, 0.55)'
      },
      backdropBlur: { xs: '2px' },
      keyframes: {
        floaty: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        shimmer: { '0%': { backgroundPosition: '0% 50%' }, '100%': { backgroundPosition: '200% 50%' } },
        ripple: { '0%': { transform: 'scale(0.2)', opacity: '0.8' }, '100%': { transform: 'scale(2.4)', opacity: '0' } },
        pulseGlow: { '0%,100%': { opacity: '0.5' }, '50%': { opacity: '1' } }
      },
      animation: {
        floaty: 'floaty 6s ease-in-out infinite',
        shimmer: 'shimmer 6s linear infinite',
        ripple: 'ripple 2.4s ease-out infinite',
        pulseGlow: 'pulseGlow 3.6s ease-in-out infinite'
      }
    }
  },
  plugins: []
};
