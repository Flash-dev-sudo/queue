import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model (from template)
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Categories
export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  deletedAt: text("deleted_at"),
  contentHash: text("content_hash"),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  icon: true,
  displayOrder: true,
});

// Menu items
export const menuItems = sqliteTable("menu_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categoryId: integer("category_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // Price in pennies to avoid floating point issues
  mealPrice: integer("meal_price"), // Price for meal upgrade in pennies
  available: integer("available", { mode: "boolean" }).notNull().default(true),
  image: text("image"),
  hasFlavorOptions: integer("has_flavor_options", { mode: "boolean" }).default(false),
  hasMealOption: integer("has_meal_option", { mode: "boolean" }).default(false),
  isSpicyOption: integer("is_spicy_option", { mode: "boolean" }).default(false),
  hasToppingsOption: integer("has_toppings_option", { mode: "boolean" }).default(false),
  hasSaucesOption: integer("has_sauces_option", { mode: "boolean" }).default(false),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  deletedAt: text("deleted_at"),
  contentHash: text("content_hash"),
});

export const insertMenuItemSchema = createInsertSchema(menuItems).pick({
  categoryId: true,
  name: true,
  description: true,
  price: true,
  mealPrice: true,
  available: true,
  image: true,
  hasFlavorOptions: true,
  hasMealOption: true,
  isSpicyOption: true,
  hasToppingsOption: true,
  hasSaucesOption: true,
});

export const OrderStatus = {
  NEW: "new",
  PREPARING: "preparing",
  READY: "ready",
  SERVED: "served",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

// Orders
export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderNumber: text("order_number").notNull().unique(),
  status: text("status").notNull().default(OrderStatus.NEW),
  totalAmount: integer("total_amount").notNull(), // Total in pennies
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  orderNumber: true,
  status: true,
  totalAmount: true,
});

// Order items (items in an order)
export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull(),
  menuItemId: integer("menu_item_id").notNull(),
  name: text("name").notNull(), // Store name at time of order
  price: integer("price").notNull(), // Store price at time of order
  quantity: integer("quantity").notNull(),
  notes: text("notes"),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).pick({
  orderId: true,
  menuItemId: true,
  name: true,
  price: true,
  quantity: true,
  notes: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderWithItems = Order & { items: OrderItem[] };

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

// Helper types for complex queries
export type OrderItemWithDetails = {
  id: number;
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
};

export type FullOrder = {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItemWithDetails[];
};

export type CartItem = {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  customizations?: {
    flavor?: string; // Garlic & Herb, Medium, Hot, Extra Hot, BBQ
    toppings?: string[];
    isMeal?: boolean;
    isPeriPeriChipsMeal?: boolean;
    isSpicy?: boolean; // For spicy/normal options
    drinkChoice?: string; // For meal deals
  };
};

// Daily order statistics - for business reporting before data cleanup
export const dailyStats = sqliteTable("daily_stats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(), // YYYY-MM-DD format
  menuItemId: integer("menu_item_id").notNull(),
  itemName: text("item_name").notNull(),
  totalOrdered: integer("total_ordered").notNull().default(0),
  totalRevenue: integer("total_revenue").notNull().default(0), // in pence
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertDailyStatsSchema = createInsertSchema(dailyStats).pick({
  date: true,
  menuItemId: true,
  itemName: true,
  totalOrdered: true,
  totalRevenue: true,
});

export type DailyStats = typeof dailyStats.$inferSelect;
export type InsertDailyStats = z.infer<typeof insertDailyStatsSchema>;

// Gallery table (for website images)
export const gallery = sqliteTable("gallery", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  category: text("category").default("food"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertGallerySchema = createInsertSchema(gallery).pick({
  title: true,
  description: true,
  imageUrl: true,
  category: true,
  isActive: true,
});

export type Gallery = typeof gallery.$inferSelect;
export type InsertGallery = z.infer<typeof insertGallerySchema>;

// Cart items table (for website cart functionality)
export const cartItems = sqliteTable("cart_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("session_id").notNull(),
  menuItemId: integer("menu_item_id").notNull(),
  quantity: integer("quantity").notNull(),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertCartItemSchema = createInsertSchema(cartItems).pick({
  sessionId: true,
  menuItemId: true,
  quantity: true,
  notes: true,
});

export type CartItemDB = typeof cartItems.$inferSelect;
export type InsertCartItemDB = z.infer<typeof insertCartItemSchema>;