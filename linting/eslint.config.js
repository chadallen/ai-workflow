import tseslint from 'typescript-eslint';

/**
 * Global ESLint config for Claude code reviewer.
 * Used when a project has no local ESLint config.
 *
 * Rules philosophy:
 * - Errors: things that are almost always bugs (unused vars, unreachable code)
 * - Warnings: things worth flagging but may be intentional (explicit any)
 * - Off: style preferences and project-specific choices
 *
 * No type-aware rules — those require a project tsconfig and slow down linting.
 */
export default tseslint.config(
  {
    // Only lint TypeScript and JavaScript files
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.mjs', '**/*.cjs'],
    ignores: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.d.ts'],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      // Catch dead code
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],

      // Warn on explicit any — may be intentional (Playwright type mismatches, etc.)
      '@typescript-eslint/no-explicit-any': 'warn',

      // Allow require() only when necessary — prefer imports
      '@typescript-eslint/no-require-imports': 'warn',

      // Catch obvious bugs
      'no-debugger': 'error',
      'no-duplicate-case': 'error',
      'no-self-assign': 'error',
      'no-unreachable': 'error',

      // Off — console is fine for CLI tools and scripts
      'no-console': 'off',
    },
  }
);
