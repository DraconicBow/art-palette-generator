document.getElementById('imageInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = function(event) {
        const previewImg = document.getElementById('preview');
        previewImg.hidden = false;
        previewImg.src = event.target.result;

        const img = new Image();
        img.src = event.target.result;
        
        img.onload = function() {
            const palette = getMainColors(img, 10);
            displayPalette(palette);
        };
    };

    reader.readAsDataURL(file);
});

function displayPalette(colors) {
    const paletteDiv = document.getElementById('palette');
    paletteDiv.innerHTML = '';
    
    colors.forEach(hex => {
        const colorBox = document.createElement('div');
        colorBox.className = 'color-box';
        colorBox.style.backgroundColor = hex;
        colorBox.innerHTML = `<small>${hex}</small>`;
        paletteDiv.appendChild(colorBox);
    });
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

// НОВАЯ ВЕРСИЯ ФУНКЦИИ GETMAINCOLORS
function getMainColors(img, colorCount = 10) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
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

        if (a < 128) continue;

        const [h, s, l] = rgbToHsl(r, g, b);
        
        // Условия фильтрации
        if (l > 0.85 || s < 0.3) continue;

        // Группировка цветов
        const key = `${Math.round(r/24)*24},${Math.round(g/24)*24},${Math.round(b/24)*24}`;
        colorStats[key] = (colorStats[key] || 0) + 1;
    }

    return Object.entries(colorStats)
        .sort((a, b) => {
            const [r1, g1, b1] = a[0].split(',').map(Number);
            const [r2, g2, b2] = b[0].split(',').map(Number);
            const hsl1 = rgbToHsl(r1, g1, b1);
            const hsl2 = rgbToHsl(r2, g2, b2);
            
            // Исправленная сортировка
            const scoreA = hsl1[1] * 100 + (50 - Math.abs(hsl1[2] * 100 - 50));
            const scoreB = hsl2[1] * 100 + (50 - Math.abs(hsl2[2] * 100 - 50));
            return scoreB - scoreA; // Было scoreB - scoreB (ошибка)
        })
        .slice(0, colorCount)
        .map(([rgb]) => rgbToHex(...rgb.split(',').map(Number)));
}

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
