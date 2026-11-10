// R532 CPU 검사(사용자 2026-11-10 02:52Z "몹들이 죽을때 종이처럼 눕혀서 죽는게 별로야 … 피격당할때 종이느낌 … 죽을때 찢기거나 터져서 죽는 느낌으로
//  그리고 죽을때 나오는 실루엣이미지도 본체이미지랑 일관성있도록").
//  ① 죽음: 몸 그림 전체를 돌리거나(rotate/opt.angle) 납작하게(scale(1,<1)) 눕히지 않는다 → 자기 그림을 조각(clip 다각형)으로 찢어 흩뿌린다.
//  ② 조각은 빈틈·겹침 없이 몸 상자를 덮고(넓이 합 = 상자), 시간이 갈수록 퍼졌다가 바닥에 내려앉아 멈춘다.
//  ③ 사체 = 같은 그림·같은 좌우·같은 키의 조각들(멈춘 자리 그대로), 색은 본체에 가깝게(검은 실루엣 아님).
//  ④ 피격: R101 몸 움찔·R425 타격감이 그림을 비틀거나(rotate) 한 축만 늘이지(scale x≠y) 않는다 → 맞은 방향으로 밀림(깊이 방향 포함)만.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let pass=0,fail=0;const ok=(n,c,extra)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n,extra===undefined?'':JSON.stringify(extra));}};
const F='mob-death-r462.js',src=C(F);
for(const f of [F,'polish-r101.js','combat-flow-r425.js'])ok('runtime copy matches source '+f,C(f)===RT(f));
ok('no gameplay writes (hp/damage/kill/save/reward)',!/\.hp\s*=[^=]|damage\s*=|killEnemy\s*\(|saveGame|gainXP|room\.kills/.test(src));
ok('revision R532',/R532/.test(src));
// ---- 환경 흉내(호출 기록) ----
function env(o={}){const calls=[];const g={window:{},localStorage:{getItem:()=>o.prefs?JSON.stringify(o.prefs):null,setItem(){}},setTimeout(){},Date,console,calls,Math,JSON};g.window=g;vm.createContext(g);
 vm.runInContext(`var time=0,zoom=1,settings={lowFx:${!!o.low}},room={id:'dist01'},effects=[],VFX={burnFlame:'assets/vfx/burn.png'};
 var ctx={depth:0,save(){this.depth++;calls.push({k:'save'});},restore(){this.depth--;calls.push({k:'restore'});},translate(x,y){calls.push({k:'translate',x,y});},scale(x,y){calls.push({k:'scale',x,y});},rotate(a){calls.push({k:'rotate',a});},
  beginPath(){calls.push({k:'beginPath'});},moveTo(x,y){calls.push({k:'moveTo',x,y});},lineTo(x,y){calls.push({k:'lineTo',x,y});},closePath(){},clip(){calls.push({k:'clip'});},stroke(){calls.push({k:'stroke',s:this.strokeStyle});},fill(){calls.push({k:'fill',s:this.fillStyle});},
  ellipse(){},arc(){},fillRect(){},drawImage(im){calls.push({k:'drawImage',src:im.src});},globalAlpha:1,filter:'none',strokeStyle:'#000',fillStyle:'#000',lineWidth:1,globalCompositeOperation:'source-over'};
 function project(x,y){return{x:x*10,y:y*10};}function actorHeight(){return 60;}function readyImage(p){return{image:{src:p,naturalWidth:1536,naturalHeight:1024},crop:{w:80,h:100}};}
 function sprite(p,x,y,h,opt){calls.push({k:'sprite',p,x,y,h,opt:opt||{}});return true;}
 function drawAssetFrame3(p,f,x,y,h,opt){if(!f)return false;calls.push({k:'frame',p,x,y,h,opt:opt||{}});return true;}
 function texture(){calls.push({k:'texture'});}
 function drawEnemy(e){sprite(e.drawn,0,0,60*(e.big||1),{flip:!!e.flipDraw});sprite('assets/vfx/status.png',0,0,12,{});}
 function drawBurnDeath3(fx){calls.push({k:'base',p:fx.bodyPath||'none'});}
 function drawObjective(){calls.push({k:'objective'});}
 function enterRegion(){return 1;}`,g);
 vm.runInContext(src,g);return g;}
const g=env(),M=g.__STORYWORLD_MOB_DEATH_R462__;ok('installed',M.inspect().installed);
const own=c=>(c.k==='sprite'||c.k==='frame')&&/own-|glass/.test(c.p);
// 살아 있는 몹 기억
const e={id:'m1',name:'망각의 거미 1',hp:10,drawn:'assets/r380/mobs/own-spider.webp',flipDraw:true};vm.runInContext('drawEnemy',g)(e);
// 몸 그림 전체를 눕히는 변환이 있는지: 자기 그림 그리기 직전 저장 구간 안의 rotate / scale(1,<0.95) / opt.angle
function paperFlags(calls){const out={rot:0,squash:0,angle:0,draws:0,clipped:0};const stack=[];let cur={rot:0,squash:0,clip:0};
 for(const c of calls){if(c.k==='save'){stack.push(cur);cur={...cur};}else if(c.k==='restore'){cur=stack.pop()||{rot:0,squash:0,clip:0};}
  else if(c.k==='rotate'&&Math.abs(c.a)>1e-3)cur.rot++;else if(c.k==='scale'&&Math.abs(Math.abs(c.x)-Math.abs(c.y))>.05&&Math.abs(c.y)<.95)cur.squash++;else if(c.k==='clip')cur.clip++;
  else if(own(c)){out.draws++;if(cur.clip)out.clipped++;else{if(cur.rot)out.rot++;if(cur.squash)out.squash++;}if(Math.abs(+c.opt.angle||0)>1e-3)out.angle++;}}return out;}
const run=(fx,ages)=>{const res=[];for(const a of ages){fx.age=a;g.calls.length=0;vm.runInContext('drawBurnDeath3',g)(fx);res.push({a,calls:g.calls.slice(),f:paperFlags(g.calls)});}return res;};
const fx={type:'enemyBurnDeath',sourceId:'m1',x:3,y:4,age:0,life:.72,bodyPath:'assets/other/goat-demon-dead.png'};
const B=run(fx,[.02,.1,.2,.35,.6,.9,1.1]);
ok('blood: own art only, never foreign death frame',B.every(r=>!r.calls.some(c=>(c.k==='sprite'||c.k==='frame')&&/goat-demon/.test(c.p))));
ok('blood: whole body never rotated/squashed/angled (no paper fall)',B.every(r=>r.f.rot===0&&r.f.squash===0&&r.f.angle===0),B.map(r=>r.f));
ok('blood: body torn into ≥6 clipped pieces after burst (age .2)',B.find(r=>r.a===.2).f.clipped>=6,B.find(r=>r.a===.2).f);
ok('blood: burst sheet still drawn',B.some(r=>r.calls.some(c=>c.k==='drawImage'&&/boss-corpse-explosion/.test(c.src))));
// (촬영 뒤 바꿈) 조각 테두리 선은 그림 밖까지 네모로 보였고, 어두운 두께 겹은 3D 기록기 순서에 따라 조각 위로 올라와 검은 실루엣이 됐다 → 둘 다 쓰지 않는다.
ok('blood: no outline strokes and no dark duplicate layer over pieces',B.every(r=>!r.calls.some(c=>c.k==='stroke')&&!r.calls.some(c=>own(c)&&/brightness\(\.[0-4]/.test(c.opt.filter||''))));
// 조각 모양: 빈틈·겹침 없이 상자를 덮는다
const area=P=>{let s=0;for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length];s+=a[0]*b[1]-b[0]*a[1];}return Math.abs(s)/2;};
for(const [asp,low] of [[.8,false],[1.6,false],[.45,true]]){const S=M.shards(12345,asp,low),box=M.shardBox(asp);const sum=S.reduce((s,p)=>s+area(p.poly),0);
 ok(`shards tile the body box (aspect ${asp}${low?' low':''}): area sum = box ±1%`,Math.abs(sum-box.w*box.h)/(box.w*box.h)<.01,{sum,box});
 ok(`shard count ${low?'≤6 (low fx)':'7..12'} aspect ${asp}`,low?S.length<=6&&S.length>=3:S.length>=7&&S.length<=12,S.length);
 ok(`jagged torn edges (≥5 vertices per piece) aspect ${asp}`,S.every(p=>p.poly.length>=5));}
