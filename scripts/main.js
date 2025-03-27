function getMainColors(img, colorCount = 10) {
    console.log("Начало обработки изображения...");
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const maxSize = 250;
    const ratio = Math.min(maxSize / img.width, maxSize / img.height);
    canvas.width = img.width * ratio;
    canvas.height = img.height * ratio;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Проверка размера canvas
    console.log("Canvas размер:", canvas.width, "x", canvas.height);

    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    console.log("Всего пикселей:", pixels.length / 4);

    const colorStats = {};
    let skippedPixels = 0;

    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];

        if (a < 128) {
            skippedPixels++;
            continue;
        }

        // Логирование проблемных пикселей
        const [h, s, l] = rgbToHsl(r, g, b);
        if (s < 0.15 || l < 0.15 || l > 0.93) {
            skippedPixels++;
            continue;
        }

        const key = `${Math.round(r/32)*32},${Math.round(g/32)*32},${Math.round(b/32)*32}`;
        colorStats[key] = (colorStats[key] || 0) + 1;
    }

    console.log("Пропущено пикселей:", skippedPixels);
    console.log("Уникальные цвета до фильтрации:", Object.keys(colorStats));

    const uniqueColors = mergeSimilarColors(Object.keys(colorStats), 30);
    console.log("Уникальные цвета после объединения:", uniqueColors);

    return uniqueColors
        .slice(0, colorCount)
        .map(rgb => rgbToHex(...rgb.split(',').map(Number)));
}
