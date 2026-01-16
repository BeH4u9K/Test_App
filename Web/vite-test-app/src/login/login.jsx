import React, { useState, useEffect, useRef } from 'react';
import { styled } from '@mui/system';
import { useNavigate, useSearchParams } from 'react-router-dom';
import gitIcon from '../IMG/git.png';
import codeIcon from '../IMG/code.png';
import yandexIcon from '../IMG/yandex.png';

// Стили
const Body = styled('div')({
  backgroundColor: '#A3ADB1',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  width: '400px',
  height: '500px',
  borderRadius: "25px",
  padding: '40px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
});

const Title = styled('h2')({
  color: '#2C3E50',
  marginBottom: '30px',
  textAlign: 'center',
  fontSize: '28px',
  fontWeight: 700,
});

const ButtonGrid = styled('div')({
  display: 'flex',
  gap: '25px',
  margin: '50px 0 40px',
});

const Button = styled('button')({
  width: "100px",
  height: '100px',
  backgroundColor: 'transparent',
  borderRadius: '50%',
  border: '4px solid #7E866A',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0',
  overflow: 'hidden',
  '&:hover:not(:disabled)': { 
    transform: 'scale(1.1)', 
    borderColor: '#6A7359' 
  },
  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed'
  }
});

const IconImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: '50%',
});

const Status = styled('div')({
  marginTop: '20px',
  padding: '10px',
  textAlign: 'center',
  fontSize: '14px',
  minHeight: '20px',
  width: '100%',
  backgroundColor: '#E8F6F3',
  borderRadius: '5px',
});

const ScenarioInfo = styled('div')({
  backgroundColor: '#2C3E50',
  color: '#FFF',
  padding: '15px',
  borderRadius: '10px',
  marginBottom: '20px',
  width: '100%',
  textAlign: 'left',
  border: '2px solid #F39C12'
});

const StepList = styled('div')({
  fontSize: '12px',
  whiteSpace: 'pre-line',
  lineHeight: '1.5',
  marginTop: '10px'
});

const StepItem = styled('div')({
  marginBottom: '5px',
  paddingLeft: '20px',
  position: 'relative',
  '&:before': {
    content: '"→"',
    position: 'absolute',
    left: '5px',
    color: '#F39C12'
  }
});

const BACKEND_URL = 'http://localhost:3007';
const AUTH_SERVER_URL = 'http://localhost:8080';

// Генерация токена
const generateToken = () => {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

// Генерация User ID
const generateUserId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return `${timestamp}${random}`;
};

// Получение токенов с Auth Server
const getTokensFromAuthServer = async (loginToken) => {
  try {
    console.log('📥 Проверка токенов на Auth Server для login_token:', loginToken?.substring(0, 10) + '...');
    
    const response = await fetch(`${AUTH_SERVER_URL}/check?login_token=${encodeURIComponent(loginToken)}`, {
      method: 'GET',
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      mode: 'cors',
      credentials: 'omit'
    });

    if (response.ok) {
      const data = await response.json();
      console.log('📦 Ответ от Auth Server:', data);
      
      if (data.status === 'granted' && data.access_token) {
        return {
          accessToken: data.access_token,
          refreshToken: data.refresh_token || '',
          userId: data.user_id || '',
          provider: data.provider || 'unknown'
        };
      }
    } else {
      console.error('❌ Ошибка при запросе к Auth Server:', response.status);
    }
    return null;
  } catch (error) {
    console.error('❌ Ошибка сети при получении токенов:', error);
    return null;
  }
};

