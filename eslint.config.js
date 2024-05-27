module.exports = [
  {
    extends: [
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:prettier/recommended",
    ],
    env: {
      node: true,
      browser: true,
    },
    plugins: ["import", "@typescript-eslint", "prettier"],
    parser: "@typescript-eslint/parser",
    rules: {
      "import/order": [
        "warn",
        {
          pathGroups: [
            {
              pattern: "~/**",
              group: "parent",
              position: "before",
            },
          ],
          groups: [
            ["builtin", "external"],
            ["parent", "sibling", "index"],
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
      "@typescript-eslint/no-explicit-any": ["off", {}],
      "@typescript-eslint/ban-types": [
        "error",
        {
          types: {
            Function: false,
            "extend-defaults": true,
          },
        },
      ],
      "no-unused-vars": ["off"],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          vars: "all",
          args: "after-used",
          ignoreRestSiblings: false,
          argsIgnorePattern: "^_",
        },
      ],
    },
    overrides: [
      {
        files: ["**/*.test.ts", "**/*.test.tsx"],
        plugins: ["jest"],
      },
    ],
  },
];
