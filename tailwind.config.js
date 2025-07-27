
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'in-dex-purple': '#6B2FD8',
        'in-dex-teal': '#2EB6D8',
        'in-dex-yellow': '#F59E0B',
        'in-dex-green': '#10B981',
      },
      backgroundImage: {
        'logo-gradient': 'linear-gradient(135deg, var(--tw-gradient-stops))',
      },
      gradientColorStops: theme => ({
        ...theme('colors'),
        'logo-start': '#6B2FD8',
        'logo-end': '#2EB6D8',
      }),
    },
  },
  variants: {},
  plugins: [],
};
