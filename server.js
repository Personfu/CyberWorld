const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

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

    const io = new Server(server);

    const players = {};
    const dataNodes = {};
    const projectiles = {};
    let projId = 0;

    // Boundary constraints
    const MAP_LIMIT = 3000;

    // Spawn initial nodes
    for (let i = 0; i < 20; i++) {
        const nodeId = 'node_' + Math.random().toString(36).substr(2, 9);
        dataNodes[nodeId] = {
            id: nodeId,
            x: Math.floor(Math.random() * MAP_LIMIT * 2) - MAP_LIMIT,
            y: Math.floor(Math.random() * MAP_LIMIT * 2) - MAP_LIMIT,
            value: Math.floor(Math.random() * 50) + 10
        };
    }

    io.on('connection', (socket) => {
        console.log(`Connection established: [ID: ${socket.id}]`);

        players[socket.id] = {
            playerId: socket.id,
            x: Math.floor(Math.random() * 400) - 200,
            y: Math.floor(Math.random() * 400) - 200,
            rotation: 0,
            score: 0,
            hp: 100,
            maxHp: 100,
            faction: (Math.random() > 0.5) ? 'cyber' : 'neon'
        };

        // Send current state
        socket.emit('currentPlayers', players);
        socket.emit('dataNodes', dataNodes);

        // Notify others
        socket.broadcast.emit('newPlayer', players[socket.id]);

        socket.on('disconnect', () => {
            console.log(`Connection lost: [ID: ${socket.id}]`);
            delete players[socket.id];
            io.emit('disconnectPlayer', socket.id);
        });

        socket.on('chatMessage', (msg) => {
            const safeMsg = String(msg).substring(0, 100);
            io.emit('chatMessage', { sender: players[socket.id].faction.toUpperCase() + '-' + socket.id.substring(0, 4), msg: safeMsg });
        });

        socket.on('fireProjectile', (data) => {
            const id = projId++;
            // Calculate velocity based on rotation
            const speed = 800;
            projectiles[id] = {
                id: id,
                ownerId: socket.id,
                faction: players[socket.id].faction,
                x: data.x,
                y: data.y,
                vx: Math.cos(data.rotation) * speed,
                vy: Math.sin(data.rotation) * speed,
                rotation: data.rotation,
                life: 1.5 // seconds
            };
            io.emit('projectileFired', projectiles[id]);
        });

        socket.on('playerMovement', function (movementData) {
            if (!players[socket.id]) return;
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            players[socket.id].rotation = movementData.rotation;
            socket.broadcast.emit('playerMoved', players[socket.id]);
        });

        socket.on('collectNode', function (nodeId) {
            if (dataNodes[nodeId] && players[socket.id]) {
                const val = dataNodes[nodeId].value;
                players[socket.id].score += val;

                // Heal on node collection
                players[socket.id].hp = Math.min(players[socket.id].hp + 10, players[socket.id].maxHp);

                delete dataNodes[nodeId];

                io.emit('nodeCollected', { playerId: socket.id, nodeId: nodeId, newScore: players[socket.id].score, hp: players[socket.id].hp });

                // Respawn a new node
                setTimeout(() => {
                    const newId = 'node_' + Math.random().toString(36).substr(2, 9);
                    dataNodes[newId] = {
                        id: newId,
                        x: Math.floor(Math.random() * MAP_LIMIT * 2) - MAP_LIMIT,
                        y: Math.floor(Math.random() * MAP_LIMIT * 2) - MAP_LIMIT,
                        value: Math.floor(Math.random() * 80) + 20
                    };
                    io.emit('newNode', dataNodes[newId]);
                }, 2000);
            }
        });

        socket.on('projectileHit', (hitData) => {
            // Very basic server trust for hits (would need server-side calc for prod)
            const targetId = hitData.targetId;
            const pId = hitData.projectileId;

            if (projectiles[pId]) {
                delete projectiles[pId];
                io.emit('projectileDestroyed', pId);
            }

            if (players[targetId]) {
                players[targetId].hp -= 20; // damage amount
                io.emit('playerDamaged', { playerId: targetId, hp: players[targetId].hp });

                if (players[targetId].hp <= 0) {
                    // KILL
                    io.emit('playerDestroyed', targetId);

                    // Award points to shooter if known
                    if (players[hitData.shooterId]) {
                        players[hitData.shooterId].score += 150;
                        io.emit('scoreUpdate', { playerId: hitData.shooterId, score: players[hitData.shooterId].score });
                    }

                    // Respawn
                    setTimeout(() => {
                        if (players[targetId]) {
                            players[targetId].hp = players[targetId].maxHp;
                            players[targetId].x = Math.floor(Math.random() * 400) - 200;
                            players[targetId].y = Math.floor(Math.random() * 400) - 200;
                            io.emit('playerRespawn', players[targetId]);
                        }
                    }, 3000);
                }
            }
        });
    });

    // Server-side projectile loop
    const TICK_RATE = 1000 / 30;
    setInterval(() => {
        Object.keys(projectiles).forEach(id => {
            const p = projectiles[id];
            p.life -= (TICK_RATE / 1000);
            if (p.life <= 0) {
                delete projectiles[id];
                io.emit('projectileDestroyed', id);
            }
        });
    }, TICK_RATE);

    server.once('error', (err) => {
        console.error(err);
        process.exit(1);
    });

    server.listen(port, () => {
        console.log(`> CyberWorld MMORPG Simulation Server Online - Port ${port}`);
    });
});
