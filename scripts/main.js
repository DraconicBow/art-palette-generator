document.getElementById('imageInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = document.getElementById('preview');
        img.hidden = false;
        img.src = event.target.result;
        img.onload = function() {
            generatePalette(img);
        };
    };
    reader.readAsDataURL(file);
});

function generatePalette(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const maxSize = 200;
    
    // Масштабирование изображения для оптимизации
    let width = img.naturalWidth;
    let height = img.naturalHeight;
    if (width > height && width > maxSize) {
        height = Math.round(height * maxSize / width);
        width = maxSize;
    } else if (height > maxSize) {
        width = Math.round(width * maxSize / height);
        height = maxSize;
    }
    
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    // Получение данных пикселей
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const colorStats = {};

    // Анализ цветов
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        // Пропуск полупрозрачных пикселей
        if (a < 128) continue;
        
        // Группировка цветов в кубы 32x32x32
        const cube = [
            Math.floor(r / 32),
            Math.floor(g / 32),
            Math.floor(b / 32)
        ];
        const key = cube.join(',');
        
        if (!colorStats[key]) {
            colorStats[key] = { count: 1, r: r, g: g, b: b };
        } else {
            colorStats[key].count++;
            colorStats[key].r += r;
            colorStats[key].g += g;
            colorStats[key].b += b;
        }
    }

    // Сортировка и выбор топ-цветов
    const colors = Object.values(colorStats)
        .sort((a, b) => b.count - a.count)
        .slice(0, 20)
        .map(cube => ({
            r: Math.round(cube.r / cube.count),
            g: Math.round(cube.g / cube.count),
            b: Math.round(cube.b / cube.count)
        }));

    // Фильтрация похожих цветов
    const minDistance = 50;
    const uniqueColors = [];
    
    for (const color of colors) {
        if (!uniqueColors.some(existing => colorDistance(existing, color) < minDistance)) {
            uniqueColors.push(color);
            if (uniqueColors.length >= 8) break;
        }
    }

    displayPalette(uniqueColors);
}

function colorDistance(c1, c2) {
    const dr = c1.r - c2.r;
    const dg = c1.g - c2.g;
    const db = c1.b - c2.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
}

function displayPalette(colors) {
    const paletteDiv = document.getElementById('palette');
    paletteDiv.innerHTML = '';
    
    colors.forEach(color => {
        const hex = rgbToHex(color.r, color.g, color.b);
        const colorElement = document.createElement('div');
        colorElement.className = 'color-box';
        colorElement.style.backgroundColor = hex;
        colorElement.textContent = hex;
        paletteDiv.appendChild(colorElement);
    });
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('');
}
