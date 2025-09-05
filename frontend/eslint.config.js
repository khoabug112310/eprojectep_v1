import tseslint from 'typescript-eslint';
import tseslint from 'typescript-eslint';
import reactX from 'eslint-plugin-react-x';
import reactDom from 'eslint-plugin-react-dom';

export default tseslint.config([
  { 
    ignores: [
      'dist', 
      'node_modules', 
      'coverage', 
      'tests', 
      '*.config.*',
      '**/*.test.*',
      '**/*.spec.*',
      'vite.config.*',
      'vitest.config.*',
      'cypress.config.*',
      'playwright.config.*',
      '**/__tests__/**',
      '**/e2e/**',
      '**/test-utils/**',
      '**/test-setup.*'
    ] 
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Type-aware lint rules
      ...tseslint.configs.recommendedTypeChecked,
      // Stylistic rules
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json', './tsconfig.e2e.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Disable problematic rules for faster development
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  // Relaxed rules for test files that might still be linted
  {
    files: ['**/*.{test,spec}.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
]);
