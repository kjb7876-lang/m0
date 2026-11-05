// R351 CPU 검사: 슬레이어 새 이동(왼쪽 걷기 v5)·공격(v22) — 좌·우만, 위·아래는 가로 성분/마지막 좌·우, 미리 받기·선 자세 대신 그리기.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const R=path.join(__dirname,'..','..');
const src=fs.readFileSync(path.join(R,'client-source','slayer-r351.js'),'utf8');
let ok=0,bad=0;const t=(c,m)=>{if(c){ok++;console.log('ok  ',m);}else{bad++;console.log('FAIL',m);}};
const A=path.join(R,'runtime-text','assets','r351','slayer');
const IDX=JSON.parse(fs.readFileSync(path.join(A,'index.json'),'utf8'));
// 자산
t(IDX.revision==='R351-slayer-1'&&IDX.facing_in_source==='w','index.json 판·원천 방향(왼쪽)');
t(Object.keys(IDX.anims).sort().join()==='attack,walk'&&!IDX.anims.walk.n&&IDX.anims.walk.w&&IDX.anims.attack.w&&!IDX.anims.walk.n_&&!IDX.anims.walk.s&&!IDX.anims.walk.e,'클립은 walk·attack 의 W 한 방향뿐(위·아래 그림 없음)');
for(const k of['walk','attack']){const c=IDX.anims[k].w,b=fs.readFileSync(path.join(A,c.file));
 t(crypto.createHash('sha256').update(b).digest('hex')===c.sha256&&b.length===c.bytes,`${k}: 파일 sha256·크기 일치`);
 t(b.slice(0,4).toString()==='RIFF'&&b.slice(8,12).toString()==='WEBP'&&b.slice(12,16).toString()==='VP8L',`${k}: WebP 무손실(VP8L)`);
 t(Math.abs(c.body-180)<=2,`${k}: 몸 키 180±2 (${c.body})`);
 t(c.measured.foot_jitter_px<=1.5,`${k}: 발 접지선 흔들림 ≤1.5px (${c.measured.foot_jitter_px})`);
 t(c.atlas[0]===c.cell[0]*c.n&&c.atlas[1]===c.cell[1]&&c.anchor[1]<c.cell[1]&&c.anchor[0]>0&&c.anchor[0]<c.cell[0],`${k}: 아틀라스·발 기준점 범위`);}
t(IDX.anims.walk.w.n===8&&IDX.anims.walk.w.ms.every(m=>m===150)&&IDX.anims.walk.w.loop===true,'걷기 8칸 150ms 반복');
t(IDX.anims.attack.w.n===6&&IDX.anims.attack.w.ms.join()==='170,140,110,80,150,300'&&IDX.anims.attack.w.contact===3,'공격 6칸 170/140/110/80/150/300ms, 접촉 4번째 칸');
t(IDX.anims.walk.w.idle_frame===6&&IDX.anims.walk.w.stride.px_per_frame>5,'대기 = 걷기 7번째 칸, 보폭 있음');
{const f=IDX.color.frames,tg=IDX.color.target;const d=k=>Math.abs(f[k].after.p98-tg.p98);t(Math.abs(f['attack-5'].before.p98-tg.p98)>.05&&d('attack-5')<.01,'공격 5칸 하이라이트(p98)를 다른 칸 평균에 맞춤');
 t(Object.values(f).every(v=>Math.abs(v.after.p50-tg.p50)<.01&&Math.abs(v.after.sat-tg.sat)<.01),'모든 칸 밝기 중앙값·채도가 목표와 1% 안');}
t(IDX.source.length===2&&IDX.source.every(s=>/^[0-9a-f]{64}$/.test(s.sha256)&&s.bytes>0&&s.purpose&&s.applied===true),'원천 표: 이름·sha256·크기·용도·적용');
t(IDX.source.some(s=>s.file==='Slayer_attack_v22_straight_sword.zip'&&s.sha256.startsWith('d3dcaaa6'))&&IDX.source.some(s=>s.file==='Slayer_left-v5_candidate.zip'&&s.sha256.startsWith('2cde0f5d')),'원천 zip 이름·sha256(요청서와 같음)');
{const all=fs.readFileSync(path.join(A,'index.json'),'utf8')+src+fs.readFileSync(path.join(R,'..','scripts','r351-slayer-build.py'),'utf8');t(!/drive\.google|docs\.google|\b1[A-Za-z0-9_-]{32}\b/.test(all),'Drive 링크·파일 ID 없음(공개 저장소)');}
// 동작 모의
const loaded=new Set();const img=p=>({src:p,naturalWidth:1000,naturalHeight:200});
const ctx={window:{},localStorage:{getItem:()=>null,setItem(){}},console,time:0,Date,Promise,JSON,Math,
 fetch:()=>Promise.resolve({ok:true,json:()=>Promise.resolve(IDX)}),readyImage:p=>loaded.has(p)?{image:img(p)}:null,asked:[],
 project:(x,y)=>({x:(x-y)*40,y:(x+y)*20}),actorHeight:()=>66,player:{hero:'slayer',hp:10,x:5,y:5,attackAnim:0,hurtAnim:0,attackCD:.69,direction:'front'},room:{enemies:[]}};
