import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  {files: ['./src/**/*.{js,mjs,cjs,ts}']},
  {languageOptions: { globals: globals.node }},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      'quotes': ['warn', 'single'],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-async-promise-executor': 'off',
    },
  },
  {ignores: ['.serverless/', 'node_modules/']}
];