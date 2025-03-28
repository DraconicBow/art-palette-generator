document.getElementById('imageInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                // Показываем превью изображения
                const preview = document.getElementById('preview');
                preview.src = event.target.result;
                preview.hidden = false;
                
                // Создаем палитру
                generatePalette(img);
            }
            img.src = event.target.result;
        }
        
        reader.readAsDataURL(file);
    }
});

function generatePalette(img) {
    // Создаем canvas для обработки изображения
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Устанавливаем размеры canvas
    canvas.width = img.width;
    canvas.height = img.height;
    
    // Рисуем изображение на canvas
    ctx.drawImage(img, 0, 0);
    
    // Получаем данные пикселей
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Создаем массив цветов
    const colorMap = new Map();
    
    // Проходим по пикселям с шагом для оптимизации
    for (let i = 0; i < data.length; i += 40) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        // Пропускаем прозрачные пиксели
        if (a < 255) continue;
        
        // Создаем ключ цвета
        const colorKey = `${r},${g},${b}`;
        
        // Учитываем частоту появления цвета
        colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
    }
    
    // Преобразуем Map в массив и сортируем по частоте
    const colors = Array.from(colorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6) // Берем 6 самых частых цветов
        .map(entry => entry[0].split(',').map(Number));
    
    // Очищаем предыдущую палитру
    const palette = document.getElementById('palette');
    palette.innerHTML = '';
    
    // Создаем цветовые блоки
    colors.forEach(color => {
        const [r, g, b] = color;
        const hex = rgbToHex(r, g, b);
        
        const colorBox = document.createElement('div');
        colorBox.className = 'color-box';
        colorBox.style.backgroundColor = hex;
        colorBox.textContent = hex;
        
        palette.appendChild(colorBox);
    });
}

// Функция преобразования RGB в HEX
function rgbToHex(r, g, b) {
    return '#' + [r, g, b]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('');
}
