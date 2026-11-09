// R349 환도 위·좌·우 모션 + 대칭 호 베기 — 가짜 전역으로 R277 정책·R349 호 바꿔치기를 돌린다(GPU·실기기 아님).
const fs=require('fs'),path=require('path'),assert=require('assert');const root=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const RT=f=>fs.readFileSync(path.join(root,'runtime-text',f),'utf8'),CS=f=>fs.readFileSync(path.join(root,'client-source',f),'utf8');
for(const f of ['hwando-r277.js','hwando-r271.js','hwando-arc-r349.js'])assert.strictEqual(CS(f),RT(f));ok('client-source and runtime copies agree');
const idx=RT('index.html');assert(idx.split('"./hwando-arc-r349.js"').length===2&&/enemy-hexagram-r341\.js"><\/script><script src="\.\/hwando-arc-r349\.js"><\/script>/.test(idx));ok('script tag once, after enemy-hexagram-r341');
assert(fs.existsSync(path.join(root,'runtime-text/assets/r349/hwando-arc.webp')));ok('symmetric arc asset present');
// R277 정책
{const W={};new Function('window','localStorage',RT('hwando-r277.js'))(W,{getItem:()=>null,setItem(){}});const P=W.__STORYWORLD_HWANDO_R277__;
 assert.strictEqual(P.attackDir('n',0),'e');assert.strictEqual(P.attackDir('e',0),'e');assert.strictEqual(P.attackDir('s',9),'e');assert.strictEqual(P.attackDir('s',-9),'w');assert.strictEqual(P.attackDir('s',0),'w');assert.strictEqual(P.attackDir('n',-9),'w');assert.strictEqual(P.attackDir('n',9),'e');ok('attack: R425 up and down → left/right by side (else last side)');
 // R436(사용자 2026-11-09): 아래 걷기는 새 남향 v2 로 그린다 — walkDir('s') 는 's', 가로 성분으로 마지막 좌·우는 계속 갱신(멈추면 좌·우 선 자세).
 assert.strictEqual(P.walkDir('n',0),'n');assert.strictEqual(P.walkDir('s',3),'s');assert.strictEqual(P.down(),'e');assert.strictEqual(P.walkDir('s',0),'s');assert.strictEqual(P.down(),'e');assert.strictEqual(P.walkDir('w',0),'w');assert.strictEqual(P.walkDir('s',.1),'s');assert.strictEqual(P.down(),'w');ok('walk: R436 down clip on — straight down walks S, last left/right still tracked');
 const W2={};new Function('window','localStorage',RT('hwando-r277.js'))(W2,{getItem:k=>k==='storyworld.r436.hwandoWalkS'?'{"on":false}':null,setItem(){}});const P2=W2.__STORYWORLD_HWANDO_R277__;
 assert.strictEqual(P2.walkDir('s',3),'e');assert.strictEqual(P2.walkDir('s',0),'e');assert.strictEqual(P2.walkDir('w',0),'w');assert.strictEqual(P2.walkDir('s',.1),'w');ok('walk: R436 off switch → old R349 rule (down keeps last left/right)');}
{const s=RT('hwando-r271.js');assert(/function draw\(rec,st,best,anim,dir,frame,opt=\{\}\)\{const ws=anim==='walk'&&dir==='s'&&opt\.s\?wsRes\(\):null;[^]*?if\(dir==='s'&&!ws\)\{const P=P277\(\);if\(P\?\.down\)dir=P\.down\(\);\}/.test(s)&&/S\.dir=P\?\.walkDir\?P\.walkDir\(S\.walkDir,S\.sx\):S\.walkDir/.test(s)&&/\{s:!!ws\}/.test(s));ok('R271 draws down only for walking with the R436 clip (attack/hit/dash/idle still left/right) and asks R277 for the walk direction');}
// R349 호
{const calls=[];const env={window:{},localStorage:{getItem:()=>null,setItem(){}},player:{hero:'hwando',x:0,y:0},project:(x,y)=>({x:x*32,y:y*32})};
 const g=new Function('calls',...Object.keys(env),'let drawEffect=function(e){const q=project(e.x,e.y);let a=0;if(e.type==="slash"){const d=project(e.x+Math.cos(e.angle),e.y+Math.sin(e.angle));a=Math.atan2(d.y-q.y,d.x-q.x);}texture(e.asset,0,0,100,65,{angle:a});},texture=function(p,x,y,w,h,o){calls.push({p,w,h,a:o.angle});};'+RT('hwando-arc-r349.js')+';return {de:e=>drawEffect(e)};')(calls,...Object.values(env));
 const A='assets/vfx/heroes/hwando-a.webp',close=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)))<1e-6;
 const OB=114*Math.PI/180;let k=0;
 for(const [ang,want] of [[0,0],[Math.PI,Math.PI],[-Math.PI/2,-Math.PI/2],[Math.PI/2,Math.PI/2],[.5,Math.PI/4],[2.9,Math.PI]]){calls.length=0;g.de({type:'slash',asset:A,x:0,y:0,angle:ang});const arc=(k++%2)===0;
  assert(calls[0].p===(arc?'assets/r349/hwando-arc.webp':A)&&close(calls[0].a,arc?want:want-OB),'slash '+ang+' '+JSON.stringify(calls[0]));}
 ok("slash: snapped to 8 directions; alternates the symmetric arc and the original slash turned so its bulge faces the enemy");
 calls.length=0;g.de({type:'slash',asset:A,x:0,y:0,angle:Math.PI});calls.length=0;g.de({type:'e568HeroImpact',asset:A,x:-3,y:0,angle:0});assert(calls[0].p==='assets/r349/hwando-arc.webp'&&close(calls[0].a,Math.PI),JSON.stringify(calls[0]));ok('impact at an enemy on the left turns to face away from the hero (same rule)');
 env.player.hero='lauren';calls.length=0;g.de({type:'slash',asset:A,x:0,y:0,angle:0});assert.strictEqual(calls[0].p,A);assert.strictEqual(calls.length,1);ok('other heroes untouched');}
