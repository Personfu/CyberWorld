const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Define rooms from GDD
const ROOMS = {
    mainframe: { name: 'THE MAINFRAME', desc: 'Central Cyber-Nexus' },
    lan_valley: { name: 'LAN VALLEY', desc: 'Starting area. ARP, ICMP, basic scanning.' },
    packet_plains: { name: 'PACKET PLAINS', desc: 'Wireshark, protocol fuzzing.' },
    wireless_woods: { name: 'WIRELESS WOODS', desc: 'WiFi / BLE hunting. probe requests.' },
    wan_wasteland: { name: 'WAN WASTELAND', desc: 'BGP hijacking, routing exploits.' },
    darknet_depths: { name: 'DARKNET DEPTHS', desc: 'Tor-style anonymity, .onion' },
    cloud_citadel: { name: 'CLOUD CITADEL', desc: 'AWS, Azure, container escapes.' },
    zero_day_peaks: { name: 'ZERO-DAY PEAKS', desc: '0-days, APTs, kernel exploits.' }
};

// Daemons Database (Subset for now)
const DAEMON_TYPES = [
    { name: 'Ping', type: 'Network', hp: 35, atk: 55, def: 40, spd: 90, evolvesAt: 15, evolvesTo: 'Tracert' },
    { name: 'Tracert', type: 'Network', hp: 55, atk: 70, def: 55, spd: 75, evolvesAt: 30, evolvesTo: 'Nmap' },
    { name: 'Nmap', type: 'Network', hp: 80, atk: 95, def: 70, spd: 60 },
    { name: 'XSSling', type: 'Web', hp: 38, atk: 60, def: 35, spd: 75, evolvesAt: 18, evolvesTo: 'SQLmap' },
    { name: 'SQLmap', type: 'Web', hp: 65, atk: 85, def: 50, spd: 65 },
    { name: 'Stacksmash', type: 'Binary', hp: 40, atk: 90, def: 30, spd: 70, evolvesAt: 20, evolvesTo: 'KernelPanic' },
    { name: 'KernelPanic', type: 'Binary', hp: 100, atk: 110, def: 70, spd: 60 },
    { name: 'Hashling', type: 'Crypto', hp: 40, atk: 50, def: 45, spd: 55 },
    { name: 'Probe', type: 'Wireless', hp: 35, atk: 45, def: 35, spd: 85 },
    { name: 'Rubberduck', type: 'Physical', hp: 42, atk: 70, def: 35, spd: 75 },
    { name: 'ZeroDawn', type: 'Zero-Day', hp: 120, atk: 130, def: 90, spd: 95 }
];

