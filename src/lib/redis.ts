import {Redis} from 'ioredis';

declare global {
  var redis: Redis | undefined;
}

const REDIS_URL = process.env.REDIS_URL ?? 'redis://redis:6379';

export const redis = global.redis ?? new Redis(REDIS_URL);

if (process.env.NODE_ENV !== 'production') {
  global.redis = redis;
}

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err));

