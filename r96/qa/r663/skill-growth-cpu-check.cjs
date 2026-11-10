'use strict';
// R663 — 스킬 성장·QWER 잠금(사용자 2026-11-10 "기본실검무 및 문양실검무도 자동으로 스킬레벨업하게, 그리고 맨처음시작은 asdf만 기본이고
//  qwer은 스킬찍어야 사용가능하게 성장재미를 더 느끼도록 스킬성장하면 스킬범위도 늘어나야함").
//  ① 새 게임: A·S·D·F 만 기본. Q·W·E·R 은 패시브 포인트로 배워야 쓴다(1점). 이후 단계(최대 7)마다 비용 = 단계²점, 범위 +8%씩.
//  ② 이미 진행한 저장(레벨 2 이상·지역 완료 기록)은 QWER 1단계로 이어받는다(잠그지 않음).
//  ③ 자동 스킬레벨업(R237)은 QWER 배우기는 안 사고(점수를 잠긴 칸 수만큼 남김) 배운 칸 2~7단계, 기본 실검무(10단계까지)·문양 실검무 여섯 개를 산다.
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const NAME='skill-growth-r663.js',src=rd(path.join(R,'client-source',NAME)),html=rd(path.join(R,'runtime-text/index.html')),r237=rd(path.join(R,'client-source/auto-levelup-r237.js'));
ok(src.length>0,'client-source/'+NAME+' 있음');
ok(src.length>0&&rd(path.join(R,'runtime-text',NAME))===src,'runtime-text 사본 = client-source');
ok(rd(path.join(R,'runtime-text/auto-levelup-r237.js'))===r237,'runtime-text 의 R237 사본 = client-source');
ok(html.includes('<script src="./'+NAME+'"></script>')&&html.indexOf(NAME)<html.indexOf('"./michaela-r247.js"'),'index.html: michaela-r247·gunner-arms-r561 보다 앞에 태그(키를 먼저 받으려고)');
ok(rd(path.join(ROOT,'scripts/verify-r96-public.py')).includes("'"+NAME+"'"),'verify-r96-public.py 기대 목록');
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r663/skill-growth-cpu-check.cjs'),'pages.yml CPU 검사 줄');
ok(rd(path.join(R,'runtime-manifest.json')).includes(NAME)&&rd(path.join(R,'runtime-inputs.json')).includes(NAME),'runtime-manifest·inputs 등록');
ok(/\['QWER 스킬',\/\^skill\[QWER\]R663\//.test(rd(path.join(R,'client-source/play-r115.js'))),'R115 스킬 모음에 QWER 스킬 묶음');
ok(!/new_?key|keys\.add\(['"][tyuiogh]/.test(src),'새 스킬 키를 만들지 않음');

// ── 엔진 흉내(vm)
function mk(opt={}){
 const log={q:0,hits:[],shots:[],fx:[],toasts:[],hyp:[],wer:[]},store={},listeners={};
 const P62defs=[
  {id:'endlessPower',name:'끝없는 의지',icon:'haste',cost:1},
  {id:'threadDanceR63',name:'실검무 · 은실의 분기',icon:'haste',cost:1},
  ...['Cross','Flower','Fractal','Claw','Tsubame','Ichidan'].map(x=>({id:'thread'+x+'R64',name:'실검무 · '+x,icon:'haste',cost:1,maxRank:1}))];
 const state={version:1,ranks:{},clears:Object.assign({},opt.clears||{}),pointDropClaimsR64:{},egoVisitHigh:'0',visuals:true,awarded:0};
 const ctx={console,JSON,
  localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);}},
  started:true,modal:null,loading:false,storyScene:null,time:0,
  player:Object.assign({hero:'hwando',x:0,y:0,hp:100,level:1,points:0,specialCD:0,storyWER:{ready:{},buffs:{}},upgrades:{}},opt.player||{}),
  HEROES:{hwando:{name:'환도',special:'정화 연참'},hunter:{name:'헌터',special:'화살'}},KR291:{legacy:!!opt.legacy,w:opt.legacy?'Z':'W',e:opt.legacy?'X':'E',r:opt.legacy?'C':'R'},
  updateHUD(){},serializeSave(){return{storyWER:{remaining:{'hwando:w':5,'hwando:e':1e6}}};},toast(m){log.toasts.push(m);},sound(){},saveGame(){},
  document:{readyState:'loading',getElementById:()=>null,querySelector:()=>null,createElement:()=>({style:{}}),head:{appendChild(){}}},
  addEventListener(t,f,c){(listeners[t]=listeners[t]||[]).push({f,c});},
  window:{__STORYWORLD_COOP_SIM_R62__:opt.coop?{mode:()=>'host'}:undefined}};
 const W=ctx.window;W.addEventListener=ctx.addEventListener;
 W.__STORYWORLD_WER__=Object.freeze({defs:{hwando:{w:['월섬 회천',5,'circle'],e:['백은 유영보',4.5,'dash'],r:['EGO 환수검',13,'slashes']}},cast(s,auto){log.wer.push(s);return true;}});
 const ranks=(id,p)=>{const v=(state.ranks[id]||0);return v;};
 W.__STORYWORLD_PROGRESSION_R62__=Object.freeze({defs:P62defs,state:()=>state,ranks,purchase(id,p){const d=P62defs.find(x=>x.id===id),cost=Number(d.cost)||1;if(!d||ctx.player.points<cost||ranks(id)>=(d.maxRank??99))return false;ctx.player.points-=cost;state.ranks[id]=ranks(id)+1;return true;}});
 ctx.window.window=ctx.window;ctx.__log=log;vm.createContext(ctx);let err=null;
 // 엔진 함수는 vm 안에서 만든다(그래야 Math.hypot 가 이 컨텍스트의 것을 읽는다)
 vm.runInContext(`var special=function(){__log.q++;player.specialCD=10;__log.qDist=Math.hypot(3,4);hitEnemy({},5);makeShot(0,0,0,10,5,{friendly:true,life:1,radius:.2});fx('burst',0,0,{size:2});return true;};
  var hitEnemy=function(e,v){__log.hits.push(Math.hypot(3,4));return true;};var moveActor=function(){},clearLine=function(){},blocked=function(){},findPath=function(){},killEnemy=function(){};
  var makeShot=function(x,y,a,s,d,o){__log.shots.push(o);return o;};var fx=function(t,x,y,o){__log.fx.push(o);};
  var __delayed=[];var delay=function(sec,fn,owner){__delayed.push({at:time+sec,fn,owner});};
  var tick=function(dt){time+=dt;for(const d of __delayed.filter(d=>d.at<=time)){__delayed.splice(__delayed.indexOf(d),1);d.fn();}};`,ctx);
 try{vm.runInContext('var window=this.window;'+src,ctx);}catch(e){err=e;}
 const fire=t=>(listeners[t]||[]).forEach(l=>l.f({type:t}));
 fire('load');ctx.document.readyState='complete';
 const key=(k,extra={})=>{const ev=Object.assign({type:'keydown',key:k,code:'Key'+k.toUpperCase(),repeat:false,target:{tagName:'BODY'},stopped:false,prevented:false,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;}},extra);for(const l of (listeners.keydown||[]))if(!ev.stopped&&l.c)l.f(ev);return ev;};
 return{ctx,log,state,key,err,api:W.__STORYWORLD_SKILL_GROWTH_R663__,P62:W.__STORYWORLD_PROGRESSION_R62__,tick:(s=1/60)=>ctx.tick(s),listeners};}

const A=mk();ok(!A.err&&!!A.api,'오버레이가 오류 없이 올라옴'+(A.err?' ('+A.err.message+')':''));
if(A.api){
 // 정의: R62 패시브 칸으로 들어온다(저장·P 창·구매 규칙을 그대로 씀)
 const ids=['skillQR663','skillWR663','skillER663','skillRR663'],defs=ids.map(id=>A.P62.defs.find(d=>d.id===id));
 ok(defs.every(Boolean),'R62 칸에 skillQ/W/E/R 네 개 추가(새 키·새 저장 필드 없음)');
 ok(defs.every(d=>d.maxRank===7),'최대 7단계');
 ok(defs.map(d=>d.cost).join()==='1,1,1,1','처음 배우는 비용 1점(단계 0 → 1)');
 // 새 게임 → 잠김
 A.tick();
 ok(A.api.locked('q')&&A.api.locked('w')&&A.api.locked('e')&&A.api.locked('r'),'새 게임(레벨 1·기록 없음): QWER 잠김');
 ok(A.ctx.player.storyWER.ready['hwando:w']>1e5&&A.ctx.player.storyWER.ready['hwando:r']>1e5,'잠긴 W·R 은 먼 재사용 대기로 막음(엔진 안쪽 cast 도 못 씀)');
 const k=A.key('q');ok(k.stopped&&k.prevented,'잠긴 Q 키는 다른 처리기에 닿기 전에 막음');
 ok(A.key('w').stopped&&A.key('e').stopped&&A.key('r').stopped,'W·E·R 키도 막음');
 ok(!A.key('a').stopped&&!A.key('s').stopped&&!A.key('d').stopped&&!A.key('f').stopped,'A·S·D·F 는 그대로');
 ok(!A.key('q',{ctrlKey:true}).stopped,'Ctrl 조합은 건드리지 않음');
 ok(!A.key('q',{target:{tagName:'INPUT'}}).stopped,'입력칸은 건드리지 않음');
 const before=A.log.q;A.ctx.special();ok(A.log.q===before,'잠긴 Q: special() 가 아무 일도 안 함');
 ok(A.ctx.window.__STORYWORLD_WER__.cast('w',true)===false&&A.log.wer.length===0,'잠긴 W: __STORYWORLD_WER__.cast 가 거절(A키 오토·확률 발동 포함)');
 ok(A.log.toasts.some(t=>/잠겨|배우/.test(t)),'잠금 안내 글이 나옴');
 ok(A.ctx.serializeSave().storyWER.remaining['hwando:w']===undefined,'저장 파일에 먼 대기를 남기지 않음');
 ok(A.state.pointDropClaimsR64['r64:skillgrowth-r663']===true,'처음 본 새 게임 표식이 R62 저장 칸에 남음(다음 불러오기에도 안 풀림)');
 // 구매 → 사용
 A.ctx.player.points=60;
 ok(A.P62.purchase('skillQR663')===true&&A.api.rank('q')===1&&!A.api.locked('q'),'1점으로 Q 배움 → 잠금 풀림');
 A.tick();const q2=A.log.q;A.ctx.special();ok(A.log.q===q2+1,'배운 Q 는 나감');
 ok(!A.key('q').stopped,'배운 Q 키는 통과');
 ok(A.P62.purchase('skillWR663')&&(A.tick(),A.ctx.player.storyWER.ready['hwando:w']===0),'W 를 배우면 먼 대기가 풀림');
 ok(A.api.locked('e')&&A.api.locked('r'),'E·R 은 여전히 잠김');
 // 단계·비용·범위
 ok(A.api.cost(0)===1&&A.api.cost(1)===4&&A.api.cost(6)===49,'비용 = 다음 단계²(1·4·…·49)');
 ok(A.api.mult(0)===1&&A.api.mult(1)===1&&Math.abs(A.api.mult(2)-1.08)<1e-9&&Math.abs(A.api.mult(7)-1.48)<1e-9,'범위 배수: 1단계 ×1, 단계마다 +8%, 7단계 ×1.48');
 ok([1,2,3,4,5,6,7].every((l,i,a)=>!i||A.api.mult(l)>A.api.mult(a[i-1])),'단계가 오를수록 범위 단조 증가');
 // 범위: 스킬 코드가 도는 동안만 거리를 줄여 읽는다
 const B=mk({player:{level:5,points:0}});B.tick();
 ok(!B.api.locked('q')&&B.api.rank('q')===1&&B.api.rank('r')===1,'이어받은 저장(레벨 5): QWER 1단계로 잠그지 않음');
 B.state.ranks.skillQR663=7;B.ctx.special();
 ok(Math.abs(B.log.qDist-5/1.48)<1e-9,'Q 7단계: 스킬 안 거리 5 → '+(5/1.48).toFixed(3)+'(반경 ×1.48) 실제 '+B.log.qDist);
 ok(B.log.hits[0]===5,'피해·충돌 판정(hitEnemy 안)은 실제 거리 그대로');
 ok(Math.abs(B.log.shots[0].life-1.48)<1e-9&&Math.abs(B.log.shots[0].radius-.2*1.48)<1e-9,'아군 투사체 수명·반지름 ×1.48');
 ok(Math.abs(B.log.fx[0].size-2*1.48)<1e-9,'이펙트 크기 ×1.48');
 ok(vm.runInContext('Math.hypot(3,4)',B.ctx)===5,'스킬 밖 거리는 그대로');
 const C=mk({player:{level:5}});C.tick();C.ctx.special();ok(Math.abs(C.log.qDist-5)<1e-9,'Q 1단계: 범위 그대로(×1)');
 // W 지연 효과: 시전 신호(fx warning)로 칸을 기억해 같은 시전의 지연 작업에 W 단계 배수
 const D=mk({player:{level:5}});D.tick();D.state.ranks.skillWR663=4;let d4=0;
 D.ctx.fx('storySourceSkill',0,0,{storyWER:true,stage:'warning',sourceHero:'hwando',sourceSlot:'w',castId:'wer:9'});
 D.ctx.delay(.1,vm.runInContext('(function(){__d4=Math.hypot(3,4);})',D.ctx),'story-wer:wer:9');D.tick(.2);d4=D.ctx.__d4;
 ok(Math.abs(d4-5/1.24)<1e-9,'W 4단계 지연 효과: 거리 5 → '+(5/1.24).toFixed(3)+' 실제 '+d4);
 // 함께하기·끄기
 const E=mk({coop:true});E.tick();ok(!E.api.locked('q')&&!E.key('q').stopped,'함께하기(협동)에서는 잠그지 않음');
 // 레거시 키 배치(Z·X·C)
 const L=mk({legacy:true});L.tick();ok(L.key('z').stopped&&L.key('x').stopped&&L.key('c').stopped&&!L.key('w').stopped,'예전 키 배치: Z·X·C 가 W·E·R 칸');
 // 영웅이 바뀌어도 칸 이름은 현재 영웅 것
 ok(/정화 연참/.test(String(defs[0].name))&&/월섬 회천/.test(String(defs[1].name)),'카드 이름은 영웅의 Q 이름·W 이름');
}

// ── R237: 자동 스킬레벨업 — 배우기는 직접, 배운 칸 단계와 기본·문양 실검무는 자동
function mk237(opt={}){
 const calls=[];const store={};
 const defs=[{id:'endlessPower',name:'끝없는 의지',cost:1,maxRank:5},{id:'threadDanceR63',name:'실검무 · 은실의 분기',cost:1},
  ...['Cross','Flower','Fractal','Claw','Tsubame','Ichidan'].map(x=>({id:'thread'+x+'R64',name:'실검무 · '+x,cost:1,maxRank:1})),
  ...['Q','W','E','R'].map(s=>({id:'skill'+s+'R663',name:s+' 스킬',maxRank:7,get cost(){return ((ranks['skill'+s+'R663']||0)+1)**2;}}))];
 const ranks=Object.assign({},opt.ranks||{});const ctx={console,JSON,
  localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);}},
  started:true,modal:null,loading:false,storyScene:null,layer:'STORY',time:0,UPGRADES:[],rank:()=>0,
  player:{hero:'hwando',hp:100,points:opt.points??5},updateHUD(){},saveGame(){},toast(){},
  document:{getElementById:()=>null},setInterval(){},
  window:{}};ctx.window.window=ctx.window;
 ctx.window.__STORYWORLD_PROGRESSION_R62__={defs,ranks:(id)=>ranks[id]||0,purchase(id){const d=defs.find(x=>x.id===id),c=Number(d.cost)||1;if(ctx.player.points<c||(ranks[id]||0)>=(d.maxRank??99))return false;ctx.player.points-=c;ranks[id]=(ranks[id]||0)+1;calls.push(id);return true;}};
 ctx.window.__STORYWORLD_UPGRADES_R169__={buyTalent:()=>false};
 ctx.window.__STORYWORLD_SKILL_GROWTH_R663__=opt.noApi?undefined:{locked:s=>!(ranks['skill'+s.toUpperCase()+'R663']>0)};
 vm.createContext(ctx);vm.runInContext('var window=this.window;'+r237,ctx);
 return{ctx,calls,ranks,api:ctx.window.__STORYWORLD_AUTOLEVEL_R237__};}
