  // src/services/redisService.js
  import Redis from 'ioredis';

  class RedisService {
    constructor() {
      this.redis = null;
      this.isConnected = false;
    }

    async connect() {
      try {
        this.redis = new Redis({
          host: 'localhost',
          port: 6379,
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          }
        });

        this.redis.on('connect', () => {
          console.log('✅ Подключено к Redis');
          this.isConnected = true;
        });

        this.redis.on('error', (err) => {
          console.error('Redis ошибка:', err);
          this.isConnected = false;
        });

        // Проверяем подключение
        await this.redis.ping();
        return true;
      } catch (error) {
        console.error('Ошибка подключения к Redis:', error);
        return false;
      }
    }

    async setToken(key, value, ttl = null) {
      if (!this.isConnected) {
        await this.connect();
      }

      try {
        if (ttl) {
          await this.redis.setex(key, ttl, JSON.stringify(value));
        } else {
          await this.redis.set(key, JSON.stringify(value));
        }
        return { success: true };
      } catch (error) {
        console.error('Ошибка при сохранении в Redis:', error);
        return { success: false, error: error.message };
      }
    }

    async getToken(key) {
      if (!this.isConnected) {
        await this.connect();
      }

      try {
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
      } catch (error) {
        console.error('Ошибка при получении из Redis:', error);
        return null;
      }
    }

    async deleteToken(key) {
      if (!this.isConnected) {
        await this.connect();
      }

      try {
        await this.redis.del(key);
        return true;
      } catch (error) {
        console.error('Ошибка при удалении из Redis:', error);
        return false;
      }
    }

    async ping() {
      try {
        if (!this.redis) await this.connect();
        const result = await this.redis.ping();
        return result === 'PONG';
      } catch (error) {
        return false;
      }
    }
  }

  export const redisService = new RedisService();