// 조각 움직임: 퍼졌다가 바닥에 멈춤
{const S=M.shards(777,.8,false);const sp=a=>S.reduce((s,p)=>{const q=M.pieceAt('blood',p,a);return s+Math.hypot(q.x-0,q.y+.45);},0)/S.length;
 ok('blood pieces spread out over time',sp(.4)>sp(.12)*1.3&&sp(.12)>=sp(0)-1e-9,[sp(0),sp(.12),sp(.4)]);
 const rest=S.map(p=>M.pieceAt('blood',p,3)),later=S.map(p=>M.pieceAt('blood',p,30));
 ok('pieces come to rest (same at 3s and 30s)',rest.every((q,i)=>Math.abs(q.x-later[i].x)<1e-6&&Math.abs(q.y-later[i].y)<1e-6&&Math.abs(q.ang-later[i].ang)<1e-6));
 ok('rested pieces lie on the ground band (not floating, not far below)',rest.every(q=>q.y<=.16&&q.y>=-.2),rest.map(q=>q.y));
 ok('rested pieces stay near the body (≤1.6 body heights)',rest.every(q=>Math.abs(q.x)<=1.6));
 const F0=S.map(p=>M.pieceAt('fire',p,0)),F1=S.map(p=>M.pieceAt('fire',p,.2));ok('fire: pieces intact while burning red-hot (age<.3)',F1.every((q,i)=>Math.abs(q.x-F0[i].x)<1e-6&&Math.abs(q.y-F0[i].y)<1e-6));
 const Fr=S.map(p=>M.pieceAt('fire',p,3));ok('fire: pieces crumble downward, little sideways scatter (≤.7 h)',Fr.every(q=>Math.abs(q.x)<=.7&&q.y<=.16));}
