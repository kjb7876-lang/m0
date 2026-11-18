// R1152 실패 먼저 — 페르소나 W·E·R·(진) 레이저를 Dots 그림(CX-0143PL·CX-0144PW·CX-0145PR)으로 (사용자 2026-11-18 07:53Z
//  "CX-0141~0150 … /개선적용 앵간하면 홀드도 개선적용해 배경처리같은거 잘하고"). 코드로 그린 임시 그림·빌린 시트를 페르소나 전용 시트로 바꾸고 색(언주·먹·흑적)은 그림 그대로.
// 검사: ① 자산(크기·칸·배경 빼기·이음매 페이드·낮은 알파) ② 연결 ③ W 표식 눈·먹 번개·적중 섬광 ④ E·R 구슬·꼬리·불씨 ⑤ 레이저 시작·몸통·끝 ⑥ 시트 없으면 예전 그림
//       ⑦ 페르소나 굽기가 Dots 그림을 다시 칠하지 않음 ⑧ 판정·수치 그대로
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'../..'),rd=f=>{try{return fs.readFileSync(path.join(ROOT,f),'utf8');}catch(_){return'';}};
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const N='persona-wer-r1144.js',MOD=rd('client-source/'+N),hooks=rd('client-source/ego-sovereign-r1046.js');
function env(opt={}){const hits=[];const g={localStorage:{_s:{...(opt.store||{})},getItem(k){return this._s[k]??null;},setItem(k,v){this._s[k]=String(v);}},console,hits,Math,Map,Set,Object,Array,Number,String,JSON};g.window=g;vm.createContext(g);
 vm.runInContext(`var time=10,started=true,loading=false,modal=null,storyScene=null,zoom=1,TILE=34;
  var player={hero:${JSON.stringify(opt.hero||'lauren')},x:10,y:10,hp:100,ap:10,skillAnim:0,storyWER:{ready:{},buffs:{}}};var room={id:'z1',enemies:[],props:[]};var effects=[];var FORM=${opt.form!==false};
  window.__STORYWORLD_PERSONA_HERO_R1113__={formActive:()=>FORM};
  function liveEnemies(){return room.enemies.filter(e=>e.hp>0);}function damageable3(e){return !e.immune;}function clearLine(a,b){return !b.walled;}function attackPower(){return player.ap;}
  function hitEnemy(e,v,s){hits.push({id:e.id,v:+v.toFixed(6),k:s&&s.kind,t:+time.toFixed(3),src:s});e.hp-=v;return true;}function tick(){}function drawEffect(e){}
  function project(x,y){return{x:(x-y)*34+480,y:(x+y)*17};}function actorHeight(){return 66;}
  var seen=[],cur=null,READY=${opt.sheets!==false};var DOTS=${opt.dots!==false};function readyImage(p){if(!READY)return null;if(/r1152/.test(p)){if(!DOTS)return null;const S=Object.values(window.__STORYWORLD_PERSONA_WER_R1144__.sheets).find(s=>s.path===p);return {image:{src:p,naturalWidth:S.cols*S.cell,naturalHeight:Math.ceil(S.n/S.cols)*(S.ch||S.cell)}};}const c=/r946/.test(p)?192:256;return {image:{src:p,naturalWidth:c*6,naturalHeight:c*4}};}var asked=[];function ensureImages(a){asked.push(...a);return Promise.resolve();}
  var st=[];var ctx={filter:'none',globalAlpha:1,globalCompositeOperation:'source-over',translate(){},rotate(){},scale(){},beginPath(){},moveTo(){},lineTo(){},arc(){},
   save(){st.push([ctx.globalAlpha,ctx.globalCompositeOperation,ctx.filter]);},restore(){const s=st.pop();if(s){ctx.globalAlpha=s[0];ctx.globalCompositeOperation=s[1];ctx.filter=s[2];}},
   drawImage(im,...a){seen.push({op:'image',src:im.src,a,o:cur,comp:ctx.globalCompositeOperation,filter:ctx.filter});},fill(){seen.push({op:'fill',o:cur});},stroke(){seen.push({op:'stroke',o:cur});},scope(o,f){const p=cur;cur=o;try{f();}finally{cur=p;}}};
  // 본편 W·E·R 을 쓴 것처럼(대기·시전 자세)
  function castWER(slot,cd){player.storyWER.ready['lauren:'+slot]=time+cd;player.skillAnim=.6;}`,g);
 if(opt.hooks!==false)vm.runInContext(hooks,g);vm.runInContext(MOD,g,{filename:N});return g;}
const Z=g=>g.__STORYWORLD_PERSONA_WER_R1144__;
const mob=(id,x,y,extra={})=>({id,x,y,hp:1e6,maxHp:1e6,radius:.3,spawnState:'active',...extra});
const step=(g,n=1,dt=.05)=>{for(let i=0;i<n;i++){vm.runInContext('time=+(time+'+dt+').toFixed(4);player.skillAnim=Math.max(0,player.skillAnim-'+dt+');tick();for(const e of effects.slice())drawEffect(e)',g);}};
const H=(g,k)=>g.hits.filter(h=>h.k==='r1144-'+k);
const cast=(g,slot,cd=6.9)=>{vm.runInContext(`castWER(${JSON.stringify(slot)},${cd})`,g);};
const mark=(g,ids,sec=3)=>vm.runInContext(`for(const e of room.enemies)if(${JSON.stringify(ids)}.includes(e.id))e.storyWERExposeUntil=time+${sec}`,g);

