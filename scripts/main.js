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

    // Оптимальная кластеризация цветов
    for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i+3] < 128) continue;

        // Увеличенные цветовые кубы для лучшего усреднения
        const key = `${Math.floor(pixels[i]/12)},${Math.floor(pixels[i+1]/12)},${Math.floor(pixels[i+2]/12)}`;
        
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
        .slice(0, 100)
        .map(cluster => {
            const r = Math.round(cluster.r / cluster.count);
            const g = Math.round(cluster.g / cluster.count);
            const b = Math.round(cluster.b / cluster.count);
            const [h, s, l] = rgbToHsl(r, g, b);
            return { r, g, b, h, s, l };
        });

    // Фильтрация цветов
    const palette = [];
    const MIN_HUE_DIFF = 30; // Минимальная разница в оттенках
    const MIN_DISTANCE = 40; // Общее цветовое расстояние
    
    candidates.forEach(color => {
        if (palette.length >= TARGET_COLORS) return;

        // Проверка на уникальность по Hue и общему расстоянию
        const isUnique = palette.every(existing => {
            const hueDiff = Math.abs(existing.h - color.h);
            const dist = colorDistance(existing, color);
            return hueDiff > MIN_HUE_DIFF || dist > MIN_DISTANCE;
        });

        if (isUnique) {
            palette.push(color);
        }
    });

    // Дополнение палитры с приоритетом разных цветовых семейств
    const colorFamilies = {
        red: [0, 30],
        orange: [30, 50],
        yellow: [50, 70],
        green: [70, 160],
        blue: [160, 240],
        purple: [240, 330],
        pink: [330, 360]
    };

    if (palette.length < TARGET_COLORS) {
        Object.entries(colorFamilies).forEach(([family, range]) => {
            if (palette.length >= TARGET_COLORS) return;
            
            const familyColor = candidates.find(c => 
                c.h >= range[0] && c.h < range[1] && 
                !palette.some(p => p.h >= range[0] && p.h < range[1])
            );
            
            if (familyColor) palette.push(familyColor);
        });
    }

    // Финальная корректировка
    const finalPalette = palette
        .slice(0, TARGET_COLORS)
        .sort((a, b) => a.l - b.l);

    displayPalette(finalPalette);
}

function colorDistance(c1, c2) {
    const dr = (c1.r - c2.r) * 0.5;
    const dg = (c1.g - c2.g) * 0.8;
    const db = (c1.b - c2.b) * 0.3;
    return Math.sqrt(dr*dr + dg*dg + db*db);
}

function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h *= 60;
    }
    return [Math.round(h), s, l];
}
// displayPalette и rgbToHex без изменений
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
