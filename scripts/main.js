document.getElementById('imageInput').addEventListener('change', function(e) {
    const reader = new FileReader();
    reader.onload = function(event) {
        const previewImg = document.getElementById('preview');
        previewImg.hidden = false;
        previewImg.src = event.target.result;

        const img = new Image();
        img.src = event.target.result;
        
        img.onload = function() {
            // Временная заглушка для теста
            const testColors = ['#FF0000', '#00FF00', '#0000FF'];
            displayPalette(testColors);
        };
    };
    reader.readAsDataURL(e.target.files[0]);
});

function displayPalette(colors) {
    const paletteDiv = document.getElementById('palette');
    paletteDiv.innerHTML = colors.map(color => `
        <div class="color-box" style="background: ${color}">
            <small>${color}</small>
        </div>
    `).join('');
}
