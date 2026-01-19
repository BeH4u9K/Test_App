
const API_BASE_URL = 'http://localhost:3001';


export const sendTokenToServer = async (loginToken) => {
  try {
    console.log(' Отправка токена на сервер...');
    
    const response = await fetch(`${API_BASE_URL}/api/save-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        token: loginToken,
        timestamp: new Date().toISOString(),
        provider: 'web'
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Ответ сервера:', result);
    
    return {
      success: true,
      sessionToken: result.sessionToken,
      message: result.message
    };
  } catch (error) {
    console.error(' Ошибка отправки токена:', error);
    return {
      success: false,
      error: error.message
    };
  }
};


export const createSession = async (loginToken) => {
  return await sendTokenToServer(loginToken);
};

export const testConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return {
      success: response.ok,
      data
    };
  } catch (error) {
    console.error(' Ошибка подключения к серверу:', error);
    return {
      success: false,
      error: error.message
    };
  }
};


export const testRedis = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/redis-test`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return {
      success: response.ok,
      data
    };
  } catch (error) {
    console.error(' Ошибка теста Redis:', error);
    return {
      success: false,
      error: error.message
    };
  }
};


export const generateToken = (length = 32) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export const setCookie = (name, value, days) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

export const getCookie = (name) => {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length);
  }
  return null;
};

export const deleteCookie = (name) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
};


export const isValidProvider = (provider) => {
  return ['github', 'code', 'yandex'].includes(provider);
};