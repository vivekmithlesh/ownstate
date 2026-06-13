import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // We render lucide icons via a dynamic lookup from a STATIC module-level
      // map (getPropertyIcon → PROPERTY_ICONS). Those are stable component
      // references, so the "component created during render" warning is a false
      // positive for this pattern. Turning it off avoids littering every icon
      // call site with disable comments. (set-state-in-effect etc. stay on.)
      "react-hooks/static-components": "off",
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
