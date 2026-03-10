'use client';
import { useEffect, useRef, useState } from 'react';
import type { Game } from 'phaser';
import styles from './cyber.module.css';

export default function GameComponent() {
    const gameRef = useRef<Game | null>(null);
    const socketRef = useRef<any>(null);

    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [roomInfo, setRoomInfo] = useState({ name: 'INIT', desc: 'WAITING FOR UPLINK...' });
    const [chatInput, setChatInput] = useState('');
    const [systemLogs, setSystemLogs] = useState<string[]>([]);

    // Battle State
    const [inBattle, setInBattle] = useState(false);
    const [battleData, setBattleData] = useState<any>(null);
    const [battleLog, setBattleLog] = useState<string[]>([]);
    const [playerHp, setPlayerHp] = useState(100);
    const [enemyHp, setEnemyHp] = useState(100);

    const addSysLog = (msg: string) => {
        setSystemLogs(prev => [...prev.slice(-4), `> ${msg}`]);
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
                physics: { default: 'arcade', arcade: { debug: false } },
                scene: { preload: preload, create: create, update: update }
            };

            if (!gameRef.current) {
                gameRef.current = new Phaser.Game(config);
            }

            function preload(this: Phaser.Scene) {
                const gfx = this.add.graphics();

                // Avatar (ClubPenguin Style)
                gfx.fillStyle(0xffffff, 1);
                gfx.fillRoundedRect(0, 0, 40, 60, 10);
                gfx.fillStyle(0x000000, 1);
                gfx.fillRect(5, 10, 30, 15);
                gfx.generateTexture('avatar', 40, 60);
                gfx.clear();

                // Wild Daemon (Pokemon Style)
                gfx.lineStyle(2, 0xff0055, 1);
                gfx.strokeCircle(20, 20, 20);
                gfx.fillStyle(0xff0055, 0.5);
                gfx.fillCircle(20, 20, 20);
                gfx.generateTexture('daemon', 40, 40);
                gfx.clear();
            }

            function create(this: Phaser.Scene) {
                const self = this as any;
                self.socket = io({ transports: ['websocket', 'polling'] });
                socketRef.current = self.socket;

                self.otherPlayers = self.physics.add.group();
                self.wildDaemons = self.physics.add.group();
                self.chatBubbles = {};
                self.activeTweens = {};

                self.grid = self.add.graphics();
                window.addEventListener('resize', () => drawGrid(self));
                drawGrid(self);

                // Click to move or interact
                self.input.on('pointerdown', (pointer: any) => {
                    if (!self.player || inBattle) return;

                    // Check if clicking on Daemon
                    let clickedDaemon = null;
                    self.wildDaemons.getChildren().forEach((d: any) => {
                        if (d.getBounds().contains(pointer.worldX, pointer.worldY)) {
                            clickedDaemon = d.daemonId;
                        }
                    });

                    if (clickedDaemon) {
                        // Initiate Battle Request
                        self.socket.emit('initiateBattle', clickedDaemon);
                        addSysLog(`ANALYZING THREAT...`);
                        return;
                    }

                    const targetX = pointer.worldX;
                    const targetY = pointer.worldY;

                    startMoveCoroutine(self, self.player, targetX, targetY);
                    self.socket.emit('playerMoveTarget', { x: targetX, y: targetY, startX: self.player.x, startY: self.player.y });
                });

                self.socket.on('joinedRoom', (data: any) => {
                    setRoomInfo(data.roomDetails);
                    self.otherPlayers.clear(true, true);
                    self.wildDaemons.clear(true, true);

                    Object.keys(data.players).forEach(id => {
                        if (id === self.socket.id) {
                            addPlayer(self, data.players[id]);
                        } else {
                            addOtherPlayers(self, data.players[id]);
                        }
                    });

                    Object.keys(data.daemons).forEach(id => {
                        spawnDaemon(self, data.daemons[id]);
                    });

                    addSysLog(`ENTERED: ${data.roomDetails.name}`);
                });

                self.socket.on('spawnDaemon', (dData: any) => {
                    spawnDaemon(self, dData);
                });

                self.socket.on('removeDaemon', (dId: string) => {
                    self.wildDaemons.getChildren().forEach((d: any) => {
                        if (d.daemonId === dId) {
                            d.destroy();
                            if (d.nameTag) d.nameTag.destroy();
                        }
                    });
                });

                self.socket.on('newPlayer', (playerInfo: any) => addOtherPlayers(self, playerInfo));

                self.socket.on('disconnectPlayer', (id: string) => {
                    self.otherPlayers.getChildren().forEach((p: any) => {
                        if (p.playerId === id) {
                            p.destroy();
                            if (p.nameTag) p.nameTag.destroy();
                            if (self.chatBubbles[id]) self.chatBubbles[id].destroy();
                        }
                    });
                });

                self.socket.on('playerMoving', (data: any) => {
                    self.otherPlayers.getChildren().forEach((p: any) => {
                        if (p.playerId === data.playerId) {
                            p.setPosition(data.startX, data.startY);
                            startMoveCoroutine(self, p, data.targetX, data.targetY);
                        }
                    });
                });

                self.socket.on('chatMessage', (data: any) => {
                    const id = data.senderId;
                    let target = null;
                    if (id === self.socket.id) target = self.player;
                    else {
                        self.otherPlayers.getChildren().forEach((p: any) => {
                            if (p.playerId === id) target = p;
                        });
                    }

                    if (target) {
                        if (self.chatBubbles[id]) self.chatBubbles[id].destroy();

                        const bubble = self.add.text(target.x, target.y - 60, data.msg, {
                            backgroundColor: 'rgba(0,0,0,0.8)', padding: { x: 8, y: 5 },
                            color: '#00ffcc', fontSize: '14px', borderColor: '#00ffcc',
                            borderThickness: 1, wordWrap: { width: 150 }
                        }).setOrigin(0.5, 1);

                        self.chatBubbles[id] = bubble;

                        self.time.delayedCall(4000, () => {
                            if (bubble && bubble.active) {
                                self.tweens.add({
                                    targets: bubble, alpha: 0, duration: 500,
                                    onComplete: () => { bubble.destroy(); delete self.chatBubbles[id]; }
                                });
                            }
                        });
                    }
                });

                self.socket.on('systemMessage', (data: any) => addSysLog(data.msg));

                self.socket.on('updateStats', (data: any) => {
                    setScore(data.credits);
                    setLevel(data.level);
                });

                // BATTLE TRIGGERS
                self.socket.on('battleStart', (data: any) => {
                    setInBattle(true);
                    setBattleData(data);
                    setPlayerHp(data.playerDaemon.hp);
                    setEnemyHp(data.enemy.hp);
                    setBattleLog([`WILD [${data.enemy.name}] (${data.enemy.type}) APPEARED!`, `GO, [${data.playerDaemon.name}]!`]);
                });

                self.socket.on('battleTurnResult', (result: any) => {
                    setBattleLog(prev => [...prev.slice(-3), result.log]);
                    setEnemyHp(prev => Math.max(0, prev - result.enemyDamageTaken));
                    setPlayerHp(prev => Math.max(0, prev - result.playerDamageTaken));

                    // Check win/loss logic here on frontend just for UI purposes
                    setTimeout(() => {
                        if ((enemyHp - result.enemyDamageTaken) <= 0) {
                            setBattleLog(prev => [...prev.slice(-3), `ENEMY DEFEATED.`]);
                            setTimeout(() => {
                                setInBattle(false);
                                self.socket.emit('battleEnd', { win: true });
                            }, 2000);
                        } else if ((playerHp - result.playerDamageTaken) <= 0) {
                            setBattleLog(prev => [...prev.slice(-3), `YOUR DAEMON CRASHED.`]);
                            setTimeout(() => {
                                setInBattle(false);
                                self.socket.emit('battleEnd', { win: false });
                            }, 2000);
                        }
                    }, 1000);
                });
            }

            function drawGrid(self: any) {
                if (!self.grid) return;
                self.grid.clear();
                self.grid.lineStyle(1, 0x00ffcc, 0.1);
                const w = typeof window !== 'undefined' ? window.innerWidth : 1000;
                const h = typeof window !== 'undefined' ? window.innerHeight : 600;
                for (let i = 0; i < w; i += 40) { self.grid.moveTo(i, 0); self.grid.lineTo(i, h); }
                for (let j = 0; j < h; j += 40) { self.grid.moveTo(0, j); self.grid.lineTo(w, j); }
                self.grid.strokePath();
            }

            function startMoveCoroutine(self: any, entity: any, tx: number, ty: number) {
                const distance = Phaser.Math.Distance.Between(entity.x, entity.y, tx, ty);
                const time = (distance / 200) * 1000;
                if (self.activeTweens[entity.playerId]) self.activeTweens[entity.playerId].stop();
                self.activeTweens[entity.playerId] = self.tweens.add({
                    targets: entity, x: tx, y: ty, duration: time, ease: 'Linear'
                });
            }

            function addPlayer(self: any, playerInfo: any) {
                if (self.player) { self.player.destroy(); if (self.player.nameTag) self.player.nameTag.destroy(); }
                self.player = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'avatar').setTint(parseInt(playerInfo.color, 16));
                self.player.playerId = playerInfo.playerId;
                self.player.nameTag = self.add.text(playerInfo.x, playerInfo.y + 40, playerInfo.name, { color: '#ffffff', fontSize: '12px', fontStyle: 'bold', backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 2, y: 2 } }).setOrigin(0.5);
                self.cameras.main.startFollow(self.player, false, 0.1, 0.1);
                setScore(playerInfo.credits);
                setLevel(playerInfo.level);
            }

            function addOtherPlayers(self: any, playerInfo: any) {
                const other = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'avatar').setTint(parseInt(playerInfo.color, 16));
                other.playerId = playerInfo.playerId;
                other.nameTag = self.add.text(playerInfo.x, playerInfo.y + 40, playerInfo.name, { color: '#ffffff', fontSize: '12px', backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 2, y: 2 } }).setOrigin(0.5);
                self.otherPlayers.add(other);
            }

            function spawnDaemon(self: any, dInfo: any) {
                const d = self.physics.add.sprite(dInfo.x, dInfo.y, 'daemon');
                d.daemonId = dInfo.id;
                d.nameTag = self.add.text(dInfo.x, dInfo.y - 30, `[Lv.${dInfo.level}]\n${dInfo.name}`, { color: '#ff0055', fontSize: '10px', align: 'center' }).setOrigin(0.5);
                self.wildDaemons.add(d);

                // Wild movement tween
                self.tweens.add({
                    targets: d,
                    y: dInfo.y - 10,
                    duration: 1000,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }

            function update(this: Phaser.Scene) {
                const self = this as any;
                if (self.player) {
                    self.player.nameTag.setPosition(self.player.x, self.player.y + 40);
                    if (self.chatBubbles[self.player.playerId]) self.chatBubbles[self.player.playerId].setPosition(self.player.x, self.player.y - 60);
                }
                if (self.otherPlayers) {
                    self.otherPlayers.getChildren().forEach((p: any) => {
                        p.nameTag.setPosition(p.x, p.y + 40);
                        if (self.chatBubbles[p.playerId]) self.chatBubbles[p.playerId].setPosition(p.x, p.y - 60);
                    });
                }
                if (self.wildDaemons) {
                    self.wildDaemons.getChildren().forEach((d: any) => {
                        d.nameTag.setPosition(d.x, d.y - 30);
                    });
                }
            }
        }

        initPhaser();
        return () => { if (gameRef.current) { gameRef.current.destroy(true); gameRef.current = null; } };
    }, []);

    const handleChat = (e: React.FormEvent) => {
        e.preventDefault();
        if (chatInput.trim() !== '' && socketRef.current) {
            socketRef.current.emit('chatMessage', chatInput.trim());
            setChatInput('');
        }
    };

    const changeRoom = (newRoom: string) => {
        if (socketRef.current) socketRef.current.emit('changeRoom', newRoom);
    };

    const castMove = (moveName: string) => {
        if (socketRef.current && inBattle) {
            socketRef.current.emit('battleAction', { move: moveName });
        }
    };

    return (
        <div className={styles.gameWrapper}>
            <div id="phaser-game" style={{ display: inBattle ? 'none' : 'block' }}></div>

            {/* OVERWORLD HUD */}
            {!inBattle && (
                <>
                    <div className={styles.hudTop}>
                        <div className={styles.hudPanel}>
                            <h2>{roomInfo.name}</h2>
                            <p>{roomInfo.desc}</p>
                        </div>

                        <div className={styles.hudPanelRight}>
                            <div>LVL: <span className={styles.hlt}>{level}</span></div>
                            <div>CREDITS: <span className={styles.hlt}>{score}</span> F-COIN</div>
                        </div>
                    </div>

                    <div className={styles.hudSide}>
                        <button className={styles.btnAction} onClick={() => changeRoom('mainframe')}>HUB: MAINFRAME</button>
                        <button className={styles.btnAction} onClick={() => changeRoom('blackmarket')}>NAV: DARKNET</button>
                    </div>

                    <div className={styles.chatWrapper}>
                        <div className={styles.sysLogBox}>
                            {systemLogs.map((log, i) => <div key={i}>{log}</div>)}
                        </div>
                        <form onSubmit={handleChat} className={styles.chatFormLocal}>
                            <span className={styles.chatPrompt}>LOCAL&gt;</span>
                            <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} className={styles.chatInputField} placeholder="Execute broadcast..." />
                        </form>
                    </div>
                </>
            )}

            {/* ADVENTUREQUEST BATTLE OVERLAY */}
            {inBattle && battleData && (
                <div className={styles.battleArena}>
                    {/* WorldMonitor Map Background Theme */}
                    <div className={styles.battleBg}></div>

                    <div className={styles.battleField}>
                        {/* Player Side */}
                        <div className={styles.combatantPlayer}>
                            <h3>{battleData.playerDaemon.name} Lv.{battleData.playerDaemon.level} [{battleData.playerDaemon.type}]</h3>
                            <div className={styles.hpBarContainer}>
                                <div className={styles.hpBarFill} style={{ width: `${(playerHp / battleData.playerDaemon.hp) * 100}%` }}></div>
                            </div>
                            <p>{playerHp} / {battleData.playerDaemon.hp} HP</p>
                            <div className={styles.spritePlayer}></div>
                        </div>

                        {/* Enemy Side */}
                        <div className={styles.combatantEnemy}>
                            <h3>{battleData.enemy.name} Lv.{battleData.enemy.level} [{battleData.enemy.type}]</h3>
                            <div className={styles.hpBarContainerEnemy}>
                                <div className={styles.hpBarFillEnemy} style={{ width: `${(enemyHp / battleData.enemy.hp) * 100}%` }}></div>
                            </div>
                            <p>{enemyHp} / {battleData.enemy.hp} HP</p>
                            <div className={styles.spriteEnemy}></div>
                        </div>
                    </div>

                    {/* Combat Log */}
                    <div className={styles.battleLogBox}>
                        {battleLog.map((log, i) => <div key={i}>{log}</div>)}
                    </div>

                    {/* Action Menu (Pokemon/AQ style) */}
                    <div className={styles.battleMenu}>
                        <div className={styles.battleMenuGrid}>
                            <button onClick={() => castMove('EXPLOIT()')} className={styles.moveBtn}>EXPLOIT()</button>
                            <button onClick={() => castMove('ENCRYPT_PAYLOAD')} className={styles.moveBtn}>ENCRYPT P/LOAD</button>
                            <button onClick={() => castMove('PING_FLOOD')} className={styles.moveBtn}>PING FLOOD</button>
                            <button onClick={() => castMove('RUN')} className={styles.moveBtnRun}>TERMINATE CON</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
