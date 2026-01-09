import React from 'react';
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

function Login() {
  const handleGitClick = () => {
    console.log('Нажата кнопка GitHub');
  };

  const handleCodeClick = () => {
    console.log('Нажата кнопка Code Authentication');
  };

  const handleYandexClick = () => {
    console.log('Нажата кнопка Yandex');
  };

  return (
    <Body>
      <Title>
        Вход в систему
      </Title>
      
      <DivBlockButton>
        <Button onClick={handleGitClick} title="Войти через GitHub">
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
    </Body>
  );
}

export default Login;