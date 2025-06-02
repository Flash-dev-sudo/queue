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
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  icon: true,
});

// Menu items
export const menuItems = sqliteTable("menu_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categoryId: integer("category_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // Price in pennies to avoid floating point issues
  available: integer("available", { mode: "boolean" }).notNull().default(true),
  image: text("image"),
});

export const insertMenuItemSchema = createInsertSchema(menuItems).pick({
  categoryId: true,
  name: true,
  description: true,
  price: true,
  available: true,
  image: true,
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
    chipType?: string;
    toppings?: string[];
    isMeal?: boolean;
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