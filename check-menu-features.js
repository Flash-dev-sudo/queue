import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DB_URL || "file:dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function checkMenuFeatures() {
  console.log("🔍 ANALYZING QUEUE MENU FEATURES...\n");

  try {
    // Get detailed menu item features
    const menuItems = await client.execute(`
      SELECT id, category_id, name, description, price, meal_price,
             has_flavor_options, has_meal_option, is_spicy_option, available
      FROM menu_items
      WHERE available = 1
      ORDER BY category_id, id
    `);

    console.log(`📊 TOTAL MENU ITEMS: ${menuItems.rows.length}\n`);

    // Analyze features
    const featuresAnalysis = {
      hasFlavorOptions: 0,
      hasMealOption: 0,
      isSpicyOption: 0,
      hasMealPrice: 0
    };

    console.log("🍽️ DETAILED MENU ITEMS WITH FEATURES:");
    menuItems.rows.forEach(item => {
      const price = (item.price / 100).toFixed(2);
      const mealPrice = item.meal_price ? ` (Meal: £${(item.meal_price / 100).toFixed(2)})` : '';

      const features = [];
      if (item.has_flavor_options) {
        features.push('🌶️ Flavors');
        featuresAnalysis.hasFlavorOptions++;
      }
      if (item.has_meal_option) {
        features.push('🍟 Meal');
        featuresAnalysis.hasMealOption++;
      }
      if (item.is_spicy_option) {
        features.push('🔥 Spicy');
        featuresAnalysis.isSpicyOption++;
      }
      if (item.meal_price) {
        featuresAnalysis.hasMealPrice++;
      }

      const featuresStr = features.length > 0 ? ` [${features.join(', ')}]` : '';

      console.log(`  - Cat:${item.category_id} "${item.name}": £${price}${mealPrice}${featuresStr}`);
      if (item.description) {
        console.log(`    "${item.description}"`);
      }
    });

    console.log(`\n📈 FEATURES SUMMARY:`);
    console.log(`  🌶️ Items with Flavor Options: ${featuresAnalysis.hasFlavorOptions}`);
    console.log(`  🍟 Items with Meal Options: ${featuresAnalysis.hasMealOption}`);
    console.log(`  🔥 Items with Spicy Options: ${featuresAnalysis.isSpicyOption}`);
    console.log(`  💰 Items with Meal Pricing: ${featuresAnalysis.hasMealPrice}`);

    // Show CartItem type from schema
    console.log(`\n🛒 CART CUSTOMIZATION SUPPORT (from schema):`);
    console.log(`  - Flavor options: Garlic & Hector, Medium, Hot, Extra Hot, BBQ`);
    console.log(`  - Chip types: Available`);
    console.log(`  - Toppings: Array support`);
    console.log(`  - Meal upgrades: Boolean flag`);
    console.log(`  - Spicy variants: Boolean flag`);

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  client.close();
}

checkMenuFeatures();