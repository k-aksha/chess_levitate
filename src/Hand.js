import * as THREE from 'three';
import gsap from 'gsap';
import { TextureGenerator } from './TextureGenerator.js';

export class Hand {
    constructor(scene) {
        this.scene = scene;
        this.mesh = this.createHandMesh();
        this.scene.add(this.mesh);

        this.holdingPiece = null;

        // Initial position above the board
        this.mesh.position.set(0, 5, 0);
    }

    createHandMesh() {
        const group = new THREE.Group();

        // Metallic Wood Material
        const woodTexture = TextureGenerator.createWoodTexture(false); // Dark wood
        const material = new THREE.MeshStandardMaterial({
            map: woodTexture,
            color: 0xffffff, // White
            roughness: 0.3, // Polished
            metalness: 0.5, // Very Metallic
            envMapIntensity: 1.0
        });

        // Palm
        const palmGeo = new THREE.BoxGeometry(1.5, 0.5, 1.5);
        const palm = new THREE.Mesh(palmGeo, material);
        group.add(palm);

        // Fingers (visual representation)
        const fingerGeo = new THREE.BoxGeometry(0.3, 0.3, 0.8);
        for (let i = -0.5; i <= 0.5; i += 0.5) {
            const finger = new THREE.Mesh(fingerGeo, material);
            finger.position.set(i * 1.2, -0.2, 0.8);
            finger.rotation.x = 0.5;
            group.add(finger);
        }

        // Thumb
        const thumb = new THREE.Mesh(fingerGeo, material);
        thumb.position.set(0.8, -0.2, 0);
        thumb.rotation.y = -0.5;
        thumb.rotation.z = -0.5;
        group.add(thumb);

        group.castShadow = true;
        return group;
    }

    moveTo(x, z, y = 2) {
        return new Promise(resolve => {
            gsap.to(this.mesh.position, {
                x: x,
                y: y,
                z: z,
                duration: 0.8,
                ease: "power2.inOut",
                onComplete: resolve
            });
        });
    }

    descend() {
        return new Promise(resolve => {
            gsap.to(this.mesh.position, {
                y: 1.5, // Lower height to grab
                duration: 0.3,
                ease: "power2.out",
                onComplete: resolve
            });
        });
    }

    ascend() {
        return new Promise(resolve => {
            gsap.to(this.mesh.position, {
                y: 4, // Lift height
                duration: 0.3,
                ease: "power2.in",
                onComplete: resolve
            });
        });
    }

    grab(piece) {
        this.holdingPiece = piece;
        // Attach piece to hand
        // We need to change the piece's parent to the hand so it moves with it
        // But we need to keep its world position correct first?
        // Simpler: just update piece position in update loop or manually move it

        // For now, let's just reparent visually or update position
        // Reparenting in Three.js can be tricky with transforms.
        // Let's just make the piece follow the hand in the Game loop or update its position here.

        // Actually, let's just child it to the hand group
        this.mesh.attach(piece.mesh);
    }

    release() {
        if (this.holdingPiece) {
            // Detach from hand and attach back to scene
            this.scene.attach(this.holdingPiece.mesh);
            this.holdingPiece = null;
        }
    }
}
