import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator.js';

export class Board {
    constructor(scene) {
        this.scene = scene;
        this.squares = []; // Array to store square meshes for highlighting
        this.group = new THREE.Group();
        this.createBoard();
        this.scene.add(this.group);
    }

    createBoard() {
        const squareSize = 2;
        const boardSize = squareSize * 8;
        const geometry = new THREE.BoxGeometry(squareSize, 0.5, squareSize);

        // Wood Materials
        const lightWoodTexture = TextureGenerator.createWoodTexture(true);
        const darkWoodTexture = TextureGenerator.createWoodTexture(false);

        const whiteMaterial = new THREE.MeshStandardMaterial({
            map: lightWoodTexture,
            color: 0xffffff,
            roughness: 0.5,
            metalness: 0.0,
            envMapIntensity: 0.5
        });
        const blackMaterial = new THREE.MeshStandardMaterial({
            map: darkWoodTexture,
            color: 0xffffff,
            roughness: 0.6,
            metalness: 0.0,
            envMapIntensity: 0.5
        });

        for (let x = 0; x < 8; x++) {
            for (let z = 0; z < 8; z++) {
                const isWhite = (x + z) % 2 === 0;
                const material = isWhite ? whiteMaterial : blackMaterial;

                // Clone material is CRITICAL for individual highlighting
                const square = new THREE.Mesh(geometry, material.clone());

                square.position.set(
                    (x * squareSize) - (boardSize / 2) + (squareSize / 2),
                    0,
                    (z * squareSize) - (boardSize / 2) + (squareSize / 2)
                );

                square.receiveShadow = true;

                square.userData = {
                    type: 'square',
                    file: String.fromCharCode(97 + x), // a-h
                    rank: z + 1, // 1-8
                    isWhite: isWhite,
                    originalColor: material.color.getHex(),
                    originalEmissive: material.emissive.getHex(),
                    originalEmissiveIntensity: material.emissiveIntensity
                };

                this.group.add(square);
                this.squares.push(square);
            }
        }

        // Glitchy/Dark Base
        const baseGeometry = new THREE.BoxGeometry(boardSize + 1, 0.4, boardSize + 1);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.1,
            metalness: 0.9
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = -0.45;
        base.receiveShadow = true;
        this.group.add(base);
    }

    highlightSquare(squareName, color = 0xffff00) {
        const square = this.getSquareByName(squareName);
        if (square) {
            square.material.color.setHex(color);
            square.material.emissive.setHex(color);
            square.material.emissiveIntensity = 0.8; // Make it glow bright
        }
    }

    resetHighlights() {
        this.squares.forEach(square => {
            square.material.color.setHex(square.userData.originalColor);
            square.material.emissive.setHex(square.userData.originalEmissive);
            square.material.emissiveIntensity = square.userData.originalEmissiveIntensity;
        });
    }

    getSquareByName(squareName) {
        const file = squareName[0];
        const rank = parseInt(squareName[1]);

        // Find square with matching file/rank
        return this.squares.find(s => s.userData.file === file && s.userData.rank === rank);
    }
}
