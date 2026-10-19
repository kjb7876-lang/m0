/* Keep every native R73 relay/save/reconnect assertion. Only update the solo
 * fixture and renderer-ready predicate for the newly versioned R74 annex. */
import fs from'node:fs/promises';import assert from'node:assert/strict';import{createHash}from'node:crypto';import{spawnSync}from'node:child_process';
let source=await fs.readFile('scripts/r73-maze.browser.mjs','utf8');assert.equal(createHash('sha256').update(source).digest('hex'),'56247266959101b32e778f757366259640027a943fe226a0f594258669382b08');
function once(old,next){assert.equal(source.split(old).length-1,1,old);source=source.replace(old,next);}
once("from '../relay/server.mjs'","from '../../relay/server.mjs'");once("const out='out/r73'","const out='out/r74/coop-world'");
once("(!seed||t.currentMazeR73?.seed===seed)","(!seed||t.currentMazeR73?.seed===seed||t.mazeLayoutR73?.worldR74?.seed===seed)");
once("if(legacy)delete raw.mazeR73;else raw.mazeR73.entries['STORY:dist00']=123456;", "if(legacy){delete raw.mazeR73;delete raw.worldR74;}else{raw.mazeR73.entries['STORY:dist00']=123456;raw.worldR74={version:1,entries:{'STORY:dist00':1},opened:{}};}");
once("maze:room.exploration.mazeR73||null,", "world:room.exploration.worldR74||null,maze:room.exploration.mazeR73||null,");
once("assert.ok(beforeHost.maze?.addedCells>0)","assert.equal(beforeHost.world?.version,1)");
once("golden:Object.hasOwn(full,'goldenR72')}","golden:Object.hasOwn(full,'goldenR72'),world:Object.hasOwn(full,'worldR74'),silver:Object.hasOwn(full,'silverR74')}");
source=source.replaceAll("{maze:false,golden:false}","{maze:false,golden:false,world:false,silver:false}");
const begin="const r=room.exploration.mazeR73.rooms[0],q=room.exploration.floorCells.map(([x,y])=>({x:x+.5,y:y+.5})).find(q=>q.x>r.x+.5&&q.x<r.x+r.width-.5&&q.y>r.y+.5&&q.y<r.y+r.depth-.5&&!blocked(q.x,q.y,.4)&&findPath(player,q).length);";
once(begin,"const n=room.exploration.nodes[5],r={x:n.x-3,y:n.y-3,width:6,depth:6},q=room.exploration.floorCells.map(([x,y])=>({x:x+.5,y:y+.5})).find(q=>q.x>r.x+.5&&q.x<r.x+r.width-.5&&q.y>r.y+.5&&q.y<r.y+r.depth-.5&&!blocked(q.x,q.y,.4)&&findPath(player,q).length);");
source=source.replaceAll('R73_MAZE','R74_COOP_WORLD').replace('A seeded solo host and legacy solo guest','A new R74 solo world host and legacy solo guest').replace('transmit no maze field','transmit no maze/world/silver fields');
await fs.mkdir('out/r74',{recursive:true});const file='out/r74/coop-world-generated.mjs';await fs.writeFile(file,source);const run=spawnSync(process.execPath,[file],{stdio:'inherit',env:process.env});if(run.error)throw run.error;assert.equal(run.status,0,'R74 native R63R1 relay/world/save regression');
