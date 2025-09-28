import crypto from 'crypto';

interface SyncPayload {
  categories?: any[];
  items?: any[];
}

interface WebhookConfig {
  url: string;
  secret: string;
  retryAttempts?: number;
  retryDelay?: number;
}

export class CatalogSyncService {
  private config: WebhookConfig;

  constructor() {
    this.config = {
      url: process.env.WEBSITE_API_BASE ? `${process.env.WEBSITE_API_BASE}/api/catalog/sync` : '',
      secret: process.env.CATALOG_SYNC_SECRET || '',
      retryAttempts: 3,
      retryDelay: 1000, // 1 second
    };
  }

  private generateSignature(payload: string): string {
    if (!this.config.secret) {
      throw new Error('CATALOG_SYNC_SECRET not configured');
    }
    return 'sha256=' + crypto.createHmac('sha256', this.config.secret).update(payload).digest('hex');
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async publishCatalogUpdate(payload: SyncPayload): Promise<boolean> {
    if (!this.config.url) {
      console.warn('Website sync URL not configured, skipping sync');
      return false;
    }

    const payloadString = JSON.stringify(payload);
    const signature = this.generateSignature(payloadString);

    for (let attempt = 1; attempt <= (this.config.retryAttempts || 3); attempt++) {
      try {
        console.log(`Attempting catalog sync (attempt ${attempt}/${this.config.retryAttempts})`);

        const response = await fetch(this.config.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Queue-Signature': signature,
          },
          body: payloadString,
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Catalog sync successful:', result);
          return true;
        } else {
          const error = await response.text();
          console.error(`Catalog sync failed (${response.status}):`, error);

          // Don't retry on authentication errors
          if (response.status === 401 || response.status === 403) {
            console.error('Authentication failed, not retrying');
            return false;
          }
        }
      } catch (error) {
        console.error(`Catalog sync attempt ${attempt} failed:`, error);
      }

      // Wait before retrying (except on last attempt)
      if (attempt < (this.config.retryAttempts || 3)) {
        await this.sleep((this.config.retryDelay || 1000) * attempt);
      }
    }

    console.error('All catalog sync attempts failed');
    return false;
  }

  async publishCategoryChange(category: any): Promise<boolean> {
    return this.publishCatalogUpdate({
      categories: [category],
      items: []
    });
  }

  async publishMenuItemChange(item: any): Promise<boolean> {
    return this.publishCatalogUpdate({
      categories: [],
      items: [item]
    });
  }

  async publishBulkUpdate(categories: any[], items: any[]): Promise<boolean> {
    return this.publishCatalogUpdate({
      categories,
      items
    });
  }
}

// Singleton instance
export const catalogSyncService = new CatalogSyncService();