// R349c(Codex 리뷰): 평소 환도 공격을 그리는 hando-final-r49 와 같은 방식의 렌더러로 — readyImage(ART+'a.webp') 를 (방향−π)로 돌리고, 베기는 visualWorldAngle35,
// 적중은 r49Heading 으로 방향을 잡는다. 그림 안 '볼록한 쪽' 각도 + 그리는 회전 = 화면에서 볼록한 쪽이므로 그것이 적 쪽 8방향과 같아야 한다.
{const D=Math.PI/180,IMG={'assets/vfx/heroes/hwando-a.webp':114*D,'assets/r349/hwando-arc-r49.webp':180*D,'assets/r349/hwando-a-r49.webp':180*D};const seen=[];
 const env={window:{},localStorage:{getItem:()=>null,setItem(){}},player:{hero:'hwando',x:0,y:0},project:(x,y)=>({x:(x-y)*32,y:(x+y)*16})};
 const R49=`let drawEffect=function(e){const heading=e.type==='slash'?(Number.isFinite(e.visualWorldAngle35)?e.visualWorldAngle35:e.angle):(Number.isFinite(e.r49Heading)?e.r49Heading:e.r40WorldHeading);
  const zero=project(0,0),v=project(Math.cos(heading),Math.sin(heading)),angle=Math.atan2(v.y-zero.y,v.x-zero.x),row=readyImage('assets/vfx/heroes/hwando-a.webp');seen.push({img:row.image.path,bulge:row.image.bulge+angle-Math.PI});},
  readyImage=function(p){return {image:{path:p,bulge:IMG[p]}};},texture=function(){};`;
 const g=new Function('seen','IMG',...Object.keys(env),R49+RT('hwando-arc-r349.js')+';return {de:e=>drawEffect(e)};')(seen,IMG,...Object.values(env));
 const A='assets/vfx/heroes/hwando-a.webp',close=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)))<1e-6,scr=(wx,wy)=>{const q=env.project(wx,wy),z=env.project(0,0);return Math.atan2(q.y-z.y,q.x-z.x);};
 const cases=[[1,-1,0],[-1,1,Math.PI],[-1,-1,-Math.PI/2],[1,1,Math.PI/2],[1,0,null]];let k=0;const imgs=new Set();
 for(const [wx,wy,want] of cases){const wa=Math.atan2(wy,wx),s0=scr(wx,wy),w8=Math.round(s0/(Math.PI/4))*(Math.PI/4);seen.length=0;g.de({type:'slash',asset:A,x:0,y:0,angle:wa,visualWorldAngle35:wa});
  assert(seen.length===1&&close(seen[0].bulge,want==null?w8:want),'r49 slash '+wx+','+wy+' '+JSON.stringify(seen[0])+' want '+(want??w8));imgs.add(seen[0].img);
  seen.length=0;g.de({type:'e568HeroImpact',asset:A,x:wx*3,y:wy*3,angle:0,r49Heading:wa,r40WorldHeading:wa});assert(seen.length===1&&close(seen[0].bulge,want==null?w8:want),'r49 impact '+JSON.stringify(seen[0]));imgs.add(seen[0].img);k++;}
 assert(imgs.has('assets/r349/hwando-arc-r49.webp')&&imgs.has('assets/r349/hwando-a-r49.webp')&&!imgs.has(A));
 ok('hando-final-r49 path: both alternating variants (pre-rotated arc / original) bulge toward the enemy on 8 snapped directions; the original unrotated sprite is never drawn');}
console.log(JSON.stringify({ok:true,checks:n,method:'CPU fake globals; headless capture separately; no GPU or device'}));
