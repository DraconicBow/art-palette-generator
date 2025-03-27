document.getElementById('imageInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = document.getElementById('preview');
        img.hidden = false;
        img.src = event.target.result;
        img.onload = function() {
            const palette = getPalette(img, 10);
            displayPalette(palette);
        };
    };
    reader.readAsDataURL(file);
});

class VBox {
    constructor(r1, r2, g1, g2, b1, b2, histo) {
        this.r1 = r1;
        this.r2 = r2;
        this.g1 = g1;
        this.g2 = g2;
        this.b1 = b1;
        this.b2 = b2;
        this.histo = histo;
        this._count = null;
        this._avg = null;
    }

    volume() {
        return (this.r2 - this.r1 + 1) * 
               (this.g2 - this.g1 + 1) * 
               (this.b2 - this.b1 + 1);
    }

    count() {
        if (this._count === null) {
            let count = 0;
            for (let r = this.r1; r <= this.r2; r++) {
                for (let g = this.g1; g <= this.g2; g++) {
                    for (let b = this.b1; b <= this.b2; b++) {
                        const index = (r << 10) + (g << 5) + b;
                        count += this.histo[index] || 0;
                    }
                }
            }
            this._count = count;
        }
        return this._count;
    }

    avg() {
        if (this._avg === null) {
            let ntot = 0, rsum = 0, gsum = 0, bsum = 0;
            
            for (let r = this.r1; r <= this.r2; r++) {
                for (let g = this.g1; g <= this.g2; g++) {
                    for (let b = this.b1; b <= this.b2; b++) {
                        const index = (r << 10) + (g << 5) + b;
                        const hval = this.histo[index] || 0;
                        ntot += hval;
                        rsum += hval * (r + 0.5) * 8;
                        gsum += hval * (g + 0.5) * 8;
                        bsum += hval * (b + 0.5) * 8;
                    }
                }
            }
            
            this._avg = ntot ? [
                Math.round(rsum / ntot),
                Math.round(gsum / ntot),
                Math.round(bsum / ntot)
            ] : [
                Math.round(8 * (this.r1 + this.r2 + 1) / 2),
                Math.round(8 * (this.g1 + this.g2 + 1) / 2),
                Math.round(8 * (this.b1 + this.b2 + 1) / 2)
            ];
        }
        return this._avg;
    }
}

function getPalette(img, colorCount = 10, quality = 10) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const scale = Math.min(300 / img.width, 300 / img.height);
    
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const pixelCount = canvas.width * canvas.height;
    
    const histo = new Array(32768).fill(0);
    
    // Построение гистограммы
    for (let i = 0; i < pixelCount; i += quality) {
        const offset = i * 4;
        const r = pixels[offset] >> 3;
        const g = pixels[offset + 1] >> 3;
        const b = pixels[offset + 2] >> 3;
        const a = pixels[offset + 3];
        
        if (a > 125 && !(r > 31 && g > 31 && b > 31)) {
            const index = (r << 10) + (g << 5) + b;
            histo[index]++;
        }
    }

    // Создание начального VBox
    let vboxes = [new VBox(0, 31, 0, 31, 0, 31, histo)];
    
    // Рекурсивное разделение
    const pq = [];
    pq.push({
        vbox: vboxes[0],
        priority: vboxes[0].count() * vboxes[0].volume()
    });

    while (pq.length < colorCount) {
        const vbox = pq.shift().vbox;
        if (!vbox.count()) continue;

        const [vbox1, vbox2] = splitVBox(vbox);
        pq.push({
            vbox: vbox1,
            priority: vbox1.count() * vbox1.volume()
        });
        pq.push({
            vbox: vbox2,
            priority: vbox2.count() * vbox2.volume()
        });
        pq.sort((a, b) => b.priority - a.priority);
    }

    // Генерация палитры
    const palette = pq
        .slice(0, colorCount)
        .map(item => item.vbox.avg())
        .sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]));

    // Добавление черного и белого при необходимости
    if (!palette.some(c => c[0] < 10 && c[1] < 10 && c[2] < 10)) {
        palette[0] = [0, 0, 0];
    }
    if (!palette.some(c => c[0] > 245 && c[1] > 245 && c[2] > 245)) {
        palette[palette.length - 1] = [255, 255, 255];
    }

    return palette;
}

function splitVBox(vbox) {
    const histo = vbox.histo;
    let maxRange, channel;

    // Определение канала для разделения
    const rRange = vbox.r2 - vbox.r1;
    const gRange = vbox.g2 - vbox.g1;
    const bRange = vbox.b2 - vbox.b1;
    
    maxRange = Math.max(rRange, gRange, bRange);
    if (maxRange === rRange) channel = 'r';
    else if (maxRange === gRange) channel = 'g';
    else channel = 'b';

    // Поиск медианы
    let total = 0;
    const partialSum = [];
    const [c1, c2] = channel === 'r' ? ['r1', 'r2'] :
                     channel === 'g' ? ['g1', 'g2'] : ['b1', 'b2'];

    for (let val = vbox[c1]; val <= vbox[c2]; val++) {
        let sum = 0;
        for (let i = vbox.r1; i <= vbox.r2; i++) {
            for (let j = vbox.g1; j <= vbox.g2; j++) {
                for (let k = vbox.b1; k <= vbox.b2; k++) {
                    if (channel === 'r' && i === val) {
                        sum += histo[(i << 10) + (j << 5) + k] || 0;
                    } else if (channel === 'g' && j === val) {
                        sum += histo[(i << 10) + (j << 5) + k] || 0;
                    } else if (channel === 'b' && k === val) {
                        sum += histo[(i << 10) + (j << 5) + k] || 0;
                    }
                }
            }
        }
        total += sum;
        partialSum[val] = total;
    }

    // Разделение
    const median = Math.floor(total / 2);
    let i = vbox[c1];
    while (i < vbox[c2] && partialSum[i] <= median) i++;

    const vbox1 = new VBox(...Object.values({...vbox, [c2]: i}));
    const vbox2 = new VBox(...Object.values({...vbox, [c1]: i + 1}));
    
    return [vbox1, vbox2];
}

function displayPalette(colors) {
    const paletteDiv = document.getElementById('palette');
    paletteDiv.innerHTML = '';
    
    colors.forEach(color => {
        const hex = rgbToHex(color[0], color[1], color[2]);
        const colorBox = document.createElement('div');
        colorBox.className = 'color-box';
        colorBox.style.backgroundColor = hex;
        colorBox.textContent = hex;
        paletteDiv.appendChild(colorBox);
    });
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('');
}