const seen=g=>vm.runInContext('seen',g),img=(g,re)=>seen(g).filter(x=>x.op==='image'&&re.test(x.src||''));
const DOTS={dmark:['w-mark',2048,256],dchain:['w-chain',2048,128],dhit:['w-hit',1536,256],dorb:['r-orb',1536,1024],dtail:['r-tail',2048,256],dember:['e-ember',1536,256],lbody:['laser-body',2048,128],lstart:['laser-start',2048,256],lend:['laser-end',2048,256]};
// ① 자산
let PIL=null;try{PIL=require('child_process').execFileSync('python3',['-c',`
import json,sys
from PIL import Image
out={}
for n in sys.argv[1:]:
  im=Image.open(n).convert('RGBA');W,H=im.size;al=im.getchannel('A');px=al.load();cells=W//256
  hist=al.histogram();low=sum(hist[1:17])
  col=lambda x:max(px[x,y] for y in range(H))
  out[n]={'size':[W,H],'low':low,'cellEdge':max(col(i*256) for i in range(cells)),'cellEdgeR':max(col(i*256+255) for i in range(cells)),
   'corner':max(max(px[x,y] for x in range(i*256,i*256+40) for y in range(min(12,H))) for i in range(cells))}
print(json.dumps(out))`,...Object.values(DOTS).map(d=>path.join(ROOT,'runtime-text/assets/r1152/'+d[0]+'.webp'))],{encoding:'utf8'});PIL=JSON.parse(PIL);}catch(e){PIL=null;}
{const A=k=>PIL&&PIL[path.join(ROOT,'runtime-text/assets/r1152/'+DOTS[k][0]+'.webp')];
 ok(!!PIL&&Object.keys(DOTS).every(k=>A(k)&&A(k).size[0]===DOTS[k][1]&&A(k).size[1]===DOTS[k][2]),'① 시트 아홉 장, 크기 맞음');
 ok(!!PIL&&Object.keys(DOTS).every(k=>A(k)&&A(k).low<200),'① 낮은 알파(1~16) 정리 ('+(PIL?Object.keys(DOTS).map(k=>k+':'+(A(k)||{}).low).join(' '):'')+')');
 ok(!!PIL&&A('lstart').corner===0&&A('lstart').cellEdge===0,'① 레이저 시작(HOLD 불투명 배경) → 배경·격자 빠짐 (모서리 알파 '+(A('lstart')||{}).corner+')');
 ok(!!PIL&&['lbody','dchain'].every(k=>A(k).cellEdge<=8&&A(k).cellEdgeR<=8),'① 몸통·번개(HOLD 이음매) → 칸 양 끝이 투명으로 줄어듦 ('+['lbody','dchain'].map(k=>k+':'+(A(k)||{}).cellEdge+'/'+(A(k)||{}).cellEdgeR).join(' ')+')');
 const idx=JSON.parse(rd('runtime-text/assets/r1152/index.json')||'{}');ok(Array.isArray(idx.assets)&&idx.assets.length===9&&idx.assets.every(a=>/^[0-9a-f]{64}$/.test(a.sha256)&&/^[0-9a-f]{64}$/.test(a.sourceSha256)),'① 출처 표(index.json, sha256)');}
