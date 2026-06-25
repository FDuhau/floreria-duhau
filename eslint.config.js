import js from '@eslint/js';
import globals from 'globals';

// Config de ESLint (flat config). Objetivo: red de seguridad para cazar bugs
// reales en el monolito (claves duplicadas, variables sin declarar, código
// muerto), sin ahogar en ruido de estilo.
export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'public/**', '*.config.js'],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.serviceworker,
        Chart: 'readonly', // chart.js, cargado por CDN en index.html
        XLSX: 'readonly',  // expuesto en window por src/main.js
      },
    },
    rules: {
      // Ruido de estilo / patrones intencionales del código actual → no frenan.
      'no-unused-vars': ['warn', {
        args: 'after-used',
        caughtErrors: 'none',      // catch(e){} sin usar 'e' es idiomático
        varsIgnorePattern: '^_',   // convención del código: '_' = a propósito sin usar
        argsIgnorePattern: '^_',
      }],
      'no-empty': 'off',                  // hay muchos catch(e){} intencionales
      'no-cond-assign': ['error', 'except-parens'],
      'no-prototype-builtins': 'off',
      'no-useless-assignment': 'warn',    // suele marcar inits defensivos, no bugs
      'no-useless-escape': 'warn',        // cosmético; no cambia comportamiento
      // Bugs reales → error:
      'no-eval': 'error',
      // Reglas de alto valor que SÍ son bugs → error (la mayoría ya vienen en recommended):
      // no-dupe-keys, no-dupe-args, no-unreachable, no-const-assign,
      // no-duplicate-case, no-func-assign, no-self-assign, use-isnan, etc.
    },
  },
];
