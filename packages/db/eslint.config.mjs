import { defineConfig, globalIgnores } from "eslint/config";
import rootConfig from "../../eslint.config.mjs";

export default defineConfig([
  ...rootConfig,
  globalIgnores(["src/prisma/contract.d.ts", "migrations/**"]),
]);