// ② 연결
{ok(Object.keys(DOTS).every(k=>Z(env())?.sheets?.[k]?.path==='assets/r1152/'+DOTS[k][0]+'.webp'),'② 시트 표에 Dots 아홉 장');
 ok(Object.values(DOTS).every(d=>rd('runtime-manifest.json').includes('assets/r1152/'+d[0]+'.webp')),'② 매니페스트에 새 자산');
 ok(rd('runtime-text/'+N)===MOD,'② runtime-text 사본 = client-source');ok(rd('../.github/workflows/pages.yml').includes('node r96/qa/r1152/persona-dots-cpu-check.cjs'),'② pages.yml CPU 검사 줄');
 ok(!/drop-shadow|blur\(/.test(MOD),'② 기록기가 못 받는 필터 없음');}
// ③ W
{const g=env();g.room.enemies.push(mob('a',11.5,10),mob('b',13,10));step(g,2);cast(g,'w');step(g,2);mark(g,['a','b']);step(g,8);
 ok(img(g,/r1152\/w-mark/).length>0&&img(g,/r1152\/w-mark/).every(x=>/^r1144:mark:/.test(x.o.id)),'③ 표식 걸린 적 머리 위 표식 눈 ('+img(g,/w-mark/).length+')');
 ok(img(g,/r1152\/w-chain/).length>0&&img(g,/neon-chain/).length===0,'③ 번개 = 먹 번개 시트(네온 시트 안 씀)');
 ok(img(g,/r1152\/w-hit/).length>0,'③ 맞은 적에 적중 섬광');
 ok(img(g,/r1152\/w-chain/).every(x=>x.a[3]===128&&x.a[1]%128===0),'③ 번개 칸 256×128');
 const n0=img(g,/w-mark/).length;step(g,80);vm.runInContext('seen.length=0',g);step(g,4);ok(img(g,/w-mark/).length===0,'③ 표식이 끝나면 눈도 사라짐');
 ok(H(g,'chain').length>=2,'③ 연쇄 피해는 그대로 ('+H(g,'chain').length+')');}
// ④ E·R
{const g=env();g.room.enemies.push(mob('a',11.5,10),mob('b',12.5,10));step(g,2);cast(g,'e',5.85);step(g,6);cast(g,'r',21);step(g,10);
 ok(img(g,/r1152\/r-orb/).length>0&&img(g,/lauren-red/).length===0,'④ 구슬 = 붉은 눈 구슬(은빛 거성 구 안 씀)');
 ok(img(g,/r1152\/r-tail/).filter(x=>/^r1144:orbittail:/.test(x.o.id)).length>0&&img(g,/r1152\/r-tail/).filter(x=>/^r1144:orbtail:/.test(x.o.id)).length>0,'④ 도는 구슬·날아가는 구슬 뒤 꼬리');
 ok(img(g,/r1152\/e-ember/).length>0&&img(g,/hunter-burn/).length===0,'④ 화상 = 화상 불씨(헌터 시트 안 씀)');
 ok(img(g,/r1152\/r-orb/).every(x=>x.a[2]===256&&x.a[0]%256===0&&x.a[1]%256===0),'④ 구슬 칸 256');
 ok(Z(g).inspect().stats.errors===0&&vm.runInContext('st.length',g)===0,'④ 오류 0·save 짝 ('+Z(g).inspect().stats.lastError+')');}
// ⑤ 레이저
{const g=env();vm.runInContext(`var N=64;var VIO={procs:0,acts:[]};window.__STORYWORLD_LAUREN_CELESTIAL_R946__={inspect:()=>({acts:VIO.acts.map(a=>({...a})),stats:{procs:{violet:VIO.procs}}})};`,g);
 g.room.enemies.push(mob('n1',14,10,{hp:50,maxHp:50}));step(g,2);vm.runInContext('VIO.procs=1;VIO.acts.push({kind:"violet",x:player.x+.9,y:player.y,t0:time})',g);step(g,20);
 const L=Z(g).inspect().stats.lasers;ok(L>=1,'⑤ 레이저 발동 ('+L+')');
 const b=img(g,/r1152\/laser-body/),s=img(g,/r1152\/laser-start/),e=img(g,/r1152\/laser-end/);
 ok(b.length>=7&&s.length>0&&e.length>0,'⑤ 시작 구·몸통·끝 터짐 모두 Dots ('+[s.length,b.length,e.length].join('/')+')');
 ok(b.concat(s,e).every(x=>/^r946:violet:laser:/.test(x.o.id)),'⑤ 주인 id 그대로(r946:violet:laser)');
 ok(seen(g).filter(x=>x.op==='stroke'&&/laser/.test(String(x.o&&x.o.id))).length===0,'⑤ 시트가 있으면 임시 코드 선 안 그림');
 ok(H(g,'laser').length>=1,'⑤ 판정 그대로(일반 몹 즉사)');}
// ⑥ Dots 가 안 읽혔으면 예전 그림
{const g=env({dots:false});g.room.enemies.push(mob('a',11.5,10),mob('b',13,10));step(g,2);cast(g,'w');step(g,2);mark(g,['a','b']);step(g,4);cast(g,'r',21);step(g,8);
 ok(img(g,/r1152/).length===0&&img(g,/neon-chain/).length>0&&img(g,/lauren-red/).length>0,'⑥ Dots 시트 전엔 예전 시트');ok(vm.runInContext('asked',g).some(p=>/r1152/.test(p)),'⑥ 안 읽힌 Dots 시트를 부탁함');}
// ⑦ 페르소나 굽기가 Dots 그림을 다시 칠하지 않음
{const SRC=rd('client-source/persona-hero-r1113.js');ok(/r1152/.test(SRC)&&/R1113-persona-hero-\d+-.*r1152/.test(SRC),'⑦ persona-hero 에 Dots 예외·판 이름');}
// ⑧ 판정·수치 그대로
{ok(/chain:Object\.freeze\(\{delay:\.2,again:1\.2,pulses:2,k:\.6,reach:9,link:7,max:8/.test(MOD)&&/laser:Object\.freeze\(\{charge:\.5,rays:\[-\.42,-\.28,-\.14,0,\.14,\.28,\.42\]/.test(MOD)&&/bossK:\.07/.test(MOD),'⑧ W·레이저 수치 그대로');}
console.log(fails?('FAILED '+fails):'ALL PASS');process.exit(fails?1:0);
