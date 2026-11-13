'use strict';
// R977 — 사몽 각성 때 렉(사용자 2026-11-13 "사몽각성시 렉이 심해지는것도 개선해줘").
//  측정(헤드리스 640×360, main 9ebd9de, dist02·kair04): 각성 중 그리기 시간 +40~75%, 각성 첫 세 장면 100~280ms(평소 약 40ms).
//  각성 동안 영웅·이펙트·투사체가 아닌 그림은 미리 만든 흑백 사본으로 바꿔 그리는데(R111), 각성이 끝나면 사본을 전부 버려서
//  각성할 때마다 사본 55~88장을 다시 만들고(큰 것은 한 장 69ms) GPU 에도 17~22백만 화소를 다시 올렸다.
//  고침: 각성이 끝나도 흑백 사본을 버리지 않고 다음 각성에서 다시 쓴다. 버리는 때는
//   · 지역이 바뀐 뒤 다음 각성(그림이 달라짐) · 각성이 끝나고 100 게임초가 지남(메모리) · 다음 각성 시작 때 사본이 한도의 85% 를 넘음(새 그림 자리).
//  각성 중 흑백 그림·한도(일반 2,800만·저사양 1,200만 화소)·장면당 예산은 그대로. 화면에 보이는 것은 같다.
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'..','..'),SRC=path.join(ROOT,'client-source'),RT=path.join(ROOT,'runtime-text');
let n=0,bad=0;const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('PASS',m);};
const src=fs.readFileSync(path.join(SRC,'play-r111.js'),'utf8');
ok(fs.readFileSync(path.join(RT,'play-r111.js'),'utf8')===src,'runtime-text 사본 = client-source');
function mk(opt={}){let made=0,freed=0;const canvases=[];
 class DrawCommands{constructor(){this.commands=[];this.owner={kind:'prop'};this.got=[];}drawImage(image){this.got.push(image);}push(kind,data){this.commands.push({kind,style:{...(data||{})}});return true;}}
 const sb={console,Math,JSON,Set,Map,WeakMap,WeakSet,Object,Array,Number,String,Boolean,Error,Promise,setTimeout,
  localStorage:{getItem:()=>null,setItem(){}},NodeFilter:{SHOW_TEXT:4},performance:{now:()=>0},
  document:{getElementById:()=>null,querySelector:()=>null,createTreeWalker:()=>({nextNode:()=>null}),
   createElement:()=>{made++;let w=0;const c={get width(){return w;},set width(v){if(v===1&&w>1)freed++;w=v;},height:0,getContext:()=>({filter:'none',drawImage(){}})};canvases.push(c);return c;}},
  time:10,started:true,modal:false,loading:false,settings:{lowFx:!!opt.lowFx},zoom:1,target:null,
  player:{x:0,y:0,hp:50,hero:'hwando',direction:'front',resonance:0,attackAnim:0,skillAnim:0,moving:false},
  room:{id:'zoneA',enemies:[],props:[]},HEROES:{hwando:{range:1.5}},
  maxHP:()=>100,actorHeight:()=>60,project:(x,y)=>({x:(x-y)*34,y:(x+y)*17}),facing:()=>'left',
  tick(dt){sb.time+=dt;},drawHero(){},drawEffect(){},drawProjectile(){},hitEnemy(){return true;},hurt(){},fx(){},blink(){},guideStep(){},
  StoryPhase1:{DrawCommands}};
 sb.window=sb;let active=false;sb.__STORYWORLD_SAMONG_R75__={active:()=>active};sb.__STORYWORLD_WER__={defs:{hwando:{e:['E','x','dash']}}};
 vm.createContext(sb);vm.runInContext(src,sb,{filename:'play-r111.js'});
 const dc=new DrawCommands();const P=sb.__STORYWORLD_PLAY_R111__;
 return{sb,dc,P,set:v=>{active=v;},tick:(dt=.016)=>sb.tick(dt),draw:img=>{dc.got.length=0;dc.drawImage(img,0,0);return dc.got[0];},made:()=>made,freed:()=>freed,st:()=>P.inspect().samong};}
