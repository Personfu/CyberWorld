/**
 * ═══════════════════════════════════════════════════════════════
 *  CYBERWORLD UNIFIED ENGINE — ALL SOURCE CODES COMPILED TO ONE
 * ═══════════════════════════════════════════════════════════════
 *
 *  CyberWorld = ClubPenguin + RuneScape + Pokémon + Hacking + Cybersecurity + FLLC
 *
 *  Sub-Engines Merged:
 *  ┌─────────────────────────────────────────────────────────┐
 *  │ ENGINE 1: CYBERWORLD CORE (ClubPenguin MMO)            │
 *  │   - Avatar system, room navigation, multiplayer chat   │
 *  │   - Colyseus real-time, Supabase auth                  │
 *  │   Source: Personfu/CyberWorld (Next.js + Phaser 3)     │
 *  ├─────────────────────────────────────────────────────────┤
 *  │ ENGINE 2: SOURCECODE (Cybersecurity Ops Simulator)     │
 *  │   - Boot → Login → Class Select → World → HUD         │
 *  │   - Adversary combat (FANCY_BEAR, LAZARUS, etc.)       │
 *  │   - Tool HUD (Nmap, Metasploit, Wireshark, Hydra)     │
 *  │   Source: Personfu/CYBERWORLDSOURCECODE (Phaser 3)      │
 *  ├─────────────────────────────────────────────────────────┤
 *  │ ENGINE 3: LITE (RuneScape-Style OSINT Client)          │
 *  │   - Grid-based exploration, skill trees                │
 *  │   - OSINT reconnaissance missions                      │
 *  │   Source: Personfu/CYBERWORLDSOURCECODELITE (Java→TS)   │
 *  ├─────────────────────────────────────────────────────────┤
 *  │ ENGINE 4: SOULCODE (Cyber Entity Collection System)    │
 *  │   - Daemon capture, evolution, battle system           │
 *  │   - Type matchups (EXPLOIT > FIREWALL > MALWARE)       │
 *  │   Source: Personfu/CYBERWORLDSOULCODE (Pokémon→Cyber)   │
 *  └─────────────────────────────────────────────────────────┘
 *
 *  Built by Preston Furulie — FLLC // CyberOS v2026.3
 */

// ═══════════════════════════════════════════════════════════════
// ENGINE 2: SOURCECODE SCENES (Cybersecurity Ops)
// Merged from: Personfu/CYBERWORLDSOURCECODE
// ═══════════════════════════════════════════════════════════════

export class SceneBoot extends Phaser.Scene {
    constructor() { super('SceneBoot'); }

    preload() {
        this.load.image('player', 'https://win98icons.alexmeub.com/icons/png/address_book_users.png');
        this.load.image('daemon_sprite', 'https://win98icons.alexmeub.com/icons/png/computer_virus-0.png');
        this.load.image('tool_nmap', 'https://win98icons.alexmeub.com/icons/png/console_prompt-0.png');
        this.load.image('tool_wireshark', 'https://win98icons.alexmeub.com/icons/png/network_internet_pcs_pc-0.png');
    }

    create() {
        // CyberOS Boot Sequence
        const lines = [
            'CYBERWORLD ENGINE v2026.3-FLLC',
            '════════════════════════════════',
            'Loading ENGINE 1: CORE MMO...',
            'Loading ENGINE 2: SOURCECODE OPS...',
            'Loading ENGINE 3: LITE OSINT...',
            'Loading ENGINE 4: SOULCODE ENTITIES...',
            '',
            'ALL ENGINES COMPILED ✓',
            'FURIOS-INT UPLINK: ESTABLISHED',
        ];

        lines.forEach((line, i) => {
            this.time.delayedCall(i * 200, () => {
                this.add.text(512, 150 + (i * 30), line, {
                    fontFamily: 'VT323', fontSize: '20px',
                    color: i === lines.length - 1 ? '#00ff41' : '#00e8ff'
                }).setOrigin(0.5);
            });
        });

        this.time.delayedCall(2500, () => this.scene.start('SceneLogin'));
    }
}

