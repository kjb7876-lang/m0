// R446 일곱 기둥: 무너진 성(dist03)의 정적 기둥 일곱을 빼고, 일곱 기둥(dist05) 소환진 둘레에 움직이지 않고 공격하는 기둥 일곱(R170 탑 틀)을 세운다.
// 정적·CPU 검사(브라우저·GPU·실기기 아님). R170 towerTick 은 '때가 된 탑을 한 프레임에 모두 쏘는' 같은 규칙으로 흉내 낸다.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const src=C('props-static-r105.js');ok('runtime copy matches client-source',RT('props-static-r105.js')===src);
ok('pillar art exists',fs.existsSync(path.join(R,'runtime-text','assets','r105','props','dist03-pillar.webp')));
// 바닥: 0..40 안 전부 바닥, 가운데 15,15. 문 door-0 = (20,20) 폭 6.
const blockedFn=(L,x,y)=>x<1||y<1||x>39||y>39;
const sb={console,Math,JSON,Set,Map,Object,Array,Number,String,localStorage:{getItem:()=>null,setItem(){}},StoryPhase1:{explorationBlocked:blockedFn},time:0,
 tick(){},makeRoom:null,player:{x:15,y:16,hp:100},room:null};sb.window=sb;vm.createContext(sb);
vm.runInContext(src,sb,{filename:'props-static-r105.js'});
const SP=sb.__STORYWORLD_STATIC_PROPS_R105__,P=sb.__STORYWORLD_SEVEN_PILLARS_R446__;
ok('dist03 plan has no pillar (only the broken seal chains)',!SP.plan.dist03.some(([k])=>k==='pillar')&&SP.plan.dist03.some(([k])=>k==='chain'));
ok('no static pillar plan anywhere',!Object.values(SP.plan).some(l=>l.some(([k])=>k==='pillar')));
ok('R446 module exposed for dist05',P&&P.revision==='R446-seven-pillars-1'&&P.config.region==='dist05'&&P.config.gap>=3&&P.config.every>=10&&P.config.range===8);
const door={id:'door-0',x:20,y:20,width:6,axis:'y'};
const donor={id:'m1',name:'잡몹',hp:100,maxHp:100,damage:10,x:30,y:30};
const mk=id=>({id,exploration:{floorCells:[[1,1]],centralArena:{x:15,y:15,width:13,depth:13},entry:{x:35,y:35},worldR74:{doors:[door]}},objective:{x:15,y:13},enemies:[{...donor},{id:'b',boss:true,hp:1,maxHp:1}]});
const r3=mk('dist03');P.place(r3);ok('nothing placed outside dist05',r3.enemies.length===2);
const r=mk('dist05');P.place(r);const pil=r.enemies.filter(e=>e.r446Pillar!=null);
ok('seven pillars placed',pil.length===7,pil.length);
ok('pillars are stationary R170 towers that never summon',pil.every(e=>e.speed===0&&e.r170Tower&&e.r170Tower.summoned>=12&&e.r75Tower&&/dist03-pillar\.webp$/.test(e.r170Tower.art)&&e.name==='검은 소환 기둥'&&e.hp===e.maxHp&&e.maxHp>=400));
const dseg=(p)=>{const w=door.width/2,ax=Math.abs(p.x-door.x),ay=Math.abs(p.y-door.y);return Math.min(Math.hypot(ax,Math.max(0,ay-w)),Math.hypot(Math.max(0,ax-w),ay));};
ok('pillars keep clear of the boss door (>=2.6) and the summoning altar (>=3.6)',pil.every(e=>dseg(e)>=2.6&&Math.hypot(e.x-15,e.y-13)>=3.6),pil.map(e=>[e.x.toFixed(1),e.y.toFixed(1)]));
ok('pillars stand on a ring around the arena (4.5..8.5) and 2.4 apart',pil.every(e=>{const d=Math.hypot(e.x-15,e.y-15);return d>=4.4&&d<=8.6;})&&pil.every(a=>pil.every(b=>a===b||Math.hypot(a.x-b.x,a.y-b.y)>=2.39)));
P.place(r);ok('placing again does not duplicate',r.enemies.filter(e=>e.r446Pillar!=null).length===7);
// 틱 흉내: 래핑된 tick(R446) → R170 towerTick(때가 된 탑 모두 쏨, 11칸 밖은 쉬기)
sb.room=r;const casts=[];let t=0;const step=1/30;
const towerTick=()=>{for(const e of pil){if(e.hp<=0)continue;const q=e.r170Tower;if(Math.hypot(sb.player.x-e.x,sb.player.y-e.y)>11){q.next=Math.max(q.next,t+1.5);continue;}if(t>=q.next){q.next=t+6;q.casts++;casts.push([t,e.r446Pillar]);}}};
for(let i=0;i<90*30;i++){t+=step;sb.time=t;sb.tick(step);towerTick();}
const gaps=casts.slice(1).map((c,i)=>c[0]-casts[i][0]);
ok('one pillar at a time, at least 3 s apart',casts.length>=20&&Math.min(...gaps)>=2.99,{n:casts.length,min:Math.min(...gaps).toFixed(2)});
ok('all seven take turns',new Set(casts.map(c=>c[1])).size===7,[...new Set(casts.map(c=>c[1]))]);
const per=Array(7).fill(0);casts.forEach(c=>per[c[1]]++);ok('each pillar rests 10 s between its own casts',pil.every(e=>{const ts=casts.filter(c=>c[1]===e.r446Pillar).map(c=>c[0]);return ts.slice(1).every((x,i)=>x-ts[i]>=9.99);}),per);
// 8칸 밖이면 그 기둥은 치지 않는다
const n0=casts.length;sb.player.x=15;sb.player.y=-20;for(let i=0;i<30*30;i++){t+=step;sb.time=t;sb.tick(step);towerTick();}
ok('no casts while the hero is more than 8 tiles from every pillar',casts.length===n0);
// 부서진 기둥은 치지 않는다
sb.player.x=15;sb.player.y=16;pil.forEach((e,i)=>{if(i)e.hp=0;});const n1=casts.length;for(let i=0;i<40*30;i++){t+=step;sb.time=t;sb.tick(step);towerTick();}
ok('destroyed pillars stop; the last one keeps its 10 s rhythm',casts.slice(n1).every(c=>c[1]===0)&&casts.length-n1>=3&&casts.length-n1<=5,casts.length-n1);
ok('no failures',P.inspect().failures===0,P.inspect().lastError);
ok('CI runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r446/r446-cpu-check.cjs'));
const fail=checks.filter(x=>!x.pass);for(const x of checks)console.log((x.pass?'PASS ':'FAIL ')+x.name+(x.pass?'':' '+JSON.stringify(x.detail||'')));
console.log(`R446 ${checks.length-fail.length}/${checks.length}`);if(fail.length)process.exit(1);
