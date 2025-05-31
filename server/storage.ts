import { 
  users, type User, type InsertUser,
  categories, type Category, type InsertCategory,
  menuItems, type MenuItem, type InsertMenuItem,
  orders, type Order, type InsertOrder, type OrderWithItems,
  orderItems, type OrderItem, type InsertOrderItem,
  type FullOrder, type OrderItemWithDetails,
  OrderStatus
} from "@shared/schema";
import { db } from "./turso-db";
import { eq, and } from "drizzle-orm";

// Storage interface for CRUD operations
export interface IStorage {
  // User operations (from template)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Menu item operations
  getMenuItems(): Promise<MenuItem[]>;
  getMenuItemsByCategory(categoryId: number): Promise<MenuItem[]>;
  getMenuItem(id: number): Promise<MenuItem | undefined>;
  createMenuItem(menuItem: InsertMenuItem): Promise<MenuItem>;
  
  // Order operations
  getOrders(): Promise<Order[]>;
  getOrdersWithStatus(status: string): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  getFullOrder(id: number): Promise<FullOrder | undefined>;
  getActiveOrders(): Promise<FullOrder[]>;
  
  // Order item operations
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private menuItems: Map<number, MenuItem>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  
  private userIdCounter: number;
  private categoryIdCounter: number;
  private menuItemIdCounter: number;
  private orderIdCounter: number;
  private orderItemIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.menuItems = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    
    this.userIdCounter = 1;
    this.categoryIdCounter = 1;
    this.menuItemIdCounter = 1;
    this.orderIdCounter = 1;
    this.orderItemIdCounter = 1;
    
