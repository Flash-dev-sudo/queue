import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from "@shared/schema";

if (!process.env.TURSO_DB_URL || !process.env.TURSO_AUTH_TOKEN) {
  throw new Error(
    "TURSO_DB_URL and TURSO_AUTH_TOKEN must be set. Did you forget to provide your Turso database credentials?"
  );
}

// Create the client
const client = createClient({
  url: process.env.TURSO_DB_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Create the database instance
export const db = drizzle(client, { schema });