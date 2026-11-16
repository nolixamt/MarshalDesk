import { defineConfig as ormConfig } from "@prisma/orm-postgres/config";
import { config } from "dotenv";
import { definePrismaConfig } from "prisma/config";

config({ path: "../../apps/web/.env.local", quiet: true });

const migrationUrl = process.env["DATABASE_URL_UNPOOLED"];
if (!migrationUrl) {
  throw new Error(
    "DATABASE_URL_UNPOOLED is not set (expected in apps/web/.env.local)",
  );
}

export default definePrismaConfig({
  orm: ormConfig({
    contract: "./src/prisma/contract.prisma",
    db: { connection: migrationUrl },
  }),
});
