import { Routes, Route, Navigate, useLocation, useSearchParams } from 'react-router-dom'; 
import { useEffect, useState } from 'react';
import Home from './FIcon';
import Login from './login/login';
import './App.css';

const BACKEND_URL = 'http://localhost:3007';

function App() {
  const [authState, setAuthState] = useState({
    isAuthenticated: null,
    isLoading: true,
    status: 'unknown',
    sessionToken: null,
    provider: null,
    loginToken: null
  });
  
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type');

  useEffect(() => {
    checkSession();
  }, [location.pathname, searchParams.toString()]);

  const checkSession = async () => {
    try {
      console.log('════════════════════════════════════════');
      console.log('🏁 НАЧАЛО СЦЕНАРИЯ: Web Client проверяет сессию');
      console.log(`⏰ ${new Date().toLocaleTimeString()}`);
      console.log(`📍 Путь: ${location.pathname}`);
      console.log(`📋 Параметры:`, Object.fromEntries(searchParams));
      console.log('════════════════════════════════════════');
      
      // ВАЖНОЕ ИЗМЕНЕНИЕ: Если это /login с параметром type - СНАЧАЛА проверяем сессию
      if (location.pathname === '/login' && typeParam) {
        console.log('🎯 ОСОБЫЙ СЦЕНАРИЙ: /login с параметром type');
        console.log('🔧 Провайдер:', typeParam);
        
        // СНАЧАЛА проверяем сессию в Redis
        const response = await fetch(`${BACKEND_URL}/api/session/check`, {
          method: 'GET',
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.authenticated) {
          console.log('✅ У пользователя УЖЕ ЕСТЬ активная сессия в Redis');
          console.log('📋 Статус пользователя:', data.status);
          console.log('🔑 Токен входа:', data.loginToken ? data.loginToken.substring(0, 20) + '...' : 'нет');
          
          // Устанавливаем состояние на основе ответа Redis
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            status: data.status || 'anonymous',
            sessionToken: data.sessionToken || null,
            provider: data.provider || typeParam,
            loginToken: data.loginToken || null
          });
          
          return; // Не продолжаем обычную проверку
        } else {
          console.log('⚠️ Активной сессии не найдено');
          console.log('🔚 Продолжаем обычную проверку сессии...');
        }
      }
      
      // Обычная проверка сессии (выполняется если нет сессии или не /login?type)
      console.log('\n📡 ШАГ 1: Web Client делает запрос к компоненту Redis');
      console.log(`🔗 URL: ${BACKEND_URL}/api/session/check`);
      console.log(`🍪 Используя токен сессии из кук в качестве ключа`);
      console.log(`🔐 Credentials: include (куки отправятся автоматически)`);
      
      const response = await fetch(`${BACKEND_URL}/api/session/check`, {
        method: 'GET',
        credentials: 'include'
      });
      
      console.log('\n⏳ Ожидание ответа от Redis...');
      
      const data = await response.json();
      
      console.log('════════════════════════════════════════');
      console.log('📨 ОТВЕТ ОТ REDIS ПОЛУЧЕН:');
      console.log(`   ✅ Аутентифицирован: ${data.authenticated}`);
      console.log(`   📋 Статус пользователя: ${data.status}`);
      
      if (data.authenticated) {
        console.log('🎯🎯🎯 ВАЖНО: ПОЛЬЗОВАТЕЛЬ С ТОКЕНОМ ЕСТЬ! 🎯🎯🎯');
        console.log('📊 Redis сообщил: такой ключ ЕСТЬ в базе');
        console.log('📨 Redis прислал данные соответствующие ключу');
        
        // Выводим подробности статуса пользователя
        console.log('\n🔍 СТАТУС ПОЛЬЗОВАТЕЛЯ ИЗ REDIS:');
        console.log(`   Статус: ${data.status}`);
        console.log(`   Провайдер: ${data.provider || 'не указан'}`);
        console.log(`   Токен входа: ${data.loginToken ? data.loginToken.substring(0, 20) + '...' : 'отсутствует'}`);
        console.log(`   Создано: ${data.createdAt || 'неизвестно'}`);
        
        if (data.status === 'anonymous') {
          console.log('\n✅✅✅ СЦЕНАРИЙ ВЫПОЛНЕН УСПЕШНО! ✅✅✅');
          console.log('✅ Web Client достаёт из ответа статус пользователя');
          console.log(`✅ Статус равен: "${data.status}" (Анонимный)`);
        }
        
      } else {
        console.log('❌ Пользователь с таким токеном НЕ найден');
        console.log('🔚 Продолжение по сценарию Неизвестного пользователя');
      }
      
      console.log('════════════════════════════════════════\n');
      
      setAuthState({
        isAuthenticated: data.authenticated,
        isLoading: false,
        status: data.status || 'anonymous',
        sessionToken: data.sessionToken,
        provider: data.provider || null,
        loginToken: data.loginToken || null
      });
      
    } catch (error) {
      console.error('❌ Ошибка проверки сессии:', error);
      console.log('🔚 Продолжение по сценарию Неизвестного пользователя');
      console.log('════════════════════════════════════════\n');
      
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        status: 'anonymous',
        sessionToken: null,
        provider: null,
        loginToken: null
      });
    }
  };

  // Обработка URL согласно сценарию
  const renderRoute = () => {
    const currentPath = location.pathname;
    
    // Сценарий: Если URL /login без параметров
    if (currentPath === '/login' && !typeParam) {
      console.log('✅ Сценарий: /login без параметров → показываем выбор провайдера');
      return <Login />;
    }
    
    // Сценарий: Если URL /login с параметром type
    if (currentPath === '/login' && typeParam) {
      console.log('✅ Сценарий: /login с параметром type → показываем Login с типом');
      console.log(`🔧 Провайдер: ${typeParam}`);
      console.log(`🔍 Состояние аутентификации: ${authState.isAuthenticated === null ? 'загрузка' : authState.isAuthenticated ? 'аутентифицирован' : 'не аутентифицирован'}`);
      
      // Проверяем состояние аутентификации
      if (authState.isAuthenticated === true) {
        console.log('🎯 У пользователя УЖЕ ЕСТЬ активная сессия');
        console.log('📌 Статус пользователя:', authState.status);
        console.log('🔐 Провайдер из сессии:', authState.provider);
        console.log('🎯 Передаем hasExistingSession: true');
        console.log('📌 Токен сессии:', authState.sessionToken ? authState.sessionToken.substring(0, 20) + '...' : 'неизвестен');
        
        return <Login type={typeParam} hasExistingSession={true} authState={authState} />;
      } else if (authState.isAuthenticated === false) {
        console.log('🆕 У пользователя НЕТ активной сессии');
        console.log('🎯 Передаем hasExistingSession: false');
        return <Login type={typeParam} hasExistingSession={false} />;
      } else {
        console.log('⏳ Состояние сессии еще не определено...');
        // Пока загружаем
      }
    }
    
    // Сценарий: Если URL / (главная)
    if (currentPath === '/') {
      console.log('🔍 Сценарий: / → проверяем авторизацию');
      
      // Если пользователь не авторизован → редирект на /login
      if (authState.isAuthenticated === false) {
        console.log('⚠️ Пользователь не авторизован → редирект на /login');
        return <Navigate to="/login" replace />;
      }
      
      // Если пользователь авторизован → показываем Home
      if (authState.isAuthenticated === true) {
        console.log('✅ Пользователь авторизован → показываем Home');
        console.log(`📊 Статус пользователя: ${authState.status}`);
        return <Home authState={authState} />;
      }
      
      // Если статус еще не известен (загрузка)
      console.log('⏳ Статус авторизации еще не известен');
    }
    
    // Любой другой URL → редирект на /
    console.log('🔄 Любой другой URL → редирект на /');
    return <Navigate to="/" replace />;
  };

  // Если еще загружается
  if (authState.isLoading && location.pathname !== '/login') {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#2C3E50',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        🔍 Проверка сессии...
        <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
          Проверяем наличие сессии в Redis
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={renderRoute()} />
      <Route path="/login" element={renderRoute()} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;