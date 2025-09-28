import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';

// Simple queries without schema
const client = createClient({
  url: process.env.TURSO_DB_URL || "file:dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function checkData() {
  console.log("🔍 CHECKING QUEUE DATABASE TABLES...\n");

  try {
    // Simple count queries
    const categoryCount = await client.execute("SELECT COUNT(*) as count FROM categories");
    const menuItemCount = await client.execute("SELECT COUNT(*) as count FROM menu_items");

    console.log(`📊 QUEUE DATABASE STATS:`);
    console.log(`✅ Categories: ${categoryCount.rows[0].count}`);
    console.log(`✅ Menu Items: ${menuItemCount.rows[0].count}`);

    // Get some sample data
    if (categoryCount.rows[0].count > 0) {
      const categories = await client.execute("SELECT id, name, icon, display_order FROM categories LIMIT 5");
      console.log("\n📋 CATEGORIES:");
      categories.rows.forEach(cat => {
        console.log(`  - ID: ${cat.id}, Name: "${cat.name}", Icon: "${cat.icon}", Order: ${cat.display_order}`);
      });
    }

    if (menuItemCount.rows[0].count > 0) {
      const menuItems = await client.execute(`
        SELECT id, category_id, name, description, price, meal_price,
               has_flavor_options, has_meal_option, is_spicy_option, available
        FROM menu_items LIMIT 5
      `);
      console.log("\n🍽️ MENU ITEMS (first 5):");
      menuItems.rows.forEach(item => {
        const price = (item.price / 100).toFixed(2);
        const mealPrice = item.meal_price ? ` (Meal: £${(item.meal_price / 100).toFixed(2)})` : '';
        const options = [];
        if (item.has_flavor_options) options.push('Flavors');
        if (item.has_meal_option) options.push('Meal');
        if (item.is_spicy_option) options.push('Spicy');
        const optionsStr = options.length > 0 ? ` [${options.join(', ')}]` : '';
        const available = item.available ? '✅' : '❌';

        console.log(`  - ${available} ID: ${item.id}, Cat: ${item.category_id}, "${item.name}": £${price}${mealPrice}${optionsStr}`);
        if (item.description) console.log(`    Description: ${item.description}`);
      });
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  client.close();
}

checkData();