    // Initialize with demo data
    this.initializeData();
  }
  
  // Initialize with updated Emparo Food menu
  private async initializeData() {
    // Create categories based on the updated menu structure
    const categoryData: InsertCategory[] = [
      { name: "Starters", icon: "restaurant", displayOrder: 1 },
      { name: "Fried Chicken", icon: "set_meal", displayOrder: 2 },
      { name: "Pizzas", icon: "local_pizza", displayOrder: 3 },
      { name: "Platters, Feasts & Specials", icon: "dinner_dining", displayOrder: 4 },
      { name: "Mains", icon: "lunch_dining", displayOrder: 5 }
    ];
    
    const categories: Category[] = [];
    for (const category of categoryData) {
      categories.push(await this.createCategory(category));
    }
    
    // Create menu items from the updated Emparo Food menu
    
    // STARTERS (£2.50 - £4.50)
    await this.createMenuItem({ name: "Chips", description: "Regular portion of freshly made chips", price: 250, categoryId: 1, available: true });
    await this.createMenuItem({ name: "Peri Peri Chips", description: "Spicy peri peri seasoned chips", price: 300, categoryId: 1, available: true });
    await this.createMenuItem({ name: "Chips with Cheese", description: "Freshly made chips topped with melted cheese", price: 400, categoryId: 1, available: true });
    await this.createMenuItem({ name: "Potato Wedges", description: "Seasoned potato wedges", price: 350, categoryId: 1, available: true });
    await this.createMenuItem({ name: "Potato Wedges with Cheese", description: "Potato wedges with melted cheese", price: 400, categoryId: 1, available: true });
    await this.createMenuItem({ name: "Fish Fingers", description: "Crispy breaded fish fingers", price: 400, categoryId: 1, available: true });
    await this.createMenuItem({ name: "Calamari", description: "Golden fried squid rings", price: 400, categoryId: 1, available: true });
    await this.createMenuItem({ name: "Mozzarella Sticks", description: "Breaded mozzarella cheese sticks", price: 400, categoryId: 1, available: true });
    await this.createMenuItem({ name: "Onion Rings (10 pcs)", description: "Crispy beer-battered onion rings", price: 400, categoryId: 1, available: true });
    await this.createMenuItem({ name: "Gamberoni (6 pcs)", description: "King prawns in crispy coating", price: 400, categoryId: 1, available: true });
    await this.createMenuItem({ name: "Nuggets", description: "Golden chicken nuggets", price: 300, categoryId: 1, available: true });
    await this.createMenuItem({ name: "Buffalo Wings", description: "Spicy buffalo sauce chicken wings", price: 450, categoryId: 1, available: true });
    await this.createMenuItem({ name: "BBQ Wings", description: "BBQ glazed chicken wings", price: 450, categoryId: 1, available: true });

    // PLATTERS, FEASTS & SPECIALS
    await this.createMenuItem({ name: "Strips with Rice (No drink)", description: "Chicken strips with flavoured rice", price: 750, categoryId: 4, available: true });
    await this.createMenuItem({ name: "Strips with Rice (With drink)", description: "Chicken strips with flavoured rice & drink", price: 800, categoryId: 4, available: true });
    await this.createMenuItem({ name: "Half Chicken with Rice (No drink)", description: "Half chicken with flavoured rice", price: 800, categoryId: 4, available: true });
    await this.createMenuItem({ name: "Half Chicken with Rice (With drink)", description: "Half chicken with flavoured rice & drink", price: 850, categoryId: 4, available: true });
    await this.createMenuItem({ name: "Chicken Wings with Rice (No drink)", description: "Chicken wings with flavoured rice", price: 700, categoryId: 4, available: true });
    await this.createMenuItem({ name: "Chicken Wings with Rice (With drink)", description: "Chicken wings with flavoured rice & drink", price: 750, categoryId: 4, available: true });
    await this.createMenuItem({ name: "Wings Platter", description: "15 wings, 2 chips, 2 drinks", price: 1549, categoryId: 4, available: true });
    await this.createMenuItem({ name: "Strips Platter", description: "15 strips, 2 chips, 2 drinks", price: 1549, categoryId: 4, available: true });
    await this.createMenuItem({ name: "Burger Feast", description: "3 Burgers, 8 Wings, 2 Chips, 1 Drink", price: 2449, categoryId: 4, available: true });
    await this.createMenuItem({ name: "Variety Platter", description: "1 Chicken, 8 Wings, 5 Strips, 2 Sides, 1 Drink", price: 2400, categoryId: 4, available: true });
    await this.createMenuItem({ name: "Emparo Special", description: "Half Chicken, 2 Burgers, 5 Wings, 2 Sides, 1 Drink", price: 2250, categoryId: 4, available: true });
    await this.createMenuItem({ name: "Feast Platter", description: "2 Chickens, 8 Wings, 8 Strips, 3 Sides, 1 Drink", price: 3849, categoryId: 4, available: true });

    // FRIED CHICKEN (£1.50 - £4.00)
    await this.createMenuItem({ name: "Wings (3 pcs)", description: "Three pieces of crispy fried chicken wings", price: 150, categoryId: 2, available: true });
    await this.createMenuItem({ name: "Wings (6 pcs)", description: "Six pieces of crispy fried chicken wings", price: 300, categoryId: 2, available: true });
    await this.createMenuItem({ name: "Strips (3 pcs)", description: "Three pieces of chicken breast strips", price: 200, categoryId: 2, available: true });
    await this.createMenuItem({ name: "Strips (6 pcs)", description: "Six pieces of chicken breast strips", price: 400, categoryId: 2, available: true });

    // PIZZAS (All £8.50)
    await this.createMenuItem({ name: "Margarita Pizza", description: "Classic cheese & tomato pizza", price: 850, categoryId: 3, available: true });
    await this.createMenuItem({ name: "Double Pepperoni Pizza", description: "Pizza with extra pepperoni topping", price: 850, categoryId: 3, available: true });
    await this.createMenuItem({ name: "Mediterranean Special Pizza", description: "Mediterranean vegetables and herbs", price: 850, categoryId: 3, available: true });
    await this.createMenuItem({ name: "Emparo Pizza", description: "House special pizza", price: 850, categoryId: 3, available: true });
    await this.createMenuItem({ name: "Veggie Hot Pizza", description: "Spicy vegetarian pizza with jalapeños", price: 850, categoryId: 3, available: true });
    await this.createMenuItem({ name: "Veggie Special Pizza", description: "Mixed vegetables topping", price: 850, categoryId: 3, available: true });
    await this.createMenuItem({ name: "American Hot Pizza", description: "Pepperoni, jalapeños, and hot sauce", price: 850, categoryId: 3, available: true });
    await this.createMenuItem({ name: "Peri Peri Special Pizza", description: "Peri peri chicken with spicy sauce", price: 850, categoryId: 3, available: true });
    await this.createMenuItem({ name: "Tandoori Special Pizza", description: "Tandoori chicken with onions", price: 850, categoryId: 3, available: true });
    await this.createMenuItem({ name: "BBQ Special Pizza", description: "BBQ chicken with smoky sauce", price: 850, categoryId: 3, available: true });
    await this.createMenuItem({ name: "Hawaiian Special Pizza", description: "Ham and pineapple classic", price: 850, categoryId: 3, available: true });
    await this.createMenuItem({ name: "Ham & Mushroom Pizza", description: "Ham and mushroom topping", price: 850, categoryId: 3, available: true });
    await this.createMenuItem({ name: "Tuna Special Pizza", description: "Tuna with onions and sweetcorn", price: 850, categoryId: 3, available: true });
    await this.createMenuItem({ name: "Four Seasons Pizza", description: "Four different sections with various toppings", price: 850, categoryId: 3, available: true });
    await this.createMenuItem({ name: "Meat Lovers Pizza", description: "Mixed meats with cheese", price: 850, categoryId: 3, available: true });

    // MAINS - Numbered 1-15 (Individual/Meal Options)
    await this.createMenuItem({ name: "1. Strip Burger", description: "Chicken strip burger", price: 250, categoryId: 5, available: true });
    await this.createMenuItem({ name: "1. Strip Burger Meal", description: "Strip burger with chips and drink", price: 400, categoryId: 5, available: true });
    await this.createMenuItem({ name: "2. Fillet Burger", description: "Chicken fillet burger", price: 350, categoryId: 5, available: true });
    await this.createMenuItem({ name: "2. Fillet Burger Meal", description: "Fillet burger with chips and drink", price: 500, categoryId: 5, available: true });
    await this.createMenuItem({ name: "3. Zinger Burger", description: "Spicy zinger chicken burger", price: 400, categoryId: 5, available: true });
    await this.createMenuItem({ name: "3. Zinger Burger Meal", description: "Zinger burger with chips and drink", price: 550, categoryId: 5, available: true });
    await this.createMenuItem({ name: "4. Fish/Vegetarian Burger", description: "Fish or vegetarian burger", price: 350, categoryId: 5, available: true });
    await this.createMenuItem({ name: "4. Fish/Vegetarian Burger Meal", description: "Fish/veggie burger with chips and drink", price: 500, categoryId: 5, available: true });
    await this.createMenuItem({ name: "5. Emparo Burger", description: "House special signature burger", price: 650, categoryId: 5, available: true });
    await this.createMenuItem({ name: "5. Emparo Burger Meal", description: "Emparo burger with chips and drink", price: 800, categoryId: 5, available: true });
    await this.createMenuItem({ name: "6. Tower Burger", description: "Multi-layer tower burger", price: 500, categoryId: 5, available: true });
    await this.createMenuItem({ name: "6. Tower Burger Meal", description: "Tower burger with chips and drink", price: 650, categoryId: 5, available: true });
    await this.createMenuItem({ name: "7. EFC Special", description: "Emparo Fried Chicken special", price: 650, categoryId: 5, available: true });
    await this.createMenuItem({ name: "7. EFC Special Meal", description: "EFC special with chips and drink", price: 800, categoryId: 5, available: true });
    await this.createMenuItem({ name: "8. Quarter Pounder", description: "1/4 lb beef burger", price: 400, categoryId: 5, available: true });
    await this.createMenuItem({ name: "8. Quarter Pounder Meal", description: "Quarter pounder with chips and drink", price: 550, categoryId: 5, available: true });
    await this.createMenuItem({ name: "9. Half Pounder", description: "1/2 lb beef burger", price: 500, categoryId: 5, available: true });
    await this.createMenuItem({ name: "9. Half Pounder Meal", description: "Half pounder with chips and drink", price: 650, categoryId: 5, available: true });
    await this.createMenuItem({ name: "10. Peri Peri Burger", description: "Spicy peri peri chicken burger", price: 500, categoryId: 5, available: true });
    await this.createMenuItem({ name: "10. Peri Peri Burger Meal", description: "Peri peri burger with chips and drink", price: 680, categoryId: 5, available: true });
    await this.createMenuItem({ name: "11. Peri Peri Wrap", description: "Peri peri chicken wrap", price: 450, categoryId: 5, available: true });
    await this.createMenuItem({ name: "11. Peri Peri Wrap Meal", description: "Peri peri wrap with chips and drink", price: 630, categoryId: 5, available: true });
    await this.createMenuItem({ name: "12. Peri Peri Wings", description: "Spicy peri peri chicken wings", price: 420, categoryId: 5, available: true });
    await this.createMenuItem({ name: "12. Peri Peri Wings Meal", description: "Peri peri wings with chips and drink", price: 600, categoryId: 5, available: true });
    await this.createMenuItem({ name: "13. Peri Peri Strips", description: "Spicy peri peri chicken strips", price: 470, categoryId: 5, available: true });
    await this.createMenuItem({ name: "13. Peri Peri Strips Meal", description: "Peri peri strips with chips and drink", price: 650, categoryId: 5, available: true });
    await this.createMenuItem({ name: "14. Half Chicken", description: "Half grilled chicken", price: 550, categoryId: 5, available: true });
    await this.createMenuItem({ name: "14. Half Chicken Meal", description: "Half chicken with chips and drink", price: 730, categoryId: 5, available: true });
    await this.createMenuItem({ name: "15. Whole Chicken", description: "Whole grilled chicken", price: 1050, categoryId: 5, available: true });
    await this.createMenuItem({ name: "15. Whole Chicken Meal", description: "Whole chicken with chips and drink", price: 1230, categoryId: 5, available: true });
    
    // Pizzas - all £8.50
    await this.createMenuItem({
      name: "Margherita Pizza",
      description: "Classic cheese & tomato pizza",
      price: 850,
      categoryId: 5,
      available: true
    });
    
    await this.createMenuItem({
      name: "Double Pepperoni Pizza",
      description: "Pizza with extra pepperoni topping",
      price: 850,
      categoryId: 5,
      available: true
    });
    
    await this.createMenuItem({
      name: "Emparo Pizza",
      description: "House special pizza",
      price: 850,
      categoryId: 5,
      available: true
    });
    
    await this.createMenuItem({
      name: "Ham & Mushroom Pizza",
      description: "Ham and mushroom topping",
      price: 850,
      categoryId: 5,
      available: true
    });
    
    await this.createMenuItem({
      name: "Veggie Special Pizza",
      description: "Mixed vegetables topping",
      price: 850,
      categoryId: 5,
      available: true
    });
    
    // Platters
    await this.createMenuItem({
      name: "Wings Platter",
      description: "15 Wings, 2 Sides & 2 Drinks",
      price: 1549,
      categoryId: 6,
      available: true
    });
    
    await this.createMenuItem({
      name: "EFC Special",
      description: "Fillet Burger, 3 Wings, Chips & Drink",
      price: 700,
      categoryId: 6,
      available: true
    });
    
    await this.createMenuItem({
      name: "Burger Feast",
      description: "3 Peri Burgers, 8 Peri Wings, 2 Sides & Bottle Drink",
      price: 2449,
      categoryId: 6,
      available: true
    });
    
    await this.createMenuItem({
      name: "Strip Platter",
      description: "15 Strips, 2 Sides & 2 Drinks",
      price: 1549,
      categoryId: 6,
      available: true
    });
    
    // Grilled Chicken
    await this.createMenuItem({
      name: "Quarter Grilled Chicken",
      description: "Quarter portion of freshly grilled chicken",
      price: 400,
      categoryId: 7,
      available: true
    });
    
    await this.createMenuItem({
      name: "Half Grilled Chicken",
      description: "Half portion of freshly grilled chicken",
      price: 550,
      categoryId: 7,
      available: true
    });
    
    await this.createMenuItem({
      name: "Whole Grilled Chicken",
      description: "Whole freshly grilled chicken",
      price: 1050,
      categoryId: 7,
      available: true
    });
    
    // Peri Peri Chicken
    await this.createMenuItem({
      name: "Peri Peri Wrap",
      description: "Spicy peri peri chicken in a wrap",
      price: 450,
      categoryId: 8,
      available: true
    });
    
    await this.createMenuItem({
      name: "Peri Peri Burger",
      description: "Spicy peri peri chicken burger",
      price: 500,
      categoryId: 8,
      available: true
    });
    
    await this.createMenuItem({
      name: "Peri Peri Wings",
      description: "Spicy peri peri chicken wings",
      price: 420,
      categoryId: 8,
      available: true
    });
    
    // Burgers & More
    await this.createMenuItem({
      name: "Chicken Strip Burger",
      description: "Burger with chicken strips",
      price: 250,
      categoryId: 9,
      available: true
    });
    
    await this.createMenuItem({
      name: "Chicken Fillet Burger",
      description: "Burger with chicken fillet",
      price: 350,
      categoryId: 9,
      available: true
    });
    
    await this.createMenuItem({
      name: "Zinger Burger",
      description: "Spicy zinger burger",
      price: 400,
      categoryId: 9,
      available: true
    });
    
    await this.createMenuItem({
      name: "Veggie Burger",
      description: "Vegetarian burger option",
      price: 350,
      categoryId: 9,
      available: true
    });
    
    // Add sample active orders for kitchen screen
    const order1 = await this.createOrder({
      orderNumber: "43825",
      status: OrderStatus.NEW,
      totalAmount: 800
    });
    
    await this.createOrderItem({
      orderId: order1.id,
      menuItemId: 7,
      name: "Fish Fingers",
      price: 400,
      quantity: 2,
      notes: "No special instructions"
    });
    
    const order2 = await this.createOrder({
      orderNumber: "43824",
      status: OrderStatus.PREPARING,
      totalAmount: 1650
    });
    
    await this.createOrderItem({
      orderId: order2.id,
      menuItemId: 14,
      name: "Wings Bucket",
      price: 1350,
      quantity: 1,
      notes: "15 Wings, 2 Fries, 1 Bottle Drink"
    });
    
    await this.createOrderItem({
      orderId: order2.id,
      menuItemId: 17,
      name: "Chocolate Fudge Cake",
      price: 300,
      quantity: 1,
      notes: "No special instructions"
    });
    
    const order3 = await this.createOrder({
      orderNumber: "43823",
      status: OrderStatus.READY,
      totalAmount: 900
    });
    
    await this.createOrderItem({
      orderId: order3.id,
      menuItemId: 18,
      name: "Peri Peri Burger",
      price: 500,
      quantity: 1,
      notes: "No sauce"
    });
    
    await this.createOrderItem({
      orderId: order3.id,
      menuItemId: 3,
      name: "Chips with Cheese",
      price: 400,
      quantity: 1,
      notes: "Extra cheese"
    });
  }
  
  // User methods (from template)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Category methods
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values())
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }
  
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.categoryIdCounter++;
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }
  
  // Menu item methods
  async getMenuItems(): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values());
  }
  
  async getMenuItemsByCategory(categoryId: number): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values())
      .filter(item => item.categoryId === categoryId);
  }
  
  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    return this.menuItems.get(id);
  }
  
  async createMenuItem(insertMenuItem: InsertMenuItem): Promise<MenuItem> {
    const id = this.menuItemIdCounter++;
    const menuItem: MenuItem = { ...insertMenuItem, id };
    this.menuItems.set(id, menuItem);
    return menuItem;
  }
  
  // Order methods
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }
  
  async getOrdersWithStatus(status: string): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.status === status);
  }
  
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }
  
  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    return Array.from(this.orders.values())
      .find(order => order.orderNumber === orderNumber);
  }
  
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.orderIdCounter++;
    const now = new Date();
    const order: Order = { 
      ...insertOrder, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.orders.set(id, order);
    return order;
  }
  
  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = await this.getOrder(id);
    if (!order) return undefined;
    
    const updatedOrder: Order = { 
      ...order, 
      status, 
      updatedAt: new Date() 
    };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }
  
  async getFullOrder(id: number): Promise<FullOrder | undefined> {
    const order = await this.getOrder(id);
    if (!order) return undefined;
    
    const orderItems = await this.getOrderItems(id);
    
    const items: OrderItemWithDetails[] = orderItems.map(item => ({
      id: item.id,
      menuItemId: item.menuItemId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      notes: item.notes
    }));
    
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items
    };
  }
  
  async getActiveOrders(): Promise<FullOrder[]> {
    const activeOrders = Array.from(this.orders.values())
      .filter(order => [OrderStatus.NEW, OrderStatus.PREPARING, OrderStatus.READY].includes(order.status as any))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort by newest first
    
    const fullOrders: FullOrder[] = [];
    
    for (const order of activeOrders) {
      const fullOrder = await this.getFullOrder(order.id);
      if (fullOrder) {
        fullOrders.push(fullOrder);
      }
    }
    
    return fullOrders;
  }
  
  // Order item methods
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values())
      .filter(item => item.orderId === orderId);
  }
  
  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const id = this.orderItemIdCounter++;
    const orderItem: OrderItem = { ...insertOrderItem, id };
    this.orderItems.set(id, orderItem);
    return orderItem;
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.displayOrder);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }

  // Menu item operations
  async getMenuItems(): Promise<MenuItem[]> {
    return await db.select().from(menuItems);
  }

  async getMenuItemsByCategory(categoryId: number): Promise<MenuItem[]> {
    return await db.select().from(menuItems).where(eq(menuItems.categoryId, categoryId));
  }

  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id));
    return item;
  }

  async createMenuItem(insertMenuItem: InsertMenuItem): Promise<MenuItem> {
    const [item] = await db.insert(menuItems).values(insertMenuItem).returning();
    return item;
  }

  // Order operations
  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders);
  }

  async getOrdersWithStatus(status: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.status, status));
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
    return order;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(insertOrder).returning();
    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [order] = await db.update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async getFullOrder(id: number): Promise<FullOrder | undefined> {
    const order = await this.getOrder(id);
    if (!order) return undefined;

    const items = await db.select({
      id: orderItems.id,
      menuItemId: orderItems.menuItemId,
      name: menuItems.name,
      price: menuItems.price,
      quantity: orderItems.quantity,
      notes: orderItems.notes
    })
    .from(orderItems)
    .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .where(eq(orderItems.orderId, id));

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: items.map(item => ({
        id: item.id,
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        notes: item.notes || undefined
      }))
    };
  }

  async getActiveOrders(): Promise<FullOrder[]> {
    const activeOrders = await db.select().from(orders)
      .where(
        and(
          eq(orders.status, 'new')
        )
      );

    const fullOrders: FullOrder[] = [];
    for (const order of activeOrders) {
      const fullOrder = await this.getFullOrder(order.id);
      if (fullOrder) fullOrders.push(fullOrder);
    }
    return fullOrders;
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const [item] = await db.insert(orderItems).values(insertOrderItem).returning();
    return item;
  }
}

// Initialize the appropriate storage implementation
// Use DatabaseStorage for production, MemStorage for development
export const storage = process.env.NODE_ENV === 'production' 
  ? new DatabaseStorage() 
  : new MemStorage();
