// Suggested improvement: Performance optimizations

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class RequestCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTtl = 5 * 60 * 1000; // 5 minutes

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set<T>(key: string, data: T, ttl = this.defaultTtl): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  clear(): void {
    this.cache.clear();
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Request batching for related operations
class RequestBatcher {
  private pendingRequests = new Map<string, Promise<any>>();

  async batchRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }
}

// Enhanced makeRequest with caching and batching
const cache = new RequestCache();
const batcher = new RequestBatcher();

export async function makeRequestWithOptimizations<T>(
  url: string,
  options: RequestInit = {},
  cacheOptions?: { ttl?: number; bypassCache?: boolean }
): Promise<T> {
  const cacheKey = `${url}:${JSON.stringify(options)}`;
  
  // Check cache first (unless bypassed)
  if (!cacheOptions?.bypassCache) {
    const cached = cache.get<T>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  // Use request batching to avoid duplicate requests
  return batcher.batchRequest(cacheKey, async () => {
    const result = await makeRequest<T>(url, options);
    
    // Cache successful responses
    if (cacheOptions?.ttl !== 0) {
      cache.set(cacheKey, result, cacheOptions?.ttl);
    }
    
    return result;
  });
}

// Periodic cache cleanup
setInterval(() => cache.cleanup(), 10 * 60 * 1000); // Every 10 minutes
