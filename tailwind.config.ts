import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Survivor theme colors
        'tribe-red': '#840404',
        'tribe-green': '#207D07',
        'tribe-blue': '#0C5F9E',
        'tribe-purple': '#7B067F',
        'tribe-orange': '#AF6C0F',
      },
    },
  },
  plugins: [],
}
export default config
