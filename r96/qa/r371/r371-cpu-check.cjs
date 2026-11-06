// R371 PLAY-08 P1: 사몽 777 불러온 뒤 숨은 서사창(storyScene 남음·창 닫힘)이 메뉴·Esc 를 막던 것 — CPU 검사(정적 + 가짜 엔진).
//  node r96/qa/r371/r371-cpu-check.cjs
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;const ok=(c,m)=>{assert(c,m);n++;console.log('PASS',m);};
const F='save-transition-r320.js',src=fs.readFileSync(path.join(R,'client-source',F),'utf8');
ok(src===fs.readFileSync(path.join(R,'runtime-text',F),'utf8'),'runtime-text 사본 일치');
ok(/node r96\/qa\/r371\/r371-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
ok(/if\(storyScene\)\{if\(ev\.key==='Enter'&&!ev\.repeat\)\{ev\.preventDefault\(\);advanceScene\(\)\}return\}/.test(html)&&/function showMenu\(\)\{if\(storyScene\)return;/.test(html),'원인 확인: storyScene 이 남으면 Esc·메뉴는 막히고 Enter 만 advanceScene');
ok(/function closePanel\(force=false\)\{if\(!force&&\(loading\|\|storyScene\|\|!started\)\)return;modal=false;/.test(html),'원인 확인: closePanel(true) 는 storyScene 을 남긴 채 창만 닫을 수 있음');
function engine(){let clock=0,ticks=0;const g={window:{},document:{readyState:'complete',addEventListener(){}},performance:{now:()=>clock},console,Date,
 started:true,modal:false,loading:false,storyScene:null,storyQueue:[],storyDone:null,adv:0,
 tick(){ticks++;}};
 g.advanceScene=function(){g.adv++;g.storyScene=g.storyQueue.shift()||null;if(!g.storyScene){g.modal=false;const d=g.storyDone;g.storyDone=null;if(d)d();return;}g.modal=true;};
 const ctx=vm.createContext(g);vm.runInContext(src,ctx,{filename:F});return {g,ctx,step(ms){clock+=ms;ctx.tick(1/60);},ticks:()=>ticks,api:g.window.__STORYWORLD_SAVE_TRANSITION_R320__};}
{const E=engine();let done=0;E.g.storyScene={key:'a'};E.g.storyDone=()=>done++;E.g.modal=false; // 숨은 마지막 서사
 E.step(16);E.step(300);ok(E.g.adv===0&&E.g.storyScene,'0.6초 전에는 손대지 않음');
 E.step(400);ok(E.g.adv===1&&!E.g.storyScene&&done===1&&E.api.inspect().orphanStory===1,'숨은 마지막 서사: Enter 처럼 한 번 넘겨 끝 처리(storyDone)까지');}
{const E=engine();E.g.storyScene={key:'a'};E.g.storyQueue=[{key:'b'}];E.g.modal=false;E.step(16);E.step(700);
 ok(E.g.adv===1&&E.g.storyScene?.key==='b'&&E.g.modal===true,'뒤에 남은 장면이 있으면 창을 다시 열어 보여 줌');
 E.step(2000);E.step(2000);ok(E.g.adv===1,'창이 보이는 정상 서사는 자동으로 넘기지 않음');}
{const E=engine();E.g.storyScene={key:'a'};E.g.modal=true;for(let i=0;i<10;i++)E.step(500);ok(E.g.adv===0,'정상 서사창(modal 열림)은 그대로');}
{const E=engine();E.g.storyScene={key:'a'};E.g.loading=true;for(let i=0;i<5;i++)E.step(500);ok(E.g.adv===0,'로딩 중에는 기다림');E.g.loading=false;E.step(16);E.step(700);ok(E.g.adv===1,'로딩 끝나고 0.6초 뒤 넘김');}
{const E=engine();E.g.started=false;E.g.storyScene={key:'a'};for(let i=0;i<5;i++)E.step(500);ok(E.g.adv===0,'시작 전(타이틀)은 손대지 않음');}
{const E=engine();E.g.storyScene={key:'a'};E.step(16);E.step(300);E.g.modal=true;E.step(400);E.g.modal=false;E.step(16);E.step(300);ok(E.g.adv===0,'잠깐 창이 열렸다 닫히면 시간을 다시 잼');}
{const E=engine();for(let i=0;i<4;i++)E.step(16);ok(E.ticks()===4,'원래 tick 은 그대로 돈다');}
// ── PLAY-08 P2: 벽 옆(.27~.29) 시작점에서 길찾기 거부 → 가까운 칸 중심으로 풀어 줌(perf-r367 안) ──
{const RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');const psrc=RT('perf-r367.js');ok(psrc===fs.readFileSync(path.join(R,'client-source','perf-r367.js'),'utf8'),'perf-r367 runtime-text 사본 일치');
 const ph=RT('dist/phase1.js');const at=ph.lastIndexOf('function explorationPath(');const end=ph.indexOf('\n}\n',at);const EP=new Function(ph.slice(at,end+2)+';return explorationPath;')();
 const store={};const win={StoryPhase1:Object.freeze({explorationPath:EP})};new Function('window','localStorage',psrc)(win,{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}});
 const P=win.StoryPhase1.explorationPath,A=win.__STORYWORLD_PERF_R367__;
 // 10x6 방: 4번째 줄(y=4) 전부 벽, 가운데 통로. 플레이어는 벽 위 (2.5, 3.73) → 벽(y≥4)까지 여유 .27
 const W=10,H=6,wall=new Set();for(let x=0;x<W;x++)wall.add(x+',4');for(let x=0;x<W;x++)wall.add(x+',0');
 const bl=(x,y,v)=>{if(x-v<0||y-v<0||x+v>W||y+v>H)return true;for(let a=Math.floor(x-v);a<=Math.floor(x+v);a++)for(let b=Math.floor(y-v);b<=Math.floor(y+v);b++)if(wall.has(a+','+b)){const dx=Math.max(a-x,0,x-a-1),dy=Math.max(b-y,0,y-b-1);if(Math.hypot(dx,dy)<v)return true;}return false;};
 const cl=(a,b,v)=>{const k=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/.18));for(let i=1;i<=k;i++)if(bl(a.x+(b.x-a.x)*i/k,a.y+(b.y-a.y)*i/k,v))return false;return true;};
 const L={bounds:[0,0,W,H]},from={x:2.5,y:3.7296},to={x:8.5,y:1.5};
 ok(bl(from.x,from.y,.29)&&!bl(from.x,from.y,.27),'재현: 시작점이 .29 로는 막히고 .27(걷기)로는 서 있음');
 ok(EP(L,from,to,.29,bl,cl).length===0,'재현: 엔진 explorationPath 는 [] (클릭 이동 거부)');
 const out=P(L,from,to,.29,bl,cl);ok(out.length>=1&&out[0].x===2.5&&out[0].y===3.5&&out[out.length-1].x===to.x&&out[out.length-1].y===to.y&&A.inspect().stats.unstuck===1,'고침: 가까운 칸 중심(2.5,3.5)으로 먼저 간 뒤 목표까지 길');
 ok(out.every(p=>!bl(p.x,p.y,.29)),'풀린 길의 점들은 .29 로 막히지 않음');
 ok(P(L,{x:2.5,y:3.8},to,.29,bl,cl).length===0,'.27 로도 못 서는 자리(벽에 박힘)는 그대로 거부');
 ok(P(L,from,{x:5.5,y:4.5},.29,bl,cl).length===0,'목표가 막혔으면 그대로 거부');
 ok(JSON.stringify(P(L,{x:2.5,y:2.5},to,.29,bl,cl))===JSON.stringify(EP(L,{x:2.5,y:2.5},to,.29,bl,cl)),'보통 시작점은 엔진 결과와 같음');
 A.set({unstick:false});ok(P(L,from,to,.29,bl,cl).length===0,'끄기(storyworld.r367.perf unstick:false) → 원래대로');A.set({unstick:true});}
{const ps=fs.readFileSync(path.join(R,'client-source','perf-r367.js'),'utf8');
 ok(/findPath=w;/.test(ps)&&/pathTo3=w;/.test(ps)&&/unstickGlobal\(/.test(ps),'Codex P2: 엔진이 먼저 잡아 둔 StoryPhase1 대신 전역 findPath·pathTo3 에도 벽 옆 시작점 풀기');
 ok(/const rest=direct\(r,c,to,radius\)\|\|base\.call/.test(ps),'다시 찾기는 도착점 기준 빈 길 기억(perf-r272/r360)을 거치지 않고 엔진 길찾기 직접(브라우저 검사 r371-browser 가 findPath 로 확인)');}
console.log(JSON.stringify({ok:true,checks:n,method:'static+fake-engine'}));
