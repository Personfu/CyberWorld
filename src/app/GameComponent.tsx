'use client';
import { useEffect, useRef, useState } from 'react';
import type { Game } from 'phaser';
import styles from './cyber.module.css';

export default function GameComponent() {
    const gameRef = useRef<Game | null>(null);
    const [score, setScore] = useState(0);

    useEffect(() => {
        async function initPhaser() {
            const Phaser = (await import('phaser')).default;
            const { io } = await import('socket.io-client');

            const config: Phaser.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                parent: 'phaser-game',
                width: 1000,
                height: 600,
                backgroundColor: '#050505',
                physics: {
                    default: 'arcade',
                    arcade: {
                        debug: false,
                        gravity: { y: 0, x: 0 }
                    }
                },
                scene: {
                    preload: preload,
                    create: create,
                    update: update
                }
            };

            if (!gameRef.current) {
                gameRef.current = new Phaser.Game(config);
            }

            function preload(this: Phaser.Scene) {
                // We will generate textures programmatically for that true cyberpunk feel
            }

            function create(this: Phaser.Scene) {
                const self = this as any;
                self.socket = io();

                // Cyber Grid Background
                const gridGraphics = self.add.graphics();
                gridGraphics.lineStyle(2, 0x00ffcc, 0.1);
                for (let i = 0; i < 3000; i += 50) {
                    gridGraphics.moveTo(-1000, i - 1000);
                    gridGraphics.lineTo(2000, i - 1000);
                    gridGraphics.moveTo(i - 1000, -1000);
                    gridGraphics.lineTo(i - 1000, 2000);
                }
                gridGraphics.strokePath();

                self.otherPlayers = self.add.group();
                self.dataNodes = self.add.group();

                self.socket.on('currentPlayers', (players: any) => {
                    Object.keys(players).forEach((id) => {
                        if (players[id].playerId === self.socket.id) {
                            addPlayer(self, players[id]);
                            setScore(players[id].score);
                        } else {
                            addOtherPlayers(self, players[id]);
                        }
                    });
                });

                self.socket.on('dataNodes', (nodes: any) => {
                    self.dataNodes.clear(true, true);
                    Object.keys(nodes).forEach((id) => {
                        const node = nodes[id];
                        const n = self.add.circle(node.x, node.y, 8, 0xff0055);
                        n.nodeId = node.id;
                        self.physics.add.existing(n);
                        self.dataNodes.add(n);
                        // Pulsing tween
                        self.tweens.add({
                            targets: n,
                            scaleX: 1.5,
                            scaleY: 1.5,
                            alpha: 0.5,
                            duration: 500,
                            yoyo: true,
                            repeat: -1
                        });
                    });
                });

                self.socket.on('newPlayer', (playerInfo: any) => {
                    addOtherPlayers(self, playerInfo);
                });

                self.socket.on('disconnectPlayer', (playerId: string) => {
                    self.otherPlayers.getChildren().forEach((otherPlayer: any) => {
                        if (playerId === otherPlayer.playerId) {
                            otherPlayer.destroy();
                        }
                    });
                });

                self.socket.on('playerMoved', (playerInfo: any) => {
                    self.otherPlayers.getChildren().forEach((otherPlayer: any) => {
                        if (playerInfo.playerId === otherPlayer.playerId) {
                            otherPlayer.setPosition(playerInfo.x, playerInfo.y);
                            otherPlayer.setRotation(playerInfo.rotation);
                        }
                    });
                });

                self.socket.on('nodeCollected', (data: any) => {
                    self.dataNodes.getChildren().forEach((n: any) => {
                        if (n.nodeId === data.nodeId) {
                            // Explosion effect
                            const particles = self.add.particles(n.x, n.y, 'flare', {
                                speed: { min: -100, max: 100 },
                                angle: { min: 0, max: 360 },
                                scale: { start: 1, end: 0 },
                                blendMode: 'ADD',
                                active: true,
                                lifespan: 300,
                                gravityY: 0
                            });
                            n.destroy();
                        }
                    });
                    if (data.playerId === self.socket.id) {
                        setScore(data.newScore);
                    }
                });

                self.cursors = self.input.keyboard.createCursorKeys();
                self.wKey = self.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
                self.aKey = self.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
                self.sKey = self.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
                self.dKey = self.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
            }

            function addPlayer(self: any, playerInfo: any) {
                // Player is a neon triangle indicating direction
                self.ship = self.add.triangle(playerInfo.x, playerInfo.y, 0, -20, -15, 15, 15, 15, playerInfo.faction === 'cyber' ? 0x00ffcc : 0xff00ff);
                self.physics.add.existing(self.ship);
                self.ship.body.setDrag(100);
                self.ship.body.setAngularDrag(100);
                self.ship.body.setMaxVelocity(400);

                self.cameras.main.startFollow(self.ship);

                // Setup collision with nodes
                self.physics.add.overlap(self.ship, self.dataNodes, (ship: any, node: any) => {
                    self.socket.emit('collectNode', node.nodeId);
                    node.destroy();
                }, undefined, self);
            }

            function addOtherPlayers(self: any, playerInfo: any) {
                const otherPlayer = self.add.triangle(playerInfo.x, playerInfo.y, 0, -20, -15, 15, 15, 15, playerInfo.faction === 'cyber' ? 0x00ffcc : 0xff00ff);
                self.physics.add.existing(otherPlayer);
                otherPlayer.setOrigin(0.5, 0.5);
                otherPlayer.playerId = playerInfo.playerId;
                self.otherPlayers.add(otherPlayer);
            }

            function update(this: Phaser.Scene) {
                const self = this as any;
                if (self.ship) {

                    // Mouse rotation
                    const pointer = self.input.activePointer;
                    // Calculate angle from center of screen to mouse (since camera follows ship)
                    const angle = Phaser.Math.Angle.Between(
                        self.cameras.main.centerX,
                        self.cameras.main.centerY,
                        pointer.x,
                        pointer.y
                    );

                    // Adjust to point triangle top towards mouse (triangle default looks UP (-90 deg), math.angle is right (0 deg))
                    self.ship.rotation = angle + Math.PI / 2;

                    if (self.wKey.isDown || self.cursors.up.isDown) {
                        self.physics.velocityFromRotation(angle, 350, self.ship.body.velocity);
                    } else if (self.sKey.isDown || self.cursors.down.isDown) {
                        self.physics.velocityFromRotation(angle, -150, self.ship.body.velocity);
                    } else {
                        self.ship.body.setAcceleration(0);
                        self.ship.body.setDrag(500); // Stop when no keys pressed
                    }

                    // Sync
                    const x = self.ship.x;
                    const y = self.ship.y;
                    const r = self.ship.rotation;

                    if (self.ship.oldPosition && (x !== self.ship.oldPosition.x || y !== self.ship.oldPosition.y || r !== self.ship.oldPosition.rotation)) {
                        self.socket.emit('playerMovement', { x: self.ship.x, y: self.ship.y, rotation: self.ship.rotation });
                    }

                    self.ship.oldPosition = {
                        x: self.ship.x,
                        y: self.ship.y,
                        rotation: self.ship.rotation
                    };
                }
            }
        }

        initPhaser();

        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, []);

    return (
        <div style={{ position: 'relative' }}>
            <div id="phaser-game"></div>
            <div className={styles.statsOverlay}>
                CYBER_CREDITS: [{score}]
            </div>
        </div>
    );
}
