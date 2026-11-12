// R947 슬레이어 확률 발동 피 패시브 — CPU 검사(정적 + 가짜 엔진 행동).
//  node r96/qa/r947/r947-cpu-check.cjs
//  사용자 2026-11-12 13:13Z: 슬레이어 확률 발동 특수 패시브 셋(다른 작품은 느낌만, 이름·디자인은 StoryWorld 고유).
//   ① 드묾: 피 레이저가 체크(격자) 모양으로 주변을 덮으며 난사  ② 흔함: 기본 피 다루기 탄  ③ 피 십자검 여럿이 하늘에서 내려와 적에게 꽂힘(십자가는 늘 똑바로).
//  새 키 없음, 생존 배치 영웅(R720)은 몸마다 따로, R425 분신 베기도 발동 기회로 친다(분신은 건드리지 않음).
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;const ok=(c,m)=>{assert(c,m);n++;console.log('PASS',m);};
const F='slayer-blood-passive-r947.js',src=fs.readFileSync(path.join(R,'client-source',F),'utf8');
const strip=s=>s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'');
// ---- 정적 ----
ok(src===fs.readFileSync(path.join(R,'runtime-text',F),'utf8'),'runtime-text 사본 일치');
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
ok(html.split('"./'+F+'"').length===2&&/<script src="\.\/slayer-blood-passive-r947\.js"><\/script>\n(?:<script src="\.\/[a-z0-9-]+\.js"><\/script>\n)*<script src="\.\/story-reader-r122\.js">/.test(html),'index.html 스크립트 태그 한 번(긴 줄 앞, 따로 한 줄)');
ok(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"),'verify-r96-public.py 기대 목록');
ok(/node r96\/qa\/r947\/r947-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
ok(JSON.stringify(JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8'))).includes(F),'runtime-manifest 에 들어 있음');
const code=strip(src);
ok(!/drop-shadow|blur\(/.test(code),'Three.js 기록기: drop-shadow·blur 없음');
ok(!/이타도리|유지|유우지|천혈|적혈조술|赤血|穿血|백렴|초소|itadori|yuji|choso|jujutsu|주술회전|piercing blood/i.test(code),'다른 작품 이름·기술명을 화면 글·코드에 쓰지 않음(느낌만)');
ok(!/createRadialGradient/.test(code.replace(/function make[\s\S]*?\n\/\/ ---- 그리기/,'')),'그리기 중 그라데이션 없음(기록기 멈춤 함정, 오프스크린 고정 그림에만)');
ok(/r720Ally/.test(code),'생존 배치 영웅 몸(r720Ally)을 따로 다룸');
ok(!/slayer-blood-r425|__STORYWORLD_SLAYER_BLOOD_R425__\s*=/.test(code),'R425(분신·R 적혈 십자가) 모듈을 고치거나 덮어쓰지 않음');

// ---- 가짜 엔진 ----  벽: 14<x<15.5, 맵 1..N-1
function engine({coop=null,enemies=[],hero='slayer',lowFx=false,px=20,py=20,rand=null}={}){
 const hits=[],sheets=[];let clock=10;const N=40;
 const room={id:'room1',props:[],enemies:enemies.map(e=>({radius:.3,hp:1e5,maxHp:1e5,spawnState:'active',...e}))};
 const W={};const g={window:W,localStorage:{getItem:()=>null,setItem:()=>{}},console,Math:Object.create(Math),JSON,Set,Map,WeakMap,WeakSet,Array,Object,String,Number,Error,Promise,
  get time(){return clock;},TILE:32,zoom:1,N,room,zone:'z1',settings:{lowFx},effects:[],started:true,modal:false,loading:false,
  player:{x:px,y:py,hp:100,hero,direction:'right',attackCD:0,specialCD:0,combo:0,moving:false,attackAnim:0},
  project:(x,y)=>({x:(x-y)*32,y:(x+y)*16}),actorHeight:()=>60,
  liveEnemies:()=>g.room.enemies.filter(e=>e.hp>0),damageable3:()=>true,
  blocked:(x,y,r=.27)=>x-r<1||y-r<1||x+r>N-1||y+r>N-1||(x+r>14&&x-r<15.5),
  attackPower:()=>100,
  hitEnemy:(e,v,s)=>{hits.push({id:e.id,v,s,who:g.player,t:clock});e.hp-=v;return true;},floatText:()=>{},
  nearestEnemy:(r)=>{let b=null,bd=1e9;for(const e of g.room.enemies){if(e.hp<=0)continue;const d=Math.hypot(e.x-g.player.x,e.y-g.player.y);if(d<=r&&d<bd){bd=d;b=e;}}return b;},
  storyAim22:()=>0,fx:()=>{},drawEffect:()=>{},tick:()=>{},enterRegion:async()=>true,sound:()=>{},
  basicAttack(){const p=g.player;if(p.hp<=0||p.attackCD>0)return;const e=g.nearestEnemy(3.15);if(!e)return;p.combo++;p.attackCD=.48;p.attackAnim=.24;g.hitEnemy(e,g.attackPower(),{kind:'basic',friendly:true});},
  // 오프스크린 캔버스(브라우저에는 늘 있음): 그리기 명령은 받아 넘기고 크기만 가진 가짜
  document:{createElement:()=>{const c={width:0,height:0,getContext:()=>new Proxy({},{get:(o,k)=>k in o?o[k]:(k.startsWith('create')?()=>({addColorStop(){}}):()=>{}),set:(o,k,v)=>{o[k]=v;return true;}})};return c;}},
  readyImage:(p)=>({image:{src:p,width:1152,height:768,naturalWidth:1152,naturalHeight:768}}),ensureImages:()=>Promise.resolve(),
  ctx:{__rot:0,__sy:1,__own:null,_st:[],filter:'none',globalAlpha:1,globalCompositeOperation:'source-over',
   save(){this._st.push([this.__rot,this.__sy,this.filter,this.globalAlpha]);},restore(){const s=this._st.pop();if(s)[this.__rot,this.__sy,this.filter,this.globalAlpha]=s;},
   translate(){},scale(x,y){this.__sy*=y;},rotate(a){this.__rot+=a;},setTransform(){},
   drawImage(im){sheets.push({src:im&&(im.src||im.__storyworldStaticSource?.path),rot:this.__rot,sy:this.__sy,own:this.__own,alpha:this.globalAlpha});},
   beginPath(){},moveTo(){},lineTo(){},fill(){},stroke(){},arc(){},ellipse(){},closePath(){},fillRect(){},
   scope(o,f){const prev=this.__own;this.__own=o&&o.id;try{return f();}finally{this.__own=prev;}}}};
 if(rand)g.Math.random=rand;
 g.clearLine=(a,b)=>{const d=Math.hypot(b.x-a.x,b.y-a.y),k=Math.max(1,Math.ceil(d/.24));for(let i=1;i<=k;i++)if(g.blocked(a.x+(b.x-a.x)*i/k,a.y+(b.y-a.y)*i/k,.29))return false;return true;};
 if(coop)W.__STORYWORLD_COOP_SIM_R62__={mode:()=>coop};
 const ctx=vm.createContext(g);vm.runInContext(src,ctx,{filename:F});
 const api=W.__STORYWORLD_SLAYER_BLOOD_PASSIVE_R947__;
 const adv=(dt)=>{clock+=dt;for(const p of [g.player,...(g.__allies||[])]){p.attackCD=Math.max(0,p.attackCD-dt);p.specialCD=Math.max(0,p.specialCD-dt);p.attackAnim=Math.max(0,(p.attackAnim||0)-dt);}ctx.tick(dt);};
 const run=(sec,dt=.033)=>{for(let t=0;t<sec;t+=dt)adv(dt);};
 const frame=()=>{const s=g.effects.find(e=>e&&e.r947Sentinel);if(s)ctx.drawEffect(s);return !!s;};
 return {g,ctx,api,hits,sheets,adv,run,frame,now:()=>clock};}
const on=(E,id,tag)=>E.hits.filter(h=>h.id===id&&(!tag||h.s?.r947===tag));

{const E=engine();const A=E.api;ok(A&&typeof A.inspect==='function'&&A.on(),'전역 __STORYWORLD_SLAYER_BLOOD_PASSIVE_R947__ 켜짐');
 const C=A.config;ok(C.needle.chance>C.swords.chance&&C.swords.chance>C.lattice.chance,'확률: 기본 피 탄(흔함) > 십자검 비 > 격자 레이저(드묾)');
 ok(C.lattice.chance>0&&C.lattice.chance<=.06,'격자 레이저는 드묾(6% 이하)');ok(C.needle.chance>=.15&&C.needle.chance<=.3,'기본 피 탄은 흔함(15~30%)');
 ok(C.swords.count>=5,'십자검 여러 자루(5 이상)');}

// ---- ② 혈침: 적혈 연쇄(사용자 13:38Z "체인라이트닝 느낌마냥 연쇄되게 대신 적혈로") ----
{const E=engine({enemies:[{id:'near',x:21,y:20},{id:'c1',x:23,y:21},{id:'c2',x:25,y:22.2},{id:'c3',x:27.5,y:22.6},{id:'iso',x:36,y:36},{id:'side',x:19,y:24.5}]});
 E.api.force('needle');E.ctx.basicAttack();ok(on(E,'near').length===1,'기본 공격 자체는 그대로 한 번');
 E.run(1.2);const I=E.api.inspect(),C=E.api.config.needle;ok(I.stats.needles===1,'혈침 한 번 발동');
 const seq=E.hits.filter(h=>h.s?.r947==='needle');
 ok(seq.length>=4&&seq.slice(0,4).map(h=>h.id).join()==='near,c1,c2,c3','벤 적에서 시작해 가까운 다음 적으로 차례로 연쇄(near→c1→c2→c3)');
 ok(new Set(seq.map(h=>h.id)).size===seq.length,'같은 적은 한 번만');
 ok(seq.every((h,i)=>i===0||h.t>seq[i-1].t),'한 번에 다 맞지 않고 튀어 가며 차례로(시간차)');
 ok(seq.every((h,i)=>Math.abs(h.v-100*C.mult*Math.pow(C.decay,i))<1e-9),'튈 때마다 피해 줄어듦(×'+C.mult+' 에서 ×'+C.decay+'씩)');
 ok(on(E,'iso').length===0,'튀는 거리('+C.jump+'칸) 밖 외딴 적은 안 맞음');
 ok(seq.length<=C.jumps,'최대 '+C.jumps+'명');
 ok(seq[0].s.sourceHero==='slayer'&&seq[0].s.friendly===true&&seq[0].s.owner==='hero','엔진 hitEnemy 로(영웅 피해 표식)');}
{const foes=[];for(let i=0;i<12;i++)foes.push({id:'q'+i,x:21+i*1.2,y:20});const E=engine({enemies:foes});E.api.force('needle');E.ctx.basicAttack();E.run(2);
 ok(E.hits.filter(h=>h.s?.r947==='needle').length===E.api.config.needle.jumps,'줄 선 적 12명이어도 최대 수에서 멈춤');}
{const E=engine({enemies:[{id:'a',x:13,y:20},{id:'behind',x:15.9,y:20}],px:12,py:20});
 E.api.force('needle');E.ctx.basicAttack();E.run(1);ok(on(E,'a','needle').length===1&&on(E,'behind','needle').length===0&&E.api.inspect().stats.wallStops>=1,'벽 너머로는 튀지 않음');}
{const E=engine({enemies:[{id:'a',x:21,y:20}]});E.g.player.attackCD=.3;E.api.force('needle');E.ctx.basicAttack();E.run(.05);ok(E.api.inspect().stats.needles===0,'실패한 기본 공격은 발동하지 않음');
 E.run(.4);E.ctx.basicAttack();E.run(.5);ok(E.api.inspect().stats.needles===1,'강제 예약은 다음 성공한 공격에서 씀');}
{const E=engine({enemies:[{id:'a',x:21,y:20}],hero:'hwando'});E.api.force('needle');E.ctx.basicAttack();E.run(1);ok(E.api.inspect().stats.needles===0,'다른 영웅은 발동 없음');}
{const E=engine({enemies:[{id:'a',x:21,y:20}],coop:'duo'});E.api.force('needle');E.ctx.basicAttack();E.run(1);ok(on(E,'a','needle').length===0,'협동 모드는 패시브 피해 없음');}
{const E=engine({enemies:[{id:'a',x:21,y:20}]});E.api.set(false);E.api.force('needle');E.ctx.basicAttack();E.run(1);ok(E.api.inspect().stats.needles===0,'끄면 발동 없음');E.api.set(true);}
{const E=engine({enemies:[{id:'a',x:21,y:20}],rand:()=>0});E.ctx.basicAttack();E.run(.5);E.ctx.basicAttack();E.run(.05);
 ok(E.api.inspect().stats.needles===1,'대기 시간 안 두 번째 공격은 피 탄 없음');E.run(E.api.config.needle.icd);E.ctx.basicAttack();E.run(.05);ok(E.api.inspect().stats.needles===2,'대기 시간 뒤 다시 발동');}
// 대상이 없어 발동이 안 나가면 대기 시간도 쓰지 않음(R947-3, 코디네이터 16:21Z 환도 스레드와 같은 결함)
{const E=engine({enemies:[{id:'a',x:21,y:20,hp:50,maxHp:50},{id:'far',x:30,y:20}],rand:()=>0});E.ctx.basicAttack();E.run(.05);
 ok(E.api.inspect().stats.needles===0&&E.api.inspect().cd.needle===0,'혈침: 벤 적이 죽고 둘레에 적이 없으면 대기 시간 안 씀');
 E.g.room.enemies.push({id:'b',x:21.5,y:20,radius:.3,hp:1e5,maxHp:1e5,spawnState:'active'});E.run(.5);E.ctx.basicAttack();E.run(.05);ok(E.api.inspect().stats.needles===1,'혈침: 바로 다음 공격에 발동');}
{const E=engine({enemies:[{id:'a',x:21,y:20,hp:50,maxHp:50},{id:'far',x:30,y:20}],rand:()=>.21});E.ctx.basicAttack();E.run(.05);
 ok(E.api.inspect().stats.swordCasts===0&&E.api.inspect().cd.swords===0,'성혈검우: 범위 안 적이 없으면 대기 시간 안 씀');
 E.g.room.enemies.push({id:'b',x:21.5,y:20,radius:.3,hp:1e5,maxHp:1e5,spawnState:'active'});E.run(.5);E.ctx.basicAttack();E.run(.05);ok(E.api.inspect().stats.swordCasts===1,'성혈검우: 바로 다음 공격에 발동');}
// 패시브 자신의 피해는 다시 주사위를 굴리지 않음(연쇄 폭주 방지)
{const E=engine({enemies:[{id:'a',x:21,y:20},{id:'b',x:23,y:20}],rand:()=>0});E.ctx.basicAttack();E.run(1);ok(E.api.inspect().stats.swings===1,'패시브 피해는 발동 기회로 세지 않음');}
// 확률: 고정 시드 주사위
{let s=12345;const lcg=()=>{s=(s*1103515245+12345)%2147483648;return s/2147483648;};
 const E=engine({enemies:[{id:'a',x:21,y:20,hp:1e12,maxHp:1e12}],rand:lcg});let tries=0;
 for(let i=0;i<3000;i++){E.ctx.basicAttack();tries++;E.run(E.api.config.lattice.icd+.1,.5);}
 const st=E.api.inspect().stats,C=E.api.config;
 ok(Math.abs(st.needles/tries-C.needle.chance)<.04,'피 탄 평균 발동률 '+(st.needles/tries).toFixed(3)+' ≈ '+C.needle.chance);
 ok(Math.abs(st.swordCasts/tries-C.swords.chance)<.025,'십자검 평균 발동률 '+(st.swordCasts/tries).toFixed(3)+' ≈ '+C.swords.chance);
 ok(Math.abs(st.lattices/tries-C.lattice.chance)<.015,'격자 레이저 평균 발동률 '+(st.lattices/tries).toFixed(3)+' ≈ '+C.lattice.chance);
 ok(st.multi===0,'한 번의 공격에 패시브는 하나만');}

// ---- R425 분신 베기도 발동 기회(분신 자체는 그대로) ----
{const E=engine({enemies:[{id:'a',x:25,y:20},{id:'b',x:27,y:20}]});E.api.force('needle');const e=E.g.room.enemies[0];
 const r=E.ctx.hitEnemy(e,100,{kind:'r425-clone',friendly:true,owner:'hero',r425:'clone',sourceHero:'slayer',attackKind9:'basic'});
 ok(r===true&&on(E,'a').length===1&&on(E,'a')[0].s.r425==='clone','분신 베기 피해는 그대로 엔진에 감');
 E.run(1);ok(E.api.inspect().stats.needles===1&&on(E,'b','needle').length===1,'분신 베기 때도 피 탄이 분신이 벤 적 쪽으로');}

// ---- ① 격자 레이저 난사 ----
{const foes=[{id:'n',x:21.2,y:20.4},{id:'s',x:19.3,y:22.6},{id:'w',x:17.1,y:19.2},{id:'d',x:23,y:23},{id:'far',x:26.5,y:20},{id:'g',x:20,y:16.4}];
 const E=engine({enemies:foes,px:20,py:20});E.api.force('lattice');E.ctx.basicAttack();E.run(.05);let I=E.api.inspect();
 ok(I.stats.lattices===1&&I.lattice,'격자 레이저 발동');
 E.run(.3);I=E.api.inspect();ok(I.lattice&&I.lattice.waves>=1,'곧바로 난사 시작');
 const dirs=new Set(I.lattice.lines.map(l=>l.dir));E.run(.5);for(const l of E.api.inspect().lattice?.lines||[])dirs.add(l.dir);ok(dirs.has('h')&&dirs.has('v'),'가로·세로 줄이 번갈아(체크 무늬)');
 E.run(3);const C=E.api.config.lattice;
 for(const id of ['n','s','w','d','g']){const k=on(E,id,'lattice').length;ok(k>=3&&k<=C.waves,'반경 안 적 '+id+' 여러 번 맞음('+k+'회, 상한 '+C.waves+')');}
 ok(on(E,'far','lattice').length===0,'반경('+C.radius+'칸) 밖 적은 안 맞음');
 ok(on(E,'n','lattice').every(h=>Math.abs(h.v-100*C.mult)<1e-9),'줄 하나 피해 = 공격력 × '+C.mult);
 const waves=new Set(on(E,'n','lattice').map(h=>h.s.attackId9));ok(waves.size===on(E,'n','lattice').length,'한 번의 난사(줄 묶음)에 같은 적은 한 번만');
 ok(E.api.inspect().lattice===null,'끝나면 정리');ok(E.g.player.x===20&&E.g.player.y===20,'영웅은 옮기지 않음');}
// 혈격자 교차점 적혈 십자가(사용자 13:39Z "피레이져 교차지점에 적혈피십자가 생기면서 적에게 피폭발피해")
{const foes=[{id:'n',x:21.2,y:20.4},{id:'s',x:19.3,y:22.6},{id:'w',x:17.1,y:19.2},{id:'far',x:26.5,y:20}];
 const E=engine({enemies:foes,px:20,py:20});E.api.force('lattice');E.ctx.basicAttack();E.run(.9);const C=E.api.config.lattice,sp=C.spacing/2;
 const X=E.api.inspect().crosses;ok(X.length>=3,'교차점에 적혈 십자가가 섬('+X.length+')');
 ok(X.every(c=>Math.abs(c.x/sp-Math.round(c.x/sp))<1e-6&&Math.abs(c.y/sp-Math.round(c.y/sp))<1e-6),'십자가 자리는 가로줄·세로줄 교차점');
 ok(X.every(c=>Math.hypot(c.x-20,c.y-20)<=C.radius),'십자가는 격자 반경 안');
 ok(new Set(X.map(c=>c.x+','+c.y)).size===X.length,'한 교차점에 하나만');
 E.run(2.5);const ch=E.hits.filter(h=>h.s?.r947==='latticeCross');
 ok(['n','s','w'].every(id=>ch.some(h=>h.id===id)),'교차점 십자가 피 폭발이 곁의 적에게');
 ok(ch.every(h=>Math.abs(h.v-100*C.crossMult)<1e-9),'피 폭발 피해 = 공격력 × '+C.crossMult);
 ok(!ch.some(h=>h.id==='far'),'격자 밖 적은 폭발 피해 없음');
 const first=E.hits.find(h=>h.s?.kind==='basic').t;ok(Math.min(...ch.map(h=>h.t))-first>=C.lead+C.crossDelay*.9,'십자가가 솟은 뒤에 터짐');}
{const E=engine({enemies:[{id:'a',x:21.2,y:20.4},{id:'b',x:19.3,y:22.6}]});E.api.force('lattice');E.ctx.basicAttack();E.run(.6);E.sheets.length=0;E.frame();
 const cs=E.sheets.filter(s=>/assets\/r585\/slayer-r-cross\.webp/.test(s.src||''));ok(cs.length>=1,'교차점 십자가는 Dots 적혈 십자가 시트(R585) 재사용');
 ok(cs.every(s=>Math.abs(s.rot)<1e-9&&s.sy>0),'교차점 십자가도 회전·상하 반전 없이 똑바로');}
{const E=engine({enemies:[{id:'a',x:13,y:20},{id:'behind',x:16.2,y:20}],px:12,py:20});E.api.force('lattice');E.ctx.basicAttack();E.run(3);
 ok(on(E,'a','lattice').length>=1&&on(E,'behind','lattice').length===0,'벽 너머 적은 격자에 안 맞음');}
{const E=engine({enemies:[{id:'a',x:21,y:20}]});E.api.force('lattice');E.ctx.basicAttack();E.run(.2);E.g.room={id:'room2',enemies:[{id:'z',x:21,y:20,radius:.3,hp:1e5}]};E.run(3);
 ok(E.hits.filter(h=>h.s?.r947==='lattice'&&h.id==='z').length===0,'방이 바뀌면 남은 격자 난사 취소');}

// ---- ③ 피 십자검 비 ----
{const foes=[{id:'a',x:22,y:20},{id:'b',x:20,y:23},{id:'c',x:17,y:18},{id:'far',x:28,y:20}];
 const E=engine({enemies:foes});E.api.force('swords');E.ctx.basicAttack();E.run(.05);let I=E.api.inspect();const C=E.api.config.swords;
 ok(I.stats.swordCasts===1&&I.swords.length===C.count,'십자검 '+C.count+'자루 소환');
 ok(I.swords.every(s=>['a','b','c'].includes(s.foe)),'검은 사거리 안 적에게만(먼 적 제외)');
 ok(new Set(I.swords.map(s=>s.foe)).size===3,'적이 적으면 여러 자루가 나눠 꽂힘');
 ok(E.hits.filter(h=>h.s?.r947==='sword').length===0,'시전 직후엔 아직 피해 없음(하늘에서 떨어지는 중)');
 E.run(2);const sw=E.hits.filter(h=>h.s?.r947==='sword');ok(sw.length===C.count,'꽂힐 때 자루마다 한 번 피해('+sw.length+')');
 ok(sw.every(h=>Math.abs(h.v-100*C.mult)<1e-9),'꽂힘 피해 = 공격력 × '+C.mult);
 ok(on(E,'far').length===0,'먼 적은 꽂힘·튐 피해 없음');
 const t0=Math.min(...sw.map(h=>h.t));ok(t0-E.hits.find(h=>h.s?.kind==='basic').t>=C.fall*.9,'떨어지는 시간 뒤에 꽂힘');}
{const E=engine({enemies:[]});E.api.force('swords');E.ctx.basicAttack();E.run(.1);ok(E.api.inspect().stats.swordCasts===0,'적이 없어 공격 안 나가면 검 없음');}
{const E=engine({enemies:[{id:'a',x:22,y:20}]});E.api.force('swords');E.ctx.basicAttack();E.run(.1);E.ctx.enterRegion();ok(E.api.inspect().swords.length===0,'지역 들어갈 때 정리');}

// ---- 그리기: 표지·Dots 시트 재사용·십자검은 똑바로·상한 ----
{const E=engine({enemies:[{id:'a',x:22,y:20},{id:'b',x:20,y:23}]});E.api.force('swords');E.ctx.basicAttack();E.run(.2);
 ok(E.g.effects.some(e=>e&&e.r947Sentinel),'할 일이 있으면 그리기 표지 등록');E.sheets.length=0;E.frame();
 const sw=E.sheets.filter(s=>/r947:sword/.test(s.own||''));ok(sw.length>=2,'떨어지는 십자검 그림');
 ok(sw.every(s=>Math.abs(s.rot)<1e-9&&s.sy>0),'십자검은 회전·상하 반전 없이 똑바로(정십자: 위 짧고 아래 긺)');
 E.run(.8);E.sheets.length=0;E.frame();ok(E.sheets.some(s=>/assets\/r585\/slayer-burst-small\.webp/.test(s.src||'')),'꽂힘 피 튐은 Dots 시트(R585 burst-small) 재사용');
 ok(E.sheets.filter(s=>/r947:sword/.test(s.own||'')).every(s=>Math.abs(s.rot)<1e-9&&s.sy>0),'꽂힌 뒤에도 똑바로');
 E.run(3);ok(!E.g.effects.some(e=>e&&e.r947Sentinel),'끝나면 표지 뺌');}
{const E=engine({enemies:[{id:'a',x:21,y:20},{id:'b',x:24,y:20}]});E.api.force('needle');E.ctx.basicAttack();E.run(.12);E.sheets.length=0;E.frame();
 ok(E.sheets.some(s=>/r947:needle/.test(s.own||'')),'피 탄 그림');E.run(.1);E.sheets.length=0;E.frame();
 ok(E.sheets.some(s=>/assets\/r587\/slayer-hit\.webp/.test(s.src||'')),'피 탄 적중은 Dots 시트(R587 SL11 적중) 재사용');}
// 사용자 14:12Z "번개보다는 완전한 적혈 느낌": 번개 시트·번개 모양 없이 피 줄기·핏방울·피 튐(Dots)으로
ok(!/lightning|bolt|번개 줄기/i.test(code),'적혈 연쇄에 번개 시트·번개 그림을 쓰지 않음');
{const E=engine({enemies:[{id:'a',x:21,y:20},{id:'b',x:23,y:21},{id:'c',x:25,y:22}]});E.api.force('needle');E.ctx.basicAttack();E.run(.2);E.sheets.length=0;E.frame();
 const own=E.sheets.filter(s=>/r947:needle/.test(s.own||''));ok(own.some(s=>/r947:bloodstream/.test(s.src||'')),'적혈 연쇄 줄기는 피 줄기 그림');
 ok(own.some(s=>/r947:blooddrop/.test(s.src||'')),'줄기에서 핏방울이 떨어짐');
 ok(E.sheets.some(s=>/assets\/r585\/slayer-burst-small\.webp/.test(s.src||'')),'튄 자리마다 Dots 피 튐(R585 burst-small)');}
{const foes=[];for(let i=0;i<20;i++)foes.push({id:'m'+i,x:20+Math.cos(i)*(1+i*.2),y:20+Math.sin(i)*(1+i*.2)});
 const E=engine({enemies:foes});E.api.force('lattice');E.ctx.basicAttack();E.run(.45);E.sheets.length=0;E.frame();
 ok(E.sheets.some(s=>/r947:lattice/.test(s.own||'')),'격자 레이저 그림');ok(E.sheets.length<=E.api.config.maxDraws,'한 프레임 그림 상한('+E.sheets.length+' ≤ '+E.api.config.maxDraws+')');}
{const E=engine({enemies:[{id:'a',x:21,y:20}],lowFx:true});E.api.force('lattice');E.ctx.basicAttack();E.run(.45);E.sheets.length=0;E.frame();ok(E.sheets.length<=28,'저사양 상한 28');}

// ---- 생존 배치 영웅(R720): 몸마다 따로 ----
{const E=engine({enemies:[{id:'a',x:22,y:20},{id:'b',x:31,y:30}]});const main=E.g.player;
 const ally={x:30,y:30,hp:100,hero:'slayer',direction:'right',attackCD:0,specialCD:0,attackAnim:0,r720Ally:true};E.g.__allies=[ally];
 E.g.player=ally;E.api.force('swords');E.ctx.basicAttack();E.g.player=main;E.run(.1);
 ok(E.api.inspect(ally).stats.swordCasts===1&&E.api.inspect(main).stats.swordCasts===0,'배치 영웅 발동은 그 몸 것(조종 영웅과 섞이지 않음)');
 ok(E.api.inspect(ally).swords.every(s=>s.foe==='b'),'배치 영웅 검은 그 영웅 곁 적에게');
 E.api.force('needle');E.ctx.basicAttack();E.run(.1);ok(E.api.inspect(main).stats.needles===1&&E.api.inspect(ally).cd.needle===0,'대기 시간·통계 몸마다 따로');
 E.run(2);ok(on(E,'b','sword').every(h=>h.s.sourceHero==='slayer'),'배치 영웅 검 피해도 영웅 피해');}
console.log('\nR947 CPU 검사 '+n+'개 통과');
