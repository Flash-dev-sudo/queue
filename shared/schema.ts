import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model (from template)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Menu item categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  displayOrder: integer("display_order").notNull(),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  icon: true,
  displayOrder: true,
});

// Menu items
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // Price in pennies (e.g., £2.50 = 250)
  categoryId: integer("category_id").notNull(),
  available: boolean("available").notNull().default(true),
});

export const insertMenuItemSchema = createInsertSchema(menuItems).pick({
  name: true,
  description: true,
  price: true,
  categoryId: true,
  available: true,
});

// Order status enum
export const OrderStatus = {
  NEW: "new",
  PREPARING: "preparing",
  READY: "ready",
  SERVED: "served",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

// Orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  status: text("status").notNull().default(OrderStatus.NEW),
  totalAmount: integer("total_amount").notNull(), // Total in pennies
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  orderNumber: true,
  status: true,
  totalAmount: true,
});

// Order items (items in an order)
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
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

// Type definitions
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

// Order item with menu item details for the client
export type OrderItemWithDetails = {
  id: number;
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
};

// Full order with items for the client
export type FullOrder = {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItemWithDetails[];
};

// CartItem type for the client
export type CartItem = {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
};
