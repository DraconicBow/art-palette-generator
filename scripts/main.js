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
    const maxSize = 300; // Увеличили размер для лучшей детализации
    const TARGET_COLORS = 10;
    const COLOR_SENSITIVITY = 45; // Чувствительность к различию цветов
    
    // Масштабирование с сохранением пропорций
    const scale = Math.min(maxSize / img.width, maxSize / img.height);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Анализ цветов с улучшенной кластеризацией
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const colorClusters = new Map();

    for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i+3] < 128) continue;

        // Более точная группировка цветов
        const key = `${Math.floor(pixels[i]/16)},${Math.floor(pixels[i+1]/16)},${Math.floor(pixels[i+2]/16)}`;
        
        if (colorClusters.has(key)) {
            const cluster = colorClusters.get(key);
            cluster.count++;
            cluster.r += pixels[i];
            cluster.g += pixels[i+1];
            cluster.b += pixels[i+2];
        } else {
            colorClusters.set(key, {
                count: 1,
                r: pixels[i],
                g: pixels[i+1],
                b: pixels[i+2]
            });
        }
    }

    // Подготовка цветов-кандидатов
    const candidates = Array.from(colorClusters.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 50)
        .map(cluster => {
            const r = Math.round(cluster.r / cluster.count);
            const g = Math.round(cluster.g / cluster.count);
            const b = Math.round(cluster.b / cluster.count);
            return {
                r, g, b,
                luminance: 0.2126*r + 0.7152*g + 0.0722*b
            };
        });

    // Умная фильтрация цветов
    const palette = [];
    const MIN_DISTANCE = 40;
    
    // Добавляем доминирующие цвета
    candidates.forEach(color => {
        if (palette.length >= TARGET_COLORS) return;
        
        // Проверка на уникальность
        const isUnique = palette.every(existing => 
            colorDistance(existing, color) > MIN_DISTANCE
        );
        
        // Приоритет для контрастных цветов
        const isContrast = palette.length === 0 || 
            palette.some(existing => Math.abs(existing.luminance - color.luminance) > 60);

        if (isUnique && (isContrast || palette.length > TARGET_COLORS/2)) {
            palette.push(color);
        }
    });

    // Дополнение палитры при необходимости
    if (palette.length < TARGET_COLORS) {
        const remaining = TARGET_COLORS - palette.length;
        const neutralColors = candidates
            .filter(c => !palette.includes(c))
            .sort((a, b) => a.luminance - b.luminance)
            .slice(0, remaining);
        
        palette.push(...neutralColors);
    }

    // Финализация палитры
    const finalPalette = palette
        .slice(0, TARGET_COLORS)
        .sort((a, b) => a.luminance - b.luminance);

    displayPalette(finalPalette);
}

function colorDistance(c1, c2) {
    // Взвешенное расстояние с учетом восприятия
    const dr = (c1.r - c2.r) * 0.5;
    const dg = (c1.g - c2.g) * 0.8;
    const db = (c1.b - c2.b) * 0.3;
    return Math.sqrt(dr*dr + dg*dg + db*db);
}

// Остальные функции без изменений
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
