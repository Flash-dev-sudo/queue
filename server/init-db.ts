import { createClient } from '@libsql/client';

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

    // Clear existing data first
    await client.execute(`DELETE FROM order_items;`);
    await client.execute(`DELETE FROM orders;`);
    await client.execute(`DELETE FROM menu_items;`);
    await client.execute(`DELETE FROM categories;`);

    // Insert categories
    await client.execute(`
      INSERT INTO categories (id, name, icon, display_order) VALUES
      (1, 'Starters', 'utensils', 1),
      (2, 'Platters', 'chef-hat', 2),
      (3, 'Fried Chicken', 'drumstick', 3),
      (4, 'Pizzas', 'pizza', 4),
      (5, 'Mains', 'meal', 5)
    `);

    // Insert menu items
    await client.execute(`
      INSERT INTO menu_items (name, description, price, category_id, available) VALUES
      -- Starters
      ('Chips', 'Regular portion of crispy chips', 250, 1, true),
      ('Peri Peri Chips', 'Chips with spicy peri peri seasoning', 300, 1, true),
      ('Chips with Cheese', 'Chips topped with melted cheese', 400, 1, true),
      ('Potato Wedges', 'Crispy seasoned potato wedges', 350, 1, true),
      ('Cheesy Potato Wedges', 'Potato wedges with melted cheese', 450, 1, true),
      ('Chicken Nuggets (4pc)', 'Four pieces of tender chicken nuggets', 350, 1, true),
      ('Chicken Nuggets (6pc)', 'Six pieces of tender chicken nuggets', 450, 1, true),
      ('Chicken Nuggets (10pc)', 'Ten pieces of tender chicken nuggets', 650, 1, true),
      ('Chicken Wings (4pc)', 'Four pieces of marinated chicken wings', 400, 1, true),
      ('Chicken Wings (6pc)', 'Six pieces of marinated chicken wings', 550, 1, true),
      ('Chicken Wings (8pc)', 'Eight pieces of marinated chicken wings', 700, 1, true),
      ('Chicken Strips (3pc)', 'Three pieces of crispy chicken strips', 400, 1, true),
      ('Chicken Strips (5pc)', 'Five pieces of crispy chicken strips', 600, 1, true),
      ('Onion Rings (6pc)', 'Six pieces of golden onion rings', 300, 1, true),
      ('Onion Rings (9pc)', 'Nine pieces of golden onion rings', 400, 1, true),
      ('Jalapeño Poppers (4pc)', 'Four pieces of spicy jalapeño poppers', 450, 1, true),
      ('Mozzarella Sticks (4pc)', 'Four pieces of crispy mozzarella sticks', 400, 1, true),
      ('Mozzarella Sticks (6pc)', 'Six pieces of crispy mozzarella sticks', 550, 1, true),

      -- Platters
      ('Chicken Wings Platter', 'Chicken wings with chips and drink', 850, 2, true),
      ('Mix Grill Platter', 'Mixed grilled items with chips and drink', 1200, 2, true),
      ('Chicken Strips Platter', 'Chicken strips with chips and drink', 900, 2, true),
      ('Family Sharing Platter', 'Large platter for sharing', 1800, 2, true),

      -- Fried Chicken
      ('Fried Chicken (1pc)', 'One piece of crispy fried chicken', 250, 3, true),
      ('Fried Chicken (2pc)', 'Two pieces of crispy fried chicken', 450, 3, true),
      ('Fried Chicken (3pc)', 'Three pieces of crispy fried chicken', 650, 3, true),
      ('Fried Chicken (6pc)', 'Six pieces of crispy fried chicken', 1100, 3, true),
      ('Fried Chicken (10pc)', 'Ten pieces of crispy fried chicken', 1600, 3, true),
      ('Fried Chicken Burger', 'Crispy fried chicken in a bun', 550, 3, true),
      ('Spicy Fried Chicken Burger', 'Spicy fried chicken in a bun', 600, 3, true),
      ('Chicken Fillet Burger', 'Grilled chicken fillet burger', 500, 3, true),

      -- Pizzas
      ('Margherita Pizza (10inch)', 'Classic margherita pizza', 800, 4, true),
      ('Margherita Pizza (12inch)', 'Classic margherita pizza', 1000, 4, true),
      ('Pepperoni Pizza (10inch)', 'Pepperoni pizza', 900, 4, true),
      ('Pepperoni Pizza (12inch)', 'Pepperoni pizza', 1150, 4, true),
      ('BBQ Chicken Pizza (10inch)', 'BBQ chicken pizza', 1000, 4, true),
      ('BBQ Chicken Pizza (12inch)', 'BBQ chicken pizza', 1250, 4, true),
      ('Meat Feast Pizza (10inch)', 'Pizza with multiple meats', 1100, 4, true),
      ('Meat Feast Pizza (12inch)', 'Pizza with multiple meats', 1350, 4, true),
      ('Vegetarian Pizza (10inch)', 'Fresh vegetarian pizza', 950, 4, true),
      ('Vegetarian Pizza (12inch)', 'Fresh vegetarian pizza', 1100, 4, true),

      -- Mains (numbered 1-15) - Individual items only, meal upgrade available in order summary
      ('1. Classic Beef Burger', 'Juicy beef patty with fresh toppings', 650, 5, true),
      ('2. Cheese Burger', 'Beef burger with melted cheese', 700, 5, true),
      ('3. Double Beef Burger', 'Two beef patties with all the trimmings', 850, 5, true),
      ('4. BBQ Bacon Burger', 'Beef burger with bacon and BBQ sauce', 800, 5, true),
      ('5. Chicken Burger', 'Grilled chicken breast burger', 600, 5, true),
      ('6. Spicy Chicken Burger', 'Spicy grilled chicken burger', 650, 5, true),
      ('7. Fish Burger', 'Crispy fish fillet burger', 550, 5, true),
      ('8. Veggie Burger', 'Plant-based burger patty', 500, 5, true),
      ('9. Chicken Wrap', 'Grilled chicken in a soft tortilla', 550, 5, true),
      ('10. BBQ Chicken Wrap', 'BBQ chicken in a soft tortilla', 600, 5, true),
      ('11. Chicken Quesadilla', 'Grilled chicken quesadilla', 650, 5, true),
      ('12. Fish and Chips', 'Battered fish with chips', 750, 5, true),
      ('13. Chicken Salad', 'Fresh salad with grilled chicken', 600, 5, true),
      ('14. Caesar Salad', 'Classic caesar salad', 550, 5, true),
      ('15. Chicken Rice Bowl', 'Grilled chicken with seasoned rice', 700, 5, true)
    `);

    console.log("Database initialized successfully!");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}