const U=mk237({points:3});
ok(!!U.api,'R237 이 올라옴');
if(U.api){
 const ids=U.api.candidates().map(c=>c.id);
 ok(!ids.some(i=>/^skill[QWER]R663$/.test(i)),'안 배운 QWER 의 배우기는 자동 후보에 없음(직접 찍기)');
 ok(U.api.candidates().length===0,'잠긴 칸 4개 + 점수 3: 점수를 전부 남겨 둠(후보 없음)');
 U.api.step(true);ok(U.calls.length===0&&U.ctx.player.points===3,'자동 구매가 점수를 한 점도 안 씀(직접 배울 몫 보존)');
 const V=mk237({points:40});V.api.step(true);V.api.step(true);V.api.step(true);V.api.step(true);V.api.step(true);V.api.step(true);V.api.step(true);
 ok(['threadCrossR64','threadFlowerR64','threadFractalR64','threadClawR64','threadTsubameR64','threadIchidanR64'].every(id=>V.ranks[id]===1),'문양 실검무 여섯 개를 모두 산다');
 ok((V.ranks.threadDanceR63||0)>=1&&(V.ranks.threadDanceR63||0)<=10,'기본 실검무도 산다(자동은 10단계까지: 타격 12회 상한)');
 ok(['Q','W','E','R'].every(s=>!V.ranks['skill'+s+'R663'])&&V.ctx.player.points>=4,'남는 점수로만 산다: 잠긴 4칸 몫(4점) 이상이 남고 QWER 는 그대로 0단계');
 const X=mk237({points:400});for(let i=0;i<80;i++)X.api.step(true);
 ok(X.ranks.threadDanceR63===10,'기본 실검무 자동 단계 상한 10(무한 단계가 점수를 다 먹지 않음): '+X.ranks.threadDanceR63);
 ok(['Q','W','E','R'].every(s=>!X.ranks['skill'+s+'R663'])&&X.ctx.player.points>=4,'점수가 넉넉해도 배우기는 직접(QWER 0단계, 4점 남음)');
 const Y=mk237({points:1000,ranks:{skillQR663:1,skillWR663:1,skillER663:1,skillRR663:1}});for(let i=0;i<120;i++)Y.api.step(true);
 ok(['Q','W','E','R'].every(s=>Y.ranks['skill'+s+'R663']===7),'모두 배운 뒤에는 2~7단계를 자동으로 올림');
 const Z=mk237({points:200,ranks:{skillQR663:1,skillWR663:1}});for(let i=0;i<60;i++)Z.api.step(true);
 ok(!Z.ranks.skillER663&&!Z.ranks.skillRR663&&Z.ctx.player.points>=2&&Z.ranks.skillQR663>1,'일부만 배웠으면 안 배운 칸 수(2)만큼 남기고 배운 칸은 올림');
 const N=mk237({points:3,noApi:true});N.api.step(true);ok(N.calls.length===3,'R663 이 없으면(끔) 예전처럼 점수를 다 씀(예약 없음)');
}

console.log(n-bad+'/'+n+' 통과');process.exit(bad?1:0);
