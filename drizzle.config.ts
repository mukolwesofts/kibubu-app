import { defineConfig } from "drizzle-kit";

// Local fallback: without TURSO_DATABASE_URL, migrate a local SQLite file.
const url = process.env.TURSO_DATABASE_URL ?? "file:./kibubu-local.db";

export default defineConfig({
  dialect: url.startsWith("file:") ? "sqlite" : "turso",
  schema: "./src/db/schema.ts",
  out: "./migrations",
  dbCredentials: {
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
