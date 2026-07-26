import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0F1523',
        indigo: {
          DEFAULT: '#1B2A5B',
          soft: '#2A3D75',
          wash: '#EDF0F7',
        },
        amber: {
          DEFAULT: '#FFB300',
          deep: '#E09B00',
          wash: '#FFF6E0',
        },
        paper: '#F5F6F8',
        line: '#E3E6EC',
        muted: '#6B7280',
        ok: '#0E9F6E',
        warn: '#F0790B',
        danger: '#DC2626',
        info: '#2563EB',
      },
      fontFamily: {
        sans: ['var(--font-plex)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.02em' }],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,21,35,0.04), 0 1px 8px rgba(15,21,35,0.04)',
        lift: '0 4px 16px rgba(15,21,35,0.10)',
      },
      borderRadius: { xl: '0.875rem' },
    },
  },
  plugins: [],
};
export default config;
