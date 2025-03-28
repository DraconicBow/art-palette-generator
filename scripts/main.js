document.getElementById('imageInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = document.getElementById('preview');
        img.hidden = false;
        img.src = event.target.result;
        img.onload = function() {
            const palette = generateMosaicPalette(img, 40, 10);
            displayPalette(palette);
        };
    };
    reader.readAsDataURL(file);
});

function generateMosaicPalette(img, cellSize = 20, colorCount = 10) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Рассчитываем размеры мозаики
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    // Собираем цвета мозаики
    const mosaicColors = [];
    
    // Проходим по всем ячейкам мозаики
    for (let y = 0; y < canvas.height; y += cellSize) {
        for (let x = 0; x < canvas.width; x += cellSize) {
            // Размеры текущей ячейки
            const cellWidth = Math.min(cellSize, canvas.width - x);
            const cellHeight = Math.min(cellSize, canvas.height - y);
            
            // Собираем пиксели ячейки
            let r = 0, g = 0, b = 0, count = 0;
            
            for (let cy = 0; cy < cellHeight; cy++) {
                for (let cx = 0; cx < cellWidth; cx++) {
                    const px = ((y + cy) * canvas.width + (x + cx)) * 4;
                    const alpha = pixels[px + 3];
                    
                    if (alpha > 128) { // Игнорируем полупрозрачные
                        r += pixels[px];
                        g += pixels[px + 1];
                        b += pixels[px + 2];
                        count++;
                    }
                }
            }
            
            if (count > 0) {
                const avgColor = [
                    Math.round(r / count),
                    Math.round(g / count),
                    Math.round(b / count)
                ];
                mosaicColors.push(avgColor);
            }
        }
    }
    
    // Кластеризуем цвета
    return clusterColors(mosaicColors, colorCount);
}

function clusterColors(colors, maxColors) {
    const colorMap = new Map();
    
    // Группируем цвета в кубы 32x32x32
    colors.forEach(color => {
        const key = `${Math.floor(color[0]/32)},${Math.floor(color[1]/32)},${Math.floor(color[2]/32)}`;
        
        if (!colorMap.has(key)) {
            colorMap.set(key, { 
                r: color[0], 
                g: color[1], 
                b: color[2], 
                count: 1 
            });
        } else {
            const cluster = colorMap.get(key);
            cluster.r += color[0];
            cluster.g += color[1];
            cluster.b += color[2];
            cluster.count++;
        }
    });
    
    // Получаем усредненные цвета кластеров
    const clustered = Array.from(colorMap.values()).map(cluster => ({
        r: Math.round(cluster.r / cluster.count),
        g: Math.round(cluster.g / cluster.count),
        b: Math.round(cluster.b / cluster.count),
        count: cluster.count
    }));
    
    // Сортируем по частоте и выбираем топовые
    return clustered
        .sort((a, b) => b.count - a.count)
        .slice(0, maxColors)
        .map(c => [c.r, c.g, c.b]);
}

function displayPalette(colors) {
    const paletteDiv = document.getElementById('palette');
    paletteDiv.innerHTML = '';
    
    colors.forEach(color => {
        const hex = rgbToHex(color[0], color[1], color[2]);
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
