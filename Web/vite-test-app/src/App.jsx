// import { Routes, Route, Navigate, useLocation, useSearchParams } from 'react-router-dom'; 
// import { useEffect, useState } from 'react';
// import Home from './FIcon';
// import Login from './login/login';
// import PersonalAccount from '../src/Icon/personalaccount';
// import './App.css';

// const BACKEND_URL = 'http://localhost:3007';
// const AUTH_SERVER_URL = 'http://localhost:8080';

// function App() {
//   const [authState, setAuthState] = useState({
//     isAuthenticated: null,
//     isLoading: true,
//     status: 'unknown',
//     sessionToken: null,
//     provider: null,
//     loginToken: null,
//     userId: null
//   });
  
//   const location = useLocation();
//   const [searchParams] = useSearchParams();

//   useEffect(() => {
//     checkSession();
//   }, [location.pathname, searchParams.toString()]);

//   // 📌 СЦЕНАРИЙ: Обработка ответа от модуля Авторизации
//   const handleAuthResponse = async (sessionToken, accessToken, refreshToken, userId, provider, loginToken) => {
//     try {
//       console.log('════════════════════════════════════════');
//       console.log('🎯 СЦЕНАРИЙ: Обработка ответа от модуля Авторизации');
//       console.log(`⏰ ${new Date().toLocaleTimeString()}`);
//       console.log('📋 ШАГИ СЦЕНАРИЯ:');
//       console.log('   1. Проверить наличие 2 JWT токенов');
//       console.log('   2. Сохранить в Redis новый статус и токены');
//       console.log('   3. Изменить статус пользователя на "authorized"');
//       console.log('════════════════════════════════════════');
      
//       // ШАГ 1: Проверяем наличие токенов
//       console.log('✅ ШАГ 1: Проверяем наличие токенов...');
//       console.log('   🔑 Access Token:', accessToken ? '✓ Присутствует' : '✗ Отсутствует');
//       console.log('   🔑 Refresh Token:', refreshToken ? '✓ Присутствует' : '✗ Отсутствует');
//       console.log('   🔑 Session Token:', sessionToken ? '✓ Присутствует' : '✗ Отсутствует');
      
//       if (!accessToken || !refreshToken) {
//         throw new Error('Отсутствуют необходимые JWT токены');
//       }
      
//       console.log('✅ ШАГ 1 ВЫПОЛНЕН: Оба токена присутствуют');
      
//       // ШАГ 2: Сохраняем auth токены в Redis
//       console.log('\n✅ ШАГ 2: Сохраняем auth токены в Redis...');
//       console.log('   📤 Отправка на сервер: /api/user/save-auth-tokens');
      
//       const response = await fetch(`${BACKEND_URL}/api/user/save-auth-tokens`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Accept': 'application/json'
//         },
//         credentials: 'include',
//         mode: 'cors',
//         body: JSON.stringify({
//           sessionToken: sessionToken,
//           accessToken: accessToken,
//           refreshToken: refreshToken,
//           provider: provider,
//           loginToken: loginToken
//         })
//       });
      
//       if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(`Ошибка сохранения токенов: ${errorText}`);
//       }
      
//       const result = await response.json();
//       console.log('✅ ШАГ 2 ВЫПОЛНЕН:');
//       console.log('   📊 Ответ сервера:', result.message);
//       console.log('   👤 User ID:', result.userId);
//       console.log('   🏷️  Новый статус:', result.status);
      
//       // ШАГ 3: Обновляем локальное состояние
//       console.log('\n✅ ШАГ 3: Обновляем состояние в React...');
      
//       setAuthState(prev => ({
//         ...prev,
//         isAuthenticated: true,
//         status: 'authorized',
//         isLoading: false,
//         sessionToken: sessionToken,
//         provider: provider,
//         loginToken: loginToken,
//         userId: userId
//       }));
      
//       console.log('🎉 СЦЕНАРИЙ ЗАВЕРШЕН УСПЕШНО!');
//       console.log('🚀 Пользователь теперь в статусе "Авторизованный"');
//       console.log('════════════════════════════════════════\n');
      
//       return { success: true, userId: result.userId };
      