app.prepare().then(() => {
    const server = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    });

    const io = new Server(server, { cors: { origin: '*' } });

    const players = {};
    const wildDaemons = {};
    let daemonIdCounter = 0;

    function spawnDaemon(room) {
        const dType = DAEMON_TYPES[Math.floor(Math.random() * DAEMON_TYPES.length)];
        const id = 'daemon_' + (daemonIdCounter++);
        wildDaemons[id] = {
            id: id,
            name: dType.name,
            type: dType.type,
            room: room,
            x: 100 + Math.floor(Math.random() * 800),
            y: 100 + Math.floor(Math.random() * 400),
            hp: dType.hp,
            maxHp: dType.hp,
            atk: dType.atk,
            def: dType.def,
            spd: dType.spd,
            level: Math.floor(Math.random() * 10) + 1
        };
        io.to(room).emit('spawnDaemon', wildDaemons[id]);
    }

    // Spawn initial daemons in all rooms
    Object.keys(ROOMS).forEach(room => {
        for (let i = 0; i < 3; i++) spawnDaemon(room);
    });

    setInterval(() => {
        const roomIds = Object.keys(ROOMS);
        const targetRoom = roomIds[Math.floor(Math.random() * roomIds.length)];
        if (Object.values(wildDaemons).filter(d => d.room === targetRoom).length < 5) {
            spawnDaemon(targetRoom);
        }
    }, 10000);

    io.on('connection', (socket) => {
        players[socket.id] = {
            playerId: socket.id,
            name: 'Hacker_' + Math.floor(Math.random() * 9999),
            x: 400, y: 300,
            room: 'lan_valley',
            level: 1, credits: 0,
            color: Math.floor(Math.random() * 16777215).toString(16),
            party: [{ ...DAEMON_TYPES[0], level: 5, currentHp: 35 }], // Starting with Ping
            inBattle: false
        };

        socket.join(players[socket.id].room);

        socket.emit('joinedRoom', {
            roomDetails: ROOMS[players[socket.id].room],
            players: getPlayersInRoom(players[socket.id].room),
            daemons: getDaemonsInRoom(players[socket.id].room)
        });

        socket.to(players[socket.id].room).emit('newPlayer', players[socket.id]);
        socket.emit('systemMessage', { msg: `Welcome to CyberWorld. Your journey begins in LAN Valley.` });

        socket.on('disconnect', () => {
            const room = players[socket.id] ? players[socket.id].room : null;
            if (room) io.to(room).emit('disconnectPlayer', socket.id);
            delete players[socket.id];
        });

        socket.on('chatMessage', (msg) => {
            if (!players[socket.id]) return;
            const safeMsg = String(msg).substring(0, 100);
            io.to(players[socket.id].room).emit('chatMessage', { senderId: socket.id, senderName: players[socket.id].name, msg: safeMsg });
        });

        socket.on('playerMoveTarget', function (data) {
            const p = players[socket.id];
            if (!p || p.inBattle) return;
            p.x = data.x; p.y = data.y; // Sync position estimate
            socket.to(p.room).emit('playerMoving', {
                playerId: socket.id, targetX: data.x, targetY: data.y, startX: data.startX, startY: data.startY
            });
        });

        socket.on('changeRoom', function (newRoom) {
            const p = players[socket.id];
            if (!p || !ROOMS[newRoom] || p.inBattle) return;
            socket.leave(p.room);
            socket.to(p.room).emit('disconnectPlayer', socket.id);

            p.room = newRoom;
            p.x = 400; p.y = 300;

            socket.join(newRoom);
            socket.emit('joinedRoom', {
                roomDetails: ROOMS[newRoom],
                players: getPlayersInRoom(newRoom),
                daemons: getDaemonsInRoom(newRoom)
            });
            socket.to(newRoom).emit('newPlayer', p);
        });

        socket.on('initiateBattle', (daemonId) => {
            const p = players[socket.id];
            if (!p || p.inBattle || !wildDaemons[daemonId] || wildDaemons[daemonId].room !== p.room) return;

            p.inBattle = true;
            const enemy = wildDaemons[daemonId];
            delete wildDaemons[daemonId];
            io.to(p.room).emit('removeDaemon', daemonId);

            socket.emit('battleStart', {
                enemy: enemy,
                playerDaemon: p.party[0]
            });
        });

        socket.on('battleAction', (actionData) => {
            const p = players[socket.id];
            if (!p || !p.inBattle) return;

            // Turn logic: Fast spd hits first
            const pDaemon = p.party[0];
            const enemy = actionData.enemyState; // UI sends back enemy as it knows it

            let log = "";
            let eDmg = 0;
            let pDmg = 0;

            if (actionData.move === 'RUN') {
                p.inBattle = false;
                socket.emit('battleResult', { type: 'fled' });
                return;
            }

            // Simulating damage
            eDmg = Math.floor(Math.random() * (pDaemon.atk / 2)) + 5;
            pDmg = Math.floor(Math.random() * (enemy.atk / 3)) + 2;

            socket.emit('battleTurnResult', {
                log: `[SysLog] Executing ${actionData.move}. Target Vun. Established.`,
                enemyDamageTaken: eDmg,
                playerDamageTaken: pDmg
            });
        });

        socket.on('battleEnd', (data) => {
            const p = players[socket.id];
            if (!p) return;
            p.inBattle = false;
            if (data.win) {
                const reward = 50 + (data.enemyLevel * 10);
                p.credits += reward;

                // Experience / Evolution Logic
                const pDaemon = p.party[0];
                pDaemon.level = (pDaemon.level || 5) + 1;

                const dInfo = DAEMON_TYPES.find(d => d.name === pDaemon.name);
                if (dInfo && dInfo.evolvesAt && pDaemon.level >= dInfo.evolvesAt) {
                    const oldName = pDaemon.name;
                    pDaemon.name = dInfo.evolvesTo;
                    const nextInfo = DAEMON_TYPES.find(d => d.name === pDaemon.name);
                    pDaemon.hp = nextInfo.hp;
                    pDaemon.atk = nextInfo.atk;
                    socket.emit('evolutionTrigger', { oldName, newName: pDaemon.name });
                }

                socket.emit('updateStats', { credits: p.credits, level: p.level });
                socket.emit('systemMessage', { msg: `Daemon Scrubbed. +${reward} Credits. Daemon Gained Level: ${pDaemon.level}` });

                // Random Item Drop
                if (Math.random() > 0.7) {
                    const item = { name: 'Wireshark Lens', desc: 'Allows you to see hidden Packet Plains data.' };
                    socket.emit('receiveItem', item);
                }
            }
        });

    });

    function getPlayersInRoom(roomId) {
        const result = {};
        for (const [id, player] of Object.entries(players)) {
            if (player.room === roomId) result[id] = player;
        }
        return result;
    }

    function getDaemonsInRoom(roomId) {
        const result = {};
        for (const [id, daemon] of Object.entries(wildDaemons)) {
            if (daemon.room === roomId) result[id] = daemon;
        }
        return result;
    }

    server.once('error', (err) => process.exit(1));
    server.listen(port, () => console.log(`> CyberWorld MMORPG Architecture Online - Port ${port}`));
});
