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
    const TARGET_COLORS = 10;
    
    // Масштабирование изображения
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

    // Анализ цветов
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const colorStats = {};

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        if (a < 128) continue;

        // Оригинальная группировка в кубы 32x32x32
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

    // Подготовка цветов
    const colors = Object.values(colorStats)
        .sort((a, b) => b.count - a.count)
        .slice(0, 30) // Увеличили количество кандидатов
        .map(cube => ({
            r: Math.round(cube.r / cube.count),
            g: Math.round(cube.g / cube.count),
            b: Math.round(cube.b / cube.count)
        }));

    // Фильтрация цветов
    const minDistance = 50;
    const uniqueColors = [];
    
    // Автоматическое добавление темного цвета
    const darkColors = colors.filter(c => (c.r + c.g + c.b) < 150);
    if (darkColors.length > 0) {
        uniqueColors.push(darkColors[0]);
    }

    // Основной отбор
    for (const color of colors) {
        if (uniqueColors.length >= TARGET_COLORS) break;
        
        const isUnique = !uniqueColors.some(existing => 
            colorDistance(existing, color) < minDistance
        );
        
        if (isUnique) {
            uniqueColors.push(color);
        }
    }

    // Заполнение недостающих цветов
    while (uniqueColors.length < TARGET_COLORS) {
        const grayValue = Math.floor(255 * (uniqueColors.length / TARGET_COLORS));
        uniqueColors.push({ r: grayValue, g: grayValue, b: grayValue });
    }

    displayPalette(uniqueColors.slice(0, TARGET_COLORS));
}

function colorDistance(c1, c2) {
    const dr = c1.r - c2.r;
    const dg = c1.g - c2.g;
    const db = c1.b - c2.b;
    return Math.sqrt(dr*dr + dg*dg + db*db);
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
