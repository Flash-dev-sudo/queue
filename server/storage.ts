import { 
  users, type User, type InsertUser,
  categories, type Category, type InsertCategory,
  menuItems, type MenuItem, type InsertMenuItem,
  orders, type Order, type InsertOrder, type OrderWithItems,
  orderItems, type OrderItem, type InsertOrderItem,
  dailyStats, type DailyStats, type InsertDailyStats,
  type FullOrder, type OrderItemWithDetails,
  OrderStatus
} from "@shared/schema";
import { db } from "./turso-db";
import { eq, and, sql } from "drizzle-orm";
import { desc } from "drizzle-orm";

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
  getAllOrders(): Promise<FullOrder[]>;
  
  // Order item operations
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  
  // Data cleanup operations
  cleanupOldOrders(): Promise<void>;
  generateDailyStats(date: string): Promise<void>;
  
  // Analytics operations
  getPopularItems(): Promise<Array<{
    itemName: string;
    totalOrdered: number;
    totalRevenue: number;
    percentage: number;
  }>>;
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
    // Create only the 6 main categories - completely empty
    const categoryData: InsertCategory[] = [
      { name: "Starters", icon: "restaurant", displayOrder: 1 },
      { name: "Platters", icon: "dinner_dining", displayOrder: 2 },
      { name: "Mains", icon: "lunch_dining", displayOrder: 3 },
      { name: "Pizza", icon: "local_pizza", displayOrder: 4 },
      { name: "Chicken", icon: "set_meal", displayOrder: 5 },
      { name: "Milkshakes", icon: "local_bar", displayOrder: 6 }
    ];
    
    const categories: Category[] = [];
    for (const category of categoryData) {
      categories.push(await this.createCategory(category));
    }
    
    // STARTERS - Adding the first category items
    await this.createMenuItem({ name: "Chips", description: "", price: 250, categoryId: 1, available: true });
    await this.createMenuItem({ name: "Peri Peri Chips", description: "", price: 300, categoryId: 1, available: true });
    await this.createMenuItem({ name: "Chips with Cheese", description: "", price: 400, categoryId: 1, available: true });
    await this.createMenuItem({ name: "Potato Wedges", description: "", price: 350, categoryId: 1, available: true });
    await this.createMenuItem({ name: "Potato Wedges with Cheese", description: "", price: 400, categoryId: 1, available: true });
    await this.createMenuItem({ name: "Fish Fingers", description: "", price: 400, categoryId: 1, available: true });
    await this.createMenuItem({ name: "Calamari", description: "", price: 400, categoryId: 1, available: true });
    await this.createMenuItem({ name: "Mozzarella Sticks", description: "", price: 400, categoryId: 1, available: true });
    await this.createMenuItem({ name: "Onion Rings (10 pcs)", description: "", price: 400, categoryId: 1, available: true });
    await this.createMenuItem({ name: "Gamberoni (6 pcs)", description: "", price: 400, categoryId: 1, available: true });
    await this.createMenuItem({ name: "Nuggets", description: "", price: 300, categoryId: 1, available: true });
    await this.createMenuItem({ name: "Buffalo Wings", description: "", price: 450, categoryId: 1, available: true });
    await this.createMenuItem({ name: "BBQ Wings", description: "", price: 450, categoryId: 1, available: true });

    // PIZZA MENU - All £8.50
    await this.createMenuItem({ name: "Margarita", description: "", price: 850, categoryId: 4, available: true });
    await this.createMenuItem({ name: "Double Peperoni", description: "", price: 850, categoryId: 4, available: true });
    await this.createMenuItem({ name: "Mediterranean Special", description: "", price: 850, categoryId: 4, available: true });
    await this.createMenuItem({ name: "Emparo Special", description: "", price: 850, categoryId: 4, available: true });
    await this.createMenuItem({ name: "Veggie Hot", description: "", price: 850, categoryId: 4, available: true });
    await this.createMenuItem({ name: "Veggie Special", description: "", price: 850, categoryId: 4, available: true });
    await this.createMenuItem({ name: "American Hot", description: "", price: 850, categoryId: 4, available: true });
    await this.createMenuItem({ name: "Peri Peri Special", description: "", price: 850, categoryId: 4, available: true });
    await this.createMenuItem({ name: "Tandoori Special", description: "", price: 850, categoryId: 4, available: true });
    await this.createMenuItem({ name: "BBQ Special", description: "", price: 850, categoryId: 4, available: true });
    await this.createMenuItem({ name: "Hawai Special", description: "", price: 850, categoryId: 4, available: true });
    await this.createMenuItem({ name: "Tuna Special", description: "", price: 850, categoryId: 4, available: true });
    await this.createMenuItem({ name: "Four Season", description: "", price: 850, categoryId: 4, available: true });
    await this.createMenuItem({ name: "Meat Lovers", description: "", price: 850, categoryId: 4, available: true });

    // MAINS - Burgers with meal upgrade options (+£1.50 for most, +£1.80 for grilled items)
    await this.createMenuItem({ name: "Strip Burger", description: "", price: 250, mealPrice: 400, categoryId: 3, available: true, hasMealOption: true });
    await this.createMenuItem({ name: "Fillet Burger", description: "", price: 350, mealPrice: 500, categoryId: 3, available: true, hasMealOption: true });
    await this.createMenuItem({ name: "Zinger Burger", description: "", price: 400, mealPrice: 550, categoryId: 3, available: true, hasMealOption: true });
    await this.createMenuItem({ name: "Fish / Vegetarian Burger", description: "", price: 350, mealPrice: 500, categoryId: 3, available: true, hasMealOption: true });
    await this.createMenuItem({ name: "Emparo Burger", description: "", price: 650, mealPrice: 800, categoryId: 3, available: true, hasMealOption: true });
    await this.createMenuItem({ name: "Tower Burger", description: "", price: 500, mealPrice: 650, categoryId: 3, available: true, hasMealOption: true });
    await this.createMenuItem({ name: "EFC Special", description: "", price: 650, mealPrice: 800, categoryId: 3, available: true, hasMealOption: true });
    await this.createMenuItem({ name: "Quarter Pounder", description: "", price: 400, mealPrice: 550, categoryId: 3, available: true, hasMealOption: true });
    await this.createMenuItem({ name: "Half Pounder", description: "", price: 500, mealPrice: 650, categoryId: 3, available: true, hasMealOption: true });
    await this.createMenuItem({ name: "Peri Peri Burger", description: "", price: 500, mealPrice: 680, categoryId: 3, available: true, hasMealOption: true });
    await this.createMenuItem({ name: "Peri Peri Wrap", description: "", price: 450, mealPrice: 630, categoryId: 3, available: true, hasMealOption: true });

    // MILKSHAKES - All flavors £3.50
    await this.createMenuItem({ name: "Oreo Milkshake", description: "", price: 350, categoryId: 6, available: true });
    await this.createMenuItem({ name: "Kit Kat Milkshake", description: "", price: 350, categoryId: 6, available: true });
    await this.createMenuItem({ name: "Dates Milkshake", description: "", price: 350, categoryId: 6, available: true });
    await this.createMenuItem({ name: "Kinder Bueno Milkshake", description: "", price: 350, categoryId: 6, available: true });
    await this.createMenuItem({ name: "Mango Milkshake", description: "", price: 350, categoryId: 6, available: true });

    // PLATTERS - Rice platters with flavor options and drinks
    await this.createMenuItem({ name: "BBQ Strips Rice Platter", description: "Rice platter with drink", price: 650, categoryId: 5, available: true, hasFlavorOptions: true });
    await this.createMenuItem({ name: "Chicken Strips Rice Platter", description: "Rice platter with drink", price: 600, categoryId: 5, available: true, hasFlavorOptions: true });
    await this.createMenuItem({ name: "Wings Rice Platter", description: "Rice platter with drink", price: 650, categoryId: 5, available: true, hasFlavorOptions: true });
    await this.createMenuItem({ name: "Quarter Pounder Rice Platter", description: "Rice platter with drink", price: 550, categoryId: 5, available: true, hasFlavorOptions: true });
    await this.createMenuItem({ name: "Half Pounder Rice Platter", description: "Rice platter with drink", price: 650, categoryId: 5, available: true, hasFlavorOptions: true });
    await this.createMenuItem({ name: "Zinger Rice Platter", description: "Rice platter with drink", price: 550, categoryId: 5, available: true, hasFlavorOptions: true });
    await this.createMenuItem({ name: "Strip Burger Rice Platter", description: "Rice platter with drink", price: 400, categoryId: 5, available: true, hasFlavorOptions: true });
    await this.createMenuItem({ name: "Fillet Burger Rice Platter", description: "Rice platter with drink", price: 500, categoryId: 5, available: true, hasFlavorOptions: true });

    // CHICKEN - No items currently

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
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
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

  async getAllOrders(): Promise<FullOrder[]> {
    const result: FullOrder[] = [];
    
    for (const order of this.orders.values()) {
      const fullOrder = await this.getFullOrder(order.id);
      if (fullOrder) {
        result.push(fullOrder);
      }
    }
    
    // Sort by creation time (newest first)
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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

  // Data cleanup operations (stub for MemStorage)
  async cleanupOldOrders(): Promise<void> {
    // MemStorage doesn't need cleanup since it resets on restart
    console.log("MemStorage: No cleanup needed");
  }

  async generateDailyStats(date: string): Promise<void> {
    // MemStorage doesn't persist stats
    console.log(`MemStorage: Stats generation skipped for ${date}`);
  }

  async getPopularItems(): Promise<Array<{
    itemName: string;
    totalOrdered: number;
    totalRevenue: number;
    percentage: number;
  }>> {
    // MemStorage: Calculate from current orders
    const itemStats = new Map<string, { totalOrdered: number; totalRevenue: number }>();
    let totalAllOrders = 0;

    for (const order of this.orders.values()) {
      if (order.status === OrderStatus.SERVED) {
        for (const orderItem of this.orderItems.values()) {
          if (orderItem.orderId === order.id) {
            const existing = itemStats.get(orderItem.name) || { totalOrdered: 0, totalRevenue: 0 };
            existing.totalOrdered += orderItem.quantity;
            existing.totalRevenue += orderItem.quantity * orderItem.price;
            itemStats.set(orderItem.name, existing);
            totalAllOrders += orderItem.quantity;
          }
        }
      }
    }

    const result = Array.from(itemStats.entries()).map(([itemName, stats]) => ({
      itemName,
      totalOrdered: stats.totalOrdered,
      totalRevenue: stats.totalRevenue,
      percentage: totalAllOrders > 0 ? Math.round((stats.totalOrdered / totalAllOrders) * 100) : 0
    }));

    return result.sort((a, b) => b.totalOrdered - a.totalOrdered).slice(0, 10);
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeData();
  }

  // Initialize only the 6 main categories - no menu items
  private async initializeData() {
    // Check if categories already exist
    const existingCategories = await db.select().from(categories);
    if (existingCategories.length > 0) {
      return; // Data already initialized
    }

    // Create only the 6 main categories - completely empty
    const categoryData: InsertCategory[] = [
      { name: "Starters", icon: "restaurant", displayOrder: 1 },
      { name: "Platters", icon: "dinner_dining", displayOrder: 2 },
      { name: "Mains", icon: "lunch_dining", displayOrder: 3 },
      { name: "Pizza", icon: "local_pizza", displayOrder: 4 },
      { name: "Chicken", icon: "set_meal", displayOrder: 5 },
      { name: "Milkshakes", icon: "local_bar", displayOrder: 6 }
    ];
    
    for (const category of categoryData) {
      await db.insert(categories).values(category);
    }
    
    // No menu items added - categories are completely empty
  }

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
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
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

  async getAllOrders(): Promise<FullOrder[]> {
    const allOrders = await db.select().from(orders)
      .orderBy(desc(orders.createdAt));

    const fullOrders: FullOrder[] = [];
    for (const order of allOrders) {
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

  // Data cleanup operations for long-term database management
  async cleanupOldOrders(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Delete order items first (foreign key constraint)
    await db.delete(orderItems)
      .where(sql`order_id IN (
        SELECT id FROM orders 
        WHERE DATE(created_at) < ${cutoffDate}
      )`);

    // Delete old orders
    await db.delete(orders)
      .where(sql`DATE(created_at) < ${cutoffDate}`);

    console.log(`Cleaned up orders older than ${cutoffDate}`);
  }

  async generateDailyStats(date: string): Promise<void> {
    // Get all completed orders for the specified date
    const dayOrders = await db.select({
      orderId: orders.id,
      orderTotal: orders.totalAmount
    })
    .from(orders)
    .where(sql`DATE(created_at) = ${date} AND status = 'served'`);

    if (dayOrders.length === 0) return;

    // Get order items for these orders with menu item details
    const itemStats = await db.select({
      menuItemId: orderItems.menuItemId,
      itemName: menuItems.name,
      quantity: orderItems.quantity,
      itemPrice: menuItems.price
    })
    .from(orderItems)
    .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(sql`DATE(orders.created_at) = ${date} AND orders.status = 'served'`);

    // Aggregate stats by menu item
    const aggregatedStats = new Map<number, {
      itemName: string;
      totalOrdered: number;
      totalRevenue: number;
    }>();

    for (const item of itemStats) {
      const existing = aggregatedStats.get(item.menuItemId) || {
        itemName: item.itemName,
        totalOrdered: 0,
        totalRevenue: 0
      };

      existing.totalOrdered += item.quantity;
      existing.totalRevenue += item.quantity * item.itemPrice;
      aggregatedStats.set(item.menuItemId, existing);
    }

    // Save to daily stats table
    for (const [menuItemId, stats] of aggregatedStats) {
      await db.insert(dailyStats).values({
        date,
        menuItemId,
        itemName: stats.itemName,
        totalOrdered: stats.totalOrdered,
        totalRevenue: stats.totalRevenue
      }).onConflictDoUpdate({
        target: [dailyStats.date, dailyStats.menuItemId],
        set: {
          totalOrdered: stats.totalOrdered,
          totalRevenue: stats.totalRevenue,
          updatedAt: sql`CURRENT_TIMESTAMP`
        }
      });
    }

    console.log(`Generated daily stats for ${date}: ${aggregatedStats.size} menu items`);
  }

  async getPopularItems(): Promise<Array<{
    itemName: string;
    totalOrdered: number;
    totalRevenue: number;
    percentage: number;
  }>> {
    // Get popular items from last 30 days of served orders
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];

    const itemStats = await db.select({
      menuItemId: orderItems.menuItemId,
      itemName: menuItems.name,
      quantity: orderItems.quantity,
      itemPrice: orderItems.price
    })
    .from(orderItems)
    .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(sql`DATE(orders.created_at) >= ${cutoffDate} AND orders.status = 'served'`);

    // Aggregate stats by menu item
    const aggregatedStats = new Map<string, {
      totalOrdered: number;
      totalRevenue: number;
    }>();
    
    let totalAllOrders = 0;

    for (const item of itemStats) {
      const existing = aggregatedStats.get(item.itemName) || { totalOrdered: 0, totalRevenue: 0 };
      existing.totalOrdered += item.quantity;
      existing.totalRevenue += item.quantity * item.itemPrice;
      aggregatedStats.set(item.itemName, existing);
      totalAllOrders += item.quantity;
    }

    const result = Array.from(aggregatedStats.entries()).map(([itemName, stats]) => ({
      itemName,
      totalOrdered: stats.totalOrdered,
      totalRevenue: stats.totalRevenue,
      percentage: totalAllOrders > 0 ? Math.round((stats.totalOrdered / totalAllOrders) * 100) : 0
    }));

    return result.sort((a, b) => b.totalOrdered - a.totalOrdered).slice(0, 10);
  }
}

// Initialize the appropriate storage implementation
// Use MemStorage for now to ensure clean start
export const storage = new MemStorage();
