import React, { useState, useEffect } from 'react';

const Personalaccount = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [responseData, setResponseData] = useState('');

  const API_BASE = 'http://localhost:8081/api/v1';

  // Получение заголовков для запросов
  const getHeaders = () => {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  };

  // Получение информации о пользователе по ID
  const fetchUser = async (userId) => {
    setLoading(true);
    setResponseData('');
    try {
      console.log('Запрос к:', `${API_BASE}/users/${userId}`);
      
      const response = await fetch(`${API_BASE}/users/${userId}`, {
        headers: getHeaders()
      });
      
      console.log('Статус ответа:', response.status, response.statusText);
      
      // Получаем текст ответа для отладки
      const responseText = await response.text();
      console.log('Текст ответа:', responseText);
      setResponseData(responseText);
      
      if (!response.ok) {
        throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
      }
      
      // Пытаемся распарсить JSON
      let userData;
      try {
        userData = JSON.parse(responseText);
        console.log('Распарсенные данные:', userData);
        console.log('Тип данных:', typeof userData);
        console.log('Ключи объекта:', Object.keys(userData || {}));
      } catch (parseError) {
        console.error('Ошибка парсинга JSON:', parseError);
        throw new Error('Неверный формат ответа от сервера');
      }
      
      setUser(userData);
      setError('');
    } catch (err) {
      console.error('Ошибка загрузки:', err);
      setError(err.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Загружаем пользователя с ID 1 при монтировании компонента
    fetchUser(3);
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1>Пользователь системы</h1>
      </header>

      <main>
        {/* Панель отладки */}
        <div style={{ 
          backgroundColor: '#f0f0f0', 
          padding: '15px', 
          marginBottom: '20px',
          borderRadius: '5px',
          fontSize: '14px'
        }}>
          <h3 style={{ marginTop: 0 }}>Отладка</h3>
          <p><strong>Состояние user:</strong> {user ? 'установлено' : 'null'}</p>
          <p><strong>Загрузка:</strong> {loading ? 'да' : 'нет'}</p>
          <p><strong>Ответ сервера:</strong></p>
          <pre style={{ 
            backgroundColor: '#e0e0e0', 
            padding: '10px', 
            borderRadius: '3px',
            overflow: 'auto',
            maxHeight: '100px'
          }}>
            {responseData || 'Нет данных'}
          </pre>
          <button 
            onClick={() => {
              console.clear();
              fetchUser(1);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Повторить запрос
          </button>
          <button 
            onClick={() => {
              console.log('Текущий user:', user);
              console.log('user.id:', user?.id);
              console.log('user.name:', user?.name);
              console.log('Все свойства:', user ? Object.keys(user) : []);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Показать данные в консоли
          </button>
        </div>

        {error && (
          <div style={{ 
            backgroundColor: '#ffebee', 
            color: '#c62828', 
            padding: '15px', 
            borderRadius: '5px', 
            marginBottom: '20px' 
          }}>
            <p><strong>Ошибка:</strong> {error}</p>
            <button 
              onClick={() => setError('')}
              style={{ 
                background: 'none', 
                border: 'none', 
                fontSize: '20px', 
                cursor: 'pointer',
                float: 'right'
              }}
            >
              ×
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Загрузка данных пользователя...</p>
          </div>
        ) : (
          <div>
            <h2>Информация о пользователе</h2>
            
            {user ? (
              <div style={{ 
                backgroundColor: '#f5f5f5', 
                padding: '20px', 
                borderRadius: '10px',
                marginTop: '20px'
              }}>
                {/* Отображаем все свойства объекта */}
                <div style={{ margin: '20px 0', lineHeight: '1.6' }}>
                  {Object.entries(user).map(([key, value]) => (
                    <p key={key}>
                      <strong>{key}:</strong> {
                        value === null || value === undefined 
                          ? 'null/undefined' 
                          : typeof value === 'object' 
                            ? JSON.stringify(value) 
                            : String(value)
                      }
                    </p>
                  ))}
                </div>
                
                <button 
                  onClick={() => fetchUser(1)} 
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Обновить данные
                </button>
              </div>
            ) : (
              !error && (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p>Пользователь не найден</p>
                </div>
              )
            )}
          </div>
        )}
      </main>

      <footer style={{ textAlign: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #ddd' }}>
        <p>Система тестирования © 2024</p>
      </footer>
    </div>
  );
};

export default Personalaccount;