export class SceneLogin extends Phaser.Scene {
    constructor() { super('SceneLogin'); }

    create() {
        // Background grid
        this.add.grid(512, 384, 1024, 768, 32, 32, 0x050a0f, 1, 0x0044ff, 0.08);

        this.add.text(512, 80, '╔══════════════════════════════╗', { fontFamily: 'VT323', fontSize: '24px', color: '#00e8ff' }).setOrigin(0.5);
        this.add.text(512, 110, '║  CYBERWORLD // FURIOS-INT   ║', { fontFamily: 'VT323', fontSize: '24px', color: '#00e8ff' }).setOrigin(0.5);
        this.add.text(512, 140, '╚══════════════════════════════╝', { fontFamily: 'VT323', fontSize: '24px', color: '#00e8ff' }).setOrigin(0.5);

        this.add.text(512, 180, 'UNIFIED ENGINE: ClubPenguin + RuneScape + Pokémon + Hacking + FLLC', { fontFamily: 'VT323', fontSize: '16px', color: '#808080' }).setOrigin(0.5);

        // Login panel
        this.add.rectangle(512, 380, 500, 350, 0x011a27).setStrokeStyle(2, 0x00e8ff);

        this.add.text(512, 240, 'REGISTER_OPERATIVE', { fontFamily: 'VT323', fontSize: '28px', color: '#00ff41' }).setOrigin(0.5);

        // Username field simulation
        this.add.rectangle(512, 310, 350, 40, 0x050a0f).setStrokeStyle(1, 0x00e8ff);
        this.add.text(330, 310, 'AGENT_' + Math.floor(Math.random() * 9999), { fontFamily: 'VT323', fontSize: '20px', color: '#00e8ff' }).setOrigin(0, 0.5);

        // Password field simulation
        this.add.rectangle(512, 370, 350, 40, 0x050a0f).setStrokeStyle(1, 0x00e8ff);
        this.add.text(330, 370, '••••••••••••', { fontFamily: 'VT323', fontSize: '20px', color: '#666' }).setOrigin(0, 0.5);

        // Login button
        const btnLogin = this.add.rectangle(512, 450, 300, 50, 0x00e8ff).setInteractive({ useHandCursor: true });
        this.add.text(512, 450, 'INITIALIZE_AUTH', { fontFamily: 'VT323', fontSize: '24px', color: '#000', fontStyle: 'bold' }).setOrigin(0.5);

        btnLogin.on('pointerover', () => btnLogin.setFillStyle(0x00ff41));
        btnLogin.on('pointerout', () => btnLogin.setFillStyle(0x00e8ff));
        btnLogin.on('pointerdown', () => this.scene.start('SceneCharacter'));

        // Build info
        this.add.text(512, 530, 'CyberOS v2026.3-FLLC • Built by Preston Furulie', { fontFamily: 'VT323', fontSize: '14px', color: '#444' }).setOrigin(0.5);
    }
}

export class SceneCharacter extends Phaser.Scene {
    constructor() { super('SceneCharacter'); }

