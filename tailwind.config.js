/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Consistent dark-red cinematic palette
        base: '#141414',
        ink: '#0a0a0f',
        surface: '#1a1a20',
        accent: '#E50914',
        'accent-hover': '#f6121d',
        'accent-dark': '#b20710',
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'Segoe UI', 'sans-serif'],
        display: ['"Bebas Neue"', 'Impact', 'sans-serif'],
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #E50914 0%, #b20710 100%)',
        'glow-top':
          'radial-gradient(1200px 600px at 50% -12%, rgba(229,9,20,0.18), transparent 60%)',
      },
      boxShadow: {
        glow: '0 8px 30px rgba(229,9,20,0.35)',
        'glow-lg': '0 10px 40px rgba(229,9,20,0.5)',
        card: '0 10px 30px rgba(0,0,0,0.5)',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease both',
        'fade-in': 'fadeIn 0.4s ease both',
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
}
