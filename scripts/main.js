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
    const TARGET_COLORS = 10; // Фиксированное количество цветов
    
    // Масштабирование изображения с сохранением пропорций
    const scaleFactor = Math.min(maxSize / img.naturalWidth, maxSize / img.naturalHeight);
    const width = Math.floor(img.naturalWidth * scaleFactor);
    const height = Math.floor(img.naturalHeight * scaleFactor);
    
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    // Анализ цветов
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const colorClusters = new Map();

    // Кластеризация цветов с учетом прозрачности
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        if (a < 128) continue;

        // Группировка в кубы 24x24x24 (меньше кубы = больше точность)
        const cubeKey = `${Math.floor(r/24)},${Math.floor(g/24)},${Math.floor(b/24)}`;
        
        if (colorClusters.has(cubeKey)) {
            const cluster = colorClusters.get(cubeKey);
            cluster.count++;
            cluster.r += r;
            cluster.g += g;
            cluster.b += b;
        } else {
            colorClusters.set(cubeKey, {
                count: 1,
                r: r,
                g: g,
                b: b
            });
        }
    }

    // Подготовка и сортировка цветов-кандидатов
    const candidates = Array.from(colorClusters.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 50) // Берем больше кандидатов для отбора
        .map(cluster => ({
            r: Math.round(cluster.r / cluster.count),
            g: Math.round(cluster.g / cluster.count),
            b: Math.round(cluster.b / cluster.count)
        }));

    // Фильтрация и выбор цветов
    const uniqueColors = [];
    const minDistance = 40; // Уменьшенный порог для большего количества цветов
    const blackThreshold = 40;

    // Добавляем самый темный цвет
    const darkColor = candidates.reduce((darkest, color) => {
        const brightness = (color.r + color.g + color.b) / 3;
        return brightness < darkest.brightness ? {color, brightness} : darkest;
    }, {color: null, brightness: 255}).color;

    if (darkColor && (darkColor.r + darkColor.g + darkColor.b)/3 < blackThreshold) {
        uniqueColors.push(darkColor);
    }

    // Основной отбор цветов
    for (const color of candidates) {
        if (uniqueColors.length >= TARGET_COLORS) break;
        
        const isUnique = !uniqueColors.some(existing => 
            colorDistance(existing, color) < minDistance
        );
        
        if (isUnique) {
            uniqueColors.push(color);
        }
    }

    // Дополнение палитры при необходимости
    while (uniqueColors.length < TARGET_COLORS) {
        const neutralValue = Math.floor(255 * (uniqueColors.length / TARGET_COLORS));
        uniqueColors.push({
            r: neutralValue,
            g: neutralValue,
            b: neutralValue
        });
    }

    displayPalette(uniqueColors.slice(0, TARGET_COLORS));
}

function colorDistance(c1, c2) {
    // Взвешенная метрика расстояния с учетом восприятия
    const dr = (c1.r - c2.r) * 0.3;
    const dg = (c1.g - c2.g) * 0.59;
    const db = (c1.b - c2.b) * 0.11;
    return Math.sqrt(dr*dr + dg*dg + db*db);
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