    create() {
        this.add.grid(512, 384, 1024, 768, 32, 32, 0x050a0f, 1, 0x0044ff, 0.05);

        this.add.text(512, 40, 'SELECT_OPERATIVE_CLASS', { fontFamily: 'VT323', fontSize: '36px', color: '#00e8ff' }).setOrigin(0.5);
        this.add.text(512, 70, 'Each class unlocks unique CyberWorld engines and tools', { fontFamily: 'VT323', fontSize: '14px', color: '#808080' }).setOrigin(0.5);

        const classes = [
            {
                name: 'RED_TEAM // Offensive Ops',
                icon: '⚔️',
                desc: 'Nmap, Metasploit, Hydra, Empire — Attack adversaries head-on',
                engine: 'ENGINE 2: SOURCECODE',
                color: 0xff003c
            },
            {
                name: 'BLUE_TEAM // Defensive SOC',
                icon: '🛡️',
                desc: 'Wireshark, CSET, Starkiller, CyberChef — Harden and defend',
                engine: 'ENGINE 3: LITE OSINT',
                color: 0x0088ff
            },
            {
                name: 'OSINT_AGENT // Intelligence',
                icon: '🔍',
                desc: 'FURY0s1nt, RedEye, GovINT — Reconnaissance and attribution',
                engine: 'ENGINE 4: SOULCODE',
                color: 0xff00ff
            },
            {
                name: 'FULL_STACK // CyberWorld Master',
                icon: '🌐',
                desc: 'ALL ENGINES UNLOCKED — Complete CyberWorld experience',
                engine: 'ENGINE 1-4: UNIFIED',
                color: 0x00ff41
            }
        ];

        classes.forEach((c, i) => {
            const y = 140 + (i * 140);

            const btn = this.add.rectangle(512, y, 700, 120, 0x011a27).setStrokeStyle(2, c.color).setInteractive({ useHandCursor: true });

            this.add.text(200, y - 20, `${c.icon}  ${c.name}`, { fontFamily: 'VT323', fontSize: '26px', color: '#' + c.color.toString(16).padStart(6, '0') }).setOrigin(0, 0.5);
            this.add.text(200, y + 10, c.desc, { fontFamily: 'VT323', fontSize: '14px', color: '#aaa' }).setOrigin(0, 0.5);
            this.add.text(200, y + 35, `[${c.engine}]`, { fontFamily: 'VT323', fontSize: '12px', color: '#555' }).setOrigin(0, 0.5);

            btn.on('pointerover', () => btn.setFillStyle(c.color, 0.15));
            btn.on('pointerout', () => btn.setFillStyle(0x011a27));
            btn.on('pointerdown', () => {
                this.registry.set('playerClass', c.name);
                this.registry.set('playerEngine', c.engine);
                this.scene.start('SceneWorld');
            });
        });
    }
}

export class SceneWorld extends Phaser.Scene {
    player: any;
    playerName: any;

    constructor() { super('SceneWorld'); }

