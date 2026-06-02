import config, { testOverride } from "@drod3763/eslint-config";

export default [
  ...config,
  {
    files: ["**/*.test.ts"],
    ...testOverride,
  },
];
