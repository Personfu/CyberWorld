import { Room, Client } from "colyseus";
import { GameState, Player, Enemy } from "./schema/GameState";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Server Client
const supabaseUrl = process.env.SUPABASE_URL || "https://friptophbkiglomvabmf.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy_key";
const supabase = createClient(supabaseUrl, supabaseKey);

export class CyberRoom extends Room<{ state: GameState }> {
  maxClients = 50;

  async onAuth(client: Client, options: any) {
    if (!options.token) return false;
    
    // Cryptographically verify the JWT against Supabase Auth endpoints
    const { data: { user }, error } = await supabase.auth.getUser(options.token);
    
    if (error || !user) {
        console.error("JWT Verification Failed:", error);
        return false; // Colyseus automatically drops the connection if false
    }

    return { name: user.email?.split('@')[0] || "Agent_Unknown", id: user.id };
  }

  async onCreate(options: any) {
    this.setState(new GameState());

    // Connect Colyseus Initialization to query the `threat_intelligence` table
    try {
        const { data: threats, error } = await supabase
            .from('threat_intelligence')
            .select('*')
            .limit(10); // Spawning 10 major threats dynamically
            
        if (!error && threats && threats.length > 0) {
            threats.forEach((threat, idx) => {
                const enemy = new Enemy();
                enemy.id = `threat_${threat.id}`;
                enemy.name = threat.primary_name;
                enemy.type = threat.faction;
                enemy.x = 200 + Math.random() * 600;
                enemy.y = 200 + Math.random() * 400;
                enemy.hp = threat.base_hp;
                enemy.level = threat.base_level;
                this.state.enemies.set(enemy.id, enemy);
            });
            console.log(`[Colyseus] Room seed success! Summoned ${threats.length} live adversaries from Supabase.`);
        } else {
            console.log("[Colyseus] Warning: No threats pulled from Supabase.");
        }
    } catch (err) {
        console.error("Failed to seed threats from DB:", err);
    }

    // Authoritative Movement Vector processing
    this.onMessage("move", (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
         player.x = data.x;
         player.y = data.y;
      }
    });

    // Authoritative Combat Hit Registration
    this.onMessage("attack", (client, data) => {
      const player = this.state.players.get(client.sessionId);
      const enemy = this.state.enemies.get(data.target);

      if (player && enemy) {
        // Send a battle uplink initialization
        client.send("battleStart", {
            playerDaemon: { name: player.name, hp: 100, level: player.level },
            enemy: { name: enemy.name, hp: enemy.hp, level: enemy.level, type: enemy.type }
        });
      }
    });

    this.onMessage("battleAction", (client, data) => {
        const player = this.state.players.get(client.sessionId);
        if (!player) return;

        if (data.move === 'RUN') {
            client.send("battleTurnResult", {
                log: `[DISCONNECT] Uplink severed successfully. Scrambling IP...`,
                playerDamageTaken: 0,
                enemyDamageTaken: 5000 
            });
            return;
        }

        // Action is authoritative
        let playerDamage = data.move === 'EXPLOIT()' ? 35 : 15;
        let enemyDamage = Math.floor(Math.random() * 15) + 8;
        let log = "";

        const enemyType = data.enemyState?.type || 'Standard';

        // FACTION ABILITIES
        if (enemyType === 'Spider' && data.move === 'EXPLOIT()' && Math.random() < 0.3) {
            playerDamage = 0;
            log = `[EVASION] ${data.enemyState.name} (Spider) scrambled the exploit code! Target IMMUNE.`;
        } else if (enemyType === 'Bear') {
            playerDamage = Math.floor(playerDamage * 0.5); // 50% Tank reduction
            log = `[REINFORCED] ${data.enemyState.name} (Bear) hardened its shell! Damage reduced.`;
        } else if (enemyType === 'Panda') {
            const regen = 5;
            // Panda regen logic - would ideally update actual enemy HP state here if possible
            log = `[REGEN] ${data.enemyState.name} (Panda) stabilized its core! Restructuring files (+${regen} HP).`;
        } else {
            playerDamage = Math.floor(Math.random() * playerDamage) + 10;
            log = `[${data.move}] Executed against ${data.enemyState?.name || 'Target'}: Dealt ${playerDamage} SYS_DMG.`;
        }
        
        log += ` Counter-attack received ${enemyDamage} SYS_DMG.`;
        
        client.send("battleTurnResult", {
            log: log,
            playerDamageTaken: enemyDamage,
            enemyDamageTaken: playerDamage
        });
    });

