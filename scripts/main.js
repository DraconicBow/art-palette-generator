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

    // Создаем экземпляр Vibrant
    const vibrant = new Vibrant(img);
    
    // Получаем все цветовые профили
    vibrant.getSwatches((err, swatches) => {
        if (err) {
            console.error('Ошибка анализа цветов:', err);
            return;
        }

        // Собираем все доступные цвета
        const colors = [];
        for (const swatchName in swatches) {
            const swatch = swatches[swatchName];
            if (swatch) {
                colors.push({
                    hex: swatch.getHex(),
                    population: swatch.getPopulation() // "Вес" цвета
                });
            }
        }

        // Сортируем цвета по популярности и выбираем топ-6
        const sortedColors = colors
            .sort((a, b) => b.population - a.population)
            .slice(0, 6)
            .map(c => c.hex);

        // Отображаем палитру
        sortedColors.forEach(color => {
            const colorBox = document.createElement('div');
            colorBox.className = 'color-box';
            colorBox.style.backgroundColor = color;
            colorBox.textContent = color;
            paletteContainer.appendChild(colorBox);
        });
    });
}
