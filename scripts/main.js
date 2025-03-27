function generatePalette(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const maxSize = 200;
    
    // Масштабирование изображения
    let width = img.naturalWidth;
    let height = img.naturalHeight;
    const aspectRatio = width / height;
    
    if (width > height) {
        width = width > maxSize ? maxSize : width;
        height = Math.round(width / aspectRatio);
    } else {
        height = height > maxSize ? maxSize : height;
        width = Math.round(height * aspectRatio);
    }
    
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    // Анализ цветов
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const colorClusters = {};

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        if (a < 128) continue;

        // Группировка в кубы 32x32x32
        const cubeKey = [
            Math.floor(r / 32),
            Math.floor(g / 32),
            Math.floor(b / 32)
        ].join(',');
        
        if (!colorClusters[cubeKey]) {
            colorClusters[cubeKey] = {
                count: 1,
                rSum: r,
                gSum: g,
                bSum: b
            };
        } else {
            colorClusters[cubeKey].count++;
            colorClusters[cubeKey].rSum += r;
            colorClusters[cubeKey].gSum += g;
            colorClusters[cubeKey].bSum += b;
        }
    }

    // Подготовка цветов-кандидатов
    const candidateColors = Object.values(colorClusters)
        .sort((a, b) => b.count - a.count)
        .slice(0, 30)
        .map(cluster => ({
            r: Math.round(cluster.rSum / cluster.count),
            g: Math.round(cluster.gSum / cluster.count),
            b: Math.round(cluster.bSum / cluster.count),
            luminance: 0.2126 * (cluster.rSum / cluster.count) + 
                     0.7152 * (cluster.gSum / cluster.count) + 
                     0.0722 * (cluster.bSum / cluster.count)
        }));

    // Фильтрация цветов
    const minDistance = 45;
    const palette = [];
    const blackThreshold = 30;

    // Добавляем самый тёмный цвет
    const darkColors = candidateColors
        .filter(c => c.luminance <= blackThreshold)
        .sort((a, b) => a.luminance - b.luminance);
    
    if (darkColors.length > 0) {
        palette.push(darkColors[0]);
    }

    // Основная фильтрация
    for (const color of candidateColors) {
        if (color.luminance <= blackThreshold) continue;
        
        const isUnique = !palette.some(existing => 
            colorDistance(existing, color) < minDistance
        );
        
        if (isUnique) {
            palette.push(color);
            if (palette.length >= 8) break;
        }
    }

    // Заполнение палитры при необходимости
    while (palette.length < 8) {
        const neutralValue = Math.floor(128 * (palette.length / 8));
        palette.push({
            r: neutralValue,
            g: neutralValue,
            b: neutralValue,
            luminance: neutralValue
        });
    }

    displayPalette(palette.slice(0, 8));
}