const IMG=(w,h,name)=>({width:w,height:h,src:'assets/'+name+'.png'});
const isGray=c=>!!c?.__storyworldStaticSource?.r111SamongGray;
// 기본: 각성 중엔 흑백 사본, 각성 아니면 원본
let m=mk(),a=IMG(400,300,'floor'),b2=IMG(200,200,'mob');m.tick();
ok(m.st().grayInstalled===true,'흑백 바꿔 그리기 설치됨');
ok(m.draw(a)===a,'각성 전엔 원본 그대로');
m.set(true);m.tick();const g1=m.draw(a),h1=m.draw(b2);
ok(isGray(g1)&&isGray(h1)&&g1!==a,'각성 중엔 흑백 사본');ok(m.draw(a)===g1,'같은 각성 안에서는 같은 사본');
const made1=m.made();
// 각성 끝 → 원본, 사본은 남겨 둠
m.set(false);m.tick();ok(m.draw(a)===a,'각성이 끝나면 원본으로 돌아옴');
ok(m.freed()===0&&m.st().grayPixels===400*300+200*200,'각성이 끝나도 흑백 사본을 버리지 않음(화소 '+m.st().grayPixels+', 버린 수 '+m.freed()+')');
// 다음 각성(77초 뒤) → 같은 사본을 다시 씀
m.tick(77);m.set(true);m.tick();
ok(m.draw(a)===g1&&m.draw(b2)===h1,'다음 각성에서 같은 흑백 사본을 다시 씀');ok(m.made()===made1,'새 캔버스를 만들지 않음('+m.made()+'/'+made1+')');
const c3=IMG(100,100,'new');ok(isGray(m.draw(c3))&&m.made()===made1+1,'처음 보는 그림만 새로 만듦');
// 100 게임초 넘게 각성이 없으면 버림
m.set(false);m.tick();m.tick(60);ok(m.freed()===0,'각성 끝나고 60초: 아직 들고 있음');m.tick(45);
ok(m.freed()===3&&m.st().grayPixels===0,'각성 끝나고 100초 넘으면 사본을 버림(버린 수 '+m.freed()+')');
m.set(true);m.tick();const g2=m.draw(a);ok(isGray(g2)&&g2!==g1,'버린 뒤 각성하면 새 사본');
// 지역이 바뀌면 다음 각성 시작 때 버림
m=mk();a=IMG(400,300,'floor');m.set(true);m.tick();const z1=m.draw(a);m.set(false);m.tick();m.sb.room={id:'zoneB',enemies:[],props:[]};m.tick(5);
m.set(true);m.tick();ok(m.freed()===1,'지역이 바뀐 뒤 각성하면 옛 사본을 버림');const z2=m.draw(a);ok(isGray(z2)&&z2!==z1,'새 지역에서는 새 사본');
// 같은 각성 도중 지역이 바뀌는 경우는 예전 그대로(각성이 이어지는 동안 버리지 않음)
m=mk();a=IMG(400,300,'floor');m.set(true);m.tick();const k1=m.draw(a);m.sb.room={id:'zoneB',enemies:[],props:[]};m.tick();ok(m.draw(a)===k1&&m.freed()===0,'각성 도중에는 사본을 버리지 않음');
// 한도의 85% 를 넘게 들고 있으면 다음 각성 시작 때 비움(새 그림이 한도에 막혀 색으로 남지 않게)
m=mk();m.set(true);const bigs=[];for(let i=0;i<5;i++){m.tick();const im=IMG(2400,2000,'big'+i);bigs.push(im);ok(isGray(m.draw(im)),'큰 그림 '+(i+1)+' 흑백(누적 '+(m.st().grayPixels/1e6).toFixed(1)+'M)');}
m.set(false);m.tick();m.tick(10);m.set(true);m.tick();ok(m.freed()===5&&m.st().grayPixels===0,'사본이 한도의 85%(2,380만 화소)를 넘으면 다음 각성 시작 때 비움(버린 수 '+m.freed()+')');
ok(isGray(m.draw(IMG(2400,2000,'fresh'))),'비운 뒤 새 그림은 흑백으로');
// 실측한 한 지역 분량(2,140만 화소, 한도의 76%)은 비우지 않고 다시 씀
m=mk();m.set(true);for(let i=0;i<4;i++){m.tick();m.draw(IMG(2675,2000,'zone'+i));}m.set(false);m.tick();m.tick(10);m.set(true);m.tick();ok(m.freed()===0&&m.st().grayPixels===4*2675*2000,'한 지역 분량(2,140만 화소)은 다음 각성에서 그대로 씀');
// 한도·예산은 그대로
m=mk();m.set(true);m.tick();ok(isGray(m.draw(IMG(2500,2500,'p1')))&&m.draw(IMG(1000,1000,'p2'))!==undefined&&!isGray(m.dc.got[0]),'장면당 예산(600만 화소)은 그대로: 넘는 그림은 그 장면에선 원본');
m.tick();ok(isGray(m.draw(IMG(1000,1000,'p2b'))),'다음 장면에서 예산이 다시 참');
m=mk({lowFx:true});m.set(true);m.tick();ok(isGray(m.draw(IMG(1500,1400,'l1')))&&!isGray(m.draw(IMG(1200,1000,'l2'))),'저사양 예산(200만 화소)은 그대로');
// 바뀌는 캔버스(정적 표시 없음)는 예전처럼 바꾸지 않음
m=mk();m.set(true);m.tick();const live={width:64,height:64,getContext(){}};ok(m.draw(live)===live,'매 장면 바뀌는 캔버스는 흑백 사본을 만들지 않음');
ok(m.P.inspect().lastError==null,'오버레이 오류 없음 '+JSON.stringify(m.P.inspect().lastError));
console.log(`\nR977 CPU: ${n-bad}/${n}`);process.exit(bad?1:0);
