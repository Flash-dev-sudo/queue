import { 
  users, type User, type InsertUser,
  categories, type Category, type InsertCategory,
  menuItems, type MenuItem, type InsertMenuItem,
  orders, type Order, type InsertOrder, type OrderWithItems,
  orderItems, type OrderItem, type InsertOrderItem,
  type FullOrder, type OrderItemWithDetails,
  OrderStatus
} from "@shared/schema";

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
  
  // Initialize with demo menu data based on the provided menu
  private async initializeData() {
    // Create categories
    const categoryData: InsertCategory[] = [
      { name: "Starters", icon: "restaurant", displayOrder: 1 },
      { name: "Wings & Buckets", icon: "egg", displayOrder: 2 },
      { name: "Desserts", icon: "cake", displayOrder: 3 },
      { name: "Shakes", icon: "local_cafe", displayOrder: 4 },
      { name: "Pizzas", icon: "local_pizza", displayOrder: 5 },
      { name: "Platters", icon: "dinner_dining", displayOrder: 6 },
      { name: "Grilled Chicken", icon: "set_meal", displayOrder: 7 },
      { name: "Peri Peri Chicken", icon: "local_fire_department", displayOrder: 8 },
      { name: "Burgers & Others", icon: "lunch_dining", displayOrder: 9 }
    ];
    
    const categories: Category[] = [];
    for (const category of categoryData) {
      categories.push(await this.createCategory(category));
    }
    
    // Create menu items
    // Starters
    await this.createMenuItem({ 
      name: "Chips", 
      description: "Regular portion of freshly made chips", 
      price: 250, 
      categoryId: 1, 
      available: true 
    });
    
    await this.createMenuItem({ 
      name: "Peri Peri Chips", 
      description: "Spicy peri peri seasoned chips", 
      price: 300, 
      categoryId: 1, 
      available: true 
    });
    
    await this.createMenuItem({ 
      name: "Chips with Cheese", 
      description: "Freshly made chips topped with melted cheese", 
      price: 400, 
      categoryId: 1, 
      available: true 
    });
    
    await this.createMenuItem({ 
      name: "Potato Wedges", 
      description: "Seasoned potato wedges", 
      price: 300, 
      categoryId: 1, 
      available: true 
    });
    
    await this.createMenuItem({ 
      name: "Potato Wedges with Cheese", 
      description: "Seasoned potato wedges topped with melted cheese", 
      price: 400, 
      categoryId: 1, 
      available: true 
    });
    
    await this.createMenuItem({ 
      name: "5 Gamberoni", 
      description: "5 pieces of gamberoni", 
      price: 500, 
      categoryId: 1, 
      available: true 
    });
    
    await this.createMenuItem({ 
      name: "Fish Fingers", 
      description: "Breaded fish fingers", 
      price: 400, 
      categoryId: 1, 
      available: true 
    });
    
    await this.createMenuItem({ 
      name: "5 Calamari", 
      description: "5 pieces of calamari rings", 
      price: 450, 
      categoryId: 1, 
      available: true 
    });
    
    await this.createMenuItem({ 
      name: "10 Onion Rings", 
      description: "10 crispy battered onion rings", 
      price: 450, 
      categoryId: 1, 
      available: true 
    });
    
    await this.createMenuItem({ 
      name: "Mozzarella Sticks", 
      description: "Breaded mozzarella sticks", 
      price: 400, 
      categoryId: 1, 
      available: true 
    });
    
    await this.createMenuItem({ 
      name: "Rice", 
      description: "Portion of steamed rice", 
      price: 250, 
      categoryId: 1, 
      available: true 
    });
    
    await this.createMenuItem({ 
      name: "Salad", 
      description: "Fresh mixed salad", 
      price: 250, 
      categoryId: 1, 
      available: true 
    });
    
    await this.createMenuItem({ 
      name: "Coleslaw", 
      description: "Homemade coleslaw", 
      price: 300, 
      categoryId: 1, 
      available: true 
    });
    
    // Wings & Buckets
    await this.createMenuItem({ 
      name: "Wings Bucket", 
      description: "15 Wings, 2 Fries, 1 Bottle Drink", 
      price: 1350, 
      categoryId: 2, 
      available: true 
    });
    
    await this.createMenuItem({ 
      name: "Mix Bucket", 
      description: "2 Strip Burgers, 2 Fried Wraps, 6 Fried Wings, 1 Box Chips, 1 Bottle Drink", 
      price: 2000, 
      categoryId: 2, 
      available: true 
    });
    
    // Desserts
    await this.createMenuItem({ 
      name: "Chocolate Fudge Cake", 
      description: "Rich chocolate fudge cake", 
      price: 300, 
      categoryId: 3, 
      available: true 
    });
    
    await this.createMenuItem({ 
      name: "Strawberry Cheese Cake", 
      description: "Creamy strawberry cheesecake", 
      price: 300, 
      categoryId: 3, 
      available: true 
    });
    
    await this.createMenuItem({ 
      name: "Ben & Jerry Ice Cream", 
      description: "Tub of Ben & Jerry's ice cream", 
      price: 649, 
      categoryId: 3, 
      available: true 
    });
    
    // Shakes
    await this.createMenuItem({ 
      name: "Kinder Bueno Shake", 
      description: "Milkshake with Kinder Bueno flavor", 
      price: 350, 
      categoryId: 4, 
      available: true 
    });
    
    await this.createMenuItem({ 
      name: "Dates Shake", 
      description: "Milkshake with Dates flavor", 
      price: 350, 
      categoryId: 4, 
      available: true 
    });
    
    await this.createMenuItem({ 
      name: "Mango Shake", 
      description: "Milkshake with Mango flavor", 
      price: 350, 
      categoryId: 4, 
      available: true 
    });
    
    await this.createMenuItem({ 
      name: "Oreo Shake", 
      description: "Milkshake with Oreo flavor", 
      price: 350, 
      categoryId: 4, 
      available: true 
    });
    
    await this.createMenuItem({ 
      name: "Lotus Biscoff Shake", 
      description: "Milkshake with Lotus Biscoff flavor", 
      price: 350, 
      categoryId: 4, 
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

export const storage = new MemStorage();
