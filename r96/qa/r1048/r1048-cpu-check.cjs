// R1048 EGO 동작 재생기(ego-motion-r1048.js) CPU 검사 — 상태 우선순위·8방향·공격 구간·타격 멈춤·발 맞춤·섞어 넘기기·잔상·NaN.
const fs=require('fs'),path=require('path'),vm=require('vm');
const src=fs.readFileSync(process.env.R1048_SRC||path.join(__dirname,'../../client-source/ego-motion-r1048.js'),'utf8');
const win={};vm.runInNewContext(src,{window:win,Math,Number,Object});
const M=win.__STORYWORLD_EGO_MOTION_R1048__;let ok=0,bad=0;
const t=(name,c)=>{if(c){ok++;}else{bad++;console.log('FAIL',name);}};
t('모듈',!!M&&/^R1048-ego-motion-\d+$/.test(M.revision)&&+M.revision.split('-').pop()>=5);
// 우선순위
t('사망 최우선',M.pickState({dead:1,da:1,hu:1,at:1,mv:1})==='dead');
t('대시>피격',M.pickState({da:.2,hu:.3,at:.5})==='dash');
t('피격>공격',M.pickState({hu:.2,at:.5,mv:1})==='hurt');
t('관측 폐기>공격',M.pickState({discard:.5,at:.5})==='discard');
t('공격>이동',M.pickState({at:.5,mv:1})==='attack');
t('이동',M.pickState({mv:1})==='move');t('대기',M.pickState({})==='idle');
t('걷기/달리기 속도로',M.clipOf('move',2)==='walk'&&M.clipOf('move',5)==='run');
// 방향: 세계 (1,1) = 화면 아래(s), (1,-1) = 오른쪽(e), (-1,-1)=n, (-1,1)=w
t('방향 s',M.dir8(1,1)==='s');t('방향 e',M.dir8(1,-1)==='e');t('방향 n',M.dir8(-1,-1)==='n');t('방향 w',M.dir8(-1,1)==='w');
t('방향 se',M.dir8(1,0)==='se');t('정지면 이전 방향',M.dir8(0,0,'ne')==='ne');t('NaN 방향',M.dir8(NaN,1,'w')==='w');
// 공격 구간
const atk={frames:12,fps:20,loop:false,phases:{windup:[0,3],strike:[4,6],follow:[7,11]}};
t('공격 시작 0',M.attackFrame(0,atk)===0);t('예비 끝 3',M.attackFrame(.35,atk)===3);
t('타격 4~6',M.attackFrame(.36,atk)>=4&&M.attackFrame(.55,atk)<=6);t('끝 11',M.attackFrame(1,atk)===11);
t('공격 NaN',M.attackFrame(NaN,atk)===0);
// 발 맞춤
t('걷기 속도 비례',Math.abs(M.strideRate('walk',2.4,{})-1)<1e-9&&M.strideRate('walk',1.2,{})<1);
t('빠르기 상한',M.strideRate('walk',99,{})===M.RULES.maxRate);t('빠르기 NaN',M.strideRate('walk',NaN,{})===M.RULES.minRate);
// 재생기
const sheets={actions:{idle:{frames:12,fps:8,loop:true},walk:{frames:12,fps:14,loop:true},run:{frames:10,fps:18,loop:true},attack:atk,hit:{frames:8,fps:16,loop:false},discard:{frames:16,fps:16,loop:false}}};
const P=M.createPlayer(sheets);let r;
for(let i=0;i<10;i++)r=P.step(1/60,{});t('대기 재생',r.clip==='idle'&&r.fade===null);
r=P.step(1/60,{mv:1,speed:2.4,fx:1,fy:-1});t('걷기로 바뀜·섞기 시작',r.clip==='walk'&&r.fade&&r.fade.clip==='idle'&&r.fade.alpha>.5);
t('걷기 방향 e',r.dir==='e');
for(let i=0;i<12;i++)r=P.step(1/60,{mv:1,speed:2.4,fx:1,fy:-1});t('섞기 끝남',r.fade===null);
const ph0=P.state.phase;r=P.step(1/60,{mv:1,speed:5,fx:1,fy:-1});t('걷기→달리기 위상 이어감',r.clip==='run'&&P.state.phase>=ph0);
// 공격: 타격 첫 칸에서 멈춤
let held=false,frames=[];for(let i=0;i<=30;i++){r=P.step(1/60,{at:1,attackP:i/30,fx:1,fy:1});frames.push(r.frame);if(r.hold)held=true;}
t('공격 타격 멈춤',held);t('공격 칸 되감기 없음',frames.every((f,i)=>i===0||f>=frames[i-1]));t('공격 잔상',r.ghosts.length>0&&r.ghosts.every(g=>g.alpha>0&&g.alpha<1));
r=P.step(1/60,{hu:.3});t('피격 빠른 섞기',r.clip==='hit'&&r.fade&&P.state.fadeDur===M.RULES.fadeFast);
for(let i=0;i<40;i++)r=P.step(1/60,{hu:.3});t('피격 끝 칸 유지',r.frame===7);
// NaN·큰 dt
r=P.step(NaN,{mv:1,speed:NaN,fx:NaN,fy:NaN});t('NaN 입력 안전',Number.isFinite(r.frame)&&r.frame>=0);
r=P.step(99,{mv:1,speed:3});t('큰 dt 묶음',Number.isFinite(r.frame)&&r.frame<12);
t('readyImage 캐시 줄에서 .image 를 꺼냄(갈색 네모 회귀)',/readyImage\(p\),im=row\?\.image/.test(src));
// 검 궤적(CX-0110EG): 기본 공격만, 타격 첫 칸=가장 큰 3번 칸(색인 2), 예비·여운 끝은 없음
t('궤적: 기본 공격 타격 칸에 3번',M.slashFrame('attack',5,true)===2&&M.slashFrame('attack',6,true)===2);
t('궤적: 예비 앞·여운 끝·스킬·다른 동작엔 없음',M.slashFrame('attack',1,true)<0&&M.slashFrame('attack',13,true)<0&&M.slashFrame('attack',5,false)<0&&M.slashFrame('walk',5,true)<0);
t('궤적: 칸 차례가 앞으로만',[3,4,5,6,7,8,9,10].map(f=>M.slashFrame('attack',f,true)).every((v,i,a)=>i===0||v>=a[i-1]));
{const R=path.join(__dirname,'../..');t('궤적 그림 있음',fs.existsSync(path.join(R,'runtime-text',M.FX.slash.path)));}
// 깃 버스트(CX-0110EG): 16fps 8칸 한 번, 시작 전·끝난 뒤·NaN 은 없음
t('버스트: 0.5초 동안 0~7칸',M.burstFrame(10,10)===0&&M.burstFrame(10,10.2)===3&&M.burstFrame(10,10.49)===7);
t('버스트: 시작 전·끝 뒤·NaN 없음',M.burstFrame(10,9.9)<0&&M.burstFrame(10,10.5)<0&&M.burstFrame(NaN,1)<0&&M.burstFrame(1,NaN)<0);
{const R=path.join(__dirname,'../..');t('버스트 그림 있음',fs.existsSync(path.join(R,'runtime-text',M.FX.feathers.path)));}
// 광륜(CX-0110EG): 8fps 8칸 반복, 8→1 이어짐, NaN 안전
t('광륜: 반복 칸',M.haloFrame(0)===0&&M.haloFrame(.5)===4&&M.haloFrame(.99)===7&&M.haloFrame(1)===0&&M.haloFrame(NaN)===0&&M.haloFrame(-.2)>=0);
{const R=path.join(__dirname,'../..');t('광륜 그림 있음',fs.existsSync(path.join(R,'runtime-text',M.FX.halo.path)));}
t('이펙트 명령은 몸 테두리·가림 측정에서 빠짐(흰 테두리 회귀)',(src.match(/owner:fxOwner\(best\.owner\)/g)||[]).length===3&&/r409:true,r350:true,r448:true/.test(src));

