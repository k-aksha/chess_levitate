import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator.js';

export class Piece {
    constructor(type, color, scene) {
        this.type = type; // 'p', 'r', 'n', 'b', 'q', 'k'
        this.color = color; // 'w', 'b'
        this.scene = scene;
        this.mesh = this.createMesh();

        this.mesh.userData = {
            type: 'piece',
            pieceType: type,
            color: color,
            parentPiece: this
        };

        this.scene.add(this.mesh);
    }

    createMesh() {
        // Material Refinement: Wood and Marble

        let material;

        if (this.color === 'w') {
            // White Marble
            const marbleTexture = TextureGenerator.createMarbleTexture();
            material = new THREE.MeshStandardMaterial({
                map: marbleTexture,
                color: 0xffffff,
                roughness: 0.2, // Polished marble
                metalness: 0.1,
                envMapIntensity: 1.0
            });
        } else {
            // Black Wood
            const woodTexture = TextureGenerator.createWoodTexture();
            material = new THREE.MeshStandardMaterial({
                map: woodTexture,
                color: 0x222222, // Dark wood
                roughness: 0.7, // Wood is rougher
                metalness: 0.0,
                envMapIntensity: 0.5
            });
        }

        let geometry;
        const points = [];

        // Helper to create points for LatheGeometry
        // profile: array of [x, y]
        const createLathe = (profile) => {
            const points = profile.map(p => new THREE.Vector2(p[0], p[1]));
            return new THREE.LatheGeometry(points, 32);
        };

        // Scale factor
        const s = 0.35;

        switch (this.type) {
            case 'p': // Pawn
                geometry = createLathe([
                    [0.6 * s, 0], [0.6 * s, 0.5 * s], [0.4 * s, 1 * s], [0.2 * s, 2 * s], [0.3 * s, 2.5 * s], [0.1 * s, 3 * s], [0.4 * s, 3.5 * s], [0, 3.6 * s]
                ]);
                break;
            case 'r': // Rook
                geometry = createLathe([
                    [0.7 * s, 0], [0.7 * s, 0.5 * s], [0.5 * s, 1 * s], [0.5 * s, 3 * s], [0.7 * s, 3.5 * s], [0.7 * s, 4 * s], [0.4 * s, 4 * s], [0, 4 * s]
                ]);
                break;
            case 'n': // Knight (Simplified as Horse head approximation is hard with Lathe, using composed shapes or simplified abstract shape)
                // For a truly realistic knight without loading a model, we might need to combine shapes.
                // Let's stick to a stylized abstract knight for now using Lathe but with a distinct top.
                geometry = createLathe([
                    [0.7 * s, 0], [0.6 * s, 0.5 * s], [0.4 * s, 1.5 * s], [0.5 * s, 3 * s], [0.7 * s, 3.5 * s], [0.3 * s, 4.5 * s], [0, 4.5 * s]
                ]);
                // Add a "snout" box to distinguish it?
                // Keeping it simple lathe for now to ensure stability.
                break;
            case 'b': // Bishop
                geometry = createLathe([
                    [0.7 * s, 0], [0.6 * s, 0.5 * s], [0.3 * s, 2 * s], [0.3 * s, 3.5 * s], [0.5 * s, 4 * s], [0.1 * s, 4.8 * s], [0, 5 * s]
                ]);
                break;
            case 'q': // Queen
                geometry = createLathe([
                    [0.8 * s, 0], [0.7 * s, 0.5 * s], [0.4 * s, 1 * s], [0.3 * s, 4 * s], [0.6 * s, 5 * s], [0.6 * s, 5.5 * s], [0.2 * s, 5.8 * s], [0, 6 * s]
                ]);
                break;
            case 'k': // King
                geometry = createLathe([
                    [0.8 * s, 0], [0.7 * s, 0.5 * s], [0.4 * s, 1 * s], [0.3 * s, 4 * s], [0.6 * s, 5 * s], [0.6 * s, 5.5 * s], [0.4 * s, 6 * s], [0, 6.5 * s]
                ]);
                // Cross on top?
                break;
            default:
                geometry = new THREE.BoxGeometry(1, 1, 1);
        }

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Adjust pivot if needed, Lathe usually starts at y=0 if we defined points that way.
        // Our points start at y=0, so pivot is at bottom.

        return mesh;
    }

    setPosition(x, z) {
        // Board squares are 2 units wide.
        // Board is centered at 0,0.
        // Rank 1-8 -> z index 0-7.
        // File a-h -> x index 0-7.

        // Mapping from board index (0-7) to world position
        // Same logic as Board.js
        const squareSize = 2;
        const boardSize = squareSize * 8;

        const worldX = (x * squareSize) - (boardSize / 2) + (squareSize / 2);
        const worldZ = (z * squareSize) - (boardSize / 2) + (squareSize / 2);

        this.mesh.position.set(worldX, 0, worldZ);
    }

    animateTo(x, z) {
        // Placeholder for GSAP animation later
        this.setPosition(x, z);
    }
}
