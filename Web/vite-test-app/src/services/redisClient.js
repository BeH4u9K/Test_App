// Браузерная версия Redis клиента
// Используем mock-клиент для браузера

class RedisClient {
  constructor() {
    this.isConnected = false;
    this.mockData = new Map();
    this.ttlTimers = new Map();
    console.log('🎭 Браузерный Redis Client инициализирован');
  }

  async connect() {
    if (this.isConnected) {
      return this;
    }

    console.log('🌐 Подключение к mock Redis (браузерная версия)');
    this.isConnected = true;
    
    // Симулируем задержку подключения
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('✅ Mock Redis подключен');
    return this;
  }

  createMockClient() {
    return {
      ping: async () => {
        console.log('🏓 Mock Redis PING');
        return 'PONG';
      },
      set: async (key, value) => {
        console.log(`💾 Mock SET: ${key} =`, value);
        this.mockData.set(key, value);
        return 'OK';
      },
      get: async (key) => {
        console.log(`📖 Mock GET: ${key}`);
        const value = this.mockData.get(key);
        console.log(`📖 Mock GET результат:`, value);
        return value;
      },
      del: async (key) => {
        console.log(`🗑️ Mock DEL: ${key}`);
        this.mockData.delete(key);
        return 1;
      },
      exists: async (key) => {
        const exists = this.mockData.has(key);
        console.log(`🔍 Mock EXISTS ${key}:`, exists);
        return exists ? 1 : 0;
      },
      setex: async (key, seconds, value) => {
        console.log(`⏰ Mock SETEX: ${key} на ${seconds} сек =`, value);
        this.mockData.set(key, value);
        
        // Очищаем таймер если был
        if (this.ttlTimers.has(key)) {
          clearTimeout(this.ttlTimers.get(key));
        }
        
        // Устанавливаем новый таймер
        const timer = setTimeout(() => {
          this.mockData.delete(key);
          this.ttlTimers.delete(key);
          console.log(`⏰ Ключ ${key} автоматически удален`);
        }, seconds * 1000);
        
        this.ttlTimers.set(key, timer);
        return 'OK';
      },
      info: async () => {
        console.log('📊 Mock INFO');
        return `# Mock Redis Server
redis_version:7.0.0-mock
connected_clients:1
used_memory_human:1.2M
uptime_in_days:0
total_commands_processed:${this.mockData.size * 2}`;
      },
      quit: async () => {
        console.log('👋 Mock Redis отключен');
        this.isConnected = false;
      }
    };
  }

  async ping() {
    await this.connect();
    return 'PONG';
  }

  async set(key, value, expireInSeconds = null) {
    try {
      await this.connect();
      const stringValue = JSON.stringify(value);
      
      if (expireInSeconds) {
        // Используем localStorage с TTL для браузера
        const item = {
          value: stringValue,
          expires: Date.now() + expireInSeconds * 1000
        };
        localStorage.setItem(`redis:${key}`, JSON.stringify(item));
        
        // Очищаем через указанное время
        setTimeout(() => {
          localStorage.removeItem(`redis:${key}`);
          this.mockData.delete(key);
        }, expireInSeconds * 1000);
        
        console.log(`✅ SETEX: ${key} на ${expireInSeconds} сек`);
      } else {
        // Сохраняем без TTL
        localStorage.setItem(`redis:${key}`, stringValue);
        console.log(`✅ SET: ${key}`);
      }
      
      // Также сохраняем в памяти для быстрого доступа
      this.mockData.set(key, stringValue);
      
      return true;
    } catch (error) {
      console.error(`❌ SET ошибка для ${key}:`, error);
      return false;
    }
  }

  async get(key) {
    try {
      await this.connect();
      
      // Пробуем получить из localStorage
      const itemStr = localStorage.getItem(`redis:${key}`);
      
      if (itemStr) {
        try {
          const item = JSON.parse(itemStr);
          
          // Проверяем TTL
          if (item.expires && item.expires < Date.now()) {
            localStorage.removeItem(`redis:${key}`);
            this.mockData.delete(key);
            return null;
          }
          
          const value = item.value ? JSON.parse(item.value) : JSON.parse(itemStr);
          console.log(`📦 GET из localStorage: ${key} =`, value);
          return value;
        } catch {
          // Если не JSON с TTL, то просто значение
          const value = JSON.parse(itemStr);
          console.log(`📦 GET из localStorage: ${key} =`, value);
          return value;
        }
      }
      
      // Если нет в localStorage, пробуем из памяти
      const memoryValue = this.mockData.get(key);
      if (memoryValue) {
        const value = JSON.parse(memoryValue);
        console.log(`📦 GET из памяти: ${key} =`, value);
        return value;
      }
      
      console.log(`📭 Ключ ${key} не найден`);
      return null;
    } catch (error) {
      console.error(`❌ GET ошибка для ${key}:`, error);
      return null;
    }
  }

  async del(key) {
    try {
      await this.connect();
      
      // Удаляем из всех источников
      localStorage.removeItem(`redis:${key}`);
      this.mockData.delete(key);
      
      // Очищаем таймер TTL если есть
      if (this.ttlTimers.has(key)) {
        clearTimeout(this.ttlTimers.get(key));
        this.ttlTimers.delete(key);
      }
      
      console.log(`✅ DEL: ${key} удален`);
      return true;
    } catch (error) {
      console.error(`❌ DEL ошибка для ${key}:`, error);
      return false;
    }
  }

  async exists(key) {
    try {
      await this.connect();
      
      // Проверяем localStorage
      const inStorage = localStorage.getItem(`redis:${key}`) !== null;
      
      // Проверяем память
      const inMemory = this.mockData.has(key);
      
      const exists = inStorage || inMemory;
      console.log(`🔍 EXISTS ${key}:`, exists);
      
      return exists;
    } catch (error) {
      console.error(`❌ EXISTS ошибка для ${key}:`, error);
      return false;
    }
  }

  async info() {
    await this.connect();
    
    const keysInStorage = Object.keys(localStorage)
      .filter(key => key.startsWith('redis:'))
      .length;
    
    return `# Mock Redis Statistics
redis_version:7.0.0-browser-mock
connected_clients:1
used_memory_human:${Math.round(JSON.stringify(localStorage).length / 1024)}K
total_keys:${keysInStorage + this.mockData.size}
uptime_in_seconds:${Math.floor((Date.now() - this.startTime) / 1000)}`;
  }
}

// Экспортируем синглтон
const redisClient = new RedisClient();
redisClient.startTime = Date.now();

export { redisClient };
export default redisClient;