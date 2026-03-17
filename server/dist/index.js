"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const colyseus_1 = require("colyseus");
const ws_transport_1 = require("@colyseus/ws-transport");
const CyberRoom_1 = require("./rooms/CyberRoom");
const port = Number(process.env.PORT || 2567);
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    // Phase 2 Compliance: Aggressive CORS lockdown
    origin: ["http://localhost:3000", "https://fllc.net", "https://www.fllc.net"],
    methods: ["GET", "POST", "OPTIONS"]
}));
app.use(express_1.default.json());
const server = http_1.default.createServer(app);
const gameServer = new colyseus_1.Server({
    transport: new ws_transport_1.WebSocketTransport({
        server
    })
});
// Register the MMO room
gameServer.define("cyber_room", CyberRoom_1.CyberRoom);
app.get("/health", (req, res) => res.send("CyberWorld MMO Server OK"));
gameServer.listen(port).then(() => {
    console.log(`[Colyseus] Authoritative Server deployed and listening on wss://localhost:${port}`);
});