    this.onMessage("changeSector", (client, data) => {
        const newSector = data.sector;
        console.log(`[CyberRoom] Sector swap requested: ${newSector}`);
        this.broadcast("sector_update", { sector: newSector, status: "CALIBRATING", msg: `Synchronizing with ${newSector} data-mesh...` });
        
        // Random world event: Boss Spawn
        if (Math.random() < 0.2) {
            const boss = new Enemy();
            boss.id = `boss_${Date.now()}`;
            boss.name = "STORMCORE_REVENANT";
            boss.type = "Elite_Cyber_Daemon";
            boss.x = 500;
            boss.y = 500;
            boss.hp = 500;
            boss.level = 99;
            this.state.enemies.set(boss.id, boss);
            this.broadcast("system_message", "CRITICAL ALERT: High-value target STORMCORE_REVENANT has breached the mainframe!");
        }
    });

    this.onMessage("useScript", (client, data) => {
        const player = this.state.players.get(client.sessionId);
        if (!player) return;

        const scripts: any = {
            "PING_BREACH": { ram: 20, callback: () => this.generateLoot(player) },
            "SYSTEM_FLARE": { ram: 50, callback: () => this.triggerEvolution(player) },
            "REBOOT_RAM": { ram: 0, callback: () => player.ram = 100 }
        };

        const script = scripts[data.scriptName];
        if (script && player.ram >= script.ram) {
            player.ram -= script.ram;
            script.callback();
            console.log(`[CyberRoom] Authoritative script execution: ${data.scriptName} by ${player.name}`);
        } else {
            client.send("error", "Insufficient RAM for this operation.");
        }
    });

    this.onMessage("lootItem", (client, data) => {
        const player = this.state.players.get(client.sessionId);
        if (player) this.generateLoot(player);
    });

    this.onMessage("triggerEvolution", (client, data) => {
        const player = this.state.players.get(client.sessionId);
        if (player) this.triggerEvolution(player);
    });

    console.log("CyberWorld Advanced Sector Room Initialized.");
  }

  generateLoot(player: any) {
    const artifacts = [
        "Encrypted Datapad", "Zero-day Exploit Disk", 
        "Overclocked GPU", "EMP Grenade", "Quantum Key"
    ];
    const drawn = artifacts[Math.floor(Math.random() * artifacts.length)];
    player.inventory.push(drawn);
    this.broadcast("system_broadcast", `${player.name} discovered an artifact: ${drawn}`);
    
    // We can still send the detailed UI update to the specific client
    const client = this.clients.find(c => c.sessionId === player.id);
    if (client) {
        client.send("receiveItem", { name: drawn, desc: "A powerful relic secured in your authoritative inventory." });
    }
  }

  triggerEvolution(player: any) {
    const oldName = player.name;
    player.level += 1;
    player.name = `Elite_${player.name}`;
    
    const client = this.clients.find(c => c.sessionId === player.id);
    if (client) {
        client.send("evolutionTrigger", {
            oldName: oldName,
            newName: player.name
        });
    }
  }

  onJoin(client: Client, options: any, auth: any) {
    console.log(`${client.sessionId} joined as ${auth.name}`);
    const newPlayer = new Player();
    newPlayer.id = client.sessionId;
    newPlayer.name = auth.name;
    newPlayer.x = 100 + Math.random() * 200;
    newPlayer.y = 100 + Math.random() * 200;
    
    this.state.players.set(client.sessionId, newPlayer);

    // Tiered access control
    const tier = auth.tier || 'Free';
    console.log(`[CyberRoom] Session uplink: ${auth.name} (${tier})`);

    if (tier === 'Free') {
        this.clock.setTimeout(() => {
            client.send("system_message", "Free trial expired. Your 1-minute access has concluded. Please upgrade to Basic ($25) or Premium ($49) at fllc.net/shop to restore your connection.");
            client.leave(4403, "Trial Expired. Upgrade required.");
        }, 60000);
    } else {
        client.send("system_message", `Uplink Stable. Welcome back, ${tier} Operative.`);
    }
  }

  onLeave(client: Client, code?: number) {
    console.log(client.sessionId, "left! Code:", code);
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log("Room disposed.");
  }
}
