document.getElementById('imageInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        const previewImg = document.getElementById('preview');
        previewImg.hidden = false;
        previewImg.src = event.target.result;

        const img = new Image();
        img.src = event.target.result;
        
        img.onload = function() {
            const palette = getMainColors(img, 5); // 5 основных цветов
            displayPalette(palette);
        };
    };

    reader.readAsDataURL(file);
});

function getMainColors(img, colorCount = 5) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Уменьшаем изображение для оптимизации
    const maxSize = 150;
    const ratio = Math.min(maxSize / img.width, maxSize / img.height);
    canvas.width = img.width * ratio;
    canvas.height = img.height * ratio;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Получаем данные пикселей
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const colorStats = {};

    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];

        // Фильтрация: пропускаем прозрачные и серые цвета
        if (a < 128) continue;
        if (Math.abs(r - g) < 30 && Math.abs(g - b) < 30) continue;

        // Группировка цветов с шагом 64
        const key = `${Math.round(r/64)*64},${Math.round(g/64)*64},${Math.round(b/64)*64}`;
        colorStats[key] = (colorStats[key] || 0) + 1;
    }

    // Фильтрация по минимальной частоте (2%)
    const totalPixels = canvas.width * canvas.height;
    const filtered = Object.entries(colorStats)
        .filter(([_, count]) => count / totalPixels > 0.02);

    // Сортировка и выбор топ-N цветов
    return filtered
        .sort((a, b) => b[1] - a[1])
        .slice(0, colorCount)
        .map(([rgb]) => rgbToHex(...rgb.split(',').map(Number)));
}

function displayPalette(colors) {
    const paletteDiv = document.getElementById('palette');
    paletteDiv.innerHTML = '';
    
    colors.forEach(hex => {
        const colorBox = document.createElement('div');
        colorBox.className = 'color-box';
        colorBox.style.backgroundColor = hex;
        colorBox.innerHTML = `<small>${hex}</small>`;
        
        colorBox.addEventListener('click', () => {
            navigator.clipboard.writeText(hex);
            alert(`Скопировано: ${hex}`);
        });
        
        paletteDiv.appendChild(colorBox);
    });
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}