// 불
const e2={id:'m2',name:'유리 망령',hp:5,drawn:'assets/r380/mobs/glass.webp'};vm.runInContext('drawEnemy',g)(e2);
const fx2={type:'enemyBurnDeath',sourceId:'m2',x:5,y:5,age:0,life:.72,bodyPath:'assets/other/foreign.png'};
const Fx=run(fx2,[.05,.25,.5,.9,1.4]);
ok('fire: engine flame kept without its body, fire sheet drawn',Fx.some(r=>r.calls.some(c=>c.k==='base'&&c.p==='none'))&&Fx.some(r=>r.calls.some(c=>c.k==='drawImage'&&/boss-fire-wall/.test(c.src))));
ok('fire: whole body never rotated/squashed/angled',Fx.every(r=>r.f.rot===0&&r.f.squash===0&&r.f.angle===0),Fx.map(r=>r.f));
ok('fire: red-hot body (same art, brightness ≥2) glows through widening cracks before it breaks (.25), no outline strokes',(()=>{const r=Fx.find(r=>r.a===.25),hot=r.calls.filter(c=>own(c)&&/brightness\((?:[2-9])/.test(c.opt.filter||''));return hot.length>=1&&r.f.clipped>=6&&Fx.every(x=>!x.calls.some(c=>c.k==='stroke'));})());
ok('fire: body breaks into clipped pieces by .9',Fx.find(r=>r.a===.9).f.clipped>=6);
// 사체: 같은 그림·같은 좌우·같은 키, 본체에 가까운 색
vm.runInContext('time=5',g);g.calls.length=0;vm.runInContext('drawObjective',g)();
const cd=g.calls.filter(own);
ok('corpses drawn after objective (2 corpses)',M.inspect().corpses===2&&g.calls[0].k==='objective');
ok('corpse = pieces of the same art (spider path, ≥6 pieces)',cd.filter(c=>/own-spider/.test(c.p)).length>=6);
ok('corpse keeps alive flip (spider drawn flipped)',cd.filter(c=>/own-spider/.test(c.p)).every(c=>c.opt.flip===true));
ok('corpse keeps alive height (60px)',cd.every(c=>Math.abs(c.h-60)<1e-6),cd.map(c=>c.h));
const br=c=>{const m=/brightness\(([\d.]+)\)/.exec(c.opt.filter||'');return m?+m[1]:1;},sat=c=>{const m=/saturate\(([\d.]+)\)/.exec(c.opt.filter||'');return m?+m[1]:1;};
ok('blood corpse colour close to body (brightness ≥ .75, saturate ≥ .8)',cd.filter(c=>/own-spider/.test(c.p)).every(c=>br(c)>=.75&&sat(c)>=.8),cd.map(c=>c.opt.filter));
ok('fire corpse charred but readable (brightness ≥ .5, saturate ≥ .5)',cd.filter(c=>/glass/.test(c.p)).every(c=>br(c)>=.5&&sat(c)>=.5));
ok('corpse not paper: no whole-body rotate/squash',(()=>{const f=paperFlags(g.calls);return f.rot===0&&f.squash===0&&f.angle===0;})());
ok('blood pool sheet under blood corpse',g.calls.some(c=>c.k==='drawImage'&&/blood-death/.test(c.src)));
// 저사양 조각 수
const gl=env({low:true});vm.runInContext('drawEnemy',gl)({id:'k',name:'숲 고블린',hp:3,drawn:'assets/x/own-gob.webp'});const fl={type:'enemyBurnDeath',sourceId:'k',x:1,y:1,age:.3,life:.72};gl.calls.length=0;vm.runInContext('drawBurnDeath3',gl)(fl);
ok('low-fx: ≤6 pieces',paperFlags(gl.calls).clipped<=6&&paperFlags(gl.calls).clipped>=3,paperFlags(gl.calls));
// 끄기: R462 전체 끄기 그대로
const go=env({prefs:{on:false}});vm.runInContext('drawEnemy',go)({id:'m1',name:'망각의 거미',hp:3,drawn:'s.webp'});const fo={type:'enemyBurnDeath',sourceId:'m1',x:1,y:1,age:.1,life:.72,bodyPath:'p.png'};go.calls.length=0;vm.runInContext('drawBurnDeath3',go)(fo);
ok('off switch keeps engine death',go.calls.length===1&&go.calls[0].k==='base');
// ---- ④ 피격 ----
const strip=s=>s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/(^|[^:'"])\/\/.*$/gm,'$1');
const P=strip(C('polish-r101.js'));
const flinchLine=P.split('\n').find(l=>/if\(fu>=0&&fu<1\)/.test(l))||'';
ok('R101 enemy flinch: no squash/stretch or lean (sx/sy/lean untouched)',flinchLine&&!/sx\*=|sy\*=|lean\+=/.test(flinchLine),flinchLine.slice(0,200));
ok('R101 enemy flinch: pushed along the blow incl. depth (screen y)',/fdy|ddy/.test(flinchLine));
const heroLine=P.split('\n').find(l=>/s\.hurtAt\)\/\.26/.test(l))||'';
ok('R101 hero flinch: no rotate/scale',heroLine&&!/c\.rotate|c\.scale/.test(heroLine),heroLine.slice(0,200));
ok('R101 hero flinch: pushed along the blow incl. depth',/hurtDy/.test(heroLine));
const Q=strip(C('combat-flow-r425.js'));const punch=Q.split('\n').find(l=>/const pk=punchK\(s\)/.test(l))||'';
ok('R425 punch: uniform (sx===sy), no one-axis squash',punch&&/sx=sy=|sy=sx=/.test(punch.replace(/\s/g,''))&&!/1-pk\*/.test(punch),punch.slice(0,200));
console.log(`R532 mob death/hit depth: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);
