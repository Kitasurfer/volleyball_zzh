/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E8EBF5',
          100: '#C4CCE5',
          500: '#2F4C97',
          600: '#263D7A',
          900: '#1A2852',
        },
        accent: {
          50: '#FFF9CC',
          100: '#FFF4B3',
          500: '#FFDA00',
          600: '#E6C400',
          900: '#997F00',
        },
        neutral: {
          50: '#F8F9FB',
          100: '#F1F3F6',
          200: '#E2E5EB',
          500: '#9BA3B0',
          700: '#4A5568',
          900: '#1F2937',
        },
        background: {
          page: '#F8F9FB',
          surface: '#F1F3F6',
          elevated: '#FFFFFF',
        },
        semantic: {
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#2F4C97',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        hero: ['72px', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '700' }],
        h1: ['56px', { lineHeight: '1.1', letterSpacing: '-0.015em', fontWeight: '700' }],
        h2: ['40px', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
        h3: ['28px', { lineHeight: '1.3', letterSpacing: '0', fontWeight: '600' }],
        h4: ['24px', { lineHeight: '1.3', letterSpacing: '0', fontWeight: '600' }],
        h5: ['20px', { lineHeight: '1.4', letterSpacing: '0', fontWeight: '600' }],
        h6: ['16px', { lineHeight: '1.5', letterSpacing: '0', fontWeight: '600' }],
        'body-lg': ['20px', { lineHeight: '1.6', letterSpacing: '0', fontWeight: '400' }],
        body: ['16px', { lineHeight: '1.5', letterSpacing: '0', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '1.5', letterSpacing: '0', fontWeight: '400' }],
        small: ['14px', { lineHeight: '1.5', letterSpacing: '0', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '1.4', letterSpacing: '0.01em', fontWeight: '400' }],
        xs: ['12px', { lineHeight: '1.4', letterSpacing: '0.01em', fontWeight: '400' }],
      },
      spacing: {
        'xs': '8px',
        'sm': '12px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
        '3xl': '64px',
        '4xl': '96px',
        '5xl': '128px',
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 1px 3px rgba(47, 76, 151, 0.08), 0 1px 2px rgba(47, 76, 151, 0.04)',
        'md': '0 10px 15px rgba(47, 76, 151, 0.1), 0 4px 6px rgba(47, 76, 151, 0.06)',
        'lg': '0 20px 25px rgba(47, 76, 151, 0.12), 0 10px 10px rgba(47, 76, 151, 0.05)',
      },
      transitionDuration: {
        'fast': '200ms',
        'normal': '250ms',
        'slow': '300ms',
      },
      transitionTimingFunction: {
        'default': 'ease-out',
        'smooth': 'ease-in-out',
      },
    },
  },
  plugins: [],
}
