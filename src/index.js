import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Добавляем CSS для межшрифтов
const fontLink = document.createElement('link');
fontLink.rel = 'preconnect';
fontLink.href = 'https://fonts.googleapis.com';
document.head.appendChild(fontLink);

const fontLink2 = document.createElement('link');
fontLink2.rel = 'preconnect';
fontLink2.href = 'https://fonts.gstatic.com';
fontLink2.crossOrigin = true;
document.head.appendChild(fontLink2);

const fontCSS = document.createElement('link');
fontCSS.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
fontCSS.rel = 'stylesheet';
document.head.appendChild(fontCSS);

// Добавляем meta теги
document.title = 'Seismic Game - Privy React Auth';

const metaDescription = document.createElement('meta');
metaDescription.name = 'description';
metaDescription.content = 'Блокчейн игра с Privy аутентификацией';
document.head.appendChild(metaDescription);

// Инициализируем React приложение
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('🚀 Seismic Game запущен с официальным Privy React SDK!'); 