// R840 CPU 검사: 서사별 NPC 퀘스트 — 사용자 2026-11-12 "적당한 npc들 2-3정도는 각 서사마다 등장하게(맵말고 짧은서사) 서사에 따라서, 서사는 바꾸지는 말고
//  간단한 몹처치 퀘스트나 특정장소가서 악에 물든 조형물 처치하면 단서템을 떨구는 이런 시스템, 길잡이는 이러한 퀘스트도 항상 올바르게 수행하도록, 영화모드랑도 잘해결해야해 버그없게끔".
//  ① 정상: 지역 들머리에 NPC 가 서고, 말을 걸어 받으면(purge) 가는 길에 악에 물든 조형물이 드러나고, 세 번 치면 부서지며 단서가 떨어지고, 주우면 쪽지 모음에 정본 문장이 들어간다.
//          (kill) 받은 뒤 정해진 몹을 정해진 수만큼 잡으면 단서가 떨어진다.
//  ② 경계: 거리·받기 전 치기·'나중에'·주울 수 있는 때·다른 몹·몹이 모자랄 때·R78 밖/EGO/생존/협동/끔/완료 지역.
//  ③ 길잡이·영화 모드: 창 없이 NPC → 조형물 → 단서 순서로 스스로 하고, 적이 가까우면 원래 길잡이에 넘기고, 길이 없으면 멈추지 않고 그 자리에서 마친다. 서사 창·모달 중에는 쉰다.
//  ④ 회귀: 세이브 왕복·깨진 세이브·보상 한 번만·서사 진행(R78 단계·R790 관문)을 막지 않음·단서 글은 정본에 있는 문장 그대로·빌드 연결 다섯 곳.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.join(__dirname,'../..');let n=0;const J=v=>v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v,ok=(c,m)=>{assert.ok(c,m);n++;},eq=(a,b,m)=>{assert.deepStrictEqual(J(a),J(b),m);n++;};
const srcPath=path.join(R,'client-source','quest-r840.js');ok(fs.existsSync(srcPath),'client-source/quest-r840.js 가 있다');const src=fs.readFileSync(srcPath,'utf8');
// ── 빌드 연결 ──
{const yml=fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8'),y=yml.split('\n'),i=y.findIndex(l=>l.includes('node r96/qa/r840/r840-cpu-check.cjs'));
 ok(i>0,'pages.yml CPU 검사 줄');ok(/^\s+- name: /.test(y[i-1])&&!y[i-1].replace(/^\s+- name: /,'').includes(': '),'pages.yml 단계 이름에 콜론+빈칸 없음');
 ok(fs.readFileSync(path.join(R,'runtime-text','quest-r840.js'),'utf8')===src,'runtime-text 사본이 같다');
 const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8'),a=html.indexOf('<script src="./npc-r790.js"></script>'),b=html.indexOf('<script src="./quest-r840.js"></script>');ok(a>0&&b>a,'index.html: npc-r790 뒤에 quest-r840');
 ok(html.indexOf('<script src="./quest-r840.js"></script>',b+1)<0,'스크립트 태그는 하나');
 ok(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'quest-r840.js'"),'verify-r96-public 기대 목록');
 ok(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8').includes('quest-r840.js'),'runtime-manifest 에 등록');}
const CANON=fs.readFileSync(path.join(R,'..','story-source','hapil-canon-r106-improved.txt'),'utf8');
const ENTRY={x:88,y:60.5},GATHER={x:16,y:33};
function world({store={},zoneId='last302',phase='route',controlled=true,survival=false,ego=false,coop='off',guideOn=false,done=false,ready=true,nav=true,enemyNear=false}={}){
 const c={Math,String,Number,Array,Object,JSON,Map,WeakMap,Set,Symbol,isFinite,RegExp,Promise,performance:{now:()=>0},setTimeout:f=>0,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}}};c.window=c;vm.createContext(c);
 vm.runInContext(`var time=10,started=true,modal=false,loading=false,storyScene=null,guide=${guideOn},zone=${JSON.stringify(zoneId)},layer='STORY',zoom=1,route=[],command=null,target=null;
  var __st={version:2,phase:${JSON.stringify(phase)}},__ctl=${controlled},__done=${done},__ready=${ready},__nav=${nav},__near=${enemyNear},__claims={};
  var mk=(i,nid,name,x,y)=>({id:zone+':e'+i,nativeId:nid,name:name,hp:50,maxHp:50,spawnState:'active',x:x,y:y});
  var room={id:zone,layer:layer,${ego?"egoVisitId151:'v1',":''}props:[{id:'deco-1',x:60,y:50,path:'assets/props/v290/dead_tree.webp',height:110,solid:true}],
   enemies:[mk(1,'l304-e2','중립초원 늑대',70,50),mk(2,'l304-e2','중립초원 늑대',68,50),mk(3,'l304-e2','중립초원 늑대 증원',66,50),mk(4,'l304-e2','중립초원 늑대',64,50),mk(5,'l304-e2','중립초원 늑대 우두머리',62,50),mk(6,'l304-e2','중립초원 늑대',58,50),
    mk(7,'l304-e1','중립초원 슬라임',56,50),mk(8,'l304-e1','중립초원 슬라임',54,50),{id:zone+':boss',nativeId:'x-boss',name:'보스',boss:true,hp:1000,maxHp:1000,spawnState:'hidden',x:16,y:12}],
   objective:{x:15,y:13},exploration:{entry:{id:'r171-entry',x:${ENTRY.x},y:${ENTRY.y},dx:-1,dy:-1},bossDoorId:'door-0',worldR74:{doors:[{id:'door-0',x:20,y:20,axis:'y'},{id:'door-1',x:85.5,y:64,axis:'y'},{id:'door-2',x:5,y:6,axis:'y'}]},worldWardR81:{bossBounds:[6,6,26,20],gatherAnchor:{x:${GATHER.x},y:${GATHER.y}}}}};
  var player={x:${ENTRY.x},y:${ENTRY.y},hp:100};var __log={base:0,guideBase:0,panel:[],toast:[],save:0,killBase:[],propBase:[],drawn:[],added:[],collect:[],award:[],atk:0};var __btn={};var __el={questText:{textContent:''}};
  function $(id){return __el[id]||null;}function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
  // 열린 땅: 가로 10~92, 세로 28~66 의 넓은 띠(들머리 88,60.5 → 집결 16,33). 그 밖은 막힘. 들머리 바로 오른쪽 아래(문턱)는 막힘.
  function blocked(x,y,r){r=r||.27;if(x>10+r&&x<92-r&&y>28+r&&y<66-r){if(Math.hypot(x-60,y-50)<.8+r)return true;return false;}return true;}
  function findPath(a,b,rm,rad){if(!__nav||blocked(b.x,b.y,.2))return [];var out=[],d=Math.hypot(b.x-a.x,b.y-a.y),k=Math.max(1,Math.ceil(d));for(var i=1;i<=k;i++)out.push({x:a.x+(b.x-a.x)*i/k,y:a.y+(b.y-a.y)*i/k});return out;}
  window.__STORYWORLD_POLISH_R100__={navPath:function(a,b){var r=findPath(a,b);return r.length?[{x:a.x,y:a.y}].concat(r):null;}};
  function nearestEnemy(range){return __near?room.enemies[0]:null;}
  function completed(id,l){return __done&&id===zone;}function interact(){__log.base++;return 'base';}function basicAttack(){__log.atk++;return 'atk';}function special(){__log.atk++;return 'sp';}
  function openPanel(h){modal=true;__log.panel.push(String(h));}function closePanel(){modal=false;}function button(id,fn){__btn[id]=fn;}function toast(t){__log.toast.push(String(t));}function saveGame(){__log.save++;return true;}function escapeHTML(s){return String(s).replace(/</g,'&lt;');}
  function serializeSave(){return {version:5};}async function restoreSave(raw){return raw&&raw.__fail?false:true;}async function newGame(){return true;}function tick(dt){time+=dt;}function guideStep(dt){__log.guideBase++;return 'gbase';}
  function updateHUD(){__el.questText.textContent='중앙 집결실로';}function drawProp(p){__log.propBase.push(p.id);__log.propPath=p.path;return 'pbase';}function killEnemy(e){if(e.__immortal)return false;__log.killBase.push(e.id);e.hp=0;e.spawnState='dead';return true;}
  function project(x,y){return {x:x*10,y:y*10};}function actorHeight(){return 66;}function fx(){}function sound(){}
  function readyImage(p){return __ready?{ready:true,image:{src:'http://x/m0/'+p,naturalWidth:1536,naturalHeight:256}}:null;}function addImage(p){__log.added.push(p);}
  function drawAssetFrame3(path,frame,x,y,h,opt){__log.drawn.push({path,x,y,h,alpha:opt&&opt.alpha,flip:opt&&opt.flip,rect:frame&&frame.assetFrame&&frame.assetFrame.sourceRect});return true;}
  var ctx={commands:[],scope:(o,f)=>f(),save(){},restore(){},fillText(){},fillRect(){},createRadialGradient(){return {addColorStop(){}};}};
  window.__STORYWORLD_WORLD_COMBAT_R78__={state:r=>r===room&&__st?JSON.parse(JSON.stringify(__st)):null,controlled:r=>r===room&&__ctl};
  window.__STORYWORLD_WORLD_R74__=Object.freeze({interactions:()=>[{id:'door-1',kind:'door',label:'문 열기',point:{x:85.5,y:64},reach:3}],canUse:()=>'baseCan',use:()=>'baseUse',isOpen:()=>false});
  window.__STORYWORLD_SURVIVAL_R600__={active:()=>${survival}};window.__STORYWORLD_COOP_SIM_R62__={mode:()=>${JSON.stringify(coop)}};
  window.__STORYWORLD_PROGRESSION_R62__={state:()=>({pointDropClaimsR64:__claims}),awardPointDrop:(a,id,pl)=>{if(__claims[id])return false;__claims[id]=true;__log.award.push([a,id]);return true;}};
  window.__STORYWORLD_PLAY_R169__={collect:n=>{if(__log.collect.some(b=>b.key===n.key))return false;__log.collect.push(n);return true;}};`,c);
 vm.runInContext(src,c,{filename:'quest-r840.js'});const run=s=>vm.runInContext(s,c);const api=c.__STORYWORLD_QUEST_R840__;
 const npc=()=>run('room.props.find(p=>p.r840NPC)'),prop=()=>run('room.props.find(p=>p.r840Prop)'),orb=()=>run('room.props.find(p=>p.r840Clue)');
 const at=(p,dx=.9,dy=.3)=>run(`player.x=${p.x+dx};player.y=${p.y+dy};`);
 return {run,api,log:()=>run('__log'),npc,prop,orb,at,st:()=>api.inspect().state};}
// ── ① 정상: 조형물 정화(purge) ──
{const w=world();ok(['last302','last303','last304','last305'].every(z=>w.api.zones().includes(z)),'첫 묶음 네 지역이 등록');
 w.run('tick(.1)');const p=w.npc();ok(p,'들머리에 NPC 가 선다');eq(p.solid,false,'NPC 는 길을 막지 않는다');eq(p.autoTargetEligible6,false,'자동 조준 대상 아님');
 const de=Math.hypot(p.x-ENTRY.x,p.y-ENTRY.y);ok(de>=3&&de<=8,'들머리 안쪽(3~8칸 — 헤드리스 실측으로 바뀐 요구: 3칸 안쪽은 방 목록에 없는 화로·촛대와 그림이 겹친다): '+de.toFixed(2));ok(!w.run(`blocked(${p.x},${p.y},.34)`),'빈 자리');
 ok(Math.hypot(p.x-GATHER.x,p.y-GATHER.y)<Math.hypot(ENTRY.x-GATHER.x,ENTRY.y-GATHER.y),'가는 길 쪽에 선다(문턱 뒤가 아님)');
 ok(!w.prop(),'받기 전에는 악에 물든 조형물이 드러나지 않는다');eq(w.st(),'new','상태 new');
 w.at(p);const r=w.run('interact()');ok(r===true,'NPC 곁 E 는 퀘스트가 받는다');eq(w.log().base,0,'엔진 상호작용으로 새지 않는다');eq(w.log().panel.length,1,'창이 열린다');
 const h=w.log().panel[0];ok(h.includes('어부')&&h.includes('id="questTakeR840"')&&h.includes('id="questWaitR840"'),'창: 이름과 받기·나중에 단추');ok(!/<script|onerror=|javascript:/i.test(h),'창에 스크립트 없음');
 w.run('__btn.questWaitR840()');eq(w.st(),'new',"'나중에': 그대로");ok(!w.run('modal'),'창 닫힘');ok(!w.prop(),"'나중에': 조형물 없음");
 w.run('interact()');w.run('__btn.questTakeR840()');eq(w.st(),'on','받음 → on');ok(!w.run('modal'),'받으면 창이 닫힌다');const q=w.prop();ok(q,'받으면 악에 물든 조형물이 드러난다');
 eq(q.solid,false,'조형물은 길을 막지 않는다(길찾기 그대로)');ok(/talisman-post\.webp$/.test(q.r840Art),'불면귀 편: 붉은 부적 말뚝 그림');
 // 불빛 계통(R123 isLight 는 path 의 lantern·shrine 낱말로 등불을 고른다)이 조형물을 등불로 보지 않게: 평소에는 path 가 없고 그리는 동안만 있다.
 ok(q.path===undefined,'평소엔 그림 경로가 없다(등불로 잡히지 않음)');w.run('drawProp(room.props.find(p=>p.r840Prop))');ok(/talisman-post\.webp$/.test(w.log().propPath),'그리는 동안에는 그림 경로가 있다');ok(w.prop().path===undefined,'그린 뒤 다시 없다');ok(!w.run(`blocked(${q.x},${q.y},.34)`),'조형물 자리는 빈 칸');
 const dq=Math.hypot(q.x-p.x,q.y-p.y);ok(dq>=8&&dq<=45,'특정 장소: NPC 에서 8~45칸 떨어진 가는 길 곁: '+dq.toFixed(1));
 ok(Math.hypot(q.x-60,q.y-50)>=1.2,'다른 조형물과 겹치지 않는다');ok(w.run('room.exploration.worldR74.doors').every(d=>Math.hypot(d.x-q.x,d.y-q.y)>3),'문턱에서 떨어져 있다');
 w.run('updateHUD()');ok(/중앙 집결실로/.test(w.run('__el.questText.textContent'))&&/말뚝/.test(w.run('__el.questText.textContent')),'목표 글: 원래 목표 + 퀘스트');
 ok(w.log().save>=1,'받을 때 저장');
 // 멀리서는 안 맞는다
 w.run('interact()');ok(w.log().panel.length===2||w.log().toast.some(t=>/말뚝/.test(t)),'받은 뒤 NPC 곁 E: 할 일을 다시 알려 준다');w.run('if(modal)closePanel()');
 w.run(`player.x=${q.x+4};player.y=${q.y};`);const b0=w.log().base;w.run('interact()');eq(w.log().base,b0+1,'4칸 밖 E 는 엔진으로');eq(w.api.inspect().hits,0,'멀리서는 안 맞는다');
 w.at(q,1.1,0);w.run('interact()');eq(w.api.inspect().hits,1,'곁에서 E: 한 대');w.run('tick(.5);basicAttack()');eq(w.api.inspect().hits,2,'곁에서 평타: 두 대');eq(w.log().atk,1,'평타는 그대로 나간다');ok(w.prop(),'아직 서 있다');
 w.run('tick(.5);special()');ok(!w.prop(),'세 대째에 부서진다');eq(w.st(),'drop','상태 drop');const o=w.orb();ok(o,'단서가 떨어진다');ok(Math.hypot(o.x-q.x,o.y-q.y)<.01,'조형물 자리');eq(o.solid,false,'단서는 길을 막지 않는다');
 w.run(`player.x=${o.x};player.y=${o.y};tick(.2)`);eq(w.st(),'drop','떨어진 직후 .55초 동안은 줍지 않는다');w.run('tick(.6)');eq(w.st(),'done','밟으면 줍는다 → done');ok(!w.orb(),'단서 구슬 사라짐');
 const c=w.log().collect;eq(c.length,1,'쪽지 모음에 단서 한 장');ok(c[0].key.startsWith('quest:r840:last302')&&typeof c[0].title==='string'&&c[0].text.length>20,'단서 열쇠·제목·글');
 for(const s of c[0].text.split(/(?<=\.)\s+/))ok(CANON.includes(s.trim()),'단서 글은 정본 문장 그대로: '+s.slice(0,24));
 eq(w.log().award.length,1,'보상 포인트 한 번');ok(w.log().award[0][0]>=1&&w.log().award[0][0]<=3,'보상은 1~3점');ok(w.npc(),'끝난 뒤에도 NPC 는 서 있다');
 w.at(w.npc());const pn=w.log().panel.length;w.run('interact()');eq(w.log().panel.length,pn,'끝난 뒤 NPC: 창을 다시 열지 않는다');w.run('tick(1);tick(1)');eq(w.log().award.length,1,'보상은 다시 주지 않는다');eq(w.log().collect.length,1,'단서도 한 번');
 w.run('updateHUD()');ok(!/말뚝/.test(w.run('__el.questText.textContent')),'끝나면 목표 글에서 빠진다');ok(!w.api.inspect().lastError,'모듈 오류 없음: '+w.api.inspect().lastError);}
// ── ① 정상: 몹 처치(kill) ──
{const w=world({zoneId:'last304'});w.run('tick(.1)');const p=w.npc();ok(p&&/elder/.test(p.r840NPC),'고블린 편 첫 지역: 피난민 노인');w.run('killEnemy(room.enemies[0])');eq(w.api.inspect().kills,0,'받기 전에 잡은 몹은 세지 않는다');
 w.at(p);w.run('interact()');w.run('__btn.questTakeR840()');eq(w.st(),'on','받음');ok(!w.prop(),'처치 퀘스트에는 조형물이 없다');const need=w.api.inspect().need;eq(need,5,'늑대 다섯');
 w.run('killEnemy(room.enemies[6])');eq(w.api.inspect().kills,0,'슬라임은 세지 않는다');w.run('room.enemies[1].__immortal=true;killEnemy(room.enemies[1])');eq(w.api.inspect().kills,0,'엔진이 막은 처치(체력 남음)는 세지 않는다');w.run('room.enemies[1].__immortal=false');
 for(const i of [1,2,3])w.run(`killEnemy(room.enemies[${i}])`);eq(w.api.inspect().kills,3,'늑대 셋');w.run('updateHUD()');ok(/3\s*\/\s*5/.test(w.run('__el.questText.textContent')),'목표 글에 3/5');
 w.run('killEnemy(room.enemies[1])');eq(w.api.inspect().kills,3,'이미 죽은 몹을 다시 넣어도 한 번만');
 // 몹이 모자랄 때: 남은 늑대 둘(4·5번 칸) 가운데 하나가 사라지면 채울 수 있는 만큼으로 줄어든다
 w.run('room.enemies[5].hp=0;room.enemies[5].spawnState="dead";tick(.5)');eq(w.api.inspect().need,4,'남은 몹이 모자라면 필요한 수가 줄어든다(막히지 않게)');
 w.run('killEnemy(room.enemies[4])');eq(w.st(),'drop','다 잡으면 단서가 떨어진다');const o=w.orb();ok(o&&!w.run(`blocked(${o.x},${o.y},.3)`),'단서는 빈 칸에');ok(Math.hypot(o.x-62,o.y-50)<2.5,'마지막 몹이 쓰러진 곁');
 w.run(`player.x=${o.x};player.y=${o.y};tick(.7)`);eq(w.st(),'done','줍기');const c=w.log().collect[0];for(const s of c.text.split(/(?<=\.)\s+/))ok(CANON.includes(s.trim()),'단서 글은 정본 그대로');ok(!w.api.inspect().lastError,'오류 없음');}
// ── ② 경계: 나타나지 않는 곳 ──
for(const [o,m] of [[{controlled:false},'R78 제어 밖'],[{ego:true},'EGO 재방문'],[{survival:true},'무한 생존'],[{coop:'host'},'협동'],[{done:true},'이미 끝낸 지역(받지 않은 채)'],[{zoneId:'ep1b01'},'정의 없는 지역'],[{store:{'storyworld.r840.quest':'{"on":false}'}},'끔']]){
 const w=world(o);w.run('tick(.1);tick(.1)');ok(!w.npc(),m+': NPC 없음');const b=w.log().base;w.run('interact()');eq(w.log().base,b+1,m+': E 는 엔진 그대로');eq(w.run('guideStep(.1)'),'gbase',m+': 길잡이 그대로');}
{const w=world({ready:false});w.run('tick(.1)');const p=w.npc();ok(p,'그림이 아직 안 읽혔어도 자리는 잡는다');ok(w.run('drawProp(room.props.find(p=>p.r840NPC))')!=='pbase','그림 전에도 엔진 그리기로 새지 않는다');eq(w.log().drawn.length,0,'안 읽힌 그림은 그리지 않는다');ok(w.log().added.length>=1,'그림을 청한다');}
{const w=world();w.run('tick(.1)');const p=w.npc();w.run(`player.x=${p.x+2.6};player.y=${p.y};`);const b=w.log().base;w.run('interact()');eq(w.log().base,b+1,'2.6칸 밖: 엔진으로');w.run(`player.x=${p.x+2.2};`);w.run('interact()');eq(w.log().panel.length,1,'2.2칸: 받는다');
 w.run('closePanel();player.hp=0');const b2=w.log().base;w.run('interact()');eq(w.log().panel.length,1,'쓰러진 영웅은 못 받는다');}
// 그리기: 시트 칸, 받기 전 이름표
{const w=world();w.run('tick(.1)');w.run('drawProp(room.props.find(p=>p.r840NPC))');const d=w.log().drawn;eq(d.length,1,'NPC 를 한 번 그린다');ok(/fisher-idle\.webp$/.test(d[0].path),'어부 숨쉬기 시트');eq(d[0].rect[2],256,'한 칸 256');ok(d[0].rect[0]%256===0&&d[0].rect[0]<1536,'칸 경계');
 eq(w.log().propBase.length,0,'엔진 그리기로 새지 않는다');w.run('drawProp(room.props[0])');eq(w.log().propBase.length,1,'다른 조형물은 엔진 그대로');}
// ── ③ 길잡이·영화 모드 ──
function drive(w,max=400){/* 엔진 걸음 흉내: route 가 있으면 끝 점으로 옮기고 시간을 흘린다 */let i=0;for(;i<max&&w.st()!=='done';i++){w.run('guideStep(.25)');w.run('if(route.length){var e=route[route.length-1];player.x=e.x;player.y=e.y;route=[];}tick(.25)');}return i;}
{const w=world({guideOn:true});w.run('tick(.1)');const steps=drive(w);eq(w.st(),'done','길잡이: NPC → 조형물 → 단서를 스스로 마친다('+steps+'걸음)');eq(w.log().panel.length,0,'길잡이는 창을 열지 않는다');ok(!w.run('modal'),'모달 없음');
 const s=w.api.inspect().stats;ok(s.auto>=1,'창 없이 받음');eq(s.fallback||0,0,'보통 길에서는 대신 처리 없음');eq(w.log().collect.length,1,'단서 한 장');eq(w.log().award.length,1,'보상 한 번');
 const g=w.log().guideBase;eq(w.run('guideStep(.25)'),'gbase','마친 뒤에는 원래 길잡이');ok(w.log().guideBase===g+1,'원래 길잡이가 돈다');}
{const w=world({guideOn:true,zoneId:'last304'});w.run('tick(.1)');for(let i=0;i<40&&w.st()==='new';i++){w.run('guideStep(.25)');w.run('if(route.length){var e=route[route.length-1];player.x=e.x;player.y=e.y;route=[];}tick(.25)');}
 eq(w.st(),'on','길잡이: 처치 퀘스트도 먼저 받는다');const g=w.log().guideBase;eq(w.run('guideStep(.25)'),'gbase','처치 중에는 원래 길잡이(전투)가 몬다');ok(w.log().guideBase===g+1,'원래 길잡이로 넘김');
 for(const i of [0,1,2,3,4])w.run(`killEnemy(room.enemies[${i}])`);eq(w.st(),'drop','다섯 잡음');drive(w);eq(w.st(),'done','길잡이: 떨어진 단서를 주우러 간다');}
{const w=world({guideOn:true,enemyNear:true});w.run('tick(.1)');const g=w.log().guideBase;eq(w.run('guideStep(.25)'),'gbase','적이 8칸 안: 원래 길잡이(전투) 먼저');eq(w.log().guideBase,g+1,'넘김');eq(w.st(),'new','받지 않음');eq(w.run('route.length'),0,'길을 덮어쓰지 않는다');}
{const w=world({guideOn:true});w.run('tick(.1);storyScene={key:"x"}');eq(w.run('guideStep(.25)'),'gbase','서사 창(영화 자막 포함) 중에는 쉰다');w.run('storyScene=null;modal=true');eq(w.run('guideStep(.25)'),'gbase','모달 중에는 쉰다');w.run('modal=false;loading=true');eq(w.run('guideStep(.25)'),'gbase','불러오는 중에는 쉰다');}
{const w=world({guideOn:true,nav:false});w.run('tick(.1)');const steps=drive(w,600);eq(w.st(),'done','길이 안 나와도 멈추지 않고 마친다('+steps+'걸음)');ok(w.api.inspect().stats.fallback>=1,'대신 처리 기록');eq(w.log().panel.length,0,'창 없음');eq(w.log().award.length,1,'보상 한 번');}
{const w=world({guideOn:true,phase:'boss'});w.run('tick(.1)');eq(w.run('guideStep(.25)'),'gbase','보스 단계에 켠 길잡이는 들머리로 되돌아가지 않는다');eq(w.run('route.length'),0,'길 그대로');}
// 회귀(첫 구현): 이 파일은 긴 스크립트 줄보다 앞에 실려서, 뒤에 실린 길잡이 오버레이(R426·R261 …)가 base 를 부르지 않고 끝내면 퀘스트 차례가 오지 않았다 → 첫 tick 에 바깥에서 얹는다.
{const w=world({guideOn:true});w.run("var __later=guideStep;guideStep=function(){__log.outer=(__log.outer||0)+1;return 'outer';};var __li=interact;interact=function(){__log.outerI=(__log.outerI||0)+1;return 'outerI';};");
 w.run('tick(.1)');ok(w.run('guideStep(.25)')!=='outer','뒤에 실린 길잡이 오버레이보다 먼저 본다');ok(w.run('route.length')>0,'NPC 로 가는 길을 잡는다');
 w.run('guide=false');w.at(w.npc());ok(w.run('interact()')===true,'뒤에 실린 상호작용 오버레이보다 먼저 본다');
 w.run('tick(.1);tick(.1)');const g0=w.run('String(guideStep)');w.run('tick(.1)');ok(w.run('String(guideStep)')===g0,'얹기는 한 번만(tick 마다 겹겹이 감싸지 않는다)');}
// 손으로 하다가 길잡이를 켜도 이어서 한다
{const w=world();w.run('tick(.1)');w.at(w.npc());w.run('interact();__btn.questTakeR840();guide=true');drive(w);eq(w.st(),'done','받은 뒤 길잡이를 켜면 이어서 마친다');}
// ── ④ 회귀 ──
// 서사 진행을 막지 않는다: killEnemy·interact 는 퀘스트와 무관할 때 그대로, 보스 처치도 그대로
// 길 양옆이 다 비었으면 더 트인 쪽에 선다(들머리 문짝·벽 쪽을 피함). 벽이 없으면 앞 후보(+쪽) 그대로.
{const w=world();const P=w.api.pure,e={x:0,y:0},g={x:20,y:0},pts=[e,g];const wall=(x,y)=>y>3;const a=P.npcSpot(e,g,pts,wall,[]),b=P.npcSpot(e,g,pts,()=>false,[]);
 ok(a&&a.y<0,'벽이 +쪽 3칸에 있으면 -쪽(트인 쪽)에 선다 '+JSON.stringify(a));ok(b&&b.y>0,'양쪽이 같으면 앞 후보 그대로 '+JSON.stringify(b));}
// 들머리 문짝(door-1 85.5,64)에서 5.5칸 넘게: 문짝 그림이 길어 가까이 서면 몸이 가린다(헤드리스 장면 실측).
{const w=world();w.run('tick(.1)');const n=w.npc();ok(n&&Math.hypot(n.x-85.5,n.y-64)>=5.5,'NPC 는 들머리 문짝에서 5.5칸 넘게 '+Math.hypot(n.x-85.5,n.y-64).toFixed(2));}
// 길 가 세움 등(R92 — 방 소품 목록에 없다)을 피한다: 받기 전 조형물이 설 자리에 등을 세우면, 받는 순간 다시 재어 4.5칸 밖에 선다.
{const a=world();a.run('tick(.1)');a.at(a.npc());a.run('interact()');a.run('__btn.questTakeR840()');a.run('tick(.1)');const q0=a.prop();ok(q0,'기준: 조형물 자리');
 const w=world();w.run('tick(.1)');w.run(`window.__STORYWORLD_VISUAL_R92__={lightPoints:()=>[{id:'r92:x',x:${q0.x},y:${q0.y}}]}`);w.at(w.npc());w.run('interact()');w.run('__btn.questTakeR840()');w.run('tick(.1)');const q=w.prop();
 ok(q,'등이 있어도 조형물은 놓인다');ok(Math.hypot(q.x-q0.x,q.y-q0.y)>=4.5,'세움 등에서 4.5칸 넘게 떨어진다 '+Math.hypot(q.x-q0.x,q.y-q0.y).toFixed(2));ok(!w.run(`blocked(${q.x},${q.y},.34)`),'옮긴 자리도 빈 칸');}
{const w=world();w.run('tick(.1)');ok(w.run('killEnemy(room.enemies[8])')===true,'보스 처치는 그대로 통과');eq(w.log().killBase.length,1,'엔진 처치 한 번');
 const rows=w.run('window.__STORYWORLD_WORLD_R74__.interactions()');ok(rows.some(t=>t.kind==='door'),'문 상호작용 그대로');ok(rows.some(t=>t.kind==='npc'&&/어부/.test(t.label)),'상호작용 목록에 NPC');
 eq(w.run('window.__STORYWORLD_WORLD_R74__.canUse({id:"door-1"})'),'baseCan','다른 대상 canUse 그대로');eq(w.run('window.__STORYWORLD_WORLD_R74__.use({id:"door-1"})'),'baseUse','다른 대상 use 그대로');}
// 세이브 왕복
{const w=world();w.run('tick(.1)');w.at(w.npc());w.run('interact();__btn.questTakeR840()');const q0=J(w.prop());w.at(q0,1.1,0);w.run('interact()');const raw=J(w.run('serializeSave()'));eq(raw.version,5,'엔진 세이브 그대로');eq(raw.questR840,{version:1,rooms:{'STORY:last302':{s:'on',k:0}}},'세이브 모양(맞은 횟수는 남기지 않는다)');}
(async()=>{
 {const w=world();w.run('tick(.1)');w.at(w.npc());w.run('interact();__btn.questTakeR840()');const q0=J(w.prop()),raw=J(w.run('serializeSave()'));
  const w2=world();w2.run('var __raw='+JSON.stringify(raw));await w2.run('restoreSave(__raw)');w2.run('tick(.1)');eq(w2.st(),'on','불러오기: on 그대로');const q1=J(w2.prop());ok(q1&&Math.hypot(q1.x-q0.x,q1.y-q0.y)<.01,'조형물은 같은 자리에 다시 선다');
  w2.at(q1,1.1,0);for(let i=0;i<3;i++)w2.run('interact();tick(.5)');eq(w2.st(),'drop','부숨');const raw2=J(w2.run('serializeSave()'));eq(raw2.questR840.rooms['STORY:last302'].s,'drop','drop 저장');
  const w3=world();w3.run('var __raw='+JSON.stringify(raw2));await w3.run('restoreSave(__raw)');w3.run('tick(.1)');ok(w3.orb(),'불러오기: 떨어진 단서가 다시 놓인다');ok(!w3.prop(),'부순 조형물은 돌아오지 않는다');
  const o=w3.orb();w3.run(`player.x=${o.x};player.y=${o.y};tick(.7)`);eq(w3.st(),'done','주움');const raw3=J(w3.run('serializeSave()'));
  const w4=world();w4.run('var __raw='+JSON.stringify(raw3));await w4.run('restoreSave(__raw)');w4.run('tick(.1);tick(1)');eq(w4.st(),'done','done 그대로');ok(!w4.prop()&&!w4.orb(),'끝난 퀘스트는 다시 깔리지 않는다');eq(w4.log().collect.length,0,'불러오기만으로 단서를 다시 넣지 않는다');
  // 실패한 불러오기는 기록을 바꾸지 않는다
  const w5=world();w5.run('tick(.1)');w5.at(w5.npc());w5.run('interact();__btn.questTakeR840()');w5.run('var __bad={__fail:true,questR840:{version:1,rooms:{"STORY:last302":{s:"done",k:0}}}}');await w5.run('restoreSave(__bad)');eq(w5.st(),'on','실패한 불러오기: 그대로');
  await w5.run('newGame()');w5.run('tick(.1)');eq(w5.st(),'new','새 게임: 처음부터');}
 // 깨진 세이브
 {const w=world(),cl=w.api.pure.clean;eq(cl(null),{},'null');eq(cl({version:2,rooms:{}}),{},'다른 판');eq(cl({version:1,rooms:[]}),{},'배열');
  eq(cl({version:1,rooms:{'STORY:last302':{s:'on',k:2},'STORY:nowhere':{s:'on',k:0},'DREAM:last302':{s:'on',k:0},'STORY:last303':{s:'weird',k:0},'STORY:last304':{s:'on',k:-3},'STORY:last305':{s:'on',k:1e9},'__proto__':{s:'on'}}}),
   {'STORY:last302':{s:'on',k:2},'STORY:last304':{s:'on',k:0},'STORY:last305':{s:'on',k:99}},'모르는 지역·층·상태는 버리고 수는 0~99로');
  w.run('var __raw={questR840:"garbage"}');await w.run('restoreSave(__raw)');w.run('tick(.1)');eq(w.st(),'new','깨진 기록: 처음부터, 던지지 않음');ok(!w.api.inspect().lastError,'오류 없음');}
 // 정의 점검: 서사마다 정본 문장, 그림 경로는 게임에 있는 것
 {const w=world(),man=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8')+fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8');
  for(const z of w.api.zones()){const d=w.api.def(z);ok(d&&d.npc&&d.quest&&d.clue,z+': 정의 모양');ok(['purge','kill'].includes(d.quest.type),z+': 종류');ok(typeof d.episode==='string'&&d.episode,z+': 서사 묶음 이름');
   for(const s of d.clue.text.split(/(?<=\.)\s+/))ok(CANON.includes(s.trim()),z+': 단서 글은 정본 그대로');for(const s of String(d.npc.lore||'').split(/(?<=\.)\s+/).filter(Boolean))ok(CANON.includes(s.trim()),z+': NPC 창의 인용도 정본 그대로');
   ok(fs.existsSync(path.join(R,'runtime-text',d.npc.sprite.path))||man.includes(d.npc.sprite.path),z+': NPC 그림이 게임에 있다 '+d.npc.sprite.path);
   if(d.quest.type==='purge')ok(fs.existsSync(path.join(R,'runtime-text',d.quest.prop.path))||man.includes(d.quest.prop.path),z+': 조형물 그림이 게임에 있다 '+d.quest.prop.path);
   if(d.quest.type==='kill')ok(d.quest.count>=3&&d.quest.count<=8&&typeof d.quest.match==='function',z+': 처치 수 3~8');}
  const eps=new Map();for(const z of w.api.zones()){const e=w.api.def(z).episode;eps.set(e,(eps.get(e)||0)+1);}for(const [e,k] of eps)ok(k+1>=2&&k+1<=3,'서사 '+e+': NPC '+(k+1)+'명(기존 핵심 NPC 포함 2~3)');
  const types=new Set(w.api.zones().map(z=>w.api.def(z).quest.type));ok(types.has('purge')&&types.has('kill'),'두 종류 퀘스트가 모두 쓰인다');
  ok(!/주민|어부|아낙|소복/.test(String(w.api.zones().filter(z=>w.api.def(z).quest.type==='kill').map(z=>w.api.def(z).quest.hud))),'정본 34·35장: 주민 처치를 목표로 삼지 않는다');}
 console.log('R840 CPU 검사 통과: '+n+'개');
})().catch(e=>{console.error(e);process.exit(1);});
