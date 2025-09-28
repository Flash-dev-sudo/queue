import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as queueSchema from './shared/schema.ts';

// Queue database
const queueClient = createClient({
  url: process.env.TURSO_DB_URL || "file:queue/dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const queueDb = drizzle(queueClient, { schema: queueSchema });

// Website database
const websiteClient = createClient({
  url: process.env.DATABASE_URL || "file:Empareperiperi/dev.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
const websiteDb = drizzle(websiteClient, { schema: websiteSchema });

async function analyzeData() {
  console.log("🔍 ANALYZING DATABASES...\n");

  // Queue Database Analysis
  console.log("📊 QUEUE DATABASE:");
  try {
    const queueCategories = await queueDb.select().from(queueSchema.categories);
    const queueMenuItems = await queueDb.select().from(queueSchema.menuItems);

    console.log(`✅ Categories: ${queueCategories.length}`);
    console.log(`✅ Menu Items: ${queueMenuItems.length}`);

    if (queueCategories.length > 0) {
      console.log("\n📋 Categories:");
      queueCategories.forEach(cat => console.log(`  - ${cat.name} (${cat.icon})`));
    }

    if (queueMenuItems.length > 0) {
      console.log("\n🍽️ Sample Menu Items:");
      queueMenuItems.slice(0, 3).forEach(item =>
        console.log(`  - ${item.name}: £${(item.price/100).toFixed(2)} (Category: ${item.categoryId})`)
      );
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  // Website Database Analysis
  console.log("\n📊 WEBSITE DATABASE:");
  try {
    const websiteCategories = await websiteDb.select().from(websiteSchema.catalogCategories);
    const websiteMenuItems = await websiteDb.select().from(websiteSchema.catalogMenuItems);

    console.log(`✅ Catalog Categories: ${websiteCategories.length}`);
    console.log(`✅ Catalog Menu Items: ${websiteMenuItems.length}`);

    if (websiteCategories.length > 0) {
      console.log("\n📋 Categories:");
      websiteCategories.forEach(cat => console.log(`  - ${cat.name} (${cat.icon})`));
    }

    if (websiteMenuItems.length > 0) {
      console.log("\n🍽️ Sample Menu Items:");
      websiteMenuItems.slice(0, 3).forEach(item =>
        console.log(`  - ${item.name}: £${(item.price/100).toFixed(2)} (Category: ${item.categoryId})`)
      );
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  process.exit(0);
}

analyzeData().catch(console.error);