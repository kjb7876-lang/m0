// R953 기억사수 확률 발동 특수 패시브 — CPU 검사(정적 + 가짜 엔진 행동, 진짜 R561 총기 모듈을 함께 올려 궁극기 단축을 잰다).
//  node r96/qa/r953/r953-cpu-check.cjs
//  사용자 2026-11-12 13:36Z: ① 확률 은신 — 은신 중 궁극기 재사용 77% 감소·시전 지연 77% 감소 ② 주변 적 모두에게 표적 난사
//   ③ 통제자 이야기의 기계·로봇 보스 여럿을 7초 불러 함께 싸움(그림·모션·스킬은 그 보스 것 그대로, 전쟁 트라우마가 낫고 있다는 암시).
//  다른 작품은 느낌만. 새 키 없음. 아군 보스는 진짜 보스로 세지 않는다(방 적 목록·처치 수·위험지대·알림·저장에 닿지 않음).
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d));assert(c,m);n++;console.log('PASS',m);};
const F='gunner-veil-r953.js',G='gunner-arms-r561.js';
const rd=(d,f)=>{try{return fs.readFileSync(path.join(R,d,f),'utf8');}catch(_){return '';}};
const src=rd('client-source',F),gsrc=rd('client-source',G);
const strip=s=>s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'');
// ---- 정적 ----
ok(src.length>0&&src===rd('runtime-text',F),'R953 모듈이 있고 runtime-text 사본과 같음');
ok(gsrc.length>0&&gsrc===rd('runtime-text',G),'R561 runtime-text 사본 일치(궁극기 단축 고리)');
const html=rd('runtime-text','index.html');
ok(html.split('"./'+F+'"').length===2&&/<script src="\.\/gunner-veil-r953\.js"><\/script>\n(?:<script src="\.\/[a-z0-9-]+\.js"><\/script>\n)*<script src="\.\/story-reader-r122\.js">/.test(html),'index.html 스크립트 태그 한 번(긴 줄 앞, 따로 한 줄)');
ok(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"),'verify-r96-public.py 기대 목록');
ok(/node r96\/qa\/r953\/r953-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
ok(JSON.stringify(JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8'))).includes(F),'runtime-manifest 에 들어 있음');
const code=strip(src);
ok(!/drop-shadow|blur\(/.test(code),'Three.js 기록기: drop-shadow·blur 없음');
ok(!/스타크래프트|starcraft|오버워치|overwatch|리퍼|reaper|맥크리|mccree|캐서디|cassidy|노바|\bnova\b|death ?blossom|dead ?eye|죽음의 꽃|황야의 무법자|고스트/i.test(code),'다른 작품 이름·기술명을 코드·화면 글에 쓰지 않음(느낌만)');
ok(!/createRadialGradient/.test(code.replace(/function make[\s\S]*?\n\/\/ ---- 그리기/,'')),'그리기 중 그라데이션 없음(기록기 멈춤 함정, 오프스크린 고정 그림에만)');
ok(!/addEventListener\(\s*['"]key/.test(code)&&!/KeyboardEvent/.test(code),'새 키 입력을 받지 않음(스킬 키 늘리지 않음)');
ok(/r720Ally/.test(code),'생존 배치 영웅 몸(r720Ally)을 따로 다룸');
ok(!/room\.enemies\.(push|unshift|splice)|hazards\.push|projectiles\.push|\btoast\(|killEnemy\(|finishEncounter\(|serializeSave|room\.engaged\s*=|room\.kills/.test(code),'방 적 목록·위험지대·투사체·알림·처치·전투 종료·저장을 건드리는 코드가 없음');
ok(/u201-mid/.test(code)&&/u202-mid/.test(code)&&/u203-mid/.test(code)&&/u203-boss/.test(code)&&/u204-mid/.test(code)&&/u205-mid/.test(code)&&/u206-mid/.test(code),'통제자 이야기(u201~u206) 기계 보스 일곱을 부름');

{const r9=rd('client-source','combat-read-r409.js');ok(r9===rd('runtime-text','combat-read-r409.js')&&/allyR953=\/\(\^\|:\)r953:\//.test(r9)&&/if\(allyR953\)\{if\(bodyOf\(c,'enemy'\)&&prefs\.outline\)\{try\{outline\(c,'hero'\)/.test(r9)&&/else if\(bodyOf\(c,'enemy'\)&&aliveEnemy\(c\.owner\)\)/.test(r9),'R409: 아군 보스 몸은 핏빛 적 테가 아니라 영웅 쪽 테(적 가림 계산에서도 빠짐), 진짜 적 처리는 그대로');}
// ---- 가짜 엔진 ----  벽: 24<x<25.5 (clearLine 이 막음), 맵 1..N-1
const BOSS=[['u201','u201-mid','제4단계 전쟁관리자'],['u202','u202-mid','제8단계 자비 교정관'],['u203','u203-mid','기억의 문 수호 프레임'],['u203','u203-boss','컨트롤러 · 기억의 문'],['u204','u204-mid','제12단계 기억 검열기'],['u205','u205-mid','제14단계 역전 관리자'],['u206','u206-mid','제17단계 중앙이주 코어']];
const pat=(name,shape,anchor)=>({anchor,windup:1.05,cooldown:3.8,damage:15,radius:shape==='line'?7.8:2.2,innerRadius:.5,width:.58,repeats:2,gap:.4,color:'#ff3857',accent:'#8ff6ff',status:'drain',statusValue:9,telekinetic:false,name,shape});
function engine({coop=null,enemies=[],hero='gunner',lowFx=false,px=10,py=10,rand=null,withArms=true}={}){
 const hits=[],sheets=[],drawnEnemies=[],drawnHazards=[],toasts=[],floats=[];const N=60,L={};
 const room={id:'room1',props:[],kills:0,engaged:false,enemies:enemies.map(e=>({radius:.3,hp:1e6,maxHp:1e6,spawnState:'active',...e}))};
 const regionById={};const zones=[];
 for(const [z,id,name] of BOSS){regionById[z]=regionById[z]||{id:z,index:20,chapterIndex:3,bosses:[],midboss:null};const d={id,name,path:'assets/actors/'+id+'.webp',ai:'hybrid',weapon:'heavy'};if(/boss$/.test(id))regionById[z].bosses.push(d);else regionById[z].midboss=d;
  let zr=zones.find(v=>v.id===z);if(!zr){zr={id:z,actors:[]};zones.push(zr);}zr.actors.push({id,name,patterns:[pat(name+' 일격','circle','target'),pat(name+' 주사','line','boss')]});}
 const W={};const g={window:W,localStorage:{getItem:()=>null,setItem:()=>{}},console,Math:Object.create(Math),JSON,Set,Map,WeakMap,WeakSet,Array,Object,String,Number,Error,Promise,Infinity,Date,
  setTimeout:()=>0,addEventListener(t,f){(L[t]=L[t]||[]).push(f);},
  time:10,TILE:32,zoom:1,N,room,zone:'room1',layer:'STORY',settings:{lowFx},effects:[],hazards:[],projectiles:[],started:true,modal:null,loading:false,storyScene:null,auto:false,guide:false,COMBAT_RHYTHM_R26:1,shake:0,
  player:{x:px,y:py,hp:100,hero,direction:'right',attackCD:0,specialCD:0,combo:0,moving:false,attackAnim:0,storyWER:{ready:{},buffs:{}}},
  HEROES:{gunner:{name:'기억사수',special:'기억 재현',range:8.2},hwando:{name:'환도',special:'x'}},rank:()=>0,maxHP:()=>200,
  regionById,portable:{assetMap:{zones},bossNativeBitmapRoutes150:Object.fromEntries(BOSS.map(b=>[b[1],{'snipe-sword-wave':{projectile:'assets/fx/'+b[1]+'-laser.webp',telegraph:'assets/fx/'+b[1]+'-tele.webp',impact:'assets/fx/'+b[1]+'-hit.webp'},'rolling-ordnance':{projectile:'assets/fx/'+b[1]+'-core.webp',telegraph:'assets/fx/'+b[1]+'-tele.webp',impact:'assets/fx/'+b[1]+'-hit.webp'}}])),bossNativeArt137150:{}},
  actor3:(d,id,x,y,boss,l,def,mid)=>({id,nativeId:d.id,name:d.name,path:d.path,boss,midboss:mid,profile:d,type:'boss',x,y,homeX:x,homeY:y,hp:5000,maxHp:5000,damage:14,radius:.55,speed:1.7,spawnState:'hidden',cd:1,tell:0,phase:0,flash:0,state:'idle'}),
  bossSkillPaths150:z=>['assets/fx/'+z+'-a.webp'],
  moveActor:(e,dx,dy)=>{e.x+=dx;e.y+=dy;},
  lockPatternFootprint154:h=>h.footprint154||(h.footprint154={shape:h.storyPattern5.shape,x:h.x,y:h.y,originX:h.originX,originY:h.originY,angle:h.angle,radius:h.radius,width:h.width}),
  footprintContains154:(f,x,y,pad=0)=>{if(f.shape==='line'){const dx=x-f.originX,dy=y-f.originY,c=Math.cos(f.angle),s=Math.sin(f.angle),al=dx*c+dy*s,ac=Math.abs(-dx*s+dy*c);return al>=-pad&&al<=f.radius+pad&&ac<=f.width+pad;}return Math.hypot(x-f.x,y-f.y)<=f.radius+pad;},
  project:(x,y)=>({x:(x-y)*32,y:(x+y)*16}),actorHeight:()=>60,
  liveEnemies:()=>g.room.enemies.filter(e=>e.hp>0),damageable3:()=>true,
  blocked:(x,y,r=.27)=>x-r<1||y-r<1||x+r>N-1||y+r>N-1,
  attackPower:()=>40,
  hitEnemy:(e,v,s)=>{hits.push({id:e.id,v,s,t:g.time,ab:s&&s.ability});e.hp-=v;if(e.hp<=0){e.hp=0;g.room.kills++;}return true;},
  floatText:(t)=>{floats.push(String(t));},toast:(t)=>{toasts.push(String(t));},sound:()=>{},fx:()=>{},updateHUD:()=>{},
  storyAim22:()=>0,drawEffect:()=>{},tick:()=>{},enterRegion:async()=>true,special(){},serializeSave:()=>({}),restoreSave:async()=>{},
  drawHero:()=>{g.__heroDraws=(g.__heroDraws||0)+1;g.__heroAlpha=g.ctx.globalAlpha;},
  drawEnemy:(e)=>{drawnEnemies.push({e,t:g.time});},
  drawHazard:(h)=>{drawnHazards.push({h,t:g.time,age:h.age});},
  basicAttack(){const p=g.player;if(p.hp<=0||p.attackCD>0)return;p.combo++;p.attackCD=.48;p.attackAnim=.24;},
  document:{createElement:()=>{const c={width:0,height:0,getContext:()=>new Proxy({},{get:(o,k)=>k in o?o[k]:(String(k).startsWith('create')?()=>({addColorStop(){}}):()=>{}),set:(o,k,v)=>{o[k]=v;return true;}})};return c;},getElementById:()=>null},
  readyImage:(p)=>({image:{src:p,width:1536,height:1024,naturalWidth:1536,naturalHeight:1024}}),ensureImages:()=>Promise.resolve(),heroPaths:()=>[],
  ctx:{_st:[],filter:'none',globalAlpha:1,globalCompositeOperation:'source-over',__own:null,
   save(){this._st.push([this.filter,this.globalAlpha,this.globalCompositeOperation]);},restore(){const s=this._st.pop();if(s)[this.filter,this.globalAlpha,this.globalCompositeOperation]=s;},
   translate(){},scale(){},rotate(){},setTransform(){},drawImage(im){sheets.push({src:im&&im.src,own:this.__own,alpha:this.globalAlpha});},
   beginPath(){},moveTo(){},lineTo(){},fill(){},stroke(){},arc(){},ellipse(){},closePath(){},fillRect(){},strokeRect(){},
   scope(o,f){const prev=this.__own;this.__own=o&&o.id;try{return f();}finally{this.__own=prev;}}}};
 if(rand)g.Math.random=rand;
 g.clearLine=(a,b)=>!((a.x<24&&b.x>25.5)||(b.x<24&&a.x>25.5));
 if(coop)W.__STORYWORLD_COOP_SIM_R62__={mode:()=>coop};
 W.__STORYWORLD_WER__=Object.freeze({cast:()=>'base',defs:{}});
 const c=vm.createContext(g);if(withArms)vm.runInContext(gsrc,c,{filename:G});vm.runInContext(src||'throw new Error("gunner-veil-r953.js missing")',c,{filename:F});
 const api=W.__STORYWORLD_GUNNER_VEIL_R953__,arms=W.__STORYWORLD_GUNNER_ARMS_R561__;
 const frame=()=>{for(const e of g.effects.slice())g.drawEffect(e);g.drawHero();};
 const run=(t1,step=.05,draw=true)=>{while(g.time<t1-1e-9){g.time=+(g.time+step).toFixed(4);for(const p of [g.player]){p.attackCD=Math.max(0,p.attackCD-step);}g.tick(step);if(draw)frame();}};
 const swing=()=>{g.player.attackCD=0;g.basicAttack();};
 return {g,api,arms,hits,sheets,drawnEnemies,drawnHazards,toasts,floats,run,swing,frame,room};}
const foe=(id,x,y,o={})=>({id,x,y,...o});
const mine=h=>h.filter(x=>x.s&&x.s.r953);
let E;

// ---- 설치·기본 ----
E=engine({enemies:[foe('a',13,10)]});
ok(E.api&&typeof E.api.force==='function'&&typeof E.api.inspect==='function'&&typeof E.api.ult==='function'&&typeof E.api.cloaked==='function'&&typeof E.api.allies==='function','API(force·inspect·ult·cloaked·allies)가 있음');
ok(Object.isFrozen(E.api.config)&&E.api.config.cloak.ultScale===.23&&E.api.config.summon.duration===7&&E.api.config.summon.count>=2,'설정: 은신 중 궁극기 배수 0.23(77% 감소), 소환 7초, 보스 둘 이상');
{const u=E.api.ult();ok(u.cd===1&&u.delay===1&&E.api.cloaked()===false,'평소: 궁극기 배수 1, 은신 아님');}

// ---- 주사위 ----  확률 구간: 은신 → 난사 → 소환 → 없음
{const C=engine({enemies:[foe('a',13,10)]}).api.config,a=C.cloak.chance,b=C.barrage.chance,c=C.summon.chance;
 ok(a>0&&b>0&&c>0&&a+b+c<=.35,'세 발동 확률 합이 35% 이하(가끔 터지는 패시브)',{a,b,c});
 const roll=(r)=>{const X=engine({enemies:[foe('a',13,10)],rand:()=>r});X.swing();const s=X.api.inspect().stats;return [s.cloaks,s.barrages,s.summons];};
 ok(String(roll(a*.5))==='1,0,0','주사위가 은신 구간이면 은신만',roll(a*.5));
 ok(String(roll(a+b*.5))==='0,1,0','난사 구간이면 난사만',roll(a+b*.5));
 ok(String(roll(a+b+c*.5))==='0,0,1','소환 구간이면 소환만',roll(a+b+c*.5));
 ok(String(roll(a+b+c+.01))==='0,0,0'&&String(roll(.999))==='0,0,0','구간 밖(경계 바로 위·끝)이면 아무것도 안 터짐');
 const X=engine({enemies:[foe('a',13,10)],rand:()=>a*.5});X.swing();X.run(10.6);X.swing();X.run(11.2);X.swing();
 ok(X.api.inspect().stats.cloaks===1&&X.api.inspect().stats.rolls===3,'재발동 대기 중에는 같은 발동이 다시 안 터짐(주사위는 셈)',X.api.inspect().stats);
 const Y=engine({enemies:[foe('a',13,10)],rand:()=>a*.5});Y.g.player.attackCD=.3;Y.g.basicAttack();ok(Y.api.inspect().stats.rolls===0,'기본 공격이 안 나가면(대기 중) 주사위도 안 굴림');
 const Z=engine({enemies:[foe('a',13,10)],hero:'hwando',rand:()=>a*.5});Z.swing();ok(Z.api.inspect().stats.rolls===0&&Z.api.force('cloak')&&(Z.swing(),Z.api.cloaked()===false),'다른 영웅은 발동하지 않음');
 const K=engine({enemies:[foe('a',13,10)],coop:'host',rand:()=>a*.5});K.swing();ok(K.api.inspect().stats.cloaks===0&&K.api.inspect().stats.coopSkipped===1,'협동 모드에서는 발동하지 않음');}

// ---- ① 은신 ----
E=engine({enemies:[foe('a',13,10),foe('b',14,11)]});
ok(E.arms&&E.arms.on(),'진짜 R561 총기 모듈이 같이 올라옴');
{// 평소 궁극기(회귀): 지연 1.6초, 재사용 16초
 const r=E.arms.fire('r',false);ok(r===true&&Math.abs(E.arms.remain('r')-16)<1e-6,'평소 궁극기 재사용 16초(회귀)',E.arms.remain('r'));
 E.run(11.55);const early=E.hits.filter(h=>h.ab==='gunnerStrikeR561').length;E.run(11.7);const late=E.hits.filter(h=>h.ab==='gunnerStrikeR561').length;
 ok(early===0&&late>=1,'평소 궁극기 폭격은 1.6초 뒤에 떨어짐(회귀)',{early,late});
 // 은신 시작: 남은 재사용 77% 감소
 const before=E.arms.remain('r');E.api.force('cloak');E.swing();const after=E.arms.remain('r');
 ok(E.api.cloaked()===true&&E.api.inspect().stats.cloaks===1,'은신 발동');
 ok(Math.abs(after-before*.23)<1e-6,'은신 순간 남은 궁극기 재사용이 77% 줄어듦',{before,after});
 const u=E.api.ult();ok(u.cd===.23&&u.delay===.23,'은신 중 궁극기 배수 0.23·0.23');
 E.run(E.g.time+after+.05);ok(E.api.cloaked()===true,'은신이 아직 이어짐(6초)');
 E.hits.length=0;const t0=E.g.time;ok(E.arms.fire('r',false)===true,'은신 중 궁극기 시전');
 ok(Math.abs(E.arms.remain('r')-16*.23)<1e-6,'은신 중 시전한 궁극기 재사용 16초 → 3.68초(77% 감소)',E.arms.remain('r'));
 E.run(t0+.30);const e1=E.hits.filter(h=>h.ab==='gunnerStrikeR561').length;E.run(t0+.45);const e2=E.hits.filter(h=>h.ab==='gunnerStrikeR561').length;
 ok(e1===0&&e2>=1,'은신 중 궁극기 폭격 지연 1.6초 → 0.368초(77% 감소): 0.30초엔 아직, 0.45초엔 떨어짐',{e1,e2});
 const dmg=E.hits.filter(h=>h.ab==='gunnerStrikeR561'&&h.id==='a')[0].v;ok(dmg>0&&dmg<=40*3.6+1e-6,'은신 궁극기 피해는 그대로(늘지 않음)',dmg);
 const D=E.api.config.cloak.duration;E.run(t0-after-.05+D+.3);ok(E.api.cloaked()===false&&E.api.ult().cd===1&&E.api.ult().delay===1,'은신이 끝나면 배수 1 로 돌아옴');
 E.run(E.g.time+E.arms.remain('r')+.05);E.arms.fire('r',false);ok(Math.abs(E.arms.remain('r')-16)<1e-6,'은신이 끝난 뒤 궁극기 재사용은 다시 16초');}
{// 은신 그리기: 영웅이 옅게 + 은신 그림
 const X=engine({enemies:[foe('a',13,10)]});X.frame();const a0=X.g.__heroAlpha;X.api.force('cloak');X.swing();X.run(10.5);
 ok(a0===1&&X.g.__heroAlpha<.7&&X.g.__heroAlpha>.15,'은신 중 영웅이 옅게 그려짐(완전히 사라지진 않음 — 조작 가능)',X.g.__heroAlpha);
 ok(X.sheets.some(s=>String(s.own).startsWith('r953:cloak')),'은신 일렁임 그림이 그려짐');
 X.run(10+X.api.config.cloak.duration+.6);X.frame();ok(X.g.__heroAlpha===1,'은신이 끝나면 영웅이 다시 또렷함');
 ok(X.g.ctx._st.length===0,'ctx save/restore 짝이 맞음');}

// ---- ② 표적 난사 ----
{const far=[];for(let i=0;i<15;i++)far.push(foe('m'+i,10+1+i*.3,10+(i%2?1:-1)*.8));
 const X=engine({enemies:[foe('near',12,10),foe('edge',10+6.4,10),foe('out',10+6.7,10),foe('wall',10,10+5),...far]});
 X.g.clearLine=(a,b)=>!(b.y>14||a.y>14);X.api.force('barrage');X.swing();
 const C=X.api.config.barrage;ok(C.radius===6.5&&C.rounds>=5&&C.maxTargets===12,'난사 설정: 둘레 6.5칸, 5발 이상, 표적 12 상한');
 X.run(10+C.lock-.06);ok(mine(X.hits).length===0&&X.api.inspect().barrage&&X.api.inspect().barrage.targets.length===12,'조준(잠금) 동안은 피해 없음, 가까운 순서로 표적 12',X.api.inspect().barrage);
 const tg=X.api.inspect().barrage.targets;ok(tg.includes('near')&&!tg.includes('out')&&!tg.includes('wall')&&!tg.includes('edge'),'표적: 가까운 적부터, 둘레 밖·벽 너머 제외(상한 12에 밀린 먼 적도 제외)',tg);
 X.run(10+C.lock+C.gap*C.rounds+.3);const hs=mine(X.hits);
 const per=id=>hs.filter(h=>h.id===id);ok(per('near').length===C.rounds&&per('out').length===0&&per('wall').length===0,'표적마다 정해진 발 수만큼 맞고, 밖·벽 너머는 안 맞음',{near:per('near').length});
 ok(hs.every(h=>h.s.friendly===true&&h.s.r953==='barrage'&&h.s.sourceHero==='gunner')&&Math.abs(per('near')[0].v-40*C.mult)<1e-9,'난사 한 발 = 공격력 × 배수, 아군 피해 표지',per('near')[0]);
 ok(new Set(hs.map(h=>h.id)).size===12&&hs.length===12*C.rounds,'12 표적 모두 난사',hs.length);
 ok(X.api.inspect().barrage===null,'난사가 끝나면 상태 비움');
 ok(X.sheets.some(s=>/gunner-w-tracer/.test(s.src))&&X.sheets.some(s=>String(s.own).startsWith('r953:lock')),'조준 표식과 Dots 탄도 시트를 그림');}
{const X=engine({enemies:[foe('out',30,30)]});X.api.force('barrage');X.swing();X.run(12);ok(mine(X.hits).length===0&&X.api.inspect().errors===0,'둘레에 적이 없으면 난사가 헛돌지 않음(오류 없음)');}
{const X=engine({enemies:[foe('weak',12,10,{hp:15,maxHp:15}),foe('b',12,11)]});X.api.force('barrage');X.swing();X.run(12.5);
 ok(mine(X.hits).filter(h=>h.id==='weak').length===2&&mine(X.hits).filter(h=>h.id==='b').length===X.api.config.barrage.rounds,'죽은 표적은 더 쏘지 않음(남은 표적은 끝까지)');}

// ---- ③ 기계 보스 소환 ----
{const X=engine({enemies:[foe('a',14,10),foe('b',15,12),foe('boss',16,9,{boss:true,hp:1e7,maxHp:1e7})]});X.room.engaged=true;
 const n0=X.room.enemies.length,hp0=X.g.player.hp;X.api.force('summon');X.swing();const S=X.api.config.summon;
 const al=X.api.allies();ok(al.length===S.count&&X.api.inspect().stats.summons===1,'기계 보스 '+S.count+'기 소환');
 const ids=BOSS.map(b=>b[1]);ok(al.every(a=>ids.includes(a.nativeId))&&new Set(al.map(a=>a.nativeId)).size===al.length,'통제자 기계 보스 가운데 서로 다른 보스',al.map(a=>a.name));
 ok(al.every(a=>a.boss===false&&a.r953Ally===true&&a.spawnState==='active'&&String(a.id).startsWith('r953:')),'아군 사본: boss 아님·r953Ally 표지·보이는 상태');
 ok(X.room.enemies.length===n0&&!X.room.enemies.some(e=>e.r953Ally)&&!X.g.liveEnemies().some(e=>e.r953Ally),'방 적 목록·살아 있는 적 목록에 들어가지 않음');
 ok(al.every(a=>!X.g.blocked(a.x,a.y,.5)&&Math.hypot(a.x-10,a.y-10)<=4.5),'영웅 곁(4.5칸 안) 빈 자리에 나타남');
 X.run(10+S.duration-.2);
 ok(X.api.allies().length===S.count,'7초 동안 함께 있음');
 const ah=X.hits.filter(h=>h.s&&h.s.r953==='ally');ok(ah.length>=S.count&&ah.every(h=>h.s.friendly===true),'아군 보스가 적을 때림(아군 피해 표지)',ah.length);
 ok(X.api.inspect().stats.allyCasts>=S.count*2,'보스마다 스킬을 두 번 이상 씀',X.api.inspect().stats.allyCasts);
 ok(X.drawnEnemies.some(d=>d.e.r953Ally)&&new Set(X.drawnEnemies.filter(d=>d.e.r953Ally).map(d=>d.e.id)).size===S.count,'엔진 적 그리기(보스 그림·모션 사슬)로 그대로 그림');
 const hz=X.drawnHazards.map(d=>d.h);ok(hz.length>0&&hz.every(h=>h.type==='story-pattern'&&String(h.owner).startsWith('r953:')&&h.damage===0&&h.row150&&h.cast150),'보스 스킬은 엔진 위험지대 그리기로 그대로 그림(영웅 피해 0)');
 ok(hz.every(h=>{const b=BOSS.find(v=>h.storyRoute5.actor===v[1]);return b&&h.storyPattern5.name.startsWith(b[2])&&h.storyPattern5.status==='none';}),'스킬은 그 보스의 원래 패턴 자료(이름·모양)이고 영웅에게 걸 상태이상은 뺌');
 ok(hz.some(h=>/-tele\.webp$/.test(h.row150.warningArtPath))&&hz.some(h=>/-hit\.webp$/.test(h.row150.impactArtPath)),'스킬 그림은 그 보스의 원래 경로');
 ok(X.api.allies().some(a=>a.storyAttackState5)&&X.api.allies().every(a=>typeof a.storyAttackUntil5==='number'),'보스 공격 자세(엔진 자세 필드)를 켬');
 ok(X.g.hazards.length===0&&X.g.projectiles.length===0,'엔진 위험지대·투사체 목록은 비어 있음(영웅을 다치게 할 것이 없음)');
 ok(X.g.player.hp===hp0&&X.toasts.length===0,'영웅 체력 그대로, 보스 알림(토스트) 없음');
 ok(X.room.enemies.find(e=>e.id==='boss').boss===true&&X.room.engaged===true,'진짜 보스·교전 상태는 그대로');
 const kills=X.room.kills;X.run(10+S.duration+S.leave+.2);
 ok(X.api.allies().length===0,'7초가 지나면 돌아감(목록 비움)');
 const dn=X.drawnEnemies.length;X.run(X.g.time+.5);ok(X.drawnEnemies.length===dn,'돌아간 뒤에는 더 그리지 않음');
 ok(X.room.enemies.length===n0&&X.room.kills===kills,'돌아갈 때 처치 수·적 목록 변화 없음');
 ok(X.sheets.some(s=>String(s.own).startsWith('r953:mend')),'돌아갈 때 치유 빛 연출을 그림(글 없이 그림으로만)');
 ok(X.floats.every(t=>!/트라우마|완치|치유/.test(t)),'서사 글을 새로 넣지 않음');
 ok(X.api.inspect().errors===0,'오류 없음',X.api.inspect().lastError);}
{// 적이 없을 때: 영웅 곁에 머묾
 const X=engine({enemies:[]});X.api.force('summon');X.swing();X.run(13);ok(X.api.allies().every(a=>Math.hypot(a.x-10,a.y-10)<=5)&&X.api.inspect().stats.allyCasts===0&&X.api.inspect().errors===0,'적이 없으면 영웅 곁에 머물고 스킬을 쓰지 않음');}
{// 적에게 다가감
 const X=engine({enemies:[foe('far',22,10)]});X.api.force('summon');X.swing();X.run(14);ok(X.api.allies().some(a=>Math.hypot(a.x-22,a.y-10)<6),'먼 적 쪽으로 다가감',X.api.allies().map(a=>[a.x,a.y]));}
{// 지역 이동·영웅 교체·쓰러짐
 let X=engine({enemies:[foe('a',14,10)]});X.api.force('summon');X.swing();X.run(11);
 X.g.enterRegion('other');ok(X.api.allies().length===0&&X.api.cloaked()===false,'지역을 옮기면 아군 보스·진행 중 발동을 치움');
 X=engine({enemies:[foe('a',14,10)]});X.api.force('summon');X.swing();X.run(11);X.g.player.hero='hwando';X.run(11.2);ok(X.api.allies().length===0,'영웅을 바꾸면 아군 보스가 돌아감');
 X=engine({enemies:[foe('a',14,10)]});X.api.force('summon');X.swing();X.run(11);X.g.player.hp=0;X.run(11.2);ok(X.api.allies().length===0,'영웅이 쓰러지면 아군 보스가 돌아감');
 X=engine({enemies:[foe('a',14,10)]});X.api.force('summon');X.swing();X.run(10.5);X.api.force('summon');X.swing();X.api.force('summon');X.swing();ok(X.api.allies().length<=6,'아군 보스 상한 6');}
{// 방이 바뀐 객체(room 교체)여도 옛 표적을 때리지 않음
 const X=engine({enemies:[foe('a',14,10)]});X.api.force('summon');X.swing();X.run(10.4);const old=X.room.enemies[0];X.g.room={id:'room2',props:[],kills:0,enemies:[]};X.hits.length=0;X.run(13);
 ok(X.hits.filter(h=>h.id===old.id).length===0&&X.api.allies().length===0,'방 객체가 바뀌면 아군 보스·난사를 버림');}

// ---- 끄기·저사양·배치 영웅 ----
{const X=engine({enemies:[foe('a',13,10)],rand:()=>.01});X.api.set(false);X.swing();ok(X.api.inspect().stats.rolls===0&&X.api.ult().cd===1&&X.api.on()===false,'끄면 발동하지 않고 궁극기 배수 1');
 X.api.set(true);X.swing();ok(X.api.cloaked()===true,'다시 켜면 발동');X.api.set(false);ok(X.api.cloaked()===false&&X.api.ult().delay===1,'도중에 끄면 은신·배수 즉시 해제');}
{const X=engine({enemies:[foe('a',13,10),foe('b',12,11),foe('c',11,12)],lowFx:true});X.api.force('barrage');X.swing();let peak=0;const b=X.g.drawEffect;
 for(let i=0;i<30;i++){const k=X.sheets.length;X.run(X.g.time+.05);peak=Math.max(peak,X.sheets.length-k);}ok(peak>0&&peak<=30,'저사양: 한 프레임 그림 30장 이하',peak);}
{const X=engine({enemies:[foe('a',13,10)]});const body={x:12,y:12,hp:100,hero:'gunner',attackCD:0,r720Ally:true,storyWER:{ready:{},buffs:{}}},main=X.g.player;
 X.api.force('cloak',body);X.g.player=body;X.g.basicAttack();X.g.player=main;
 ok(X.api.cloaked(body)===true&&X.api.cloaked()===false&&X.api.ult().cd===1,'생존 배치 영웅 몸의 은신은 조종 영웅과 따로');}
{const X=engine({enemies:[foe('a',13,10)],withArms:false});X.api.force('cloak');X.swing();X.run(11);ok(X.api.cloaked()===true&&X.api.inspect().errors===0,'R561 이 없어도(꺼져 있어도) 오류 없이 은신');}
// ---- R953-2: Dots CX-0095GV 시트(조준 표식 GV-04 · 벗 고리 GV-08 · 전우 호출 빛기둥 GV-06) ---- (은신 풀림 GV-03 은 화면에서 읽히지 않아 보류)
{const names=['gv-lock.webp','gv-friend.webp','gv-call.webp'],man=JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8')).files.map(f=>f.path);
 for(const nm of names)ok(fs.existsSync(path.join(R,'runtime-text/assets/r953',nm))&&man.includes('assets/r953/'+nm),'Dots 시트 파일이 런타임 목록에 있음: '+nm);
 const drew=(X,nm)=>X.sheets.some(s=>String(s.src||'').endsWith('assets/r953/'+nm));
 {const X=engine({enemies:[foe('a',13,10),foe('b',12,11)]});X.api.force('barrage');X.swing();X.run(X.g.time+.3);ok(drew(X,'gv-lock.webp'),'난사 조준 표식을 Dots 시트로 그림');}
 {const X=engine({enemies:[foe('a',13,10)]});X.api.force('summon');X.swing();X.run(X.g.time+.3);ok(drew(X,'gv-call.webp'),'전우 호출 빛기둥을 Dots 시트로 그림');X.run(X.g.time+1);ok(drew(X,'gv-friend.webp'),'아군 보스 발밑 벗 고리를 Dots 시트로 그림');}
 ok(/R953-gunner-veil-2/.test(String(engine({enemies:[]}).api.revision)),'개정 표식 R953-gunner-veil-2');}
// ---- R989: Dots CX-0095GV 남은 시트(난사 회전 섬광 GV-05 · 귀환 치유의 빛 GV-07). GV-01·GV-03 은 심사 탈락으로 넣지 않음 ----
{const names=['gv-spin.webp','gv-mend.webp'],man=JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8')).files.map(f=>f.path);
 for(const nm of names)ok(fs.existsSync(path.join(R,'runtime-text/assets/r953',nm))&&man.includes('assets/r953/'+nm),'Dots 시트 파일이 런타임 목록에 있음: '+nm);
 const drew=(X,nm)=>X.sheets.some(s=>String(s.src||'').endsWith('assets/r953/'+nm));
 {const X=engine({enemies:[foe('a',13,10),foe('b',12,11)]});const hp0=X.g.room.enemies.map(e=>e.hp);X.api.force('barrage');X.swing();X.run(X.g.time+.5);ok(drew(X,'gv-spin.webp'),'난사 중 영웅 둘레 회전 섬광을 Dots 시트로 그림');
  X.run(X.g.time+2);const k=X.sheets.length;X.run(X.g.time+1);ok(!X.sheets.slice(k).some(s=>String(s.src||'').endsWith('gv-spin.webp')),'회전 섬광은 난사가 끝나면 사라짐');
  const Y=engine({enemies:[foe('a',13,10),foe('b',12,11)]});Y.api.force('barrage');Y.swing();Y.run(Y.g.time+3.5,.05,false);
  ok(JSON.stringify(X.hits.map(h=>[h.id,h.v]))===JSON.stringify(Y.hits.map(h=>[h.id,h.v])),'그림을 그리든 안 그리든 난사 피해가 같음(판정·피해 불변)');}
 {const X=engine({enemies:[foe('a',13,10)]});X.api.force('summon');X.swing();const D=X.api.config.summon.duration;X.run(X.g.time+D-.5);ok(!drew(X,'gv-mend.webp'),'전우가 싸우는 동안에는 귀환 빛을 그리지 않음');
  X.run(X.g.time+1);ok(drew(X,'gv-mend.webp'),'전우가 돌아갈 때 귀환 치유의 빛을 Dots 시트로 그림');X.run(X.g.time+3);ok(X.api.allies().length===0&&X.api.inspect().errors===0,'귀환 뒤 아군 0 · 오류 0');}
 const S=engine({enemies:[]}).api.sheets;ok(Array.isArray(S)&&['lock','friend','call','spin','mend'].every(k=>S.includes(k)),'쓰는 Dots 시트 목록에 spin·mend 포함',S);}
// ---- R997: Dots CX-0095GV r3 은신 장막(걸림 GV-01 · 유지 GV-02 · 풀림 GV-03). 사람 윤곽 없이 몸 둘레 육각 판 ----
{const names=['gv-veil-in.webp','gv-veil-loop.webp','gv-veil-out.webp'],man=JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8')).files.map(f=>f.path);
 for(const nm of names)ok(fs.existsSync(path.join(R,'runtime-text/assets/r953',nm))&&man.includes('assets/r953/'+nm),'장막 시트 파일이 런타임 목록에 있음: '+nm);
 const since=(X,k,nm)=>X.sheets.slice(k).some(s=>String(s.src||'').endsWith('assets/r953/'+nm));
 const X=engine({enemies:[foe('a',13,10)]});X.frame();const t0=X.g.time,D=X.api.config.cloak.duration;X.api.force('cloak');X.swing();
 let k=X.sheets.length;X.run(t0+.3);ok(since(X,k,'gv-veil-in.webp')&&!since(X,k,'gv-veil-out.webp'),'은신이 걸릴 때 육각 판이 올라오는 시트를 그림');
 X.run(t0+2);k=X.sheets.length;X.run(t0+3);ok(since(X,k,'gv-veil-loop.webp')&&!since(X,k,'gv-veil-in.webp')&&!since(X,k,'gv-veil-out.webp'),'은신 중에는 도는 판 시트만 그림');
 ok(X.sheets.slice(k).filter(s=>String(s.src||'').includes('gv-veil')).every(s=>String(s.own).startsWith('r953:cloak')&&s.alpha>=0&&s.alpha<=1),'장막 그림은 은신 그림 이름표·알파 0~1');
 X.run(t0+D-.6);k=X.sheets.length;X.run(t0+D-.05);ok(since(X,k,'gv-veil-out.webp'),'은신이 풀리기 직전 판이 흩어지는 시트를 그림');
 X.run(t0+D+.3);k=X.sheets.length;X.run(t0+D+1.3);ok(!X.sheets.slice(k).some(s=>String(s.src||'').includes('gv-veil'))&&X.api.cloaked()===false,'은신이 끝나면 장막 그림이 남지 않음');
 ok(X.api.inspect().errors===0&&X.api.ult().cd===1,'장막 뒤 오류 0 · 궁극기 배수 1');
 const A=engine({enemies:[foe('a',13,10)]}),B=engine({enemies:[foe('a',13,10)]});for(const E of [A,B]){E.api.force('cloak');E.swing();}A.run(A.g.time+D+1);B.run(B.g.time+D+1,.05,false);
 ok(A.api.inspect().stats.cloaks===1&&B.api.inspect().stats.cloaks===1&&A.api.cloaked()===B.api.cloaked(),'그림을 그리든 안 그리든 은신 시간·횟수가 같음(판정 불변)');
 const S=engine({enemies:[]}).api.sheets;ok(['veilIn','veilLoop','veilOut'].every(q=>S.includes(q)),'쓰는 Dots 시트 목록에 장막 셋 포함',S);}
console.log('R953 CPU 검사 통과: '+n+'항목');
