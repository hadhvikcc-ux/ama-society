/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#4338CA',
        primaryLight: '#EBE7FF',
        success: '#16A34A',
        danger: '#DC2626',
        warning: '#D97706',
        text: { primary: '#1E293B', secondary: '#475569', muted: '#64748B', inverse: '#FFFFFF' },
        surface: { background: '#F8F9FA', card: '#FFFFFF', elevated: '#F1F5F9' },
        border: '#E2E8F0',
        pastel: {
          lavender: '#EBE7FF',
          'lavender-subtle': '#F6F4FE',
          sage: '#E2EFE7',
          'sage-subtle': '#F2F8F4',
          cream: '#FAF6EE',
          'cream-subtle': '#FCFAF6',
          peach: '#FDE8DF',
          'peach-subtle': '#FFF4EF',
          powder: '#E3EFFD',
          'powder-subtle': '#F2F7FE',
          rose: '#FDE2E4',
          'rose-subtle': '#FFF0F2',
        },
      }
    },
  },
  plugins: [],
}

