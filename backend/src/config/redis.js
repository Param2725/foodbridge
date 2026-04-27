// src/config/redis.js

// ✅ Disable Redis if no URL or if pointing to localhost (Vercel production)
if (!process.env.REDIS_URL || process.env.REDIS_URL.includes('localhost')) {
  console.log('⚠️ Redis disabled (no REDIS_URL or localhost detected)');
  module.exports = null;
  return;
}

const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 1,
  retryStrategy(times) {
    if (times > 3) return null;
    return Math.min(times * 200, 2000);
  },
  lazyConnect: false,
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err.message);
  // Don't crash — fallback handled in middleware
});

module.exports = redis;