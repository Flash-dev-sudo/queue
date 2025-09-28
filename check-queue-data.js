import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './shared/schema.ts';

// Queue database
const client = createClient({
  url: process.env.TURSO_DB_URL || "file:dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const db = drizzle(client, { schema });

async function analyzeQueueData() {
  console.log("🔍 ANALYZING QUEUE DATABASE...\n");

  try {
    const categories = await db.select().from(schema.categories);
    const menuItems = await db.select().from(schema.menuItems);
    const orders = await db.select().from(schema.orders);

    console.log(`📊 QUEUE DATABASE STATS:`);
    console.log(`✅ Categories: ${categories.length}`);
    console.log(`✅ Menu Items: ${menuItems.length}`);
    console.log(`✅ Orders: ${orders.length}`);

    if (categories.length > 0) {
      console.log("\n📋 CATEGORIES:");
      categories.forEach(cat => {
        console.log(`  - ID: ${cat.id}, Name: "${cat.name}", Icon: "${cat.icon}", Order: ${cat.displayOrder}`);
      });
    }

    if (menuItems.length > 0) {
      console.log("\n🍽️ MENU ITEMS (first 5):");
      menuItems.slice(0, 5).forEach(item => {
        const price = (item.price / 100).toFixed(2);
        const mealPrice = item.mealPrice ? ` (Meal: £${(item.mealPrice / 100).toFixed(2)})` : '';
        const options = [];
        if (item.hasFlavorOptions) options.push('Flavors');
        if (item.hasMealOption) options.push('Meal');
        if (item.isSpicyOption) options.push('Spicy');
        const optionsStr = options.length > 0 ? ` [${options.join(', ')}]` : '';

        console.log(`  - ID: ${item.id}, Cat: ${item.categoryId}, "${item.name}": £${price}${mealPrice}${optionsStr}`);
        if (item.description) console.log(`    Description: ${item.description}`);
      });
    }

    if (orders.length > 0) {
      console.log(`\n📦 RECENT ORDERS: ${orders.length} total`);
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  process.exit(0);
}

analyzeQueueData().catch(console.error);