import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { OrderStatus, type CartItem, type InsertOrder, type InsertOrderItem } from "@shared/schema";
import { z } from "zod";

type WebSocketClient = {
  socket: WebSocket;
  isKitchen: boolean;
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // WebSocket clients for real-time updates
  const clients: WebSocketClient[] = [];
  
  // WebSocket connection handling
  wss.on('connection', (socket, request) => {
    console.log('WebSocket client connected');
    
    // Default client type (order screen)
    let client: WebSocketClient = {
      socket,
      isKitchen: false
    };
    
    clients.push(client);
    
    // Handle messages from clients
    socket.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Register client type (kitchen or order)
        if (data.type === 'register') {
          client.isKitchen = data.isKitchen === true;
          console.log(`Client registered as ${client.isKitchen ? 'kitchen' : 'order'}`);
          
          // Send active orders to kitchen clients
          if (client.isKitchen) {
            const activeOrders = await storage.getActiveOrders();
            socket.send(JSON.stringify({
              type: 'active_orders',
              orders: activeOrders
            }));
          }
        }
        
        // Update order status message
        if (data.type === 'update_status' && data.orderId && data.status) {
          const updatedOrder = await storage.updateOrderStatus(data.orderId, data.status);
          if (updatedOrder) {
            const fullOrder = await storage.getFullOrder(data.orderId);
            broadcastOrderUpdate(fullOrder);
          }
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });
    
    // Handle disconnection
    socket.on('close', () => {
      const index = clients.findIndex(c => c.socket === socket);
      if (index !== -1) {
        clients.splice(index, 1);
      }
      console.log('WebSocket client disconnected');
    });
  });
  
  // Function to broadcast order updates to all connected clients
  const broadcastOrderUpdate = (order: any) => {
    if (!order) return;
    
    const message = JSON.stringify({
      type: 'order_update',
      order
    });
    
    clients.forEach(client => {
      if (client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(message);
      }
    });
  };
  
  // Function to broadcast notifications to kitchen screens
  const notifyKitchen = (order: any) => {
    if (!order) return;
    
    const message = JSON.stringify({
      type: 'new_order',
      order
    });
    
    clients.forEach(client => {
      if (client.isKitchen && client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(message);
      }
    });
  };
  
  // API Routes
  // Get all menu categories
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: 'Error fetching categories' });
    }
  });
  
  // Get menu items by category
  app.get('/api/categories/:id/items', async (req, res) => {
    const categoryId = Number(req.params.id);
    if (isNaN(categoryId)) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }
    
    try {
      const menuItems = await storage.getMenuItemsByCategory(categoryId);
      res.json(menuItems);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      res.status(500).json({ message: 'Error fetching menu items' });
    }
  });
  
  // Get all menu items
  app.get('/api/menu-items', async (req, res) => {
    try {
      const menuItems = await storage.getMenuItems();
      res.json(menuItems);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      res.status(500).json({ message: 'Error fetching menu items' });
    }
  });
  
  // Get active orders
  app.get('/api/orders/active', async (req, res) => {
    try {
      const activeOrders = await storage.getActiveOrders();
      res.json(activeOrders);
    } catch (error) {
      console.error('Error fetching active orders:', error);
      res.status(500).json({ message: 'Error fetching active orders' });
    }
  });
  
  // Create new order
  app.post('/api/orders', async (req, res) => {
    // Validate request body
    const orderSchema = z.object({
      items: z.array(z.object({
        menuItemId: z.number(),
        name: z.string(),
        price: z.number(),
        quantity: z.number(),
        notes: z.string().optional(),
      })),
    });
    
    try {
      const { items } = orderSchema.parse(req.body);
      
      if (items.length === 0) {
        return res.status(400).json({ message: 'Order must contain at least one item' });
      }
      
      // Calculate total amount
      const totalAmount = items.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);
      
      // Generate unique order number (timestamp-based for simplicity)
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      const orderNumber = `${timestamp.toString().substring(timestamp.toString().length - 5)}${random}`;
      
      // Create order
      const newOrder: InsertOrder = {
        orderNumber,
        status: OrderStatus.NEW,
        totalAmount
      };
      
      const order = await storage.createOrder(newOrder);
      
      // Create order items
      for (const item of items) {
        const orderItem: InsertOrderItem = {
          orderId: order.id,
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          notes: item.notes
        };
        
        await storage.createOrderItem(orderItem);
      }
      
      // Get the full order details
      const fullOrder = await storage.getFullOrder(order.id);
      
      // Notify kitchen about the new order
      notifyKitchen(fullOrder);
      
      res.status(201).json(fullOrder);
    } catch (error) {
      console.error('Error creating order:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid order data', errors: error.errors });
      }
      res.status(500).json({ message: 'Error creating order' });
    }
  });
  
  // Update order status
  app.patch('/api/orders/:id/status', async (req, res) => {
    const orderId = Number(req.params.id);
    if (isNaN(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }
    
    const statusSchema = z.object({
      status: z.enum([
        OrderStatus.NEW,
        OrderStatus.PREPARING,
        OrderStatus.READY,
        OrderStatus.COMPLETED,
        OrderStatus.CANCELLED
      ]),
    });
    
    try {
      const { status } = statusSchema.parse(req.body);
      
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      const updatedOrder = await storage.updateOrderStatus(orderId, status);
      const fullOrder = await storage.getFullOrder(orderId);
      
      // Broadcast order update to all clients
      broadcastOrderUpdate(fullOrder);
      
      res.json(fullOrder);
    } catch (error) {
      console.error('Error updating order status:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid status', errors: error.errors });
      }
      res.status(500).json({ message: 'Error updating order status' });
    }
  });
  
  return httpServer;
}
