import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Falls back to a local SQLite file so the app builds/runs without Turso envs;
// set TURSO_DATABASE_URL (and TURSO_AUTH_TOKEN) for the real database.
const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:./kibubu-local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
export { schema };
