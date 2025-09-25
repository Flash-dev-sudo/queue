import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { OrderStatus, type CartItem, type InsertOrder, type InsertOrderItem, type InsertMenuItem } from "@shared/schema";
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
    
    console.log('Notifying kitchen about new order:', order.orderNumber);
    
    const message = JSON.stringify({
      type: 'new_order',
      order
    });
    
    let sentCount = 0;
    clients.forEach(client => {
      if (client.isKitchen && client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(message);
        sentCount++;
      }
    });
    
    console.log(`Sent new order notification to ${sentCount} kitchen clients`);
  };
  
  // Manual database initialization endpoint (for deployment troubleshooting)
  app.post('/api/init-db', async (req, res) => {
    try {
      const { initializeDatabase } = await import('./init-db');
      await initializeDatabase();
      res.json({ message: 'Database initialized successfully' });
    } catch (error) {
      console.error('Database initialization failed:', error);
      res.status(500).json({ message: 'Database initialization failed', error: error.message });
    }
  });

  /*
  // Manual cleanup/stats trigger (protected lightly via env secret optional)
  app.post('/api/cleanup/run', async (req, res) => {
    try {
      const { cleanupService } = await import('./cleanup');
      await cleanupService.manualCleanup();
      res.json({ message: 'Cleanup and stats generation executed' });
    } catch (error: any) {
      console.error('Manual cleanup failed:', error);
      res.status(500).json({ message: 'Manual cleanup failed', error: error?.message });
    }
  });
  */

  // API Routes
  // Admin endpoints (simple, no auth beyond client-side gate)
  app.post('/api/admin/categories', async (req, res) => {
    try {
      const { name, icon, displayOrder } = req.body || {};
      if (!name || !icon) return res.status(400).json({ message: 'name and icon required' });
      const category = await storage.createCategory({ name, icon, displayOrder: Number(displayOrder) || 0 });
      res.status(201).json(category);
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({ message: 'Error creating category' });
    }
  });

  app.post('/api/admin/menu-items', async (req, res) => {
    try {
      const { categoryId, name, description, price, mealPrice, available, image, hasFlavorOptions, hasMealOption, isSpicyOption } = req.body || {};
      if (!categoryId || !name || !price) return res.status(400).json({ message: 'categoryId, name and price required' });
      const item = await storage.createMenuItem({
        categoryId: Number(categoryId),
        name,
        description,
        price: Number(price),
        mealPrice: mealPrice ? Number(mealPrice) : undefined,
        available: available !== false,
        image,
        hasFlavorOptions: !!hasFlavorOptions,
        hasMealOption: !!hasMealOption,
        isSpicyOption: !!isSpicyOption,
      });
      res.status(201).json(item);
    } catch (error) {
      console.error('Error creating menu item:', error);
      res.status(500).json({ message: 'Error creating menu item' });
    }
  });

  // GET /api/admin/menu-items - Get menu items with optional category filtering
  app.get('/api/admin/menu-items', async (req, res) => {
    try {
      const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;

      if (categoryId !== undefined && isNaN(categoryId)) {
        return res.status(400).json({ message: 'Invalid categoryId parameter' });
      }

      const menuItems = categoryId
        ? await storage.getMenuItemsByCategory(categoryId)
        : await storage.getMenuItems();

      res.json(menuItems);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      res.status(500).json({ message: 'Error fetching menu items' });
    }
  });

  // PUT /api/admin/menu-items/:id - Update menu item
  app.put('/api/admin/menu-items/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid menu item ID' });
      }

      const { categoryId, name, description, price, mealPrice, available, image, hasFlavorOptions, hasMealOption, isSpicyOption } = req.body || {};

      const updateData: Partial<InsertMenuItem> = {};
      if (categoryId !== undefined) updateData.categoryId = Number(categoryId);
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.price = Number(price);
      if (mealPrice !== undefined) updateData.mealPrice = mealPrice ? Number(mealPrice) : undefined;
      if (available !== undefined) updateData.available = !!available;
      if (image !== undefined) updateData.image = image;
      if (hasFlavorOptions !== undefined) updateData.hasFlavorOptions = !!hasFlavorOptions;
      if (hasMealOption !== undefined) updateData.hasMealOption = !!hasMealOption;
      if (isSpicyOption !== undefined) updateData.isSpicyOption = !!isSpicyOption;

      const updatedItem = await storage.updateMenuItem(id, updateData);

      if (!updatedItem) {
        return res.status(404).json({ message: 'Menu item not found' });
      }

      res.json(updatedItem);
    } catch (error) {
      console.error('Error updating menu item:', error);
      res.status(500).json({ message: 'Error updating menu item' });
    }
  });

  // DELETE /api/admin/menu-items/:id - Delete menu item
  app.delete('/api/admin/menu-items/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid menu item ID' });
      }

      const deleted = await storage.deleteMenuItem(id);

      if (!deleted) {
        return res.status(404).json({ message: 'Menu item not found' });
      }

      res.json({ message: 'Menu item deleted successfully' });
    } catch (error) {
      console.error('Error deleting menu item:', error);
      res.status(500).json({ message: 'Error deleting menu item' });
    }
  });
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

  // Get all orders (for analytics/history view)
  app.get('/api/orders', async (req, res) => {
    try {
      const allOrders = await storage.getAllOrders();
      res.json(allOrders);
    } catch (error) {
      console.error('Error fetching all orders:', error);
      res.status(500).json({ message: 'Error fetching all orders' });
    }
  });

  // Get popular items from last 30 days
  app.get('/api/popular-items', async (req, res) => {
    try {
      const popularItems = await storage.getPopularItems();
      res.json(popularItems);
    } catch (error) {
      console.error('Error fetching popular items:', error);
      res.status(500).json({ message: 'Error fetching popular items' });
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
        OrderStatus.SERVED,
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
