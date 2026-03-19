'use client';
import { useEffect, useRef, useState } from 'react';
import type { Game } from 'phaser';
import styles from '@/app/cyber.module.css';

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

    // Advanced RPG State
    const [inventory, setInventory] = useState<any[]>([]);
    const [showInventory, setShowInventory] = useState(false);
    const [evolving, setEvolving] = useState<any>(null);

    // Cyber Deck & Trial State (Expansion)
    const [ram, setRam] = useState(100);
    const [trialTime, setTrialTime] = useState(60);
    const [showDeck, setShowDeck] = useState(false);

    const addSysLog = (msg: string) => {
        setSystemLogs(prev => [...prev.slice(-4), `> ${msg}`]);
    };

    useEffect(() => {
        const timer = setInterval(() => {
            setTrialTime(prev => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        async function initPhaser() {
            const Phaser = (await import('phaser')).default;
            const { Client } = await import('colyseus.js');
            const { createClient } = await import('@supabase/supabase-js');

            const config: Phaser.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                parent: 'phaser-game',
                scale: {
                    mode: Phaser.Scale.RESIZE,
                    parent: 'phaser-game',
                    width: '100%',
                    height: '100%',
                },
                backgroundColor: '#050505',
                physics: { default: 'arcade', arcade: { debug: false } },
                scene: { preload: preload, create: create, update: update }
            };

            if (!gameRef.current) {
                gameRef.current = new Phaser.Game(config);
            }

            function preload(this: Phaser.Scene) {
                const gfx = this.add.graphics();
                
                // PHASE 1 COMPLIANCE: Asset Pipeline Audit
                // Ensure ALL future external assets (images, audio) use absolute URIs routing through the Next.js /public directory.
                // e.g. this.load.image('player_sprite', '/sprites/player.png');
                // Do NOT use relative paths like '../public/sprites/player.png' as this will break Vercel edge packing.

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
                const colyseus = new Client(process.env.NEXT_PUBLIC_COLYSEUS_URL || 'wss://fllc.net:2567');
                const supabase = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://friptophbkiglomvabmf.supabase.co', 
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_key'
                );

                self.otherPlayers = self.physics.add.group();
                self.wildDaemons = self.physics.add.group();
                self.chatBubbles = {};
                self.activeTweens = {};

                supabase.auth.getSession().then(({ data }) => {
                    const token = data.session?.access_token || '';
                    colyseus.joinOrCreate('cyber_room', { token }).then(room => {
                        self.room = room;
                        socketRef.current = room;

                        room.state.players.onAdd((player: any, sessionId: string) => {
                            if (sessionId === room.sessionId) {
                                addPlayer(self, { x: player.x, y: player.y, level: player.level || 1, name: player.name || 'Agent', color: '0x00ffcc', playerId: sessionId, credits: 0 });
                                setRam(player.ram);
                                setInventory([...player.inventory]);
                            } else {
                                addOtherPlayers(self, { x: player.x, y: player.y, name: player.name || 'Agent', color: '0xff00cc', playerId: sessionId });
                            }

                            player.onChange(() => {
                                if (sessionId === room.sessionId) {
                                    setRam(player.ram);
                                    setInventory([...player.inventory]);
                                } else {
                                    self.otherPlayers.getChildren().forEach((p: any) => {
                                        if (p.playerId === sessionId) startMoveCoroutine(self, p, player.x, player.y);
                                    });
                                }
                            });
                        });

                        room.state.players.onRemove((player: any, sessionId: string) => {
                            self.otherPlayers.getChildren().forEach((p: any) => {
                                if (p.playerId === sessionId) { p.destroy(); if (p.nameTag) p.nameTag.destroy(); if (self.chatBubbles[sessionId]) self.chatBubbles[sessionId].destroy(); }
                            });
                        });

                        room.state.enemies.onAdd((daemon: any, id: string) => {
                            spawnDaemon(self, { id, x: daemon.x, y: daemon.y, name: daemon.name, level: daemon.level });
                        });

                        room.state.enemies.onRemove((daemon: any, id: string) => {
                            self.wildDaemons.getChildren().forEach((d: any) => {
                                if (d.daemonId === id) { d.destroy(); if (d.nameTag) d.nameTag.destroy(); }
                            });
                        });

                        room.onMessage('systemMessage', (msg: any) => addSysLog(msg.msg || msg));
                        room.onMessage('roomInfo', (data: any) => {
                            setRoomInfo(data);
                            addSysLog(`NAV_LINK: ESTABLISHED [${data.name}]`);
                        });
                        room.onMessage('chatMessage', (data: any) => {
                            const id = data.senderId;
                            let target = (id === room.sessionId) ? self.player : null;
                            if (!target) self.otherPlayers.getChildren().forEach((p: any) => { if (p.playerId === id) target = p; });
                            if (target) {
                                if (self.chatBubbles[id]) self.chatBubbles[id].destroy();
                                const bubble = self.add.text(target.x, target.y - 65, data.msg, {
                                    backgroundColor: 'rgba(0,0,0,0.85)', padding: { x: 10, y: 6 }, color: '#00ffcc', fontSize: '14px', borderThickness: 1, wordWrap: { width: 180 }
                                }).setOrigin(0.5, 1);
                                self.chatBubbles[id] = bubble;
                                self.time.delayedCall(4000, () => { if (bubble && bubble.active) bubble.destroy(); });
                            }
                        });

                        room.onMessage('battleStart', (data: any) => {
                            setInBattle(true);
                            setBattleData(data);
                            setPlayerHp(data.playerDaemon?.hp || 100);
                            setEnemyHp(data.enemy?.hp || 100);
                            setBattleLog([`DETECTED: [${data.enemy?.name}] (${data.enemy?.type})`, `UPLINK GO...`]);
                            addSysLog(`ENGAGING THREAT: ${data.enemy?.name}`);
                        });

                        room.onMessage('battleTurnResult', (result: any) => {
                            setBattleLog(prev => [...prev.slice(-3), result.log]);
                            setEnemyHp(prev => Math.max(0, prev - result.enemyDamageTaken));
                            setPlayerHp(prev => Math.max(0, prev - result.playerDamageTaken));

                            if (enemyHp - result.enemyDamageTaken <= 0) {
                                setBattleLog(prev => [...prev.slice(-3), `SCRUBBING COMPLETE.`]);
                                setTimeout(() => { setInBattle(false); }, 1500);
                            }
                        });

                        room.onMessage('updateStats', (data: any) => { setScore(data.credits); setLevel(data.level); });
                        room.onMessage('evolutionTrigger', (data: any) => {
                            setEvolving(data);
                            addSysLog(`CRITICAL: DAEMON IS RECONSTRUCTING...`);
                            setTimeout(() => setEvolving(null), 5000);
                        });
                        room.onMessage('receiveItem', (item: any) => {
                            setInventory(prev => [...prev, item]);
                            addSysLog(`ITEM_ACQUIRED: ${item.name}`);
                        });

                    }).catch(e => {
                        console.error('Colyseus Join Error:', e);
                        addSysLog(`UPLINK FAILURE: ${e.message}`);
                    });
                });

                self.grid = self.add.graphics();
                window.addEventListener('resize', () => drawGrid(self));
                drawGrid(self);

                self.input.on('pointerdown', (pointer: any) => {
                    if (!self.player || inBattle || !self.room) return;
                    
                    let clickedDaemon = null;
                    self.wildDaemons.getChildren().forEach((d: any) => {
                        if (d.getBounds().contains(pointer.worldX, pointer.worldY)) { clickedDaemon = d.daemonId; }
                    });

                    if (clickedDaemon) {
                        self.room.send('attack', { target: clickedDaemon });
                        return;
                    }

                    // RuneScape Style: Snap to 32x32 Grid
                    const tx = Math.floor(pointer.worldX / 32) * 32 + 16;
                    const ty = Math.floor(pointer.worldY / 32) * 32 + 16;
                    
                    startMoveCoroutine(self, self.player, tx, ty);
                    self.room.send('move', { x: tx, y: ty });
                });
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

    const changeSector = (sector: string) => { if (socketRef.current) socketRef.current.send('changeSector', { sector }); };
    const castMove = (move: string) => { if (socketRef.current && inBattle) socketRef.current.send('battleAction', { move, enemyState: battleData.enemy }); };

    return (
        <div className={styles.gameWrapper}>
            <div id="phaser-game"></div>

            {!inBattle && (
                <>
                    <div className={styles.hudTop}>
                        <div className={styles.hudPanel}>
                            <h2 className="flex items-center gap-2">
                               {roomInfo.name}
                               <span className="text-[9px] bg-red-900/40 px-1 text-white animate-pulse">LIVE_INTEL</span>
                            </h2>
                            <p>{roomInfo.desc}</p>
                        </div>
                        <div className={styles.hudPanelRight}>
                            <div className="text-[9px] text-[#00ffcc] font-black italic mb-1">BY PRESTON FURULIE</div>
                            <div>NODE_ACCESS: <span className={styles.hlt}>{level}</span></div>
                            <div>CREDITS: <span className={styles.hlt}>{score}</span> F-COIN</div>
                        </div>
                    </div>

                    <div className={styles.hudSide}>
                        <div className={styles.nodeNavHeader}>WORLD_NAV</div>
                        <button className={styles.btnAction} onClick={() => setShowInventory(!showInventory)}>BACKPACK [F2]</button>
                        <button className={styles.btnAction} onClick={() => socketRef.current?.send('lootItem')}>SCAN NETWORK [F3]</button>
                        
                        <div className="my-2 border-t border-white/20 pt-2">
                           <div className="text-[10px] text-yellow-400 font-bold mb-1">SKILLS [V.4]</div>
                           <div className="text-[9px] flex justify-between leading-tight text-gray-400"><span>EXPLOIT:</span> <span className="text-white">Lv.{level}</span></div>
                           <div className="text-[9px] flex justify-between leading-tight text-gray-400"><span>FIREWALL:</span> <span className="text-white">Lv.{Math.floor(level/2)}</span></div>
                           <div className="text-[9px] flex justify-between leading-tight text-gray-400"><span>FORENSICS:</span> <span className="text-white">Lv.1</span></div>
                        </div>

                        {level >= 10 && (
                            <div className="bg-blue-900/40 p-1 mb-2 border border-blue-400 text-[10px]">
                                <div className="font-bold text-blue-300">NASA_ENGINEER_UPLINK</div>
                                <div className="text-[8px] italic text-blue-100">Hardware authorized for Orbital Ops.</div>
                            </div>
                        )}

                        <div style={{ margin: '10px 0', borderBottom: '1px solid #444' }}></div>
                        <button className={styles.btnAction} onClick={() => changeSector('mainframe')}>MAINFRAME</button>
                        <button className={styles.btnAction} onClick={() => changeSector('lan_valley')}>LAN VALLEY</button>
                        <button className={styles.btnAction} onClick={() => changeSector('darknet_depths')}>DARKNET</button>
                    </div>

                    <div className={styles.chatWrapper}>
                        <div className={styles.sysLogBox}>
                            {systemLogs.map((log, i) => <div key={i}>{log}</div>)}
                        </div>
                        <div className={styles.chatFormLocal}>
                            <span className={styles.chatPrompt}>UPLINK&gt;</span>
                            <input type="text" className={styles.chatInputField} placeholder="execute broadcast..." onKeyDown={e => {
                                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                    socketRef.current.send('chatMessage', e.currentTarget.value.trim());
                                    e.currentTarget.value = '';
                                }
                            }} />
                        </div>
                    </div>

                    {/* Cyber Deck HUD (Expansion) */}
                    <div className={styles.deckLauncher} onClick={() => setShowDeck(!showDeck)}>
                        <div className={styles.ramBar} style={{ width: `${ram}%` }}></div>
                        <span>CYBER_DECK [TAB]</span>
                    </div>

                    <div className={styles.trialCountdown}>
                        SESSION_EXPIRY: {trialTime}s
                        <div className="text-[8px] text-gray-500 mt-1 uppercase">Made by Preston Furulie</div>
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

            {showInventory && (
                <div className={styles.inventoryModal}>
                    <div className={styles.modalHeader}>
                        <h2>BACKPACK_STORAGE</h2>
                        <button onClick={() => setShowInventory(false)}>CLOSE [X]</button>
                    </div>
                    <div className={styles.inventoryGrid}>
                        {inventory.length === 0 && <p className={styles.emptyMsg}>NO_ITEMS_DETECTED</p>}
                        {inventory.map((item, i) => (
                            <div key={i} className={styles.inventoryItem}>
                                <h4>{item.name}</h4>
                                <p>{item.desc}</p>
                                <button onClick={() => { /* Use item logic */ }}>EXECUTE()</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {evolving && (
                <div className={styles.evolutionOverlay}>
                    <div className={styles.evolutionFlash}></div>
                    <div className={styles.evolutionContent}>
                        <h1 className={styles.glitchText}>RECONSTRUCTING...</h1>
                        <p>{evolving.oldName} ➔ {evolving.newName}</p>
                    </div>
                </div>
            )}

            {showDeck && (
                <div className={styles.deckOverlay}>
                    <div className={styles.deckContainer}>
                        <div className={styles.deckHeader}>
                            <h2>FURY-DECK V.4.0</h2>
                            <button onClick={() => setShowDeck(false)}>X</button>
                        </div>
                        <div className={styles.deckBody}>
                            <div className={styles.deckStats}>
                                <div className={styles.statLine}>UPLINK: <span className={styles.hlt}>STABLE</span></div>
                                <div className={styles.statLine}>RAM: <span className={styles.hlt}>{ram} MB</span></div>
                                <div className={styles.statLine}>CORE: <span className={styles.hlt}>OVERCLOCKED</span></div>
                            </div>
                            <div className={styles.scriptGrid}>
                                <button className={styles.scriptBtn} onClick={() => { socketRef.current.send('useScript', { scriptName: 'PING_BREACH' }); }}>PING_BREACH [20MB]</button>
                                <button className={styles.scriptBtn} onClick={() => { socketRef.current.send('useScript', { scriptName: 'SYSTEM_FLARE' }); }}>SYSTEM_FLARE [50MB]</button>
                                <button className={styles.scriptBtn} onClick={() => { socketRef.current.send('useScript', { scriptName: 'REBOOT_RAM' }); }}>REBOOT_RAM [0MB]</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
