import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class SceneManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.screenDimensions = {
            width: canvas.width,
            height: canvas.height
        };

        this.scene = this.buildScene();
        this.renderer = this.buildRenderer(this.screenDimensions);
        this.camera = this.buildCamera(this.screenDimensions);
        this.controls = this.buildControls();

        this.createLights();

        this.onWindowResize();
        window.addEventListener('resize', () => this.onWindowResize());
    }

    buildScene() {
        const scene = new THREE.Scene();
        // Golden Hour Background (Deep Warm Purple/Orange gradient feel)
        scene.background = new THREE.Color('#220011');
        scene.fog = new THREE.FogExp2(0x220011, 0.015);

        // Add Starfield
        const starsGeometry = new THREE.BufferGeometry();
        const starsCount = 2000;
        const posArray = new Float32Array(starsCount * 3);

        for (let i = 0; i < starsCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 100; // Spread stars in a 100x100x100 box
        }

        starsGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

        const starsMaterial = new THREE.PointsMaterial({
            size: 0.1,
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
        });

        const starsMesh = new THREE.Points(starsGeometry, starsMaterial);
        scene.add(starsMesh);

        return scene;
    }

    buildRenderer({ width, height }) {
        const renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        const DPR = (window.devicePixelRatio) ? window.devicePixelRatio : 1;
        renderer.setPixelRatio(DPR);
        renderer.setSize(width, height);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        return renderer;
    }

    buildCamera({ width, height }) {
        const aspectRatio = width / height;
        const fieldOfView = 60;
        const nearPlane = 0.1;
        const farPlane = 1000;
        const camera = new THREE.PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane);

        camera.position.set(0, 10, 10);
        camera.lookAt(0, 0, 0);

        return camera;
    }

    buildControls() {
        const controls = new OrbitControls(this.camera, this.renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        // Zoom Settings
        controls.enableZoom = true;
        controls.zoomSpeed = 1.5; // Faster zoom
        controls.minDistance = 2; // Allow getting closer
        controls.maxDistance = 50; // Allow getting further away

        // Pan Settings
        controls.enablePan = true;
        controls.screenSpacePanning = false; // Pan orthogonal to camera

        return controls;
    }

    createLights() {
        // Golden Hour Setup

        // 1. Hemisphere Light (Sky/Ground ambience)
        // Sky: Deep Purple/Blue, Ground: Warm Orange/Brown
        const hemiLight = new THREE.HemisphereLight(0x5533ff, 0x884400, 0.4);
        this.scene.add(hemiLight);

        // 2. Sun Light (Key)
        // Low angle, warm golden color, long shadows
        const sunLight = new THREE.DirectionalLight(0xffaa00, 1.5);
        sunLight.position.set(30, 10, 10); // Low angle from side
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.bias = -0.0001;
        sunLight.shadow.radius = 4; // Soften shadows

        // Increase shadow camera size for long shadows
        const d = 20;
        sunLight.shadow.camera.left = -d;
        sunLight.shadow.camera.right = d;
        sunLight.shadow.camera.top = d;
        sunLight.shadow.camera.bottom = -d;

        this.scene.add(sunLight);

        // 3. Warm Fill
        const fillLight = new THREE.PointLight(0xffcc88, 0.5);
        fillLight.position.set(-10, 5, 10);
        this.scene.add(fillLight);
    }

    onWindowResize() {
        const { width, height } = this.canvas.parentElement.getBoundingClientRect();
        this.screenDimensions.width = width;
        this.screenDimensions.height = height;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }

    update() {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}
