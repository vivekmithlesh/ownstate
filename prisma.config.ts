// Prisma 7 configuration.
//
// Prisma no longer auto-loads .env, and this project keeps secrets in .env.local,
// so we load that file explicitly with dotenv.
//
// Introspection & migrations need a DIRECT (non-pooled) connection, so we point the
// datasource at DIRECT_URL (port 5432). Fall back to DATABASE_URL if DIRECT_URL is
// unset. The runtime app talks to Supabase over the pooler via the Supabase JS client.
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

loadEnv({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
