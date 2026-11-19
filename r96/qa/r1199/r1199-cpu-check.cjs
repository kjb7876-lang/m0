'use strict';
// R1199 — 사몽 각성 렉(사용자 2026-11-19 "사몽각성관련해서 전수조사해서 렉이특히 심해지는이유와 그이유에맞게 규칙개선해서 렉개선해줘").
//  측정(헤드리스 640×360, main 9508f19, dist01 꿈, 환도): 각성 전 장면 JS 18ms → 각성 첫 장면 350~430ms, 이어지는 10장면 50~100ms.
//  첫 장면에 ① R111 흑백 사본 16~18장(333만 화소)을 한꺼번에 만들어 GPU 에 올리고 ② R409 가 그 사본마다 테두리를 새로 굽는다
//  (사본은 주소 없는 캔버스라 열쇠가 새 번호 → 원본과 알파가 같은데도 다시 굽기, 24장·getImageData 44만 화소).
//  고침 ①: 사몽을 쓸 수 있는 동안(꿈 층·사몽 대기 3초 이하·각성 아님) 화면에 그려지는 세계 그림의 흑백 사본을 장면마다 조금씩 미리 만들고 GPU 에 미리 올린다(예열).
//    장면당 예산 PC 75만·저사양 25만 화소, 성능 7단계 1(초저)은 예열 안 함. 모바일은 예열 사본 합계 600만 화소까지.
//  고침 ②: 흑백 사본은 원본 그림을 기억하고(R111 __r1199AlphaOf), R409 는 그 원본 열쇠로 테두리를 같이 쓴다(테두리는 알파로만 굽는다).
//  화면에 보이는 것은 같다(같은 흑백 사본·같은 테두리를 더 일찍 만들 뿐).
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'..','..'),SRC=path.join(ROOT,'client-source'),RT=path.join(ROOT,'runtime-text');
let n=0,bad=0;const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('PASS',m);};
const src=fs.readFileSync(path.join(SRC,'play-r111.js'),'utf8');
ok(fs.readFileSync(path.join(RT,'play-r111.js'),'utf8')===src,'runtime-text 사본 = client-source(play-r111)');
function mk(opt={}){let made=0,freed=0;const uploads=[],texCalls=[];
 class DrawCommands{constructor(){this.commands=[];this.owner={kind:'prop'};this.got=[];}drawImage(image){this.got.push(image);}push(kind,data){this.commands.push({kind,style:{...(data||{})}});return true;}}
 const three={commands:{texture(img,m){texCalls.push(img);return{img};}},renderer:{initTexture(t){uploads.push(t.img);}}};
 const sb={console,Math,JSON,Set,Map,WeakMap,WeakSet,Object,Array,Number,String,Boolean,Error,Promise,setTimeout,
  localStorage:{getItem:k=>/r111\.play$/.test(k)?'{"samongShader":false}':null,setItem(){}},/* R1217: 기본은 셰이더 흑백 — 이 검사는 흑백 사본 길(samongShader:false)을 본다 */NodeFilter:{SHOW_TEXT:4},performance:{now:()=>0},
  document:{getElementById:()=>null,querySelector:()=>null,createTreeWalker:()=>({nextNode:()=>null}),
   createElement:()=>{made++;let w=0;const c={get width(){return w;},set width(v){if(v===1&&w>1)freed++;w=v;},height:0,getContext:()=>({filter:'none',drawImage(){}})};return c;}},
  time:10,started:true,modal:false,loading:false,settings:{lowFx:!!opt.lowFx},zoom:1,target:null,layer:opt.layer||'DREAM',
  player:{x:0,y:0,hp:50,hero:'hwando',direction:'front',resonance:0,attackAnim:0,skillAnim:0,moving:false,samong:0,samongCD:opt.cd??0},
  room:{id:'zoneA',enemies:[],props:[]},HEROES:{hwando:{range:1.5}},
  maxHP:()=>100,actorHeight:()=>60,project:(x,y)=>({x:(x-y)*34,y:(x+y)*17}),facing:()=>'left',
  tick(dt){sb.time+=dt;},drawHero(){},drawEffect(){},drawProjectile(){},hitEnemy(){return true;},hurt(){},fx(){},blink(){},guideStep(){},
  StoryPhase1:{DrawCommands},__STORYWORLD_PHASE1__:{controller:{state:{three}}}};
 if(opt.step!=null)sb.__STORYWORLD_PERF7_R1043__={step:()=>opt.step};
 sb.window=sb;if(opt.mobile)sb.__STORYWORLD_MOBILE_R63__={isMobile:()=>true};let active=false;sb.__STORYWORLD_SAMONG_R75__={active:()=>active};sb.__STORYWORLD_WER__={defs:{hwando:{e:['E','x','dash']}}};
 vm.createContext(sb);vm.runInContext(src,sb,{filename:'play-r111.js'});
 const dc=new DrawCommands();const P=sb.__STORYWORLD_PLAY_R111__;
 return{sb,dc,P,set:v=>{active=v;sb.player.samong=v?7:0;},tick:(dt=.016)=>sb.tick(dt),draw:(img,kind='prop')=>{dc.owner={kind};dc.got.length=0;dc.drawImage(img,0,0);return dc.got[0];},
  made:()=>made,freed:()=>freed,st:()=>P.inspect().samong,uploads,texCalls};}
