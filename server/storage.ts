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
    // Create categories based on the updated menu structure
    const categoryData: InsertCategory[] = [
      { name: "Starters", icon: "restaurant", displayOrder: 1 },
      { name: "Main (Burgers)", icon: "lunch_dining", displayOrder: 2 },
      { name: "Grilled Chicken", icon: "outdoor_grill", displayOrder: 3 },
      { name: "Fried Chicken", icon: "set_meal", displayOrder: 4 },
      { name: "Pizza Menu", icon: "local_pizza", displayOrder: 5 },
      { name: "Rice Platters", icon: "rice_bowl", displayOrder: 6 },
      { name: "Wings Platter", icon: "restaurant_menu", displayOrder: 7 },
      { name: "Strips Platter", icon: "restaurant_menu", displayOrder: 8 },
      { name: "Burger Feast", icon: "dinner_dining", displayOrder: 9 },
      { name: "Variety Platter", icon: "dinner_dining", displayOrder: 10 },
      { name: "Emparo Special", icon: "star", displayOrder: 11 },
      { name: "Feast Platter", icon: "celebration", displayOrder: 12 }
    ];
    
    const categories: Category[] = [];
    for (const category of categoryData) {
      categories.push(await this.createCategory(category));
    }
    
    // Create menu items from the updated Emparo Food menu
    
    // STARTERS
    await this.createMenuItem({ name: "Chips", description: "", price: 250, categoryId: 1, available: true });
    await this.createMenuItem({ name: "Peri Peri Chips", description: "", price: 300, categoryId: 1, available: true });
    await this.createMenuItem({ name: "Chips with Cheese", description: "", price: 400, categoryId: 1, available: true });
    await this.createMenuItem({ name: "Potato Wedges", description: "Spicy or Normal", price: 350, categoryId: 1, available: true, isSpicyOption: true });
    await this.createMenuItem({ name: "Potato Wedges with Cheese", description: "", price: 400, categoryId: 1, available: true });
    await this.createMenuItem({ name: "Fish Fingers", description: "", price: 400, categoryId: 1, available: true });
    await this.createMenuItem({ name: "Calamari", description: "", price: 400, categoryId: 1, available: true });
    await this.createMenuItem({ name: "Mozzarella Sticks", description: "", price: 400, categoryId: 1, available: true });
    await this.createMenuItem({ name: "Onion Rings (10 pcs)", description: "", price: 400, categoryId: 1, available: true });
    await this.createMenuItem({ name: "Gamberoni (6 pcs)", description: "", price: 400, categoryId: 1, available: true });
    await this.createMenuItem({ name: "Nuggets", description: "", price: 300, categoryId: 1, available: true });
    await this.createMenuItem({ name: "Buffalo Wings", description: "", price: 450, categoryId: 1, available: true });
    await this.createMenuItem({ name: "BBQ Wings", description: "", price: 450, categoryId: 1, available: true });

    // MAIN (BURGERS) - Items 1-15 with individual and meal pricing
    await this.createMenuItem({ name: "1. Strip Burger", description: "", price: 250, mealPrice: 450, categoryId: 2, available: true, hasMealOption: true });
    await this.createMenuItem({ name: "2. Fillet Burger", description: "", price: 350, mealPrice: 550, categoryId: 2, available: true, hasMealOption: true });
    await this.createMenuItem({ name: "3. Zinger Burger", description: "", price: 400, mealPrice: 600, categoryId: 2, available: true, hasMealOption: true });
    await this.createMenuItem({ name: "4. Fish/Vegetarian Burger", description: "", price: 350, mealPrice: 550, categoryId: 2, available: true, hasMealOption: true });
    await this.createMenuItem({ name: "5. Emparo Burger", description: "", price: 650, mealPrice: 850, categoryId: 2, available: true, hasMealOption: true });
    await this.createMenuItem({ name: "6. Tower Burger", description: "", price: 500, mealPrice: 700, categoryId: 2, available: true, hasMealOption: true });
    await this.createMenuItem({ name: "7. EFC Special", description: "", price: 650, mealPrice: 850, categoryId: 2, available: true, hasMealOption: true });
    await this.createMenuItem({ name: "8. Quarter Pounder", description: "", price: 400, mealPrice: 600, categoryId: 2, available: true, hasMealOption: true });
    await this.createMenuItem({ name: "9. Half Pounder", description: "", price: 500, mealPrice: 700, categoryId: 2, available: true, hasMealOption: true });
    await this.createMenuItem({ name: "10. Peri Peri Burger", description: "", price: 500, mealPrice: 700, categoryId: 2, available: true, hasMealOption: true });
    await this.createMenuItem({ name: "11. Peri Peri Wrap", description: "", price: 450, mealPrice: 650, categoryId: 2, available: true, hasMealOption: true });
    await this.createMenuItem({ name: "12. Peri Peri Wings", description: "", price: 420, mealPrice: 620, categoryId: 2, available: true, hasMealOption: true });
    await this.createMenuItem({ name: "13. Peri Peri Strips", description: "", price: 470, mealPrice: 670, categoryId: 2, available: true, hasMealOption: true });
    await this.createMenuItem({ name: "14. Half Chicken", description: "", price: 550, mealPrice: 750, categoryId: 2, available: true, hasMealOption: true });
    await this.createMenuItem({ name: "15. Whole Chicken", description: "", price: 1050, mealPrice: 1250, categoryId: 2, available: true, hasMealOption: true });

    // GRILLED CHICKEN
    await this.createMenuItem({ name: "Quarter Chicken", description: "", price: 350, categoryId: 3, available: true });
    await this.createMenuItem({ name: "Half Chicken", description: "", price: 550, categoryId: 3, available: true });
    await this.createMenuItem({ name: "Whole Chicken", description: "", price: 1050, categoryId: 3, available: true });

    // FRIED CHICKEN
    await this.createMenuItem({ name: "Wings (3 pcs)", description: "", price: 150, categoryId: 4, available: true });
    await this.createMenuItem({ name: "Wings (6 pcs)", description: "", price: 300, categoryId: 4, available: true });
    await this.createMenuItem({ name: "Strips (3 pcs)", description: "", price: 200, categoryId: 4, available: true });
    await this.createMenuItem({ name: "Strips (6 pcs)", description: "", price: 400, categoryId: 4, available: true });

    // PIZZA MENU - All £8.50 with flavor options
    await this.createMenuItem({ name: "Margherita Pizza", description: "", price: 850, categoryId: 5, available: true, hasFlavorOptions: true });
    await this.createMenuItem({ name: "Double Pepperoni Pizza", description: "", price: 850, categoryId: 5, available: true, hasFlavorOptions: true });
    await this.createMenuItem({ name: "Mediterranean Special Pizza", description: "", price: 850, categoryId: 5, available: true, hasFlavorOptions: true });
    await this.createMenuItem({ name: "Emparo Pizza", description: "", price: 850, categoryId: 5, available: true, hasFlavorOptions: true });
    await this.createMenuItem({ name: "Veggie Hot Pizza", description: "", price: 850, categoryId: 5, available: true, hasFlavorOptions: true });
    await this.createMenuItem({ name: "Veggie Special Pizza", description: "", price: 850, categoryId: 5, available: true, hasFlavorOptions: true });
    await this.createMenuItem({ name: "American Hot Pizza", description: "", price: 850, categoryId: 5, available: true, hasFlavorOptions: true });
    await this.createMenuItem({ name: "Peri Peri Special Pizza", description: "", price: 850, categoryId: 5, available: true, hasFlavorOptions: true });
    await this.createMenuItem({ name: "Tandoori Special Pizza", description: "", price: 850, categoryId: 5, available: true, hasFlavorOptions: true });
    await this.createMenuItem({ name: "BBQ Special Pizza", description: "", price: 850, categoryId: 5, available: true, hasFlavorOptions: true });
    await this.createMenuItem({ name: "Hawaiian Special Pizza", description: "", price: 850, categoryId: 5, available: true, hasFlavorOptions: true });
    await this.createMenuItem({ name: "Ham & Mushroom Pizza", description: "", price: 850, categoryId: 5, available: true, hasFlavorOptions: true });
    await this.createMenuItem({ name: "Tuna Special Pizza", description: "", price: 850, categoryId: 5, available: true, hasFlavorOptions: true });
    await this.createMenuItem({ name: "Four Seasons Pizza", description: "", price: 850, categoryId: 5, available: true, hasFlavorOptions: true });
    await this.createMenuItem({ name: "Meat Lovers Pizza", description: "", price: 850, categoryId: 5, available: true, hasFlavorOptions: true });

    // RICE PLATTERS - With flavor options
    await this.createMenuItem({ name: "Strips", description: "£7.50", price: 750, categoryId: 6, available: true, hasFlavorOptions: true });
    await this.createMenuItem({ name: "Strips with Drink", description: "£8.00", price: 800, categoryId: 6, available: true, hasFlavorOptions: true });
    await this.createMenuItem({ name: "Half Chicken", description: "£8.00", price: 800, categoryId: 6, available: true, hasFlavorOptions: true });
    await this.createMenuItem({ name: "Half Chicken with Drink", description: "£8.50", price: 850, categoryId: 6, available: true, hasFlavorOptions: true });
    await this.createMenuItem({ name: "Chicken Wings", description: "£7.00", price: 700, categoryId: 6, available: true, hasFlavorOptions: true });
    await this.createMenuItem({ name: "Chicken Wings with Drink", description: "£7.50", price: 750, categoryId: 6, available: true, hasFlavorOptions: true });

    // WINGS PLATTER
    await this.createMenuItem({ name: "Wings Platter", description: "15 wings, 2 chips, 2 drinks", price: 1549, categoryId: 7, available: true, hasFlavorOptions: true });

    // STRIPS PLATTER  
    await this.createMenuItem({ name: "Strips Platter", description: "15 strips, 2 chips, 2 drinks", price: 1549, categoryId: 8, available: true, hasFlavorOptions: true });

    // BURGER FEAST
    await this.createMenuItem({ name: "Burger Feast", description: "3 Peri Peri Burgers, 8 Peri Peri Wings, 2 Chips, Bottle drink", price: 2449, categoryId: 9, available: true, hasFlavorOptions: true });

    // VARIETY PLATTER
    await this.createMenuItem({ name: "Variety Platter", description: "Whole Chicken, 8 Wings, 5 Strips, 2 sides, Bottle of drink", price: 2400, categoryId: 10, available: true, hasFlavorOptions: true });

    // EMPARO SPECIAL
    await this.createMenuItem({ name: "Emparo Special", description: "Half Chicken, 2 Peri Burgers, 5 Peri Wings, 2 sides, Bottle", price: 2250, categoryId: 11, available: true, hasFlavorOptions: true });

    // FEAST PLATTER
    await this.createMenuItem({ name: "Feast Platter", description: "2 Whole Chickens, 8 Wings, 8 Strips, 3 sides, Bottle", price: 3849, categoryId: 12, available: true, hasFlavorOptions: true });
    
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

  // Initialize with updated Emparo Food menu
  private async initializeData() {
    // Check if categories already exist
    const existingCategories = await db.select().from(categories);
    if (existingCategories.length > 0) {
      return; // Data already initialized
    }

    // Create categories based on the updated menu structure
    const categoryData: InsertCategory[] = [
      { name: "Starters", icon: "restaurant", displayOrder: 1 },
      { name: "Main (Burgers)", icon: "lunch_dining", displayOrder: 2 },
      { name: "Grilled Chicken", icon: "outdoor_grill", displayOrder: 3 },
      { name: "Fried Chicken", icon: "set_meal", displayOrder: 4 },
      { name: "Pizza Menu", icon: "local_pizza", displayOrder: 5 },
      { name: "Rice Platters", icon: "rice_bowl", displayOrder: 6 },
      { name: "Wings Platter", icon: "restaurant_menu", displayOrder: 7 },
      { name: "Strips Platter", icon: "restaurant_menu", displayOrder: 8 },
      { name: "Burger Feast", icon: "dinner_dining", displayOrder: 9 },
      { name: "Variety Platter", icon: "dinner_dining", displayOrder: 10 },
      { name: "Emparo Special", icon: "star", displayOrder: 11 },
      { name: "Feast Platter", icon: "celebration", displayOrder: 12 }
    ];
    
    const createdCategories: Category[] = [];
    for (const category of categoryData) {
      const [created] = await db.insert(categories).values(category).returning();
      createdCategories.push(created);
    }
    
    // Create menu items from the updated Emparo Food menu
    
    // STARTERS
    await db.insert(menuItems).values({ name: "Chips", description: "", price: 250, categoryId: 1, available: true });
    await db.insert(menuItems).values({ name: "Peri Peri Chips", description: "", price: 300, categoryId: 1, available: true });
    await db.insert(menuItems).values({ name: "Chips with Cheese", description: "", price: 400, categoryId: 1, available: true });
    await db.insert(menuItems).values({ name: "Potato Wedges", description: "Spicy or Normal", price: 350, categoryId: 1, available: true, isSpicyOption: true });
    await db.insert(menuItems).values({ name: "Potato Wedges with Cheese", description: "", price: 400, categoryId: 1, available: true });
    await db.insert(menuItems).values({ name: "Fish Fingers", description: "", price: 400, categoryId: 1, available: true });
    await db.insert(menuItems).values({ name: "Calamari", description: "", price: 400, categoryId: 1, available: true });
    await db.insert(menuItems).values({ name: "Mozzarella Sticks", description: "", price: 400, categoryId: 1, available: true });
    await db.insert(menuItems).values({ name: "Onion Rings (10 pcs)", description: "", price: 400, categoryId: 1, available: true });
    await db.insert(menuItems).values({ name: "Gamberoni (6 pcs)", description: "", price: 400, categoryId: 1, available: true });
    await db.insert(menuItems).values({ name: "Nuggets", description: "", price: 300, categoryId: 1, available: true });
    await db.insert(menuItems).values({ name: "Buffalo Wings", description: "", price: 450, categoryId: 1, available: true });
    await db.insert(menuItems).values({ name: "BBQ Wings", description: "", price: 450, categoryId: 1, available: true });

    // MAIN (BURGERS) - Items 1-15 with individual and meal pricing
    await db.insert(menuItems).values({ name: "1. Strip Burger", description: "", price: 250, mealPrice: 450, categoryId: 2, available: true, hasMealOption: true });
    await db.insert(menuItems).values({ name: "2. Fillet Burger", description: "", price: 350, mealPrice: 550, categoryId: 2, available: true, hasMealOption: true });
    await db.insert(menuItems).values({ name: "3. Zinger Burger", description: "", price: 400, mealPrice: 600, categoryId: 2, available: true, hasMealOption: true });
    await db.insert(menuItems).values({ name: "4. Fish/Vegetarian Burger", description: "", price: 350, mealPrice: 550, categoryId: 2, available: true, hasMealOption: true });
    await db.insert(menuItems).values({ name: "5. Emparo Burger", description: "", price: 650, mealPrice: 850, categoryId: 2, available: true, hasMealOption: true });
    await db.insert(menuItems).values({ name: "6. Tower Burger", description: "", price: 500, mealPrice: 700, categoryId: 2, available: true, hasMealOption: true });
    await db.insert(menuItems).values({ name: "7. EFC Special", description: "", price: 650, mealPrice: 850, categoryId: 2, available: true, hasMealOption: true });
    await db.insert(menuItems).values({ name: "8. Quarter Pounder", description: "", price: 400, mealPrice: 600, categoryId: 2, available: true, hasMealOption: true });
    await db.insert(menuItems).values({ name: "9. Half Pounder", description: "", price: 500, mealPrice: 700, categoryId: 2, available: true, hasMealOption: true });
    await db.insert(menuItems).values({ name: "10. Peri Peri Burger", description: "", price: 500, mealPrice: 700, categoryId: 2, available: true, hasMealOption: true });
    await db.insert(menuItems).values({ name: "11. Peri Peri Wrap", description: "", price: 450, mealPrice: 650, categoryId: 2, available: true, hasMealOption: true });
    await db.insert(menuItems).values({ name: "12. Peri Peri Wings", description: "", price: 420, mealPrice: 620, categoryId: 2, available: true, hasMealOption: true });
    await db.insert(menuItems).values({ name: "13. Peri Peri Strips", description: "", price: 470, mealPrice: 670, categoryId: 2, available: true, hasMealOption: true });
    await db.insert(menuItems).values({ name: "14. Half Chicken", description: "", price: 550, mealPrice: 750, categoryId: 2, available: true, hasMealOption: true });
    await db.insert(menuItems).values({ name: "15. Whole Chicken", description: "", price: 1050, mealPrice: 1250, categoryId: 2, available: true, hasMealOption: true });

    // GRILLED CHICKEN
    await db.insert(menuItems).values({ name: "Quarter Chicken", description: "", price: 350, categoryId: 3, available: true });
    await db.insert(menuItems).values({ name: "Half Chicken", description: "", price: 550, categoryId: 3, available: true });
    await db.insert(menuItems).values({ name: "Whole Chicken", description: "", price: 1050, categoryId: 3, available: true });

    // FRIED CHICKEN
    await db.insert(menuItems).values({ name: "Wings (3 pcs)", description: "", price: 150, categoryId: 4, available: true });
    await db.insert(menuItems).values({ name: "Wings (6 pcs)", description: "", price: 300, categoryId: 4, available: true });
    await db.insert(menuItems).values({ name: "Strips (3 pcs)", description: "", price: 200, categoryId: 4, available: true });
    await db.insert(menuItems).values({ name: "Strips (6 pcs)", description: "", price: 400, categoryId: 4, available: true });

    // PIZZA MENU - All £8.50 with flavor options
    await db.insert(menuItems).values({ name: "Margherita Pizza", description: "", price: 850, categoryId: 5, available: true, hasFlavorOptions: true });
    await db.insert(menuItems).values({ name: "Double Pepperoni Pizza", description: "", price: 850, categoryId: 5, available: true, hasFlavorOptions: true });
    await db.insert(menuItems).values({ name: "Mediterranean Special Pizza", description: "", price: 850, categoryId: 5, available: true, hasFlavorOptions: true });
    await db.insert(menuItems).values({ name: "Emparo Pizza", description: "", price: 850, categoryId: 5, available: true, hasFlavorOptions: true });
    await db.insert(menuItems).values({ name: "Veggie Hot Pizza", description: "", price: 850, categoryId: 5, available: true, hasFlavorOptions: true });
    await db.insert(menuItems).values({ name: "Veggie Special Pizza", description: "", price: 850, categoryId: 5, available: true, hasFlavorOptions: true });
    await db.insert(menuItems).values({ name: "American Hot Pizza", description: "", price: 850, categoryId: 5, available: true, hasFlavorOptions: true });
    await db.insert(menuItems).values({ name: "Peri Peri Special Pizza", description: "", price: 850, categoryId: 5, available: true, hasFlavorOptions: true });
    await db.insert(menuItems).values({ name: "Tandoori Special Pizza", description: "", price: 850, categoryId: 5, available: true, hasFlavorOptions: true });
    await db.insert(menuItems).values({ name: "BBQ Special Pizza", description: "", price: 850, categoryId: 5, available: true, hasFlavorOptions: true });
    await db.insert(menuItems).values({ name: "Hawaiian Special Pizza", description: "", price: 850, categoryId: 5, available: true, hasFlavorOptions: true });
    await db.insert(menuItems).values({ name: "Ham & Mushroom Pizza", description: "", price: 850, categoryId: 5, available: true, hasFlavorOptions: true });
    await db.insert(menuItems).values({ name: "Tuna Special Pizza", description: "", price: 850, categoryId: 5, available: true, hasFlavorOptions: true });
    await db.insert(menuItems).values({ name: "Four Seasons Pizza", description: "", price: 850, categoryId: 5, available: true, hasFlavorOptions: true });
    await db.insert(menuItems).values({ name: "Meat Lovers Pizza", description: "", price: 850, categoryId: 5, available: true, hasFlavorOptions: true });

    // RICE PLATTERS - With flavor options
    await db.insert(menuItems).values({ name: "Strips", description: "£7.50", price: 750, categoryId: 6, available: true, hasFlavorOptions: true });
    await db.insert(menuItems).values({ name: "Strips with Drink", description: "£8.00", price: 800, categoryId: 6, available: true, hasFlavorOptions: true });
    await db.insert(menuItems).values({ name: "Half Chicken", description: "£8.00", price: 800, categoryId: 6, available: true, hasFlavorOptions: true });
    await db.insert(menuItems).values({ name: "Half Chicken with Drink", description: "£8.50", price: 850, categoryId: 6, available: true, hasFlavorOptions: true });
    await db.insert(menuItems).values({ name: "Chicken Wings", description: "£7.00", price: 700, categoryId: 6, available: true, hasFlavorOptions: true });
    await db.insert(menuItems).values({ name: "Chicken Wings with Drink", description: "£7.50", price: 750, categoryId: 6, available: true, hasFlavorOptions: true });

    // WINGS PLATTER
    await db.insert(menuItems).values({ name: "Wings Platter", description: "15 wings, 2 chips, 2 drinks", price: 1549, categoryId: 7, available: true, hasFlavorOptions: true });

    // STRIPS PLATTER  
    await db.insert(menuItems).values({ name: "Strips Platter", description: "15 strips, 2 chips, 2 drinks", price: 1549, categoryId: 8, available: true, hasFlavorOptions: true });

    // BURGER FEAST
    await db.insert(menuItems).values({ name: "Burger Feast", description: "3 Peri Peri Burgers, 8 Peri Peri Wings, 2 Chips, Bottle drink", price: 2449, categoryId: 9, available: true, hasFlavorOptions: true });

    // VARIETY PLATTER
    await db.insert(menuItems).values({ name: "Variety Platter", description: "Whole Chicken, 8 Wings, 5 Strips, 2 sides, Bottle of drink", price: 2400, categoryId: 10, available: true, hasFlavorOptions: true });

    // EMPARO SPECIAL
    await db.insert(menuItems).values({ name: "Emparo Special", description: "Half Chicken, 2 Peri Burgers, 5 Peri Wings, 2 sides, Bottle", price: 2250, categoryId: 11, available: true, hasFlavorOptions: true });

    // FEAST PLATTER
    await db.insert(menuItems).values({ name: "Feast Platter", description: "2 Whole Chickens, 8 Wings, 8 Strips, 3 sides, Bottle", price: 3849, categoryId: 12, available: true, hasFlavorOptions: true });
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
// Use DatabaseStorage for both production and development
export const storage = new DatabaseStorage();
