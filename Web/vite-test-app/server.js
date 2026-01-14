import express from 'express';
import { createClient } from 'redis';
import cookieParser from 'cookie-parser';

const app = express();
const PORT = 3007;

// CORS настройка
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:5179',
    'http://localhost:3000',
    'http://localhost:3007',
    'http://127.0.0.1:5175',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://localhost:8080'
  ];
  
  const origin = req.headers.origin;
  
  if (process.env.NODE_ENV === 'development') {
    res.header('Access-Control-Allow-Origin', origin || '*');
  } else if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

app.use(express.json());
app.use(cookieParser());

// Логирование запросов
app.use((req, res, next) => {
  console.log('════════════════════════════════════════');
  console.log(`📨 ${new Date().toLocaleTimeString()} ${req.method} ${req.url}`);
  console.log(`📌 Origin: ${req.headers.origin || 'none'}`);
  console.log(`🍪 Cookies:`, req.cookies);
  console.log('════════════════════════════════════════');
  next();
});

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

    redisClient.on('connect', () => {
      console.log('✅ Подключено к Redis');
    });

    await redisClient.connect();
    return true;
  } catch (error) {
    console.error('❌ Ошибка подключения к Redis:', error);
    return false;
  }
};

// Подключаемся к Redis при старте
connectRedis();

// 📌 Вспомогательные функции
const normalizeSessionToken = (token) => {
  if (!token) return null;
  return token.replace(/^session:/, '');
};

const getSessionKey = (sessionToken) => {
  const cleanToken = normalizeSessionToken(sessionToken);
  return `session:${cleanToken}`;
};

const getUserKey = (userId) => {
  return `user:${userId}`;
};

