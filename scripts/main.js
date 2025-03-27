function getMainColors(img, colorCount = 10) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Уменьшаем размер для оптимизации
    const maxSize = 200;
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

        // Пропускаем прозрачные пиксели
        if (a < 128) continue;

        // Конвертация в HSL для фильтрации
        const [h, s, l] = rgbToHsl(r, g, b);
        
        // Фильтруем:
        // - Слишком темные (l < 15%)
        // - Слишком светлые (l > 90%)
        // - Ненасыщенные (s < 20%)
        if (l < 0.15 || l > 0.9 || s < 0.2) continue;

        // Группируем цвета с шагом 32 для объединения оттенков
        const key = `${Math.round(r/32)*32},${Math.round(g/32)*32},${Math.round(b/32)*32}`;
        colorStats[key] = (colorStats[key] || 0) + 1;
    }

    // Сортируем по насыщенности и яркости, а не только по частоте
    return Object.entries(colorStats)
        .sort((a, b) => {
            const [r1, g1, b1] = a[0].split(',').map(Number);
            const [r2, g2, b2] = b[0].split(',').map(Number);
            const hsl1 = rgbToHsl(r1, g1, b1);
            const hsl2 = rgbToHsl(r2, g2, b2);
            
            // Приоритет: насыщенность → яркость → частота
            return (hsl2[1] - hsl1[1]) || (hsl2[2] - hsl1[2]) || (b[1] - a[1]);
        })
        .slice(0, colorCount)
        .map(([rgb]) => rgbToHex(...rgb.split(',').map(Number)));
}

// Функция конвертации RGB → HSL (должна быть в коде!)
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
