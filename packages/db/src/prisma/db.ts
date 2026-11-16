import postgres from "@prisma/orm-postgres/runtime";
import { contractFromJson } from "@prisma/orm-postgres/static";
import { Pool } from "pg";
import type { Contract } from "./contract.d";
import contractJson from "./contract.json" with { type: "json" };

const contract = contractFromJson<Contract>(contractJson);

function createDb() {
  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  // Neon's pooler rejects the startup options (`-c lc_monetary=C`) Prisma sends when it opens
  // connections from a URL, so we pass our own pool. Prisma then applies those settings per
  // client with set_config, which the transaction pooler doesn't pin; harmless here because
  // Neon already defaults to ISO dates and we have no money columns. The timeouts mirror the
  // ones Prisma sets on pools it creates (pg's default connect timeout is unlimited).
  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 20_000,
    idleTimeoutMillis: 30_000,
  });
  return postgres({ contract, pg: pool });
}

type Db = ReturnType<typeof createDb>;

// Reused across dev hot reloads so each reload doesn't open a new pg pool.
const globalForDb = globalThis as typeof globalThis & { marshaldeskDb?: Db };

export const db: Db = globalForDb.marshaldeskDb ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb.marshaldeskDb = db;
}
