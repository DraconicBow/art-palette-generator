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

        img.onerror = () => console.error('Ошибка загрузки изображения');
    };

    reader.onerror = () => console.error('Ошибка чтения файла');
    reader.readAsDataURL(file);
});

function getMainColors(img, colorCount = 10) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const colorStats = {};

    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const key = `${r},${g},${b}`;
        colorStats[key] = (colorStats[key] || 0) + 1;
    }

    return Object.entries(colorStats)
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
        paletteDiv.appendChild(colorBox);
    });
}

// Конвертация RGB в HEX (должна быть в коде!)
function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}
