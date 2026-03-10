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

                // Wild Daemon
                gfx.lineStyle(2, 0x00ffcc, 1);
                gfx.strokeCircle(20, 20, 18);
                gfx.fillStyle(0x00ffcc, 0.3);
                gfx.fillCircle(20, 20, 18);
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

                // Input
                self.input.on('pointerdown', (pointer: any) => {
                    if (!self.player || inBattle) return;

                    // Interaction Check (Target Daemons or NPCs)
                    let clickedDaemon = null;
                    self.wildDaemons.getChildren().forEach((d: any) => {
                        if (d.getBounds().contains(pointer.worldX, pointer.worldY)) { clickedDaemon = d.daemonId; }
                    });

                    if (clickedDaemon) {
                        self.socket.emit('initiateBattle', clickedDaemon);
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
                        if (id === self.socket.id) addPlayer(self, data.players[id]);
                        else addOtherPlayers(self, data.players[id]);
                    });

                    Object.keys(data.daemons).forEach(id => spawnDaemon(self, data.daemons[id]));
                    addSysLog(`NAV_LINK: ESTABLISHED [${data.roomDetails.name}]`);
                });

                self.socket.on('spawnDaemon', (dData: any) => spawnDaemon(self, dData));

                self.socket.on('removeDaemon', (dId: string) => {
                    self.wildDaemons.getChildren().forEach((d: any) => {
                        if (d.daemonId === dId) { d.destroy(); if (d.nameTag) d.nameTag.destroy(); }
                    });
                });

                self.socket.on('newPlayer', (playerInfo: any) => addOtherPlayers(self, playerInfo));

                self.socket.on('disconnectPlayer', (id: string) => {
                    self.otherPlayers.getChildren().forEach((p: any) => {
                        if (p.playerId === id) { p.destroy(); if (p.nameTag) p.nameTag.destroy(); if (self.chatBubbles[id]) self.chatBubbles[id].destroy(); }
                    });
                });

                self.socket.on('playerMoving', (data: any) => {
                    self.otherPlayers.getChildren().forEach((p: any) => {
                        if (p.playerId === data.playerId) { p.setPosition(data.startX, data.startY); startMoveCoroutine(self, p, data.targetX, data.targetY); }
                    });
                });

                self.socket.on('chatMessage', (data: any) => {
                    const id = data.senderId;
                    let target = (id === self.socket.id) ? self.player : null;
                    if (!target) self.otherPlayers.getChildren().forEach((p: any) => { if (p.playerId === id) target = p; });

                    if (target) {
                        if (self.chatBubbles[id]) self.chatBubbles[id].destroy();
                        const bubble = self.add.text(target.x, target.y - 65, data.msg, {
                            backgroundColor: 'rgba(0,0,0,0.85)', padding: { x: 10, y: 6 },
                            color: '#00ffcc', fontSize: '14px', borderColor: '#00ffcc',
                            borderThickness: 1, wordWrap: { width: 180 }
                        }).setOrigin(0.5, 1);
                        self.chatBubbles[id] = bubble;
                        self.time.delayedCall(4000, () => { if (bubble && bubble.active) bubble.destroy(); });
                    }
                });

                self.socket.on('battleStart', (data: any) => {
                    setInBattle(true);
                    setBattleData(data);
                    setPlayerHp(data.playerDaemon.hp);
                    setEnemyHp(data.enemy.hp);
                    setBattleLog([`DETECTED: [${data.enemy.name}] (${data.enemy.type})`, `UPLINK GO, [${data.playerDaemon.name}]!`]);
                    addSysLog(`ENGAGING THREAT: ${data.enemy.name}`);
                });

                self.socket.on('battleTurnResult', (result: any) => {
                    setBattleLog(prev => [...prev.slice(-3), result.log]);
                    setEnemyHp(prev => Math.max(0, prev - result.enemyDamageTaken));
                    setPlayerHp(prev => Math.max(0, prev - result.playerDamageTaken));

                    if (enemyHp - result.enemyDamageTaken <= 0) {
                        setBattleLog(prev => [...prev.slice(-3), `SCRUBBING COMPLETE. TARGET REMOVED.`]);
                        setTimeout(() => { setInBattle(false); self.socket.emit('battleEnd', { win: true, enemyLevel: battleData.enemy.level }); }, 1500);
                    }
                });

                self.socket.on('systemMessage', (data: any) => addSysLog(data.msg));
                self.socket.on('updateStats', (data: any) => { setScore(data.credits); setLevel(data.level); });
            }

            function drawGrid(self: any) {
                if (!self.grid) return;
                self.grid.clear().lineStyle(1, 0x00ffcc, 0.08);
                const w = typeof window !== 'undefined' ? window.innerWidth : 1000;
                const h = typeof window !== 'undefined' ? window.innerHeight : 600;
                for (let i = 0; i < w; i += 40) { self.grid.moveTo(i, 0).lineTo(i, h); }
                for (let j = 0; j < h; j += 40) { self.grid.moveTo(0, j).lineTo(w, j); }
                self.grid.strokePath();
            }

            function startMoveCoroutine(self: any, entity: any, tx: number, ty: number) {
                const dist = Phaser.Math.Distance.Between(entity.x, entity.y, tx, ty);
                if (self.activeTweens[entity.playerId]) self.activeTweens[entity.playerId].stop();
                self.activeTweens[entity.playerId] = self.tweens.add({ targets: entity, x: tx, y: ty, duration: (dist / 220) * 1000, ease: 'Linear' });
            }

            function addPlayer(self: any, playerInfo: any) {
                if (self.player) { self.player.destroy(); if (self.player.nameTag) self.player.nameTag.destroy(); }
                self.player = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'avatar').setTint(parseInt(playerInfo.color, 16)).setDepth(10);
                self.player.playerId = playerInfo.playerId;
                self.player.nameTag = self.add.text(playerInfo.x, playerInfo.y + 40, `[Lv.${playerInfo.level}] ${playerInfo.name}`, { color: '#00ffcc', fontSize: '12px', fontStyle: 'bold', backgroundColor: 'rgba(0,0,0,0.6)', padding: { x: 4, y: 2 } }).setOrigin(0.5);
                self.cameras.main.startFollow(self.player, false, 0.1, 0.1);
                setScore(playerInfo.credits); setLevel(playerInfo.level);
            }

            function addOtherPlayers(self: any, p: any) {
                const other = self.physics.add.sprite(p.x, p.y, 'avatar').setTint(parseInt(p.color, 16)).setDepth(10);
                other.playerId = p.playerId;
                other.nameTag = self.add.text(p.x, p.y + 40, p.name, { color: '#ffffff', fontSize: '11px', backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 3, y: 1 } }).setOrigin(0.5);
                self.otherPlayers.add(other);
            }

            function spawnDaemon(self: any, d: any) {
                const sprite = self.physics.add.sprite(d.x, d.y, 'daemon').setTint(0xff0055).setScale(0.8);
                sprite.daemonId = d.id;
                sprite.nameTag = self.add.text(d.x, d.y - 35, `${d.name} V.${d.level}`, { color: '#ff0055', fontSize: '10px', fontStyle: 'bold' }).setOrigin(0.5);
                self.wildDaemons.add(sprite);
                self.tweens.add({ targets: sprite, y: d.y - 12, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            }

            function update(this: Phaser.Scene) {
                const self = this as any;
                if (self.player) {
                    self.player.nameTag.setPosition(self.player.x, self.player.y + 40);
                    if (self.chatBubbles[self.player.playerId]) self.chatBubbles[self.player.playerId].setPosition(self.player.x, self.player.y - 65);
                }
                if (self.otherPlayers) self.otherPlayers.getChildren().forEach((p: any) => {
                    p.nameTag.setPosition(p.x, p.y + 40);
                    if (self.chatBubbles[p.playerId]) self.chatBubbles[p.playerId].setPosition(p.x, p.y - 65);
                });
                if (self.wildDaemons) self.wildDaemons.getChildren().forEach((d: any) => d.nameTag.setPosition(d.x, d.y - 35));
            }
        }
        initPhaser();
        return () => { if (gameRef.current) { gameRef.current.destroy(true); gameRef.current = null; } };
    }, []);

    const changeRoom = (newRoom: string) => { if (socketRef.current) socketRef.current.emit('changeRoom', newRoom); };
    const castMove = (move: string) => { if (socketRef.current && inBattle) socketRef.current.emit('battleAction', { move, enemyState: battleData.enemy }); };

    return (
        <div className={styles.gameWrapper}>
            <div id="phaser-game"></div>

            {!inBattle && (
                <>
                    <div className={styles.hudTop}>
                        <div className={styles.hudPanel}>
                            <h2>{roomInfo.name}</h2>
                            <p>{roomInfo.desc}</p>
                        </div>
                        <div className={styles.hudPanelRight}>
                            <div>NODE_ACCESS: <span className={styles.hlt}>{level}</span></div>
                            <div>CREDITS: <span className={styles.hlt}>{score}</span> F-COIN</div>
                        </div>
                    </div>

                    <div className={styles.hudSide}>
                        <div className={styles.nodeNavHeader}>WORLD_NAV</div>
                        <button className={styles.btnAction} onClick={() => changeRoom('mainframe')}>MAINFRAME</button>
                        <button className={styles.btnAction} onClick={() => changeRoom('lan_valley')}>LAN VALLEY</button>
                        <button className={styles.btnAction} onClick={() => changeRoom('packet_plains')}>PACKET PLAINS</button>
                        <button className={styles.btnAction} onClick={() => changeRoom('wireless_woods')}>WIRELESS WOODS</button>
                        <button className={styles.btnAction} onClick={() => changeRoom('darknet_depths')}>DARKNET</button>
                    </div>

                    <div className={styles.chatWrapper}>
                        <div className={styles.sysLogBox}>
                            {systemLogs.map((log, i) => <div key={i}>{log}</div>)}
                        </div>
                        <div className={styles.chatFormLocal}>
                            <span className={styles.chatPrompt}>UPLINK&gt;</span>
                            <input type="text" className={styles.chatInputField} placeholder="execute broadcast..." onKeyDown={e => {
                                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                    socketRef.current.emit('chatMessage', e.currentTarget.value.trim());
                                    e.currentTarget.value = '';
                                }
                            }} />
                        </div>
                    </div>
                </>
            )}

            {inBattle && battleData && (
                <div className={styles.battleArena}>
                    <div className={styles.battleBg}></div>
                    <div className={styles.battleField}>
                        <div className={styles.combatantPlayer}>
                            <h3>{battleData.playerDaemon.name} [V.{battleData.playerDaemon.level}]</h3>
                            <div className={styles.hpBarContainer}><div className={styles.hpBarFill} style={{ width: `${(playerHp / battleData.playerDaemon.hp) * 100}%` }}></div></div>
                            <p>{playerHp}/{battleData.playerDaemon.hp} HP</p>
                            <div className={styles.spritePlayer}></div>
                        </div>
                        <div className={styles.combatantEnemy}>
                            <h3>{battleData.enemy.name} [V.{battleData.enemy.level}]</h3>
                            <div className={styles.hpBarContainerEnemy}><div className={styles.hpBarFillEnemy} style={{ width: `${(enemyHp / battleData.enemy.hp) * 100}%` }}></div></div>
                            <p>{enemyHp}/{battleData.enemy.hp} HP</p>
                            <div className={styles.spriteEnemy}></div>
                        </div>
                    </div>
                    <div className={styles.battleLogBox}>{battleLog.map((l, i) => <div key={i}>{l}</div>)}</div>
                    <div className={styles.battleMenu}>
                        <div className={styles.battleMenuGrid}>
                            <button onClick={() => castMove('EXPLOIT()')} className={styles.moveBtn}>EXPLOIT()</button>
                            <button onClick={() => castMove('PING_FLOOD')} className={styles.moveBtn}>PING_FLOOD</button>
                            <button onClick={() => castMove('RUN')} className={styles.moveBtnRun}>DISCONNECT</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