ctx.ensureImages=ps=>{for(const p of ps)ctx.asked.push(p);return Promise.resolve();};
let rec;ctx.drawHero=function(){rec.commands.push({kind:'image',owner:{kind:'hero'},sourcePath:'assets/hero-authored-v314rc64/slayer-side-left.webp',image:{src:'old'},points:[[0,0],[10,0],[10,40],[0,40]]});};
vm.createContext(ctx);vm.runInContext(src,ctx);
const S=ctx.window.__STORYWORLD_SLAYER_R351__;
t(S&&S.revision==='R351-slayer-1','API 노출');
(async()=>{await new Promise(r=>setTimeout(r,10));
 t(S.index()===IDX||!!S.index(),'index.json 읽음');
 t(['assets/r351/slayer/walk-w.webp','assets/r351/slayer/attack-w.webp'].every(p=>ctx.asked.includes(p)),'index 읽자마자 걷기·공격 그림 둘 다 미리 받기');
 const frame=(dt)=>{ctx.time+=dt;rec={commands:[]};ctx.ctx=rec;ctx.drawHero();return rec.commands[0];};
 // 그림이 아직 없으면 손대지 않음(엔진 그림 그대로)
 let c=frame(.016);t(c.image.src==='old','그림을 아직 하나도 안 받았으면 손대지 않음');
 loaded.add('assets/r351/slayer/walk-w.webp');
 // 걷기 왼쪽
 const mirrored=c=>c.points[1][0]<c.points[0][0];
 for(let i=0;i<10;i++){ctx.player.x-=.05;ctx.player.y+=.05;c=frame(.05);}
 t(c.sourcePath==='assets/r351/slayer/walk-w.webp'&&c.r351==='walk'&&!mirrored(c),'왼쪽 이동 → 새 걷기(원천 그대로)');
 const f0=c.sourceRect[0];for(let i=0;i<6;i++){ctx.player.x-=.05;ctx.player.y+=.05;c=frame(.05);}t(c.sourceRect[0]!==f0,'움직인 거리만큼 걷기 칸이 넘어감');
 for(let i=0;i<10;i++){ctx.player.x+=.05;ctx.player.y-=.05;c=frame(.05);}
 t(c.r351==='walk'&&mirrored(c),'오른쪽 이동 → 걷기 좌우 뒤집기');
 // 위로(화면 세로) 이동: x,y 함께 감소 → 화면 x 변화 0
 for(let i=0;i<10;i++){ctx.player.x-=.05;ctx.player.y-=.05;c=frame(.05);}
 t(c.r351==='walk'&&mirrored(c),'위로 이동 → 마지막 좌·우(오른쪽) 걷기 그대로(위 그림 없음)');
 for(let i=0;i<10;i++){ctx.player.x+=.05;ctx.player.y+=.05;c=frame(.05);}
 t(c.r351==='walk'&&mirrored(c),'아래로 이동 → 마지막 좌·우 걷기');
 // 대기
 c=frame(.5);c=frame(.05);const W=IDX.anims.walk.w;
 t(c.r351==='idle'&&c.sourceRect[0]===W.idle_frame*W.cell[0]&&mirrored(c),'멈추면 걷기 7번째 칸(선 자세), 마지막 좌·우');
 // 발 기준점: 기준점이 영웅 발 위치(project)에 놓임
 {const q=ctx.project(ctx.player.x,ctx.player.y),k=66*.98/W.body,xa=c.points[0][0]+(-1)*(W.anchor[0])*k*(-1);const ya=c.points[0][1]+W.anchor[1]*k;t(Math.abs(ya-q.y)<.01&&Math.abs(c.points[0][0]-(q.x+W.anchor[0]*k))<.01,'발 기준점이 영웅 발 화면 위치에 놓임');}
 // 공격 그림 아직 없음 → 받아 둔 걷기 선 자세로 대신
 ctx.room.enemies=[{hp:5,x:ctx.player.x-1,y:ctx.player.y+1}];
 ctx.player.attackAnim=1;c=frame(.016);
 t(c.sourcePath==='assets/r351/slayer/walk-w.webp'&&c.r351==='idle'&&S.inspect().stats.standIn>0,'공격 그림을 아직 못 받았으면 걷기 선 자세로 대신(옛 그림 번쩍임 없음)');
 loaded.add('assets/r351/slayer/attack-w.webp');ctx.player.attackAnim=0;c=frame(1);
 // 왼쪽 적 공격
 ctx.player.attackAnim=1;c=frame(.001);const AT=IDX.anims.attack.w;
 t(c.sourcePath==='assets/r351/slayer/attack-w.webp'&&!mirrored(c),'왼쪽 적 → 새 공격(원천 그대로)');
 const fr0=c.sourceRect[0]/AT.cell[0];t(fr0<=AT.contact&&fr0>=AT.contact-1,'누르는 순간 접촉 칸 바로 앞(판정 순간에 맞춤)');
 let reached=false;for(let i=0;i<8;i++){c=frame(.016);if(c.sourceRect[0]/AT.cell[0]===AT.contact)reached=true;}t(reached,'0.13초 안에 접촉 칸(4번째)을 보임');
 for(let i=0;i<60;i++)c=frame(.05);ctx.player.attackAnim=0;c=frame(.05);t(c.r351==='idle','공격 끝나면 선 자세로');
 // 오른쪽 적
 ctx.room.enemies=[{hp:5,x:ctx.player.x+1,y:ctx.player.y-1}];ctx.player.attackAnim=1;c=frame(.001);t(c.r351==='attack'&&mirrored(c),'오른쪽 적 → 공격 뒤집기');ctx.player.attackAnim=0;for(let i=0;i<40;i++)c=frame(.05);
 // 위쪽 적(화면 x 차이 0) → 마지막 좌·우(오른쪽)
 ctx.room.enemies=[{hp:5,x:ctx.player.x-1,y:ctx.player.y-1}];ctx.player.attackAnim=1;c=frame(.001);t(c.r351==='attack'&&mirrored(c),'위쪽 적 → 좌·우 공격(마지막 좌·우)');ctx.player.attackAnim=0;for(let i=0;i<40;i++)c=frame(.05);
 // 아래쪽이지만 조금 왼쪽 → 왼쪽
 ctx.room.enemies=[{hp:5,x:ctx.player.x+1,y:ctx.player.y+1.3}];ctx.player.attackAnim=1;c=frame(.001);t(c.r351==='attack'&&!mirrored(c),'아래-왼쪽 적 → 왼쪽 공격(가로 성분)');ctx.player.attackAnim=0;for(let i=0;i<40;i++)c=frame(.05);
 // 엔진 방향(player.direction)이 좌·우면 그것을 따름(가까운 적보다 우선)
 ctx.room.enemies=[{hp:5,x:ctx.player.x-1,y:ctx.player.y+1}];ctx.player.direction='right';ctx.player.attackAnim=1;c=frame(.001);t(c.r351==='attack'&&mirrored(c),'엔진 방향 right → 오른쪽 공격');ctx.player.attackAnim=0;ctx.player.direction='front';for(let i=0;i<40;i++)c=frame(.05);
 // 기술
 ctx.player.skillAnim=1;c=frame(.05);t(c.r351==='attack','기술 중 → 새 공격 접촉 칸');ctx.player.skillAnim=0;
 // 다른 영웅은 손대지 않음
 ctx.player.hero='hwando';c=frame(.05);t(c.image.src==='old','다른 영웅은 손대지 않음');ctx.player.hero='slayer';
 ctx.player.hp=0;c=frame(.05);t(c.image.src==='old','죽음(hp 0)은 엔진 그림 그대로');ctx.player.hp=10;
 S.set(false);c=frame(.05);t(c.image.src==='old','끄기 → 옛 그림');S.set(true);
 t(S.inspect().stats.errors===0,'오류 0');
 for(const d of['client-source','runtime-text'])t(fs.readFileSync(path.join(R,d,'slayer-r351.js'),'utf8')===src,`${d} 사본 일치`);
 const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
 t(/terrain-readability-r323\.js"><\/script>(?:<script src="\.\/[a-z0-9-]+\.js"><\/script>)*<script src="\.\/slayer-r351\.js"><\/script>(?:<script src="\.\/[a-z0-9-]+\.js"><\/script>)*\s*<script src="\.\/combat-r118\.js">/.test(html)&&html.split('"./slayer-r351.js"').length===2&&html.indexOf('"./hwando-r283.js"')<html.indexOf('"./slayer-r351.js"'),'index.html 스크립트 태그 한 번(terrain-r323 뒤 오버레이 묶음 안, combat-r118 앞 → 가장 바깥 drawHero 감싸기)');
 const man=JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8')),inp=JSON.parse(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8'));
 for(const p of['slayer-r351.js','assets/r351/slayer/walk-w.webp','assets/r351/slayer/attack-w.webp','assets/r351/slayer/index.json'])t(man.files.some(r=>r.path===p)&&inp.textPaths.includes(p),`manifest·inputs 에 ${p}`);
 t(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'slayer-r351.js'"),'verify-r96-public.py 기대 목록');
 t(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r351/slayer-cpu-check.cjs'),'pages.yml 검사 줄');
 console.log(`R351 ${ok}/${ok+bad}`);process.exit(bad?1:0);})().catch(e=>{console.log('FAIL',e);process.exit(1);});
