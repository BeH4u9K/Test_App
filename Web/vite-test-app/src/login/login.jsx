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
  margin: '0',
  border: '4px solid #7E866A',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0',
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  boxShadow: '0 6px 15px rgba(0, 0, 0, 0.2)',
  
  '&:hover': {
    transform: 'scale(1.1)',
    borderColor: '#6A7359',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
  },
  
  '&:active': {
    transform: 'scale(0.95)',
    borderColor: '#9DB7A2',
    borderWidth: '6px',
  },
  
  '&:focus': {
    outline: 'none',
    boxShadow: '0 0 0 4px rgba(126, 134, 106, 0.4)',
  },
});

const IconImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: '50%',
  transition: 'transform 0.3s ease',
  
  'button:hover &': {
    transform: 'scale(1.05)',
  },
  
  'button:active &': {
    transform: 'scale(0.95)',
  },
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
  padding: '5px',
});

const ResponseContainer = styled('div')({
  marginTop: '20px',
  padding: '15px',
  backgroundColor: '#f5f5f5',
  borderRadius: '10px',
  width: '100%',
  maxHeight: '150px',
  overflowY: 'auto',
  border: '1px solid #ddd',
});

const ResponseTitle = styled('h4')({
  margin: '0 0 10px 0',
  color: '#2C3E50',
  fontSize: '14px',
});

const ResponseText = styled('pre')({
  margin: '0',
  fontSize: '12px',
  whiteSpace: 'pre-wrap',
  wordWrap: 'break-word',
  color: '#333',
});

function Login() {
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  // Метод для отправки запроса на сервер
  const sendAuthRequest = async (authType) => {
    setLoading(true);
    setResponse(null);
    
    try {
      const baseUrl = 'http://localhost:8080';
      
      let url;
      if (authType === 'github') {
        // Для теста используем /ping endpoint
        url = `${baseUrl}/ping`;
        console.log('Отправка запроса на:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Ответ от сервера:', data);
        
        setResponse({
          status: response.status,
          data: data,
          timestamp: new Date().toLocaleTimeString()
        });
        
      } else if (authType === 'auth') {
        // Если хотите использовать /auth endpoint с параметрами
        const stateToken = 'test_login_token_' + Date.now();
        url = `${baseUrl}/auth?type=github&state=${encodeURIComponent(stateToken)}`;
        
        console.log('Отправка запроса на /auth:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Ответ от сервера (/auth):', data);
        
        setResponse({
          status: response.status,
          data: data,
          timestamp: new Date().toLocaleTimeString()
        });
      }
      
    } catch (error) {
      console.error('Ошибка при отправке запроса:', error);
      setResponse({
        error: error.message,
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGitClick = () => {
    console.log('Нажата кнопка GitHub');
    // Отправляем запрос на сервер
    sendAuthRequest('github'); // Используем 'github' для /ping endpoint
    // Или используйте 'auth' для реальной авторизации:
    // sendAuthRequest('auth');
  };

  const handleCodeClick = () => {
    console.log('Нажата кнопка Code Authentication');
    // Здесь можно добавить логику для code authentication
  };

  const handleYandexClick = () => {
    console.log('Нажата кнопка Yandex');
    // Здесь можно добавить логику для Yandex
  };

  return (
    <Body>
      <Title>
        Вход в систему
      </Title>
      
      <DivBlockButton>
        <Button 
          onClick={handleGitClick} 
          title="Войти через GitHub"
          disabled={loading}
        >
          <IconImage 
            src={gitIcon} 
            alt="GitHub"
          />
        </Button>
        
        <Button onClick={handleCodeClick} title="Войти по коду">
          <IconImage 
            src={codeIcon} 
            alt="Code Authentication"
          />
        </Button>
        
        <Button onClick={handleYandexClick} title="Войти через Яндекс">
          <IconImage 
            src={yandexIcon} 
            alt="Yandex"
          />
        </Button>
      </DivBlockButton>
      
      <ButtonLabel>
        <Label>GitHub</Label>
        <Label>Code Auth</Label>
        <Label>Яндекс</Label>
      </ButtonLabel>

      {loading && (
        <ResponseContainer>
          <ResponseTitle>Загрузка...</ResponseTitle>
          <ResponseText>Отправка запроса на сервер...</ResponseText>
        </ResponseContainer>
      )}

      {response && !loading && (
        <ResponseContainer>
          <ResponseTitle>
            Ответ от сервера ({response.timestamp}):
            {response.status && ` Статус: ${response.status}`}
          </ResponseTitle>
          <ResponseText>
            {response.error 
              ? `Ошибка: ${response.error}`
              : JSON.stringify(response.data, null, 2)
            }
          </ResponseText>
        </ResponseContainer>
      )}
    </Body>
  );
}

export default Login;