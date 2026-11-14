// R1028 CPU check — 적 촉수 이펙트 타격감(사용자 2026-11-14 "적촉수 이펙트 확실하게 타격감있게 제대로 나오는지").
//  점검(헤드리스·코드): 적 촉수는 세 군데 — 사몽 보스 '촉수' 패턴(samong-r103 장판 16개 + samong-play-r162 시트), 사몽 탑의 피의 육망성(combat-r170),
//   타락 계열 보스 장판(skill-sheets-r411 boss-tentacle-bind). 셋 다 피해가 들어가는 순간(장판 age = warning)에 촉수가 아직 땅에서 솟기 전이었다.
//   · R162: delay = warn − 0.12, 18fps → 맞는 순간 2번째 칸(납작한 혹), 다 솟는 건 0.2초 뒤·감기는 건 0.6초 뒤.
//   · R170: 맞는 순간(age ≥ warning)에야 0번 칸부터 8fps 재생 → 다 솟는 건 0.7초 뒤.
//   · R411: 앞당김 0.25초(12.5fps) → 맞는 순간 3번째 칸.
//   · 사몽 P 구역 밖에선 촉수 시트가 R163 도트판(208×130 칸을 크게 늘림)이라 픽셀이 보였다.
//   · 맞았을 때 영웅 자리에 터지는 그림이 없었다(피해 숫자만).
//  기대: 맞는 순간 촉수가 다 솟은 칸(24칸 시트의 5~7번, 전체의 23~30%)이 보이고, 영웅이 장판 안에 있었으면 그 자리에 피·뼛조각 적중 시트가 한 번 터진다.
//   촉수 시트는 어디서나 칠한 시트(R976 과 같은 그림). 판정·피해·시간·서사는 그대로(그림만).
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
let bad=0,n=0;const ok=(m,c,x)=>{n++;if(!c){bad++;console.log('FAIL',m,x!==undefined?JSON.stringify(x):'');}else console.log('ok  ',m);};
const FILE='tentacle-strike-r1028.js';let src='';try{src=C(FILE);}catch(_){}
ok('overlay file exists',!!src);
try{ok('runtime copy matches client source',fs.readFileSync(path.join(R,'runtime-text',FILE),'utf8')===src);}catch(_){ok('runtime copy matches client source',false);}
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
ok('index.html loads the overlay once, on its own line before the long overlay line (it hooks pixelfx/R411 lazily, so load order does not matter)',html.split('"./tentacle-strike-r1028.js"').length===2&&/\n<script src="\.\/tentacle-strike-r1028\.js"><\/script>\n/.test(html));
ok('pages.yml runs this check',/r96\/qa\/r1028\/tentacle-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
// 원래 R163 표(도트판)
const DOT={'tendrils-blood':{file:'tendrils-blood.webp',frame:[208,130],pivot:[104,106],columns:6,frames:44,fps:15,loop:false},'dark-explosion-blood':{file:'dark-explosion-blood.webp',frame:[280,248],pivot:[140,206],columns:7,frames:55,fps:15,loop:false}};
function env(store={},late=false){const META=JSON.parse(JSON.stringify(DOT));const plays=[];let t=0;
 const sb={console,Math,JSON,Number,String,Object,Array,Map,Set,WeakMap,WeakSet,Error,isFinite,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}},
  hazards:[],effects:[],settings:{},player:{x:10,y:10,hp:100},room:{id:'sz115-Q-1',enemies:[]},actorHeight:()=>54,project:(x,y)=>({x:x*32,y:y*16}),
  readyImage:p=>({image:{src:p}}),addImage:p=>p,tick:()=>{},plays};
 Object.defineProperty(sb,'time',{get:()=>t,set:v=>{t=v;}});sb.window=sb;
 const PXO=Object.freeze({meta:()=>META,has:k=>!!META[k],play(name,x,y,o={}){if(!META[name]||!Number.isFinite(x+y))return null;const e={name,x,y,t0:t+(o.delay||0),rate:o.rate||1,k:o.k||1,z:o.z||0,flip:!!o.flip};plays.push(e);return e;}});
 const SHEET={'boss-tentacle-bind':['boss-tentacle-bind.webp',[128,208],1.2,.25,1],'boss-meteor':['boss-meteor.webp',[128,192],1.35,.75,1]};
 const R411=Object.freeze({sheets:SHEET,play:()=>null});
 if(!late){sb.__STORYWORLD_PIXELFX_R163__=PXO;sb.__STORYWORLD_SKILL_SHEETS_R411__=R411;}
 vm.createContext(sb);if(src)vm.runInContext(src,sb);if(late){sb.__STORYWORLD_PIXELFX_R163__=PXO;sb.__STORYWORLD_SKILL_SHEETS_R411__=R411;}sb.META=META;sb.SHEET=SHEET;sb.step=(dt=1/60)=>{t+=dt;sb.tick(dt);};return sb;}