// 📌 СОЗДАНИЕ ПОЛЬЗОВАТЕЛЯ В ФОРМАТЕ TELEGRAM БОТА
app.post('/api/user/create', async (req, res) => {
  try {
    console.log('📨 ПОЛУЧЕН ЗАПРОС НА СОЗДАНИЕ ПОЛЬЗОВАТЕЛЯ');
    
    const { userId, loginToken, provider } = req.body;
    
    if (!userId || !loginToken) {
      console.log('❌ Ошибка: userId и loginToken обязательны');
      return res.status(400).json({ 
        success: false, 
        error: 'userId и loginToken обязательны' 
      });
    }
    
    console.log('🆕 СОЗДАНИЕ ПОЛЬЗОВАТЕЛЯ В REDIS:');
    console.log('   🔑 Ключ:', `user:${userId}`);
    console.log('   💾 Login Token:', loginToken.substring(0, 20) + '...');
    console.log('   🏷️  Провайдер:', provider || 'unknown');
    
    if (!redisClient || !redisClient.isOpen) {
      console.log('❌ Redis не подключен');
      return res.status(500).json({ 
        success: false, 
        error: 'Redis недоступен' 
      });
    }
    
    // ✅ ФОРМАТ КАК У TELEGRAM БОТА
    const userData = {
      status: "anonymous", // или "authenticated" после успешной авторизации
      login_token: loginToken,
      provider: provider || 'unknown',
      created_at: Date.now() / 1000, // Unix timestamp в секундах
      last_active: Date.now() / 1000
    };
    
    const userKey = getUserKey(userId);
    
    try {
      // TTL 24 часа (86400 секунд)
      await redisClient.setEx(userKey, 86400, JSON.stringify(userData));
      console.log('✅ Пользователь сохранен в Redis');
      console.log('   💾 Ключ:', userKey);
      console.log('   💾 Данные:', {
        status: userData.status,
        login_token: userData.login_token.substring(0, 20) + '...',
        created_at: userData.created_at
      });
      
    } catch (redisError) {
      console.error('❌ Ошибка Redis при сохранении:', redisError);
      throw redisError;
    }
    
    res.json({
      success: true,
      userId: userId,
      loginToken: loginToken,
      redisKey: userKey,
      message: 'Пользователь создан в формате Telegram бота'
    });
    
  } catch (error) {
    console.error('❌ Ошибка при создании пользователя:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 📌 ОБНОВЛЕНИЕ TOKEN ДЛЯ СУЩЕСТВУЮЩЕГО ПОЛЬЗОВАТЕЛЯ
app.post('/api/user/update-token', async (req, res) => {
  try {
    console.log('📨 ПОЛУЧЕН ЗАПРОС НА ОБНОВЛЕНИЕ ТОКЕНА ПОЛЬЗОВАТЕЛЯ');
    
    const { userId, loginToken, provider } = req.body;
    
    if (!userId || !loginToken) {
      console.log('❌ Ошибка: userId и loginToken обязательны');
      return res.status(400).json({ 
        success: false, 
        error: 'userId и loginToken обязательны' 
      });
    }
    
    console.log('🔄 ОБНОВЛЕНИЕ ПОЛЬЗОВАТЕЛЯ В REDIS:');
    console.log('   🔑 Ключ:', `user:${userId}`);
    console.log('   💾 Новый Login Token:', loginToken.substring(0, 20) + '...');
    
    if (!redisClient || !redisClient.isOpen) {
      console.log('❌ Redis не подключен');
      return res.status(500).json({ 
        success: false, 
        error: 'Redis недоступен' 
      });
    }
    
    const userKey = getUserKey(userId);
    
    // Получаем существующие данные пользователя
    const existingData = await redisClient.get(userKey);
    
    if (!existingData) {
      console.log('⚠️ Пользователь не найден, создаем нового');
      
      const userData = {
        status: "anonymous",
        login_token: loginToken,
        provider: provider || 'unknown',
        created_at: Date.now() / 1000,
        last_active: Date.now() / 1000
      };
      
      await redisClient.setEx(userKey, 86400, JSON.stringify(userData));
      
      return res.json({
        success: true,
        userId: userId,
        loginToken: loginToken,
        redisKey: userKey,
        created: true,
        message: 'Пользователь создан (не существовал)'
      });
    }
    
    // Обновляем существующего пользователя
    let userData;
    try {
      userData = JSON.parse(existingData);
    } catch (e) {
      console.log('⚠️ Ошибка парсинга, создаем новую структуру');
      userData = {
        status: "anonymous",
        login_token: loginToken,
        provider: provider || 'unknown',
        created_at: Date.now() / 1000,
        last_active: Date.now() / 1000
      };
    }
    
    // Обновляем поля
    userData.login_token = loginToken;
    userData.last_active = Date.now() / 1000;
    if (provider) {
      userData.provider = provider;
    }
    
    // Сохраняем обновленные данные
    await redisClient.setEx(userKey, 86400, JSON.stringify(userData));
    
    console.log('✅ Токен пользователя обновлен');
    console.log('   💾 Обновленные данные:', {
      status: userData.status,
      login_token: userData.login_token.substring(0, 20) + '...',
      last_active: userData.last_active
    });
    
    res.json({
      success: true,
      userId: userId,
      loginToken: loginToken,
      redisKey: userKey,
      updated: true,
      message: 'Токен пользователя успешно обновлен'
    });
    
  } catch (error) {
    console.error('❌ Ошибка при обновлении токена пользователя:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 📌 СОХРАНЕНИЕ ACCESS TOKEN ДЛЯ АВТОРИЗОВАННОГО ПОЛЬЗОВАТЕЛЯ
app.post('/api/user/save-auth-tokens', async (req, res) => {
  try {
    console.log('📨 ПОЛУЧЕН ЗАПРОС НА СОХРАНЕНИЕ AUTH ТОКЕНОВ');
    
    const { userId, accessToken, refreshToken, provider } = req.body;
    
    if (!userId || !accessToken) {
      console.log('❌ Ошибка: userId и accessToken обязательны');
      return res.status(400).json({ 
        success: false, 
        error: 'userId и accessToken обязательны' 
      });
    }
    
    console.log('🔐 СОХРАНЕНИЕ AUTH ТОКЕНОВ ДЛЯ ПОЛЬЗОВАТЕЛЯ:');
    console.log('   🔑 User ID:', userId);
    console.log('   🔑 Access Token:', accessToken.substring(0, 20) + '...');
    
    if (!redisClient || !redisClient.isOpen) {
      console.log('❌ Redis не подключен');
      return res.status(500).json({ 
        success: false, 
        error: 'Redis недоступен' 
      });
    }
    
    const userKey = getUserKey(userId);
    
    // Получаем существующие данные пользователя
    const existingData = await redisClient.get(userKey);
    
    let userData;
    if (existingData) {
      try {
        userData = JSON.parse(existingData);
      } catch (e) {
        console.log('⚠️ Ошибка парсинга, создаем новую структуру');
        userData = {
          status: "authenticated",
          access_token: accessToken,
          refresh_token: refreshToken || '',
          provider: provider || 'unknown',
          auth_time: Date.now() / 1000,
          last_active: Date.now() / 1000
        };
      }
    } else {
      // Создаем нового пользователя
      userData = {
        status: "authenticated",
        access_token: accessToken,
        refresh_token: refreshToken || '',
        provider: provider || 'unknown',
        auth_time: Date.now() / 1000,
        last_active: Date.now() / 1000
      };
    }
    
    // Обновляем статус и токены
    userData.status = "authenticated";
    userData.access_token = accessToken;
    if (refreshToken) userData.refresh_token = refreshToken;
    if (provider) userData.provider = provider;
    userData.auth_time = Date.now() / 1000;
    userData.last_active = Date.now() / 1000;
    
    // Сохраняем обновленные данные
    await redisClient.setEx(userKey, 86400, JSON.stringify(userData));
    
    console.log('✅ Auth токены сохранены');
    console.log('   💾 Обновленные данные:', {
      status: userData.status,
      access_token: userData.access_token.substring(0, 20) + '...',
      auth_time: userData.auth_time
    });
    
    res.json({
      success: true,
      userId: userId,
      status: userData.status,
      redisKey: userKey,
      message: 'Auth токены успешно сохранены'
    });
    
  } catch (error) {
    console.error('❌ Ошибка при сохранении auth токенов:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 📌 ПОЛУЧЕНИЕ ДАННЫХ ПОЛЬЗОВАТЕЛЯ
app.get('/api/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('🔍 ЗАПРОС ДАННЫХ ПОЛЬЗОВАТЕЛЯ:', userId);
    
    if (!redisClient || !redisClient.isOpen) {
      return res.status(500).json({ 
        success: false, 
        error: 'Redis недоступен' 
      });
    }
    
    const userKey = getUserKey(userId);
    const userData = await redisClient.get(userKey);
    
    if (!userData) {
      return res.json({
        success: false,
        found: false,
        message: 'Пользователь не найден'
      });
    }
    
    try {
      const parsedData = JSON.parse(userData);
      
      // Маскируем чувствительные данные для логов
      const safeData = { ...parsedData };
      if (safeData.login_token) {
        safeData.login_token = safeData.login_token.substring(0, 10) + '...';
      }
      if (safeData.access_token) {
        safeData.access_token = safeData.access_token.substring(0, 10) + '...';
      }
      
      console.log('✅ Данные пользователя получены:', safeData);
      
      res.json({
        success: true,
        found: true,
        userId: userId,
        data: parsedData,
        ttl: await redisClient.ttl(userKey)
      });
      
    } catch (e) {
      console.error('❌ Ошибка парсинга данных пользователя:', e);
      res.status(500).json({
        success: false,
        error: 'Ошибка обработки данных пользователя'
      });
    }
    
  } catch (error) {
    console.error('❌ Ошибка при получении данных пользователя:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 📌 Проверка сессии (сохраняем для обратной совместимости)
app.get('/api/session/check', async (req, res) => {
  try {
    // Получаем токен сессии из куки
    const sessionToken = req.cookies.session_token;
    
    console.log('🔍 ПРОВЕРКА СЕССИИ (legacy):');
    console.log('Токен сессии из куки:', sessionToken ? sessionToken.substring(0, 20) + '...' : 'НЕТ КУКИ');
    
    // Если куки нет - сразу отрицательный ответ
    if (!sessionToken) {
      console.log('❌ Кука session_token не найдена');
      return res.json({
        authenticated: false,
        status: 'anonymous',
        message: 'Сессия не найдена (нет куки)'
      });
    }
    
    // Проверяем подключение к Redis
    if (!redisClient || !redisClient.isOpen) {
      console.log('⚠️ Redis не подключен');
      return res.json({
        authenticated: false,
        status: 'anonymous',
        message: 'Redis недоступен'
      });
    }
    
    // ✅ КЛЮЧ В REDIS: session:токен_сессии
    const sessionKey = getSessionKey(sessionToken);
    console.log('🔑 Ключ для поиска в Redis:', sessionKey);
    
    // ✅ ЗНАЧЕНИЕ В REDIS: токен_входа (простая строка)
    const loginToken = await redisClient.get(sessionKey);
    
    if (!loginToken) {
      console.log('❌ Сессия не найдена в Redis');
      
      // Попробуем альтернативный поиск (для обратной совместимости)
      console.log('🔍 Пробуем альтернативный поиск...');
      const altKeys = [
        sessionToken, // Без изменений
        `session:${sessionToken}`, // С префиксом
        sessionToken.startsWith('session:') ? sessionToken.substring(7) : sessionToken // Без префикса
      ];
      
      for (const altKey of altKeys) {
        const altLoginToken = await redisClient.get(altKey);
        if (altLoginToken) {
          console.log(`✅ Найдено по альтернативному ключу: ${altKey}`);
          return res.json({
            authenticated: true,
            status: 'anonymous',
            sessionToken: altKey.startsWith('session:') ? altKey.substring(7) : altKey,
            loginToken: altLoginToken,
            foundBy: 'alternative_key'
          });
        }
      }
      
      return res.json({
        authenticated: false,
        status: 'anonymous',
        message: 'Сессия устарела или не существует',
        triedKeys: altKeys
      });
    }
    
    console.log('✅✅✅ СЦЕНАРИЙ ВЫПОЛНЕН: ПОЛЬЗОВАТЕЛЬ С ТОКЕНОМ ЕСТЬ! ✅✅✅');
    console.log('📊 Redis сообщает: такой ключ ЕСТЬ в базе');
    console.log('📨 Redis прислал значение (токен входа):', loginToken.substring(0, 20) + '...');
    
    res.json({
      authenticated: true,
      status: 'anonymous',
      sessionToken: normalizeSessionToken(sessionToken),
      loginToken: loginToken,
      foundBy: 'session_key'
    });
    
  } catch (error) {
    console.error('❌ Ошибка при проверке сессии:', error);
    res.status(500).json({ error: error.message });
  }
});

// 📌 Создание новой сессии (сохраняем для обратной совместимости)
app.post('/api/session/create', async (req, res) => {
  try {
    console.log('📨 ПОЛУЧЕН ЗАПРОС НА СОЗДАНИЕ СЕССИИ (legacy)');
    
    const { sessionToken, loginToken } = req.body;
    
    if (!sessionToken || !loginToken) {
      console.log('❌ Ошибка: sessionToken и loginToken обязательны');
      return res.status(400).json({ 
        success: false, 
        error: 'sessionToken и loginToken обязательны' 
      });
    }
    
    // Нормализуем токен сессии (убираем префикс 'session:' если он есть)
    const normalizedSessionToken = normalizeSessionToken(sessionToken);
    
    console.log('🆕 СОЗДАНИЕ НОВОЙ СЕССИИ В REDIS (legacy):');
    console.log('   🔑 Исходный токен сессии:', sessionToken.substring(0, 20) + '...');
    console.log('   🔑 Нормализованный токен сессии:', normalizedSessionToken.substring(0, 20) + '...');
    console.log('   💾 Значение (токен входа):', loginToken.substring(0, 20) + '...');
    
    if (!redisClient || !redisClient.isOpen) {
      console.log('❌ Redis не подключен');
      return res.status(500).json({ 
        success: false, 
        error: 'Redis недоступен' 
      });
    }
    
    // ✅ ПРАВИЛЬНАЯ СТРУКТУРА: ключ = session:нормализованный_токен_сессии, значение = токен_входа
    const sessionKey = `session:${normalizedSessionToken}`;
    
    try {
      // TTL 24 часа (86400 секунд)
      await redisClient.setEx(sessionKey, 86400, loginToken);
      console.log('✅ Сессия сохранена в Redis');
      console.log('   💾 Ключ:', sessionKey);
      console.log('   💾 Значение:', loginToken.substring(0, 20) + '...');
      console.log('   ⏱️ Время жизни: 24 часа');
      
      // Проверяем что сохранилось
      const savedValue = await redisClient.get(sessionKey);
      if (savedValue === loginToken) {
        console.log('✅ Подтверждение: значение сохранено корректно');
      }
      
    } catch (redisError) {
      console.error('❌ Ошибка Redis при сохранении:', redisError);
      throw redisError;
    }
    
    console.log('════════════════════════════════════════');
    
    // Устанавливаем куку session_token в браузер (сохраняем нормализованный токен)
    res.cookie('session_token', normalizedSessionToken, {
      httpOnly: true,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000, // 24 часа
      sameSite: 'lax',
      path: '/'
    });
    
    console.log('🍪 Кука session_token установлена в браузер:', normalizedSessionToken.substring(0, 20) + '...');
    
    res.json({
      success: true,
      sessionToken: normalizedSessionToken,
      loginToken: loginToken,
      redisKey: sessionKey,
      message: 'Сессия создана: ключ=session:нормализованный_токен_сессии, значение=токен_входа'
    });
    
  } catch (error) {
    console.error('❌ Ошибка при создании сессии:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 📌 ПОЛУЧЕНИЕ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ
app.get('/api/users/all', async (req, res) => {
  try {
    if (!redisClient || !redisClient.isOpen) {
      return res.json({ 
        success: false, 
        error: 'Redis не подключен' 
      });
    }
    
    const userKeys = await redisClient.keys('user:*');
    const users = [];
    
    for (const key of userKeys) {
      const userData = await redisClient.get(key);
      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          const userId = key.replace('user:', '');
          
          users.push({
            key,
            userId: userId,
            status: parsed.status || 'unknown',
            hasLoginToken: !!parsed.login_token,
            hasAccessToken: !!parsed.access_token,
            provider: parsed.provider || 'unknown',
            created_at: parsed.created_at || 'unknown',
            last_active: parsed.last_active || 'unknown',
            ttl: await redisClient.ttl(key)
          });
        } catch (e) {
          console.error('Ошибка парсинга данных пользователя:', e);
        }
      }
    }
    
    res.json({
      success: true,
      count: users.length,
      users: users
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 📌 Проверка Redis статуса
app.get('/api/redis/status', async (req, res) => {
  try {
    if (!redisClient || !redisClient.isOpen) {
      return res.json({ 
        connected: false,
        message: 'Redis не подключен'
      });
    }
    
    const ping = await redisClient.ping();
    const sessionKeys = await redisClient.keys('session:*');
    const userKeys = await redisClient.keys('user:*');
    
    res.json({
      connected: true,
      ping: ping,
      sessions: sessionKeys.length,
      users: userKeys.length,
      uptime: process.uptime()
    });
    
  } catch (error) {
    res.json({
      connected: false,
      error: error.message
    });
  }
});

// 📌 Очистка всех данных (только для разработки)
app.post('/api/redis/clear', async (req, res) => {
  try {
    if (!redisClient || !redisClient.isOpen) {
      return res.status(500).json({
        success: false,
        error: 'Redis недоступен'
      });
    }
    
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({
        success: false,
        error: 'Доступно только в режиме разработки'
      });
    }
    
    const sessionKeys = await redisClient.keys('session:*');
    const userKeys = await redisClient.keys('user:*');
    
    if (sessionKeys.length > 0) {
      await redisClient.del(sessionKeys);
    }
    
    if (userKeys.length > 0) {
      await redisClient.del(userKeys);
    }
    
    console.log('🧹 Очищены данные Redis:');
    console.log('   Сессии:', sessionKeys.length);
    console.log('   Пользователи:', userKeys.length);
    
    res.json({
      success: true,
      cleared: {
        sessions: sessionKeys.length,
        users: userKeys.length
      },
      message: 'Все данные очищены'
    });
    
  } catch (error) {
    console.error('❌ Ошибка при очистке Redis:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 📌 ГЕНЕРАЦИЯ USER ID (если не передан с фронтенда)
app.get('/api/user/generate-id', async (req, res) => {
  try {
    // Генерируем случайный ID пользователя
    const generateUserId = () => {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000000);
      return `${timestamp}${random}`;
    };
    
    const userId = generateUserId();
    
    console.log('🆔 Сгенерирован новый User ID:', userId);
    
    res.json({
      success: true,
      userId: userId,
      message: 'User ID сгенерирован'
    });
    
  } catch (error) {
    console.error('❌ Ошибка при генерации User ID:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log('════════════════════════════════════════');
  console.log('🚀 Сервер запущен на порту', PORT);
  console.log('📡 Адрес: http://localhost:' + PORT);
  console.log('');
  console.log('📋 СТРУКТУРА ХРАНЕНИЯ КАК У TELEGRAM БОТА:');
  console.log('   Redis структура:');
  console.log('     user:USER_ID -> {');
  console.log('       "status": "anonymous" | "authenticated",');
  console.log('       "login_token": "TOKEN",');
  console.log('       "access_token": "TOKEN", // если авторизован');
  console.log('       "refresh_token": "TOKEN", // если авторизован');
  console.log('       "provider": "github" | "yandex" | "code",');
  console.log('       "created_at": UNIX_TIMESTAMP,');
  console.log('       "last_active": UNIX_TIMESTAMP');
  console.log('     }');
  console.log('');
  console.log('🎯 ДОСТУПНЫЕ ЭНДПОИНТЫ:');
  console.log('   POST   /api/user/create           - Создать пользователя');
  console.log('   POST   /api/user/update-token     - Обновить токен пользователя');
  console.log('   POST   /api/user/save-auth-tokens - Сохранить auth токены');
  console.log('   GET    /api/user/:userId          - Получить данные пользователя');
  console.log('   GET    /api/users/all             - Все пользователи');
  console.log('   GET    /api/user/generate-id      - Сгенерировать User ID');
  console.log('   GET    /api/session/check         - Проверить сессию (legacy)');
  console.log('   POST   /api/session/create        - Создать сессию (legacy)');
  console.log('   GET    /api/redis/status          - Статус Redis');
  console.log('   POST   /api/redis/clear           - Очистка Redis (dev only)');
  console.log('════════════════════════════════════════\n');
});