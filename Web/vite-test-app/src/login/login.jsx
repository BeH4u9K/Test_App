import React, { useState } from 'react';
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

// 📌 Генерация токена
const generateToken = () => {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

// 📌 Отправка токена на сервер
const sendTokenToServer = async (token, provider) => {
  try {
    console.log(`🔄 [${provider}] Отправляю токен на сервер...`);
    console.log(`📤 [${provider}] Токен:`, token.substring(0, 20) + '...');
    
    const response = await fetch('http://localhost:3001/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token,
        provider: provider
      }),
    });
    
    const result = await response.text();
    console.log(`📥 [${provider}] Ответ сервера:`, result);
    
    return { success: true, message: result };
    
  } catch (error) {
    console.error(`❌ [${provider}] Ошибка отправки:`, error);
    return { success: false, error: error.message };
  }
};

function Login() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [activeProvider, setActiveProvider] = useState('');

  const handleButtonClick = async (provider) => {
    console.log(`🎯 Нажата кнопка: ${provider}`);
    setActiveProvider(provider);
    setLoading(true);
    setStatus(`Отправка токена для ${provider}...`);

    try {
      // 1. Генерируем токен
      const token = generateToken();
      console.log(`🔑 [${provider}] Сгенерирован токен:`, token.substring(0, 20) + '...');
      
      // 2. Отправляем на сервер
      const result = await sendTokenToServer(token, provider);
      
      if (result.success) {
        setStatus(`✅ Токен для ${provider} отправлен на сервер!`);
        console.log(`✅ [${provider}] Успешно отправлено`);
      } else {
        setStatus(`❌ Ошибка для ${provider}: ${result.error}`);
        console.error(`❌ [${provider}] Ошибка:`, result.error);
      }
      
    } catch (error) {
      console.error(`🔥 [${provider}] Критическая ошибка:`, error);
      setStatus(`🔥 Критическая ошибка для ${provider}: ${error.message}`);
    } finally {
      setLoading(false);
      // Очищаем статус через 3 секунды
      setTimeout(() => {
        setStatus('');
        setActiveProvider('');
      }, 3000);
    }
  };

  const handleGitClick = () => {
    console.log('👉 Нажата кнопка GitHub');
    handleButtonClick('github');
  };

  const handleCodeClick = () => {
    console.log('👉 Нажата кнопка Code Auth');
    handleButtonClick('code');
  };

  const handleYandexClick = () => {
    console.log('👉 Нажата кнопка Yandex');
    handleButtonClick('yandex');
  };

  return (
    <Body>
      <Title>Вход в систему</Title>
      
      <DivBlockButton>
        <Button 
          onClick={handleGitClick} 
          title="GitHub" 
          disabled={loading}
          style={loading && activeProvider !== 'github' ? { opacity: 0.3 } : {}}
        >
          <IconImage src={gitIcon} alt="GitHub" />
        </Button>
        
        <Button 
          onClick={handleCodeClick} 
          title="Code Auth" 
          disabled={loading}
          style={loading && activeProvider !== 'code' ? { opacity: 0.3 } : {}}
        >
          <IconImage src={codeIcon} alt="Code Auth" />
        </Button>
        
        <Button 
          onClick={handleYandexClick} 
          title="Yandex" 
          disabled={loading}
          style={loading && activeProvider !== 'yandex' ? { opacity: 0.3 } : {}}
        >
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