const js = require('@eslint/js');
const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'out/**',
      'coverage/**',
      '**/*.min.js',
      '**/*.bundle.js',
      '**/*.config.js',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        // Browser globals
        HTMLDivElement: 'readonly',
        MouseEvent: 'readonly',
        KeyboardEvent: 'readonly',
        Node: 'readonly',
        ResizeObserver: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        CustomEvent: 'readonly',
        EventListener: 'readonly',
        Promise: 'readonly',
        Map: 'readonly',
        Set: 'readonly',
        Array: 'readonly',
        Object: 'readonly',
        JSON: 'readonly',
        Math: 'readonly',
        Date: 'readonly',
        RegExp: 'readonly',
        Error: 'readonly',
        alert: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      react: react,
      'react-hooks': reactHooks,
    },
    rules: {
      ...typescriptEslint.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];

