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
