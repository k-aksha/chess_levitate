import { SceneManager } from './SceneManager.js';
import { Board } from './Board.js';
import { Piece } from './Piece.js';
import { Hand } from './Hand.js';
import { AudioManager } from './AudioManager.js';
import { Chess } from 'chess.js';
import * as THREE from 'three';

export class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.sceneManager = new SceneManager(this.canvas);

        this.audioManager = new AudioManager();

        this.board = new Board(this.sceneManager.scene);
        this.chess = new Chess();
        this.pieces = new Map(); // Map 'square' (e.g., "e2") -> Piece instance

        this.hand = new Hand(this.sceneManager.scene);

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.selectedPiece = null;
        this.isMoving = false; // Lock interaction while hand is moving
        this.promotionPending = null; // Store move details while waiting for promotion choice

        this.clock = new THREE.Clock();

        this.promotionModal = document.getElementById('promotion-modal');
        this.setupPromotionUI();

        this.initPieces();
        this.setupInteraction();
        this.render();
    }

    setupPromotionUI() {
        const buttons = this.promotionModal.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                this.handlePromotionChoice(type);
            });
        });
    }

    initPieces() {
        const boardState = this.chess.board();

        boardState.forEach((row, rowIndex) => {
            row.forEach((square, colIndex) => {
                if (square) {
                    const piece = new Piece(square.type, square.color, this.sceneManager.scene);
                    const x = colIndex;
                    const z = 7 - rowIndex;
                    piece.setPosition(x, z);

                    // Add physics body to piece (static for now until moved?)
                    // Or maybe we don't add physics bodies yet, only when they fall?
                    // Let's add them but set them to kinematic or sleep them?
                    // For simplicity, let's just use physics for the "drop" effect later.

                    const squareName = this.getSquareName(x, z);
                    this.pieces.set(squareName, piece);
                }
            });
        });
    }

    getSquareName(x, z) {
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const rank = z + 1;
        return `${files[x]}${rank}`;
    }

    getSquareCoords(squareName) {
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const file = squareName[0];
        const rank = parseInt(squareName[1]);
        const x = files.indexOf(file);
        const z = rank - 1;
        return { x, z };
    }

    setupInteraction() {
        window.addEventListener('click', (event) => this.onClick(event));
        window.addEventListener('mousemove', (event) => this.onMouseMove(event));

        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
    }

    resetGame() {
        // Remove all pieces
        this.pieces.forEach(piece => {
            this.sceneManager.scene.remove(piece.mesh);
        });
        this.pieces.clear();

        // Reset chess logic
        this.chess.reset();

        // Re-init pieces
        this.initPieces();
        this.updateGameStatus();

        this.selectedPiece = null;
        this.hoveredPiece = null;
        this.isMoving = false;

        // Reset hand position
        this.hand.mesh.position.set(0, 5, 0);
        this.board.resetHighlights();
    }

    onMouseMove(event) {
        if (this.isMoving) return;

        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);

        const intersects = this.raycaster.intersectObjects(this.sceneManager.scene.children, true);

        let foundPiece = null;

        if (intersects.length > 0) {
            // Traverse up to find the root object with userData
            let object = intersects[0].object;
            while (object.parent && !object.userData.type) {
                object = object.parent;
            }

            if (object.userData.type === 'piece') {
                foundPiece = object.userData.parentPiece;
            }
        }

        if (this.hoveredPiece !== foundPiece) {
            // Unhighlight previous
            if (this.hoveredPiece) {
                this.setPieceEmissive(this.hoveredPiece, 0x000000, 0);
            }

            this.hoveredPiece = foundPiece;

            // Highlight new
            if (this.hoveredPiece) {
                // Glow color based on piece color or generic?
                // Let's use a subtle gold glow for all
                this.setPieceEmissive(this.hoveredPiece, 0xffd700, 0.3);
            }
        }
    }

    setPieceEmissive(piece, color, intensity) {
        if (piece && piece.mesh) {
            piece.mesh.traverse((child) => {
                if (child.isMesh && child.material) {
                    // Clone material if not already unique to avoid affecting all pieces of same type
                    // But Piece.js creates unique materials per piece instance now? 
                    // Wait, Piece.js creates new Material instance in createMesh, so it is unique per piece.
                    // So we can modify it directly.

                    child.material.emissive.setHex(color);
                    child.material.emissiveIntensity = intensity;
                }
            });
        }
    }

    onClick(event) {
        if (this.isMoving) return;

        // Calculate mouse position in normalized device coordinates
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);

        const intersects = this.raycaster.intersectObjects(this.sceneManager.scene.children, true);

        if (intersects.length > 0) {
            const object = intersects[0].object;

            // Check if we clicked a piece or a square
            if (object.userData.type === 'piece') {
                this.handlePieceClick(object.userData.parentPiece);
            } else if (object.userData.type === 'square') {
                this.handleSquareClick(object.userData);
            }
        }
    }

    async handlePieceClick(piece) {
        // If we already have a selected piece, and we click another piece
        if (this.selectedPiece) {
            // If it's the same piece, maybe deselect?
            if (this.selectedPiece === piece) {
                this.selectedPiece = null;
                this.board.resetHighlights();
                return;
            }

            // If it's an enemy piece, it might be a capture move
            // We'll handle this in handleSquareClick logic effectively by checking valid moves
            // But we need to know the square of this piece
            // For now, let's just select the new piece if it belongs to the current turn
            if (piece.color === this.chess.turn()) {
                this.selectedPiece = piece;
                this.audioManager.playSelectSound();
                this.highlightValidMoves(piece);
                console.log('Selected:', piece);
            } else {
                // Clicked enemy piece, try to capture
                // We need to find the square this piece is on
                const square = this.findPieceSquare(piece);
                if (square) {
                    await this.attemptMove(square);
                }
            }
        } else {
            // Select piece if it's their turn
            if (piece.color === this.chess.turn()) {
                this.selectedPiece = piece;
                this.audioManager.playSelectSound();
                this.highlightValidMoves(piece);
                console.log('Selected:', piece);
            }
        }
    }

    highlightValidMoves(piece) {
        this.board.resetHighlights();
        const square = this.findPieceSquare(piece);
        if (square) {
            // Highlight selected piece square
            this.board.highlightSquare(square, 0x00ff00); // Green for selected

            // Highlight valid moves
            const moves = this.chess.moves({ square: square, verbose: true });
            moves.forEach(move => {
                const color = move.flags.includes('c') ? 0xff0000 : 0xffff00; // Red for capture, Yellow for move
                this.board.highlightSquare(move.to, color);
            });
        }
    }

    async handleSquareClick(squareData) {
        if (!this.selectedPiece) return;

        const targetSquare = `${squareData.file}${squareData.rank}`;
        await this.attemptMove(targetSquare);
    }

    findPieceSquare(piece) {
        for (const [square, p] of this.pieces) {
            if (p === piece) return square;
        }
        return null;
    }

    async attemptMove(targetSquare) {
        const sourceSquare = this.findPieceSquare(this.selectedPiece);
        if (!sourceSquare) return;

        try {
            // Check for promotion
            const moveOptions = this.chess.moves({ verbose: true });
            const promotionMove = moveOptions.find(m =>
                m.from === sourceSquare &&
                m.to === targetSquare &&
                m.flags.includes('p')
            );

            if (promotionMove) {
                // It's a promotion! Show modal
                this.promotionPending = { from: sourceSquare, to: targetSquare };
                this.promotionModal.classList.remove('hidden');
                return;
            }

            const move = this.chess.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: 'q' // Default fallback
            });

            if (move) {
                this.isMoving = true;
                this.board.resetHighlights();
                await this.animateMove(move, this.selectedPiece);
                this.isMoving = false;
                this.selectedPiece = null;
                this.updateGameStatus();
            }
        } catch (e) {
            console.log('Invalid move', e);
        }
    }

    async handlePromotionChoice(promotionType) {
        if (!this.promotionPending) return;

        this.promotionModal.classList.add('hidden');

        const move = this.chess.move({
            from: this.promotionPending.from,
            to: this.promotionPending.to,
            promotion: promotionType
        });

        this.promotionPending = null;

        if (move) {
            this.isMoving = true;
            this.board.resetHighlights();
            await this.animateMove(move, this.selectedPiece);
            this.isMoving = false;
            this.selectedPiece = null;
            this.updateGameStatus();
        }
    }

    async animateMove(move, piece) {
        // 1. Move Hand to Piece
        const sourceCoords = this.getSquareCoords(move.from);
        const sourcePos = this.getWorldPosition(sourceCoords.x, sourceCoords.z);

        await this.hand.moveTo(sourcePos.x, sourcePos.z);
        await this.hand.descend();

        // 2. Grab Piece
        this.hand.grab(piece);
        await this.hand.ascend();

        // 3. Move Hand to Target
        const targetCoords = this.getSquareCoords(move.to);
        const targetPos = this.getWorldPosition(targetCoords.x, targetCoords.z);

        await this.hand.moveTo(targetPos.x, targetPos.z);
        await this.hand.descend();

        // 4. Release Piece
        this.hand.release();
        piece.setPosition(targetCoords.x, targetCoords.z); // Snap to exact grid

        // Handle Capture (Remove captured piece if any)
        if (move.captured) {
            // The captured piece is at 'to' square (unless en passant)
            // But we just moved our piece there.
            // Wait, we need to remove the captured piece BEFORE placing ours? 
            // Or just hide it.
            // We need to find the piece that WAS at targetSquare.
            // Since we haven't updated this.pieces map yet, the old piece is still there.

            const capturedPiece = this.pieces.get(move.to);
            if (capturedPiece) {
                this.sceneManager.scene.remove(capturedPiece.mesh);
                this.audioManager.playCaptureSound();
                // TODO: Add physics impulse to captured piece?
            }
        } else {
            this.audioManager.playMoveSound();
        }

        await this.hand.ascend();

        // Update internal state
        this.pieces.delete(move.from);
        this.pieces.set(move.to, piece);

        // Handle Promotion Visuals
        if (move.flags.includes('p')) {
            // Remove old pawn mesh
            this.sceneManager.scene.remove(piece.mesh);

            // Create new piece mesh
            const newPiece = new Piece(move.promotion, move.color, this.sceneManager.scene);
            const coords = this.getSquareCoords(move.to);
            newPiece.setPosition(coords.x, coords.z);

            // Update map
            this.pieces.set(move.to, newPiece);
        }
    }

    getWorldPosition(x, z) {
        const squareSize = 2;
        const boardSize = squareSize * 8;
        const worldX = (x * squareSize) - (boardSize / 2) + (squareSize / 2);
        const worldZ = (z * squareSize) - (boardSize / 2) + (squareSize / 2);
        return { x: worldX, z: worldZ };
    }

    updateGameStatus() {
        const statusEl = document.getElementById('game-status');
        if (this.chess.isCheckmate()) {
            statusEl.innerText = `Checkmate! ${this.chess.turn() === 'w' ? 'Black' : 'White'} wins!`;
        } else if (this.chess.isDraw()) {
            statusEl.innerText = 'Draw!';
        } else {
            statusEl.innerText = `${this.chess.turn() === 'w' ? "White's" : "Black's"} Turn`;
        }
    }

    render() {
        requestAnimationFrame(() => this.render());
        const dt = this.clock.getDelta();
        this.sceneManager.update();
    }
}
