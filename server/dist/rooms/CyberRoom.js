"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CyberRoom = void 0;
const colyseus_1 = require("colyseus");
const GameState_1 = require("./schema/GameState");
const supabase_js_1 = require("@supabase/supabase-js");
// Initialize Supabase Server Client
const supabaseUrl = process.env.SUPABASE_URL || "https://friptophbkiglomvabmf.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy_key";
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
class CyberRoom extends colyseus_1.Room {
    maxClients = 50;
    async onAuth(client, options) {
        if (!options.token)
            return false;
        // Cryptographically verify the JWT against Supabase Auth endpoints
        const { data: { user }, error } = await supabase.auth.getUser(options.token);
        if (error || !user) {
            console.error("JWT Verification Failed:", error);
            return false; // Colyseus automatically drops the connection if false
        }
        return { name: user.email?.split('@')[0] || "Agent_Unknown", id: user.id };
    }
    async onCreate(options) {
        this.setState(new GameState_1.GameState());
        // Connect Colyseus Initialization to query the `threat_intelligence` table
        try {
            const { data: threats, error } = await supabase
                .from('threat_intelligence')
                .select('*')
                .limit(10); // Spawning 10 major threats dynamically
            if (!error && threats && threats.length > 0) {
                threats.forEach((threat, idx) => {
                    const enemy = new GameState_1.Enemy();
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
            }
            else {
                console.log("[Colyseus] Warning: No threats pulled from Supabase.");
            }
        }
        catch (err) {
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
            // Server-side calculated damage
        });
        console.log("CyberWorld Room Created.");
    }
    onJoin(client, options, auth) {
        console.log(`${client.sessionId} joined as ${auth.name}`);
        const newPlayer = new GameState_1.Player();
        newPlayer.id = client.sessionId;
        newPlayer.name = auth.name;
        newPlayer.x = 100 + Math.random() * 200;
        newPlayer.y = 100 + Math.random() * 200;
        this.state.players.set(client.sessionId, newPlayer);
    }
    onLeave(client, code) {
        console.log(client.sessionId, "left! Code:", code);
        this.state.players.delete(client.sessionId);
    }
    onDispose() {
        console.log("Room disposed.");
    }
}
exports.CyberRoom = CyberRoom;
