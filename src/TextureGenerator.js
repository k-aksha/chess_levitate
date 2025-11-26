import * as THREE from 'three';

export class TextureGenerator {
    static createMarbleTexture() {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // White base
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, size, size);

        // Veins
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = '#888888';
        ctx.lineWidth = 2;

        for (let i = 0; i < 20; i++) {
            ctx.beginPath();
            let x = Math.random() * size;
            let y = Math.random() * size;
            ctx.moveTo(x, y);

            for (let j = 0; j < 10; j++) {
                x += (Math.random() - 0.5) * 100;
                y += (Math.random() - 0.5) * 100;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        // Noise
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 10;
            data[i] += noise;
            data[i + 1] += noise;
            data[i + 2] += noise;
        }
        ctx.putImageData(imageData, 0, 0);

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    static createWoodTexture(isLight = false) {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Colors
        const baseColor = isLight ? '#deb887' : '#2f1b0c'; // Burlywood vs Dark Walnut
        const grainColor = isLight ? '#8b4513' : '#1a0f05'; // SaddleBrown vs Very Dark

        // Base
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, size, size);

        // Grain
        ctx.globalAlpha = 0.15;
        ctx.strokeStyle = grainColor;

        for (let i = 0; i < size; i += 2) {
            ctx.beginPath();
            ctx.moveTo(0, i);

            let y = i;
            for (let x = 0; x < size; x += 10) {
                y += (Math.random() - 0.5) * 2;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        // Knots
        for (let i = 0; i < 3; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const r = Math.random() * 20 + 5;

            const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
            gradient.addColorStop(0, grainColor);
            gradient.addColorStop(1, 'transparent');

            ctx.fillStyle = gradient;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
}