//     } catch (error) {
//       console.error('❌ Ошибка в сценарии обработки auth ответа:', error);
//       console.log('════════════════════════════════════════\n');
//       return { success: false, error: error.message };
//     }
//   };

//   const checkSession = async () => {
//     try {
//       console.log('════════════════════════════════════════');
//       console.log('🏁 НАЧАЛО СЦЕНАРИЯ: Web Client проверяет сессию');
//       console.log(`⏰ ${new Date().toLocaleTimeString()}`);
//       console.log(`📍 Путь: ${location.pathname}`);
//       console.log(`📋 Параметры:`, Object.fromEntries(searchParams));
//       console.log('════════════════════════════════════════');
      
//       // Если это /logout - не проверяем сессию
//       if (location.pathname === '/logout') {
//         console.log('🚪 Обнаружен путь /logout - пропускаем проверку сессии');
//         setAuthState(prev => ({
//           ...prev,
//           isAuthenticated: false,
//           status: 'anonymous',
//           isLoading: false
//         }));
//         return;
//       }
      
//       // 📌 ПРОВЕРКА: Есть ли в URL токены от модуля авторизации?
//       const urlAccessToken = searchParams.get('access_token');
//       const urlRefreshToken = searchParams.get('refresh_token');
//       const urlUserId = searchParams.get('user_id');
//       const urlProvider = searchParams.get('provider');
//       const urlLoginToken = searchParams.get('login_token');
      
//       if (urlAccessToken && urlRefreshToken) {
//         console.log('🎯 ОБНАРУЖЕН ОТВЕТ ОТ МОДУЛЯ АВТОРИЗАЦИИ В URL!');
//         console.log('   🔑 Access Token:', urlAccessToken.substring(0, 20) + '...');
//         console.log('   🔑 Refresh Token:', urlRefreshToken.substring(0, 20) + '...');
//         console.log('   👤 User ID:', urlUserId || 'не указан');
//         console.log('   🏷️  Провайдер:', urlProvider || 'не указан');
        
//         // Получаем session token из куки
//         const sessionResponse = await fetch(`${BACKEND_URL}/api/session/check`, {
//           method: 'GET',
//           credentials: 'include'
//         });
        
//         const sessionData = await sessionResponse.json();
//         const sessionToken = sessionData.sessionToken;
        
//         if (sessionToken) {
//           console.log('   🔑 Session Token из куки:', sessionToken.substring(0, 20) + '...');
          
//           // Выполняем сценарий обработки ответа от модуля авторизации
//           const authResult = await handleAuthResponse(
//             sessionToken,
//             urlAccessToken,
//             urlRefreshToken,
//             urlUserId,
//             urlProvider,
//             urlLoginToken || sessionData.loginToken
//           );
          
//           if (authResult.success) {
//             // Убираем токены из URL чтобы они не остались в истории браузера
//             const cleanUrl = window.location.pathname;
//             window.history.replaceState({}, document.title, cleanUrl);
            
//             // НЕ устанавливаем куки тут - сервер должен это делать
//             console.log('🧹 URL очищен от токенов');
//             return;
//           }
//         } else {
//           console.log('⚠️ Не найден session token в куках');
//         }
//       }
      
//       console.log('\n📡 ШАГ 1: Web Client делает запрос к Redis');
      
//       const response = await fetch(`${BACKEND_URL}/api/session/check`, {
//         method: 'GET',
//         credentials: 'include'
//       });
      
//       console.log('\n⏳ Ожидание ответа от Redis...');
      
//       const data = await response.json();
      
//       console.log('════════════════════════════════════════');
//       console.log('📨 ОТВЕТ ОТ REDIS ПОЛУЧЕН:');
//       console.log(`   ✅ Аутентифицирован: ${data.authenticated}`);
//       console.log(`   📋 Статус пользователя: ${data.status}`);
      
