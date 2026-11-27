// R1358 CPU 검사 — 모든 보스 고유 특수 스킬 + 보스 낙인(초당 최대 체력 6%·방어 무시·상태이상·공명 D 로 해제) — boss-unique-r1358.js
//  사용자 2026-11-27 05:00Z·05:02Z. 경계값: 체력 낮을 때(1 아래로 안 떨어짐), 중첩(겹치지 않고 시간만 새로), 공명 해제 즉시 중단, 패링·무적, 멈춤, 맘몬 제외.
const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..'),F='boss-unique-r1358.js',F0='boss-identity-r1346.js';let n=0;
const ok=(c,m,d)=>{if(!c)console.log('FAIL '+m,d===undefined?'':JSON.stringify(d).slice(0,500));assert(c,m);n++;};
const read=p=>fs.readFileSync(path.join(R,p),'utf8');
const srcPath=path.join(R,'client-source',F);ok(fs.existsSync(srcPath),'오버레이 파일 있음');
const src=fs.readFileSync(srcPath,'utf8'),src0=read('client-source/'+F0);
ok(src===read('runtime-text/'+F),'runtime-text 사본 같음');
// ---- 빌드 연결 ----
const html=read('runtime-text/index.html'),tag=s=>html.indexOf('<script src="./'+s+'"></script>');
ok(tag(F)>tag(F0)&&tag(F0)>0&&new RegExp('\\n<script src="\\./'+F.replace(/\./g,'\\.')+'"></script>\\n').test(html),'index.html: 자기 줄, R1346 뒤');
ok(fs.readFileSync(path.join(ROOT,'scripts/verify-r96-public.py'),'utf8').includes("'"+F+"'"),'verify-r96-public 기대 목록');
ok(fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r1358/r1358-cpu-check.cjs'),'pages.yml CPU 검사 줄');
ok(read('runtime-manifest.json').includes('"'+F+'"'),'runtime-manifest 에 들어감');
ok(!/drop-shadow|blur\(/.test(src),'ctx.filter drop-shadow·blur 안 씀');
// ---- 샌드박스(엔진 hurt 흉내: 무적·패링·방어 계수·보호막) ----
const SH=['arc','ellipse','fillRect','strokeRect','lineTo','stroke','fill','rect','quadraticCurveTo','bezierCurveTo'];
function sandbox(o={}){
 const calls={hurt:[],imgs:[],filters:[],shapes:0,scopes:[],marks:[],toasts:[]};
 const ctx=new Proxy({},{get:(ob,k)=>k in ob?ob[k]:(typeof k==='string'&&!['globalAlpha','filter'].includes(k)?((...a)=>{if(SH.includes(k))calls.shapes++;if(k==='drawImage'){calls.imgs.push(a[0]&&a[0].src);calls.filters.push([a[0]&&a[0].src,ob.filter||'none',a[7]]);}}):undefined),set:(ob,k,v)=>{ob[k]=v;return true;}});
 ctx.scope=(q,fn)=>{calls.scopes.push(q);fn();};
 const player={x:10,y:10,hp:1000,invincible:0,guard:false,parry:0,shield:0};
 const sb={window:{},localStorage:{store:{...(o.store||{})},getItem(k){return this.store[k]??null;},setItem(k,v){this.store[k]=v;}},time:0,started:true,loading:false,modal:false,storyScene:null,player,ctx,room:{id:o.room||'dist00',enemies:[]},effects:[],
  project:(x,y)=>({x:(x-y)*22+480,y:(x+y)*11+270}),readyImage:p=>({image:{src:p}}),ensureImages:()=>Promise.resolve(),blocked:(x,y,r=.27)=>x-r<1||y-r<1||x+r>39||y+r>39,
  maxHP:()=>1000,floatText(){},toast:(t)=>calls.toasts.push(t),
  hurt(d,s){calls.hurt.push([d,s&&(s.r1346||s.kind)]);if(player.hp<=0)return'ignored';if(player.invincible>0)return'invulnerable';if(player.guard&&player.parry>0)return'parried';let a=d*.4;if(player.shield>0){const b=Math.min(a,player.shield);player.shield-=b;a-=b;}if(a>0)player.hp-=a;player.invincible=.3;return a>0?'hit':'blocked';},
  drawEffect(){},tick(dt){if(player.invincible>0)player.invincible=Math.max(0,player.invincible-dt);},settings:{},Math,JSON,String,Object,Number,Array,Set,Map,WeakMap,WeakSet,Promise,RegExp,console};
 sb.window.window=sb.window;sb.window.__STORYWORLD_DOTS_STATUS_R1153__={mark:(a,k,s)=>{calls.marks.push([k,s]);return true;}};
 vm.createContext(sb);vm.runInContext(src0,sb);vm.runInContext(src,sb);return {sb,calls,player,A:sb.window.__STORYWORLD_BOSS_IDENTITY_R1346__,U:sb.window.__STORYWORLD_BOSS_UNIQUE_R1358__};}
const E=id=>({id:'E-'+id,nativeId:id,boss:!/^mb-|-mid$|elite/.test(id),midboss:/^mb-|-mid$|elite/.test(id),hp:1000,maxHp:1000,damage:20,spawnState:'active',x:13,y:12});
const run=(S,secs,dt=1/30)=>{for(let i=0;i<Math.round(secs/dt);i++){S.sb.time+=dt;S.sb.tick(dt);const m=S.sb.effects.find(x=>x&&x.type==='r1346-fx');if(m)S.sb.drawEffect(m);}};
const S0=sandbox(),A=S0.A,U=S0.U;
ok(!!U&&typeof U.afflict==='function'&&typeof U.inspect==='function'&&typeof U.useDots==='function','API window.__STORYWORLD_BOSS_UNIQUE_R1358__');
// ---- ① 고유 특수 스킬: 모든 보스(맘몬·다른 스레드 몫 제외) ----
const MID=['mb-dist01','mb-dist02','mb-dist03','mb-dist04','mb-dist05','mb-dist06','mb-ep1a08','mb-ep1a08s','mb-ep1a09','mb-ep1a10','mb-ep1a11','mb-ep1b02','mb-ep1b05','mb-ep1b07','mb-ep1b08','mb-ep1b09',
 'u201-mid','u202-mid','u203-mid','u204-mid','u205-mid','u206-mid','mb-hando01','mb-hando02','mb-hando03','mb-murder01','mb-murder02','mb-murder03','murder04-mid','c101-mid','c103-mid','c104-mid','c105-mid','c106-mid'];
const ELITE=Array.from({length:12},(_,i)=>'kair-elite-'+(49+i));
const MAIN16=['dist00-boss','u203-boss','l301-boss','l303-boss','l305-boss','kair-great-01','kair-great-02','kair-great-03','kair-great-04','kair-great-05','kair-great-06','k103-boss','h103-boss','c102-boss','c103-boss','c104-boss'];
const ALL=[...MAIN16,...MID,...ELITE];
ok(MID.length===34&&ELITE.length===12,'대상 수: 중간보스 34(집도의 포함)·상위수문장 12');
{const seen=new Map(),reqs=new Set();for(const id of ALL){const s=A.spec(E(id));ok(s&&s.sig&&A.archetypes.includes(s.sig.shape)&&A.sheetOf(s.sig.sheet),'고유 특수 스킬 있음: '+id,s&&s.sig);
  const k=s.sig.shape+':'+s.sig.sheet;ok(!seen.has(k),'모양+그림 조합이 보스마다 다름: '+id,[k,seen.get(k)]);seen.set(k,id);}
 for(const id of [...MID,...ELITE]){const r=U.table()[id][3];ok(/^SW-R1358-\d\d$/.test(r)&&!reqs.has(r),'Dots 요청 번호 하나씩: '+id,r);reqs.add(r);}
 for(const id of MAIN16){const r=U.mainDots[id];ok(/^SW-R1358-\d\d$/.test(r)&&!reqs.has(r),'본보스 Dots 요청 번호: '+id,r);reqs.add(r);}ok(reqs.size===62,'Dots 요청 62장',reqs.size);}
for(const id of ['b06-boss','b06b-boss','mb-ep1b06','mb-ep1b06b'])ok(A.spec(E(id))===null,'맘몬 지역은 손대지 않음: '+id);
for(const id of ['b03-boss','b04-boss','mb-ep1b03','mb-ep1b04'])ok(!A.spec(E(id))||!A.spec(E(id)).sig,'질투·탐식은 다른 스레드 몫: '+id);
ok(!A.spec(E('mb-ep1b01')).sig,'제72문(R1241 72 그림자)은 새 스킬을 덧붙이지 않음');
for(const id of ['mb-dist01','mb-ep1b08','u205-mid','kair-elite-53','kair-elite-60','c106-mid']){const S=sandbox(),b=E(id);S.sb.room.enemies.push(b);run(S,A.tune.first+A.tune.cd+4);const ins=S.A.inspect();
 ok(ins.casts>=1&&S.calls.hurt.some(h=>h[1]===id),id+': 고유 스킬 시전·적중',ins);ok(S.calls.shapes===0,id+': 코드 도형 0',S.calls.shapes);
 ok(S.calls.imgs.includes(A.sheetOf(A.spec(b).sig.sheet).path),id+': 자기 시트 그림');ok(S.calls.scopes.every(q=>q.groundAligned===false&&q.enemy===true),id+': 바닥 예고 없음');}
{const S=sandbox();for(const sh of ['orbit','zigzag']){ok(S.A.archetypes.includes(sh),'새 모양: '+sh);}}
// Dots 정식 시트 끼우기: 그 보스만 바뀜
{const S=sandbox();const v={path:'assets/r1358/test.webp',cell:256,n:24,fps:16};ok(S.U.useDots('mb-ep1a10',v)===true&&S.A.spec(E('mb-ep1a10')).sig.sheet==='r1358-mb-ep1a10'&&S.A.spec(E('mb-ep1a10')).sig.shape==='expand','Dots 시트 끼우면 그 보스만 정식 그림(모양 그대로)');ok(S.U.useDots('mb-dist02',v)===false,'이미 정식 시트가 있으면 덮지 않음');
 ok(S.A.sheetOf('r1358-mb-ep1a10').cols===24,'가로 한 줄 시트(cols=n)');ok(S.U.useDots('b06b-boss',v)===false,'맘몬은 Dots 끼우기도 안 함');}


// 게임 안 이름표 겹침(실측 11-27): 같은 nativeId 다른 이름 → 따로 나눔
{const n=(id,name)=>({...E(id),name});
 ok(A.spec(n('mb-ep1a10','중독을 부르는 주사기 환영체')).id==='mb-ep1a09'&&A.spec(n('mb-ep1a10','오만의 폐허핵')).id==='mb-ep1a10','주사기 환영체(ep1a09)와 오만의 폐허핵이 서로 다른 스킬');
 ok(A.spec(n('mb-ep1a08','병원 심부의 집도의')).id==='mb-ep1a08s'&&A.spec(n('mb-ep1a08','백의 안정화 감독')).id==='mb-ep1a08','집도의와 안정화 감독이 서로 다른 스킬');}
// ---- Dots 정식 시트(SW-R1352 D10 → R1358, 11-27 05:20Z): 받은 3장은 그 보스 그림으로 ----
{const want={'mb-dist01':'assets/r1358/mb-dist01-violet-sword-cleave.webp','c106-mid':'assets/r1358/c106-mid-judgment-core-claw.webp','mb-ep1a09':'assets/r1358/mb-ep1a09-syringe-wisp.webp'};
 const man=read('runtime-manifest.json');const D=U.dots();
 for(const [id,p] of Object.entries(want)){ok(D[id]&&D[id].path===p&&D[id].n===24&&D[id].cell===256&&D[id].scale>=1.5,'Dots 시트 표: '+id,D[id]);
  ok(fs.existsSync(path.join(R,'runtime-text',p))&&man.includes(p),'Dots 시트 파일·manifest: '+p);
  const b=fs.readFileSync(path.join(R,'runtime-text',p)),fmt=b.slice(12,16).toString();let w=0,h=0;if(fmt==='VP8X'){w=1+b.readUIntLE(24,3);h=1+b.readUIntLE(27,3);}else if(fmt==='VP8L'){const v=b.readUInt32LE(21);w=1+(v&0x3fff);h=1+((v>>14)&0x3fff);}ok(w===6144&&h===256,'가로 24칸 6144×256: '+p,[w,h]);
  const s=A.spec(E(id)).sig;ok(s.sheet==='r1358-'+id&&s.dots===true&&A.sheetOf(s.sheet).path===p,'그 보스 고유 스킬이 정식 시트를 씀: '+id,s);}
 const S=sandbox(),b=E('c106-mid');S.sb.room.enemies.push(b);run(S,A.tune.first+A.tune.cd+4);ok(S.calls.imgs.includes(want['c106-mid'])&&S.calls.shapes===0,'정식 시트로 그려짐(c106-mid)');}
// ---- Dots 정식 시트 SW-R1358-01~12(11-27 06:18Z): 본보스 12명 — 모양·이름은 R1346 그대로, 그림만 정식, 바닥 접점 y≈200 ----
{const want={'dist00-boss':'dist00-boss-black-root-thrust','u203-boss':'u203-boss-memory-erasure','l301-boss':'l301-boss-six-form-blades','l303-boss':'l303-boss-sleepless-eye',
  'l305-boss':'l305-boss-earth-quake','kair-great-01':'kair-great-01-time-bone-spikes','kair-great-02':'kair-great-02-split-wall','kair-great-03':'kair-great-03-suspended-clock',
  'kair-great-04':'kair-great-04-collapse-furnace','kair-great-05':'kair-great-05-merciful-verdict','kair-great-06':'kair-great-06-reverse-telekinesis','k103-boss':'k103-boss-siren-wave-fan',
  'h103-boss':'h103-boss-ink-hand-grasp','c102-boss':'c102-boss-chorus-helix','c103-boss':'c103-boss-amber-reed-wall','c104-boss':'c104-boss-black-mist-core'};
 const man=read('runtime-manifest.json');const D=U.dots(),seen=new Set();
 for(const [id,name] of Object.entries(want)){const p='assets/r1358/'+name+'.webp',d=D[id];
  ok(d&&d.path===p&&d.n===24&&d.cell===256&&d.fps===16&&d.py>=190&&d.py<=210&&d.scale>=1.25&&d.scale<=1.35,'본보스 Dots 시트 표(바닥 접점·크기 1.3, QA 11-27 06:29Z): '+id,d);
  ok(U.mainDots[id]&&/^SW-R1358-(0[1-9]|1[0-6])$/.test(U.mainDots[id]),'요청 번호 짝: '+id,U.mainDots[id]);
  ok(fs.existsSync(path.join(R,'runtime-text',p))&&man.includes(p),'본보스 시트 파일·manifest: '+p);seen.add(p);
  const b=fs.existsSync(path.join(R,'runtime-text',p))?fs.readFileSync(path.join(R,'runtime-text',p)):Buffer.alloc(32),fmt=b.slice(12,16).toString();let w=0,h=0;if(fmt==='VP8X'){w=1+b.readUIntLE(24,3);h=1+b.readUIntLE(27,3);}else if(fmt==='VP8L'){const v=b.readUInt32LE(21);w=1+(v&0x3fff);h=1+((v>>14)&0x3fff);}ok(w===6144&&h===256,'가로 24칸 6144×256: '+p,[w,h]);
  const row=A.table().find(r=>r.id===id),s=A.spec(E(id)).sig;
  ok(s&&s.sheet==='r1358-'+id&&s.dots===true&&A.sheetOf(s.sheet).path===p&&!s.temp,'본보스 고유 스킬이 정식 시트를 씀: '+id,s);
  ok(row&&row.sig&&row.sig.shape===s.shape&&row.sig.why===s.why,'모양·이름은 R1346 그대로: '+id);}
 ok(seen.size===16,'본보스 16장 모두 다른 그림');
 const S=sandbox(),b=E('l303-boss');S.sb.room.enemies.push(b);run(S,A.tune.first+A.tune.cd+4);ok(S.calls.imgs.includes('assets/r1358/l303-boss-sleepless-eye.webp')&&S.calls.shapes===0,'정식 시트로 그려짐(불면귀 l303)');
 const eye=S.calls.filters.filter(f=>f[0]==='assets/r1358/l303-boss-sleepless-eye.webp');ok(eye.length>0&&eye.every(f=>f[1]==='brightness(1.2)'),'불면귀 눈은 밝기 1.2 로 그림(QA)',eye.slice(0,2));
 ok(D['l303-boss'].bright===1.2&&Object.entries(D).every(([k,v])=>['l303-boss','kair-elite-49','kair-elite-51','kair-elite-53','kair-elite-57'].includes(k)||!v.bright&&!v.sat&&!v.ink&&!v.keep),'밝기·채도·먹 외곽 손질은 불면귀와 QA 가 짚은 수문장 49·51·53 과 어두운 57 만(R1358b)');
 const S2=sandbox(),b2=E('dist00-boss');S2.sb.room.enemies.push(b2);run(S2,A.tune.first+A.tune.cd+4);const rt=S2.calls.filters.filter(f=>/dist00-boss/.test(f[0]));ok(rt.length>0&&rt.every(f=>f[1]==='none'),'다른 보스 그림은 필터 없음·그린 뒤 필터 원래대로',rt.slice(0,2));}
// ---- Dots 정식 시트 SW-R1358-18~23(11-27 07:12Z): 중간보스 6명 — 모양·이름 그대로, 임시 표시 지움 ----
{const want={'mb-dist02':'mb-dist02-poison-leaf-ring','mb-dist03':'mb-dist03-blood-footprint-spray','mb-dist04':'mb-dist04-second-death-blade','mb-dist05':'mb-dist05-last-will-cross','mb-dist06':'mb-dist06-black-pillar-flame','mb-ep1a08':'mb-ep1a08-fluorescent-tube',
  'mb-ep1a11':'mb-ep1a11-smiling-halo','mb-ep1b02':'mb-ep1b02-snail-void-spiral','mb-ep1b05':'mb-ep1b05-red-heel-cut','mb-ep1b07':'mb-ep1b07-beast-flame-heads','mb-ep1b08':'mb-ep1b08-cathedral-spear',
  'mb-ep1b09':'mb-ep1b09-bootloader-antlers','u201-mid':'u201-mid-observation-spindle','u202-mid':'u202-mid-suppression-claws','u203-mid':'u203-mid-void-memory-funnel','u204-mid':'u204-mid-callsign-censor','u205-mid':'u205-mid-deletion-list-slashes',
  'u206-mid':'u206-mid-migration-tendrils','mb-hando01':'mb-hando01-false-return-mist','mb-hando02':'mb-hando02-silver-seal-chain','mb-hando03':'mb-hando03-mimic-blades','mb-murder01':'mb-murder01-blue-light-streak','mb-murder02':'mb-murder02-vacancy-ledger',
  'mb-murder03':'mb-murder03-causal-umbrellas','murder04-mid':'murder04-mid-causal-chain-ring','c101-mid':'c101-mid-firewall-flames','c103-mid':'c103-mid-golden-lattice',
  'c104-mid':'c104-mid-debris-psychokinesis','c105-mid':'c105-mid-bio-tendrils','kair-elite-49':'kair-elite-49-time-gear','kair-elite-50':'kair-elite-50-reverse-sand',
  'kair-elite-51':'kair-elite-51-noon-bell','kair-elite-52':'kair-elite-52-stopped-second-hand','kair-elite-53':'kair-elite-53-clockwork-chain',
  'kair-elite-54':'kair-elite-54-cracked-dial','kair-elite-55':'kair-elite-55-black-sundial','kair-elite-56':'kair-elite-56-red-hour-hand',
  'kair-elite-57':'kair-elite-57-flowing-numerals','kair-elite-58':'kair-elite-58-falling-clocktower','kair-elite-59':'kair-elite-59-blood-pendulum',
  'kair-elite-60':'kair-elite-60-mist-clock-hand','mb-ep1a08s':'mb-ep1a08s-surgeon-incision'};
 const man=read('runtime-manifest.json');const D=U.dots(),T=U.table();
 for(const [id,name] of Object.entries(want)){const p='assets/r1358/'+name+'.webp',d=D[id];
  ok(d&&d.path===p&&d.n===24&&d.cell===256&&d.py>=190&&d.py<=210&&(id==='kair-elite-53'?d.scale>=1.6&&d.scale<=1.7:d.scale>=1.25&&d.scale<=1.35),'중간보스 Dots 시트 표(태엽 사슬만 QA 1.65): '+id,d);
  ok(fs.existsSync(path.join(R,'runtime-text',p))&&man.includes(p),'중간보스 시트 파일·manifest: '+p);
  const s=A.spec(E(id)).sig;ok(s&&s.sheet==='r1358-'+id&&s.dots===true&&!s.temp&&s.shape===T[id][0]&&s.why===T[id][2],'중간보스 정식 시트·모양·이름 그대로: '+id,s);}
 ok(Object.keys(D).every(id=>{const s=A.spec(E(id))?.sig;return s&&s.dots===true&&!s.temp;}),'정식 시트를 쓰는 보스는 모두 임시 표시 없음');
 ok(!D['mb-ep1a10']&&A.spec(E('mb-ep1a10')).sig.temp===true,'오만의 폐허핵(25, Dots 보류)은 임시 그림');}
// ---- ② 보스 낙인 ----
const sigSrc=id=>({r1346:id,source:E(id),enemy:E(id),kind:'r1346-signature'});
const tickFor=(S,secs,dt=1/30)=>{for(let i=0;i<Math.round(secs/dt);i++){S.sb.time+=dt;S.sb.tick(dt);}};
{const S=sandbox();const r=S.sb.hurt(10,sigSrc('mb-dist01'));ok(r==='hit'&&S.U.state(),'고유 스킬에 맞으면 낙인',S.U.inspect());
 const h0=S.player.hp;tickFor(S,1);ok(Math.abs((h0-S.player.hp)-60)<1.5,'1초에 최대 체력 6%(1000 → 60)',h0-S.player.hp);
 ok(S.calls.marks.some(m=>m[0]==='curse'),'상태이상 아이콘(타락)으로 보임',S.calls.marks.slice(0,2));ok(S.calls.toasts.some(t=>/공명 방어\(D\)/.test(t)),'처음 한 번 D 로 풀 수 있다고 알림');}
{const S=sandbox();S.sb.hurt(10,sigSrc('mb-dist01'));S.player.shield=9999;S.player.invincible=5;const h0=S.player.hp;tickFor(S,1);ok(Math.abs((h0-S.player.hp)-60)<1.5,'방어 무시: 보호막·무적 시간 있어도 6%',h0-S.player.hp);}
{const S=sandbox();S.sb.hurt(10,sigSrc('mb-dist01'));tickFor(S,1);const h1=S.player.hp;S.player.guard=true;S.player.parry=.25;S.sb.time+=1/30;S.sb.tick(1/30);ok(!S.U.state()&&S.player.hp===h1,'공명 방어(D) 누르는 순간 풀리고 그 틱부터 피해 0',[S.U.state(),h1-S.player.hp]);
 S.player.guard=false;tickFor(S,2);ok(S.player.hp===h1,'풀린 뒤 더 깎이지 않음');ok(S.U.inspect().cleansed===1,'해제 기록');}
{const S=sandbox();S.sb.hurt(10,sigSrc('mb-dist01'));tickFor(S,3);S.player.invincible=0;S.sb.hurt(10,sigSrc('mb-dist01'));const st=S.U.state();ok(st&&Math.abs(st.left-6)<.05,'다시 맞으면 시간만 새로(6초, 사용자 11-27 06:01Z)',st);
 const h0=S.player.hp;tickFor(S,1);ok(Math.abs((h0-S.player.hp)-60)<1.5,'중첩 없음: 여러 번 맞아도 초당 6%',h0-S.player.hp);ok(S.U.inspect().afflicted===1&&S.U.inspect().refreshed>=1,'새로 걸림 1회·갱신');}
{const S=sandbox();S.sb.hurt(10,sigSrc('mb-dist01'));tickFor(S,5.9);ok(!!S.U.state(),'5.9초에는 아직 걸려 있음(6초)');tickFor(S,.2);ok(!S.U.state(),'6초 뒤 저절로 끝');const h=S.player.hp;tickFor(S,1);ok(S.player.hp===h,'끝난 뒤 피해 없음');}
{const S=sandbox();S.sb.hurt(10,sigSrc('mb-dist01'));S.player.hp=30;tickFor(S,3);ok(S.player.hp>=1&&S.player.hp<=1.0001&&S.U.inspect().floored>=1,'체력 낮을 때: 낙인만으로는 1 아래로 안 떨어짐',S.player.hp);
 S.player.hp=1;tickFor(S,1);ok(S.player.hp===1,'체력 1이면 더 안 깎임');}
{const S=sandbox();S.player.guard=true;S.player.parry=.25;const r=S.sb.hurt(10,sigSrc('mb-dist01'));ok(r==='parried'&&!S.U.state(),'패링으로 막으면 낙인 없음');}
{const S=sandbox();S.player.invincible=1;const r=S.sb.hurt(10,sigSrc('mb-dist01'));ok(r==='invulnerable'&&!S.U.state(),'무적 회피로 막으면 낙인 없음');}
{const S=sandbox();S.player.shield=999;const r=S.sb.hurt(10,sigSrc('mb-dist01'));ok(r==='blocked'&&S.U.state(),'보호막이 다 막아도 낙인은 걸림(방어 무시)');}
{const S=sandbox();S.sb.hurt(10,{kind:'melee',source:E('mb-dist01')});S.sb.hurt(10,{kind:'r411-field'});ok(!S.U.state(),'일반 공격·공용 장판은 낙인 아님');}
for(const k of ['r1042-kiss','r1241-shadow','r1258-sloth-throw','r1263-wrath','r1343-glass','r1345-gut']){const S=sandbox();S.sb.hurt(10,{kind:k,owner:'x'});ok(!!S.U.state(),'다른 보스 고유 스킬도 낙인: '+k);}
{const S=sandbox();S.sb.hurt(10,{type:'r1239-masks',r1239:true,owner:'x'});ok(!!S.U.state(),'루시퍼 가면(R1239)도 낙인');}
{const S=sandbox();S.sb.hurt(10,{kind:'r1263-greed',source:E('b06-boss')});ok(!S.U.state(),'맘몬 보스 스킬은 낙인 안 붙임(승인 전)');}
{const S=sandbox();S.sb.hurt(10,sigSrc('mb-dist01'));S.sb.modal=true;const h=S.player.hp;tickFor(S,1);ok(S.player.hp===h,'창이 열려 있으면 멈춤');S.sb.modal=false;S.sb.storyScene={};tickFor(S,1);ok(S.player.hp===h,'서사 장면 중 멈춤');}
{const S=sandbox();S.sb.hurt(10,sigSrc('mb-dist01'));S.player.hp=0;tickFor(S,.2);ok(!S.U.state(),'영웅이 쓰러지면 낙인도 사라짐');}
{const S=sandbox({store:{'storyworld.r1358.unique':'{"mark":false}'}});S.sb.hurt(10,sigSrc('mb-dist01'));ok(!S.U.state(),'끄기(mark:false)');}
{const S=sandbox({store:{'storyworld.r1358.unique':'{"on":false}'}});ok(!S.A.spec(E('mb-dist03')).sig,'끄기(on:false): 새 고유 스킬 등록 안 함');}
{const S=sandbox();S.sb.hurt(10,sigSrc('mb-dist01'));const t0=S.sb.time;S.sb.time+=30;S.sb.tick(30);ok(S.player.hp>1000-60*.26,'큰 시간 건너뜀(dt) 한 틱 피해 상한 .25초',1000-S.player.hp);}
// ---- R1358b QA(11-27 12:38Z 7.69 미달) 손질: 바닥과 섞이는 시간 톱니·정오의 종, 작은 태엽 사슬 ----
{const D=U.dots();
 ok(D['kair-elite-49'].ink>0&&D['kair-elite-49'].bright===1.25&&D['kair-elite-49'].sat===1.3,'시간 톱니: 먹 외곽·밝기 1.25·채도 1.3',D['kair-elite-49']);
 ok(D['kair-elite-51'].ink>0&&D['kair-elite-51'].keep===.7,'정오의 종: 먹 외곽·자리 70%',D['kair-elite-51']);
 const S=sandbox(),b=E('kair-elite-49');S.sb.room.enemies.push(b);run(S,A.tune.first+A.tune.cd+4);const g=S.calls.filters.filter(f=>/kair-elite-49-time-gear/.test(f[0]));
 ok(g.length>0&&g.every(f=>f[1]==='brightness(1.25) saturate(1.3)'),'시간 톱니는 brightness·saturate 만 쓰고(기록기 안전) 문서 없으면 원본 시트로 그림',g.slice(0,2));
 ok(S.calls.filters.every(f=>!/drop-shadow|blur/.test(f[1]||'')),'게임 ctx 에 drop-shadow·blur 없음');
 const cnt=id=>{const S=sandbox(),e=E(id);S.sb.room.enemies.push(e);run(S,A.tune.first+.2);return S.A.inspect().bursts;};
 const n51=cnt('kair-elite-51');ok(n51>0,'정오의 종 시전',n51);
 const ref=(()=>{const S=sandbox(),e=E('kair-elite-51');const v=S.U.dots()['kair-elite-51'];S.A.addSheet('r1358-test-full',{...v,keep:undefined});S.A.register('kair-elite-51',{sig:{...S.A.spec(e).sig,sheet:'r1358-test-full'}});S.sb.room.enemies.push(e);run(S,A.tune.first+.2);return S.A.inspect().bursts;})();
 ok(ref>0&&n51<ref&&n51>=Math.floor(ref*.6)&&n51<=Math.ceil(ref*.8),'정오의 종 자리 수 약 70%',[n51,ref]);}
console.log('R1358 CPU checks: '+n+' passed');
