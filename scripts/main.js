document.getElementById('imageInput').addEventListener('change', handleImageUpload);

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            generatePalette(img);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function generatePalette(img) {
    // Создаем канвас для анализа изображения
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Устанавливаем размер канваса равным размеру изображения
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    // Получаем данные изображения с канваса
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    // Массив для хранения цветов
    const colors = [];

    // Проходим по всем пикселям
    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        
        // Добавляем цвет в массив
        colors.push(`rgb(${r}, ${g}, ${b})`);
    }

    // Выбираем 6 наиболее популярных цветов
    const palette = getMostFrequentColors(colors, 6);

    // Отображаем палитру
    displayPalette(palette);
}

function getMostFrequentColors(colors, numColors) {
    const colorCount = {};
    
    // Подсчитываем частоту каждого цвета
    colors.forEach(color => {
        colorCount[color] = (colorCount[color] || 0) + 1;
    });
    
    // Сортируем по частоте и возвращаем топ numColors
    return Object.keys(colorCount)
        .sort((a, b) => colorCount[b] - colorCount[a])
        .slice(0, numColors);
}

function displayPalette(palette) {
    const paletteContainer = document.getElementById('palette');
    paletteContainer.innerHTML = ''; // Очищаем старую палитру

    // Для каждого цвета создаем элемент
    palette.forEach(color => {
        const colorBox = document.createElement('div');
        colorBox.classList.add('color-box');
        colorBox.style.backgroundColor = color;
        colorBox.textContent = color; // Цвет в формате rgb
        paletteContainer.appendChild(colorBox);
    });
}
