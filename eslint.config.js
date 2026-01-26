import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import tseslint from "@typescript-eslint/eslint-plugin";
import importPlugin from "eslint-plugin-import";
import jestPlugin from "eslint-plugin-jest";
import js from "@eslint/js";

export default [ 
{
 languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
        parserOptions: {
          ecmaFeatures: {
          }
      },
      globals: {
        ...globals.browser,
        ...globals.node
      },
      parser: tsParser,
    },
  files: ["**/*.ts", "**/*.tsx"],
   plugins: {
      "@typescript-eslint": tseslint,
      import: importPlugin,
      jest: jestPlugin,
    },
  rules: {
    '@typescript-eslint/array-type': 'error',
    '@typescript-eslint/explicit-module-boundary-types': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-shadow': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        ignoreRestSiblings: true,
        argsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/no-var-requires': 'off',
    curly: 'error',
    eqeqeq: 'error',
    'import/no-duplicates': 'error',
    'import/no-named-as-default': 'error',
    'import/order': [
      'error',
      {
        alphabetize: {
          caseInsensitive: false,
          order: 'asc',
        },
        'newlines-between': 'always',
      },
    ],
    'jest/prefer-to-have-length': 'error',
    'jest/valid-expect': 'off',
    'linebreak-style': ['error', 'unix'],
    'no-console': 'warn',
    'no-prototype-builtins': 'off',
    'no-return-await': 'error',
    'no-unneeded-ternary': [
      'error',
      {
        defaultAssignment: false,
      },
    ],
    'object-curly-spacing': ['error', 'always'],
    'object-shorthand': ['error', 'properties'],
    quotes: [
      'error',
      'single',
      {
        allowTemplateLiterals: false,
        avoidEscape: true,
      },
    ],
    semi: ['error', 'always'],
    'sort-imports': [
      'error',
      {
        allowSeparatedGroups: false,
        ignoreCase: false,
        ignoreDeclarationSort: true,
        ignoreMemberSort: false,
      },
    ],
  },
  ignores: [
    "dist/*",
    "coverage/*",
    "**/*.d.ts",
    "/src/main/public/",
    "/src/main/types/",
    "jest.*config.js",
    ".eslintrc.js",
    "src/test/*/codecept.conf.js",
    "src/test/config.ts",
    "**/*.js",
    ".pnp.*"
  ]
}
]
