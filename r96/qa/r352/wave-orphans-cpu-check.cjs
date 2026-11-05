// R352 남겨진 필드 웨이브 몹 깨우기 — 가짜 전역으로 돌린다(GPU·실기기 아님).
const fs=require('fs'),path=require('path'),assert=require('assert');const root=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const RT=f=>fs.readFileSync(path.join(root,'runtime-text',f),'utf8');const src=RT('wave-orphans-r352.js');
assert.strictEqual(src,fs.readFileSync(path.join(root,'client-source/wave-orphans-r352.js'),'utf8'));ok('client-source and runtime copies agree');
const idx=RT('index.html');assert(idx.split('"./wave-orphans-r352.js"').length===2&&/hwando-arc-r349\.js"><\/script><script src="\.\/wave-orphans-r352\.js"><\/script>/.test(idx));ok('script tag once, after hwando-arc-r349');
const mk=(o)=>({hp:100,spawnState:'hidden',x:10,y:10,...o});
const run=(roomExtra,enemies,heroAt,mode=null)=>{const room={fieldWaves6:[{},{}],fieldWaveIndex6:2,fieldWaveCleared6:true,enemies,...roomExtra};
 const G=new Function('window','localStorage','player','room','started','let time=5,tick=function(){};'+src+';return {tick:()=>tick(),set:v=>{time=v;}};')({__STORYWORLD_COOP_SIM_R62__:{mode:()=>mode}},{getItem:()=>null,setItem(){}},{x:heroAt[0],y:heroAt[1],hp:100},room,true);
 G.tick();return enemies;};
{const es=run({},[mk({fieldWaveIndex6:1}),mk({fieldWaveIndex6:1,boss:true}),mk({}),mk({fieldWaveIndex6:1,x:40})],[12,10]);
 assert.strictEqual(es[0].spawnState,'active');assert.strictEqual(es[0].cd,.8);ok('orphaned wave-1 enemy near the hero wakes like an engine wave activation');
 assert.strictEqual(es[1].spawnState,'hidden');assert.strictEqual(es[2].spawnState,'hidden');ok('bosses and enemies without a wave number stay hidden');
 assert.strictEqual(es[3].spawnState,'hidden');ok('far orphans wait until the hero comes within 11 tiles');}
{const es=run({fieldWaveIndex6:1,fieldWaveCleared6:false},[mk({fieldWaveIndex6:1})],[12,10]);assert.strictEqual(es[0].spawnState,'hidden');ok('the current/next wave is left to the engine (not an orphan)');}
{const es=run({},[mk({fieldWaveIndex6:1})],[12,10],'guest');assert.strictEqual(es[0].spawnState,'hidden');ok('co-op guest never wakes enemies (host authority)');}
{const room={fieldWaves6:[{},{}],fieldWaveIndex6:2,enemies:[]};const G=new Function('window','localStorage','player','room','started','let time=300,tick=function(){};'+src+';return {tick:()=>tick(),set:v=>{time=v;}};')({},{getItem:()=>null,setItem(){}},{x:12,y:10,hp:100},room,true);
 G.tick();G.set(1);room.enemies.push(mk({fieldWaveIndex6:1}));G.tick();assert.strictEqual(room.enemies[0].spawnState,'active');ok('time reset on region entry does not stall the sweep');}
console.log(JSON.stringify({ok:true,checks:n,method:'CPU fake globals; headless separately'}));
