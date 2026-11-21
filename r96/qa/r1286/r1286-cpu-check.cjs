// R1286 CPU 검사: EGO 진입 이펙트 손질(사용자 2026-11-21 01:36Z).
//  ① F(EGO 진입) 때 영웅 둘레에 솟던 땅 균열(세 봉우리, pvfx-earth-rupture)을 모든 영웅에서 뺀다.
//  ② 미카엘라만 두르던 구름 오라(R1041 M3)를 영웅 고유색으로 물들여 모든 영웅 EGO 진입에 둘린다(미카엘라는 원래 시트 그대로).
//  ③ 땅 균열은 반투명 검정으로 바꿔 적 공격에 맞았을 때 영웅 자리에 솟게 한다(암흑 그림자 공격 느낌).
//  ④ 일반 몹 돌진(R286) 착지 균열은 착지 자리에 띄우지 않고, 그 돌진이 플레이어를 맞혔을 때만 플레이어 자리에 조금 작고 반투명하게.
//  정상 경로·경계값·회귀를 함께 본다. 브라우저 화면 확인은 qa/r1286/r1286-browser.mjs (헤드리스 소프트웨어 렌더, GPU 미검증).
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let pass=0,fail=0;const ok=(n,c,info)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n,info===undefined?'':JSON.stringify(info).slice(0,400));}};
const F='ego-cloud-r1286.js';const exists=fs.existsSync(path.join(R,'client-source',F));ok(F+' exists',exists);
if(!exists){console.log(JSON.stringify({pass,fail}));process.exit(1);}
const src=C(F);
ok('runtime copy matches source',fs.existsSync(path.join(R,'runtime-text',F))&&src===RT(F));
try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax '+e.message,false);}
const html=RT('index.html');
ok('script tag once',html.split('"./'+F+'"').length===2);
ok('own line right after hero-dots-fx-r1041 (wraps lazily, stays outermost)',html.includes('<script src="./hero-dots-fx-r1041.js"></script>\n<script src="./'+F+'"></script>\n'));
ok('listed in verify-r96-public.py',new RegExp("'"+F.replace(/\./g,'\\.')+"'").test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
ok('CI runs this check',/qa\/r1286\/r1286-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
for(const a of ['assets/r1286/ego-cloud-on.webp','assets/r1286/ego-cloud-loop.webp']){const p=path.join(R,'runtime-text',a);ok('asset shipped '+a,fs.existsSync(p)&&fs.statSync(p).size>20000&&fs.statSync(p).size<700000);}
const man=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');ok('cloud sheets in runtime-manifest',man.includes('assets/r1286/ego-cloud-on.webp')&&man.includes('assets/r1286/ego-cloud-loop.webp'));
ok('Michaela original M3 sheets untouched (still shipped)',fs.existsSync(path.join(R,'runtime-text','assets/r1041/fx-m3-michaela-ego-on.webp'))&&fs.existsSync(path.join(R,'runtime-text','assets/r1041/fx-m3-michaela-ego-loop.webp')));
ok('no new key bindings / no save writes / no hp writes',!/addEventListener\(\s*['"]key/.test(src)&&!/saveGame/.test(src)&&!/player\.hp\s*=[^=]/.test(src));
ok('no blur/drop-shadow, no code-drawn shapes (arc/ellipse/lineTo/fillRect)',!/drop-shadow|blur\(/.test(src)&&!/\.(arc|ellipse|lineTo|fillRect|strokeRect)\(/.test(src));
ok('no damage / cooldown changes',!/\.(egoCD|resonance|damage)\s*[-+*]?=[^=]/.test(src));

// ---- 가짜 게임 ----
function env(o={}){
 const store={...(o.store||{})};
 const plays=[],pushed=[];let T=10;
 const PAL={hwando:{a:[214,222,234],b:[255,198,72]},slayer:{a:[222,22,52],b:[220,226,236]},michaela:{a:[178,26,62],b:[220,226,236]},lauren:{a:[164,98,255],b:[220,226,236]},gunner:{a:[70,124,255],b:[220,226,236]}};
 const img=(w,h)=>({width:w,height:h,naturalWidth:w,naturalHeight:h,complete:true});
 const ready={'assets/r1286/ego-cloud-on.webp':img(2304,384),'assets/r1286/ego-cloud-loop.webp':img(3840,384)};
 if(o.noImage){delete ready['assets/r1286/ego-cloud-on.webp'];delete ready['assets/r1286/ego-cloud-loop.webp'];}
 const putCalls=[];
 const g={console,Math,Date,Number,String,Object,Array,JSON,Map,WeakMap,Set,WeakSet,Error,isFinite,parseFloat,Uint8ClampedArray,Promise,
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},
  setTimeout:()=>0,setInterval:()=>0,clearInterval:()=>{},
  document:{createElement:()=>{const c={width:0,height:0,getContext:()=>({drawImage(){},getImageData:(x,y,w,h)=>{const d=new Uint8ClampedArray(w*h*4);for(let i=0;i<d.length;i+=4){d[i]=d[i+1]=d[i+2]=200;d[i+3]=255;}return {data:d};},putImageData:(d)=>{putCalls.push(d.data.slice(0,4));}})};return c;}},
  readyImage:p=>ready[p]?{image:ready[p]}:null,addImage:()=>{},
  player:{x:5,y:6,hero:o.hero||'slayer',hp:500,ego:0,egoCD:0,resonance:100,samong:0,...(o.player||{})},
  room:{enemies:[]},
  actorHeight:()=>60,
 };
 Object.defineProperty(g,'time',{get:()=>T,set:v=>{T=v;}});
 g.window=g;g.globalThis=g;
 g.__STORYWORLD_HERO_FX_R102__={PALETTE:PAL};
 g.__STORYWORLD_PIXELFX_R163__=Object.freeze({has:()=>true,play:(n,x,y,opt)=>{plays.push({n,x,y,o:opt||{}});return {};},stop(){}});
 // 엔진 ego(): 안쪽에서 R225 처럼 균열 셋 + 폭발 + R178 공명 깨짐을 띄운다
 g.ego=function(){const p=g.player;if(p.ego>0||p.egoCD>0)return;p.ego=3;p.egoCD=6;const P=g.__STORYWORLD_PIXELFX_R163__;
  P.play('dark-explosion-blood',p.x,p.y,{k:1.35});for(let i=0;i<3;i++)P.play('pvfx-earth-rupture',p.x+1.6,p.y,{k:.85,tint:{a:[100,10,20],b:[220,226,236]}});P.play('pvfx-resonant-break',p.x,p.y,{k:1.15});};
 g.hurt=function(d,src){if(g.player.invincible>0)return 'invulnerable';g.player.hp-=d;return 'hit';};
 class DC{constructor(){this.commands=[];this.owner={};this.globalAlpha=1;}push(kind,data){pushed.push({kind,data,owner:{...this.owner}});this.commands.push({kind,...data});}}
 g.StoryPhase1={DrawCommands:DC};
 vm.createContext(g);vm.runInContext(src,g);
 const api=g.__STORYWORLD_EGO_CLOUD_R1286__;try{api&&api.arm&&api.arm();}catch(e){console.log('arm error',e.message);}
 return {g,api,plays,pushed,putCalls,store,step:dt=>{T+=dt;},DC};
}
const RUP='pvfx-earth-rupture';
// ① F 때 균열 빼기
{const E=env({hero:'slayer'});ok('API present',!!E.api&&typeof E.api.inspect==='function');
 E.g.ego();const rup=E.plays.filter(p=>p.n===RUP),other=E.plays.filter(p=>p.n!==RUP).map(p=>p.n);
 ok('① EGO entry: no earth-rupture around hero',rup.length===0,E.plays.map(p=>p.n));
 ok('① EGO entry: other entry fx kept (dark explosion, resonant break)',other.includes('dark-explosion-blood')&&other.includes('pvfx-resonant-break'),other);
 E.plays.length=0;E.g.__STORYWORLD_PIXELFX_R163__.play(RUP,1,1,{k:1.15});ok('① regression: earth-rupture outside EGO entry (slayer Q) still plays',E.plays.length===1&&E.plays[0].n===RUP);}
for(const h of ['hwando','michaela','lauren','gunner']){const E=env({hero:h});E.g.ego();ok('① '+h+' EGO entry: no earth-rupture',!E.plays.some(p=>p.n===RUP));}
// ④ R286 착지 균열(그 지문: k .45 + BLOOD tint a[70,6,10]) 은 착지 자리에 안 나옴
{const E=env();E.g.__STORYWORLD_PIXELFX_R163__.play(RUP,9,9,{k:.45,tint:{a:[70,6,10],b:[220,70,52]}});ok('④ mob dash landing crack not drawn at landing spot',E.plays.length===0,E.plays);
 E.g.__STORYWORLD_PIXELFX_R163__.play(RUP,9,9,{k:.45,tint:{a:[100,6,10],b:[220,70,52]}});ok('④ boundary: same size other tint is not treated as dash crack',E.plays.length===1);}
// ③ 적 공격 적중 → 영웅 자리에 반투명 검은 균열
const isBlack=p=>p.n===RUP&&p.o.tint&&p.o.tint.a.every(v=>v<=40)&&p.o.tint.b.every(v=>v<=90)&&p.o.alpha>0&&p.o.alpha<=.75;
const isGray=p=>p.n===RUP&&p.o.tint&&Math.max(...p.o.tint.a)-Math.min(...p.o.tint.a)<=16&&p.o.tint.a[0]>=70&&p.o.alpha>0&&p.o.alpha<=.65&&p.o.k<.45;
{const E=env();const foe={id:'m1',x:7,y:6,hp:30,damage:10};E.g.room.enemies.push(foe);
 E.g.hurt(10,foe);const b=E.plays.filter(isBlack);
 ok('③ hit by enemy → translucent black rupture at hero feet, left and right (not over the body)',b.length===2&&b.every(q=>Math.hypot(q.x-5,q.y-6)>1&&Math.hypot(q.x-5,q.y-6)<1.6)&&(b[0].x-b[0].y)<(5-6)&&(b[1].x-b[1].y)>(5-6),E.plays);
 E.step(.2);E.g.hurt(10,foe);ok('③ boundary: 2nd hit within .2s does not stack another',E.plays.filter(isBlack).length===2);
 E.step(.6);E.g.hurt(10,foe);ok('③ hit after gate (.8s) shows again',E.plays.filter(isBlack).length===4);
 E.plays.length=0;E.step(1);E.g.player.invincible=1;E.g.hurt(10,foe);ok('③ no fx when hit was blocked (hp unchanged)',E.plays.length===0);
 E.g.player.invincible=0;E.step(1);E.g.hurt(0,foe);ok('③ boundary: zero damage → no fx',E.plays.length===0);
 E.g.player.ego=0;E.plays.length=0;E.step(1);E.g.ego();ok('③ regression: EGO entry itself still no rupture after hits',!E.plays.some(p=>p.n===RUP));}
// ④ 돌진 적중 → 플레이어 자리에 작은 반투명 회색 균열(검은 균열과 겹치지 않음)
{const E=env();const foe={id:'m2',x:6,y:6,hp:30,damage:10,r286:{mode:'dash'}};E.g.room.enemies.push(foe);
 E.g.hurt(10,foe);ok('④ dash hit → one small translucent gray crack beside the player, on the dashing mob\'s side',E.plays.length===1&&isGray(E.plays[0])&&(E.plays[0].x-E.plays[0].y)>(5-6)&&Math.hypot(E.plays[0].x-5,E.plays[0].y-6)<1.6,E.plays);}
{const E=env();const foe={id:'m3',x:9,y:9,hp:30,damage:10,r286:{mode:null}};E.g.room.enemies.push(foe);
 E.g.__STORYWORLD_PIXELFX_R163__.play(RUP,9,9,{k:.45,tint:{a:[70,6,10],b:[220,70,52]}});E.step(.5);E.g.hurt(10,foe);
 ok('④ hit right after that mob landed a dash → gray crack at player',E.plays.length===1&&isGray(E.plays[0])&&Math.hypot(E.plays[0].x-5,E.plays[0].y-6)<1.6,E.plays);
 E.plays.length=0;E.step(3);E.g.hurt(10,foe);ok('④ boundary: same mob 3s later (dash long over) → black hit rupture instead',E.plays.length===2&&E.plays.every(isBlack),E.plays);}
// ② 구름 오라: R1039 r111:ego-back/front 의 sig-aura·sig-gather 를 영웅색 구름 시트로
const quad=[[0,0],[100,0],[100,100],[0,100]];
function draw(E,id,pathName){const d=new E.DC();d.owner={id,kind:'effect'};d.push('image',{image:{},sourcePath:pathName,points:quad.map(p=>p.slice())});return E.pushed[E.pushed.length-1];}
{const E=env({hero:'slayer'});E.g.ego();
 const b=draw(E,'r111:ego-back','assets/r100/sig-aura-red.webp');
 ok('② slayer EGO back aura → tinted cloud sheet',b&&/^r1286:cloud:/.test(b.data.sourcePath)&&b.data.image&&b.data.sourceRect&&b.data.sourceRect[2]===384,b&&b.data.sourcePath);
 ok('② cloud frame fits around the body (bigger than aura quad, feet anchored)',b&&b.data.points&&Math.abs(b.data.points[1][0]-b.data.points[0][0])>90);
 const n=E.pushed.length;const f=draw(E,'r111:ego-front','assets/r100/sig-aura-red.webp');ok('② front aura layer dropped (one cloud only)',E.pushed.length===n);
 draw(E,'r111:ego-back','assets/r100/sig-gather-red.webp');ok('② gather swirl dropped (cloud "on" frames replace it)',E.pushed.length===n);
 E.step(.1);const b2=draw(E,'r111:ego-back','assets/r100/sig-aura-red.webp');ok('② first .5s uses the "on" (rising) sheet',/:on:/.test(b2.data.sourcePath));
 E.step(.8);const b3=draw(E,'r111:ego-back','assets/r100/sig-aura-red.webp');ok('② after .5s since EGO entry uses the loop sheet (even if a frame was skipped)',/:loop:/.test(b3.data.sourcePath));
 ok('② tint uses slayer colour (crimson)',/:slayer:/.test(b3.data.sourcePath)&&E.api.tintFor().a.join()==='222,22,52');}
{const E=env({hero:'michaela',player:{ego:3}});const b=draw(E,'r111:ego-back','assets/r100/sig-aura-magenta.webp');
 ok('② regression: Michaela keeps her own sheet path (R1041 handles it)',b&&b.data.sourcePath==='assets/r100/sig-aura-magenta.webp');}
{const E=env({hero:'gunner',noImage:true,player:{ego:3}});const b=draw(E,'r111:ego-back','assets/r100/sig-aura-blue.webp');
 ok('② cloud sheet not loaded yet → original aura kept (never empty)',b&&b.data.sourcePath==='assets/r100/sig-aura-blue.webp');}
{const E=env({hero:'hwando'});const b=draw(E,'r101:aura-back:hero','assets/r100/sig-aura-pale.webp');ok('② other owners untouched',b&&b.data.sourcePath==='assets/r100/sig-aura-pale.webp');}
{const E=env({hero:'hwando',player:{egoSovereignR1046:true,ego:3}});ok('② EGO form → 언주 + white',E.api.tintFor().a.join()==='204,52,40'&&E.api.tintFor().b.join()==='243,238,226');
 const b=draw(E,'r111:ego-back','assets/r100/sig-aura-pale.webp');ok('② EGO form cloud key',/:ego:/.test(b.data.sourcePath));}
{const E=env({hero:'lauren',player:{personaHeroR1113:true,ego:3}});ok('② persona form → 언주',E.api.tintFor().a.join()==='204,52,40');}
{const E=env({hero:'lauren'});ok('② lauren → violet',E.api.tintFor().a.join()==='164,98,255');}
{const E=env({hero:'slayer',player:{ego:3}});draw(E,'r111:ego-back','assets/r100/sig-aura-red.webp');const n1=E.putCalls.length;E.step(.2);draw(E,'r111:ego-back','assets/r100/sig-aura-red.webp');
 ok('② tint baked once per hero (cached)',n1>0&&E.putCalls.length===n1,{n1,n2:E.putCalls.length});
 const px=E.putCalls[0];ok('② tinted pixel is hero-coloured, not grey',px&&px[0]>px[1]+40,px&&Array.from(px));}
// 끄기
{const E=env({store:{'storyworld.r1286.egoFx':'off'}});E.g.ego();ok('off switch: EGO entry rupture back to original',E.plays.filter(p=>p.n===RUP).length===3);
 const foe={id:'m',x:6,y:6,hp:1,damage:1};E.plays.length=0;E.g.hurt(10,foe);ok('off switch: no hit fx',E.plays.length===0);}
{const E=env();ok('inspect has stats',E.api.inspect().revision.startsWith('R1286'));}
console.log(JSON.stringify({pass,fail}));process.exit(fail?1:0);
