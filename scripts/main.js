// Измененный JavaScript код
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

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16).padStart(2, '0');
        return hex;
    }).join('');
}

async function generatePalette(img) {
    const paletteContainer = document.getElementById('palette');
    paletteContainer.innerHTML = '';

    const colorThief = new ColorThief();
    let palette;
    
    try {
        // Получаем 6 основных цветов
        palette = colorThief.getPalette(img, 12);
    } catch (error) {
        console.error('Error extracting palette:', error);
        return;
    }

    // Фильтруем возможные null-значения и преобразуем в HEX
    palette.forEach(color => {
        if (!color) return;
        
        const hex = rgbToHex(...color);
        const colorBox = document.createElement('div');
        colorBox.className = 'color-box';
        colorBox.style.backgroundColor = hex;
        colorBox.textContent = hex;
        paletteContainer.appendChild(colorBox);
    });
}
