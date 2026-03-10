'use client';
import { useEffect, useRef } from 'react';
import type { Game } from 'phaser';

export default function GameComponent() {
    const gameRef = useRef<Game | null>(null);

    useEffect(() => {
        async function initPhaser() {
            const Phaser = (await import('phaser')).default;
            const { io } = await import('socket.io-client');

            const config: Phaser.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                parent: 'phaser-game',
                width: 800,
                height: 600,
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
                // load assets here, drawing shapes for now
            }

            function create(this: Phaser.Scene) {
                const self = this as any;
                self.socket = io();
                self.otherPlayers = self.physics.add.group();

                self.socket.on('currentPlayers', (players: any) => {
                    Object.keys(players).forEach((id) => {
                        if (players[id].playerId === self.socket.id) {
                            addPlayer(self, players[id]);
                        } else {
                            addOtherPlayers(self, players[id]);
                        }
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
                        }
                    });
                });

                self.cursors = self.input.keyboard.createCursorKeys();
            }

            function addPlayer(self: any, playerInfo: any) {
                self.ship = self.add.rectangle(playerInfo.x, playerInfo.y, 40, 40, playerInfo.team === 'blue' ? 0x0000ff : 0xff0000);
                self.physics.add.existing(self.ship);
                self.ship.setOrigin(0.5, 0.5);
            }

            function addOtherPlayers(self: any, playerInfo: any) {
                const otherPlayer = self.add.rectangle(playerInfo.x, playerInfo.y, 40, 40, playerInfo.team === 'blue' ? 0x0000ff : 0xff0000);
                self.physics.add.existing(otherPlayer);
                otherPlayer.setOrigin(0.5, 0.5);
                otherPlayer.playerId = playerInfo.playerId;
                self.otherPlayers.add(otherPlayer);
            }

            function update(this: Phaser.Scene) {
                const self = this as any;
                if (self.ship) {
                    if (self.cursors.left.isDown) {
                        self.ship.body.setVelocityX(-200);
                    } else if (self.cursors.right.isDown) {
                        self.ship.body.setVelocityX(200);
                    } else {
                        self.ship.body.setVelocityX(0);
                    }

                    if (self.cursors.up.isDown) {
                        self.ship.body.setVelocityY(-200);
                    } else if (self.cursors.down.isDown) {
                        self.ship.body.setVelocityY(200);
                    } else {
                        self.ship.body.setVelocityY(0);
                    }

                    const x = self.ship.x;
                    const y = self.ship.y;

                    if (self.ship.oldPosition && (x !== self.ship.oldPosition.x || y !== self.ship.oldPosition.y)) {
                        self.socket.emit('playerMovement', { x: self.ship.x, y: self.ship.y });
                    }

                    self.ship.oldPosition = {
                        x: self.ship.x,
                        y: self.ship.y
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h1 style={{ fontFamily: 'monospace', color: '#0f0', textShadow: '0 0 5px #0f0' }}>CYBERWORLD TERMINAL</h1>
            <div id="phaser-game" style={{ border: '2px solid #0f0', boxShadow: '0 0 10px #0f0' }}></div>
        </div>
    );
}
