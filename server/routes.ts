import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import express from "express";
import { storage } from "./storage";
import { OrderStatus, type CartItem, type InsertOrder, type InsertOrderItem, type InsertMenuItem } from "@shared/schema";
import { z } from "zod";
import { catalogSyncService } from "./catalog-sync";

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

  // Public API endpoints for catalog sync (no auth required, cached, rate-limited)
  app.get('/api/public/categories', async (req, res) => {
    try {
      // Set cache headers for 60 seconds
      res.set('Cache-Control', 'public, max-age=60');

      const categories = await storage.getCategories();
      const publicCategories = categories
        .filter(cat => !cat.deletedAt) // Only non-deleted
        .map(cat => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon,
          displayOrder: cat.displayOrder,
          updatedAt: cat.updatedAt,
          deletedAt: cat.deletedAt,
          contentHash: cat.contentHash
        }));

      res.json(publicCategories);
    } catch (error) {
      console.error('Error fetching public categories:', error);
      res.status(500).json({ message: 'Error fetching categories' });
    }
  });

  app.get('/api/public/menu-items', async (req, res) => {
    try {
      // Set cache headers for 60 seconds
      res.set('Cache-Control', 'public, max-age=60');

      const { categoryId, updatedSince } = req.query;

      const menuItems = await storage.getMenuItems();
      let filteredItems = menuItems.filter(item => !item.deletedAt); // Only non-deleted

      // Filter by category if provided
      if (categoryId) {
        filteredItems = filteredItems.filter(item => item.categoryId === parseInt(categoryId as string));
      }

      // Filter by updatedSince if provided
      if (updatedSince) {
        const sinceDate = new Date(updatedSince as string);
        filteredItems = filteredItems.filter(item =>
          item.updatedAt && new Date(item.updatedAt) > sinceDate
        );
      }

      const publicItems = filteredItems.map(item => ({
        id: item.id,
        categoryId: item.categoryId,
        name: item.name,
        description: item.description,
        price: item.price,
        mealPrice: item.mealPrice,
        available: item.available,
        image: item.image,
        hasFlavorOptions: item.hasFlavorOptions,
        hasMealOption: item.hasMealOption,
        isSpicyOption: item.isSpicyOption,
        hasToppingsOption: item.hasToppingsOption,
        updatedAt: item.updatedAt,
        deletedAt: item.deletedAt,
        contentHash: item.contentHash
      }));

      res.json(publicItems);
    } catch (error) {
      console.error('Error fetching public menu items:', error);
      res.status(500).json({ message: 'Error fetching menu items' });
    }
  });

  app.get('/api/public/export', async (req, res) => {
    try {
      // Set cache headers for 60 seconds
      res.set('Cache-Control', 'public, max-age=60');

      const [categories, menuItems] = await Promise.all([
        storage.getCategories(),
        storage.getMenuItems()
      ]);

      const publicData = {
        categories: categories
          .filter(cat => !cat.deletedAt)
          .map(cat => ({
            id: cat.id,
            name: cat.name,
            icon: cat.icon,
            displayOrder: cat.displayOrder,
            updatedAt: cat.updatedAt,
            deletedAt: cat.deletedAt,
            contentHash: cat.contentHash
          })),
        items: menuItems
          .filter(item => !item.deletedAt)
          .map(item => ({
            id: item.id,
            categoryId: item.categoryId,
            name: item.name,
            description: item.description,
            price: item.price,
            mealPrice: item.mealPrice,
            available: item.available,
            image: item.image,
            hasFlavorOptions: item.hasFlavorOptions,
            hasMealOption: item.hasMealOption,
            isSpicyOption: item.isSpicyOption,
            hasToppingsOption: item.hasToppingsOption,
            updatedAt: item.updatedAt,
            deletedAt: item.deletedAt,
            contentHash: item.contentHash
          }))
      };

      res.json(publicData);
    } catch (error) {
      console.error('Error exporting catalog:', error);
      res.status(500).json({ message: 'Error exporting catalog' });
    }
  });

  app.get('/api/public/changes', async (req, res) => {
    try {
      // Set cache headers for 60 seconds
      res.set('Cache-Control', 'public, max-age=60');

      const { since } = req.query;

      if (!since) {
        return res.status(400).json({ message: 'since parameter is required' });
      }

      const sinceDate = new Date(since as string);
      if (isNaN(sinceDate.getTime())) {
        return res.status(400).json({ message: 'Invalid since date format' });
      }

      const [categories, menuItems] = await Promise.all([
        storage.getCategories(),
        storage.getMenuItems()
      ]);

      const changedCategories = categories
        .filter(cat => cat.updatedAt && new Date(cat.updatedAt) > sinceDate)
        .map(cat => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon,
          displayOrder: cat.displayOrder,
          updatedAt: cat.updatedAt,
          deletedAt: cat.deletedAt,
          contentHash: cat.contentHash
        }));

      const changedItems = menuItems
        .filter(item => item.updatedAt && new Date(item.updatedAt) > sinceDate)
        .map(item => ({
          id: item.id,
          categoryId: item.categoryId,
          name: item.name,
          description: item.description,
          price: item.price,
          mealPrice: item.mealPrice,
          available: item.available,
          image: item.image,
          hasFlavorOptions: item.hasFlavorOptions,
          hasMealOption: item.hasMealOption,
          isSpicyOption: item.isSpicyOption,
          hasToppingsOption: item.hasToppingsOption,
          updatedAt: item.updatedAt,
          deletedAt: item.deletedAt,
          contentHash: item.contentHash
        }));

      res.json({
        categories: changedCategories,
        items: changedItems
      });
    } catch (error) {
      console.error('Error fetching changes:', error);
      res.status(500).json({ message: 'Error fetching changes' });
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

  // Authentication middleware for admin endpoints
  const adminAuth = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization header required' });
    }

    const token = authHeader.substring(7);
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (token !== adminPassword) {
      return res.status(401).json({ message: 'Invalid admin token' });
    }

    next();
  };

  // Admin login endpoint
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { password } = req.body;
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

      if (password === adminPassword) {
        res.json({
          success: true,
          token: adminPassword, // In production, use JWT
          message: 'Login successful'
        });
      } else {
        res.status(401).json({
          success: false,
          message: 'Invalid password'
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  // API Routes
  // Admin endpoints (secured with server-side auth)
  app.post('/api/admin/categories', adminAuth, async (req, res) => {
    try {
      const { name, icon, displayOrder } = req.body || {};
      if (!name || !icon) return res.status(400).json({ message: 'name and icon required' });
      const category = await storage.createCategory({ name, icon, displayOrder: Number(displayOrder) || 0 });

      // Trigger webhook to sync with website
      catalogSyncService.publishCategoryChange(category).catch(error => {
        console.error('Failed to sync category to website:', error);
      });

      res.status(201).json(category);
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({ message: 'Error creating category' });
    }
  });

  app.post('/api/admin/menu-items', adminAuth, async (req, res) => {
    try {
      const { categoryId, name, description, price, mealPrice, available, image, hasFlavorOptions, hasMealOption, isSpicyOption, hasToppingsOption } = req.body || {};
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
        hasToppingsOption: !!hasToppingsOption,
      });

      // Trigger webhook to sync with website
      catalogSyncService.publishMenuItemChange(item).catch(error => {
        console.error('Failed to sync menu item to website:', error);
      });

      res.status(201).json(item);
    } catch (error) {
      console.error('Error creating menu item:', error);
      res.status(500).json({ message: 'Error creating menu item' });
    }
  });

  // GET /api/admin/menu-items - Get menu items with optional category filtering
  app.get('/api/admin/menu-items', adminAuth, async (req, res) => {
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
  app.put('/api/admin/menu-items/:id', adminAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid menu item ID' });
      }

      const { categoryId, name, description, price, mealPrice, available, image, hasFlavorOptions, hasMealOption, isSpicyOption, hasToppingsOption } = req.body || {};

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
      if (hasToppingsOption !== undefined) updateData.hasToppingsOption = !!hasToppingsOption;

      const updatedItem = await storage.updateMenuItem(id, updateData);

      if (!updatedItem) {
        return res.status(404).json({ message: 'Menu item not found' });
      }

      // Trigger webhook to sync with website
      catalogSyncService.publishMenuItemChange(updatedItem).catch(error => {
        console.error('Failed to sync updated menu item to website:', error);
      });

      res.json(updatedItem);
    } catch (error) {
      console.error('Error updating menu item:', error);
      res.status(500).json({ message: 'Error updating menu item' });
    }
  });

  // DELETE /api/admin/menu-items/:id - Delete menu item
  app.delete('/api/admin/menu-items/:id', adminAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid menu item ID' });
      }

      // Get the item before deletion for webhook
      const itemToDelete = await storage.getMenuItem(id);
      if (!itemToDelete) {
        return res.status(404).json({ message: 'Menu item not found' });
      }

      const deleted = await storage.deleteMenuItem(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Menu item not found' });
      }

      // Trigger webhook to sync deletion with website
      const deletedItem = { ...itemToDelete, deletedAt: new Date().toISOString() };
      catalogSyncService.publishMenuItemChange(deletedItem).catch(error => {
        console.error('Failed to sync deleted menu item to website:', error);
      });

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

  // Static file serving for images
  app.use('/api/images', express.static(path.join(import.meta.dirname, 'public', 'images')));

  // Image upload endpoint for admin
  app.post('/api/admin/upload-image', adminAuth, async (req, res) => {
    try {
      // This is a placeholder for image upload functionality
      // In production, you'd integrate with a service like Cloudinary, AWS S3, or local file handling
      const { filename, base64Data } = req.body;

      if (!filename || !base64Data) {
        return res.status(400).json({ message: 'Filename and base64Data are required' });
      }

      // For now, return a mock URL that points to the queue system
      const imageUrl = `/api/images/${filename}`;

      res.json({
        imageUrl,
        message: 'Image upload endpoint ready for implementation',
        fullUrl: `${process.env.QUEUE_API_BASE || 'http://localhost:5000'}${imageUrl}`
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ message: 'Error uploading image' });
    }
  });

  return httpServer;
}