// ---- 그리기 감싸기 실험(Codex #661 지적 4건) — drawHero 를 흉내 낸 기록기에 실제로 그려 본다 ----
function rig(bodyPath){const R=path.join(__dirname,'../..'),w={},cmds=[];
 vm.runInNewContext(fs.readFileSync(path.join(R,'client-source/ego-motion-r1048-sheets.js'),'utf8'),{window:w,Object});
 const ctl={S:{},cancel:{attack:false,skill:false},calls:[]};
 w.__STORYWORLD_EGO_SOVEREIGN_R1046__={formActive:()=>true,inspect:()=>({})};
 w.__STORYWORLD_HERO_MOTION_R895__={sample:()=>({...ctl.S}),moveCancel:k=>{ctl.calls.push(k);return !!(ctl.S.mv&&ctl.cancel[k]);}};
 const im={naturalWidth:4096,naturalHeight:256,width:4096,height:256};
 const C={window:w,Math,Number,Object,String,Array,JSON,performance:{now:()=>0},localStorage:{getItem:()=>null,setItem(){}},
  readyImage:()=>({image:im,ready:true}),addImage(){},actorHeight:()=>66,project:(x,y)=>({x:(x-y)*32,y:(x+y)*16}),room:{enemies:[]},
  player:{x:5,y:5,hp:10},time:1,ctx:{commands:cmds}};
 C.drawHero=function(){cmds.push({kind:'fill',owner:{kind:'scene'},order:cmds.length,key:'s:'+cmds.length,style:{}});
  cmds.push({kind:'image',owner:{kind:'hero',id:'hero'},order:cmds.length,key:'hero:0',points:[[0,0],[40,0],[40,80],[0,80]],sourcePath:ctl.body||bodyPath,image:{},style:{globalAlpha:1}});};
 vm.runInNewContext(src,C);const E=w.__STORYWORLD_EGO_MOTION_R1048__;
 const frame=(dt=1/60)=>{cmds.length=0;C.time+=dt;C.drawHero();return cmds.slice();};
 return{C,E,ctl,frame};}
