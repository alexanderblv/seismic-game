// Функция для анимации сейсмических волн данных
function animateSeismicData(container) {
    if (!container) return;
    
    // Создаем центральную точку сейсмической волны
    const seismicWave = document.createElement('div');
    seismicWave.className = 'seismic-wave';
    seismicWave.style.position = 'absolute';
    seismicWave.style.left = '50%';
    seismicWave.style.top = '50%';
    seismicWave.style.width = '0';
    seismicWave.style.height = '0';
    seismicWave.style.pointerEvents = 'none';
    container.appendChild(seismicWave);
    
    // Создаем концентрические круги для анимации
    for (let i = 0; i < 5; i++) {
        const waveCircle = document.createElement('div');
        waveCircle.className = 'seismic-wave-circle';
        waveCircle.style.animation = `seismicWave 3s ease-out infinite`;
        waveCircle.style.animationDelay = `${i * 0.6}s`;
        seismicWave.appendChild(waveCircle);
    }
    
    // Добавляем точки сейсмических данных
    for (let i = 0; i < 8; i++) {
        const dataPoint = document.createElement('div');
        dataPoint.className = 'seismic-data-point';
        
        // Случайное расположение вокруг центра
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 80 + 20;
        dataPoint.style.left = `calc(50% + ${Math.cos(angle) * distance}px)`;
        dataPoint.style.top = `calc(50% + ${Math.sin(angle) * distance}px)`;
        
        // Добавляем анимацию пульсации
        dataPoint.style.animation = 'pulse 2s infinite alternate';
        dataPoint.style.animationDelay = `${Math.random() * 2}s`;
        
        container.appendChild(dataPoint);
    }
    
    // Добавляем соединительные линии после небольшой задержки,
    // чтобы гарантировать, что элементы уже отрендерены
    setTimeout(() => createSeismicConnections(container), 100);
}

// Создание соединительных линий между сейсмическими точками и TEE
function createSeismicConnections(container) {
    const dataPoints = container.querySelectorAll('.seismic-data-point');
    const teeProcessor = container.querySelector('.tee-processor');
    
    if (!teeProcessor || dataPoints.length === 0) return;
    
    // Измеряем размеры контейнера для позиционирования
    const containerRect = container.getBoundingClientRect();
    
    // Центр TEE процессора
    const teeCenterX = containerRect.width / 2;
    const teeCenterY = containerRect.height / 2;
    
    // Для каждой точки создаем соединение с TEE
    dataPoints.forEach((point, index) => {
        if (index % 2 !== 0) return; // Соединяем только четные точки
        
        // Получаем положение точки
        const pointStyle = window.getComputedStyle(point);
        const pointRect = point.getBoundingClientRect();
        
        // Вычисляем центр точки относительно контейнера
        const pointCenterX = pointRect.left - containerRect.left + pointRect.width / 2;
        const pointCenterY = pointRect.top - containerRect.top + pointRect.height / 2;
        
        // Рассчитываем расстояние и угол
        const dx = teeCenterX - pointCenterX;
        const dy = teeCenterY - pointCenterY;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        // Создаем линию соединения
        const connectionLine = document.createElement('div');
        connectionLine.className = 'seismic-connection-line';
        connectionLine.style.width = `${length}px`;
        connectionLine.style.left = `${pointCenterX}px`;
        connectionLine.style.top = `${pointCenterY}px`;
        connectionLine.style.transform = `rotate(${angle}deg)`;
        
        // Добавляем анимацию пульсации
        connectionLine.style.animation = 'seismicPulse 3s infinite';
        connectionLine.style.animationDelay = `${Math.random() * 2}s`;
        
        container.appendChild(connectionLine);
    });
}

// Экспортируем функцию для использования
window.animateSeismicData = animateSeismicData;

// Добавляем обработчик кнопки управления сейсмической анимацией
document.addEventListener('DOMContentLoaded', function() {
    const toggleButton = document.getElementById('toggleSeismicAnimationBtn');
    if (toggleButton) {
        // Флаг состояния анимации
        let isAnimationActive = true;
        
        // Обработчик кнопки
        toggleButton.addEventListener('click', function() {
            const encryptionAnimation = document.getElementById('encryptionAnimation');
            
            if (encryptionAnimation) {
                // Переключаем состояние
                isAnimationActive = !isAnimationActive;
                
                if (isAnimationActive) {
                    // Включаем анимацию
                    // Удаляем все существующие элементы анимации
                    const existingElements = encryptionAnimation.querySelectorAll('.seismic-wave, .seismic-data-point, .seismic-connection-line');
                    existingElements.forEach(el => el.remove());
                    
                    // Создаем новую анимацию
                    animateSeismicData(encryptionAnimation);
                    
                    // Меняем текст кнопки
                    toggleButton.innerHTML = '<i class="fas fa-wave-square"></i> Сейсмические волны: ВКЛ';
                    toggleButton.classList.replace('btn-secondary', 'btn-info');
                } else {
                    // Выключаем анимацию - удаляем элементы
                    const animationElements = encryptionAnimation.querySelectorAll('.seismic-wave, .seismic-data-point, .seismic-connection-line');
                    animationElements.forEach(el => el.remove());
                    
                    // Меняем текст кнопки
                    toggleButton.innerHTML = '<i class="fas fa-wave-square"></i> Сейсмические волны: ВЫКЛ';
                    toggleButton.classList.replace('btn-info', 'btn-secondary');
                }
            }
        });
    }
});

// Добавляем инициализацию анимации криптографической головоломки при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Получаем контейнеры для анимации (два разных ID используются в HTML)
    const encryptionAnimation = document.getElementById('encryptionAnimation') || 
                              document.getElementById('encryption-animation');
    
    if (encryptionAnimation) {
        // Показываем контейнер анимации
        encryptionAnimation.style.display = 'block';
        
        // Инициализируем анимацию
        setTimeout(() => {
            // Добавляем класс для запуска анимации
            encryptionAnimation.classList.add('animate');
            
            // Добавляем базовую структуру для TEE-процессора, если её ещё нет
            if (!encryptionAnimation.querySelector('.tee-processor')) {
                const teeProcessor = document.createElement('div');
                teeProcessor.className = 'tee-processor';
                teeProcessor.innerHTML = '<i class="bi bi-cpu"></i>';
                
                // Центрируем процессор в контейнере
                teeProcessor.style.position = 'absolute';
                teeProcessor.style.left = '50%';
                teeProcessor.style.top = '50%';
                teeProcessor.style.transform = 'translate(-50%, -50%)';
                
                encryptionAnimation.appendChild(teeProcessor);
            }
            
            // Запускаем анимацию сейсмических волн
            animateSeismicData(encryptionAnimation);
        }, 500);
    }
}); 