// R1048 EGO 동작 재생기(ego-motion-r1048.js) CPU 검사 — 상태 우선순위·8방향·공격 구간·타격 멈춤·발 맞춤·섞어 넘기기·잔상·NaN.
const fs=require('fs'),path=require('path'),vm=require('vm');
const src=fs.readFileSync(path.join(__dirname,'../../client-source/ego-motion-r1048.js'),'utf8');
const win={};vm.runInNewContext(src,{window:win,Math,Number,Object});
const M=win.__STORYWORLD_EGO_MOTION_R1048__;let ok=0,bad=0;
const t=(name,c)=>{if(c){ok++;}else{bad++;console.log('FAIL',name);}};
t('모듈',!!M&&M.revision==='R1048-ego-motion-4');
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
