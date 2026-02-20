import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import tailwindcss from "eslint-plugin-tailwindcss";

const lintScopeFiles = [
  "src/**/*.{js,cjs,mjs,jsx,ts,tsx}",
  "tests/**/*.{js,cjs,mjs,jsx,ts,tsx}",
];

const scopeToLintFiles = (config) => {
  const configKeys = Object.keys(config);
  const hasOnlyIgnores = configKeys.length === 1 && configKeys[0] === "ignores";

  if (hasOnlyIgnores) {
    return config;
  }

  return {
    ...config,
    files: lintScopeFiles,
  };
};

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

const reactCompilerMemoizationRestrictions = [
  {
    selector:
      "ImportDeclaration[source.value='react'] ImportSpecifier[imported.name='useMemo']",
    message:
      "React Compiler (opt-out mode) handles most memoization. Prefer plain values over useMemo unless profiling proves a need.",
  },
  {
    selector:
      "ImportDeclaration[source.value='react'] ImportSpecifier[imported.name='useCallback']",
    message:
      "React Compiler (opt-out mode) handles most memoization. Prefer plain functions over useCallback unless profiling proves a need.",
  },
  {
    selector:
      "ImportDeclaration[source.value='react'] ImportSpecifier[imported.name='memo']",
    message:
      "React Compiler (opt-out mode) handles most component memoization. Prefer plain components over React.memo unless profiling proves a need.",
  },
  {
    selector:
      "MemberExpression[object.name='React'][property.name=/^(useMemo|useCallback|memo)$/]",
    message:
      "React Compiler (opt-out mode) handles most manual memoization patterns. Prefer compiler optimization and only keep manual memoization with evidence.",
  },
];

const eslintConfig = defineConfig([
  ...nextVitals.map(scopeToLintFiles),
  ...nextTs.map(scopeToLintFiles),
  ...tailwindcss.configs["flat/recommended"].map(scopeToLintFiles),
  {
    files: lintScopeFiles,
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
  {
    ...prettierRecommended,
    files: lintScopeFiles,
  },
  {
    files: lintScopeFiles,
    rules: {
      "prettier/prettier": "error",
    },
  },
  {
    files: lintScopeFiles,
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
          allowArrowFunctions: true,
          allowFunctions: true,
          allowBind: false,
          ignoreRefs: true,
          ignoreDOMComponents: false,
        },
      ],
      "no-restricted-syntax": [
        "warn",
        ...globalSyntaxRestrictions,
        ...reactCompilerMemoizationRestrictions,
        {
          selector: "JSXAttribute > JSXExpressionContainer > ArrowFunctionExpression",
          message:
            "Do not use inline arrow logic in JSX props. Move it to a named handler variable/function first.",
        },
      ],
    },
  },
  {
    files: ["src/app/**/route.ts"],
    rules: {
      "import/prefer-default-export": "off",
    },
  },
  {
    files: ["src/proxy.ts"],
    rules: {
      "import/group-exports": "off",
      "no-restricted-syntax": [
        "warn",
        ...reactCompilerMemoizationRestrictions,
      ],
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
    ignores: ["src/components/ui/**/*.{ts,tsx}", "src/proxy.ts"],
    rules: {
      "no-restricted-syntax": [
        "warn",
        ...globalSyntaxRestrictions,
        ...reactCompilerMemoizationRestrictions,
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
