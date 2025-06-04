import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

// Создаем корневой элемент для React приложения
const container = document.getElementById('root');
const root = createRoot(container);

// Рендерим приложение
root.render(<App />); 