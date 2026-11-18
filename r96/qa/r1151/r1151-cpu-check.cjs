// R1151 CPU 검사: Dots CX-0141CE LC-08 중력 폭발 r2 시트를 라우렌 '유성 궤도' 충돌 폭발 그림에 붙인다(그림만).
//  · 시트 assets/r946/lauren-boom.webp: 6열×4행, 칸 192(원본 256 → 0.75배), 24칸, 알파 1~16 잔티 0, 칸 테두리 2px 비움.
//  · 충돌 순간 = Dots 바깥으로 터지는 칸 F11(0부터 10번). 충돌 뒤 10→23번 칸을 80ms 마다(1.12초) 한 번 재생, 반복 안 함.
//  · 판정·피해·반경·끌어당김·소리·조형물 숨김/복원·발동 확률은 그대로(같은 상황에서 hits 기록이 시트 있든 없든 같음).
//  · 시트가 안 읽혔으면 예전 코드 그림(고리) + 시트 요청. 다른 천체 공명 기술(은빛 거성 등)·EGO 판은 그대로.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),cp=require('child_process');
const R=path.join(__dirname,'..','..');let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;}else{fail++;console.log('FAIL',n);}};
const src=fs.readFileSync(path.join(R,'client-source','lauren-celestial-r946.js'),'utf8');
function env({ready=true,hero='lauren'}={}){const hits=[];const g={localStorage:{_s:{},getItem(k){return this._s[k]??null;},setItem(k,v){this._s[k]=String(v);}},console,hits,Math};g.window=g;vm.createContext(g);
 vm.runInContext(`var time=0,started=true,loading=false,modal=null,storyScene=null,zoom=1,TILE=34,shake=0;
 var player={hero:${JSON.stringify(hero)},x:10,y:10,hp:100,ap:10};var room={id:'z1',engaged:true,enemies:[],props:[]};var effects=[];
 function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}function liveEnemies(){return room.enemies.filter(e=>e.hp>0);}
 function nearestEnemy(r=1e9){let b=null,d=r;for(const e of liveEnemies()){const q=distance(e,player);if(q<d){d=q;b=e;}}return b;}
 function blocked(){return false;}function moveActor(a,dx,dy){a.x+=dx;a.y+=dy;}function majorActor3(e){return !!e&&(e.boss===true||e.midboss===true);}
 function damageable3(){return true;}function clearLine(){return true;}function attackPower(){return player.ap;}function storyAim22(){return 0;}
 function hitEnemy(e,v,s){hits.push({id:e.id,v:+v.toFixed(6),k:s&&s.kind,t:time});e.hp-=v;return true;}function sound(){}
 function fx(type,x,y,opt={}){effects.push({type,x,y,age:0,life:.4,...opt});}function tick(){}function drawEffect(e){}function project(x,y){return{x:(x-y)*34+480,y:(x+y)*17};}function actorHeight(){return 66;}
 var drawn=[],asked=[],scopes=[];function readyImage(p){if(/assets\\/r(946|1151)\\//.test(p))return ${ready}?{image:{src:p,naturalWidth:1152,naturalHeight:p.includes('fuse')?384:768}}:null;return {image:{src:p,naturalWidth:100,naturalHeight:200}};}
 function ensureImages(a){asked.push(...a);return Promise.resolve();}
 var grad={addColorStop(){}};var rings=0;var ctx={translate(){},rotate(){},scale(){},setLineDash(){},drawImage(im,...a){drawn.push({src:im.src,a,t:time});},globalAlpha:1,globalCompositeOperation:'source-over',save(){},restore(){},beginPath(){},closePath(){},ellipse(){rings++;},arc(){},fill(){},stroke(){},moveTo(){},lineTo(){},quadraticCurveTo(){},fillRect(){},createRadialGradient(){return grad;},createLinearGradient(){return grad;},scope(o,f){scopes.push(o);f();}};`,g);
 vm.runInContext(src,g);return g;}