// СОЗДАНИЕ/ОБНОВЛЕНИЕ ПОЛЬЗОВАТЕЛЯ В ФОРМАТЕ TELEGRAM БОТА
const createOrUpdateUserInRedis = async (userId, loginToken, provider, isUpdate = false) => {
  try {
    console.log('👤 Создание/обновление пользователя в Redis (формат Telegram)...');
    console.log('   📋 User ID:', userId);
    console.log('   🔑 Login Token:', loginToken.substring(0, 20) + '...');
    console.log('   🏷️  Провайдер:', provider);
    console.log('   🔄 Тип:', isUpdate ? 'Обновление' : 'Создание');
    
    const endpoint = isUpdate ? '/api/user/update-token' : '/api/user/create';
    
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      mode: 'cors',
      body: JSON.stringify({
        userId: userId,
        loginToken: loginToken,
        provider: provider
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Пользователь сохранен в Redis (формат Telegram):', result.message);
      return {
        success: true,
        userId: userId,
        data: result
      };
    } else {
      const errorText = await response.text();
      console.error('❌ Ошибка сохранения пользователя в Redis:', errorText);
      return {
        success: false,
        error: errorText
      };
    }
  } catch (error) {
    console.error('❌ Ошибка сети при сохранении пользователя:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// СОХРАНЕНИЕ AUTH ТОКЕНОВ ДЛЯ АВТОРИЗОВАННОГО ПОЛЬЗОВАТЕЛЯ
const saveAuthTokensToRedis = async (userId, accessToken, refreshToken, provider) => {
  try {
    console.log('🔐 Сохранение auth токенов для пользователя...');
    console.log('   📋 User ID:', userId);
    console.log('   🔑 Access Token:', accessToken.substring(0, 20) + '...');
    console.log('   🏷️  Провайдер:', provider);
    
    const response = await fetch(`${BACKEND_URL}/api/user/save-auth-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      mode: 'cors',
      body: JSON.stringify({
        userId: userId,
        accessToken: accessToken,
        refreshToken: refreshToken,
        provider: provider
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Auth токены сохранены в Redis:', result.message);
      return {
        success: true,
        data: result
      };
    } else {
      const errorText = await response.text();
      console.error('❌ Ошибка сохранения auth токенов в Redis:', errorText);
      return {
        success: false,
        error: errorText
      };
    }
  } catch (error) {
    console.error('❌ Ошибка сети при сохранении auth токенов:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ПОЛУЧЕНИЕ ДАННЫХ ПОЛЬЗОВАТЕЛЯ
const getUserDataFromRedis = async (userId) => {
  try {
    console.log('🔍 Получение данных пользователя из Redis...');
    console.log('   📋 User ID:', userId);
    
    const response = await fetch(`${BACKEND_URL}/api/user/${userId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include',
      mode: 'cors'
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Данные пользователя получены:', result.found ? 'Найден' : 'Не найден');
      return {
        success: true,
        found: result.found,
        data: result.data || {}
      };
    } else {
      console.error('❌ Ошибка получения данных пользователя');
      return {
        success: false,
        found: false,
        error: 'Ошибка запроса'
      };
    }
  } catch (error) {
    console.error('❌ Ошибка сети при получении данных пользователя:', error);
    return {
      success: false,
      found: false,
      error: error.message
    };
  }
};

// Отправка loginToken на Auth Server
// ВАЖНО: ЗАМЕНИТЕ существующую функцию sendLoginTokenToAuthServer на эту:

// Отправка loginToken на Auth Server (использует существующий /auth эндпоинт)
const sendLoginTokenToAuthServer = async (loginToken, provider) => {
  try {
    console.log('📤 Отправка loginToken на Auth Server через /auth эндпоинт...');
    console.log('   🔑 Login Token:', loginToken.substring(0, 20) + '...');
    console.log('   🏷️  Провайдер:', provider);
    
    // Используем GET запрос на /auth эндпоинт
    const authUrl = `${AUTH_SERVER_URL}/auth?provider=${encodeURIComponent(provider)}&login_token=${encodeURIComponent(loginToken)}`;
    console.log(`📡 Запрос к: ${authUrl}`);
    
    const response = await fetch(authUrl, {
      method: 'GET',
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      mode: 'cors'
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ LoginToken успешно зарегистрирован на Auth Server:', data);
      return data; // Возвращаем данные с auth_url и state
    } else {
      const errorText = await response.text();
      console.error('❌ Ошибка при регистрации loginToken на Auth Server:', response.status, errorText);
      return null;
    }
  } catch (error) {
    console.error('❌ Ошибка сети при отправке loginToken:', error);
    return null;
  }
};

// 📌 ФУНКЦИЯ ДЛЯ ГЕНЕРАЦИИ ИЛИ ПОЛУЧЕНИЯ USER ID
const getOrGenerateUserId = () => {
  // Пробуем получить из localStorage
  const storedUserId = localStorage.getItem('tg_user_id');
  
  if (storedUserId) {
    console.log('🎯 Используем сохраненный User ID из localStorage:', storedUserId);
    return storedUserId;
  }
  
  // Генерируем новый
  const newUserId = generateUserId();
  console.log('🆕 Сгенерирован новый User ID:', newUserId);
  
  // Сохраняем в localStorage
  localStorage.setItem('tg_user_id', newUserId);
  
  return newUserId;
};

function Login({ type, hasExistingSession = false, authState = null }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [currentProvider, setCurrentProvider] = useState(type || '');
  const [scenarioSteps, setScenarioSteps] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  const hasStartedRef = useRef(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlType = searchParams.get('type');
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  

  // Добавляем шаг в сценарий
  const addStep = (step, status = 'pending') => {
    setScenarioSteps(prev => [...prev, { step, status, timestamp: new Date().toLocaleTimeString() }]);
  };

  // Обновляем статус шага
  const updateStep = (index, status) => {
    setScenarioSteps(prev => {
      const newSteps = [...prev];
      if (newSteps[index]) {
        newSteps[index] = { ...newSteps[index], status };
      }
      return newSteps;
    });
  };

  // ОПРОС СТАТУСА АВТОРИЗАЦИИ (новая версия)
  const pollAuthStatus = async (loginToken, userId, provider) => {
    console.log('🔄 Начинаем опрос статуса авторизации...');
    addStep('🔄 Начинаем опрос статуса авторизации');
    
    let attempts = 0;
    const maxAttempts = 60;
    
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        attempts++;
        
        try {
          console.log(`📡 Опрос ${attempts}/${maxAttempts} для login_token: ${loginToken?.substring(0, 10)}...`);
          
          const tokens = await getTokensFromAuthServer(loginToken);
          
          if (tokens) {
            console.log('✅ Токены получены с Auth Server!');
            clearInterval(interval);
            
            // Сохраняем auth токены в Redis (формат Telegram)
            addStep('🔐 Сохраняем auth токены в Redis (формат Telegram)');
            setStatus('Сохранение токенов авторизации...');
            
            const saved = await saveAuthTokensToRedis(
              userId,
              tokens.accessToken,
              tokens.refreshToken,
              provider
            );
            
            if (saved.success) {
              updateStep(scenarioSteps.length - 1, 'completed');
              
              console.log('✅✅✅ АВТОРИЗАЦИЯ ЗАВЕРШЕНА УСПЕШНО!');
              console.log('   📋 User ID:', userId);
              console.log('   🔑 Access Token:', tokens.accessToken.substring(0, 20) + '...');
              console.log('   🏷️  Провайдер:', provider);
              
              resolve({
                ...tokens,
                userId: userId,
                provider: provider
              });
            } else {
              updateStep(scenarioSteps.length - 1, 'error');
              reject(new Error('Не удалось сохранить auth токены в Redis'));
            }
          } else if (attempts >= maxAttempts) {
            clearInterval(interval);
            console.log('⏱️ Время ожидания истекло');
            addStep('❌ Время ожидания авторизации истекло', 'error');
            reject(new Error('Время ожидания авторизации истекло'));
          } else {
            console.log('⏳ Авторизация еще не завершена...');
            setStatus(`Ожидание авторизации... (${attempts}/${maxAttempts})`);
          }
        } catch (error) {
          clearInterval(interval);
          console.error('❌ Ошибка при опросе:', error);
          reject(error);
        }
      }, 3000);
    });
  };

  // ОСНОВНОЙ ОБРАБОТЧИК АВТОРИЗАЦИИ (новая версия - формат Telegram)
// ОСНОВНОЙ ОБРАБОТЧИК АВТОРИЗАЦИИ (ИСПРАВЛЕННАЯ ВЕРСИЯ)
const handleAuth = async (provider) => {
  if (hasStartedRef.current || loading) {
    console.log('⚠️ Auth already started, ignoring');
    return;
  }
  
  console.log(`🚀 Starting auth for: ${provider} (формат Telegram)`);
  
  hasStartedRef.current = true;
  setLoading(true);
  setCurrentProvider(provider);
  
  try {
    // 1. Получаем или генерируем User ID
    console.log('\n🔧 ШАГ 1: Получаем/генерируем User ID');
    addStep('🆔 Получаем/генерируем User ID');
    
    const userId = getOrGenerateUserId();
    setCurrentUserId(userId);
    
    console.log('   📋 User ID:', userId);
    updateStep(scenarioSteps.length - 1, 'completed');
    
    // 2. Генерируем loginToken
    console.log('\n🔧 ШАГ 2: Генерируем loginToken');
    addStep('🔑 Генерируем loginToken');
    
    const loginToken = generateToken();
    console.log('   🔑 Login Token:', loginToken.substring(0, 20) + '...');
    updateStep(scenarioSteps.length - 1, 'completed');
    
    // 3. Проверяем, существует ли уже пользователь
    console.log('\n🔧 ШАГ 3: Проверяем существование пользователя');
    addStep('🔍 Проверяем существование пользователя');
    
    const userCheck = await getUserDataFromRedis(userId);
    
    let isUpdate = false;
    if (userCheck.success && userCheck.found) {
      console.log('   ✅ Пользователь уже существует в Redis');
      isUpdate = true;
    } else {
      console.log('   🆕 Пользователь не найден, будет создан новый');
    }
    updateStep(scenarioSteps.length - 1, 'completed');
    
    // 4. Создаем/обновляем пользователя в Redis
    console.log('\n🔧 ШАГ 4: Создаем/обновляем пользователя в Redis');
    addStep(isUpdate ? '🔄 Обновляем пользователя в Redis' : '👤 Создаем пользователя в Redis');
    setStatus(isUpdate ? 'Обновление пользователя...' : 'Создание пользователя...');
    
    const userResult = await createOrUpdateUserInRedis(userId, loginToken, provider, isUpdate);
    
    if (!userResult.success) {
      throw new Error(`Ошибка при ${isUpdate ? 'обновлении' : 'создании'} пользователя: ${userResult.error}`);
    }
    
    console.log(`   ✅ Пользователь ${isUpdate ? 'обновлен' : 'создан'} в Redis`);
    updateStep(scenarioSteps.length - 1, 'completed');
    
    // 5. Отправляем loginToken на Auth Server и получаем auth_url
    console.log('\n🔧 ШАГ 5: Отправляем loginToken на Auth Server');
    addStep('📤 Отправляем loginToken на Auth Server');
    setStatus('Регистрация токена на сервере авторизации...');
    
    const authResponse = await sendLoginTokenToAuthServer(loginToken, provider);
    
    if (!authResponse) {
      throw new Error('Не удалось получить ответ от Auth Server');
    }
    
    console.log('✅ Ответ от Auth Server получен:', authResponse);
    updateStep(scenarioSteps.length - 1, 'completed');
    
    // 6. Перенаправление на провайдера
    console.log('\n🔧 ШАГ 6: Перенаправление на провайдера');
    addStep('🔄 Перенаправление на провайдера');
    
    if (authResponse.auth_url) {
      console.log('🔄 Перенаправление на:', authResponse.auth_url);
      setStatus('Перенаправление на провайдера...');
      updateStep(scenarioSteps.length - 1, 'completed');
      
      // Сохраняем данные для обработки callback
      localStorage.setItem('tg_current_login_token', loginToken);
      localStorage.setItem('tg_current_user_id', userId);
      localStorage.setItem('tg_current_provider', provider);
      
      // Даем немного времени для отображения статуса перед редиректом
      setTimeout(() => {
        window.location.href = authResponse.auth_url;
      }, 1500);
      
    } else if (authResponse.code) {
      // Для code auth показываем код
      console.log('📱 Code auth, показываем код:', authResponse.code);
      updateStep(scenarioSteps.length - 1, 'completed');
      setStatus(`Код для ввода: ${authResponse.code}`);
      
      // Для code auth сразу начинаем опрос
      addStep('🔄 Начинаем опрос Auth Server для получения токенов');
      
      const tokens = await pollAuthStatus(loginToken, userId, provider);
      
      addStep('✅ Auth токены успешно получены и сохранены', 'completed');
      setStatus('Авторизация успешна! Перенаправление...');
      
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } else {
      console.log('ℹ️ Ответ от auth сервера:', authResponse);
      updateStep(scenarioSteps.length - 1, 'completed');
      setStatus('Готово! Возвращаемся на главную...');
      
      setTimeout(() => {
        navigate('/');
      }, 2000);
    }
    
    console.log('\n✅✅✅ СЦЕНАРИЙ ВЫПОЛНЕН УСПЕШНО! ✅✅✅');
    console.log('   📋 User ID:', userId);
    console.log('   🔑 Login Token:', loginToken.substring(0, 20) + '...');
    console.log('   🏷️  Провайдер:', provider);
    console.log('════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Auth error:', error);
    setStatus(`❌ Ошибка: ${error.message}`);
    addStep(`❌ Ошибка: ${error.message}`, 'error');
    
    setTimeout(() => {
      hasStartedRef.current = false;
      setLoading(false);
      setCurrentProvider('');
      setCurrentUserId(null);
      setStatus('');
      navigate('/');
    }, 3000);
  }
};

  // ОБРАБОТКА CALLBACK'А ПОСЛЕ ВОЗВРАТА С ПРОВАЙДЕРА (новая версия)
// ОБРАБОТКА CALLBACK'А ПОСЛЕ ВОЗВРАТА С ПРОВАЙДЕРА (ИСПРАВЛЕННАЯ ВЕРСИЯ)
useEffect(() => {
  const handleCallback = async () => {
    if (code && state && !loading) {
      console.log('🔄 ОБРАБОТКА CALLBACK С ПРОВАЙДЕРА (формат Telegram)');
      console.log('📌 Code из URL:', code);
      console.log('📌 State из URL:', state.substring(0, 20) + '...');
      
      const savedLoginToken = localStorage.getItem('tg_current_login_token') || state;
      const savedUserId = localStorage.getItem('tg_current_user_id');
      const savedProvider = localStorage.getItem('tg_current_provider');
      
      // Используем state как login_token для проверки на сервере
      // Это важно: сервер ищет сессию по login_token
      const loginTokenForCheck = state;
      
      setLoading(true);
      setCurrentProvider(savedProvider || 'unknown');
      setCurrentUserId(savedUserId || 'unknown');
      
      setScenarioSteps([
        { step: '🔄 СЦЕНАРИЙ: Обработка callback с провайдера', status: 'completed', timestamp: new Date().toLocaleTimeString() },
        { step: `📌 Получен callback с code: ${code.substring(0, 10)}...`, status: 'completed', timestamp: new Date().toLocaleTimeString() },
        { step: `📌 State: ${state.substring(0, 10)}...`, status: 'completed', timestamp: new Date().toLocaleTimeString() },
        { step: `🆔 User ID: ${savedUserId || 'не найден'}`, status: 'completed', timestamp: new Date().toLocaleTimeString() }
      ]);
      
      try {
        addStep('🔄 Начинаем опрос Auth Server для получения токенов');
        
        // Используем state как login_token для проверки
       const tokens = await pollAuthStatus(savedLoginToken, savedUserId || 'unknown', savedProvider || 'unknown');
        
        addStep('✅ Auth токены успешно получены и сохранены', 'completed');
        setStatus('Авторизация успешна! Перенаправление...');
        
        // Очищаем временные данные
        localStorage.removeItem('tg_current_login_token');
        localStorage.removeItem('tg_current_user_id');
        localStorage.removeItem('tg_current_provider');
        
        // Сохраняем куки
        document.cookie = `access_token=${tokens.accessToken}; path=/; max-age=86400`;
        document.cookie = `user_id=${tokens.userId}; path=/; max-age=86400`;
        document.cookie = `auth_provider=${tokens.provider}; path=/; max-age=86400`;
        
        console.log('✅ АВТОРИЗАЦИЯ ЗАВЕРШЕНА УСПЕШНО!');
        console.log('   📋 User ID:', tokens.userId);
        console.log('   🔑 Access Token:', tokens.accessToken.substring(0, 20) + '...');
        
        setTimeout(() => {
          navigate('/');
        }, 2000);
        
      } catch (error) {
        console.error('❌ Ошибка при обработке callback:', error);
        addStep(`❌ Ошибка: ${error.message}`, 'error');
        setStatus(`Ошибка: ${error.message}`);
        
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } finally {
        setLoading(false);
      }
    }
  };
  
  handleCallback();
}, [code, state, navigate]);

  // Автоматический запуск сценария
  useEffect(() => {
    const provider = type || urlType;
    if (provider && !loading && !hasStartedRef.current && !state) {
      console.log(`🔄 Автоматический запуск сценария для: ${provider} (формат Telegram)`);
      handleAuth(provider);
    }
  }, [type, urlType, state]);

  useEffect(() => {
    return () => {
      hasStartedRef.current = false;
    };
  }, []);

  const handleGitClick = () => navigate('/login?type=github');
  const handleCodeClick = () => navigate('/login?type=code');
  const handleYandexClick = () => navigate('/login?type=yandex');

  const activeType = type || urlType;

  return (
    <Body>
      <Title>Выберите способ входа</Title>
      
      {state ? (
        <>
          <ScenarioInfo>
            <h4 style={{ marginTop: 0, color: '#F39C12', fontSize: '14px' }}>
              🔄 Обработка callback с провайдера
            </h4>
            {currentUserId && (
              <div style={{ 
                backgroundColor: '#34495E', 
                padding: '5px 10px', 
                borderRadius: '5px',
                marginBottom: '10px',
                fontSize: '11px'
              }}>
                🆔 User ID: <strong>{currentUserId}</strong>
              </div>
            )}
            <StepList>
              {scenarioSteps.map((step, index) => (
                <StepItem 
                  key={index}
                  style={{
                    color: step.status === 'completed' ? '#2ECC71' : 
                          step.status === 'error' ? '#E74C3C' : 
                          step.status === 'warning' ? '#F39C12' : '#BDC3C7',
                    fontWeight: step.status === 'completed' ? 'bold' : 'normal',
                    opacity: step.status === 'completed' ? 1 : 0.9
                  }}
                >
                  {step.step} 
                  <span style={{ fontSize: '10px', marginLeft: '10px', color: '#7F8C8D' }}>
                    {step.timestamp}
                  </span>
                  {step.status === 'completed' && ' ✅'}
                  {step.status === 'error' && ' ❌'}
                  {step.status === 'warning' && ' ⚠️'}
                </StepItem>
              ))}
            </StepList>
            
            {loading && (
              <div style={{
                marginTop: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '11px',
                color: '#BDC3C7'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid #F39C12',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Ожидание токенов с Auth Server...
              </div>
            )}
          </ScenarioInfo>
          
          <Status>
            <strong>Статус:</strong> {status || `Обработка авторизации...`}
            {loading && <div style={{ fontSize: '10px', marginTop: '5px' }}>⏳ Опрашиваем Auth Server...</div>}
            {state && (
              <>
                <div style={{ fontSize: '10px', marginTop: '5px', color: '#7F8C8D' }}>
                  📌 State из URL: {state.substring(0, 20)}...
                </div>
                {currentUserId && (
                  <div style={{ fontSize: '10px', marginTop: '5px', color: '#2C3E50' }}>
                    🆔 User ID: {currentUserId}
                  </div>
                )}
              </>
            )}
          </Status>
        </>
      ) : activeType ? (
        <>
          <ScenarioInfo>
            <h4 style={{ marginTop: 0, color: '#F39C12', fontSize: '14px' }}>
              🎯 Выполняется сценарий для: {activeType.toUpperCase()}
            </h4>
            {currentUserId && (
              <div style={{ 
                backgroundColor: '#34495E', 
                padding: '5px 10px', 
                borderRadius: '5px',
                marginBottom: '10px',
                fontSize: '11px'
              }}>
                🆔 User ID: <strong>{currentUserId}</strong>
              </div>
            )}
            <StepList>
              {scenarioSteps.map((step, index) => (
                <StepItem 
                  key={index}
                  style={{
                    color: step.status === 'completed' ? '#2ECC71' : 
                          step.status === 'error' ? '#E74C3C' : '#BDC3C7',
                    fontWeight: step.status === 'completed' ? 'bold' : 'normal',
                    opacity: step.status === 'completed' ? 1 : 0.9
                  }}
                >
                  {step.step} 
                  <span style={{ fontSize: '10px', marginLeft: '10px', color: '#7F8C8D' }}>
                    {step.timestamp}
                  </span>
                  {step.status === 'completed' && ' ✅'}
                  {step.status === 'error' && ' ❌'}
                </StepItem>
              ))}
            </StepList>
            
            {loading && (
              <div style={{
                marginTop: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '11px',
                color: '#BDC3C7'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid #F39C12',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Выполняется сценарий...
              </div>
            )}
          </ScenarioInfo>
          
          <Status>
            <strong>Статус:</strong> {status || `Обработка ${activeType}`}
            {loading && <div style={{ fontSize: '10px', marginTop: '5px' }}>⏳ Выполняется...</div>}
            {currentUserId && (
              <div style={{ fontSize: '10px', marginTop: '5px', color: '#2C3E50' }}>
                🆔 User ID: {currentUserId}
              </div>
            )}
          </Status>
        </>
      ) : (
        <>
          <ButtonGrid>
            <Button 
              onClick={handleGitClick}
              disabled={loading}
              title="GitHub"
            >
              <IconImage src={gitIcon} alt="GitHub" />
            </Button>
            
            <Button 
              onClick={handleCodeClick}
              disabled={loading}
              title="Code Auth"
            >
              <IconImage src={codeIcon} alt="Code Auth" />
            </Button>
            
            <Button 
              onClick={handleYandexClick}
              disabled={loading}
              title="Yandex"
            >
              <IconImage src={yandexIcon} alt="Yandex" />
            </Button>
          </ButtonGrid>
          
          <div style={{ display: 'flex', gap: '25px', width: '100%' }}>
            <span style={{ width: '100px', textAlign: 'center' }}>GitHub</span>
            <span style={{ width: '100px', textAlign: 'center' }}>Code Auth</span>
            <span style={{ width: '100px', textAlign: 'center' }}>Яндекс</span>
          </div>
          
          <Status>
            Выберите способ авторизации
            <div style={{ fontSize: '10px', marginTop: '5px' }}>🎯 Клик → переход на /login?type=...</div>
            <div style={{ fontSize: '10px', color: '#7F8C8D' }}>📌 Данные сохраняются в формате Telegram бота</div>
            <div style={{ fontSize: '10px', color: '#7F8C8D' }}>🔑 Структура Redis: <strong>user:USER_ID → данные</strong></div>
          </Status>
        </>
      )}
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </Body>
  );
}

export default Login;