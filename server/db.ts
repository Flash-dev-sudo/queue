import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from "@shared/schema";
import { eq, inArray } from 'drizzle-orm';

if (!process.env.TURSO_DB_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.warn("Turso credentials not found, using in-memory storage instead");
}

// Create the client
const client = createClient({
  url: process.env.TURSO_DB_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

// Create the database instance
export const db = drizzle(client, { schema });

// Export drizzle operators
export { eq, inArray };