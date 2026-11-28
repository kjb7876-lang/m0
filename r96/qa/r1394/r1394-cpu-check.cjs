// R1394 CPU 검사: 사몽 전용 2D 몹 그림(samong-art-r1394-data.js + mob-dir-art-r1377.js 의 사몽 이름 찾기)
//  사용자 2026-11-28 "얼굴없는 남자의 박수 … 거짓천국 근위 천사 - 2d 전면 재설계해서 적용 … 서사와 이름에 맞게".
//  ① 사몽 몹(id 'sm103:')은 등급 말('보스 · ' 등)·' · 짙은 형상' 을 뗀 이름으로 '@samong:<이름>' 표를 먼저 쓴다.
//  ② 같은 nativeId 라도 사몽이 아닌 몹(교단 c105-mid 등 이야기 원본)은 그대로 — 사몽 그림이 새지 않는다.
//  ③ 사몽 그림 몹은 엔진 대기 그림 표 없이 지금 몸 그림의 알파 키·발 줄을 기준으로 시트를 같은 키·발 줄에 놓는다. 대기·피격 좌우는 R444 얼굴 방향.
//  ④ 표 규격(시트 8종·칸 수·발 줄·자산 있음), 이름이 사몽 몹 목록에 있음, 연결(태그 순서·검증 목록·CI 줄·runtime-text 사본).
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.join(__dirname,'../..');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};const rd=p=>fs.readFileSync(path.join(R,p),'utf8');
const src=rd('client-source/mob-dir-art-r1377.js'),dsrc=rd('client-source/mob-dir-art-r1377-data.js'),ssrc=rd('client-source/samong-art-r1394-data.js');
const r974=rd('client-source/move-dir-r974.js'),r974d=rd('client-source/move-dir-r974-data.js');
function world({face=null}={}){const ctx={Math,String,Number,Array,Object,JSON,Map,WeakMap,WeakSet,Set,isFinite,RegExp,performance:{now:()=>0},setTimeout:f=>{f();return 1;},
  localStorage:{getItem:()=>null,setItem:()=>{}},
  // 가짜 캔버스: 몸 그림 알파는 64줄 중 8~55줄(몸통 48/64, 발 56/64)
  document:{createElement:()=>({width:0,height:0,getContext:()=>({drawImage(){},getImageData(x,y,w,h){const d=new Uint8ClampedArray(w*h*4);for(let yy=8;yy<56;yy++)for(let xx=0;xx<w;xx++)d[(yy*w+xx)*4+3]=255;return {data:d};}})})}};
 ctx.window=ctx;vm.createContext(ctx);
 if(face)ctx.__STORYWORLD_ENEMY_FACE_R444__={left:face};
 vm.runInContext(`var time=0,room={id:'sz115-RC-6',layer:'SAMONG',enemies:[]},player={x:3,y:3},ctx={commands:[]};
  function addImage(p){}function readyImage(p){const n=+(/(\\d+)\\.webp$/.exec(p)||[0,1])[1];return {ready:true,image:{src:'http://x/m0/'+p,naturalWidth:/r1394/.test(p)?512*n:200,naturalHeight:/r1394/.test(p)?512:400}};}
  function project(x,y){return {x:100+(x-3)*10,y:200+(y-3)*5};}
  function drawEnemy(e){const P=project(e.x,e.y),h=100,w=50,top=P.y-h*.95,L=P.x-w/2,x0=e.__flip?L+w:L,x1=e.__flip?L:L+w;
   ctx.commands.push({kind:'image',key:'enemy:'+e.nativeId,owner:{kind:'enemy'},image:{src:'http://x/m0/assets/test/donor.webp'},imageSize:[200,400],sourcePath:'assets/test/donor-'+e.nativeId+'.webp',sourceRect:[0,0,200,400],style:{globalAlpha:1},points:[[x0,top],[x1,top],[x1,top+h],[x0,top+h]]});}`,ctx);
 vm.runInContext(r974d,ctx);vm.runInContext(r974,ctx);vm.runInContext(dsrc,ctx);vm.runInContext(ssrc,ctx);vm.runInContext(src,ctx);return ctx;}
