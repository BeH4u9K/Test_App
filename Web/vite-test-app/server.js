// server.js
import express from 'express';
import { createClient } from 'redis';

const app = express();
const PORT = 3001;

// Разрешаем все запросы
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.use(express.json());

// Подключение к Redis
let redisClient;

const connectRedis = async () => {
  try {
    redisClient = createClient({
      url: 'redis://localhost:6379'
    });

    redisClient.on('error', (err) => {
      console.error('❌ Ошибка Redis:', err);
    });

    await redisClient.connect();
    console.log('✅ Подключено к Redis');
    return true;
  } catch (error) {
    console.error('❌ Ошибка подключения к Redis:', error);
    return false;
  }
};

// Подключаемся к Redis при старте
connectRedis();

// 📌 Маршрут для приема токена и сохранения в Redis
app.post('/api/token', async (req, res) => {
  try {
    const { token, provider } = req.body;
    
    console.log('════════════════════════════════════════');
    console.log('📥 ПОЛУЧЕН ТОКЕН:');
    console.log('Провайдер:', provider || 'не указан');
    console.log('Токен:', token || 'не указан');
    console.log('Полная дата:', new Date().toLocaleString());
    
    // Проверяем подключение к Redis
    if (!redisClient || !redisClient.isOpen) {
      console.log('⚠️ Redis не подключен, пытаемся подключиться...');
      const connected = await connectRedis();
      if (!connected) {
        console.log('❌ Redis недоступен, токен не сохранен');
        res.send('OK (Redis недоступен)');
        return;
      }
    }
    
    try {
      // Сохраняем токен в Redis
      // Ключ: token:провайдер:токен
      const key = `token:${provider}:${token.substring(0, 20)}`;
      
      // Значение для сохранения
      const tokenData = {
        provider,
        token: token,
        receivedAt: new Date().toISOString(),
        ip: req.ip,
        userAgent: req.headers['user-agent']
      };
      
      // Сохраняем на 24 часа (86400 секунд)
      await redisClient.setEx(key, 86400, JSON.stringify(tokenData));
      
      console.log('✅ Токен сохранен в Redis');
      console.log('   Ключ:', key);
      console.log('   Время жизни: 24 часа');
      
      // Проверяем, что сохранилось
      const savedData = await redisClient.get(key);
      if (savedData) {
        console.log('✅ Подтверждено: данные в Redis');
      }
      
    } catch (redisError) {
      console.error('❌ Ошибка при сохранении в Redis:', redisError);
    }
    
    console.log('════════════════════════════════════════');
    
    res.send('OK (сохранено в Redis)');
    
  } catch (error) {
    console.error('❌ Ошибка при получении токена:', error);
    res.status(500).send('ERROR');
  }
});

// 📌 Маршрут для проверки токена в Redis
app.get('/api/token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { provider } = req.query;
    
    if (!redisClient || !redisClient.isOpen) {
      return res.json({ error: 'Redis не подключен' });
    }
    
    // Ищем токен в Redis
    // Используем паттерн для поиска
    const pattern = provider 
      ? `token:${provider}:*${token.substring(0, 10)}*`
      : `token:*:${token.substring(0, 10)}*`;
    
    const keys = await redisClient.keys(pattern);
    
    if (keys.length === 0) {
      return res.json({ 
        found: false, 
        message: 'Токен не найден в Redis' 
      });
    }
    
    // Получаем данные первого найденного токена
    const data = await redisClient.get(keys[0]);
    
    if (!data) {
      return res.json({ 
        found: false, 
        message: 'Данные не найдены' 
      });
    }
    
    const tokenData = JSON.parse(data);
    
    res.json({
      found: true,
      key: keys[0],
      data: tokenData
    });
    
  } catch (error) {
    console.error('❌ Ошибка при проверке токена:', error);
    res.status(500).json({ error: error.message });
  }
});

// 📌 Маршрут для получения всех токенов
app.get('/api/tokens', async (req, res) => {
  try {
    if (!redisClient || !redisClient.isOpen) {
      return res.json({ error: 'Redis не подключен' });
    }
    
    const keys = await redisClient.keys('token:*');
    const tokens = [];
    
    for (const key of keys) {
      const data = await redisClient.get(key);
      if (data) {
        tokens.push({
          key,
          data: JSON.parse(data)
        });
      }
    }
    
    res.json({
      count: tokens.length,
      tokens: tokens
    });
    
  } catch (error) {
    console.error('❌ Ошибка при получении токенов:', error);
    res.status(500).json({ error: error.message });
  }
});

// 📌 Маршрут для проверки Redis
app.get('/api/redis/status', async (req, res) => {
  try {
    if (!redisClient || !redisClient.isOpen) {
      return res.json({ connected: false });
    }
    
    const ping = await redisClient.ping();
    
    // Получаем статистику
    const keys = await redisClient.keys('token:*');
    
    res.json({
      connected: true,
      ping: ping,
      tokenCount: keys.length,
      uptime: process.uptime()
    });
    
  } catch (error) {
    res.json({
      connected: false,
      error: error.message
    });
  }
});

// 📌 Простой тестовый маршрут
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'OK', 
    redis: redisClient?.isOpen ? 'connected' : 'disconnected',
    message: 'Сервер работает!' 
  });
});

// 📌 Маршрут для проверки
app.get('/api/check', (req, res) => {
  res.json({ 
    status: 'OK', 
    redis: redisClient?.isOpen ? 'connected' : 'disconnected',
    message: 'Сервер готов принимать токены',
    endpoints: {
      saveToken: 'POST /api/token',
      getToken: 'GET /api/token/:token',
      getAllTokens: 'GET /api/tokens',
      redisStatus: 'GET /api/redis/status'
    }
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log('════════════════════════════════════════');
  console.log('🚀 Сервер запущен на порту', PORT);
  console.log('📡 Адрес: http://localhost:' + PORT);
  console.log('');
  console.log('📝 Доступные эндпоинты:');
  console.log('   POST   /api/token          - Принять токен (сохраняет в Redis)');
  console.log('   GET    /api/token/:token   - Проверить токен в Redis');
  console.log('   GET    /api/tokens         - Все токены из Redis');
  console.log('   GET    /api/redis/status   - Статус Redis');
  console.log('   GET    /api/test           - Тест сервера');
  console.log('   GET    /api/check          - Проверка');
  console.log('');
  console.log('📋 Формат запроса (JSON):');
  console.log('   {');
  console.log('     "token": "ваш_токен",');
  console.log('     "provider": "github/code/yandex"');
  console.log('   }');
  console.log('════════════════════════════════════════\n');
  console.log('⏳ Ожидание токенов...\n');
  
  // Проверка Redis при старте
  setTimeout(async () => {
    if (redisClient && redisClient.isOpen) {
      try {
        const keys = await redisClient.keys('token:*');
        console.log(`📊 В Redis найдено токенов: ${keys.length}`);
      } catch (error) {
        console.error('❌ Ошибка при проверке Redis:', error);
      }
    }
  }, 1000);
});