//       if (data.authenticated && data.status === 'authorized') {
//         console.log('🎯🎯🎯 ВАЖНО: ПОЛЬЗОВАТЕЛЬ АВТОРИЗОВАН! 🎯🎯🎯');
//         console.log('   🔑 Access Token:', data.access_token ? 'Есть' : 'Нет');
//         console.log('   🔄 Refresh Token:', data.refresh_token ? 'Есть' : 'Нет');
//       } else if (data.authenticated && data.status === 'anonymous') {
//         console.log('👤 Пользователь в статусе anonymous');
//       }
      
//       console.log('════════════════════════════════════════\n');
      
//       setAuthState({
//         isAuthenticated: data.authenticated,
//         isLoading: false,
//         status: data.status || 'anonymous',
//         sessionToken: data.sessionToken,
//         provider: data.provider || null,
//         loginToken: data.loginToken || null,
//         userId: data.userId || null
//       });
      
//     } catch (error) {
//       console.error('❌ Ошибка проверки сессии:', error);
//       console.log('🔚 Продолжение по сценарию Неизвестного пользователя');
//       console.log('════════════════════════════════════════\n');
      
//       setAuthState({
//         isAuthenticated: false,
//         isLoading: false,
//         status: 'anonymous',
//         sessionToken: null,
//         provider: null,
//         loginToken: null,
//         userId: null
//       });
//     }
//   };

//   // 📌 Функция для создания сессии
//   const createSession = async (sessionToken, loginToken) => {
//     try {
//       console.log('🆕 Создание сессии...');
      
//       const response = await fetch(`${BACKEND_URL}/api/session/create`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Accept': 'application/json'
//         },
//         credentials: 'include',
//         mode: 'cors',
//         body: JSON.stringify({
//           sessionToken: sessionToken,
//           loginToken: loginToken
//         })
//       });
      
//       const result = await response.json();
      
//       if (result.success) {
//         console.log('✅ Сессия создана:', result.message);
//         return true;
//       } else {
//         console.error('❌ Ошибка создания сессии:', result.error);
//         return false;
//       }
//     } catch (error) {
//       console.error('❌ Ошибка сети при создании сессии:', error);
//       return false;
//     }
//   };

//   const renderRoute = () => {
//     const currentPath = location.pathname;
    
//     // Сценарий: Если URL /logout
//     if (currentPath === '/logout') {
//       console.log('🚪 Сценарий: /logout → перенаправление на серверный эндпоинт');
//       return (
//         <div style={{
//           display: 'flex',
//           justifyContent: 'center',
//           alignItems: 'center',
//           height: '100vh',
//           flexDirection: 'column',
//           gap: '20px',
//           backgroundColor: '#A3ADB1'
//         }}>
//           <div style={{
//             width: '50px',
//             height: '50px',
//             border: '3px solid #f3f3f3',
//             borderTop: '3px solid #e74c3c',
//             borderRadius: '50%',
//             animation: 'spin 1s linear infinite'
//           }}></div>
//           <div style={{ fontSize: '18px', color: '#2C3E50' }}>
//             🚪 Выход из системы...
//           </div>
//           <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
//             Удаление сессии из Redis...
//           </div>
//         </div>
//       );
//     }
    
//     // Сценарий: Если URL /personalaccount
//     if (currentPath === '/personalaccount') {
//       console.log('📋 Сценарий: /personalaccount → Личный кабинет');
      
//       if (authState.isAuthenticated === true && authState.status === 'authorized') {
//         console.log('✅ Пользователь авторизован → показываем личный кабинет');
//         console.log(`📊 Статус пользователя: ${authState.status}`);
//         return <PersonalAccount authState={authState} />;
//       } else if (authState.isAuthenticated === false || authState.status !== 'authorized') {
//         console.log('❌ Пользователь не авторизован → редирект на /');
//         return <Navigate to="/" replace />;
//       }
//     }
    
//     // Сценарий: Главная страница
//     if (currentPath === '/') {
//       console.log('🔍 Сценарий: / → проверяем авторизацию');
      
//       if (authState.isAuthenticated === false) {
//         console.log('⚠️ Пользователь не авторизован → редирект на /login');
//         return <Navigate to="/login" replace />;
//       }
      
//       if (authState.isAuthenticated === true) {
//         console.log('✅ Пользователь авторизован → показываем Home');
//         return <Home authState={authState} createSession={createSession} />;
//       }
//     }
    
