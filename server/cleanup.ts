import { db } from "./turso-db";
import { orders, orderItems, dailyStats } from "@shared/schema";
import { sql, eq } from "drizzle-orm";

// Daily cleanup service for long-term database management
export class CleanupService {
  private cleanupInterval: NodeJS.Timeout | null = null;

  // Start the cleanup scheduler
  start() {
    // Run cleanup at 2 AM every day
    this.scheduleNextCleanup();
    console.log("🧹 Cleanup service started - will run daily at 2:00 AM");
  }

  stop() {
    if (this.cleanupInterval) {
      clearTimeout(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  private scheduleNextCleanup() {
    const now = new Date();
    const next2AM = new Date();
    next2AM.setHours(2, 0, 0, 0); // 2 AM

    // If it's already past 2 AM today, schedule for tomorrow
    if (now > next2AM) {
      next2AM.setDate(next2AM.getDate() + 1);
    }

    const timeUntilCleanup = next2AM.getTime() - now.getTime();

    this.cleanupInterval = setTimeout(async () => {
      await this.performDailyCleanup();
      this.scheduleNextCleanup(); // Schedule next cleanup
    }, timeUntilCleanup);

    console.log(`📅 Next cleanup scheduled for: ${next2AM.toLocaleString()}`);
  }

  // Perform the daily cleanup and stats generation
  private async performDailyCleanup() {
    try {
      console.log("🧹 Starting daily cleanup...");

      // 1. Generate stats for yesterday before deleting
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      await this.generateDailyStats(yesterdayStr);

      // 2. Delete orders older than 30 days
      await this.cleanupOldOrders();

      console.log("✅ Daily cleanup completed successfully");
    } catch (error) {
      console.error("❌ Daily cleanup failed:", error);
    }
  }

  // Delete orders older than 30 days to keep database size manageable
  async cleanupOldOrders(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];

    try {
      // Count orders to be deleted
      const ordersToDelete = await db.execute(
        sql`SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) < ${cutoffDate}`
      );
      const count = ordersToDelete.rows[0]?.count || 0;

      if (count === 0) {
        console.log("🗂️ No old orders to clean up");
        return;
      }

      // Delete order items first (foreign key constraint)
      await db.execute(sql`
        DELETE FROM order_items 
        WHERE order_id IN (
          SELECT id FROM orders 
          WHERE DATE(created_at) < ${cutoffDate}
        )
      `);

      // Delete old orders
      await db.execute(sql`
        DELETE FROM orders 
        WHERE DATE(created_at) < ${cutoffDate}
      `);

      console.log(`🗑️ Cleaned up ${count} orders older than ${cutoffDate}`);
    } catch (error) {
      console.error("❌ Error during order cleanup:", error);
    }
  }

  // Generate daily statistics before data deletion
  async generateDailyStats(date: string): Promise<void> {
    try {
      // Get order statistics for the day
      const dayStats = await db.execute(sql`
        SELECT 
          oi.menu_item_id,
          mi.name as item_name,
          SUM(oi.quantity) as total_ordered,
          SUM(oi.quantity * oi.price) as total_revenue
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        JOIN orders o ON oi.order_id = o.id
        WHERE DATE(o.created_at) = ${date} 
          AND o.status = 'served'
        GROUP BY oi.menu_item_id, mi.name
      `);

      if (dayStats.rows.length === 0) {
        console.log(`📊 No sales data for ${date}`);
        return;
      }

      // Save daily stats
      for (const row of dayStats.rows) {
        await db.execute(sql`
          INSERT INTO daily_stats (date, menu_item_id, item_name, total_ordered, total_revenue)
          VALUES (${date}, ${row.menu_item_id}, ${row.item_name}, ${row.total_ordered}, ${row.total_revenue})
          ON CONFLICT (date, menu_item_id) DO UPDATE SET
            total_ordered = ${row.total_ordered},
            total_revenue = ${row.total_revenue},
            updated_at = CURRENT_TIMESTAMP
        `);
      }

      console.log(`📊 Generated daily stats for ${date}: ${dayStats.rows.length} menu items`);
    } catch (error) {
      console.error(`❌ Error generating daily stats for ${date}:`, error);
    }
  }

  // Manual cleanup trigger for testing or emergency use
  async manualCleanup(): Promise<void> {
    console.log("🧹 Manual cleanup triggered");
    await this.performDailyCleanup();
  }
}

// Export singleton instance
export const cleanupService = new CleanupService();