# CyberWorld — CyberOS Game Engine Module

> Part of the **CyberOS v2026.3-FLLC** Distribution

CyberWorld MMORPG engine — Phaser 3 based cyberpunk hacker simulation integrated as the core game module in CyberOS.

## Quick Install

```bash
cyberos-install cyberworld-engine
```

## Manual Install

```bash
git clone https://github.com/Personfu/CyberWorld.git /opt/cyberos/modules/cyberworld
cd /opt/cyberos/modules/cyberworld
npm install
npm run dev
```

## Game Modules Included

| Module | Source | Description |
|--------|--------|-------------|
| `cyberworld-engine` | CyberWorld | Phaser 3 MMORPG core |
| `cyberworld-source` | CYBERWORLDSOURCECODE | Full C# engine (ClubPenguin → Cyberpunk) |
| `cyberworld-lite` | CYBERWORLDSOURCECODELITE | Java client (RuneScape → OSINT) |
| `cyberworld-soul` | CYBERWORLDSOULCODE | Creature system (Pokémon → Cyber entities) |

## Combined Game Architecture

```
CyberWorld = ClubPenguin + RuneScape + Pokémon + Hacking + Cybersecurity + FLLC
```

All modules unified under the CyberOS distribution as a single integrated MMORPG experience.
