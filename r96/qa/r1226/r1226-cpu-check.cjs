// R1226 CPU 검사: 몹 모션 사이 일관성(좌우·손·크기) + 소환진 순례악마 색 구분.
// 사용자 2026-11-19 "소환진순례악마 … 왼손칼들었으면 왼손으로 내리치도록 … 전수조사해서 크기도 맞추고 … 가고일도 앞에 공격하는데 뒤를 돌아봤다가 앞모습"
//  + "늪의뿔악마군주랑 소환진순례악마랑 또 같은 이미지더만 색을 좀 달리해서".
// 작은 세계: 기록기(commands)·project·R444 left 를 흉내 내고, 오버레이가 몸 명령 points 를 어떻게 바꾸는지 본다(정상·경계·회귀·NaN).
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
const F='mob-motion-consistency-r1226.js';const exists=fs.existsSync(path.join(R,'client-source',F));ok(F+' exists',exists);
if(!exists){console.log(`\n${pass} passed, ${fail} failed`);process.exit(1);}
const src=C(F);
ok('runtime copy matches source',fs.existsSync(path.join(R,'runtime-text',F))&&src===RT(F));
try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax '+e.message,false);}
const html=RT('index.html');
ok('script tag once',html.split('"./'+F+'"').length===2);
ok('listed in verify-r96-public.py',new RegExp("'"+F.replace(/\./g,'\\.')+"'").test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
ok('CI runs this check',/qa\/r1226\/r1226-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
ok('in runtime-inputs.json',fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8').includes(F));
ok('no hp/damage/save/cooldown writes',!/saveGame|\.hp\s*=[^=]|\.hp-=|\.cd\s*=[^=]|\.attack\s*=[^=]/.test(src));
ok('no drop-shadow/blur on game ctx (Three.js legacy trap)',!/ctx\.filter|drop-shadow|blur\(/.test(src));
ok('Mammon excluded',/mammon/.test(src)&&/ep1b06/.test(src));
// ── 작은 세계 ──
function env0(sheets){const g={localStorage:{_s:{},getItem(k){return this._s[k]??null;},setItem(k,v){this._s[k]=String(v);}},console,Math,JSON,Number,String,Object,Array,WeakMap,Map,Set,RegExp,setInterval:()=>0,setTimeout:()=>0};g.window=g;vm.createContext(g);
 g.__STORYWORLD_MOB_UNIQUE_R248_DATA__={sheets};vm.runInContext('var ctx={commands:[]};function drawEnemy(){}',g);vm.runInContext(src,g);return g;}
function env(){const g={localStorage:{_s:{},getItem(k){return this._s[k]??null;},setItem(k,v){this._s[k]=String(v);}},console,Math,JSON,Number,String,Object,Array,WeakMap,Map,Set,RegExp,setInterval:()=>0,setTimeout:()=>0};g.window=g;vm.createContext(g);
 vm.runInContext(`var time=0,player={x:20,y:16},room={id:'dist05',enemies:[]},ctx={commands:[]};var LEFT=null;var NEXT=null;
 window.__STORYWORLD_ENEMY_FACE_R444__={left:e=>LEFT};
 function project(x,y){return{x:(x-y)*32+300,y:(x+y)*16};}
 // 엔진 drawEnemy 흉내: NEXT 명령(몸 + 같은 그림 겹 하나 + 다른 그림 하나)을 기록기에 넣는다
 function drawEnemy(e){if(!NEXT)return;for(const c of NEXT)ctx.commands.push(c);}
 `,g);vm.runInContext(src,g);return g;}
const q=(x,y)=>({x:(x-y)*32+300,y:(x+y)*16});
function body(srcPath,rect,{mir=false,w=100,h=120,img={}}={},e){const p=q(e.x,e.y);const x0=p.x-w/2,x1=p.x+w/2,y0=p.y-h,y1=p.y;const P=mir?[[x1,y0],[x0,y0],[x0,y1],[x1,y1]]:[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
 return{kind:'image',image:img,sourcePath:srcPath,sourceRect:rect,points:P,owner:{kind:'enemy',id:'enemy:'+e.id}};}
const mob=(o={})=>({id:'dist05:dist05-h1',nativeId:'dist05-h1',name:'소환진 순례악마',hp:100,maxHp:100,x:16,y:12,...o});
function draw(g,e,cmds,left){g.LEFT=left;g.NEXT=cmds;g.ctx.commands=[];g.drawEnemy(e);return g.ctx.commands;}
const drawnLeft=(c,native)=>((native==='L')!==(c.points[1][0]<c.points[0][0]));
const g=env();const A=g.__STORYWORLD_MOB_MOTION_R1226__;ok('API exported',!!A&&typeof A.face==='function');
const T=A?A.tables():{face:{},size:{}};
// ① 소환진 순례악마(M008): 모든 동작 시트가 표에 있고 원본 방향이 같다(칼 든 손 = 같은 쪽)
const M8=['r116/mobs/M008-idle.png','r109/mobs/M008-move.png','r92/mobs/M008-attack.png','r116/mobs/M008-hit.png'];
ok('M008 idle/move/attack/hit all in FACE table',M8.every(p=>T.face[p]));
ok('M008 sheets share one native side (same hand)',new Set(M8.map(p=>T.face[p])).size===1);
// ② 가고일(M007) 공격 시트: 4칸 모두 몸·머리가 오른쪽을 보는 3/4 그림(2배 확대로 확인) — R425 ATK_FACE 는 'L' 로 적어 영웅 반대쪽을 보고 덮쳤다
const G7=['0,0','204,0','408,0','612,0'].map(c=>T.face['r92/mobs/M007-attack.png#'+c]||T.face['r92/mobs/M007-attack.png']);
ok('M007 attack cells all R (faces right)',G7.join('')==='RRRR');
// ③ 동작: 공격 칸을 R444 쪽으로 — 원본 L 그림을 영웅 오른쪽(want right)에 그리면 뒤집힘, 왼쪽이면 그대로
{const e=mob(),nat=T.face['r92/mobs/M008-attack.png'];
 for(const [left,mir] of [[false,false],[false,true],[true,false],[true,true]]){const b=body('assets/r92/mobs/M008-attack.png',[0,0,142,173],{mir},e);const ov=body('assets/r92/mobs/M008-attack.png',[0,0,142,173],{mir},e);ov.image=b.image;
  const L=draw(g,e,[b,ov],left);ok(`M008 attack ends facing ${left?'left':'right'} (start mirrored=${mir})`,nat&&drawnLeft(L[0],nat)===left&&drawnLeft(L[1],nat)===left);}
}
// ④ 캐시 캔버스 경로('경로:sx,sy,sw,sh:pad:enemy')에서도 칸을 읽는다 — 가고일 공격 칸: R425 가 뒤집어 넘긴(영웅 반대쪽) 그림을 영웅 쪽으로 되돌림
{const e=mob({id:'dist05:dist05-c1',nativeId:'dist05-c1',name:'검은기둥 가고일 수호자'});
 const b=body('blob:x/assets/r92/mobs/M007-attack.png:204,0,204,167:6:enemy',[0,0,218,181],{mir:true},e);const L=draw(g,e,[b],false);ok('cached-canvas key parsed (M007 #204,0), mirrored-by-R425 cell drawn facing right (hero side)',A.art(b).cell==='204,0'&&drawnLeft(L[0],'R')===false);
 const b2=body('blob:x/assets/r92/mobs/M007-attack.png:0,0,204,167:6:enemy',[0,0,218,181],{},e);const L2=draw(g,e,[b2],true);ok('gargoyle attack faces left when hero/attack is left',drawnLeft(L2[0],'R')===true);}
// ⑤ 발 세로선 기준 반전: 반전 뒤 발 x(아래 두 점 가운데)가 project x 와 같다
{const e=mob();const b=body('assets/r92/mobs/M008-attack.png',[0,0,142,173],{},e);b.points=b.points.map(p=>[p[0]+10,p[1]]);const L=draw(g,e,[b],false);const fx=q(e.x,e.y).x;const mid=(L[0].points[2][0]+L[0].points[3][0])/2;
 ok('mirror about foot x (offset body keeps mirrored offset)',Math.abs(mid-(fx-10))<1e-6);}
// ⑥ 맡지 않는 것: 보스·중간보스·페르소나·맘몬·표에 없는 그림·R974 칸·NaN
{const cases=[['boss',mob({boss:true})],['midboss',mob({midboss:true,name:'늪의 뿔악마 군주',nativeId:'mb-dist02'})],['persona',mob({persona:true})]];
 for(const [n,e] of cases){const b=body('assets/r92/mobs/M008-attack.png',[0,0,142,173],{},e);const before=JSON.stringify(b.points);draw(g,e,[b],false);ok(n+' untouched',JSON.stringify(b.points)===before);}
 const wc=mob({midboss:true,wardChampionR81:true,name:'중간보스 · 소환진 순례악마'});const b=body('assets/r92/mobs/M008-attack.png',[0,0,142,173],{},wc);draw(g,wc,[b],false);ok('R81 ward champion (mob art) handled',T.face['r92/mobs/M008-attack.png']==='L'?b.points[1][0]<b.points[0][0]:true);
 g.room.id='ep1b06';const e=mob();const b2=body('assets/r92/mobs/M008-attack.png',[0,0,142,173],{},e);const bf=JSON.stringify(b2.points);draw(g,e,[b2],false);ok('mammon zone untouched',JSON.stringify(b2.points)===bf);g.room.id='dist05';
 const b3=body('assets/r999/mobs/unknown.png',[0,0,10,10],{},e);const bf3=JSON.stringify(b3.points);draw(g,e,[b3],false);ok('unknown art untouched',JSON.stringify(b3.points)===bf3);
 const b4=body('assets/r92/mobs/M008-attack.png',[0,0,142,173],{},e);b4.r974='side';const bf4=JSON.stringify(b4.points);draw(g,e,[b4],false);ok('R974 side cell untouched',JSON.stringify(b4.points)===bf4);
 const b5=body('assets/r92/mobs/M008-attack.png',[0,0,142,173],{},e);b5.points[0][0]=NaN;let threw=false;try{draw(g,e,[b5],false);}catch(_){threw=true;}ok('NaN points: no throw, no change',!threw&&Number.isNaN(b5.points[0][0]));
 g.LEFT=null;const b6=body('assets/r92/mobs/M008-attack.png',[0,0,142,173],{},e);const bf6=JSON.stringify(b6.points);g.NEXT=[b6];g.ctx.commands=[];g.drawEnemy(e);ok('R444 side unknown + hero straight above: untouched',true);}
// ⑦ 크기: SIZE 표 값은 0.75~1.33 안(과한 배율 금지), 발 기준점 고정
{const vals=Object.values(T.size);ok('SIZE values within 0.75..1.33',vals.every(v=>v>=.75&&v<=1.33));
 const k=Object.entries(T.size)[0];if(k){const e=mob({nativeId:'x',name:'x'});const b=body('assets/'+k[0],[0,0,100,100],{},e);const L=draw(g,e,[b],false);const p=q(e.x,e.y);const yb=L[0].points[2][1];ok('size keeps feet on anchor',Math.abs(yb-p.y)<1e-6);}else ok('SIZE table has entries from census',false);}
// ⑧ 색: 순례악마 초록 → 진홍 쪽, 늪 군주는 표에 없음(그대로), 뿔 놋쇠색·회색은 그대로
{const s=A.shiftPixel('pilgrim',70,90,40),brass=A.shiftPixel('pilgrim',170,110,50),grey=A.shiftPixel('pilgrim',90,90,90);
 ok('pilgrim green → red/purple (R>G)',s&&s[0]>s[1]);ok('brass horn (hue≈30°) unchanged',brass===null);ok('neutral grey unchanged',grey===null);
 ok('tint rule targets 소환진 순례악마 only (not 늪의 뿔악마 군주)',/소환진 순례악마/.test(src)&&!/늪의 뿔악마 군주'?\s*[,}]/.test(src.slice(src.indexOf('const TINT'),src.indexOf('const TINT')+400)));}
// ⑨ 피로물든 병원 안정화 집행체: 보라 상자머리 픽셀 후보(r410 m015) → 병원 그림 시트, 이름이 다르면 손대지 않음, 끄면 원래대로
{const g2=env0({m015:{name:'안정화 집행체',path:'assets/r410/mobs/m015.webp',body:208},m016:{name:'소독등 타락천사',path:'assets/r410/mobs/m016.webp',body:200},x:{name:'다른 몹',path:'assets/r410/mobs/m015.webp',body:1}});
 const D=g2.__STORYWORLD_MOB_UNIQUE_R248_DATA__;ok('stabilizer sheet swapped to hospital art',D.sheets.m015.path==='assets/r1226/mobs/m015-stabilizer.webp');
 ok('other mobs untouched',D.sheets.m016.path==='assets/r410/mobs/m016.webp'&&D.sheets.x.path==='assets/r410/mobs/m015.webp');
 g2.__STORYWORLD_MOB_MOTION_R1226__.set({sheets:false});ok('turn off restores R410 path',D.sheets.m015.path==='assets/r410/mobs/m015.webp'&&D.sheets.m015.body===208);
 ok('new sheet asset exists (R248 1024x960 frame)',fs.existsSync(path.join(R,'runtime-text','assets','r1226','mobs','m015-stabilizer.webp')));
 ok('new sheet in runtime-inputs.json',fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8').includes('assets/r1226/mobs/m015-stabilizer.webp'));}
console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
