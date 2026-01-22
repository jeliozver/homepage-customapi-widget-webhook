import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parser: tseslint.parser,
    },
    rules: {
      '@/semi': ['error', 'always'],
      '@/indent': ['error', 2],
      'quotes': ['error', 'single'],
      'comma-dangle': ['error', 'always-multiline'],
    },
  },
];