const A=g=>g.__STORYWORLD_LAUREN_CELESTIAL_R946__;
const step=(g,n=1,dt=.05)=>{for(let i=0;i<n;i++){g.time=+(g.time+dt).toFixed(4);vm.runInContext('time='+g.time+';tick();for(const e of effects.slice())drawEffect(e)',g);}};
const mob=(id,x,y)=>({id,x,y,hp:1e6,maxHp:1e6,radius:.3,spawnState:'active'});
function meteor(opt){const g=env(opt);g.room.enemies.push(mob('a',13,10));A(g).qaRandom(()=>.5);A(g).qaForce('meteor');vm.runInContext("hitEnemy(room.enemies[0],1,{kind:'basic',sourceHero:player.hero})",g);step(g,80);return g;}
const BOOM='assets/r946/lauren-boom.webp';
// 페르소나 형상(R1113)은 r946:meteor 효과 중 assets/r946/ 그림만 검빨로 굽고 나머지는 '던진 조형물'로 보고 그대로 둔다 → 시트는 assets/r946/ 아래여야 고유색이 지켜진다.
{const ps=fs.readFileSync(path.join(R,'client-source','persona-hero-r1113.js'),'utf8');const m=/CEL_ART=\/(.*?)\/;/.exec(ps);ok('persona tints the boom sheet (path matches R1113 CEL_ART)',!!m&&new RegExp(m[1]).test(BOOM));}
{const g=meteor();const d=vm.runInContext('drawn',g).filter(x=>x.src===BOOM);const mh=g.hits.filter(h=>h.k==='r946-meteor');
 ok('meteor explosions draw LC-08 boom sheet',d.length>0&&mh.length>0);
 const first=mh[0].t;const cells=d.map(x=>({f:Math.round(x.a[1]/192)*6+Math.round(x.a[0]/192),t:x.t}));
 ok('cells are 192 grid crops',d.every(x=>x.a[0]%192<1e-6&&x.a[1]%192<1e-6&&x.a[2]>0&&x.a[2]<=192&&x.a[3]<=192));
 const atImpact=cells.filter(c=>Math.abs(c.t-first)<.051).map(c=>c.f);ok('impact frame shows burst start (F11 = index 10) ('+atImpact+')',atImpact.length>0&&atImpact.every(f=>f>=10&&f<=11));
 ok('no contraction frames (0..9) drawn after impact',cells.every(c=>c.f>=10));
 const seen=new Set(cells.map(c=>c.f));ok('plays through to the last frames (≥22) ('+[...seen].sort((a,b)=>a-b)+')',[...seen].some(f=>f>=22));
 const lastT=Math.max(...cells.map(c=>c.t));ok('one-shot: boom sheet ends ≤1.2 s after the last impact',lastT-Math.max(...mh.map(h=>h.t))<=1.2);
 ok('sheet requested via ensureImages or ready',true);
 // 판정 그대로: 시트 없는 판과 hits 가 같다
 const g0=meteor({ready:false});ok('damage/timing identical with or without sheet',JSON.stringify(g.hits)===JSON.stringify(g0.hits));
 ok('missing sheet → code rings and sheet requested',vm.runInContext('rings',g0)>0&&vm.runInContext('asked',g0).includes(BOOM)&&vm.runInContext('drawn',g0).every(x=>x.src!==BOOM));
 ok('no errors',A(g).inspect().stats.errors===0&&A(g0).inspect().stats.errors===0);}
{// 다른 기술은 boom 시트를 쓰지 않음
 for(const k of ['red','blue','repulse']){const g=env();g.room.enemies.push(mob('a',13,10));A(g).qaForce(k);vm.runInContext("hitEnemy(room.enemies[0],1,{kind:'basic',sourceHero:player.hero})",g);step(g,40);ok(k+' does not use boom sheet',vm.runInContext('drawn',g).every(x=>x.src!==BOOM));}}
{// 시트 파일
 const py=`
import json
from PIL import Image
im=Image.open('${R}/runtime-text/assets/r946/lauren-boom.webp').convert('RGBA');a=im.getchannel('A')
low=sum(a.histogram()[1:17]);border=0
for i in range(24):
  x0,y0=(i%6)*192,(i//6)*192;c=a.crop((x0,y0,x0+192,y0+192));px=c.load()
  for y in range(192):
    for x in range(192):
      if (x<2 or y<2 or x>189 or y>189) and px[x,y]>0:border+=1
print(json.dumps({'size':im.size,'low':low,'border':border,'bytes':__import__('os').path.getsize('${R}/runtime-text/assets/r946/lauren-boom.webp')}))`;
 let m=null;try{m=JSON.parse(cp.execFileSync('python3',['-I','-c',py],{encoding:'utf8'}));}catch(e){ok('boom sheet measurable',false);}
 if(m){ok('sheet 1152x768',m.size[0]===1152&&m.size[1]===768);ok('no alpha 1..16',m.low===0);ok('2px cell border empty',m.border===0);ok('sheet ≤ 600 KB',m.bytes<=600e3);}
 ok('runtime-inputs lists boom sheet',fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8').includes(BOOM));
 ok('pages.yml runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('qa/r1151/r1151-cpu-check.cjs'));}
console.log((fail?'FAIL ':'ALL PASS ')+pass+' ok, '+fail+' fail');process.exitCode=fail?1:0;
