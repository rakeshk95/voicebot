/**
 * Local Memory Cache Service for Batch Calling
 * Provides in-memory caching with TTL and cache invalidation
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheConfig {
  defaultTTL: number; // Default TTL in milliseconds
  maxSize: number; // Maximum number of items in cache
}

class CacheService {
  private cache = new Map<string, CacheItem<any>>();
  private config: CacheConfig;

  constructor(config: CacheConfig = { defaultTTL: 30000, maxSize: 100 }) {
    this.config = config;
    
    // Clean up expired items every 30 seconds
    setInterval(() => {
      this.cleanup();
    }, 30000);
  }

  /**
   * Set a value in the cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL
    };

    // Remove oldest items if cache is full
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, item);
  }

  /**
   * Get a value from the cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Remove a specific key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Clean up expired items
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Invalidate cache entries that match a pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Update cache with new data if it exists, otherwise set it
   */
  update<T>(key: string, data: T, ttl?: number): void {
    if (this.has(key)) {
      this.set(key, data, ttl);
    }
  }
}

// Create singleton instance
export const cacheService = new CacheService({
  defaultTTL: 30000, // 30 seconds default TTL
  maxSize: 100 // Maximum 100 items in cache
});

// Cache key generators
export const CacheKeys = {
  // Batch calling cache keys
  QUEUE_STATS: 'batch:queue_stats',
  WORKER_STATUS: 'batch:worker_status',
  RABBITMQ_STATUS: 'batch:rabbitmq_status',
  DATABASE_STATUS: 'batch:database_status',
  HEALTH_STATUS: 'batch:health_status',
  
  // Enhanced monitoring cache keys
  SYSTEM_METRICS: 'batch:system_metrics',
  QUEUE_HEALTH: 'batch:queue_health',
  WORKER_METRICS: 'batch:worker_metrics',
  SYSTEM_ALERTS: 'batch:system_alerts',
  
  // Batch operation cache keys
  BATCH_OPERATION: (id: string) => `batch:operation:${id}`,
  BATCH_CALLS: (id: string) => `batch:calls:${id}`,
  OPERATION_ANALYTICS: (id: string) => `batch:analytics:${id}`,
  
  // Campaign cache keys
  CAMPAIGNS: 'campaigns:all',
  CAMPAIGN: (id: string) => `campaign:${id}`,
  
  // Organization cache keys
  ORGANIZATIONS: 'organizations:all',
  ORGANIZATION: (id: string) => `organization:${id}`,
  
  // Call history cache keys
  CALL_HISTORY: (campaignId: string, page: number) => `calls:${campaignId}:${page}`,
  CALL_DETAILS: (callId: string) => `call:${callId}`,
} as const;

// Cache helper functions
export const cacheHelpers = {
  /**
   * Get cached data or fetch from API
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = cacheService.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch from API
    const data = await fetchFn();
    
    // Cache the result
    cacheService.set(key, data, ttl);
    
    return data;
  },

  /**
   * Invalidate all batch-related cache
   */
  invalidateBatchCache(): void {
    cacheService.invalidatePattern('^batch:');
  },

  /**
   * Invalidate all campaign-related cache
   */
  invalidateCampaignCache(): void {
    cacheService.invalidatePattern('^campaign');
  },

  /**
   * Invalidate all organization-related cache
   */
  invalidateOrganizationCache(): void {
    cacheService.invalidatePattern('^organization');
  },

  /**
   * Invalidate all call-related cache
   */
  invalidateCallCache(): void {
    cacheService.invalidatePattern('^call');
  }
};

export default cacheService;
