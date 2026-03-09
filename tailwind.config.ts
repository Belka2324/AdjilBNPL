import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        nexus: {
          bg: '#f4f6fb',
          card: '#ffffff',
          dark: '#1c1e2a',
          accent: '#5b7cfa'
        }
      },
      boxShadow: {
        soft: '0 15px 40px rgba(31, 38, 135, 0.12)'
      },
      borderRadius: {
        xl2: '1.25rem'
      }
    }
  },
  plugins: []
} satisfies Config
