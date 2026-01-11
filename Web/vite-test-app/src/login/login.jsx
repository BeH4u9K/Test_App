import React, { useEffect, useState } from 'react';
import { styled } from '@mui/system';
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
  textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
});

const DivBlockButton = styled('div')({
  width: '100%',
  display: "flex",
  justifyContent: 'center',
  alignItems: 'center',
  gap: '25px',
  marginTop: '50px',
  marginBottom: '40px',
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
  '&:hover': { transform: 'scale(1.1)', borderColor: '#6A7359' },
  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
    '&:hover': { transform: 'none', borderColor: '#7E866A' }
  }
});

const IconImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: '50%',
});

const ButtonLabel = styled('div')({
  display: 'flex',
  justifyContent: 'center',
  gap: '25px',
  width: '100%',
  marginTop: '15px',
});

const Label = styled('span')({
  width: '100px',
  textAlign: 'center',
  fontSize: '14px',
  fontWeight: 600,
  color: '#2C3E50',
});

const StatusMessage = styled('div')({
  marginTop: '20px',
  padding: '10px',
  borderRadius: '5px',
  textAlign: 'center',
  fontSize: '14px',
  fontWeight: 500,
  minHeight: '20px',
  width: '100%',
});

const LoadingSpinner = styled('div')({
  display: 'inline-block',
  width: '20px',
  height: '20px',
  border: '3px solid #2C3E50',
  borderTop: '3px solid transparent',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  marginRight: '10px',
  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' }
  }
});

// Функция для генерации токенов
const generateToken = () => {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

// Функция для установки куки
const setCookie = (name, value, days = 7) => {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; HttpOnly; SameSite=Strict`;
};

// Функция для отправки запроса на сервер
const sendAuthRequest = async (authUrl) => {
  try {
    console.log('Отправляю запрос на сервер:', authUrl);
    
    const response = await fetch(authUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      mode: 'cors',
    });

    console.log('Статус ответа:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ошибка! Статус: ${response.status}, Текст: ${errorText}`);
    }

    const data = await response.json();
    console.log('Ответ от сервера:', data);
    
    return { success: true, data };
    
  } catch (error) {
    console.error('Ошибка при отправке запроса:', error);
    return { success: false, error: error.message };
  }
};

function Login() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  // Проверяем параметры URL при загрузке
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    
    if (type && ['github', 'code', 'yandex'].includes(type)) {
      handleAuthFlow(type);
    }
  }, []);

  // Основная функция для обработки авторизации
  const handleAuthFlow = async (provider) => {
    setLoading(true);
    setStatus(`Начинаем авторизацию через ${provider}...`);
    setError('');

    try {
      // 1. Генерируем токены
      const sessionToken = generateToken();
      const loginToken = generateToken();
      
      // 2. Устанавливаем куку
      setCookie('session', sessionToken, 1);
      
      // 3. Выводим в консоль для отладки
      console.log(`${provider} | Session: ${sessionToken} | Login: ${loginToken}`);
      
      // 4. Формируем URL для модуля авторизации
      let authUrl;
      
      switch(provider.toLowerCase()) {
        case 'github':
          authUrl = `http://localhost:8080/auth?type=github&state=${loginToken}`;
          break;
        case 'yandex':
          authUrl = `http://localhost:8080/auth?type=yandex&state=${loginToken}`;
          break;
        case 'code':
          authUrl = `http://localhost:8080/auth?type=code&state=${loginToken}`;
          break;
        default:
          throw new Error(`Неизвестный провайдер: ${provider}`);
      }
      
      setStatus(`Отправляем запрос на сервер...`);
      
      // 5. Отправляем запрос на сервер
      const result = await sendAuthRequest(authUrl);
      
      if (result.success) {
        setStatus(`✅ Авторизация через ${provider} успешно инициирована!`);
        console.log('Токен сессии установлен:', sessionToken);
        console.log('Токен входа отправлен:', loginToken);
        
        // Здесь можно добавить редирект или другие действия после успешной авторизации
        // Например: window.location.href = '/dashboard';
        
      } else {
        setError(`❌ Ошибка: ${result.error}`);
        setStatus('');
      }
      
    } catch (error) {
      console.error('Ошибка в процессе авторизации:', error);
      setError(`❌ Ошибка: ${error.message}`);
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  const handleGitClick = () => {
    // Добавляем параметр type в URL
    const url = new URL(window.location.href);
    url.searchParams.set('type', 'github');
    window.history.pushState({}, '', url);
    
    // Запускаем процесс авторизации
    handleAuthFlow('github');
  };

  const handleCodeClick = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('type', 'code');
    window.history.pushState({}, '', url);
    
    handleAuthFlow('code');
  };

  const handleYandexClick = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('type', 'yandex');
    window.history.pushState({}, '', url);
    
    handleAuthFlow('yandex');
  };

  return (
    <Body>
      <Title>Вход в систему</Title>
      
      <DivBlockButton>
        <Button onClick={handleGitClick} title="GitHub" disabled={loading}>
          <IconImage src={gitIcon} alt="GitHub" />
        </Button>
        
        <Button onClick={handleCodeClick} title="Code Auth" disabled={loading}>
          <IconImage src={codeIcon} alt="Code Auth" />
        </Button>
        
        <Button onClick={handleYandexClick} title="Yandex" disabled={loading}>
          <IconImage src={yandexIcon} alt="Yandex" />
        </Button>
      </DivBlockButton>
      
      <ButtonLabel>
        <Label>GitHub</Label>
        <Label>Code Auth</Label>
        <Label>Яндекс</Label>
      </ButtonLabel>
    </Body>
  );
}

export default Login;