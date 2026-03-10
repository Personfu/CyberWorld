'use client';
import { useEffect, useRef, useState } from 'react';
import type { Game } from 'phaser';
import styles from './cyber.module.css';

export default function GameComponent() {
    const gameRef = useRef<Game | null>(null);
    const [score, setScore] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const [chatInput, setChatInput] = useState('');
    const socketRef = useRef<any>(null);

    const addLog = (msg: string) => {
        setLogs(prev => [...prev.slice(-4), msg]);
    };

    useEffect(() => {
        async function initPhaser() {
            const Phaser = (await import('phaser')).default;
            const { io } = await import('socket.io-client');

            const config: Phaser.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                parent: 'phaser-game',
                width: typeof window !== 'undefined' ? window.innerWidth : 1000,
                height: typeof window !== 'undefined' ? window.innerHeight : 600,
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
                // Drawing textures dynamically
                const graphics = this.add.graphics();

                // Projectile Cyber
                graphics.fillStyle(0x00ffcc, 1);
                graphics.fillRect(0, 0, 10, 4);
                graphics.generateTexture('proj_cyber', 10, 4);
                graphics.clear();

                // Projectile Neon
                graphics.fillStyle(0xff00ff, 1);
                graphics.fillRect(0, 0, 10, 4);
                graphics.generateTexture('proj_neon', 10, 4);
                graphics.clear();
            }

            function create(this: Phaser.Scene) {
                const self = this as any;
                self.socket = io();
                socketRef.current = self.socket;

                // Cyber Grid Background
                const gridGraphics = self.add.graphics();
                gridGraphics.lineStyle(2, 0x00ffcc, 0.05);
                for (let i = 0; i < 6000; i += 100) {
                    gridGraphics.moveTo(-3000, i - 3000);
                    gridGraphics.lineTo(3000, i - 3000);
                    gridGraphics.moveTo(i - 3000, -3000);
                    gridGraphics.lineTo(i - 3000, 3000);
                }
                gridGraphics.strokePath();

                self.otherPlayers = self.add.group();
                self.dataNodes = self.add.group();
                self.projectiles = self.add.group();

                self.socket.on('currentPlayers', (players: any) => {
                    Object.keys(players).forEach((id) => {
                        if (players[id].playerId === self.socket.id) {
                            addPlayer(self, players[id]);
                            setScore(players[id].score);
                            addLog(`UPLINK SECURED. FACTION: ${players[id].faction.toUpperCase()}`);
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

                self.socket.on('newNode', (node: any) => {
                    const n = self.add.circle(node.x, node.y, 8, 0xff0055);
                    n.nodeId = node.id;
                    self.physics.add.existing(n);
                    self.dataNodes.add(n);
                    self.tweens.add({
                        targets: n, scaleX: 1.5, scaleY: 1.5, alpha: 0.5, duration: 500, yoyo: true, repeat: -1
                    });
                });

                self.socket.on('newPlayer', (playerInfo: any) => {
                    addOtherPlayers(self, playerInfo);
                    addLog(`NEW ENTITY DETECTED.`);
                });

                self.socket.on('disconnectPlayer', (playerId: string) => {
                    self.otherPlayers.getChildren().forEach((otherPlayer: any) => {
                        if (playerId === otherPlayer.playerId) {
                            otherPlayer.destroy();
                            if (otherPlayer.label) otherPlayer.label.destroy();
                            if (otherPlayer.hpBar) otherPlayer.hpBar.destroy();
                        }
                    });
                });

                self.socket.on('playerMoved', (playerInfo: any) => {
                    self.otherPlayers.getChildren().forEach((otherPlayer: any) => {
                        if (playerInfo.playerId === otherPlayer.playerId) {
                            otherPlayer.setPosition(playerInfo.x, playerInfo.y);
                            otherPlayer.setRotation(playerInfo.rotation);
                            if (otherPlayer.label) {
                                otherPlayer.label.setPosition(playerInfo.x, playerInfo.y + 25);
                                otherPlayer.hpBar.setPosition(playerInfo.x - 20, playerInfo.y - 35);
                            }
                        }
                    });
                });

                self.socket.on('nodeCollected', (data: any) => {
                    self.dataNodes.getChildren().forEach((n: any) => {
                        if (n.nodeId === data.nodeId) { n.destroy(); }
                    });
                    if (data.playerId === self.socket.id) {
                        setScore(data.newScore);
                        addLog('DATA NODE MINED [+SCORE]');
                        if (self.ship) {
                            self.ship.hpInfo = data.hp;
                            updateHPBar(self, self.ship);
                        }
                    }
                });

                self.socket.on('chatMessage', (data: any) => {
                    addLog(`[${data.sender}]: ${data.msg}`);
                });

                self.socket.on('projectileFired', (pData: any) => {
                    const type = pData.faction === 'cyber' ? 'proj_cyber' : 'proj_neon';
                    const proj = self.physics.add.sprite(pData.x, pData.y, type);
                    proj.projId = pData.id;
                    proj.ownerId = pData.ownerId;
                    proj.setRotation(pData.rotation);
                    proj.setVelocity(pData.vx, pData.vy);
                    self.projectiles.add(proj);
                });

                self.socket.on('playerDamaged', (data: any) => {
                    // For others
                    self.otherPlayers.getChildren().forEach((p: any) => {
                        if (p.playerId === data.playerId) {
                            p.hpInfo = data.hp;
                            updateHPBar(self, p);
                        }
                    });
                    // For self
                    if (self.ship && self.socket.id === data.playerId) {
                        self.ship.hpInfo = data.hp;
                        updateHPBar(self, self.ship);
                    }
                });

                self.socket.on('playerDestroyed', (targetId: string) => {
                    if (targetId === self.socket.id) {
                        addLog("CRITICAL: SYS_HALT. REBOOTING...");
                        if (self.ship) {
                            self.ship.destroy();
                            self.ship.hpBar.destroy();
                            self.ship = null;
                        }
                    } else {
                        self.otherPlayers.getChildren().forEach((p: any) => {
                            if (p.playerId === targetId) {
                                p.destroy();
                                if (p.label) p.label.destroy();
                                if (p.hpBar) p.hpBar.destroy();
                            }
                        });
                    }
                });

                self.socket.on('playerRespawn', (pData: any) => {
                    if (pData.playerId === self.socket.id) {
                        addPlayer(self, pData);
                        addLog("SIGNAL RE-ESTABLISHED.");
                    } else {
                        addOtherPlayers(self, pData);
                    }
                });

                self.socket.on('scoreUpdate', (data: any) => {
                    if (data.playerId === self.socket.id) {
                        setScore(data.score);
                        addLog("TERMINATION BOUNTY [+150]");
                    }
                });

                self.cursors = self.input.keyboard.createCursorKeys();
                self.wKey = self.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
                self.aKey = self.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
                self.sKey = self.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
                self.dKey = self.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

                self.input.on('pointerdown', (pointer: any) => {
                    if (!self.ship) return;
                    // Calculate angle
                    const angle = Phaser.Math.Angle.Between(
                        self.cameras.main.centerX,
                        self.cameras.main.centerY,
                        pointer.x,
                        pointer.y
                    );

                    // Offset spawn point
                    const spawnX = self.ship.x + Math.cos(angle) * 30;
                    const spawnY = self.ship.y + Math.sin(angle) * 30;

                    self.socket.emit('fireProjectile', { x: spawnX, y: spawnY, rotation: angle });
                });

            }

            function updateHPBar(self: any, entity: any) {
                if (!entity || !entity.hpBar) return;
                entity.hpBar.clear();
                entity.hpBar.fillStyle(0x000000, 1);
                entity.hpBar.fillRect(0, 0, 40, 5);
                entity.hpBar.fillStyle(entity.faction === 'neon' ? 0xff00ff : 0x00ffcc, 1);
                entity.hpBar.fillRect(0, 0, 40 * (entity.hpInfo / 100), 5);
            }

            function addPlayer(self: any, playerInfo: any) {
                self.ship = self.add.triangle(playerInfo.x, playerInfo.y, 0, -20, -15, 15, 15, 15, playerInfo.faction === 'cyber' ? 0x00ffcc : 0xff00ff);
                self.physics.add.existing(self.ship);
                self.ship.faction = playerInfo.faction;
                self.ship.hpInfo = playerInfo.hp;
                self.ship.hpBar = self.add.graphics();
                updateHPBar(self, self.ship);

                self.ship.body.setDrag(200);
                self.ship.body.setAngularDrag(100);
                self.ship.body.setMaxVelocity(400);
                self.ship.body.setCollideWorldBounds(true);

                self.physics.world.setBounds(-3000, -3000, 6000, 6000);
                self.cameras.main.startFollow(self.ship);
                self.cameras.main.setBounds(-3000, -3000, 6000, 6000);

                // Node collection collision
                self.physics.add.overlap(self.ship, self.dataNodes, (ship: any, node: any) => {
                    self.socket.emit('collectNode', node.nodeId);
                    node.destroy();
                }, undefined, self);

                // Projectile collision
                self.physics.add.overlap(self.ship, self.projectiles, (ship: any, proj: any) => {
                    if (proj.ownerId !== self.socket.id) {
                        self.socket.emit('projectileHit', { targetId: self.socket.id, projectileId: proj.projId, shooterId: proj.ownerId });
                        proj.destroy();
                    }
                }, undefined, self);
            }

            function addOtherPlayers(self: any, playerInfo: any) {
                const otherPlayer = self.add.triangle(playerInfo.x, playerInfo.y, 0, -20, -15, 15, 15, 15, playerInfo.faction === 'cyber' ? 0x00ffcc : 0xff00ff);
                self.physics.add.existing(otherPlayer);
                otherPlayer.setOrigin(0.5, 0.5);
                otherPlayer.playerId = playerInfo.playerId;
                otherPlayer.faction = playerInfo.faction;
                otherPlayer.hpInfo = playerInfo.hp;

                otherPlayer.hpBar = self.add.graphics();
                updateHPBar(self, otherPlayer);

                otherPlayer.label = self.add.text(playerInfo.x, playerInfo.y + 25, playerInfo.playerId.substring(0, 4), { fontSize: '12px', fill: '#fff' }).setOrigin(0.5);
                self.otherPlayers.add(otherPlayer);
            }

            function update(this: Phaser.Scene) {
                const self = this as any;
                if (self.ship) {

                    // Mouse rotation
                    const pointer = self.input.activePointer;
                    const angle = Phaser.Math.Angle.Between(
                        self.cameras.main.centerX,
                        self.cameras.main.centerY,
                        pointer.x,
                        pointer.y
                    );

                    // Adjust to point triangle top towards mouse
                    self.ship.rotation = angle + Math.PI / 2;

                    if (self.wKey.isDown || self.cursors.up.isDown) {
                        self.physics.velocityFromRotation(angle, 350, self.ship.body.velocity);
                    } else if (self.sKey.isDown || self.cursors.down.isDown) {
                        self.physics.velocityFromRotation(angle, -150, self.ship.body.velocity);
                    } else {
                        self.ship.body.setAcceleration(0);
                        self.ship.body.setDrag(600);
                    }

                    self.ship.hpBar.setPosition(self.ship.x - 20, self.ship.y - 35);

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

    const handleChat = (e: React.FormEvent) => {
        e.preventDefault();
        if (chatInput.trim() && socketRef.current) {
            socketRef.current.emit('chatMessage', chatInput.trim());
            setChatInput('');
        }
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <div id="phaser-game"></div>

            {/* UI Overlay */}
            <div className={styles.statsOverlay}>
                CYBER_CREDITS: [{score}]
            </div>

            <div className={styles.logContainer}>
                {logs.map((log, i) => <div key={i} className={styles.logText}> {log} </div>)}
            </div>

            <form onSubmit={handleChat} className={styles.chatForm}>
                <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="> Execute transmission..."
                    className={styles.chatInput}
                />
                <button type="submit" className={styles.chatButton}>TX</button>
            </form>
        </div>
    );
}
