// R1343 금이 간 안경 보스 유리 조각 폭풍 CPU 검사(가짜 방에서 오버레이 로직을 돌린다 — 그래픽 검증 아님).
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const F='envy-glass-r1343.js',src=fs.readFileSync(path.join(R,'client-source',F),'utf8');
// ── 연결 다섯 곳 ──
ok(fs.existsSync(path.join(R,'runtime-text',F))&&fs.readFileSync(path.join(R,'runtime-text',F),'utf8')===src,'runtime-text 사본 같음');
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
ok((html.match(/<script src="\.\/envy-glass-r1343\.js"><\/script>/g)||[]).length===1&&html.indexOf('envy-glass-r1343.js')>html.indexOf('sin-skills-r1263.js'),'index.html 스크립트 태그 한 번, R1263 뒤');
ok(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'envy-glass-r1343.js'"),'verify-r96-public 기대 목록');
ok(/node r96\/qa\/r1343\/r1343-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 줄');
const man=JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8'));const mp=new Set((man.files||man.entries||[]).map(v=>v.path));
for(const p of [F,'mob-3d-r1343.js','assets/r1343/leviathan.glb','assets/r1343/jealousy-wraith.glb','assets/r1343/glass-wraith.glb','assets/r1343/shard-fly8.webp','assets/r1343/burst12.webp','assets/r1343/embed8.webp'])ok(mp.has(p),'runtime-manifest 에 '+p);
// ── 시트 크기(웹p 머리 VP8X/VP8L 에서 읽기) ──
function webpSize(f){const b=fs.readFileSync(f);const t=b.toString('ascii',12,16);if(t==='VP8X')return [1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];if(t==='VP8L'){const v=b.readUInt32LE(21);return [1+(v&0x3fff),1+((v>>14)&0x3fff)];}return [b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];}
for(const [n,w,h] of [['shard-fly8',1024,128],['burst12',2304,768],['embed8',1280,160]]){const f=path.join(R,'runtime-text','assets','r1343',n+'.webp');ok(fs.existsSync(f)&&String(webpSize(f))===String([w,h]),n+' 시트 '+w+'×'+h);}
// ── 금지: 바닥 예고·도형 ──
const code=src.split('\n').filter(l=>!/^\s*\/\//.test(l)).join('\n');
ok(!/groundAligned:\s*true|telegraph|warnRing|floorMark/i.test(code),'바닥 예고 없음');
ok(!/\.(arc|lineTo|fillRect|strokeRect|ellipse)\(/.test(code.replace(/c\[m\]|saved\[m\]/g,'')),'도형 그리기 호출 없음');
// ── 가짜 방 ──
function makeWorld(){
 const W=24,H=18;const isWall=(x,y)=>x<1||y<1||x>W-1||y>H-1||(x>15&&x<16&&y>4&&y<13);/* 바깥 벽 + 안쪽 기둥 벽 */
 const calls={hurt:[],draw:{}};const ctx={commands:0,save(){},restore(){},translate(){},rotate(){},scale(){},globalAlpha:1,
  drawImage(im){calls.draw[im.src]=(calls.draw[im.src]||0)+1;},arc(){calls.shape=(calls.shape||0)+1;},lineTo(){},fill(){},stroke(){},fillRect(){},strokeRect(){},ellipse(){},rect(){}};
 const sb={console,performance:{now:()=>0},localStorage:{getItem:()=>null,setItem(){}},
  started:true,loading:false,modal:null,storyScene:null,time:0,TILE:32,zoom:1,ctx,effects:[],calls};
 sb.window=sb;sb.room={id:'ep1b03',enemies:[{id:'ep1b03:b03-boss',nativeId:'b03-boss',name:'호텔 부매니저 · 레비아탄',boss:true,hp:100,spawnState:'active',x:8,y:9,damage:50}]};
 sb.player={x:10.5,y:9,hp:1e9};
 sb.blocked=(x,y,r)=>isWall(x-r,y)||isWall(x+r,y)||isWall(x,y-r)||isWall(x,y+r);
 sb.hurt=(d,o)=>{calls.hurt.push(d);return 'hit';};
 sb.project=(x,y)=>({x:x*32,y:y*16});sb.actorHeight=()=>60;
 const imgs={};sb.addImage=p=>{imgs[p]={image:{src:p,naturalWidth:1024,naturalHeight:128}};};sb.readyImage=p=>imgs[p]||null;
 sb.tick=function(){};sb.drawEffect=function(){};
 vm.createContext(sb);vm.runInContext(src,sb);return sb;}
const sb=makeWorld(),A=sb.window.__STORYWORLD_ENVY_GLASS_R1343__;
ok(!!A,'오버레이 등록');
const run=(sec,dt=1/60)=>{for(let t=0;t<sec;t+=dt){sb.time+=dt;sb.tick();if(sb.effects.length)for(const fx of sb.effects)sb.drawEffect(fx);}};
// 자연 시전: 13칸 안, 처음 3초 뒤
run(2.5);ok(A.inspect().casts===0,'처음 3초 전엔 시전 안 함');
run(1.2);const s1=A.inspect();ok(s1.casts===1&&s1.casting,'3초 뒤 스스로 시전');
const bx=sb.room.enemies[0].x;run(.5);ok(sb.room.enemies[0].x===bx,'시전 중 보스 멈춤');ok(sb.room.enemies[0].r1343Cast===true,'시전 중 e.r1343Cast(3D cast 클립)');
run(4);const s2=A.inspect();
ok(s2.fired===42,'조각 3파 × 14 = 42 ('+s2.fired+')');
ok(s2.octants===8,'8방위 모두 ('+s2.octants+')');
ok(s2.stuck>=30,'벽에 박힌 조각 ≥30 ('+s2.stuck+')');
const L=A.stuckList();let near=0,inside=0;for(const q of L){if(sb.blocked(q.x+Math.cos(q.a)*.5,q.y+Math.sin(q.a)*.5,.08))near++;if(!sb.blocked(q.x,q.y,.08))inside++;}
ok(near===L.length,'박힌 조각 모두 벽 곁 '+near+'/'+L.length);ok(inside===L.length,'박힌 자리는 벽 속이 아님 '+inside+'/'+L.length);
ok(L.every(q=>q.h>=.35&&q.h<=2.1),'박힌 높이 0.35~2.1칸');
ok(L.some(q=>q.x>14&&q.x<16),'안쪽 기둥 벽에도 박힘');
const dealt=sb.calls.hurt.reduce((a,b)=>a+b,0);ok(dealt>0&&dealt<=50*1.4+1e-9,'피해 합 0 초과 ≤ 1.4대 ('+dealt+')');
ok(sb.calls.hurt.every(d=>Math.abs(d-50*.14)<1e-9),'조각 하나 피해 = 근접 × .14');
ok(!s2.casting,'시전 끝남');ok(sb.room.enemies[0].r1343Cast===false,'시전 끝나면 r1343Cast 꺼짐');
const dr=A.inspect().drawn;ok(dr.fly>0&&dr.burst>0&&dr.embed>0,'시트 3종 모두 그림 '+JSON.stringify(dr));
ok(!sb.calls.shape&&A.inspect().otherDraw===0,'도형 그리기 0');
ok(Object.keys(sb.calls.draw).every(k=>/^assets\/r1343\//.test(k)),'그림은 r1343 시트만 '+Object.keys(sb.calls.draw).join(','));
// 남아 있음·상한·보스 사망 뒤
const n0=A.inspect().stuck;sb.player.x=30;run(5);ok(A.inspect().stuck===n0,'시전 뒤에도 그대로 남음');
sb.player.x=10.5;for(let k=0;k<8;k++){run(11.5);}ok(A.inspect().stuck<=260,'상한 260 ('+A.inspect().stuck+')');
ok(A.inspect().casts>=6,'11초마다 다시 시전 ('+A.inspect().casts+')');
sb.room.enemies[0].hp=0;const n1=A.inspect().stuck;run(3);ok(A.inspect().stuck===n1&&n1>0,'보스가 죽어도 박힌 조각 남음');
// 다른 방
sb.room={id:'ep1b02',enemies:[]};run(.2);ok(A.inspect().stuck===0,'다른 지역으로 가면 비움');
// 끄기
const sb2=makeWorld(),A2=sb2.window.__STORYWORLD_ENVY_GLASS_R1343__;A2.set({on:false});for(let t=0;t<6;t+=1/60){sb2.time+=1/60;sb2.tick();}ok(A2.inspect().casts===0,'끄면 시전 안 함');
// 다른 보스는 아님
const sb3=makeWorld();sb3.room.enemies[0].nativeId='b04-boss';sb3.room.enemies[0].name='탐식의 귀 · 베엘제붑';for(let t=0;t<6;t+=1/60){sb3.time+=1/60;sb3.tick();}ok(sb3.window.__STORYWORLD_ENVY_GLASS_R1343__.inspect().casts===0,'다른 보스(탐식)는 안 씀');
// 가구(소품)는 지나가고 벽에만 박힘: 탐사 레이아웃 벽 판정이 있으면 그것만 본다
const sb4=makeWorld();const wallOnly=sb4.blocked;sb4.StoryPhase1={explorationBlocked:(L,x,y,r)=>wallOnly(x,y,r)};sb4.room.exploration={};
sb4.blocked=(x,y,r)=>wallOnly(x,y,r)||Math.hypot(x-8,y-5)<1.2+r;/* 보스 위쪽 가구 */
const A4=sb4.window.__STORYWORLD_ENVY_GLASS_R1343__;for(let t=0;t<8;t+=1/60){sb4.time+=1/60;sb4.tick();}
const L4=A4.stuckList();ok(L4.length>=30&&!L4.some(q=>Math.hypot(q.x-8,q.y-5)<1.6),'가구는 지나가고 벽에만 박힘 ('+L4.length+')');
ok(!A.inspect().lastError,'오류 0 '+(A.inspect().lastError||''));
// ── 3D(mob-3d-r1343): Dots 원본 바이트·클립·연결 ──
const crypto=require('crypto');
const M3='mob-3d-r1343.js',m3=fs.readFileSync(path.join(R,'client-source',M3),'utf8');
ok(fs.existsSync(path.join(R,'runtime-text',M3))&&fs.readFileSync(path.join(R,'runtime-text',M3),'utf8')===m3,'mob-3d-r1343 runtime-text 사본 같음');
ok((html.match(/<script src="\.\/mob-3d-r1343\.js"><\/script>/g)||[]).length===1&&html.indexOf('mob-3d-r1343.js')>html.indexOf('mob-3d-r1316.js'),'mob-3d-r1343 태그 한 번, R1316 뒤');
ok(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'mob-3d-r1343.js'"),'mob-3d-r1343 verify 목록');
const glbClips=f=>{const b=fs.readFileSync(f),n=b.readUInt32LE(12),j=JSON.parse(b.slice(20,20+n).toString('utf8'));return (j.animations||[]).map(a=>a.name);};
for(const [f,h,extra] of [['leviathan.glb','b2908c3def47eb1019a5eb9377c4525810f5c92ad37f4b08ccbdb835b6416b32',['cast']],['jealousy-wraith.glb','8e986215f752cead886b22e5edc1fadc54061004169a6a3796e1eaefe1810a7c',[]],['glass-wraith.glb','57fce6ea8b6e30dedf4b4ab69a3eabb2c42de9d907911c29a060a8c5fb452f41',[]]]){
 const p=path.join(R,'runtime-text','assets','r1343',f),b=fs.existsSync(p)&&fs.readFileSync(p);
 ok(b&&crypto.createHash('sha256').update(b).digest('hex')===h,f+' = Dots 원본 바이트');
 const c=b?glbClips(p):[];ok(['idle','walk','attack','hit','death',...extra].every(n=>c.includes(n)),f+' 클립 '+c.join(','));
 ok(m3.includes("'assets/r1343/"+f+"'"),'오버레이가 '+f+' 를 씀');}
ok(/'호텔 부매니저 · 레비아탄',true\]/.test(m3),'레비아탄 = 보스 표시');
ok(/'질투로 얼룩진 망령'\]/.test(m3)&&/'유리 망령'\]/.test(m3),'두 망령 이름 표');
ok(/e\?\.r1343Cast&&i\.actions\.cast\)return 'cast'/.test(m3),'시전 중 cast 클립');
ok(/userData\.r1055Skip=true;o\.userData\.r451=true/.test(m3),'R1055 수묵·R451 국소광 제외');
ok(/__STORYWORLD_FACE_R1331__\?\.decorate/.test(m3),'사람형 보스 얼굴 데칼 호출');
ok(/__STORYWORLD_MOB3D_R1343__\?\.takes\?\.\(e\)/.test(fs.readFileSync(path.join(R,'client-source','mob-3d-r1316.js'),'utf8')),'R1316 은 R1343 이 맡은 망령을 건너뜀');
ok(!/boss3dR1330(Row|Toggle)/.test(m3)&&/envy3dR1343Row/.test(m3)&&/envy3dR1343Toggle/.test(m3),'설정 줄·체크박스 id 가 R1330 과 겹치지 않음');
ok(/GROUP43=\/\^r1343-mob3d:\//.test(fs.readFileSync(path.join(R,'client-source','mob-3d-style-r1325.js'),'utf8'))&&/GROUP43\.test/.test(fs.readFileSync(path.join(R,'client-source','mob-3d-style-r1325.js'),'utf8')),'R1325 색 맞춤 대상에 r1343 포함');
console.log(fail?'R1343 cpu FAIL '+fail:'R1343 cpu ALL OK');process.exit(fail?1:0);
