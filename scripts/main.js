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
    const maxSize = 300;
    const TARGET_COLORS = 10;
    
    // Масштабирование изображения
    const scale = Math.min(maxSize / img.width, maxSize / img.height);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Анализ цветов
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const colorClusters = new Map();

    // Кластеризация цветов
    for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i+3] < 128) continue;

        const key = `${Math.floor(pixels[i]/24)},${Math.floor(pixels[i+1]/24)},${Math.floor(pixels[i+2]/24)}`;
        
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

    // Подготовка кандидатов
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

    // Фильтрация цветов
    const palette = [];
    const MIN_DISTANCE = 55;
    
    // Распределение по яркости
    const brightnessGroups = {
        dark: candidates.filter(c => c.luminance < 90),
        medium: candidates.filter(c => c.luminance >= 90 && c.luminance < 180),
        light: candidates.filter(c => c.luminance >= 180)
    };

    // Пропорциональное добавление цветов
    const groupRatios = { dark: 0.2, medium: 0.5, light: 0.3 };
    
    for (const [groupName, ratio] of Object.entries(groupRatios)) {
        const group = brightnessGroups[groupName];
        const targetCount = Math.round(TARGET_COLORS * ratio);
        
        group.slice(0, targetCount).forEach(color => {
            if (palette.length >= TARGET_COLORS) return;
            
            const isUnique = palette.every(existing => 
                colorDistance(existing, color) > MIN_DISTANCE
            );
            
            if (isUnique) palette.push(color);
        });
    }

    // Дополнение палитры при необходимости
    const remaining = TARGET_COLORS - palette.length;
    if (remaining > 0) {
        candidates.sort((a, b) => b.luminance - a.luminance);
        candidates.forEach(color => {
            if (palette.length >= TARGET_COLORS) return;
            if (!palette.includes(color)) palette.push(color);
        });
    }

    // Финальная сортировка
    const finalPalette = palette
        .slice(0, TARGET_COLORS)
        .sort((a, b) => a.luminance - b.luminance);

    displayPalette(finalPalette);
}

function colorDistance(c1, c2) {
    const dr = (c1.r - c2.r) * 0.6;
    const dg = (c1.g - c2.g) * 0.6;
    const db = (c1.b - c2.b) * 0.6;
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
