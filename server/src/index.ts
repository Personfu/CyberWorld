import http from "http";
import express from "express";
import cors from "cors";
import { Server } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { CyberRoom } from "./rooms/CyberRoom";

const port = Number(process.env.PORT || 2567);
const app = express();

app.use(cors({
  // Phase 2 Compliance: Aggressive CORS lockdown
  origin: ["http://localhost:3000", "https://fllc.net", "https://www.fllc.net"],
  methods: ["GET", "POST", "OPTIONS"]
}));
app.use(express.json());

const server = http.createServer(app);
const gameServer = new Server({
  transport: new WebSocketTransport({
    server
  })
});

// Register the MMO room
gameServer.define("cyber_room", CyberRoom);

app.get("/health", (req, res) => res.send("CyberWorld MMO Server OK"));

gameServer.listen(port).then(() => {
  console.log(`[Colyseus] Authoritative Server deployed and listening on wss://localhost:${port}`);
});
