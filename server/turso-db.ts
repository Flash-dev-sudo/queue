import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from "@shared/schema";

// Use remote Turso if available, otherwise local SQLite
let client;

if (process.env.TURSO_DB_URL && process.env.TURSO_AUTH_TOKEN) {
  // Use remote Turso database (shared with Empareperiperi)
  client = createClient({
    url: process.env.TURSO_DB_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
} else {
  // Fallback: Use local SQLite database for development
  client = createClient({
    url: 'file:dev.db',
  });
}

// Create the database instance
export const db = drizzle(client, { schema });