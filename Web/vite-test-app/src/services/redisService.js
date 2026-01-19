// redis.js
import { createClient } from 'redis';

let redisClient = null;

export const connectRedis = async () => {
  try {
    redisClient = createClient({
      url: 'redis://localhost:6379'
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('✅ Подключено к Redis');
    });

    await redisClient.connect();
    return true;
  } catch (error) {
    console.error('Не удалось подключиться к Redis:', error);
    return false;
  }
};

export const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis не подключен. Сначала вызовите connectRedis()');
  }
  return redisClient;
};

export const isRedisConnected = () => {
  return redisClient && redisClient.isOpen;
};

// Простые методы для работы с Redis
export const redisSet = async (key, value, ttl = null) => {
  try {
    const client = getRedisClient();
    const stringValue = JSON.stringify(value);
    
    if (ttl) {
      await client.setEx(key, ttl, stringValue);
    } else {
      await client.set(key, stringValue);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Ошибка записи в Redis:', error);
    return { success: false, error: error.message };
  }
};

export const redisGet = async (key) => {
  try {
    const client = getRedisClient();
    const value = await client.get(key);
    
    if (!value) return null;
    
    return JSON.parse(value);
  } catch (error) {
    console.error('Ошибка чтения из Redis:', error);
    return null;
  }
};

export const redisDelete = async (key) => {
  try {
    const client = getRedisClient();
    const result = await client.del(key);
    return result > 0;
  } catch (error) {
    console.error('Ошибка удаления из Redis:', error);
    return false;
  }
};

export const redisKeys = async (pattern) => {
  try {
    const client = getRedisClient();
    return await client.keys(pattern);
  } catch (error) {
    console.error('Ошибка получения ключей из Redis:', error);
    return [];
  }
};

// Удалить ВСЕХ пользователей и ВСЕ сессии
export const redisClearAll = async () => {
  try {
    const client = getRedisClient();
    
    // Получаем все ключи
    const userKeys = await client.keys('user:*');
    const sessionKeys = await client.keys('session:*');
    const allKeys = [...userKeys, ...sessionKeys];
    
    if (allKeys.length === 0) {
      return { users: 0, sessions: 0, total: 0 };
    }
    
    // Удаляем все
    await client.del(allKeys);
    
    console.log(`🗑️ Удалено из Redis: ${allKeys.length} записей`);
    console.log(`   👥 Пользователей: ${userKeys.length}`);
    console.log(`   🔑 Сессий: ${sessionKeys.length}`);
    
    return {
      users: userKeys.length,
      sessions: sessionKeys.length,
      total: allKeys.length
    };
  } catch (error) {
    console.error('Ошибка очистки Redis:', error);
    return { users: 0, sessions: 0, total: 0, error: error.message };
  }
};

// Удалить конкретного пользователя по ID
export const redisDeleteUser = async (userId) => {
  try {
    const client = getRedisClient();
    const userKey = `user:${userId}`;
    
    // 1. Находим пользователя
    const userData = await redisGet(userKey);
    if (!userData) {
      return { success: false, message: 'Пользователь не найден' };
    }
    
    // 2. Находим и удаляем все его сессии
    const loginToken = userData.login_token;
    let deletedSessions = 0;
    
    if (loginToken) {
      const allSessions = await client.keys('session:*');
      for (const sessionKey of allSessions) {
        const sessionToken = await client.get(sessionKey);
        if (sessionToken === loginToken) {
          await client.del(sessionKey);
          deletedSessions++;
        }
      }
    }
    
    // 3. Удаляем пользователя
    await client.del(userKey);
    
    return {
      success: true,
      userId: userId,
      sessionsDeleted: deletedSessions,
      message: `Пользователь ${userId} удален`
    };
  } catch (error) {
    console.error('Ошибка удаления пользователя:', error);
    return { success: false, error: error.message };
  }
};

// Проверка статуса Redis
export const redisStatus = async () => {
  try {
    const client = getRedisClient();
    const ping = await client.ping();
    const userCount = (await client.keys('user:*')).length;
    const sessionCount = (await client.keys('session:*')).length;
    
    return {
      connected: true,
      ping: ping,
      users: userCount,
      sessions: sessionCount
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message
    };
  }
};

export default {
  connectRedis,
  getRedisClient,
  isRedisConnected,
  redisSet,
  redisGet,
  redisDelete,
  redisKeys,
  redisClearAll,
  redisDeleteUser,
  redisStatus
};