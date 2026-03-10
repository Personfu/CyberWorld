const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Define rooms
const ROOMS = {
    mainframe: { name: 'THE MAINFRAME', desc: 'Central Cyber-Nexus' },
    blackmarket: { name: 'DARKNET BAZAAR', desc: 'Illegal scripts and proxies' }
};

// Daemons Database
const DAEMONS = [
    { name: 'Ping', type: 'Network', hp: 35, atk: 55, def: 40 },
    { name: 'XSSling', type: 'Web', hp: 38, atk: 60, def: 35 },
    { name: 'Stacksmash', type: 'Binary', hp: 40, atk: 90, def: 30 },
    { name: 'Hashling', type: 'Crypto', hp: 40, atk: 50, def: 45 }
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
        const dType = DAEMONS[Math.floor(Math.random() * DAEMONS.length)];
        const id = 'daemon_' + (daemonIdCounter++);
        wildDaemons[id] = {
            id: id,
            name: dType.name,
            type: dType.type,
            room: room,
            x: 100 + Math.floor(Math.random() * 600),
            y: 100 + Math.floor(Math.random() * 400),
            hp: dType.hp,
            maxHp: dType.hp,
            atk: dType.atk,
            def: dType.def,
            level: Math.floor(Math.random() * 5) + 1
        };
        io.to(room).emit('spawnDaemon', wildDaemons[id]);
    }

    // Spawn initial daemons
    for (let i = 0; i < 5; i++) spawnDaemon('mainframe');
    for (let i = 0; i < 5; i++) spawnDaemon('blackmarket');

    setInterval(() => {
        if (Object.keys(wildDaemons).length < 20) {
            spawnDaemon(Math.random() > 0.5 ? 'mainframe' : 'blackmarket');
        }
    }, 15000);

    io.on('connection', (socket) => {
        console.log(`Connection established: [ID: ${socket.id}]`);

        players[socket.id] = {
            playerId: socket.id,
            name: 'Hacker_' + Math.floor(Math.random() * 9999),
            x: 400, y: 300,
            room: 'mainframe',
            targetX: null, targetY: null,
            level: 1, credits: 0,
            color: Math.floor(Math.random() * 16777215).toString(16),
            party: [{ ...DAEMONS[Math.floor(Math.random() * 3)], level: 5 }], // Give a starter
            inBattle: false
        };

        socket.join(players[socket.id].room);

        // Send current room state
        socket.emit('joinedRoom', {
            roomDetails: ROOMS[players[socket.id].room],
            players: getPlayersInRoom(players[socket.id].room),
            daemons: getDaemonsInRoom(players[socket.id].room)
        });

        socket.to(players[socket.id].room).emit('newPlayer', players[socket.id]);
        socket.emit('systemMessage', { msg: `Welcome to the CyberWorld, ${players[socket.id].name}.` });

        socket.on('disconnect', () => {
            const room = players[socket.id] ? players[socket.id].room : null;
            delete players[socket.id];
            if (room) io.to(room).emit('disconnectPlayer', socket.id);
        });

        socket.on('chatMessage', (msg) => {
            if (!players[socket.id]) return;
            const safeMsg = String(msg).substring(0, 100);
            io.to(players[socket.id].room).emit('chatMessage', { senderId: socket.id, senderName: players[socket.id].name, msg: safeMsg });
        });

        socket.on('playerMoveTarget', function (data) {
            if (!players[socket.id] || players[socket.id].inBattle) return;
            players[socket.id].targetX = data.x;
            players[socket.id].targetY = data.y;
            socket.to(players[socket.id].room).emit('playerMoving', {
                playerId: socket.id, targetX: data.x, targetY: data.y, startX: data.startX, startY: data.startY
            });
        });

        socket.on('changeRoom', function (newRoom) {
            if (!players[socket.id] || !ROOMS[newRoom] || players[socket.id].inBattle) return;
            const oldRoom = players[socket.id].room;
            socket.leave(oldRoom);
            socket.to(oldRoom).emit('disconnectPlayer', socket.id);

            players[socket.id].room = newRoom;
            players[socket.id].x = 400; players[socket.id].y = 300;

            socket.join(newRoom);
            socket.emit('joinedRoom', {
                roomDetails: ROOMS[newRoom],
                players: getPlayersInRoom(newRoom),
                daemons: getDaemonsInRoom(newRoom)
            });
            socket.to(newRoom).emit('newPlayer', players[socket.id]);
        });

        // Battle System
        socket.on('initiateBattle', (daemonId) => {
            const p = players[socket.id];
            if (!p || p.inBattle || !wildDaemons[daemonId] || wildDaemons[daemonId].room !== p.room) return;

            p.inBattle = true;
            const enemy = wildDaemons[daemonId];
            delete wildDaemons[daemonId]; // Remove from overworld
            io.to(p.room).emit('removeDaemon', daemonId);

            socket.emit('battleStart', {
                enemy: enemy,
                playerDaemon: p.party[0]
            });
        });

        socket.on('battleAction', (actionData) => {
            const p = players[socket.id];
            if (!p || !p.inBattle) return;

            // Simplistic battle simulation for now (turn-based resolve instantly)
            socket.emit('battleTurnResult', {
                log: `[SysLog] Executing action: ${actionData.move}`,
                enemyDamageTaken: Math.floor(Math.random() * 20) + 5,
                playerDamageTaken: Math.floor(Math.random() * 15) + 2
            });
        });

        socket.on('battleEnd', (data) => {
            const p = players[socket.id];
            if (!p) return;
            p.inBattle = false;
            if (data.win) {
                p.credits += 50;
                socket.emit('systemMessage', { msg: `Daemon Defeated. +50 CyberCredits` });
                socket.emit('updateStats', { credits: p.credits, level: p.level });
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
