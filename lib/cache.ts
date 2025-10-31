// Simple in-memory cache (no Redis required)
const cache = new Map<string, { data: any; expires: number }>();

export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const cached = cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data as T;
    }
    // Remove expired entry
    if (cached) {
      cache.delete(key);
    }
    return null;
  } catch (error) {
    console.error('Cache GET error:', error);
    return null;
  }
}

export async function setCachedData(key: string, data: any, ttlSeconds: number = 3600): Promise<void> {
  try {
    cache.set(key, {
      data,
      expires: Date.now() + ttlSeconds * 1000,
    });
  } catch (error) {
    console.error('Cache SET error:', error);
  }
}

export async function deleteCachedData(key: string): Promise<void> {
  try {
    cache.delete(key);
  } catch (error) {
    console.error('Cache DELETE error:', error);
  }
}

// Clean up expired entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
      if (value.expires <= now) {
        cache.delete(key);
      }
    }
  }, 60000); // Every minute
}
