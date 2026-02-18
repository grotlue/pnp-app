import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import tailwindcss from "eslint-plugin-tailwindcss";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...tailwindcss.configs["flat/recommended"],
  {
    settings: {
      tailwindcss: {
        // Tailwind v4 projects without tailwind.config.* need an explicit value.
        config: {},
      },
    },
    rules: {
      // Prettier plugin already enforces ordering for Tailwind class lists.
      "tailwindcss/classnames-order": "off",
      // Too noisy/unstable with Tailwind v4 beta parser and custom theme tokens.
      "tailwindcss/no-custom-classname": "off",
    },
  },
  prettierRecommended,
  {
    rules: {
      "prettier/prettier": "error",
      "func-style": ["error", "declaration", { allowArrowFunctions: true }],
    },
  },
  {
    files: ["src/page-modules/**/*.{ts,tsx}", "src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "JSXOpeningElement[name.type='JSXIdentifier'][name.name=/^[a-z]/] > JSXAttribute[name.name='className']",
          message:
            "Use reusable UI components instead of className on native JSX elements in page/features modules.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
