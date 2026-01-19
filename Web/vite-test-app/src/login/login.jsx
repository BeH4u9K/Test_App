import React, { useState, useEffect, useRef } from 'react';
import { styled } from '@mui/system';
import { useNavigate, useSearchParams } from 'react-router-dom';
import gitIcon from '../IMG/git.png';
import codeIcon from '../IMG/code.png';
import yandexIcon from '../IMG/yandex.png';

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
  color:'black'
});

const BACKEND_URL = 'http://localhost:3007';
const AUTH_SERVER_URL = 'http://localhost:8080';

const generateToken = () => {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const generateUserId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return `${timestamp}${random}`;
};

const sendLoginTokenToAuthServer = async (loginToken, provider, userId) => {
  try {
    const authUrl = `${AUTH_SERVER_URL}/auth?provider=${encodeURIComponent(provider)}&login_token=${encodeURIComponent(loginToken)}&user_ID=${encodeURIComponent(userId)}`;
    
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
      
      if (data.auth_url) {
        return {
          success: true,
          auth_url: data.auth_url,
          oauth_state: data.oauth_state || '',
          data: data
        };
      } else if (data.code) {
        return {
          success: true,
          auth_code: data.code,
          expires_in: data.expires_in || 60,
          data: data
        };
      } else {
        return {
          success: false,
          error: 'В ответе отсутствует auth_url или code'
        };
      }
    } else {
      const errorText = await response.text();
      return {
        success: false,
        error: `Ошибка сервера: ${response.status} - ${errorText}`
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Ошибка сети: ${error.message}`
    };
  }
};

// navigate("/personalaccount", { state: { userId } });


const pollAuthStatus = async (loginToken, userId) => {
  try {
    const checkUrl = `${AUTH_SERVER_URL}/check?login_token=${encodeURIComponent(loginToken)}&user_id=${encodeURIComponent(userId)}`;
    
    const response = await fetch(checkUrl, {
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
      
      if (data.status === 'granted') {
        return {
          accessToken: data.access_token,
          refreshToken: data.refresh_token || '',
          userId: data.user_id || userId,
          provider: data.provider || 'unknown',
          status: 'granted'
        };
      }
      
      return {
        status: data.status,
        provider: data.provider,
        message: data.message || ''
      };
    } else {
      const errorText = await response.text();
      return {
        status: 'error',
        error: `Ошибка запроса: ${response.status}`
      };
    }
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
};

const createOrUpdateUserInRedis = async (userId, loginToken, provider, isUpdate = false) => {
  try {
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
      return {
        success: true,
        userId: userId,
        data: result
      };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        error: errorText
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

const saveAuthTokensToRedis = async (userId, accessToken, refreshToken, provider) => {
  try {
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
      return {
        success: true,
        data: result
      };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        error: errorText
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

const getUserDataFromRedis = async (userId) => {
  try {
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
      return {
        success: true,
        found: result.found,
        data: result.data || {}
      };
    } else {
      return {
        success: false,
        found: false,
        error: 'Ошибка запроса'
      };
    }
  } catch (error) {
    return {
      success: false,
      found: false,
      error: error.message
    };
  }
};

const openAuthUrl = (authUrl) => {
  const authWindow = window.open(
    authUrl, 
    'authWindow',
    'width=600,height=700,scrollbars=yes,resizable=yes'
  );
  
  if (!authWindow) {
    localStorage.setItem('pending_auth_url', authUrl);
    
    const userConfirmed = window.confirm(
      'Не удалось открыть окно авторизации автоматически. ' +
      '1. Нажмите ОК для открытия в этом окне\n' +
      '2. Нажмите Отмена для копирования ссылки'
    );
    
    if (userConfirmed) {
      window.location.href = authUrl;
      return null;
    } else {
      navigator.clipboard.writeText(authUrl).then(() => {
        alert('Ссылка скопирована в буфер обмена! Вставьте её в адресную строку браузера.');
      }).catch(() => {
        prompt('Скопируйте эту ссылку вручную:', authUrl);
      });
      return null;
    }
  }
  
  return authWindow;
};

const getOrGenerateUserId = () => {
  const storedUserId = localStorage.getItem('tg_user_id');
  
  if (storedUserId) {
    return storedUserId;
  }
  
  const newUserId = generateUserId();
  localStorage.setItem('tg_user_id', newUserId);
  
  return newUserId;
};

function Login({ type, hasExistingSession = false, authState = null }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [currentProvider, setCurrentProvider] = useState(type || '');
  
  const hasStartedRef = useRef(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlType = searchParams.get('type');
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  useEffect(() => {
    const handleCallback = async () => {
      if (code && state && !loading) {
        setLoading(true);
        setStatus('Обработка данных авторизации...');
        
        try {
          const loginTokenForCheck = state;
          const storedUserId = localStorage.getItem('tg_user_id');
          
          if (loginTokenForCheck) {
            setStatus('Проверяем статус авторизации...');
            
            let attempts = 0;
            const maxAttempts = 30;
            
            const pollInterval = setInterval(async () => {
              attempts++;
              
              const tokens = await pollAuthStatus(loginTokenForCheck, storedUserId);
              
              if (tokens.status === 'granted') {
                clearInterval(pollInterval);
                
                const saveResult = await saveAuthTokensToRedis(
                  tokens.userId,
                  tokens.accessToken,
                  tokens.refreshToken,
                  tokens.provider
                );
                
                if (saveResult.success) {
                  setStatus(' Авторизация успешна! Перенаправление...');
                  
                  setTimeout(() => {
                    const redirectUrl = `/?access_token=${encodeURIComponent(tokens.accessToken)}&refresh_token=${encodeURIComponent(tokens.refreshToken)}&user_id=${encodeURIComponent(tokens.userId)}&provider=${encodeURIComponent(tokens.provider)}&login_token=${encodeURIComponent(loginTokenForCheck)}`;
                    navigate(redirectUrl);
                  }, 1000);
                } else {
                  setStatus(' Ошибка сохранения токенов');
                  setLoading(false);
                }
                
              } else if (tokens.status === 'pending') {
                setStatus(`Ожидание авторизации... (${attempts}/${maxAttempts})`);
                
                if (attempts >= maxAttempts) {
                  clearInterval(pollInterval);
                  setStatus(' Время ожидания истекло');
                  setLoading(false);
                }
              } else if (tokens.status === 'denied' || tokens.status === 'expired') {
                clearInterval(pollInterval);
                setStatus(` Авторизация отклонена: ${tokens.status}`);
                setLoading(false);
              } else if (tokens.status === 'error') {
                clearInterval(pollInterval);
                setStatus(` Ошибка: ${tokens.error}`);
                setLoading(false);
              }
            }, 2000);
          }
          
        } catch (error) {
          setStatus(` Ошибка: ${error.message}`);
          setLoading(false);
        }
      }
    };
    
    handleCallback();
  }, [code, state, navigate]);

  useEffect(() => {
    const provider = type || urlType;
    if (provider && !loading && !hasStartedRef.current && !state) {
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

  const handleAuth = async (provider) => {
    if (hasStartedRef.current || loading) {
      return;
    }
    
    hasStartedRef.current = true;
    setLoading(true);
    setCurrentProvider(provider);
    
    try {
      const userId = getOrGenerateUserId();
      
      const generatedLoginToken = generateToken();
      
      const userCheck = await getUserDataFromRedis(userId);
      
      let isUpdate = false;
      if (userCheck.success && userCheck.found) {
        isUpdate = true;
      }
      
      setStatus(isUpdate ? 'Обновление пользователя...' : 'Создание пользователя...');
      
      const userResult = await createOrUpdateUserInRedis(userId, generatedLoginToken, provider, isUpdate);
      
      if (!userResult.success) {
        throw new Error(`Ошибка при ${isUpdate ? 'обновлении' : 'создании'} пользователя: ${userResult.error}`);
      }
      
      setStatus('Получение URL авторизации...');
      
      const authResponse = await sendLoginTokenToAuthServer(generatedLoginToken, provider, userId);
      
      if (!authResponse.success) {
        throw new Error(`Не удалось получить URL авторизации: ${authResponse.error}`);
      }
      
      if (authResponse.auth_url) {
        setStatus(`Получен URL для ${provider}. Открываем окно авторизации...`);
        
        localStorage.setItem('tg_current_login_token', generatedLoginToken);
        localStorage.setItem('tg_current_user_id', userId);
        localStorage.setItem('tg_current_provider', provider);
        localStorage.setItem('tg_oauth_state', authResponse.oauth_state || '');
        
        setTimeout(() => {
          const authWindow = openAuthUrl(authResponse.auth_url);
          
          if (authWindow) {
            setStatus('Ожидайте завершения авторизации в открывшемся окне...');
            
            const checkWindow = setInterval(() => {
              if (authWindow.closed) {
                clearInterval(checkWindow);
                setStatus('Окно авторизации закрыто. Проверяем статус...');
                
                setTimeout(async () => {
                  const tokens = await pollAuthStatus(generatedLoginToken, userId);
                  
                  if (tokens.status === 'granted') {
                    const saveResult = await saveAuthTokensToRedis(
                      userId,
                      tokens.accessToken,
                      tokens.refreshToken,
                      provider
                    );
                    
                    if (saveResult.success) {
                      setStatus(' Авторизация успешна! Перенаправление...');
                      
                      setTimeout(() => {
                        const redirectUrl = `/?access_token=${encodeURIComponent(tokens.accessToken)}&refresh_token=${encodeURIComponent(tokens.refreshToken)}&user_id=${encodeURIComponent(userId)}&provider=${encodeURIComponent(provider)}&login_token=${encodeURIComponent(generatedLoginToken)}`;
                        navigate(redirectUrl);
                      }, 1000);
                    } else {
                      setStatus(' Ошибка сохранения токенов');
                      setLoading(false);
                      hasStartedRef.current = false;
                    }
                    
                  } else {
                    setStatus(' Авторизация не завершена. Попробуйте снова.');
                    setLoading(false);
                    hasStartedRef.current = false;
                  }
                }, 1000);
              }
            }, 500);
          } else {
            setStatus('Используйте предложенные альтернативные способы авторизации');
            setLoading(false);
            hasStartedRef.current = false;
          }
        }, 1500);
        
      } else if (authResponse.auth_code) {
        setStatus(`Код для авторизации: ${authResponse.auth_code}`);
        
        setStatus('Ожидаем подтверждения кода...');
        
        let attempts = 0;
        const maxAttempts = 30;
        
        const pollInterval = setInterval(async () => {
          attempts++;
          
          const tokens = await pollAuthStatus(generatedLoginToken, userId);
          
          if (tokens.status === 'granted') {
            clearInterval(pollInterval);
            
            const saveResult = await saveAuthTokensToRedis(
              userId,
              tokens.accessToken,
              tokens.refreshToken,
              provider
            );
            
            if (saveResult.success) {
              setStatus(' Авторизация успешна! Перенаправление...');
              
              setTimeout(() => {
                const redirectUrl = `/?access_token=${encodeURIComponent(tokens.accessToken)}&refresh_token=${encodeURIComponent(tokens.refreshToken)}&user_id=${encodeURIComponent(userId)}&provider=${encodeURIComponent(provider)}&login_token=${encodeURIComponent(generatedLoginToken)}`;
                navigate(redirectUrl);
              }, 1000);
            } else {
              setStatus(' Ошибка сохранения токенов');
              setLoading(false);
              hasStartedRef.current = false;
            }
            
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setStatus(' Время ожидания истекло');
            setLoading(false);
            hasStartedRef.current = false;
          }
        }, 2000);
        
      } else {
        throw new Error('Непредвиденный ответ от сервера авторизации');
      }
      
    } catch (error) {
      setStatus(` Ошибка: ${error.message}`);
      
      setTimeout(() => {
        hasStartedRef.current = false;
        setLoading(false);
        setCurrentProvider('');
        setStatus('');
        navigate('/');
      }, 3000);
    }
  };

  return (
    <Body>
      <Title>Выберите способ входа</Title>
      
      {!activeType ? (
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
            {status || 'Выберите способ авторизации'}
            {loading && (
              <div style={{ 
                marginTop: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                color:'black',
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid #F39C12',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Загрузка...
              </div>
            )}
          </Status>
        </>
      ) : (
        <Status>
          <strong>Статус:</strong> {status || `Обработка ${activeType}`}
          {loading && (
            <div style={{ 
              marginTop: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid #F39C12',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              Выполняется авторизация...
            </div>
          )}
        </Status>
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