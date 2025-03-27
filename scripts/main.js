document.getElementById('imageInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        // 1. Показываем превью изображения
        const previewImg = document.getElementById('preview');
        previewImg.hidden = false; // Разблокируем элемент <img>
        previewImg.src = event.target.result; // Загружаем данные изображения

        // 2. Создаем скрытый объект Image для анализа цветов
        const img = new Image();
        img.src = event.target.result;
        
        // 3. Когда изображение загрузится, генерируем палитру
        img.onload = function() {
            const palette = getDominantColors(img, 10);
            displayPalette(palette);
        };
    };

    reader.readAsDataURL(file);
});

function getDominantColors(img, colorCount = 5) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Оптимизация: уменьшаем размер изображения
    const maxSize = 200;
    const ratio = Math.min(maxSize / img.width, maxSize / img.height);
    canvas.width = img.width * ratio;
    canvas.height = img.height * ratio;
    
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const colorMap = {};

    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];
        
        if (a < 128) continue; // Пропускаем прозрачные пиксели
        
        // Группируем цвета с шагом 32 (можно настроить)
        const key = `${Math.round(r / 32) * 32},${Math.round(g / 32) * 32},${Math.round(b / 32) * 32}`;
        colorMap[key] = (colorMap[key] || 0) + 1;
    }

    const sorted = Object.entries(colorMap).sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, colorCount).map(item => {
        const [rgb] = item;
        return rgbToHex(...rgb.split(',').map(Number));
    });
}

function displayPalette(colors) {
    const paletteDiv = document.getElementById('palette');
    paletteDiv.innerHTML = '';
    
    colors.forEach(hex => {
        const colorBox = document.createElement('div');
        colorBox.className = 'color-box';
        colorBox.style.backgroundColor = hex;
        colorBox.innerHTML = `<small>${hex}</small>`;
        
        colorBox.addEventListener('click', () => {
            navigator.clipboard.writeText(hex);
            alert(`Скопировано: ${hex}`);
        });
        
        paletteDiv.appendChild(colorBox);
    });
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

