# StoryWorld R62 relay protocol 1

This protocol is isolated from Hapil: `gameId: "storyworld"`, `build: "R62"`, `protocol: 1` must match exactly. JSON text over `/ws`; query strings are rejected. Use `wss://…/ws` in production. Each room has one authoritative host and at most four total players. The relay never simulates monsters, damage, drops, map rules, RNG, or story decisions.

## Entry and room state

Client requests:

```json
{"type":"create","gameId":"storyworld","build":"R62","protocol":1,"nick":"방장","character":"hwando"}
{"type":"join","gameId":"storyworld","build":"R62","protocol":1,"code":"ABC234","nick":"친구","character":"seoha"}
{"type":"reconnect","gameId":"storyworld","build":"R62","protocol":1,"code":"ABC234","playerId":"server-assigned","token":"in-memory-token"}
```

Characters: `hwando`, `seoha`, `neon`, `michaela`, `lauren`, `hunter`, `slayer`, `gunner`. Nicknames are 1–24 characters, with no control or HTML delimiter characters. Render nicknames with `textContent`, never HTML.

`welcome` includes protocol constants, `code`, `selfId`, `hostId`, `resumeToken`, `graceMs`, `epoch`, `phase`, `regionId`, `layer`, and `players`. The host has a null resume token; host reconnect/migration is deliberately unsupported. Guest tokens rotate after a successful reconnect. Retain a guest token and increasing input sequence only in memory, never a public URL, local storage, diagnostics, export, chat, or log. The server retains only a token hash.

`players` rows are `{id,nick,character,ready,connected,loaded}`. The server creates IDs. `lobby` broadcasts the roster plus room code, host ID, epoch, phase, and region. Phase is `lobby`, `loading`, `playing`, or `paused`.

Client `profile` updates optional `nick`, `character`, and `ready` while in the lobby. The host is always ready. Host `start` requires `regionId` and accepts `layer: "STORY"|"DREAM"` (default STORY) and every player connected/ready. The server advances epoch from 0 to 1 and broadcasts `transition`.

## Loading barrier and host suspension

- Host `{type:"transition",epoch:current+1,regionId,layer}` starts a new region. Only the host can request it, and a second transition cannot overtake an active barrier.
- Server `{type:"transition",epoch,regionId,layer,reason}` reaches every participant. `reason` is `start`, `map`, `late_join`, or `reconnect`.
- Each client loads map assets and returns `{type:"loaded",epoch}`. Server broadcasts `peer_loaded` with player ID.
- Server `{type:"all_loaded",epoch,phase,regionId,layer}` releases combat only after all connected participants report loaded. Host-controlled background pause remains in effect if already active.
- Late join/reconnect uses the existing epoch and a barrier for everyone. The new guest receives the latest snapshot and the host receives `resync` for that player. No map epoch is invented.
- Host `{type:"pause",paused:true|false,reason:"background"|"manual"|"connection"}` broadcasts `paused` including epoch/phase. When hidden, host code must send pause before suspending simulation; browser/OS freezing can still delay this message.
- Loading beyond 90 seconds removes unready guests; if the host is unready, the room closes. Disconnected reserved guests do not hold the current loading barrier forever.

## Authoritative gameplay

Guest/host input:

```json
{"type":"input","epoch":1,"seq":1,"input":{"moveX":0.5,"moveY":0,"attack":true,"guard":false}}
```

Allowed input fields: finite `moveX`, `moveY` in -1…1; boolean `attack`, `guard`, `blink`, `special`, `ego`, `interact`; optional authored `skillSlot` exactly `w`, `e`, or `r`; optional entity `target` string ≤128; optional `route:{x,y}` finite in 0…100. The host still validates movement speed, collisions, cooldown, range, target eligibility, and map rules. No client-specified damage, HP, entity ownership, spawn, reward, or progress update is accepted as input. The relay overwrites any supplied player identity with authenticated `playerId` and forwards only to the room host.

Host snapshot:

```json
{"type":"snapshot","epoch":1,"seq":1,"state":{"version":1,"epoch":1,"seq":1,"zone":"ep1a09","layer":"STORY","time":0,"players":[],"enemies":[],"shots":[],"hazards":[],"effects":[],"room":{},"progress":{"STORY":{},"DREAM":{}}}}
```

