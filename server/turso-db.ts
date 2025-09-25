import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from "@shared/schema";

// Use local SQLite for development, remote Turso for production
let client;

if (process.env.NODE_ENV === 'production' && process.env.TURSO_DB_URL && process.env.TURSO_AUTH_TOKEN) {
  // Production: Use remote Turso database
  client = createClient({
    url: process.env.TURSO_DB_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
} else {
  // Development: Use local SQLite database
  client = createClient({
    url: 'file:dev.db',
  });
}

// Create the database instance
export const db = drizzle(client, { schema });