const X=sb=>sb.__STORYWORLD_PIXELFX_R163__;
// 칸 번호: drawAll 과 같은 셈(age=(t−t0)·rate, 칸=floor(age·fps))
const frameAt=(sb,e,t)=>{const m=sb.META[e.name];const age=(t-e.t0)*e.rate;return age<0?-1:Math.floor(age*m.fps);};
if(src){
// 1) 시트: 어디서나 칠한 촉수 시트(R976 과 같은 그림·같은 길이 2.93초)
{const sb=env();sb.step();const m=sb.META['tendrils-blood'];
 ok('tendrils-blood is the painted 256px sheet outside the Samong P zone too (same 2.93 s length)',m&&m.frame[0]===256&&m.frames===24&&Math.abs(m.frames/m.fps-44/15)<.01,m);
 const real=sb.readyImage('assets/r163/pixelfx/'+m.file);ok('painted sheet alias resolves to the existing asset (assets/r976/tendrils-blood.webp)',real?.image?.src==='assets/r976/tendrils-blood.webp',real);
 const im=sb.META['enemy-tentacle-hit-r1028'];ok('impact sheet registered from the existing R411 painted corpse-explosion',im&&sb.readyImage('assets/r163/pixelfx/'+im.file)?.image?.src==='assets/r411/fx/boss-corpse-explosion.webp',im);}
// 2) 사몽 보스 촉수 패턴(R162 와 똑같이 부름): 맞는 순간 다 솟은 칸
{const sb=env();sb.step();const P=sb.player,pts=[];[[0,1],[1.1,6],[2.1,9]].forEach(([Rr,nn],ring)=>{for(let k=0;k<nn;k++){const a=k*Math.PI*2/nn+ring*.3,w=.75+ring*.35,px=P.x+Math.cos(a)*Rr,py=P.y+Math.sin(a)*Rr;pts.push({x:px,y:py,warn:w,ring});
  sb.hazards.push({id:pts.length,type:'field',owner:'boss',x:px,y:py,radius:.72,age:0,warning:w,life:w+.95,damage:5,lastHit:-99,samongPattern:'tentacles'});}});
 const t0=sb.time;pts.forEach((p,k)=>X(sb).play('tendrils-blood',p.x,p.y,{delay:p.warn-.12,rate:2.2,k:p.ring===0?1.35:1.05-.1*p.ring,flip:k%3===0}));
 const fr=sb.plays.filter(e=>/tendrils/.test(e.name)).map((e,i)=>frameAt(sb,e,t0+pts[i].warn));
 ok(`Samong tentacles: at the hit moment every tentacle is fully up (frames 5–7 of 24; got ${[...new Set(fr)].join(',')})`,fr.length===16&&fr.every(f=>f>=5&&f<=7),fr);
 const last=sb.plays.filter(e=>/tendrils/.test(e.name)).map((e,i)=>{const m=sb.META[e.name];return e.t0+m.frames/m.fps/e.rate-(t0+pts[i].warn);});
 ok('Samong tentacles stay on screen ≥ 0.8 s after the hit (coil/retreat)',last.every(v=>v>=.8),last.map(v=>+v.toFixed(2)));}
// 3) 사몽 탑 피의 육망성(R170): 맞기 전에 미리 솟기 시작해 맞는 순간 다 솟음, 터질 때 R170 이 부르는 늦은 재생은 겹치지 않게 뺀다
{const sb=env();sb.step();const h={id:7,type:'field',owner:'r170:tower:x:0',x:10,y:10,radius:1.7,age:0,warning:1.3,life:2.2,damage:5,lastHit:-99,samongPattern:'r170-hex',r170:{seed:.3,burst:false}};sb.hazards.push(h);
 let hitT=null;for(let i=0;i<200&&h.age<h.life;i++){sb.step();h.age+=1/60;if(hitT===null&&h.age>=h.warning){hitT=sb.time;
   // R170 drawHex 가 터질 때 부르는 원래 재생(중앙 1 + 옆 2)
   X(sb).play('tendrils-blood',h.x,h.y,{k:1.7});for(let k=0;k<2;k++){const a=.3+k*Math.PI+.6;X(sb).play('tendrils-blood',h.x+Math.cos(a)*h.radius*.45,h.y+Math.sin(a)*h.radius*.45,{k:1.2,delay:.08+.1*k,flip:k===1});}}}
 const T=sb.plays.filter(e=>/tendrils/.test(e.name));const fr=T.map(e=>frameAt(sb,e,hitT));
 ok(`R170 hexagram: 3 tentacle sheets (centre + 2 sides), no late duplicates (got ${T.length})`,T.length===3,T.map(e=>e.t0));
 ok(`R170 hexagram: centre tentacle fully up at the hit moment (frame ${fr[0]})`,fr[0]>=5&&fr[0]<=7,fr);
 ok('R170 hexagram: side tentacles up within 0.2 s of the hit',T.slice(1).every(e=>frameAt(sb,e,hitT+.2)>=5),T.map(e=>frameAt(sb,e,hitT+.2)));
 ok('R170 centre keeps the bigger size (k 1.7)',T[0]&&T[0].k===1.7);}
// 4) 늦게 본 장판(이미 warning 0.05초 전): 맞는 순간 그래도 다 솟은 칸(앞부분 건너뜀)
{const sb=env();sb.step();const h={id:8,type:'field',owner:'boss',x:12,y:9,radius:.72,age:.7,warning:.75,life:1.7,damage:5,lastHit:-99,samongPattern:'tentacles'};sb.hazards.push(h);
 const t0=sb.time;X(sb).play('tendrils-blood',h.x,h.y,{delay:-.07,rate:2.2,k:1});const e=sb.plays.find(p=>/tendrils/.test(p.name));const f=frameAt(sb,e,t0+.05);
 ok(`late-seen tentacle still fully up at the hit (frame ${f})`,f>=5&&f<=7);}
// 5) 적중 그림: 영웅이 장판 안이면 맞는 순간 영웅 자리에 한 번, 밖이면 없음, 같은 순간 여러 장판이어도 한 번
{const sb=env();sb.step();for(let k=0;k<3;k++)sb.hazards.push({id:20+k,type:'field',owner:'boss',x:10+k*.3,y:10,radius:.72,age:0,warning:.5,life:1.4,damage:5,lastHit:-99,samongPattern:'tentacles'});
 sb.hazards.push({id:30,type:'field',owner:'boss',x:20,y:20,radius:.72,age:0,warning:.5,life:1.4,damage:5,lastHit:-99,samongPattern:'tentacles'});
 let hitT=null;for(let i=0;i<60;i++){sb.step();for(const h of sb.hazards)h.age+=1/60;if(hitT===null&&sb.hazards[0].age>=.5)hitT=sb.time;}
 const I=sb.plays.filter(e=>e.name==='enemy-tentacle-hit-r1028');
 ok(`impact: exactly one at the hero when tentacles under the hero strike (got ${I.length})`,I.length===1&&Math.abs(I[0].x-10)<.01&&Math.abs(I[0].y-10)<.01,I);
 ok('impact is already bursting at the hit frame (frame 3–4 of 24, lifted to the body)',I[0]&&frameAt(sb,I[0],hitT)>=3&&frameAt(sb,I[0],hitT)<=4&&I[0].z>0,I[0]&&{f:frameAt(sb,I[0],hitT),z:I[0].z});}
{const sb=env();sb.step();sb.hazards.push({id:40,type:'field',owner:'boss',x:14,y:10,radius:.72,age:0,warning:.4,life:1.4,damage:5,lastHit:-99,samongPattern:'tentacles'});
 for(let i=0;i<60;i++){sb.step();sb.hazards[0].age+=1/60;}ok('impact: none when the hero is outside the tentacle',!sb.plays.some(e=>e.name==='enemy-tentacle-hit-r1028'));}
// 6) R411 타락 보스 촉수 속박: 앞당김을 늘려 맞는 순간 5칸 이상
{const sb=env();sb.step();const S=sb.SHEET['boss-tentacle-bind'];const f=Math.floor(S[3]*12.5*S[4]);ok(`R411 boss-tentacle-bind: frame at the hit ≥ 5 (lead ${S[3]}s → frame ${f})`,f>=5&&f<=7);ok('R411 other sheets untouched',sb.SHEET['boss-meteor'][3]===.75);
 sb.hazards.push({id:50,type:'field',owner:'boss',x:10,y:10,radius:1.6,age:0,warning:.3,life:1.2,r411:'boss-tentacle-bind'});for(let i=0;i<30;i++){sb.step();sb.hazards[0].age+=1/60;}
 ok('R411 tentacle-bind field under the hero → impact once',sb.plays.filter(e=>e.name==='enemy-tentacle-hit-r1028').length===1);}
// 7) 이상 값·끄기
{const sb=env();sb.step();sb.hazards.push({id:60,type:'field',owner:'boss',x:NaN,y:10,radius:.72,age:0,warning:.3,life:1,samongPattern:'tentacles'});for(let i=0;i<40;i++){sb.step();sb.hazards[0].age+=1/60;}
 const I=sb.__STORYWORLD_TENTACLE_STRIKE_R1028__?.inspect?.();ok('NaN hazard ignored without errors',I&&I.stats.errors===0&&!sb.plays.length,I);}
{const sb=env({'storyworld.r1028.tentacle':'{"on":false}'});sb.step();ok('switched off: dot sheet kept, R411 lead kept',sb.META['tendrils-blood'].frame[0]===208&&sb.SHEET['boss-tentacle-bind'][3]===.25);
 sb.hazards.push({id:70,type:'field',owner:'boss',x:10,y:10,radius:.72,age:0,warning:.75,life:1.7,samongPattern:'tentacles'});X(sb).play('tendrils-blood',10,10,{delay:.63,rate:2.2});ok('switched off: caller timing untouched',Math.abs(sb.plays[0].t0-sb.time-.63)<1e-9);}
// 8) 이 파일이 pixelfx·R411 보다 먼저 실려도(태그는 긴 줄 앞): 첫 틱에 시트·재생 맞춤·앞당김이 걸린다
{const sb=env({},true);sb.step();const h={id:80,type:'field',owner:'boss',x:10,y:10,radius:.72,age:0,warning:.75,life:1.7,samongPattern:'tentacles'};sb.hazards.push(h);const t0=sb.time;
 X(sb).play('tendrils-blood',10,10,{delay:.63,rate:2.2});const e=sb.plays[0],f=e&&frameAt(sb,e,t0+.75);
 ok(`loaded before pixelfx/R411: painted sheet ${sb.META['tendrils-blood'].frame[0]}px, frame at hit ${f}, R411 lead ${sb.SHEET['boss-tentacle-bind'][3]}`,sb.META['tendrils-blood'].frame[0]===256&&f>=5&&f<=7&&sb.SHEET['boss-tentacle-bind'][3]>=.4);}
// 9) 영웅 발밑 촉수·적중 그림이 R350 '영웅 가림 옅게'에 걸리지 않는다(적 쪽 위협 그림): pixelfx 그리기 이름(scope id 'r163:<이름>:<t0>')이 R350 ENEMY_WORD 에 걸려야 한다
{const s350=C('hero-visibility-r350.js'),m=/const ENEMY_WORD=(\/.*\/i);/.exec(s350),W=m?eval(m[1]):null;const sb=env();sb.step();
 sb.hazards.push({id:90,type:'field',owner:'boss',x:10,y:10,radius:.72,age:0,warning:.3,life:1.3,samongPattern:'tentacles'});X(sb).play('tendrils-blood',10,10,{delay:.18,rate:2.2});for(let i=0;i<30;i++){sb.step();sb.hazards[0].age+=1/60;}
 const names=[...new Set(sb.plays.map(e=>e.name))];ok(`tentacle and impact plays read as enemy-side for R350 veil (names ${names.join(',')})`,W&&names.length===2&&names.every(n=>W.test('r163:'+n+':1.5')),names);
 const P=sb.plays.find(e=>/tendrils/.test(e.name)),m2=sb.META[P.name];ok('the enemy-side tentacle name uses the same painted sheet and length',m2.frame[0]===256&&m2.frames===24&&Math.abs(m2.frames/m2.fps-44/15)<.01&&sb.readyImage('assets/r163/pixelfx/'+m2.file).image.src==='assets/r976/tendrils-blood.webp');}
}
console.log(`\nR1028 tentacle CPU check: ${n-bad}/${n} passed`);process.exit(bad?1:0);