const run=(c,s)=>vm.runInContext(s,c),API=c=>c.__STORYWORLD_MOB_DIR_ART_R1377__;
function draw(c,e,dt=1/30){run(c,'time+='+dt);run(c,'ctx.commands.length=0');c.drawEnemy(e);return run(c,'ctx.commands').find(k=>/enemy:/.test(k.key||''));}
const H=k=>Math.abs(k.points[3][1]-k.points[0][1]),lr=k=>k.points[1][0]-k.points[0][0];
const DATA=c=>c.__STORYWORLD_MOB_DIR_ART_R1377_DATA__.enemies;
{// ④ 표 규격
 const c=world(),A=c.__STORYWORLD_SAMONG_ART_R1394__;ok(A&&Array.isArray(A.names)&&A.names.length>=2,'samong table installed');
 const roster=rd('client-source/samong-r103.js')+rd('client-source/samong-zones-r115.js')+rd('client-source/samong-zones-r115-data.js')+rd('client-source/samong-maps-r105.js');
 for(const nm of A.names){const D=DATA(c)['@samong:'+nm];ok(D&&D.anyRef===1&&D.cell===512&&D.foot===488&&D.cx===256&&D.vis>250&&D.vis<470,'metrics '+nm);
  // 착지 문지기(guard)는 빌린 몹 이름 그대로 사몽 몹(id sm103:)으로 나온다 — 그 이름은 samong-r103 의 guard 원본 id 로 확인
  const GUARD={'얼굴 없는 남자의 박수':"['ep1b05','b05-p1']",'찢어진 사진의 망령':"['ep1b03','b03-g1']",'거짓천국 근위천사':"['dist00','a11-c1']"};
  // R380 승인 몹이 사몽 구역 몇 자리를 다른 이름으로 바꿔 내보낸다(RD '결말 접합체' = R380 actor.rename) — 그 이름도 사몽 몹
  const R380=JSON.parse(rd('runtime-text/assets/r380/mobs/index.json')),renames=new Set((Array.isArray(R380)?R380:Object.values(R380.mobs||R380.items||R380)).map(m=>m&&m.actor).filter(a=>a&&a.samong&&a.rename).map(a=>a.rename));
  ok(roster.includes(nm)||(GUARD[nm]&&rd('client-source/samong-r103.js').includes('guard:[['+GUARD[nm].slice(1)))||renames.has(nm),'name is a samong mob: '+nm);
  const need={idle_side:4,walk_side:6,atk_side:6,hit_side:3,walk_up:4,atk_up:6,walk_down:4,atk_down:6};
  for(const [k,nn] of Object.entries(need)){const S=D.sheets[k];ok(S&&S.n===nn&&S.path.startsWith('assets/r1394/'),'sheet '+nm+' '+k);
   ok(fs.existsSync(path.join(R,'runtime-text',S.path)),'asset '+S.path);ok(Array.isArray(S.feet)&&S.feet.length===nn&&S.feet.every(v=>v>470&&v<=512),'feet '+nm+' '+k);}}
 ok(A.names.includes('교주의 인장')&&A.names.includes('종이 왕'),'bosses first: 교주의 인장·종이 왕');}
{// ①② 이름 찾기 — 사몽만
 const c=world(),W=API(c).wants;
 const sm=(name,nid)=>({id:'sm103:RC-6:boss:1',nativeId:nid,name,x:3,y:3,hp:100,maxHp:100,hitTimer:0,state:'chase'});
 ok(W(sm('보스 · 종이 왕','c105-mid')),'sm boss prefix stripped');ok(W(sm('종이 왕 · 짙은 형상','c105-mid')),'dark suffix stripped');
 ok(W(sm('보스격 · 교주의 인장','mb-ep1b01')),'boss-class prefix stripped');
 ok(!W({id:'c105-mid#1',nativeId:'c105-mid',name:'종이 왕',x:3,y:3,hp:100}),'non-samong id with same name untouched');
 const story=!!DATA(c)['c105-mid'];ok(!W({id:'c105-mid#1',nativeId:'c105-mid',name:'ID 생체조 관리자',x:3,y:3,hp:100})===!story,'story c105-mid unchanged (R1377 table only)');
 ok(!W(sm('다른 사몽 몹','zz-none')),'unknown samong name → no art');
 ok(!W({...sm('보스 · 종이 왕','c105-mid'),hp:0}),'dead → engine');}
{// ⑤ R161 꼭두각시(사몽 전용 그림이 없던 몹을 덮던 그림)는 R1394 그림 몹을 덮지 않는다
 const c=world(),C=c.__STORYWORLD_SAMONG_ART_R1394__.covers;
 ok(C({id:'sm103:RC-6:b:5',name:'종이 왕'})&&C({id:'sm103:S05-6:b:1',name:'보스 · 교주의 인장 · 짙은 형상'}),'covers samong names');
 ok(!C({id:'c105-mid#1',name:'종이 왕'})&&!C({id:'sm103:x:g:1',name:'표에 없는 사몽 몹'}),'does not cover non-samong or unknown names');
 const r161=rd('client-source/samong-r161.js');ok(/const puppetOf=[^\n]*&&!dotsR1394\(e\);/.test(r161)&&/__STORYWORLD_SAMONG_ART_R1394__\?\.covers\?\.\(e\)/.test(r161),'R161 puppet skips R1394 art');
 ok(rd('runtime-text/samong-r161.js')===r161,'runtime-text copy samong-r161.js');}
{// ③ 기준 크기·발 줄·좌우
 for(const left of [false,true]){
  const c=world({face:()=>left}),e={id:'sm103:RC-6:boss:1',nativeId:'c105-mid',name:'보스 · 종이 왕',x:3,y:3,hp:100,maxHp:100,hitTimer:0,state:'chase'};
  let k;for(let i=0;i<20;i++)k=draw(c,e);ok(k&&/assets\/r1394\/09-paper-king\/idle_side4\.webp/.test(k.sourcePath),'idle sheet swapped in '+(k&&k.sourcePath));
  const D=DATA(c)['@samong:종이 왕'],eng={vis:100*48/64,foot:200-95+100*56/64};
  const vis=H(k)*D.vis/D.cell,f=Math.round(k.sourceRect[0]/512),foot=Math.min(...k.points.map(q=>q[1]))+H(k)*D.sheets.idle_side.feet[f]/D.cell;
  ok(Math.abs(vis/eng.vis-1)<.02,'same body height '+vis.toFixed(1)+' vs '+eng.vis);ok(Math.abs(foot-eng.foot)<1.5,'same foot line '+foot.toFixed(1)+' vs '+eng.foot);
  ok((lr(k)<0)===left,'idle facing follows R444 ('+(left?'left':'right')+')');
  e.hitTimer=.1;k=draw(c,e);ok(/hit_side3/.test(k.sourcePath)&&(lr(k)<0)===left,'hit sheet + facing');}}
{// ④ 연결
 const html=rd('runtime-text/index.html'),a=html.indexOf('<script src="./mob-dir-art-r1377-data.js">'),b=html.indexOf('<script src="./mob-dir-art-r1377.js">'),s=html.indexOf('<script src="./samong-art-r1394-data.js">'),m=html.indexOf('<script src="./murder-boss-walk-r1367.js">');
 ok(a>0&&b>a&&s>b&&m>s,'tags: R1377 data → R1377 module → R1394 data → R1367');
 ok(rd('../scripts/verify-r96-public.py').includes("'samong-art-r1394-data.js'"),'public verify list');
 ok(/r96\/qa\/r1394\/r1394-cpu-check\.cjs/.test(rd('../.github/workflows/pages.yml')),'CI line');
 for(const f of ['samong-art-r1394-data.js','mob-dir-art-r1377.js'])ok(rd('runtime-text/'+f)===rd('client-source/'+f),'runtime-text copy '+f);
 ok(rd('runtime-inputs.json').includes('samong-art-r1394-data.js'),'runtime inputs');}
// ⑤ 몸 그림 경로가 R1369 이펙트 투명도 규칙의 '몸 겹침 이펙트' 낱말(guard·halo·aura 등)에 걸리면 몸이 알파 .3 아래로 옅어진다(14 근위천사 실측) → 사몽 시트 경로는 걸리지 않아야 한다.
{const m=/const BODY=(\/.+\/);/.exec(rd('client-source/fx-alpha-rules-r1369.js'));ok(m,'R1369 BODY pattern found');const BODY=vm.runInNewContext(m[1]);
 const paths=[...new Set(ssrc.match(/assets\/r1394\/[^"]+/g)||[])];ok(paths.length>=8,'samong sheet paths listed');
 for(const p of paths)ok(!BODY.test(p.toLowerCase()),'R1369 body-overlay word in sheet path '+p);}
console.log('R1394 samong art CPU check OK —',n,'checks');
