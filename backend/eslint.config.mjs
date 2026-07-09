import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  {
    ignores: ["node_modules/**", "dist/**", ".hls-tmp/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Allow unused args prefixed with _ (Express next() handlers, etc.).
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // We intentionally use `any` in a few typed-error maps.
      "@typescript-eslint/no-explicit-any": "off",
      // ESM with .js imports is intentional in this project.
      "no-unused-vars": "off",
    },
  },
);
