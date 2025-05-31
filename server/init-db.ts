import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DB_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function initializeDatabase() {
  try {
    console.log("Initializing database tables...");
    
    // Create users table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'staff'
      )
    `);

    // Create categories table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        icon TEXT,
        display_order INTEGER DEFAULT 0
      )
    `);

    // Create menu_items table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        category_id INTEGER NOT NULL,
        available BOOLEAN DEFAULT true,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `);

    // Create orders table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'new',
        total_amount REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create order_items table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        menu_item_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        notes TEXT,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
      )
    `);

    // Insert categories
    await client.execute(`
      INSERT OR IGNORE INTO categories (id, name, icon, display_order) VALUES
      (1, 'Starters', 'utensils', 1),
      (2, 'Platters', 'chef-hat', 2),
      (3, 'Fried Chicken', 'drumstick', 3),
      (4, 'Pizzas', 'pizza', 4),
      (5, 'Mains', 'meal', 5)
    `);

    // Insert menu items
    await client.execute(`
      INSERT OR IGNORE INTO menu_items (name, description, price, category_id, available) VALUES
      -- Starters
      ('Chips', 'Regular portion of crispy chips', 2.50, 1, true),
      ('Peri Peri Chips', 'Chips with spicy peri peri seasoning', 3.00, 1, true),
      ('Chips with Cheese', 'Chips topped with melted cheese', 4.00, 1, true),
      ('Potato Wedges', 'Crispy seasoned potato wedges', 3.50, 1, true),
      ('Cheesy Potato Wedges', 'Potato wedges with melted cheese', 4.50, 1, true),
      ('Chicken Nuggets (4pc)', 'Four pieces of tender chicken nuggets', 3.50, 1, true),
      ('Chicken Nuggets (6pc)', 'Six pieces of tender chicken nuggets', 4.50, 1, true),
      ('Chicken Nuggets (10pc)', 'Ten pieces of tender chicken nuggets', 6.50, 1, true),
      ('Chicken Wings (4pc)', 'Four pieces of marinated chicken wings', 4.00, 1, true),
      ('Chicken Wings (6pc)', 'Six pieces of marinated chicken wings', 5.50, 1, true),
      ('Chicken Wings (8pc)', 'Eight pieces of marinated chicken wings', 7.00, 1, true),
      ('Chicken Strips (3pc)', 'Three pieces of crispy chicken strips', 4.00, 1, true),
      ('Chicken Strips (5pc)', 'Five pieces of crispy chicken strips', 6.00, 1, true),
      ('Onion Rings (6pc)', 'Six pieces of golden onion rings', 3.00, 1, true),
      ('Onion Rings (9pc)', 'Nine pieces of golden onion rings', 4.00, 1, true),
      ('Jalapeño Poppers (4pc)', 'Four pieces of spicy jalapeño poppers', 4.50, 1, true),
      ('Mozzarella Sticks (4pc)', 'Four pieces of crispy mozzarella sticks', 4.00, 1, true),
      ('Mozzarella Sticks (6pc)', 'Six pieces of crispy mozzarella sticks', 5.50, 1, true),

      -- Platters
      ('Chicken Wings Platter', 'Chicken wings with chips and drink', 8.50, 2, true),
      ('Mix Grill Platter', 'Mixed grilled items with chips and drink', 12.00, 2, true),
      ('Chicken Strips Platter', 'Chicken strips with chips and drink', 9.00, 2, true),
      ('Family Sharing Platter', 'Large platter for sharing', 18.00, 2, true),

      -- Fried Chicken
      ('Fried Chicken (1pc)', 'One piece of crispy fried chicken', 2.50, 3, true),
      ('Fried Chicken (2pc)', 'Two pieces of crispy fried chicken', 4.50, 3, true),
      ('Fried Chicken (3pc)', 'Three pieces of crispy fried chicken', 6.50, 3, true),
      ('Fried Chicken (6pc)', 'Six pieces of crispy fried chicken', 11.00, 3, true),
      ('Fried Chicken (10pc)', 'Ten pieces of crispy fried chicken', 16.00, 3, true),
      ('Fried Chicken Burger', 'Crispy fried chicken in a bun', 5.50, 3, true),
      ('Spicy Fried Chicken Burger', 'Spicy fried chicken in a bun', 6.00, 3, true),
      ('Chicken Fillet Burger', 'Grilled chicken fillet burger', 5.00, 3, true),

      -- Pizzas
      ('Margherita Pizza (10inch)', 'Classic margherita pizza', 8.00, 4, true),
      ('Margherita Pizza (12inch)', 'Classic margherita pizza', 10.00, 4, true),
      ('Pepperoni Pizza (10inch)', 'Pepperoni pizza', 9.00, 4, true),
      ('Pepperoni Pizza (12inch)', 'Pepperoni pizza', 11.50, 4, true),
      ('BBQ Chicken Pizza (10inch)', 'BBQ chicken pizza', 10.00, 4, true),
      ('BBQ Chicken Pizza (12inch)', 'BBQ chicken pizza', 12.50, 4, true),
      ('Meat Feast Pizza (10inch)', 'Pizza with multiple meats', 11.00, 4, true),
      ('Meat Feast Pizza (12inch)', 'Pizza with multiple meats', 13.50, 4, true),
      ('Vegetarian Pizza (10inch)', 'Fresh vegetarian pizza', 9.50, 4, true),
      ('Vegetarian Pizza (12inch)', 'Fresh vegetarian pizza', 11.00, 4, true),

      -- Mains (numbered 1-15)
      ('1. Classic Beef Burger', 'Juicy beef patty with fresh toppings', 6.50, 5, true),
      ('1. Classic Beef Burger Meal', 'Classic beef burger with chips and drink', 9.50, 5, true),
      ('2. Cheese Burger', 'Beef burger with melted cheese', 7.00, 5, true),
      ('2. Cheese Burger Meal', 'Cheese burger with chips and drink', 10.00, 5, true),
      ('3. Double Beef Burger', 'Two beef patties with all the trimmings', 8.50, 5, true),
      ('3. Double Beef Burger Meal', 'Double beef burger with chips and drink', 11.50, 5, true),
      ('4. BBQ Bacon Burger', 'Beef burger with bacon and BBQ sauce', 8.00, 5, true),
      ('4. BBQ Bacon Burger Meal', 'BBQ bacon burger with chips and drink', 11.00, 5, true),
      ('5. Chicken Burger', 'Grilled chicken breast burger', 6.00, 5, true),
      ('5. Chicken Burger Meal', 'Chicken burger with chips and drink', 9.00, 5, true),
      ('6. Spicy Chicken Burger', 'Spicy grilled chicken burger', 6.50, 5, true),
      ('6. Spicy Chicken Burger Meal', 'Spicy chicken burger with chips and drink', 9.50, 5, true),
      ('7. Fish Burger', 'Crispy fish fillet burger', 5.50, 5, true),
      ('7. Fish Burger Meal', 'Fish burger with chips and drink', 8.50, 5, true),
      ('8. Veggie Burger', 'Plant-based burger patty', 5.00, 5, true),
      ('8. Veggie Burger Meal', 'Veggie burger with chips and drink', 8.00, 5, true),
      ('9. Chicken Wrap', 'Grilled chicken in a soft tortilla', 5.50, 5, true),
      ('9. Chicken Wrap Meal', 'Chicken wrap with chips and drink', 8.50, 5, true),
      ('10. BBQ Chicken Wrap', 'BBQ chicken in a soft tortilla', 6.00, 5, true),
      ('10. BBQ Chicken Wrap Meal', 'BBQ chicken wrap with chips and drink', 9.00, 5, true),
      ('11. Chicken Quesadilla', 'Grilled chicken quesadilla', 6.50, 5, true),
      ('11. Chicken Quesadilla Meal', 'Chicken quesadilla with chips and drink', 9.50, 5, true),
      ('12. Fish and Chips', 'Battered fish with chips', 7.50, 5, true),
      ('12. Fish and Chips Meal', 'Fish and chips with drink', 9.50, 5, true),
      ('13. Chicken Salad', 'Fresh salad with grilled chicken', 6.00, 5, true),
      ('13. Chicken Salad Meal', 'Chicken salad with drink', 8.00, 5, true),
      ('14. Caesar Salad', 'Classic caesar salad', 5.50, 5, true),
      ('14. Caesar Salad Meal', 'Caesar salad with drink', 7.50, 5, true),
      ('15. Chicken Rice Bowl', 'Grilled chicken with seasoned rice', 7.00, 5, true),
      ('15. Chicken Rice Bowl Meal', 'Chicken rice bowl with drink', 9.00, 5, true)
    `);

    console.log("Database initialized successfully!");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}