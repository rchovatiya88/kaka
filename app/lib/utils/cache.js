// Caching infrastructure for performance optimization

import { logger } from "./logger";

// In-memory cache implementation (consider Redis for production)
class MemoryCache {
  constructor(defaultTTL = 300) { // 5 minutes default TTL
    this.cache = new Map();
    this.defaultTTL = defaultTTL * 1000; // Convert to milliseconds
  }

  set(key, value, ttl = this.defaultTTL) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, {
      value,
      expiresAt
    });
    
    logger.debug('Cache set', { key, ttl });
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      logger.debug('Cache miss', { key });
      return null;
    }
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      logger.debug('Cache expired', { key });
      return null;
    }
    
    logger.debug('Cache hit', { key });
    return item.value;
  }

  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.debug('Cache deleted', { key });
    }
    return deleted;
  }

  clear() {
    const size = this.cache.size;
    this.cache.clear();
    logger.info('Cache cleared', { itemsCleared: size });
  }

  // Clean up expired items
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.debug('Cache cleanup', { itemsCleaned: cleaned });
    }
  }

  size() {
    return this.cache.size;
  }
}

// Global cache instances
export const appCache = new MemoryCache(600); // 10 minutes
export const userCache = new MemoryCache(300); // 5 minutes
export const storyCache = new MemoryCache(1800); // 30 minutes
export const templateCache = new MemoryCache(3600); // 1 hour

// Cleanup expired items every 5 minutes
setInterval(() => {
  appCache.cleanup();
  userCache.cleanup();
  storyCache.cleanup();
  templateCache.cleanup();
}, 5 * 60 * 1000);

// Cache key generators
export function generateCacheKey(prefix, ...parts) {
  return `${prefix}:${parts.join(':')}`;
}

export function userCacheKey(userId, suffix = '') {
  return generateCacheKey('user', userId, suffix);
}

export function storyCacheKey(storyId, suffix = '') {
  return generateCacheKey('story', storyId, suffix);
}

export function shopCacheKey(shopDomain, suffix = '') {
  return generateCacheKey('shop', shopDomain, suffix);
}

// High-level caching utilities
export async function withCache(cache, key, fetcher, ttl) {
  // Try to get from cache first
  const cached = cache.get(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetcher();
  
  // Cache the result
  cache.set(key, data, ttl);
  
  return data;
}

// Specific caching functions
export async function getCachedUser(userId, fetcher) {
  const key = userCacheKey(userId);
  return withCache(userCache, key, fetcher, 300); // 5 minutes
}

export async function getCachedStory(storyId, fetcher) {
  const key = storyCacheKey(storyId);
  return withCache(storyCache, key, fetcher, 1800); // 30 minutes
}

export async function getCachedStoryList(userId, filters, fetcher) {
  const key = userCacheKey(userId, `stories:${JSON.stringify(filters)}`);
  return withCache(userCache, key, fetcher, 300); // 5 minutes
}

// Cache invalidation utilities
export function invalidateUserCache(userId) {
  const patterns = [
    userCacheKey(userId),
    userCacheKey(userId, 'stories'),
    userCacheKey(userId, 'preferences')
  ];
  
  patterns.forEach(pattern => {
    // For simple implementation, we'll delete exact matches
    // In production, consider pattern-based invalidation
    userCache.delete(pattern);
  });
  
  logger.info('User cache invalidated', { userId });
}

export function invalidateStoryCache(storyId, userId = null) {
  storyCache.delete(storyCacheKey(storyId));
  
  if (userId) {
    // Invalidate user's story list cache
    const userStoriesKey = userCacheKey(userId, 'stories');
    userCache.delete(userStoriesKey);
  }
  
  logger.info('Story cache invalidated', { storyId, userId });
}

// Database query result caching wrapper
export function withDbCache(cache, key, queryFn, ttl = 300) {
  return async (...args) => {
    const cacheKey = `${key}:${JSON.stringify(args)}`;
    
    return withCache(cache, cacheKey, () => queryFn(...args), ttl * 1000);
  };
}

// Response caching for API endpoints
export function createResponseCache() {
  const cache = new MemoryCache(60); // 1 minute for API responses
  
  return {
    get: (key) => cache.get(key),
    set: (key, response, ttl = 60) => {
      // Only cache successful responses
      if (response.status && response.status >= 400) {
        return;
      }
      
      cache.set(key, response, ttl * 1000);
    },
    generateKey: (request) => {
      const url = new URL(request.url);
      return `${request.method}:${url.pathname}:${url.search}`;
    }
  };
}

// Cache warming utilities
export async function warmUserCache(userId) {
  try {
    logger.info('Warming user cache', { userId });
    
    // Pre-load commonly accessed user data
    // This would typically be called after user login or creation
    
    // Cache user profile
    const userKey = userCacheKey(userId);
    // await getCachedUser(userId, () => fetchUserFromDb(userId));
    
    // Cache user's recent stories
    const storiesKey = userCacheKey(userId, 'stories');
    // await getCachedStoryList(userId, { limit: 10 }, () => fetchUserStories(userId));
    
    logger.info('User cache warmed', { userId });
    
  } catch (error) {
    logger.error('Cache warming failed', { userId, error: error.message });
  }
}

// Memory usage monitoring
export function getCacheStats() {
  return {
    app: {
      size: appCache.size(),
      type: 'application'
    },
    user: {
      size: userCache.size(),
      type: 'user_data'
    },
    story: {
      size: storyCache.size(),
      type: 'story_data'
    },
    template: {
      size: templateCache.size(),
      type: 'templates'
    },
    totalItems: appCache.size() + userCache.size() + storyCache.size() + templateCache.size(),
    memoryUsage: process.memoryUsage()
  };
}