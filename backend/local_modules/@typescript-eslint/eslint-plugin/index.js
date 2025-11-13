const path = require('path');
const { builtinRules } = require('eslint/use-at-your-own-risk');

const parserPath = path.join(__dirname, '../parser');

const noUnusedVarsRule = builtinRules.get('no-unused-vars');

module.exports = {
  rules: {
    'no-unused-vars': noUnusedVarsRule,
  },
  configs: {
    recommended: {
      parser: parserPath,
      plugins: ['@typescript-eslint'],
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      rules: {
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      },
    },
  },
};