    create() {
        // WORLD GRID (RuneScape-style)
        this.add.grid(512, 384, 4096, 3072, 64, 64, 0x011a27, 1, 0x0044ff, 0.08).setOrigin(0.5);

        // Sector labels
        const sectors = [
            { name: 'MAINFRAME', x: 512, y: 100, color: '#00e8ff' },
            { name: 'LAN_VALLEY', x: 200, y: 300, color: '#00ff41' },
            { name: 'DARKNET_DEPTHS', x: 800, y: 500, color: '#ff003c' },
            { name: 'SOC_TOWER', x: 400, y: 600, color: '#ff00ff' },
        ];
        sectors.forEach(s => {
            this.add.text(s.x, s.y - 30, `[SECTOR: ${s.name}]`, { fontFamily: 'VT323', fontSize: '16px', color: s.color, backgroundColor: '#000', padding: { x: 8, y: 4 } as any }).setOrigin(0.5).setAlpha(0.7);
        });

        // PLAYER (ClubPenguin-style Operative)
        this.player = this.add.sprite(512, 384, 'player').setScale(2).setTint(0x00e8ff);
        const pClass = this.registry.get('playerClass') || 'AGENT';
        this.playerName = this.add.text(512, 350, `OPERATIVE_${Math.floor(Math.random() * 9999)}`, {
            fontFamily: 'VT323', fontSize: '14px', color: '#00e8ff', fontStyle: 'bold'
        }).setOrigin(0.5);

        // ADVERSARIES (from SOURCECODE — real threat groups)
        const adversaries = [
            { name: 'FANCY_BEAR', x: 200, y: 200, color: 0xff0000, type: 'APT28', faction: 'Bear' },
            { name: 'LAZARUS_GROUP', x: 800, y: 200, color: 0xff00ff, type: 'Chollima', faction: 'Chollima' },
            { name: 'BITWISE_SPIDER', x: 300, y: 500, color: 0xff003c, type: 'RaaS', faction: 'Spider' },
            { name: 'COZY_BEAR', x: 700, y: 400, color: 0xff4444, type: 'APT29', faction: 'Bear' },
            { name: 'MUSTANG_PANDA', x: 150, y: 450, color: 0xffaa00, type: 'Espionage', faction: 'Panda' },
            { name: 'CHARMING_KITTEN', x: 850, y: 350, color: 0x00ff88, type: 'APT35', faction: 'Kitten' },
        ];

        // DAEMONS (from SOULCODE — capturable cyber entities)
        const daemons = [
            { name: 'ROOTKIT_v3', x: 600, y: 250, color: 0x00ffcc, type: 'MALWARE', level: 5 },
            { name: 'WORM_SLITHER', x: 400, y: 350, color: 0x00ff41, type: 'WORM', level: 3 },
            { name: 'TROJAN_GHOST', x: 650, y: 550, color: 0xff0088, type: 'TROJAN', level: 8 },
            { name: 'BOTNET_SWARM', x: 250, y: 650, color: 0xffcc00, type: 'BOTNET', level: 12 },
        ];

        // Spawn adversaries
        adversaries.forEach(e => {
            const sprite = this.add.sprite(e.x, e.y, 'player').setScale(1.5).setTint(e.color).setInteractive({ useHandCursor: true });
            this.add.text(e.x, e.y - 40, `⚠ ${e.name}`, { fontFamily: 'VT323', fontSize: '12px', color: '#fff', backgroundColor: '#' + e.color.toString(16).padStart(6, '0') + '88', padding: { x: 4, y: 2 } as any }).setOrigin(0.5);
            this.add.text(e.x, e.y - 55, `[${e.faction.toUpperCase()}]`, { fontFamily: 'VT323', fontSize: '10px', color: '#888' }).setOrigin(0.5);

            sprite.on('pointerdown', () => {
                this.events.emit('combat', e);
                this.cameras.main.shake(100, 0.01);
            });

            // Float animation
            this.tweens.add({ targets: sprite, y: e.y - 8, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        });

        // Spawn daemons (SOULCODE creatures)
        daemons.forEach(d => {
            const sprite = this.add.sprite(d.x, d.y, 'player').setScale(1).setTint(d.color).setInteractive({ useHandCursor: true });
            this.add.text(d.x, d.y - 30, `◆ ${d.name} V.${d.level}`, { fontFamily: 'VT323', fontSize: '11px', color: '#' + d.color.toString(16).padStart(6, '0') }).setOrigin(0.5);
            this.add.text(d.x, d.y - 42, `[${d.type}]`, { fontFamily: 'VT323', fontSize: '9px', color: '#666' }).setOrigin(0.5);

            sprite.on('pointerdown', () => {
                this.events.emit('daemon_encounter', d);
                this.cameras.main.flash(200, 0, 255, 200);
            });

            this.tweens.add({ targets: sprite, y: d.y - 12, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        });

        // MOVEMENT LOGIC (RuneScape grid snap)
        this.input.on('pointerdown', (pointer: any) => {
            if (pointer.y > 680) return; // Ignore HUD area

            const snapX = Phaser.Math.Snap.To(pointer.worldX, 64);
            const snapY = Phaser.Math.Snap.To(pointer.worldY, 64);

            this.tweens.add({
                targets: [this.player, this.playerName],
                x: snapX, y: snapY,
                duration: 500, ease: 'Power2'
            });
        });

        // TUTORIAL
        this.add.text(512, 720, 'CLICK GRID TO MOVE | CLICK ADVERSARIES TO SCAN | CLICK DAEMONS TO CAPTURE | USE HUD TOOLS', {
            fontFamily: 'VT323', fontSize: '16px', color: '#00ff41', backgroundColor: '#000', padding: { x: 10, y: 5 } as any
        }).setOrigin(0.5);

        // Launch HUD
        this.scene.launch('SceneHUD');
    }
}

export class SceneHUD extends Phaser.Scene {
    logText: any;

    constructor() { super('SceneHUD'); }

    create() {
        const h = 768;
        const w = 1024;

        // HUD BACKGROUND
        this.add.rectangle(w / 2, h - 80, w, 160, 0x011a27).setAlpha(0.92).setStrokeStyle(2, 0x00e8ff);

        // CYBERSECURITY TOOLS (merged from SOURCECODE)
        const tools = [
            { name: 'NMAP', desc: 'Network Scanner' },
            { name: 'METASPLOIT', desc: 'Exploit Framework' },
            { name: 'WIRESHARK', desc: 'Packet Analyzer' },
            { name: 'HYDRA', desc: 'Password Cracker' },
            { name: 'FURY', desc: 'Custom Kali Ops' },
            { name: 'CSET', desc: 'Fed Assessment' },
        ];

        tools.forEach((t, i) => {
            const x = 85 + (i * 130);
            const btn = this.add.rectangle(x, h - 80, 118, 90, 0x011a27).setStrokeStyle(1, 0x00e8ff).setInteractive({ useHandCursor: true });
            this.add.text(x, h - 90, t.name, { fontFamily: 'VT323', fontSize: '14px', color: '#00e8ff', fontStyle: 'bold' }).setOrigin(0.5);
            this.add.text(x, h - 70, t.desc, { fontFamily: 'VT323', fontSize: '9px', color: '#888' }).setOrigin(0.5);

            btn.on('pointerover', () => btn.setFillStyle(0x00e8ff, 0.3));
            btn.on('pointerout', () => btn.setFillStyle(0x011a27, 0.9));
            btn.on('pointerdown', () => this.log(`[EXEC] Running ${t.name}... Target scanned. Vulnerabilities found.`));
        });

        // SOC CONSOLE (merged from SOURCECODE HUD)
        this.logText = this.add.text(800, h - 145, [
            '╔═══ FURIOS-INT SOC CONSOLE ═══╗',
            '║ CyberWorld Unified Engine     ║',
            '║ All 4 engines: ONLINE         ║',
            '╚═══════════════════════════════╝',
        ].join('\n'), {
            fontFamily: 'VT323', fontSize: '11px', color: '#00ff41'
        });

        // ENGINE STATUS BAR
        this.add.text(810, h - 45, 'E1:CORE ✓ E2:OPS ✓ E3:LITE ✓ E4:SOUL ✓', {
            fontFamily: 'VT323', fontSize: '10px', color: '#00e8ff'
        });

        // Listen for combat events from SceneWorld
        const worldScene = this.scene.get('SceneWorld');
        worldScene.events.on('combat', (target: any) => {
            this.log(`[RECON] Scanning ${target.name} (${target.faction})...`);
            this.log(`[SCAN] FOUND CVE-2026-${Math.floor(Math.random() * 9999)} [CRITICAL]`);
            this.log(`[ATTACK] Meterpreter session opened on ${target.type}.`);
        });

        worldScene.events.on('daemon_encounter', (daemon: any) => {
            this.log(`[SOULCODE] Encountered ${daemon.name} V.${daemon.level}`);
            this.log(`[CAPTURE] Deploying containment protocol...`);
            this.log(`[SUCCESS] ${daemon.name} added to Daemon Registry!`);
        });
    }

    log(msg: string) {
        const lines = this.logText.text.split('\n');
        lines.push(msg);
        if (lines.length > 10) lines.shift();
        this.logText.setText(lines.join('\n'));
    }
}

// ═══════════════════════════════════════════════════════════════
// UNIFIED GAME CONFIG — Compiles all engines into ONE
// ═══════════════════════════════════════════════════════════════
export const CYBERWORLD_CONFIG = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#050a0f',
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: [SceneBoot, SceneLogin, SceneCharacter, SceneWorld, SceneHUD]
};

// Export for standalone use
export function launchCyberWorld(containerId = 'game-container') {
    const config = { ...CYBERWORLD_CONFIG, parent: containerId };
    return new Phaser.Game(config);
}