const IMG=(w,h,name)=>({width:w,height:h,naturalWidth:w,naturalHeight:h,src:'assets/'+name+'.png'});
const isGray=c=>!!c?.__storyworldStaticSource?.r111SamongGray;
// ---- ① 예열 ----
let m=mk(),a=IMG(400,300,'floor'),b=IMG(300,200,'mob'),hero=IMG(200,200,'hero'),fxi=IMG(100,100,'fx');m.tick();
ok(m.draw(a)===a&&m.draw(b)===b,'사몽 준비 중에도 화면에는 원본(색) 그대로 그림');
m.draw(hero,'hero');m.draw(fxi,'effect');m.tick();
ok(m.st().prewarmMade===2,'준비 중이면 다음 장면에 세계 그림 흑백 사본을 미리 만듦(2장, 영웅·이펙트 제외) — prewarmMade='+m.st().prewarmMade);
ok(m.uploads.length===2&&m.uploads.every(isGray),'미리 만든 사본을 GPU 에 미리 올림(initTexture '+m.uploads.length+'번)');
const made0=m.made();m.set(true);m.tick();const ga=m.draw(a),gb=m.draw(b);
ok(isGray(ga)&&isGray(gb)&&m.made()===made0,'각성 첫 장면은 미리 만든 사본을 그대로 씀(새 캔버스 '+(m.made()-made0)+'장)');
ok(m.draw(hero,'hero')===hero,'영웅은 각성 중에도 색(기존 규칙)');
// 예산: PC 장면당 75만 화소
m=mk();const big=[IMG(600,1000,'p1'),IMG(600,1000,'p2'),IMG(600,1000,'p3')];m.tick();for(const x of big)m.draw(x);m.tick();
ok(m.st().prewarmMade===1,'장면당 예열 예산 75만 화소(60만 한 장만) — '+m.st().prewarmMade);m.tick();ok(m.st().prewarmMade===2,'다음 장면에 한 장 더');
m=mk({lowFx:true});m.tick();m.draw(IMG(400,500,'l1'));m.draw(IMG(400,500,'l2'));m.tick();ok(m.st().prewarmMade===1,'저사양 예열 예산 25만 화소(20만 한 장) — '+m.st().prewarmMade);
// 장면 예산보다 큰 그림(바닥 2048² 등)은 줄 단위로 나눠 만든다 — 큰 그림 하나가 줄을 막지 않게
m=mk();const huge=IMG(2000,1000,'floorBig');m.tick();m.draw(huge);m.tick();
ok(m.st().prewarmMade===0&&m.made()===1,'큰 그림(200만 화소): 첫 장면엔 캔버스만 만들고 사본은 아직 없음');
m.tick();m.tick();ok(m.st().prewarmMade===0,'장면당 75만 화소씩 줄 단위로 그리는 중(2장면 뒤 아직 미완)');
m.tick();ok(m.st().prewarmMade===1&&m.uploads.length===1&&m.made()===1,'4장면째 완성 → 한 번만 올림(만든 캔버스 '+m.made()+')');
m=mk();const huge2=IMG(2000,1000,'floorBig2'),small=IMG(100,100,'small');m.tick();m.draw(huge2);m.tick();m.tick();m.set(true);m.tick();const gh=m.draw(huge2);
ok(isGray(gh)&&m.made()===1,'예열 도중 각성하면 만들던 캔버스의 나머지 줄만 그려 씀(새 캔버스 없음)');
// 조건 경계
m=mk({cd:3});m.tick();m.draw(a);m.tick();ok(m.st().prewarmMade===1,'사몽 대기 3초(경계)면 예열');
m=mk({cd:3.5});m.tick();m.draw(a);m.tick();ok(m.st().prewarmMade===0&&m.made()===0,'사몽 대기 3.5초면 예열 안 함');
m=mk({layer:'STORY'});m.tick();m.draw(a);m.tick();ok(m.st().prewarmMade===0,'꿈 층이 아니면(사몽 못 씀) 예열 안 함');
m=mk({step:1});m.tick();m.draw(a);m.tick();ok(m.st().prewarmMade===0,'성능 7단계 1(초저)은 예열 안 함(메모리)');
m=mk({step:2});m.tick();m.draw(a);m.tick();ok(m.st().prewarmMade===1,'성능 7단계 2 는 예열');
m=mk({step:'auto'});m.tick();m.draw(a);m.tick();ok(m.st().prewarmMade===1,'성능 단계 auto 는 예열');
// 모바일 예열 합계 600만 화소
m=mk({mobile:true});for(let i=0;i<12;i++){m.tick();m.draw(IMG(860,860,'mb'+i));}for(let i=0;i<14;i++)m.tick();
ok(m.st().grayPixels<=6e6&&m.st().prewarmMade===8,'모바일 예열 사본 합계 600만 화소 이하('+(m.st().grayPixels/1e6).toFixed(2)+'M, '+m.st().prewarmMade+'장)');
// 준비가 이어지는 동안 버리지 않음, 지역이 바뀌면 버림
m=mk();m.tick();m.draw(a);m.tick();m.tick(150);ok(m.freed()===0&&m.st().grayPixels===400*300,'준비 상태가 150초 이어져도 예열 사본을 버리지 않음');
m.sb.room={id:'zoneB',enemies:[],props:[]};m.tick();ok(m.freed()===1&&m.st().grayPixels===0,'지역이 바뀌면 예열 사본을 버림');
// 준비가 끝나면(대기 다시 김) 100초 뒤 버림(R977 규칙)
m=mk();m.tick();m.draw(a);m.tick();m.sb.player.samongCD=50;m.tick();m.tick(60);ok(m.freed()===0,'준비가 끝나고 60초는 들고 있음');m.tick(45);ok(m.freed()===1,'준비가 끝나고 100초 넘으면 버림');
// 예열은 한도의 85%(2,380만 화소)까지만 — 각성 시작 때 R977 비우기에 걸려 예열한 사본을 버리지 않게
m=mk();for(let i=0;i<40;i++){m.tick();m.draw(IMG(860,860,'pc'+i));}for(let i=0;i<40;i++)m.tick();const px=m.st().grayPixels;
ok(px<=28e6*.85&&px>28e6*.8,'PC 예열 합계 한도 85% 이하에서 멈춤('+(px/1e6).toFixed(2)+'M)');const fr=m.freed();m.set(true);m.tick();ok(m.freed()===fr,'각성 시작 때 예열 사본을 비우지 않음');
// 끄기
m=mk();m.P.set&&m.P.set({samongPrewarm:false});m.tick();m.draw(a);m.tick();ok(m.st().prewarmMade===0,'설정 samongPrewarm:false 면 예열 안 함');
// 기존 R977 규칙 유지: 각성 중 장면당 600만 화소
m=mk({cd:50});m.set(true);m.tick();ok(isGray(m.draw(IMG(2500,2500,'q1')))&&!isGray(m.draw(IMG(1000,1000,'q2'))),'각성 중 장면당 예산 600만 화소 그대로');
// ---- ② 흑백 사본이 원본을 기억 → R409 테두리 공유 ----
m=mk({cd:50});m.set(true);m.tick();const s1=IMG(320,240,'mobsheet');const g1=m.draw(s1);
ok(g1&&g1.__r1199AlphaOf===s1,'흑백 사본이 원본 그림을 기억(__r1199AlphaOf)');
ok(!Object.keys(g1).includes('__r1199AlphaOf'),'기억 칸은 열거되지 않음');
const r409=fs.readFileSync(path.join(SRC,'combat-read-r409.js'),'utf8');
ok(fs.readFileSync(path.join(RT,'combat-read-r409.js'),'utf8')===r409,'runtime-text 사본 = client-source(R409)');
const mIm=r409.match(/const imgId=im=>\{[^\n]*\n/);ok(!!mIm,'R409 imgId 찾음');
if(mIm){const imgId=vm.runInNewContext('(()=>{const ids=new WeakMap();let idSerial=0;'+mIm[0]+';return imgId;})()',{WeakMap});
 const s2={src:'https://x/assets/mob.png',currentSrc:'https://x/assets/mob.png'},gc={};Object.defineProperty(gc,'__r1199AlphaOf',{value:s2});const other={};
 ok(imgId(gc)===imgId(s2)+':g','R409: 흑백 사본 열쇠 = 원본 열쇠+:g(R1211 — 구운 칸에 몸 RGB 가 들어가 컬러와 나눔)('+imgId(gc)+')');ok(imgId(other)!==imgId(s2)&&imgId(other)!==imgId({}),'R409: 원본 없는 캔버스는 예전처럼 물체마다 번호');}
console.log(`\nR1199 CPU ${n-bad}/${n} ${bad?'FAIL':'PASS'}`);process.exit(bad?1:0);
