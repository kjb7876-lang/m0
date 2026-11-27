// R1346 CPU 검사 — 보스별 차별(공용 보스 스킬 정리 + 보스별 시그니처 스킬) — boss-identity-r1346.js
//  사용자 2026-11-26 14:00Z "추천안대로 개선해서 보스별 차별이 확실하게", 14:01Z "1.모든보스(운석·바닥 고리 전원 유지) 2. ^ㅗ^ 이런 모양의 프레임이펙트(R431 솟는 검은 불꽃)".
//  확인: ① 빌드 연결 ② 보스별 표(서로 다른 그림·시그니처) ③ 공용 층 연결 지점(R330·R105·R411·R1040·R431) ④ 시그니처 스킬 동작(맞음·상한·도형 0·바닥 예고 없음)
const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..'),F='boss-identity-r1346.js';let n=0;
const ok=(c,m,d)=>{if(!c)console.log('FAIL '+m,d===undefined?'':JSON.stringify(d).slice(0,500));assert(c,m);n++;console.log('PASS '+m);};
const read=p=>fs.readFileSync(path.join(R,p),'utf8');
const srcPath=path.join(R,'client-source',F);ok(fs.existsSync(srcPath),'오버레이 파일 있음');
const src=fs.readFileSync(srcPath,'utf8');
ok(src===read('runtime-text/'+F),'runtime-text 사본 같음');
// ---- ① 빌드 연결 ----
const html=read('runtime-text/index.html'),tag=s=>html.indexOf('<script src="./'+s+'"></script>');
ok(tag(F)>0&&tag(F)>tag('sin-skills-r1263.js')&&tag(F)<tag('boot-lean-r1038.js')&&new RegExp('\\n<script src="\\./'+F.replace(/\./g,'\\.')+'"></script>\\n').test(html),'index.html: 자기 줄, sin-skills-r1263 뒤·boot-lean-r1038 앞');
ok(fs.readFileSync(path.join(ROOT,'scripts/verify-r96-public.py'),'utf8').includes("'"+F+"'"),'verify-r96-public 기대 목록');
ok(fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r1346/r1346-cpu-check.cjs'),'pages.yml CPU 검사 줄');
const man=read('runtime-manifest.json');ok(man.includes('"'+F+'"')||man.includes('/'+F+'"'),'runtime-manifest 에 들어감');
ok(!/drop-shadow|blur\(/.test(src),'게임 ctx.filter 에 drop-shadow·blur 안 씀');
// ---- ③ 공용 층 연결 지점(다른 파일이 표를 먼저 묻는다) ----
const r330=read('client-source/disaster-r330.js'),r105=read('client-source/fx-boss-r105.js'),r411=read('client-source/skill-sheets-r411.js'),r1040=read('client-source/boss-pattern-fx-r1040.js'),r431=read('client-source/boss-arena-r431.js'),r241=read('client-source/boss-meteor-r241.js');
for(const [nm,s] of [['R330',r330],['R105',r105],['R411',r411],['R1040',r1040],['R431',r431]])ok(s.includes('__STORYWORLD_BOSS_IDENTITY_R1346__'),nm+': R1346 표를 묻는 연결 지점 있음');
ok(/r1346[^;]{0,200}disasterKind|disasterKind[^;]{0,200}/.test(r330)&&/allow\?\.\('disaster'/.test(r330),'R330: 보스별 재해 종류·끄기를 표에서');
ok(/function ground\([^)]*\)\{[^}]*groundSigil/.test(r330),'R330: 바닥 육망성(ground)이 표의 groundSigil 로 꺼짐');
ok(/allow\?\.\('flyMeteor'/.test(r105),'R105: 하늘에서 날아오는 운석을 표로 거름');
ok(/r411Pair/.test(r411),'R411: 장판 터짐 두 그림을 보스별 표에서');
ok((r1040.match(/burstSheet/g)||[]).length>=2,'R1040: 패턴 터짐 시트를 보스별 표에서(register·ready 둘 다)');
// 사용자 11-26 14:32Z: X자(십자) 예고 뒤 솟는 ^ㅗ^ 분수는 그대로 둔다 → 십자 패턴은 보스별 표를 묻지 않는다.
ok((r1040.match(/g\.shape!=='cross'&&window\.__STORYWORLD_BOSS_IDENTITY_R1346__\?\.burstSheet/g)||[]).length===2,'R1040: 십자(X자) 패턴 터짐은 예전 그림 그대로(register·ready 둘 다)');
ok(/drawBlast/.test(r431),'R431: 던지기 폭발(^ㅗ^ 솟는 불꽃)을 보스별 표에서');
ok(!/R1346|r1346/.test(r241),'R241 운석·바닥 고리는 손대지 않음(사용자: 모든 보스 유지)');
// ---- 샌드박스 ----
const SHAPES=['arc','ellipse','fillRect','strokeRect','lineTo','stroke','fill','rect','quadraticCurveTo','bezierCurveTo'];
function sandbox(o={}){
 const calls={hurt:[],imgs:[],shapes:0,scopes:[]};
 const ctx=new Proxy({},{get:(ob,k)=>k in ob?ob[k]:(typeof k==='string'&&!['globalAlpha','filter','globalCompositeOperation','imageSmoothingEnabled'].includes(k)?((...a)=>{if(SHAPES.includes(k))calls.shapes++;if(k==='drawImage')calls.imgs.push(a[0]&&a[0].src);}):undefined),set:(ob,k,v)=>{ob[k]=v;return true;}});
 ctx.scope=(q,fn)=>{calls.scopes.push(q);fn();};
 const player={x:10,y:10,hp:100,maxHp:100,invincible:0};
 const sb={window:{},localStorage:{store:{},getItem(k){return this.store[k]??null;},setItem(k,v){this.store[k]=v;}},time:0,started:true,loading:false,modal:false,storyScene:null,player,ctx,room:{id:o.room||'dist00',enemies:[]},effects:[],W:960,H:540,TILE:34,zoom:1,
  project:(x,y)=>({x:(x-y)*22+480,y:(x+y)*11+270}),actorHeight:()=>60,readyImage:p=>({image:{src:p,width:1536,height:1024,naturalWidth:1536,naturalHeight:1024}}),ensureImages:()=>Promise.resolve(),
  blocked:(x,y,r=.27)=>x-r<1||y-r<1||x+r>39||y+r>39,hurt:(d,s)=>{calls.hurt.push([d,s&&s.r1346]);return 'hit';},
  drawEffect(){},tick(dt){},settings:{},Math,JSON,String,Object,Number,Array,Set,Map,WeakMap,WeakSet,Promise,console};
 sb.window.window=sb.window;vm.createContext(sb);vm.runInContext(src,sb);return {sb,calls,player,A:sb.window.__STORYWORLD_BOSS_IDENTITY_R1346__};}
const S0=sandbox(),A=S0.A;
ok(!!A&&typeof A.spec==='function'&&typeof A.allow==='function'&&typeof A.inspect==='function'&&typeof A.register==='function','API window.__STORYWORLD_BOSS_IDENTITY_R1346__(spec·allow·register·inspect)');
// ---- ② 보스별 표 ----
const MAIN=['dist00-boss','dist06-boss','a11-boss','b02-boss','b05-boss','b07-boss','b08-boss','b09-boss','u203-boss','l301-boss','l303-boss','l305-boss','kair-great-01','kair-great-02','kair-great-03','kair-great-04','kair-great-05','kair-great-06','k103-boss','h103-boss','c102-boss','c103-boss','c104-boss'];
const NEWSIG=['dist00-boss','u203-boss','l301-boss','l303-boss','l305-boss','kair-great-01','kair-great-02','kair-great-03','kair-great-04','kair-great-05','kair-great-06','k103-boss','h103-boss','c102-boss','c103-boss','c104-boss'];
const OWN=['dist06-boss','a11-boss','b02-boss','b05-boss','b07-boss','b08-boss','b09-boss'];// 이미 고유 스킬이 있는 본보스(R473·R1239·R1258·R1263·R1042·R1274·R472)
const E=id=>({id:'E-'+id,nativeId:id,boss:!/^mb-|-mid$/.test(id),midboss:/^mb-|-mid$/.test(id),hp:1000,maxHp:1000,damage:20,spawnState:'active',x:13,y:12});
for(const id of MAIN){const s=A.spec(E(id));ok(!!s&&s.burst&&Array.isArray(s.r411)&&s.r411.length===2,'표에 있음: '+id,s);}
for(const id of NEWSIG){const s=A.spec(E(id));ok(s.sig&&A.archetypes.includes(s.sig.shape)&&s.sig.sheet,'새 시그니처 스킬: '+id,s&&s.sig);}
for(const id of OWN)ok(A.spec(E(id)).own===true,'이미 고유 스킬 있음 표시: '+id);
// 본보스끼리 겹치지 않음: 터짐 그림+장판 두 그림+시그니처(모양·시트) 묶음이 모두 다름
{const seen=new Map();for(const id of MAIN){const s=A.spec(E(id)),k=[s.burst,s.r411.slice().sort().join('+'),s.sig?s.sig.shape+':'+s.sig.sheet:'own:'+id].join('|');ok(!seen.has(k),'본보스 그림 묶음 겹침 없음: '+id+(seen.has(k)?' = '+seen.get(k):''),k);seen.set(k,id);}}
// 시그니처끼리: 모양·시트 둘 다 같은 보스 없음
{const seen=new Map();for(const id of NEWSIG){const g=A.spec(E(id)).sig,k=g.shape+':'+g.sheet;ok(!seen.has(k),'시그니처 모양+시트 겹침 없음: '+id,k);seen.set(k,id);}}
// 패턴 세트를 통째로 나눠 쓰던 짝은 터짐 그림이 다름
for(const [a,b] of [['l303-boss','l305-boss'],['c104-boss','c104-mid'],['u201-mid','u204-mid'],['u202-mid','u205-mid'],['u203-mid','u206-mid'],['c102-boss','kair-great-01'],['kair-great-01','kair-great-02'],['kair-great-04','kair-great-05'],['kair-great-05','kair-great-06']])
 ok(A.spec(E(a)).burst!==A.spec(E(b)).burst,'공유 패턴 세트 짝 터짐 그림 다름: '+a+' ↔ '+b,[A.spec(E(a)).burst,A.spec(E(b)).burst]);
// 질투·탐식(다른 스레드 R1343·위장 꿈틀 몫)은 비워 두고 연결 지점만
for(const id of ['b03-boss','b04-boss','mb-ep1b03','mb-ep1b04'])ok(A.spec(E(id))===null,'다른 스레드 몫은 표에서 비움: '+id);
{const S=sandbox();S.A.register('b03-boss',{burst:'frost',r411:['bone-spikes','ground-fissure']});ok(S.A.spec(E('b03-boss')).burst==='frost','register: 다른 스레드가 자기 보스 표를 넣을 수 있음');}
// 표에 없는 적은 예전 그대로
ok(A.spec({nativeId:'samong-x',boss:true})===null&&A.allow('disaster',{nativeId:'samong-x',boss:true})!==false&&A.allow('flyMeteor',{nativeId:'samong-x',boss:true})!==false,'표에 없는 보스(사몽 등)는 그대로');
// 공용 층 판단
for(const id of MAIN)ok(A.allow('meteor',E(id))!==false,'공용 운석은 모든 보스 유지: '+id);
for(const id of [...NEWSIG,...OWN])ok(A.allow('disaster',E(id))===false,'고유 스킬 있는 본보스는 공용 재해 끔: '+id);
for(const id of ['mb-dist02','mb-dist01','mb-ep1a08','u201-mid'])ok(A.allow('disaster',E(id))!==false,'중간보스는 재해 유지(서사 맞춤 종류): '+id);
ok(A.disasterKind(E('mb-dist02'))==='flood','늪의 뿔악마 군주 = 홍수(예전 \'군\' 글자 오인으로 폭탄)',A.disasterKind(E('mb-dist02')));
ok(A.disasterKind(E('mb-ep1b07'))==='volcano','화염기사=화산');
// 맘몬 지역은 사용자 승인 전 손대지 않음(CLAUDE.md) → 표에 없음 = 예전 그대로
for(const id of ['b06-boss','b06b-boss','mb-ep1b06','mb-ep1b06b'])ok(A.spec(E(id))===null&&A.allow('disaster',E(id))===undefined&&A.r411Pair(E(id))===null,'맘몬 지역 보스는 표에 없음(예전 그대로): '+id);
{let vol=0;for(const s of A.table())if(A.disasterKind(E(s.id))==='volcano')vol++;ok(vol<=3,'재해 \'화산\'(또 하나의 운석 6발)은 불 계열 중간보스만(≤3)',vol);}
ok(A.groundSigil()===false,'재해 바닥 육망성 예고 끔(바닥 예고 금지 규칙)');
for(const id of ['dist06-boss','b07-boss','mb-dist06','mb-ep1b07'])ok(A.allow('flyMeteor',E(id))!==false,'불 계열은 날아오는 운석 유지: '+id);
for(const id of ['a11-boss','b05-boss','l303-boss','c103-boss','mb-ep1a08'])ok(A.allow('flyMeteor',E(id))===false,'불과 무관한 보스는 R105 날아오는 운석 끔: '+id);
// ^ㅗ^ 솟는 검은 불꽃: 불 계열만 남고 나머지는 자기 터짐 시트
for(const id of ['dist06-boss','b07-boss','mb-ep1b07'])ok(A.blastSheet(E(id))===null,'불 계열은 R431 검은 불꽃 그대로: '+id);
{const seen=new Set();for(const id of MAIN.filter(i=>!['dist06-boss','b07-boss'].includes(i))){const b=A.blastSheet(E(id));ok(b&&b.path,'던지기 폭발 자기 시트: '+id,b);seen.add(b.path);}ok(seen.size>=8,'던지기 폭발 시트 종류 8가지 이상',seen.size);}
// 시트: 모두 실제 파일·manifest·프레임 시트 격자
{const used=new Set();for(const s of A.table()){used.add(A.sheetOf(s.burst).path);for(const k of s.r411)ok(fs.existsSync(path.join(R,'runtime-text/assets/r411/fx/'+k+'.webp')),'R411 시트 이름 맞음: '+s.id+' '+k);if(s.sig)used.add(A.sheetOf(s.sig.sheet).path);}
 const sz=p=>{const b=fs.readFileSync(path.join(R,'runtime-text',p));const i=b.indexOf('VP8');if(b.slice(12,16).toString()==='VP8X')return [1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];if(b.slice(12,16).toString()==='VP8L'){const v=b.readUInt32LE(21);return [1+(v&0x3fff),1+((v>>14)&0x3fff)];}return [b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];};
 for(const p of used){const d=A.sheetByPath(p);ok(fs.existsSync(path.join(R,'runtime-text',p))&&man.includes(p),'시트 파일·manifest: '+p);const [w,h]=sz(p);ok(w===d.cell*d.cols&&h===d.cell*Math.ceil(d.n/d.cols)&&d.n>=12,'프레임 시트 격자 맞음: '+p,{w,h,d});}}
// ---- ④ 시그니처 스킬 동작 ----
const run=(S,secs,dt=1/30)=>{for(let i=0;i<Math.round(secs/dt);i++){S.sb.time+=dt;S.sb.tick(dt);const m=S.sb.effects.find(x=>x&&x.type==='r1346-fx');if(m)S.sb.drawEffect(m);}};
const shapes={};
for(const id of NEWSIG){
 {const S=sandbox(),b=E(id);S.sb.room.enemies.push(b);run(S,S.A.tune.first+S.A.tune.cd+4);const ins=S.A.inspect();
  ok(ins.casts>=1,id+': 교전 뒤 시전',ins);
  ok(S.calls.hurt.length>=1&&S.calls.hurt.every(h=>h[1]===id),id+': 서 있으면 맞음(자기 이름표)',S.calls.hurt.slice(0,3));
  const tot=S.calls.hurt.reduce((s,h)=>s+h[0],0);ok(tot<=b.damage*S.A.tune.cap*ins.casts+1e-6,id+': 시전당 총 피해 ≤ 보스 근접 '+S.A.tune.cap+'대',{tot,casts:ins.casts});
  ok(S.calls.shapes===0,id+': 코드 도형 0 — 프레임 시트만',S.calls.shapes);
  const want=S.A.sheetOf(S.A.spec(b).sig.sheet).path;ok(S.calls.imgs.some(p=>p===want),id+': 자기 시그니처 시트를 그림',[want,[...new Set(S.calls.imgs)]]);
  ok(S.calls.scopes.length>0&&S.calls.scopes.every(q=>q.kind==='effect'&&q.groundAligned===false&&q.enemy===true),id+': 바닥 예고 장판 없음·적 효과 표시',S.calls.scopes.slice(0,2));
  shapes[id]=ins.lastSpots;}
 {const S=sandbox(),b=E(id);b.x=30;b.y=30;S.sb.room.enemies.push(b);run(S,S.A.tune.first+3);ok(S.A.inspect().casts===0,id+': 멀리(14칸 넘음) 있으면 시전 안 함');}
 {const S=sandbox(),b=E(id);b.hp=0;S.sb.room.enemies.push(b);run(S,S.A.tune.first+3);ok(S.A.inspect().casts===0,id+': 죽은 보스는 시전 안 함');}
}
// 피하면 안 맞음: 시전 순간 영웅이 4칸 옆으로 비키면 피해 0(추적형 chase 는 한 번 더 따라오므로 제외)
for(const id of NEWSIG.filter(i=>A.spec(E(i)).sig.shape!=='chase')){const S=sandbox(),b=E(id);S.sb.room.enemies.push(b);run(S,S.A.tune.first+.05);const c0=S.A.inspect().casts;
 ok(c0===1,id+': 첫 시전 시각 맞음',S.A.inspect());S.player.x=10+((b.x>10)?-6:6);S.player.y=4;run(S,4);ok(S.calls.hurt.length===0,id+': 시전 뒤 크게 비키면 안 맞음',S.calls.hurt);}
ok(new Set(Object.values(shapes).map(s=>JSON.stringify(s))).size===NEWSIG.length,'보스마다 다른 자리 배치(모양)',Object.keys(shapes).length);
{const S=sandbox();S.sb.localStorage.store['storyworld.r1346.identity']=JSON.stringify({on:false});const S2=sandbox();}
{const S=sandbox();S.A.set({on:false});ok(S.A.spec(E('dist00-boss'))===null&&S.A.allow('disaster',E('dist00-boss'))!==false,'끄기: 예전 그대로');}
console.log('R1346 CPU checks: '+n+' passed');
