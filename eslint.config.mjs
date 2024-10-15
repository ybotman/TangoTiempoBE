import globals from 'globals';
import prettierConfig from 'eslint-config-prettier'; // Import the Prettier config

export default [
  {
    ignores: ['archive/', 'masterdata/', '.vscode/', '.github/'],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,  // Spread in Node.js globals
        ...globals.es2021, // Spread in ECMAScript 2021 globals
      },
      ecmaVersion: 'latest',
    },
    rules: {
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
      ...prettierConfig.rules, // Spread the Prettier rules manually
    },
  },
];