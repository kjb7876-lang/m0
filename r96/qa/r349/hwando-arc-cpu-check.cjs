// R349 환도 위·좌·우 모션 + 대칭 호 베기 — 가짜 전역으로 R277 정책·R349 호 바꿔치기를 돌린다(GPU·실기기 아님).
const fs=require('fs'),path=require('path'),assert=require('assert');const root=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const RT=f=>fs.readFileSync(path.join(root,'runtime-text',f),'utf8'),CS=f=>fs.readFileSync(path.join(root,'client-source',f),'utf8');
for(const f of ['hwando-r277.js','hwando-r271.js','hwando-arc-r349.js'])assert.strictEqual(CS(f),RT(f));ok('client-source and runtime copies agree');
const idx=RT('index.html');assert(idx.split('"./hwando-arc-r349.js"').length===2&&/enemy-hexagram-r341\.js"><\/script><script src="\.\/hwando-arc-r349\.js"><\/script>/.test(idx));ok('script tag once, after enemy-hexagram-r341');
assert(fs.existsSync(path.join(root,'runtime-text/assets/r349/hwando-arc.webp')));ok('symmetric arc asset present');
// R277 정책
{const W={};new Function('window','localStorage',RT('hwando-r277.js'))(W,{getItem:()=>null,setItem(){}});const P=W.__STORYWORLD_HWANDO_R277__;
 assert.strictEqual(P.attackDir('n',0),'n');assert.strictEqual(P.attackDir('e',0),'e');assert.strictEqual(P.attackDir('s',9),'e');assert.strictEqual(P.attackDir('s',-9),'w');assert.strictEqual(P.attackDir('s',0),'w');ok('attack: up stays up, down → left/right by side (else last side)');
 assert.strictEqual(P.walkDir('n',0),'n');assert.strictEqual(P.walkDir('s',3),'e');assert.strictEqual(P.walkDir('s',0),'e');assert.strictEqual(P.walkDir('w',0),'w');assert.strictEqual(P.walkDir('s',.1),'w');assert.strictEqual(P.down(),'w');ok('walk: no down clip — straight down keeps the last left/right');}
{const s=RT('hwando-r271.js');assert(/function draw\(rec,st,best,anim,dir,frame,opt=\{\}\)\{if\(dir==='s'\)\{const P=P277\(\);if\(P\?\.down\)dir=P\.down\(\);\}/.test(s)&&/S\.dir=P\?\.walkDir\?P\.walkDir\(S\.walkDir,S\.sx\):S\.walkDir/.test(s));ok('R271 never draws a down (s) clip and asks R277 for the walk direction');}
// R349 호
{const calls=[];const env={window:{},localStorage:{getItem:()=>null,setItem(){}},player:{hero:'hwando',x:0,y:0},project:(x,y)=>({x:x*32,y:y*32})};
 const g=new Function('calls',...Object.keys(env),'let drawEffect=function(e){const q=project(e.x,e.y);let a=0;if(e.type==="slash"){const d=project(e.x+Math.cos(e.angle),e.y+Math.sin(e.angle));a=Math.atan2(d.y-q.y,d.x-q.x);}texture(e.asset,0,0,100,65,{angle:a});},texture=function(p,x,y,w,h,o){calls.push({p,w,h,a:o.angle});};'+RT('hwando-arc-r349.js')+';return {de:e=>drawEffect(e)};')(calls,...Object.values(env));
 const A='assets/vfx/heroes/hwando-a.webp',close=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)))<1e-6;
 for(const [ang,want] of [[0,0],[Math.PI,Math.PI],[-Math.PI/2,-Math.PI/2],[Math.PI/2,Math.PI/2]]){calls.length=0;g.de({type:'slash',asset:A,x:0,y:0,angle:ang});assert(calls[0].p==='assets/r349/hwando-arc.webp'&&close(calls[0].a,want),'slash '+ang+' '+JSON.stringify(calls[0]));}
 ok("slash: right ')', left '(', up/down rotated — symmetric arc asset");
 calls.length=0;g.de({type:'e568HeroImpact',asset:A,x:-3,y:0,angle:0});assert(calls[0].p==='assets/r349/hwando-arc.webp'&&close(calls[0].a,Math.PI));ok('impact at an enemy on the left turns to face away from the hero (same rule)');
 env.player.hero='lauren';calls.length=0;g.de({type:'slash',asset:A,x:0,y:0,angle:0});assert.strictEqual(calls[0].p,A);assert.strictEqual(calls.length,1);ok('other heroes untouched');}
console.log(JSON.stringify({ok:true,checks:n,method:'CPU fake globals; headless capture separately; no GPU or device'}));
