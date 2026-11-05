// R333 집결 덫 입구 감지 검사.
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const R=f=>fs.readFileSync(path.join(root,f),'utf8');
for(const f of['story-maps-r171.js','world-combat-r78.js'])assert.strictEqual(R('client-source/'+f),R('runtime-text/'+f),f);ok('client-source and runtime copies agree');
const m=R('client-source/story-maps-r171.js'),c=R('client-source/world-combat-r78.js');
assert(/gatherAnchor:gather,gatherBounds,rallyTriggers,/.test(m));ok('story maps export gatherBounds and rallyTriggers');
assert(/inLink\(nx,ny\)/.test(m));ok('boss link corridor is not an entrance trigger');
assert(/if\(rallyTripped\(g\)\)\{s\.route\?\?=/.test(c)&&/distance\(player,g\.gatherAnchor\)<=5\.5\)return true/.test(c));ok('rally fires on the old 5.5-tile centre check OR room bounds OR any entrance trigger');
// 실행: rallyTripped 만 떼어 가짜 값으로
const fn=c.slice(c.indexOf('function rallyTripped'),c.indexOf('\n',c.indexOf('return false;}',c.indexOf('function rallyTripped')))+1);
const t=new Function('player','distance','metrics',fn+';return rallyTripped;');const metrics={},dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const g={gatherAnchor:{x:16,y:33},gatherBounds:[4,27,28,39],rallyTriggers:[{x:28.5,y:35.5,r:2.2},{x:11.5,y:39.5,r:2.2}]};
assert(t({x:30,y:35.5},dist,metrics)(g));ok('standing just outside the east entrance (14 tiles from centre) trips the trap');
assert(t({x:11.5,y:41},dist,metrics)(g));ok('south entrance approach trips the trap');
assert(t({x:5,y:28},dist,metrics)(g));ok('any corner inside the room trips the trap');
assert(!t({x:45,y:55},dist,metrics)(g));ok('far away does not trip');
console.log(JSON.stringify({ok:true,checks:n,method:'static + pure CPU; headless u205 entrance 12.7 tiles from centre -> rally'}));
