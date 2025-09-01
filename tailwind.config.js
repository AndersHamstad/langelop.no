/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      typography: (theme) => ({
        compact: {
          css: {
            p: { marginTop: '0.5em', marginBottom: '0.5em' },
            h1: { marginTop: '1.2em', marginBottom: '0.4em' },
            h2: { marginTop: '1.1em', marginBottom: '0.4em' },
            h3: { marginTop: '1em', marginBottom: '0.4em' },
            ul: { marginTop: '0.5em', marginBottom: '0.5em' },
            ol: { marginTop: '0.5em', marginBottom: '0.5em' },
            li: { marginTop: '0.25em', marginBottom: '0.25em' },
            blockquote: {
              backgroundColor: '#eff6ff', // blå bakgrunn
              borderLeft: '4px solid #3b82f6', // blå kant
              color: '#000000ff', // svart tekst
              fontStyle: 'normal',
              padding: '0.75rem 1rem',
              borderRadius: '0.375rem',
              quotes: 'none',
            },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
