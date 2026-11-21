// R1153 실패 먼저 — Dots CX-0146ST 상태이상 9종·CX-0148SG 사몽 문양 4영웅·CX-0149SE 서하 톱니·CX-0150MX 낙인/조준 고리/연쇄 레이저/배치 고리 적용
//  (사용자 2026-11-18 07:53Z "개선적용 앵간하면 홀드도 개선적용해 배경처리같은거 잘하고", 07:59Z "모든모드에서 구분되게 각각 독립적이게").
// 검사: ① 연결 ② 자산(손질본·해시) ③ 상태 이름 → 9종 ④ 영웅·적마다 따로 모음(만료·경계) ⑤ 그리기(오버레이 줄·아이콘 칸·저사양·NaN)
//       ⑥ 낙인 1~5 칸 ⑦ 조준 고리·연쇄 레이저 ⑧ 서하 톱니 ⑨ 배치 고리 영웅색 굽기 ⑩ 사몽 문양 4영웅만 ⑪ 기존 파일 훅(원래 그림으로 돌아가는 길)
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const ROOT=path.join(__dirname,'../..'),rd=f=>{try{return fs.readFileSync(path.join(ROOT,f),'utf8');}catch(_){return'';}};
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const N='dots-status-r1153.js',MOD=rd('client-source/'+N),A='assets/r1153/';
const SHEETS=['status-icons','status-overlay','sigil-lauren','sigil-hunter','sigil-slayer','sigil-gunner','seoha-clockwork','slayer-brand','gunner-reticle','gunner-chain','deploy-ring'];
// ① 연결
{const html=rd('runtime-text/index.html');ok(MOD.length>0&&rd('runtime-text/'+N)===MOD,'① '+N+' runtime-text 사본 = client-source');
 const t=x=>html.indexOf('<script src="./'+x+'"></script>');ok(t(N)>0&&t(N)<t('combat-r118.js')&&t(N)>t('persona-wer-r1144.js'),'① 스크립트 태그(persona-wer-r1144 뒤, combat-r118 앞)');
 ok(rd('../scripts/verify-r96-public.py').includes("'"+N+"'"),'① verify-r96-public.py 기대 목록');ok(rd('runtime-manifest.json').includes(N)&&rd('runtime-inputs.json').includes(N),'① runtime-manifest·inputs');
 ok(rd('../.github/workflows/pages.yml').includes('node r96/qa/r1153/dots-status-cpu-check.cjs'),'① pages.yml CPU 검사 줄');
 for(const s of SHEETS)ok(rd('runtime-manifest.json').includes(A+s+'.webp'),'① 매니페스트에 새 시트: '+s);
 ok(!/addEventListener\(\s*['"]key/.test(MOD)&&!/KeyboardEvent/.test(MOD),'① 키를 새로 듣지 않음');ok(!/drop-shadow|blur\(/.test(MOD),'① 기록기가 못 받는 필터 없음');}
// ② 자산: 손질 기록(index.json)의 해시 = 실제 파일, 칸 크기
{let idx=null;try{idx=JSON.parse(rd('runtime-text/'+A+'index.json'));}catch(_){}ok(!!idx&&Array.isArray(idx.files),'② index.json(원본·해시·손질 기록) 있음');
 const want={'status-icons':[1152,128],'status-overlay':[1536,2304],'sigil-lauren':[1152,896],'sigil-hunter':[1152,896],'sigil-slayer':[1152,896],'sigil-gunner':[1152,896],'seoha-clockwork':[1536,256],'slayer-brand':[1536,256],'gunner-reticle':[2048,256],'gunner-chain':[2048,128],'deploy-ring':[2048,256]};
 for(const s of SHEETS){const r=idx?.files?.find(f=>f.file===s+'.webp');let b=null;try{b=fs.readFileSync(path.join(ROOT,'runtime-text',A,s+'.webp'));}catch(_){}
  ok(!!r&&!!b&&crypto.createHash('sha256').update(b).digest('hex')===r.sha256&&JSON.stringify(r.size)===JSON.stringify(want[s])&&typeof r.fix==='string'&&/^0[0-9]{3}/.test(r.source),'② '+s+'.webp 해시·크기 '+JSON.stringify(want[s])+' · 원본 '+(r?.source||'?'));}
 for(const h of ['lauren','hunter','slayer','gunner']){const m=idx?.sigils?.[h];ok(!!m&&m.cell[0]===192&&m.cell[1]===224&&m.pivot[0]===96&&m.pivot[1]>150&&m.pivot[1]<190,'② 사몽 문양 '+h+' 칸·발 피벗 '+JSON.stringify(m));}}
function env(opt={}){const g={localStorage:{_s:{...(opt.store||{})},getItem(k){return this._s[k]??null;},setItem(k,v){this._s[k]=String(v);}},console,Math,Map,Set,WeakMap,WeakSet,Object,Array,Number,String,JSON,Date,Promise,isFinite};g.window=g;vm.createContext(g);
 vm.runInContext(`var time=10,started=true,loading=false,zoom=1,TILE=34,layer='STORY',settings={lowFx:${!!opt.lowFx}};
  var player={id:'me',hero:${JSON.stringify(opt.hero||'lauren')},x:10,y:10,hp:100,samong:${opt.samong?3:0}};var room={id:'z1',enemies:[],props:[]};var effects=[];
  function project(x,y){return{x:(x-y)*34+480,y:(x+y)*17};}function actorHeight(){return 66;}function tick(){}function drawEffect(e){}
  var READY=${opt.sheets!==false};function readyImage(p){if(!READY)return null;return {image:{src:p,naturalWidth:2048,naturalHeight:2304}};}var asked=[];function ensureImages(a){asked.push(...a);return Promise.resolve();}
  var seen=[],cur=null,st=[];var ctx={filter:'none',globalAlpha:1,globalCompositeOperation:'source-over',translate(){},rotate(){},scale(){},beginPath(){},moveTo(){},lineTo(){},arc(){},ellipse(){},closePath(){},
   save(){st.push([ctx.globalAlpha,ctx.globalCompositeOperation,ctx.filter]);},restore(){const s=st.pop();if(s){ctx.globalAlpha=s[0];ctx.globalCompositeOperation=s[1];ctx.filter=s[2];}},
   drawImage(im,...a){seen.push({op:'image',src:im.src||im.__storyworldStaticTint?.path||'canvas',a,o:cur,alpha:ctx.globalAlpha});},fill(){seen.push({op:'fill',o:cur});},stroke(){seen.push({op:'stroke',o:cur});},scope(o,f){const p=cur;cur=o;try{f();}finally{cur=p;}}};
  var baked=0;var document={createElement(){baked++;const c={width:0,height:0,getContext(){return {drawImage(){},fillRect(){},globalCompositeOperation:'',fillStyle:''};}};return c;}};
  var R430={};window.__STORYWORLD_THEME_FX_R430__={statusFor:a=>R430[a.id]||[],statusRows:()=>[]};
  var THEMES={};for(const h of ['lauren','hunter','slayer','gunner','hwando','seoha']){THEMES[h]={name:h,draw(L){seen.push({op:'base',h,L});}};}
  window.__STORYWORLD_SAMONG_THEME_R572__={theme:h=>THEMES[h]};`,g);
 if(opt.mod!==false&&MOD)vm.runInContext(MOD,g,{filename:N});return g;}
const Z=g=>g.__STORYWORLD_DOTS_STATUS_R1153__;
if(!MOD){ok(false,'모듈 파일 없음: client-source/'+N);console.log('FAILED '+fails);process.exit(1);}
// ③ 이름 → 9종(R431 열쇠·한글 이름·병원/지역 상처 이름)
{const g=env(),z=Z(g);ok(!!z&&typeof z.keyOf==='function','③ API 있음');
 const cases=[['r431-burn','burn'],['r431-hellfire','hellfire'],['poison','poison'],['중독','poison'],['질병','disease'],['빙결 · 둔화','chill'],['냉상','chill'],['root','bind'],['속박','bind'],['감전 · 공격 지연','shock'],['시간 왜곡 · 둔화','warp'],['r431-warp','warp'],['타락','curse'],['흑염 화상','hellfire'],['화상','burn'],['출혈',null],['',null],[undefined,null]];
 for(const [k,v] of cases)ok(z?.keyOf(k)===v,'③ '+JSON.stringify(k)+' → '+v+' (실제 '+z?.keyOf(k)+')');
 ok(JSON.stringify(z?.ORDER)===JSON.stringify(['burn','poison','disease','chill','bind','shock','warp','curse','hellfire']),'③ 9종 순서 = 아이콘 시트 칸 순서');}
// ④ 영웅·적마다 따로 모음
{const g=env(),z=Z(g);vm.runInContext(`R430.me=[{key:'warp',until:13},{key:'burn',until:11}];var mate={id:'mate',x:12,y:10,hp:50};R430.mate=[{key:'poison',until:12},{key:'curse',until:10}];
  window.__STORYWORLD_COOP_SIM_R62__={mode:()=>'host',livingPlayers:()=>[player,mate]};room.enemies.push({id:'e1',x:14,y:10,hp:9},{id:'e2',x:15,y:10,hp:9});`,g);
 z.mark(g.room.enemies[0],'shock',2);z.mark(g.room.enemies[0],'화상',1);z.mark(g.room.enemies[1],'bind',.5);
 const L=z.collect();const by=id=>L.find(r=>r.actor.id===id)?.list.map(s=>s.key).join(',');
 ok(by('me')==='burn,warp','④ 조종 영웅: 화상·시간 왜곡 따로, 9종 순서로 ('+by('me')+')');
 ok(by('mate')==='poison','④ 협동 동료: 중독만 — 만료 시각 = 지금(10) 인 타락은 뺌 ('+by('mate')+')');
 ok(by('e1')==='burn,shock'&&by('e2')==='bind','④ 적마다 따로: e1 '+by('e1')+' · e2 '+by('e2'));
 vm.runInContext('time=10.6',g);ok(Z(g).collect().find(r=>r.actor.id==='e2')==null,'④ 적 속박 0.5초 뒤 사라짐');
 vm.runInContext('room.enemies[0].hp=0',g);ok(Z(g).collect().find(r=>r.actor.id==='e1')==null,'④ 쓰러진 적은 표시 안 함');
 ok(z.mark(null,'burn',1)===false&&z.mark(g.room.enemies[1],'출혈',1)===false&&z.mark(g.room.enemies[1],'burn',NaN)===false,'④ 잘못된 입력은 거절');}
// ⑤ 그리기
{const g=env(),z=Z(g);vm.runInContext(`R430.me=[{key:'burn',until:13},{key:'poison',until:13}];`,g);z.tickNow();
 ok(g.effects.some(e=>e&&e.type==='r1153-status'),'⑤ 상태가 있으면 그리기 표식(sentinel)을 effects 에 넣음');
 vm.runInContext('seen.length=0;for(const e of effects.slice())drawEffect(e)',g);
 const ov=g.seen.filter(s=>s.op==='image'&&/status-overlay/.test(s.src));const hud=[];const hc={save(){},restore(){},beginPath(){},arc(){},fill(){},globalAlpha:1,drawImage(im,...a){hud.push({src:im.src,a});}};const nHud=z.paintHud(hc);const ic=hud.filter(s=>/status-icons/.test(s.src));
 ok(ov.length===2&&ov.map(s=>s.a[1]).sort((a,b)=>a-b).join()==='0,256','⑤ 몸 위 오버레이: 화상 줄(y0)·중독 줄(y256) 각각 ('+ov.map(s=>s.a[1])+')');
 ok(ic.length===2&&ic.map(s=>s.a[0]).sort((a,b)=>a-b).join()==='0,128'&&ic.every(s=>s.a[2]===128&&s.a[3]===128),'⑤ 머리 위 아이콘(화면 HUD 캔버스 — 어두운 지역·수묵화풍에 색이 안 바램): 화상 칸(0)·중독 칸(128) 각각');
 ok(nHud===2&&!g.seen.some(s=>/status-icons/.test(s.src))&&ov.every(s=>s.o&&/^r1153:/.test(s.o.id)&&s.o.kind==='effect'&&Number.isFinite(s.o.x)),'⑤ 오버레이 그리기 주인(scope) = r1153 effect·좌표 있음, 아이콘은 월드에 안 그림');
 const fr=ov.map(s=>s.a[0]/256);ok(fr.every(f=>Number.isInteger(f)&&f>=0&&f<6),'⑤ 오버레이 칸 0~5 ('+fr+')');
 const g2=env({lowFx:true});vm.runInContext(`R430.me=[{key:'burn',until:13}];`,g2);Z(g2).tickNow();vm.runInContext('for(const e of effects.slice())drawEffect(e)',g2);
 const h2=[];Z(g2).paintHud({save(){},restore(){},beginPath(){},arc(){},fill(){},drawImage(im){h2.push(im.src);}});ok(!g2.seen.some(s=>/status-overlay/.test(s.src))&&h2.some(s=>/status-icons/.test(s)),'⑤ 저사양(lowFx): 아이콘만, 오버레이 없음');
 const g3=env();vm.runInContext(`R430.me=[{key:'burn',until:13}];player.x=NaN;`,g3);let thrown=null;try{Z(g3).tickNow();vm.runInContext('for(const e of effects.slice())drawEffect(e)',g3);}catch(e){thrown=e;}
 let h3=0;try{h3=Z(g3).paintHud({save(){},restore(){},beginPath(){},arc(){},fill(){},drawImage(){}});}catch(e){thrown=e;}ok(!thrown&&!g3.seen.some(s=>s.op==='image')&&h3===0,'⑤ 좌표 NaN: 던지지 않고 안 그림');
 const g4=env({sheets:false});vm.runInContext(`R430.me=[{key:'burn',until:13}];`,g4);Z(g4).tickNow();vm.runInContext('for(const e of effects.slice())drawEffect(e)',g4);ok(!g4.seen.some(s=>s.op==='image')&&g4.asked.some(p=>/status-icons/.test(p)),'⑤ 시트 덜 읽힘: 안 그리고 불러오기 요청');
 const g5=env({store:{'storyworld.r1153.dots':'{"status":false}'}});vm.runInContext(`R430.me=[{key:'burn',until:13}];`,g5);Z(g5).tickNow();vm.runInContext('for(const e of effects.slice())drawEffect(e)',g5);ok(!g5.seen.some(s=>s.op==='image'),'⑤ 설정으로 끄면 안 그림');
 const g6=env();Z(g6).tickNow();ok(!g6.effects.some(e=>e&&e.type==='r1153-status'),'⑤ 상태가 없으면 표식 없음');}
// ⑥ 낙인 1~5 — 머리 위 표시라 화면 HUD 캔버스에(월드에 그리면 어두운 지역에서 검게 묻힘)
{const g=env(),z=Z(g);const hc=()=>{const out=[];return {out,save(){},restore(){},beginPath(){},arc(){},fill(){},drawImage(im,...a){out.push({src:im.src,a});}};};
 const idx=n=>{const r=z.brand({id:'e'+n},n,100,100,1.0);const c=hc();z.paintHud(c);const s=c.out.find(x=>/slayer-brand/.test(x.src));return r&&s?Math.round(s.a[0]/256):-1;};
 ok(idx(1)===0&&idx(2)===1&&idx(3)===2&&idx(4)===3,'⑥ 낙인 1·2·3·4 → 칸 0·1·2·3 (4개 칸은 손질로 만든 칸)');
 const five=new Set();for(let i=0;i<12;i++)five.add(z.brandFrame(5,i*.09));ok([...five].sort().join()==='4,5','⑥ 낙인 5개 = 칸 4·5 맥박 ('+[...five]+')');
 ok(!g.seen.some(s=>/slayer-brand/.test(s.src)),'⑥ 월드(게임 캔버스)에는 낙인을 그리지 않음');
 const c2=hc();z.paintHud(c2);ok(!c2.out.some(x=>/slayer-brand/.test(x.src)),'⑥ 한 번 그린 낙인은 비움(다음 그리기에서 R586 이 다시 알림)');
 ok(z.brand({id:'e'},0,1,1,1)===false&&z.brand({id:'e'},3,NaN,1,1)===false,'⑥ 0개·NaN 은 false(옛 방울로)');}
// ⑦ 조준 고리·연쇄 레이저
{const g=env(),z=Z(g);const rf=k=>{g.seen.length=0;z.reticle(200,200,120,k,1);const s=g.seen.find(x=>x.op==='image');return s?Math.round(s.a[0]/256):-1;};
 ok(rf(0)===0&&rf(.5)===4&&rf(.999)===7&&rf(1.4)===7&&rf(-1)===0,'⑦ 조준 고리: 대기 0→1 동안 칸 0→7 (좁혀짐 한 번)');
 g.seen.length=0;const r=z.chain(0,0,300,0,600,0,66,1,1,'c1');const tiles=g.seen.filter(s=>/gunner-chain/.test(s.src));
 ok(r===true&&tiles.length>=4&&tiles.every(s=>s.a[3]===128),'⑦ 연쇄 레이저: 두 토막(꺾임) 각각 시트 타일로 이어 붙임 ('+tiles.length+'장)');
 ok(z.chain(0,0,NaN,0,1,1,66,1,1,'x')===false,'⑦ NaN 이면 false(코드 그림으로)');}
// ⑧ 서하 톱니
{const g=env(),z=Z(g);g.seen.length=0;ok(z.gears(100,100,20,1,1,1)===true&&g.seen.some(s=>/seoha-clockwork/.test(s.src)),'⑧ 서하 톱니·초침 시트로 그림');ok(z.gears(NaN,1,1,1,1,1)===false,'⑧ NaN 이면 false');}
// ⑨ 배치 고리: 흰 테두리 빛 시트(영웅색은 R720 웅덩이·코드 고리가 그대로 맡음)
{const g=env(),z=Z(g);g.seen.length=0;ok(z.deploy(100,100,34,'#ff8800',1,0)===true&&z.deploy(100,100,34,'#3366ff',1.2,1)===true,'⑨ 배치 고리 그림');
 const im=g.seen.filter(s=>s.op==='image');ok(im.length===2&&im.every(s=>s.src===A+'deploy-ring.webp')&&g.baked===0,'⑨ Dots 테두리 시트 그대로(캔버스 굽기 없음 — Three 기록기가 못 받음)');
 ok(z.deploy(NaN,1,34,'#fff',1,0)===false,'⑨ NaN 이면 false');}
// ⑩ 사몽 문양: 라우렌·헌터·슬레이어·기억사수만 Dots 시트, 다른 영웅은 그대로
{const g=env({samong:true}),z=Z(g);z.tickNow();
 for(const h of ['lauren','hunter','slayer','gunner']){g.seen.length=0;g.THEMES[h].draw('back',100,100,70,{},1,1,false);const b=g.seen.filter(s=>s.op==='image'&&s.src===A+'sigil-'+h+'.webp');
  g.THEMES[h].draw('front',100,100,70,{},1,1,false);const f=g.seen.filter(s=>s.op==='image'&&s.src===A+'sigil-'+h+'.webp').length-b.length;
  ok(b.length===1&&f===1&&!g.seen.some(s=>s.op==='base'),'⑩ '+h+': 뒤층 한 장 + 앞층(발 앞 고리) 한 장, 코드 문양 안 그림');}
 for(const h of ['hwando','seoha']){g.seen.length=0;g.THEMES[h].draw('back',100,100,70,{},1,1,false);ok(g.seen.some(s=>s.op==='base'&&s.h===h),'⑩ '+h+' 는 손대지 않음');}
 const g2=env({samong:true,sheets:false});Z(g2).tickNow();g2.seen.length=0;g2.THEMES.lauren.draw('back',1,1,70,{},1,1,false);ok(g2.seen.some(s=>s.op==='base'),'⑩ 시트 덜 읽힘 → 원래 코드 문양');
 const g3=env({samong:true,store:{'storyworld.r1153.dots':'{"sigil":false}'}});Z(g3).tickNow();g3.seen.length=0;g3.THEMES.hunter.draw('back',1,1,70,{},1,1,false);ok(g3.seen.some(s=>s.op==='base'),'⑩ 문양 끄면 원래 코드 문양');}
// ⑪ 기존 파일 훅(시트가 없으면 원래 그림)
{const f586=rd('client-source/slayer-berserk-r586.js'),f561=rd('client-source/gunner-arms-r561.js'),f949=rd('client-source/seoha-epoch-r949.js'),f720=rd('client-source/hero-defense-r720.js'),f430=rd('client-source/theme-fx-r430.js');
 const X='__STORYWORLD_DOTS_STATUS_R1153__';
 ok(f586.includes(X)&&/brand\?\.\(e,n,q\.x,cy,t\)\)return/.test(f586),'⑪ R586 낙인: Dots 시트가 그리면 옛 방울 생략');
 ok(f561.includes(X)&&/reticle\?\.\(/.test(f561)&&!/chain\?\.\(/.test(f561),'⑪ R561 폭격 조준 고리만 연결. Q는 광선 접촉으로 판정');
 ok(f949.includes(X)&&/gears\?\.\(/.test(f949),'⑪ R949 톱니 훅');ok(f720.includes(X)&&/deploy\?\.\(/.test(f720)&&/ctx\.stroke\(\);\/\* 발밑 고리[^\n]*\n\s*\/\* R1153/.test(f720),'⑪ R720 배치 고리 훅(영웅색 코드 고리는 그대로 두고 그 위에)');
 ok(/statusFor\s*:/.test(f430),'⑪ R430 이 영웅별 상태(statusFor)를 내보냄');}
console.log(fails?'FAILED '+fails:'ALL PASS');process.exit(fails?1:0);
