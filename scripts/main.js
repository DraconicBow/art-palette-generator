document.getElementById('imageInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = document.getElementById('preview');
        img.hidden = false;
        img.src = event.target.result;
        img.onload = function() {
            const palette = generateAdobeStylePalette(img);
            displayPalette(palette);
        };
    };
    reader.readAsDataURL(file);
});

function generateAdobeStylePalette(img, colorCount = 6) {
    // Этап 1: Анализ изображения
    const labColors = getDominantLabColors(img);
    
    // Этап 2: Кластеризация с учетом восприятия
    const clusters = kMeansLab(labColors, colorCount);
    
    // Этап 3: Применение цветовых гармоний
    const harmony = createColorHarmony(clusters);
    
    // Этап 4: Оптимизация палитры
    return optimizePalette(harmony);
}

// Преобразование RGB в Lab
function rgbToLab(r, g, b) {
    let [x, y, z] = rgbToXyz(r, g, b);
    [x, y, z] = [x / 95.047, y / 100.0, z / 108.883];
    
    const epsilon = 0.008856;
    const kappa = 903.3;
    
    const f = t => t > epsilon ? Math.cbrt(t) : (kappa * t + 16) / 116;
    
    const fx = f(x);
    const fy = f(y);
    const fz = f(z);
    
    return [
        Math.max(0, 116 * fy - 16),   // L
        500 * (fx - fy),              // a
        200 * (fy - fz)               // b
    ];
}

// K-средних в Lab-пространстве
function kMeansLab(colors, k, maxIter = 100) {
    // Инициализация центроидов
    let centroids = colors
        .sort(() => Math.random() - 0.5)
        .slice(0, k);

    for (let iter = 0; iter < maxIter; iter++) {
        // Назначение кластеров
        const clusters = Array(k).fill().map(() => []);
        colors.forEach(color => {
            let minDist = Infinity;
            let clusterIdx = 0;
            centroids.forEach((centroid, i) => {
                const dist = ciede2000(color, centroid);
                if (dist < minDist) {
                    minDist = dist;
                    clusterIdx = i;
                }
            });
            clusters[clusterIdx].push(color);
        });

        // Обновление центроидов
        const newCentroids = clusters.map(cluster => {
            if (cluster.length === 0) return centroids[Math.floor(Math.random() * k)];
            return cluster.reduce((acc, c) => [
                acc[0] + c[0],
                acc[1] + c[1],
                acc[2] + c[2]
            ], [0, 0, 0]).map(sum => sum / cluster.length);
        });

        if (centroids.every((c, i) => ciede2000(c, newCentroids[i]) < 1)) break;
        centroids = newCentroids;
    }
    return centroids;
}

// Создание цветовой гармонии (триадная схема)
function createColorHarmony(colors) {
    const harmonies = [];
    colors.forEach(color => {
        // Триадные цвета
        const [h, s, l] = labToHsl(color);
        const triad = [
            [h, s, l],
            [(h + 120) % 360, s, l],
            [(h + 240) % 360, s, l]
        ];
        harmonies.push(...triad);
    });
    return harmonies.slice(0, 6).map(hslToLab);
}

// Оптимизация палитры
function optimizePalette(colors) {
    // Фильтрация по контрасту и уникальности
    return colors
        .filter((color, i, arr) => 
            arr.findIndex(c => ciede2000(color, c) < 15) === i)
        .sort((a, b) => b[0] - a[0]) // Сортировка по яркости
        .slice(0, 6)
        .map(labToRgb);
}

// Вспомогательные функции
function getDominantLabColors(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const labColors = [];
    
    for (let i = 0; i < pixels.length; i += 16) { // Децимация
        const r = pixels[i];
        const g = pixels[i+1];
        const b = pixels[i+2];
        labColors.push(rgbToLab(r, g, b));
    }
    
    return labColors;
}

function displayPalette(colors) {
    const paletteDiv = document.getElementById('palette');
    paletteDiv.innerHTML = colors.map(color => {
        const hex = rgbToHex(...color);
        return `<div class="color-box" style="background:${hex}">${hex}</div>`;
    }).join('');
}

// Полные реализации преобразований и CIEDE2000 требуют больше кода
// Для простоты можно использовать библиотеки color-space и ciede2000
