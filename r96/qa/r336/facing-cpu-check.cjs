// R336 영웅 방향: 좌우 240°, 위아래 120° 검사.
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const src=fs.readFileSync(path.join(root,'client-source/hero-facing-r336.js'),'utf8');
assert.strictEqual(src,fs.readFileSync(path.join(root,'runtime-text/hero-facing-r336.js'),'utf8'));ok('client-source and runtime copies agree');
const idx=fs.readFileSync(path.join(root,'runtime-text/index.html'),'utf8');assert(idx.split('"./hero-facing-r336.js"').length===2);ok('script tag loaded once');
const base=/function facing\(x,y\)\{[^}]*\}/.exec(idx)[0];
const run=new Function('window','localStorage',base+';\n'+src+';\nreturn facing;');const f=run({}, {getItem:()=>null,setItem(){}});
// 화면 각도(도)마다 세계 방향 (x,y) 를 역산: sx=x-y, sy=(x+y)/2 → x=(sx+2sy)/2, y=(2sy-sx)/2
let side=0,vert=0;for(let d=0;d<360;d++){const a=d*Math.PI/180,sx=Math.cos(a),sy=Math.sin(a),x=(sx+2*sy)/2,y=(2*sy-sx)/2,r=f(x,y);if(r==='left'||r==='right')side++;else vert++;}
assert(side>=238&&side<=242,'side '+side);ok('left/right covers ~240° of screen angles ('+side+'°), up/down '+vert+'°');
const old=new Function(base+';return facing;')();let oldSide=0;for(let d=0;d<360;d++){const a=d*Math.PI/180,sx=Math.cos(a),sy=Math.sin(a);const r=old((sx+2*sy)/2,(2*sy-sx)/2);if(r==='left'||r==='right')oldSide++;}
assert(oldSide<180);ok('engine default was only '+oldSide+'° left/right');
assert.strictEqual(f(1,-1),'right');assert.strictEqual(f(-1,1),'left');assert.strictEqual(f(1,1),'front');assert.strictEqual(f(-1,-1),'back');ok('pure screen directions unchanged');
// R118 전투 방향 API(4방향 칼잡이)도 같은 기준을 쓴다(Codex 리뷰: 65° 화면각 → front)
{const W={};new Function('window','localStorage',base+';\n'+src)(W,{getItem:()=>null,setItem(){}});const P=W.__STORYWORLD_HERO_FACING_R336__.pick;const a=65*Math.PI/180,sx=Math.cos(a),sy=Math.sin(a);
 assert.strictEqual(P((sx+2*sy)/2,(2*sy-sx)/2),'front');const r118=fs.readFileSync(path.join(root,'client-source/combat-r118.js'),'utf8');assert(/__STORYWORLD_HERO_FACING_R336__\?\.pick\?\.\(foe\.x-player\.x,foe\.y-player\.y\);if\(f4\)return f4;\}return FOUR\[sec\];/.test(r118));
 ok('R118 combat direction for four-direction heroes uses the R336 split (65° screen angle → front)');}
console.log(JSON.stringify({ok:true,checks:n,method:'static + pure CPU over 360 screen angles'}));
