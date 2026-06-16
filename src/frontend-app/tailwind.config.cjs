const flowbite = require('flowbite/plugin');

module.exports = {
  content: [
    './src/**/*.{html,js,svelte,ts}',
    './node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}',
    './node_modules/flowbite/**/*.{html,js,svelte,ts}',
    "./node_modules/flowbite-svelte-icons/**/*.{html,js,svelte,ts}"
  ],
  theme: {
    extend: {},
  },
  plugins: [
    flowbite
  ],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      fontFamily: {
        // Mapeia exatamente a classe que você usou no seu componente Heading
        'baskerville-old-face': ['"Baskerville Old Face"', '"Libre Baskerville"', 'Baskerville', 'serif'],
      },
    },
  },
  plugins: [],
}

