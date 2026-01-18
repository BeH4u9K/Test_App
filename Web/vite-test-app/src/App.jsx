import { Routes, Route, Navigate, useLocation, useSearchParams } from 'react-router-dom'; 
import { useEffect, useState } from 'react';
import Home from './FIcon';
import Login from './login/login';
import PersonalAccount from '../src/Icon/personalaccount';
import './App.css';

const BACKEND_URL = 'http://localhost:3007';

function App() {
  const [authState, setAuthState] = useState({
    isAuthenticated: null,
    isLoading: true,
    status: 'unknown',
    sessionToken: null,
    provider: null,
    loginToken: null,
    userId: null
  });
  
  const location = useLocation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    checkSession();
  }, [location.pathname, searchParams.toString()]);

  const handleAuthResponse = async (sessionToken, accessToken, refreshToken, userId, provider, loginToken) => {
    try {
      if (!accessToken || !refreshToken) {
        throw new Error('Отсутствуют необходимые JWT токены');
      }
      
      const response = await fetch(`${BACKEND_URL}/api/user/save-auth-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify({
          sessionToken: sessionToken,
          accessToken: accessToken,
          refreshToken: refreshToken,
          provider: provider,
          loginToken: loginToken
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ошибка сохранения токенов: ${errorText}`);
      }
      
      const result = await response.json();
      
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: true,
        status: 'authorized',
        isLoading: false,
        sessionToken: sessionToken,
        provider: provider,
        loginToken: loginToken,
        userId: userId
      }));
      
      return { success: true, userId: result.userId };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

const checkSession = async () => {
  try {
    if (location.pathname === '/logout') {
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: false,
        status: 'anonymous',
        isLoading: false
      }));
      return;
    }
    
    const urlAccessToken = searchParams.get('access_token');
    const urlRefreshToken = searchParams.get('refresh_token');
    const urlUserId = searchParams.get('user_id');
    const urlProvider = searchParams.get('provider');
    const urlLoginToken = searchParams.get('login_token');
    
    if (urlAccessToken && urlRefreshToken && urlUserId) {
      
      const authCheckResponse = await fetch(`${BACKEND_URL}/api/auth/check/${urlUserId}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (authCheckResponse.ok) {
        const authData = await authCheckResponse.json();
        
        if (authData.authenticated) {
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            status: authData.status,
            sessionToken: null,
            provider: authData.provider,
            loginToken: authData.loginToken,
            userId: authData.userId,
            accessToken: authData.accessToken,
            refreshToken: authData.refreshToken
          });
          return;
        }
      }
      
      const sessionResponse = await fetch(`${BACKEND_URL}/api/session/check`, {
        method: 'GET',
        credentials: 'include'
      });
      
      const sessionData = await sessionResponse.json();
      const sessionToken = sessionData.sessionToken;
      
      if (sessionToken) {
        const authResult = await handleAuthResponse(
          sessionToken,
          urlAccessToken,
          urlRefreshToken,
          urlUserId,
          urlProvider,
          urlLoginToken || sessionData.loginToken
        );
        
        if (authResult.success) {
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
          return;
        }
      }
    }
    
    const storedUserId = localStorage.getItem('tg_user_id');
    if (storedUserId) {
      
      const authCheckResponse = await fetch(`${BACKEND_URL}/api/auth/check/${storedUserId}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (authCheckResponse.ok) {
        const authData = await authCheckResponse.json();
        
        if (authData.authenticated) {
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            status: authData.status,
            sessionToken: null,
            provider: authData.provider,
            loginToken: authData.loginToken,
            userId: authData.userId,
            accessToken: authData.accessToken,
            refreshToken: authData.refreshToken
          });
          return;
        }
      }
    }
    
    const response = await fetch(`${BACKEND_URL}/api/session/check`, {
      method: 'GET',
      credentials: 'include'
    });
    
    const data = await response.json();
    
    const isUserAuthenticated = data.authenticated === true || 
                               data.status === 'authenticated' || 
                               data.status === 'authorized';
    
    setAuthState({
      isAuthenticated: isUserAuthenticated,
      isLoading: false,
      status: data.status || 'anonymous',
      sessionToken: data.sessionToken,
      provider: data.provider || null,
      loginToken: data.loginToken || null,
      userId: data.userId || null,
      accessToken: data.accessToken || null,
      refreshToken: data.refreshToken || null
    });
    
  } catch (error) {
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      status: 'anonymous',
      sessionToken: null,
      provider: null,
      loginToken: null,
      userId: null,
      accessToken: null,
      refreshToken: null
    });
  }
};

  const createSession = async (sessionToken, loginToken) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/session/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify({
          sessionToken: sessionToken,
          loginToken: loginToken
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  };

  const isUserAuthenticated = () => {
    return authState.isAuthenticated === true || 
           authState.status === 'authenticated' || 
           authState.status === 'authorized';
  };

  const renderRoute = () => {
    const currentPath = location.pathname;
    
    if (currentPath === '/logout') {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '20px',
          backgroundColor: '#A3ADB1'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #e74c3c',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <div style={{ fontSize: '18px', color: '#2C3E50' }}>
            🚪 Выход из системы...
          </div>
        </div>
      );
    }
    
    if (currentPath === '/personalaccount') {
      if (isUserAuthenticated()) {
        return <PersonalAccount authState={authState} />;
      } 
      else {
        return <Navigate to="/login" replace />;
      }
    }
    
    if (currentPath === '/') {
      if (isUserAuthenticated()) {
        return <Navigate to="/personalaccount" replace />;
      }
      else if (authState.status === 'anonymous' || authState.isAuthenticated === false) {
        return <Navigate to="/login" replace />;
      }
      else if (authState.isLoading) {
        return <Home authState={authState} createSession={createSession} />;
      }
      else {
        return <Navigate to="/login" replace />;
      }
    }
    
    if (currentPath === '/login') {
      const urlAccessToken = searchParams.get('access_token');
      const urlRefreshToken = searchParams.get('refresh_token');
      
      if (urlAccessToken && urlRefreshToken) {
        return <Navigate to="/" replace />;
      }
      
      if (isUserAuthenticated()) {
        return <Navigate to="/personalaccount" replace />;
      }
      
      return <Login createSession={createSession} />;
    }
    
    return <Navigate to="/" replace />;
  };

  if (authState.isLoading && 
      location.pathname !== '/login' && 
      location.pathname !== '/logout' &&
      location.pathname !== '/personalaccount') {
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
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={renderRoute()} />
        <Route path="/login" element={renderRoute()} />
        <Route path="/logout" element={renderRoute()} />
        <Route path="/personalaccount" element={renderRoute()} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

export default App;