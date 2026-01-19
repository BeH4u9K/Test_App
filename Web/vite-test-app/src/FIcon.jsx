import React from 'react';
import { styled } from '@mui/system';
import { useNavigate } from 'react-router-dom';

const Container = styled('div')({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#A3ADB1',
  padding: '40px',
});

const Content = styled('div')({
  backgroundColor: '#2C3E50',
  borderRadius: '25px',
  padding: '40px',
  width: '500px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
  textAlign: 'center',
  color:'white',
});

const Title = styled('h2')({
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 700,
  marginBottom: '30px',
  textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
});

const SessionInfo = styled('div')({
  backgroundColor: '#34495E',
  padding: '20px',
  borderRadius: '10px',
  marginBottom: '30px',
  textAlign: 'left',
  border: '2px solid #7F8C8D'
});

const InfoItem = styled('div')({
  marginBottom: '10px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
});

const InfoLabel = styled('span')({
  color: '#BDC3C7',
  fontWeight: 'bold'
});

const InfoValue = styled('span')({
  color: '#ECF0F1',
  fontFamily: 'monospace'
});

const StatusBadge = styled('div')({
  display: 'inline-block',
  padding: '5px 15px',
  borderRadius: '20px',
  fontWeight: 'bold',
  fontSize: '14px',
  marginLeft: '10px',
  backgroundColor: (props) => props.status === 'anonymous' ? '#F39C12' : '#2ECC71',
  color: '#FFF'
});

const ScenarioBox = styled('div')({
  color: '#FFF',
  padding: '15px',
  borderRadius: '10px',
  marginBottom: '20px',
  border: '2px solid #E67E22'
});

const AuthButtons = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  marginTop: '30px',
});

const AuthButton = styled('button')({
  padding: '15px',
  fontSize: '16px',
  backgroundColor: '#3498DB',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: '600',
  transition: 'all 0.3s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  '&:hover': {
    backgroundColor: '#2980B9',
    transform: 'translateY(-2px)',
  },
  '&.github': {
    backgroundColor: '#24292E',
  },
  '&.yandex': {
    backgroundColor: '#FC3F1D',
  },
  '&.code': {
    backgroundColor: '#2ECC71',
  },
});

function Home({ authState }) {
  const navigate = useNavigate();

  const renderAuthOptions = () => {
    if (authState.isAuthenticated) {
      return (
        <>
          {authState.status === 'anonymous' && (
            <ScenarioBox style={{ backgroundColor: '#F39C12' }}>
              <p style={{ fontSize: '14px', margin: 0 }}>
                 Сценарий выполнен: Web Client получил статус "Анонимный" из Redis
              </p>
            </ScenarioBox>
          )}
          
          <SessionInfo>
            <h3 style={{ color: '#ECF0F1', marginTop: 0, borderBottom: '1px solid #7F8C8D', paddingBottom: '10px' }}>
               Информация о сессии
            </h3>
            
            <InfoItem>
              <InfoLabel>Статус:</InfoLabel>
              <div>
                <span>{authState.status === 'anonymous' ? '👤 Анонимный' : ' Авторизован'}</span>
                <StatusBadge status={authState.status}>
                  {authState.status}
                </StatusBadge>
              </div>
            </InfoItem>
            
            <InfoItem>
              <InfoLabel>Redis:</InfoLabel>
              <InfoValue>{authState.isAuthenticated ? ' Ключ найден' : ' Ключ не найден'}</InfoValue>
            </InfoItem>
            
            {authState.provider && (
              <InfoItem>
                <InfoLabel>Провайдер:</InfoLabel>
                <InfoValue>{authState.provider}</InfoValue>
              </InfoItem>
            )}
            
            {authState.loginToken && (
              <InfoItem>
                <InfoLabel>Токен входа:</InfoLabel>
                <InfoValue title={authState.loginToken}>
                  {authState.loginToken.substring(0, 20)}...
                </InfoValue>
              </InfoItem>
            )}
          </SessionInfo>
          
          {authState.status === 'anonymous' ? (
            <>
              <p>Вы находитесь в состоянии <strong>анонимной сессии</strong>.</p>
              <p style={{ color: '#BDC3C7', fontSize: '14px' }}>
                Нажмите на кнопку ниже чтобы продолжить авторизацию через выбранный провайдер.
              </p>
              
              <AuthButtons>
                <AuthButton 
                  className="github"
                  onClick={() => navigate('/login?type=github')}
                >
                  <span>Войти через GitHub</span>
                </AuthButton>
                
                <AuthButton 
                  className="yandex"
                  onClick={() => navigate('/login?type=yandex')}
                >
                  <span>Войти через Яндекс ID</span>
                </AuthButton>
                
                <AuthButton 
                  className="code"
                  onClick={() => navigate('/login?type=code')}
                >
                  <span>Войти через код</span>
                </AuthButton>
              </AuthButtons>
            </>
          ) : (
            <p>Добро пожаловать в систему!</p>
          )}
        </>
      );
    }

    return (
      <>
        <SessionInfo>
          <h3 style={{ color: '#ECF0F1', marginTop: 0 }}> Сессия не найдена</h3>
          <p style={{ color: '#BDC3C7' }}>
            Кука session_token не найдена или сессия устарела в Redis.
          </p>
          <p style={{ color: '#BDC3C7', fontSize: '14px' }}>
            🔚 Продолжение по сценарию Неизвестного пользователя
          </p>
        </SessionInfo>
        
        <p>Пожалуйста, выберите способ авторизации:</p>
        
        <AuthButtons>
          <AuthButton 
            className="github"
            onClick={() => navigate('/login?type=github')}
          >
            <span>Войти через GitHub</span>
          </AuthButton>
          
          <AuthButton 
            className="yandex"
            onClick={() => navigate('/login?type=yandex')}
          >
            <span>Войти через Яндекс ID</span>
          </AuthButton>
          
          <AuthButton 
            className="code"
            onClick={() => navigate('/login?type=code')}
          >
            <span>Войти через код</span>
          </AuthButton>
        </AuthButtons>
      </>
    );
  };

  return (
    <Container>
      <Content>
        <Title> Система авторизации</Title>
        {renderAuthOptions()}
      </Content>
    </Container>
  );
}

export default Home;