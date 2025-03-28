document.getElementById('imageInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    const img = document.getElementById('preview');
    
    reader.onload = function(event) {
        img.hidden = false;
        img.src = event.target.result;
        
        img.onload = async function() {
            try {
                await generatePalette(img);
            } catch (error) {
                console.error('Palette Error:', error);
            }
        };
    };
    reader.readAsDataURL(file);
});

async function generatePalette(img) {
    const paletteContainer = document.getElementById('palette');
    paletteContainer.innerHTML = '';

    // Используем актуальный синтаксис Vibrant.js
    const vibrant = new Vibrant(img);
    const palette = await vibrant.getPalette();
    
    // Получаем все доступные цветовые профили
    const colorSwatches = [
        palette.Vibrant,
        palette.Muted,
        palette.DarkVibrant,
        palette.DarkMuted,
        palette.LightVibrant,
        palette.LightMuted
    ];

    // Фильтруем пустые значения и создаем блоки
    colorSwatches.filter(swatch => swatch).forEach(swatch => {
        const colorBox = document.createElement('div');
        colorBox.className = 'color-box';
        colorBox.style.backgroundColor = swatch.hex;
        colorBox.textContent = swatch.hex;
        paletteContainer.appendChild(colorBox);
    });
}
