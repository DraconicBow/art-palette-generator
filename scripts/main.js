document.getElementById('imageInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    const img = document.getElementById('preview');
    
    reader.onload = function(event) {
        img.hidden = false;
        img.src = event.target.result;
        
        // Важно: Ждем полной загрузки изображения
        img.onload = function() {
            generatePalette(img);
        };
        img.onerror = () => console.error("Ошибка загрузки изображения");
    };
    reader.readAsDataURL(file);
});

function generatePalette(img) {
    const paletteContainer = document.getElementById('palette');
    paletteContainer.innerHTML = ''; // Очищаем контейнер

    // Убедимся, что изображение загружено
    if (!img.complete || img.naturalWidth === 0) {
        console.error("Изображение не загружено");
        return;
    }

    try {
        const vibrant = new Vibrant(img);
        vibrant.getSwatches((err, swatches) => {
            if (err) {
                console.error("Vibrant.js Error:", err);
                return;
            }

            console.log("Полученные цвета:", swatches); // Для отладки

            const colors = [];
            for (const key in swatches) {
                if (swatches[key]) {
                    colors.push({
                        hex: swatches[key].getHex(),
                        population: swatches[key].getPopulation()
                    });
                }
            }

            if (colors.length === 0) {
                console.warn("Не найдено цветов в изображении");
                return;
            }

            // Сортируем и выбираем цвета
            const sortedColors = colors
                .sort((a, b) => b.population - a.population)
                .slice(0, 6)
                .map(c => c.hex);

            console.log("Отображаемые цвета:", sortedColors); // Для отладки

            // Создаем цветовые блоки
            sortedColors.forEach(hex => {
                const colorBox = document.createElement('div');
                colorBox.className = 'color-box';
                colorBox.style.backgroundColor = hex;
                colorBox.textContent = hex;
                paletteContainer.appendChild(colorBox);
            });
        });
    } catch (error) {
        console.error("Ошибка в generatePalette:", error);
    }
}
