function getMainColors(img, colorCount = 10) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Увеличиваем размер для большей детализации
    const maxSize = 250;
    const ratio = Math.min(maxSize / img.width, maxSize / img.height);
    canvas.width = img.width * ratio;
    canvas.height = img.height * ratio;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const colorStats = {};

    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];

        if (a < 128) continue;
        
        // Мягкая фильтрация серых цветов
        const isGray = Math.abs(r - g) < 40 && Math.abs(g - b) < 40;
        if (isGray && (r + g + b > 600 || r + g + b < 150)) continue;

        // Уменьшаем шаг группировки и добавляем HSL-фильтры
        const key = `${Math.round(r/32)*32},${Math.round(g/32)*32},${Math.round(b/32)*32}`;
        const [h, s, l] = rgbToHsl(r, g, b);
        
        // Фильтруем блёклые и слишком тёмные/светлые цвета
        if (s < 0.15 || l < 0.15 || l > 0.93) continue;
        
        colorStats[key] = (colorStats[key] || 0) + 1;
    }

    // Объединяем похожие цвета после группировки
    const uniqueColors = mergeSimilarColors(Object.keys(colorStats), 30);
    
    return uniqueColors
        .slice(0, colorCount)
        .map(rgb => rgbToHex(...rgb.split(',').map(Number)));
}

// Функция для объединения похожих цветов
function mergeSimilarColors(colors, threshold = 50) {
    return colors.reduce((acc, color) => {
        const [r, g, b] = color.split(',').map(Number);
        const exists = acc.some(existing => {
            const [er, eg, eb] = existing.split(',').map(Number);
            const diff = Math.sqrt((r-er)**2 + (g-eg)**2 + (b-eb)**2);
            return diff < threshold;
        });
        return exists ? acc : [...acc, color];
    }, []);
}

// Конвертация RGB в HSL (добавьте в код)
function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h || 0, s || 0, l];
}