// 1) 환도 아래 걷기(R436)·칼끝 공격(R439)·피격(R196) 몸도 EGO 로 바뀐다
for(const bp of ['assets/r436/hwando/walk-s.webp','assets/r439/hwando/attack-e.webp','assets/r196/hwando/hit-s.webp','assets/r283/hwando/r271/attack-e.webp','assets/r1063/r283/hwando/r271/walk-e.webp','assets/r1063/r439/hwando/attack-e.webp','assets/r1063/r283/hwando/r242/hit-s.webp']){
 const{E,frame}=rig(bp);frame();frame();const I=E.inspect();t('몸 경로 인식 '+bp.slice(7),I.stats.frames===2&&I.stats.skipped===0&&/assets\/r1048\/ego\//.test(I.lastSrc||''));}
{const{E,frame}=rig('assets/r1048/fx/ego_slash.webp');t('이펙트 그림은 몸이 아님',typeof E.bodyArt==='function'&&!E.bodyArt('assets/r600/dots/slash.webp')&&E.bodyArt('assets/r436/hwando/walk-s.webp'));}
// 2) 스킬·궁극기(기본 공격 타이머 없음) 동안 공격 칸이 앞으로 진행한다(고정 .5 로 9번 칸에 멈추던 문제)
{const{E,ctl,frame}=rig('assets/r271/hwando/idle-s.webp');const fr=[],ps=[];
 for(let i=0;i<=30;i++){ctl.S={sk:.5*(1-i/30)};frame();const I=E.inspect();if(I.state?.clip==='attack'){fr.push(I.state.frame);ps.push(I.input.attackP);}}
 t('스킬 진행도 0→1',ps.length>20&&ps[0]<.1&&ps[ps.length-1]>.9&&ps.every((v,i)=>i===0||v>=ps[i-1]-1e-9));
 t('스킬 공격 칸이 여러 칸을 지남',new Set(fr).size>=6&&fr.every((f,i)=>i===0||f>=fr[i-1]));
 for(let i=0;i<=20;i++){ctl.S={ul:.4*(1-i/20)};frame();}t('궁극기 진행도 끝까지',E.inspect().input.attackP>.9||E.inspect().state.clip!=='attack');}
// 3) R895 이동 취소: 커밋 창 뒤 이동이면 공격 그림을 내려놓고 걷는다(미끄러지는 공격 자세 없음)
{const{E,ctl,frame,C}=rig('assets/r271/hwando/idle-s.webp');
 ctl.S={at:.3};frame();ctl.S={at:.28};frame();t('취소 없으면 공격',E.inspect().state.clip==='attack');
 ctl.cancel.attack=true;for(let i=0;i<12;i++){ctl.S={at:.27-i*.01,mv:true};C.player.x+=.05;frame();}
 const I=E.inspect();t('기본 공격 이동 취소 → 걷기',I.input.at===0&&I.input.basic===false&&I.state.clip!=='attack'&&ctl.calls.includes('attack'));
 ctl.cancel.attack=false;ctl.cancel.skill=true;for(let i=0;i<12;i++){ctl.S={sk:.4-i*.01,mv:true};C.player.x+=.05;frame();}
 t('스킬 이동 취소 → 걷기',E.inspect().input.at===0&&E.inspect().state.clip!=='attack'&&ctl.calls.includes('skill'));
 ctl.cancel.skill=false;ctl.S={sk:.3,mv:true};C.player.x+=.05;frame();t('커밋 창 안이면 스킬 그림 유지',E.inspect().state.clip==='attack');}
// 4) 끼운 명령(광륜·궤적·잔상)의 order 가 자리 순서와 같고 겹치지 않는다 → 광륜 앞/뒤가 Three renderOrder 에 닿는다
{const{E,ctl,frame,C}=rig('assets/r271/hwando/idle-s.webp');
 const ordOk=c=>c.every((x,i)=>x.order===i);
 C.player.x=5;C.player.y=5;let c;for(let i=0;i<6;i++){C.player.x+=.03;C.player.y+=.03;c=frame();}/* 아래(s)로 걸음 */
 let hi=c.findIndex(x=>/:r1048h$/.test(x.key)),bi=c.findIndex(x=>x.key==='hero:0');
 t('order = 자리 순서(겹침 없음)',ordOk(c)&&new Set(c.map(x=>x.order)).size===c.length);
 t('남쪽: 광륜 order < 몸 order',hi>=0&&bi>=0&&c[hi].order<c[bi].order);
 for(let i=0;i<8;i++){C.player.x-=.03;C.player.y-=.03;c=frame();}/* 위(n)로 걸음 */
 hi=c.findIndex(x=>/:r1048h$/.test(x.key));bi=c.findIndex(x=>x.key==='hero:0');
 t('북쪽: 광륜 order > 몸 order',E.inspect().state.dir==='n'&&hi>=0&&bi>=0&&c[hi].order>c[bi].order&&ordOk(c));
 ctl.S={at:.3};frame();ctl.S={at:.2};for(let i=0;i<10;i++){ctl.S={at:.2-i*.015};c=frame();if(c.some(x=>/:r1048s/.test(x.key)))break;}
 t('궤적 명령도 order 정렬',c.some(x=>/:r1048s/.test(x.key))&&ordOk(c));}
const E=M.createPlayer(null);r=E.step(1/60,{});t('시트 없음 안전',r.frame===0);
// 시트 데이터·자산·태그 순서·0번째 칸
{const R=path.join(__dirname,'../..'),w2={};vm.runInNewContext(fs.readFileSync(path.join(R,'client-source/ego-motion-r1048-sheets.js'),'utf8'),{window:w2,Object});
 const S=w2.__STORYWORLD_EGO_MOTION_R1048_SHEETS__;t('시트 데이터',!!S&&S.cell>0&&S.dirs.length===8&&['idle','walk','run','attack','hit','discard'].every(k=>S.actions[k]&&S.actions[k].frames>0));
 t('공격 구간',!!S.actions.attack.phases&&S.actions.attack.phases.strike);
 const miss=[];for(const k in S.actions)for(const d of S.dirs){const f=path.join(R,'runtime-text',S.base,k+'-'+d+'.'+S.ext);if(!fs.existsSync(f))miss.push(k+'-'+d);}t('시트 그림 48장 있음',miss.length===0);
 const html=fs.readFileSync(path.join(R,'runtime-text/index.html'),'utf8'),i=x=>html.indexOf('<script src="./'+x+'"></script>');
 t('태그 순서: ego-secret-r1057 → 시트 → 재생기',i('ego-secret-r1057.js')>=0&&i('ego-secret-r1057.js')<i('ego-motion-r1048-sheets.js')&&i('ego-motion-r1048-sheets.js')<i('ego-motion-r1048.js'));
 const man=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');t('매니페스트에 재생기·시트',man.includes('ego-motion-r1048.js')&&man.includes('ego-motion-r1048-sheets.js')&&man.includes('assets/r1048/ego/idle-s.webp'));
 const sov=fs.readFileSync(path.join(R,'client-source/ego-sovereign-r1046.js'),'utf8');t('EGO 칸은 영웅 줄 맨 앞(0번째)',/insertAdjacentElement\('beforebegin',c\)/.test(sov)&&sov.includes('refresh:'));}
console.log(`R1048 ego-motion CPU ${ok}/${ok+bad}`);process.exit(bad?1:0);
