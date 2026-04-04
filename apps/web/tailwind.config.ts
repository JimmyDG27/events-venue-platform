import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Design tokens defined in Phase 0.4
      },
      fontFamily: {
        // Display and body fonts defined in Phase 0.4
      },
    },
  },
  plugins: [],
};

export default config;
