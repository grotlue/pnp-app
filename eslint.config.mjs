import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import tailwindcss from "eslint-plugin-tailwindcss";

const globalSyntaxRestrictions = [
  {
    selector: "ExportNamedDeclaration[declaration!=null]",
    message:
      "Do not export declarations inline. Declare first, then export at the bottom of the file.",
  },
  {
    selector: "FunctionExpression",
    message:
      "Use arrow function expressions (`const fn = () => {}`) instead of `function` expressions.",
  },
];

const nativeClassNameRestriction = {
  selector:
    "JSXOpeningElement[name.type='JSXIdentifier'][name.name=/^[a-z]/] > JSXAttribute[name.name='className']",
  message:
    "Use reusable UI components instead of className on native JSX elements outside src/components/ui.",
};

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
    },
  },
  {
    rules: {
      "func-style": ["warn", "expression", { allowArrowFunctions: true }],
      "import/prefer-default-export": "warn",
      "import/exports-last": "warn",
      "import/group-exports": "warn",
      "sort-imports": [
        "warn",
        { ignoreCase: true, ignoreDeclarationSort: true },
      ],
      "react/jsx-no-bind": [
        "warn",
        {
          allowArrowFunctions: false,
          allowFunctions: false,
          allowBind: false,
          ignoreRefs: true,
          ignoreDOMComponents: false,
        },
      ],
      "no-restricted-syntax": ["warn", ...globalSyntaxRestrictions],
    },
  },
  {
    files: [
      "src/page-modules/**/*.{ts,tsx}",
      "src/components/**/*.{ts,tsx}",
      "src/features/**/components/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@tanstack/react-query",
              importNames: [
                "useQuery",
                "useMutation",
                "useInfiniteQuery",
                "useQueries",
                "useSuspenseQuery",
                "useSuspenseInfiniteQuery",
              ],
              message:
                "Do not use React Query hooks directly in components/page modules. Move data fetching/mutations into a domain hook under hooks/.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/components/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "warn",
        ...globalSyntaxRestrictions,
        nativeClassNameRestriction,
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
