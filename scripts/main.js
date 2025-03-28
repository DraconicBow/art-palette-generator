document.getElementById('imageInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
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
    const paletteContainer = document.getElementById('palette');
    paletteContainer.innerHTML = ''; // Очистка предыдущей палитры

    // Используем Color Thief
    const colorThief = new ColorThief();
    const colorThiefPalette = colorThief.getPalette(img, 5); // 5 основных цветов

    // Используем Vibrant.js
    const vibrant = new Vibrant(img);
    vibrant.getSwatches((err, swatches) => {
        const vibrantPalette = Object.values(swatches)
            .filter(swatch => swatch)
            .map(swatch => swatch.getHex());

        // Комбинируем цвета из обеих библиотек и удаляем дубликаты
        const allColors = [
            ...colorThiefPalette.map(rgb => rgbToHex(rgb)),
            ...vibrantPalette
        ];
        
        const uniqueColors = [...new Set(allColors)].slice(0, 8); // Максимум 8 цветов

        // Отображаем палитру
        uniqueColors.forEach(color => {
            const colorBox = document.createElement('div');
            colorBox.className = 'color-box';
            colorBox.style.backgroundColor = color;
            colorBox.textContent = color;
            paletteContainer.appendChild(colorBox);
        });
    });
}

// Вспомогательная функция: RGB массив → HEX строка
function rgbToHex([r, g, b]) {
    return '#' + [r, g, b]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('');
}
