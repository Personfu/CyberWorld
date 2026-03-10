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

    // Spawn initial nodes
    for (let i = 0; i < 5; i++) {
        const nodeId = 'node_' + Math.random().toString(36).substr(2, 9);
        dataNodes[nodeId] = {
            id: nodeId,
            x: Math.floor(Math.random() * 2000) - 1000,
            y: Math.floor(Math.random() * 2000) - 1000,
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

        socket.on('playerMovement', function (movementData) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            players[socket.id].rotation = movementData.rotation;
            socket.broadcast.emit('playerMoved', players[socket.id]);
        });

        socket.on('collectNode', function (nodeId) {
            if (dataNodes[nodeId]) {
                const val = dataNodes[nodeId].value;
                players[socket.id].score += val;
                delete dataNodes[nodeId];

                io.emit('nodeCollected', { playerId: socket.id, nodeId: nodeId, newScore: players[socket.id].score });

                // Respawn a new node
                setTimeout(() => {
                    const newId = 'node_' + Math.random().toString(36).substr(2, 9);
                    dataNodes[newId] = {
                        id: newId,
                        x: Math.floor(Math.random() * 2000) - 1000,
                        y: Math.floor(Math.random() * 2000) - 1000,
                        value: Math.floor(Math.random() * 80) + 20
                    };
                    io.emit('dataNodes', dataNodes); // Or just a newNode event
                }, 3000);
            }
        });
    });

    server.once('error', (err) => {
        console.error(err);
        process.exit(1);
    });

    server.listen(port, () => {
        console.log(`> CyberWorld Simulation Engine Online - Port ${port}`);
    });
});
