import express from 'express';
import { createClient } from 'redis';
import cookieParser from 'cookie-parser';

const app = express();
const PORT = 3007;

app.use((req, res, next) => {
  const origin = req.headers.origin;
  

  res.header('Access-Control-Allow-Origin', origin || '*');
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

app.use((req, res, next) => {
  next();
});

let redisClient;

const connectRedis = async () => {
  try {
    redisClient = createClient({
      url: 'redis://localhost:6379'
    });

    redisClient.on('error', (err) => {
    });

    redisClient.on('connect', () => {
    });

    await redisClient.connect();
    return true;
  } catch (error) {
    return false;
  }
};

connectRedis();

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

app.post('/api/user/create', async (req, res) => {
  try {
    const { userId, loginToken, provider } = req.body;
    
    if (!userId || !loginToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'userId и loginToken обязательны' 
      });
    }
    
    if (!redisClient || !redisClient.isOpen) {
      return res.status(500).json({ 
        success: false, 
        error: 'Redis недоступен' 
      });
    }
    
    const userData = {
      status: "anonymous",
      login_token: loginToken,
      provider: provider || 'unknown',
      created_at: Date.now() / 1000,
      last_active: Date.now() / 1000
    };
    
    const userKey = getUserKey(userId);
    
    try {
      await redisClient.setEx(userKey, 86400, JSON.stringify(userData));
    } catch (redisError) {
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
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.post('/api/user/update-token', async (req, res) => {
  try {
    const { userId, loginToken, provider } = req.body;
    
    if (!userId || !loginToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'userId и loginToken обязательны' 
      });
    }
    
    if (!redisClient || !redisClient.isOpen) {
      return res.status(500).json({ 
        success: false, 
        error: 'Redis недоступен' 
      });
    }
    
    const userKey = getUserKey(userId);
    
    const existingData = await redisClient.get(userKey);
    
    if (!existingData) {
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
    
    let userData;
    try {
      userData = JSON.parse(existingData);
    } catch (e) {
      userData = {
        status: "anonymous",
        login_token: loginToken,
        provider: provider || 'unknown',
        created_at: Date.now() / 1000,
        last_active: Date.now() / 1000
      };
    }
    
    userData.login_token = loginToken;
    userData.last_active = Date.now() / 1000;
    if (provider) {
      userData.provider = provider;
    }
    
    await redisClient.setEx(userKey, 86400, JSON.stringify(userData));
    
    res.json({
      success: true,
      userId: userId,
      loginToken: loginToken,
      redisKey: userKey,
      updated: true,
      message: 'Токен пользователя успешно обновлен'
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.post('/api/user/save-auth-tokens', async (req, res) => {
  try {
    const { userId, accessToken, refreshToken, provider } = req.body;
    
    if (!userId || !accessToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'userId и accessToken обязательны' 
      });
    }
    
    if (!redisClient || !redisClient.isOpen) {
      return res.status(500).json({ 
        success: false, 
        error: 'Redis недоступен' 
      });
    }
    
    const userKey = getUserKey(userId);
    
    const existingData = await redisClient.get(userKey);
    
    let userData;
    if (existingData) {
      try {
        userData = JSON.parse(existingData);
      } catch (e) {
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
      userData = {
        status: "authenticated",
        access_token: accessToken,
        refresh_token: refreshToken || '',
        provider: provider || 'unknown',
        auth_time: Date.now() / 1000,
        last_active: Date.now() / 1000
      };
    }
    
    userData.status = "authenticated";
    userData.access_token = accessToken;
    if (refreshToken) userData.refresh_token = refreshToken;
    if (provider) userData.provider = provider;
    userData.auth_time = Date.now() / 1000;
    userData.last_active = Date.now() / 1000;
    
    await redisClient.setEx(userKey, 86400, JSON.stringify(userData));
    
    res.json({
      success: true,
      userId: userId,
      status: userData.status,
      redisKey: userKey,
      message: 'Auth токены успешно сохранены'
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.get('/api/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
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
      
      res.json({
        success: true,
        found: true,
        userId: userId,
        data: parsedData,
        ttl: await redisClient.ttl(userKey)
      });
      
    } catch (e) {
      res.status(500).json({
        success: false,
        error: 'Ошибка обработки данных пользователя'
      });
    }
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.get('/api/session/user-id', async (req, res) => {
  try {
    const sessionToken = req.cookies.session_token;

    if (!sessionToken) {
      return res.status(401).json({ success: false, error: 'Нет session_token' });
    }

    if (!redisClient || !redisClient.isOpen) {
      return res.status(500).json({ success: false, error: 'Redis недоступен' });
    }

    const sessionKey = `session:${sessionToken}`;
    const loginToken = await redisClient.get(sessionKey);

    if (!loginToken) {
      return res.status(401).json({ success: false, error: 'Сессия не найдена/истекла' });
    }

    // ВАЖНО: лучше не делать keys('user:*') на проде, но пока повторим твою текущую логику
    const userKeys = await redisClient.keys('user:*');

    for (const userKey of userKeys) {
      const userDataStr = await redisClient.get(userKey);
      if (!userDataStr) continue;

      try {
        const userData = JSON.parse(userDataStr);
        if (userData.login_token === loginToken) {
          const userId = userKey.replace('user:', '');
          return res.json({ success: true, userId });
        }
      } catch (e) {}
    }

    return res.status(404).json({ success: false, error: 'Пользователь не найден' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/user/any-id', async (req, res) => {
  try {
    if (!redisClient || !redisClient.isOpen) {
      return res.status(500).json({ success: false, error: 'Redis недоступен' });
    }

    const keys = await redisClient.keys('user:*'); // вернет ["user:1768..."]
    if (!keys.length) {
      return res.status(404).json({ success: false, error: 'user:* ключи не найдены' });
    }

    const userId = keys[0].replace('user:', ''); // "1768..."
    return res.json({ success: true, userId, key: keys[0] });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/session/check', async (req, res) => {
  try {
    const sessionToken = req.cookies.session_token;
    
    const userIdFromQuery = req.query.user_id;
    
    if (userIdFromQuery) {
      const userKey = `user:${userIdFromQuery}`;
      const userDataStr = await redisClient.get(userKey);
      
      if (userDataStr) {
        try {
          const userData = JSON.parse(userDataStr);
          
          if (userData.status === 'authenticated') {
            return res.json({
              authenticated: true,
              status: 'authenticated',
              sessionToken: sessionToken || null,
              userId: userIdFromQuery,
              provider: userData.provider,
              loginToken: userData.login_token || null,
              accessToken: userData.access_token || null,
              refreshToken: userData.refresh_token || null,
              foundBy: 'direct_user_id_check'
            });
          }
        } catch (e) {
        }
      }
    }
    
    if (!sessionToken) {
      return res.json({
        authenticated: false,
        status: 'anonymous',
        message: 'Сессия не найдена (нет куки)'
      });
    }
    
    if (!redisClient || !redisClient.isOpen) {
      return res.json({
        authenticated: false,
        status: 'anonymous',
        message: 'Redis недоступен'
      });
    }
    
    const sessionKey = `session:${sessionToken}`;
    
    const loginToken = await redisClient.get(sessionKey);
    
    if (!loginToken) {
      const altKeys = [
        sessionToken,
        `session:${sessionToken}`,
        sessionToken.startsWith('session:') ? sessionToken.substring(7) : sessionToken
      ];
      
      for (const altKey of altKeys) {
        const altLoginToken = await redisClient.get(altKey);
        if (altLoginToken) {
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
    
    const userKeys = await redisClient.keys('user:*');
    let foundUser = null;
    let foundUserId = null;
    
    for (const userKey of userKeys) {
      const userDataStr = await redisClient.get(userKey);
      if (userDataStr) {
        try {
          const userData = JSON.parse(userDataStr);
          if (userData.login_token === loginToken) {
            foundUserId = userKey.replace('user:', '');
            foundUser = userData;
            break;
          }
        } catch (e) {
        }
      }
    }
    
    if (foundUser) {
      return res.json({
        authenticated: foundUser.status === 'authenticated',
        status: foundUser.status || 'anonymous',
        sessionToken: sessionToken,
        userId: foundUserId,
        provider: foundUser.provider,
        loginToken: loginToken,
        accessToken: foundUser.access_token || null,
        refreshToken: foundUser.refresh_token || null,
        foundBy: 'login_token_match'
      });
    }
    
    res.json({
      authenticated: true,
      status: 'anonymous',
      sessionToken: sessionToken,
      loginToken: loginToken,
      foundBy: 'session_only'
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post('/api/session/logout', async (req, res) => {
  try {
    console.log('=== LOGOUT: УДАЛЕНИЕ ПОЛЬЗОВАТЕЛЯ ИЗ REDIS ===');
    const sessionToken = req.cookies.session_token;
    
    if (!sessionToken) {
      console.log('Нет session_token в куках');
      return res.json({
        success: false,
        message: 'Сессия не найдена (нет куки)'
      });
    }
    
    if (!redisClient || !redisClient.isOpen) {
      return res.status(500).json({ 
        success: false, 
        error: 'Redis недоступен' 
      });
    }
    
    console.log('Session token из куков:', sessionToken);
    
    // 1. Удаляем сессию
    const sessionKey = `session:${sessionToken}`;
    const deletedSession = await redisClient.del(sessionKey);
    console.log(`Удалена сессия ${sessionKey}: ${deletedSession > 0 ? 'успешно' : 'не найдена'}`);
    
    // 2. Очищаем куки
    res.clearCookie('session_token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/'
    });
    
    // 3. Ищем пользователя по session и удаляем его
    let userIdToDelete = null;
    let loginToken = null;
    
    // Пытаемся найти loginToken из сессии
    const possibleKeys = [sessionKey, sessionToken];
    for (const key of possibleKeys) {
      const token = await redisClient.get(key);
      if (token) {
        loginToken = token;
        console.log(`Найден loginToken из сессии ${key}: ${token}`);
        break;
      }
    }
    
    if (loginToken) {
      // Ищем пользователя с таким login_token
      const userKeys = await redisClient.keys('user:*');
      console.log(`Найдено пользователей: ${userKeys.length}`);
      
      for (const userKey of userKeys) {
        try {
          const userDataStr = await redisClient.get(userKey);
          if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            if (userData.login_token === loginToken) {
              userIdToDelete = userKey.replace('user:', '');
              
              // УДАЛЯЕМ ПОЛЬЗОВАТЕЛЯ ПОЛНОСТЬЮ!
              const deletedUser = await redisClient.del(userKey);
              console.log(`🗑️ УДАЛЕН ПОЛЬЗОВАТЕЛЬ: ${userKey}, успешно: ${deletedUser > 0}`);
              break;
            }
          }
        } catch (e) {
          console.error(`Ошибка обработки пользователя ${userKey}:`, e);
        }
      }
    } else {
      console.log('LoginToken не найден в сессии');
    }
    
    // 4. Дополнительно: удаляем все session ключи для этого пользователя
    const allSessionKeys = await redisClient.keys('session:*');
    let deletedOtherSessions = 0;
    
    for (const key of allSessionKeys) {
      const tokenValue = await redisClient.get(key);
      if (tokenValue === loginToken) {
        await redisClient.del(key);
        deletedOtherSessions++;
        console.log(`Удалена связанная сессия: ${key}`);
      }
    }
    
    res.json({
      success: true,
      sessionDeleted: deletedSession > 0,
      userDeleted: !!userIdToDelete,
      userIdDeleted: userIdToDelete,
      otherSessionsDeleted: deletedOtherSessions,
      message: 'Пользователь и сессии удалены из Redis'
    });
    
  } catch (error) {
    console.error('Ошибка при logout:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.post('/api/session/delete', async (req, res) => {
  try {
    const { sessionToken } = req.body;
    
    if (!sessionToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'sessionToken обязателен' 
      });
    }
    
    if (!redisClient || !redisClient.isOpen) {
      return res.status(500).json({ 
        success: false, 
        error: 'Redis недоступен' 
      });
    }
    
    const normalizedSessionToken = normalizeSessionToken(sessionToken);
    
    const sessionKey = `session:${normalizedSessionToken}`;
    const deleted = await redisClient.del(sessionKey);
    
    const altDeleted = await redisClient.del(normalizedSessionToken);
    
    res.json({
      success: true,
      sessionDeleted: deleted > 0 || altDeleted > 0,
      keysAttempted: [sessionKey, normalizedSessionToken],
      message: 'Сессия удалена'
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.get('/api/auth/check/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!redisClient || !redisClient.isOpen) {
      return res.status(500).json({ 
        success: false, 
        error: 'Redis недоступен' 
      });
    }
    
    const userKey = `user:${userId}`;
    const userDataStr = await redisClient.get(userKey);
    
    if (!userDataStr) {
      return res.json({
        authenticated: false,
        status: 'anonymous',
        userId: userId,
        message: 'Пользователь не найден'
      });
    }
    
    let userData;
    try {
      userData = JSON.parse(userDataStr);
    } catch (e) {
      return res.json({
        authenticated: false,
        status: 'anonymous',
        userId: userId,
        error: 'Ошибка обработки данных'
      });
    }
    
    const isAuthenticated = userData.status === 'authenticated' || userData.status === 'authorized';
    
    res.json({
      authenticated: isAuthenticated,
      status: userData.status || 'anonymous',
      userId: userId,
      provider: userData.provider,
      loginToken: userData.login_token,
      accessToken: userData.access_token,
      refreshToken: userData.refresh_token,
      created_at: userData.created_at,
      last_active: userData.last_active,
      ttl: await redisClient.ttl(userKey)
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.post('/api/session/create', async (req, res) => {
  try {
    const { sessionToken, loginToken } = req.body;
    
    if (!sessionToken || !loginToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'sessionToken и loginToken обязательны' 
      });
    }
    
    const normalizedSessionToken = normalizeSessionToken(sessionToken);
    
    if (!redisClient || !redisClient.isOpen) {
      return res.status(500).json({ 
        success: false, 
        error: 'Redis недоступен' 
      });
    }
    
    const sessionKey = `session:${normalizedSessionToken}`;
    
    try {
      await redisClient.setEx(sessionKey, 86400, loginToken);
      
      const savedValue = await redisClient.get(sessionKey);
      if (savedValue === loginToken) {
      }
      
    } catch (redisError) {
      throw redisError;
    }
    
    res.cookie('session_token', normalizedSessionToken, {
      httpOnly: true,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      path: '/'
    });
    
    res.json({
      success: true,
      sessionToken: normalizedSessionToken,
      loginToken: loginToken,
      redisKey: sessionKey,
      message: 'Сессия создана: ключ=session:нормализованный_токен_сессии, значение=токен_входа'
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

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
    
    res.json({
      success: true,
      cleared: {
        sessions: sessionKeys.length,
        users: userKeys.length
      },
      message: 'Все данные очищены'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/user/generate-id', async (req, res) => {
  try {
    const generateUserId = () => {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000000);
      return `${timestamp}${random}`;
    };
    
    const userId = generateUserId();
    
    res.json({
      success: true,
      userId: userId,
      message: 'User ID сгенерирован'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Добавьте в бэкенд
app.post('/api/user/delete/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!redisClient || !redisClient.isOpen) {
      return res.status(500).json({ 
        success: false, 
        error: 'Redis недоступен' 
      });
    }
    
    const userKey = `user:${userId}`;
    
    // Удаляем пользователя
    const deleted = await redisClient.del(userKey);
    
    // Ищем и удаляем все его сессии
    const allSessionKeys = await redisClient.keys('session:*');
    let deletedSessions = 0;
    
    for (const sessionKey of allSessionKeys) {
      const loginToken = await redisClient.get(sessionKey);
      // Если нужно, можно добавить дополнительную логику поиска
      if (loginToken) {
        // Просто удаляем все сессии для безопасности
        await redisClient.del(sessionKey);
        deletedSessions++;
      }
    }
    
    res.json({
      success: true,
      userDeleted: deleted > 0,
      sessionsDeleted: deletedSessions,
      message: `Пользователь ${userId} полностью удален`
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.listen(PORT, () => {
});