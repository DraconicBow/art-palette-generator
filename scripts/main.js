document.getElementById('imageInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        const img = document.getElementById('preview');
        img.hidden = false;
        img.src = event.target.result;

        img.onload = function() {
            const colorThief = new ColorThief();
            const palette = colorThief.getPalette(img, 10); // 5 основных цветов
            displayPalette(palette);
        };
    };

    reader.readAsDataURL(file);
});

function displayPalette(colors) {
    const paletteDiv = document.getElementById('palette');
    paletteDiv.innerHTML = '';

    colors.forEach(color => {
        const colorBox = document.createElement('div');
        const rgb = `rgb(${color.join(',')})`;
        colorBox.className = 'color-box';
        colorBox.style.backgroundColor = rgb;
        
        // Отображение HEX-кода
        const hex = rgbToHex(...color);
        colorBox.innerHTML = `<small>${hex}</small>`;
        
        // Копирование в буфер обмена
        colorBox.addEventListener('click', () => {
            navigator.clipboard.writeText(hex);
            alert(`Скопировано: ${hex}`);
        });

        paletteDiv.appendChild(colorBox);
    });
}

// Конвертация RGB в HEX
function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}