The server broadcasts snapshots to guests and retains exactly one newest state per room. State serialization must be an explicit gameplay allowlist; never send the host's single-player save object wholesale. The relay imposes array caps: players 4, enemies 128, shots 512, hazards 256, effects 256, events 256; nested JSON depth ≤16 and ≤50,000 nodes; frame payload ≤512 KiB. These transport caps are not proof that a client state is semantically trustworthy: the host is authoritative and trusted by session participants.

Host `{type:"event",epoch,seq,event:{id,kind,…}}` broadcasts a bounded event. `seq` increases independently for snapshot, event, and each player's input streams, across map transitions and guest reconnect. Old sequences/epochs are rejected. Client state application additionally deduplicates native entity/event IDs and reward ownership. The relay prevents repeated sequence forwarding but cannot validate native battle logic.

Client `{type:"resync",epoch,lastSeq}` gets the newest retained snapshot; the host additionally receives the request with server-assigned player ID. No retained historical events are replayed. Snapshot content must suffice for late join.

## Passive upgrade commands

`{type:"command",epoch,seq,command:{kind:"upgrade",passiveId:"tempo"}}` forwards only to the host with server-assigned `playerId`. The command stream has its own monotonically increasing sequence and a 10/s (20 burst) limit. Only the exact upgrade operation and bounded passive ID are accepted; direct HP, points, level, damage or other mutations are rejected. Host simulation validates the passive ID, available points and upgrade cost, then broadcasts the resulting normal snapshot. Commands work in playing/paused phases so passive menus remain usable, and are refused during loading. Commands from different members cannot impersonate the host.

## R72 golden design extension

The R72 relay source additionally accepts `{type:"command",epoch,seq,command:{kind:"golden",action}}` under the same actor identity, epoch, rate and duplicate protections. Allowed actions are `save`, `rename`, `clone`, `delete`, `learn`, `equip`, `upgrade` and `auto`. Each action has an exact field allowlist. Names are at most24 characters, IDs48, normalized strokes12 and transported points192; the host further normalizes stored designs to96 points and checks learned state, paid capacity and point costs. Clients cannot submit rank totals, points, damage, positions or cooldown mutations as management commands.

Actual casts use optional strict boolean `goldenCast`/`goldenSecond` input flags and an optional finite `{x,y}` `goldenAim` bounded to ±100. The host applies its own range, obstacle, equipment, cooldown and damage checks. These keys are omitted from ordinary R72 input packets, retaining ordinary movement on an older relay. New golden guest actions require this extension to be deployed; this draft does not deploy the public relay. Existing R62 upgrade commands and clients remain supported.

## Departures and errors

- `{type:"leave"}`: explicit guest departure removes its slot immediately. Host departure closes the room.
- Guest socket loss: `peer_disconnected{playerId,graceMs:45000}`. Seat and identity are reserved for 45 seconds; token-based reconnect restores them. Expiry emits `peer_left{playerId,reason:"reconnect_expired"}`.
- Host socket loss, refresh, leave, or heartbeat failure: `room_closed{reason:"host_left"}` to all guests. No succession. Server restart/shutdown loses all rooms; graceful shutdown announces `server_shutdown`.
- Errors use `{type:"error",code,message}`. Entry/version/shape violations can close the socket with policy code 1008. Oversized WebSocket frames close with 1009. Slow connections close with 1013.

## Resource and security bounds

Default 32 rooms, 160 raw connections, 4 seats/room. Per socket: input 40/s (70 burst), snapshot 15/s (20 burst), event 30/s (40 burst), all messages 80/s (160 burst), bytes 2 MiB/s (4 MiB burst); resync 0.5/s (3 burst). Per IP: connection 1/s (30 burst), entry 0.2/s (12 burst). Active connections receive protocol ping every 25 seconds for dead-connection detection only. Compression is disabled; max fragments 64; max buffered chunks 1024; send buffer bounded at 2 MiB. No external keep-alive or sleep circumvention exists.

Production requires an explicit exact HTTPS origin allowlist and TLS or Render's trusted HTTPS proxy header. Origin checks restrict browser callers, not arbitrary custom clients, so they are combined with per-IP/socket limits. This is a trusted-friend room-code service, not an anti-cheat service or account-authenticated game.