//     // Сценарий: Страница логина
//     if (currentPath === '/login') {
//       console.log('🔑 Сценарий: /login → Страница авторизации');
      
//       // Проверяем, есть ли токены авторизации в URL
//       const urlAccessToken = searchParams.get('access_token');
//       const urlRefreshToken = searchParams.get('refresh_token');
      
//       if (urlAccessToken && urlRefreshToken) {
//         console.log('📨 На странице логина обнаружены токены авторизации');
//         console.log('   🔄 Перенаправление на главную для обработки...');
//         return <Navigate to="/" replace />;
//       }
      
//       return <Login createSession={createSession} />;
//     }
    
//     // Любой другой URL → редирект на /
//     console.log('🔄 Любой другой URL → редирект на /');
//     return <Navigate to="/" replace />;
//   };

//   // Если еще загружается и не на страницах логина/выхода
//   if (authState.isLoading && 
//       location.pathname !== '/login' && 
//       location.pathname !== '/logout' &&
//       location.pathname !== '/personalaccount') {
//     return (
//       <div style={{
//         display: 'flex',
//         justifyContent: 'center',
//         alignItems: 'center',
//         height: '100vh',
//         fontSize: '18px',
//         color: '#2C3E50',
//         flexDirection: 'column',
//         gap: '20px'
//       }}>
//         <div style={{
//           width: '50px',
//           height: '50px',
//           border: '3px solid #f3f3f3',
//           borderTop: '3px solid #3498db',
//           borderRadius: '50%',
//           animation: 'spin 1s linear infinite'
//         }}></div>
//         🔍 Проверка сессии...
//         <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
//           Проверяем наличие сессии в Redis
//         </div>
//       </div>
//     );
//   }

//   return (
//     <>
//       {/* Кнопки для авторизованных пользователей */}
//       {authState.isAuthenticated && authState.status === 'authorized' && location.pathname === '/' && (
//         <div style={{
//           position: 'fixed',
//           top: '20px',
//           right: '20px',
//           display: 'flex',
//           gap: '15px',
//           zIndex: 1000,
//         }}>
//           <button 
//             onClick={() => window.location.href = '/personalaccount'}
//             style={{
//               backgroundColor: '#2ECC71',
//               color: 'white',
//               border: 'none',
//               padding: '10px 20px',
//               borderRadius: '5px',
//               cursor: 'pointer',
//               fontWeight: 'bold',
//               boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
//               fontSize: '14px',
//               display: 'flex',
//               alignItems: 'center',
//               gap: '8px',
//             }}
//           >
//             👤 Личный кабинет
//           </button>
          
//           <button 
//             onClick={() => {
//               console.log('🎯 Инициирован выход из системы');
//               window.location.href = '/logout';
//             }}
//             style={{
//               backgroundColor: '#e74c3c',
//               color: 'white',
//               border: 'none',
//               padding: '10px 20px',
//               borderRadius: '5px',
//               cursor: 'pointer',
//               fontWeight: 'bold',
//               boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
//               fontSize: '14px',
//               display: 'flex',
//               alignItems: 'center',
//               gap: '8px',
//             }}
//           >
//             🚪 Выйти
//           </button>
//         </div>
//       )}
      
//       <Routes>
//         <Route path="/" element={renderRoute()} />
//         <Route path="/login" element={renderRoute()} />
//         <Route path="/logout" element={renderRoute()} />
//         <Route path="/personalaccount" element={renderRoute()} />
//         <Route path="*" element={<Navigate to="/" replace />} />
//       </Routes>
      
//       <style>{`
//         @keyframes spin {
//           0% { transform: rotate(0deg); }
//           100% { transform: rotate(360deg); }
//         }
//       `}</style>
//     </>
//   );
// }

// export default App;


import { Routes, Route, Navigate } from 'react-router-dom';
import PersonalAccount from './Icon/personalaccount';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/personalaccount" element={<PersonalAccount />} />
      <Route path="/" element={<Navigate to="/personalaccount" replace />} />
      <Route path="*" element={<Navigate to="/personalaccount" replace />} />
    </Routes>
  );
}

export default App;