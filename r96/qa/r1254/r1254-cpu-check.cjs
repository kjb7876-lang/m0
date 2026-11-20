// R1254 외부 리뷰(공개판 e3b5ae02) 수정 CPU 검사 — 브라우저 검사는 r1254-browser.mjs(헤드리스).
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
// ① R251: 엔진 killEnemy 가 죽은 발록을 명단에서 바로 뺀다
function mk251(){const B={id:'balrog',name:'발록 · 지옥의 문지기',boss:true,x:24,y:20,hp:5000,maxHp:10000,damage:50};
 const sb={console,Math,JSON,Object,Array,Number,String,Promise,Date,localStorage:{getItem:()=>null,setItem(){}},window:{},time:10,uid:1,layer:'STORY',player:{x:20,y:20,hp:500},
  room:{id:'dist06',enemies:[B,{id:'m',name:'소환진 검은기둥',midboss:true,x:30,y:30,hp:10,maxHp:10}]},hazards:[],effects:[],blocked:()=>false,toast(){},saveGame(){},tick(){},drawEnemy(){},drawEffect(){},drawHazard(){}};
 vm.createContext(sb);vm.runInContext(C('summoning-r251.js'),sb);return {sb,B};}
{const {sb,B}=mk251();sb.tick();ok('① alive Balrog: no circle',!sb.room.enemies.some(e=>e.r251Circle));
 B.hp=0;B.deadRecorded=true;sb.room.enemies=sb.room.enemies.filter(e=>e!==B);sb.tick();const c=sb.room.enemies.filter(e=>e.r251Circle);
 ok('① Balrog removed from the list by the real death path → circle spawns where it fell (12% HP)',c.length===1&&c[0].maxHp===1200&&Math.hypot(c[0].x-24,c[0].y-20)<.01,c[0]&&{x:c[0].x,hp:c[0].maxHp});
 sb.tick();ok('① spawns only once',sb.room.enemies.filter(e=>e.r251Circle).length===1);}
{const {sb,B}=mk251();sb.tick();sb.room.enemies=sb.room.enemies.filter(e=>e!==B);sb.tick();ok('① boundary: Balrog leaving the list while alive (not dead) spawns nothing',!sb.room.enemies.some(e=>e.r251Circle));}
{const {sb,B}=mk251();sb.tick();const old=sb.room;sb.room={id:'dist06',enemies:[]};B.hp=0;B.deadRecorded=true;sb.tick();ok('① boundary: a Balrog seen in another room object does not spawn into a new room',!sb.room.enemies.some(e=>e.r251Circle));}
// ② R334: 체력바 대상
function mk334(){const sb={console,Math,JSON,Object,Array,Number,String,WeakMap,Infinity,localStorage:{getItem:()=>null,setItem(){}},window:{},time:50,
  document:{readyState:'complete',body:{classList:{contains:()=>false}},getElementById:()=>null,querySelector:()=>null,addEventListener(){}},setInterval(){},setTimeout(){},getComputedStyle:()=>({display:'flex'}),MutationObserver:undefined,
  shown:null,updateHUD(){sb.shown=sb.room.enemies.find(e=>(e.boss||e.midboss)&&e.hp>0)?.name;}};
 sb.room={enemies:[{name:'m0',hp:1},{name:'기둥',midboss:true,hp:100},{name:'x',hp:1},{name:'발록',boss:true,hp:100}]};vm.createContext(sb);vm.runInContext(C('hud-bossbar-r334.js'),sb);return sb;}
{const sb=mk334();const order=()=>sb.room.enemies.map(e=>e.name).join(',');const o0=order();sb.updateHUD();
 ok('② nobody hurt: the boss is shown before the midboss',sb.shown==='발록',sb.shown);ok('② enemy order restored after the HUD pass',order()===o0,order());
 sb.room.enemies[1].hp=90;sb.time=51;sb.updateHUD();ok('② the pillar just hit is shown',sb.shown==='기둥',sb.shown);
 sb.room.enemies[3].hp=80;sb.time=52;sb.updateHUD();ok('② then Balrog hit is shown',sb.shown==='발록',sb.shown);
 sb.time=70;sb.updateHUD();ok('② after 8 s without hits it falls back to the boss',sb.shown==='발록',sb.shown);ok('② order still restored',order()===o0);}
{const sb=mk334();sb.room.enemies=[{name:'혼자',midboss:true,hp:5}];sb.updateHUD();ok('② boundary: one major enemy — untouched',sb.shown==='혼자');}
// ③ R104 준비 자세 경로 → p1
{const s=C('bosses-r104.js');const m=/\[\/raised\|windup\|anticip\|prepare\|charge\/i\.test\(p\)\?0:\/attack\|strike\|cast\/i\.test\(p\)\?1:3\]/.test(s);
 const pick=p=>/raised|windup|anticip|prepare|charge/i.test(p)?0:/attack|strike|cast/i.test(p)?1:3;
 ok('③ Balrog raised body/sword → anticipation p1; attack → strike p2; idle → recovery p4',m&&pick('assets/actors/v31511/balrog-raised-body.png')===0&&pick('assets/actors/v31511/balrog-raised-sword.png')===0&&pick('x/aa5052f514b2_balrog-attack.webp')===1&&pick('x/balrog-idle.webp')===3);}
// ④ R912: 빈 기록이면 판정 미룸
{const s=C('projectile-sheets-r912.js');ok('④ R912 defers the per-shot check when the original draw recorded nothing (off screen)',/if\(el===undefined&&!k\.direct&&!log\.length\)\{stats\.deferred=/.test(s)&&s.indexOf('!log.length){stats.deferred')<s.indexOf('const yes=isEligible(p,k,log)'));}
// ⑤ R1229: 적 탄 그리기 동안 stroke 비움 (가짜 drawProjectile)
{const s=C('motion-fx-r1229.js');const calls=[];const ctx={stroke(){calls.push('real');},fill(){calls.push('fill');}};
 const sb={console,Math,JSON,Object,Array,Number,String,Map,Set,WeakMap,Date,localStorage:{getItem:()=>null,setItem(){}},window:{},time:1,ctx,
  drawProjectile(b){ctx.stroke();ctx.stroke();return 'drawn';},tick(){},setTimeout:f=>f()};vm.createContext(sb);vm.runInContext(s,sb);
 const r=sb.drawProjectile({friendly:false});const hostile=calls.length;sb.drawProjectile({friendly:true});
 ok('⑤ hostile shot: engine trail strokes are not recorded, draw result kept',r==='drawn'&&hostile===0,{calls});
 ok('⑤ boundary: hero shots keep their strokes and ctx.stroke is restored',calls.length===2&&!Object.prototype.hasOwnProperty.call(ctx,'stroke')||calls.length===2&&ctx.stroke.toString().includes("push('real')"),{calls,own:Object.prototype.hasOwnProperty.call(ctx,'stroke')});
 sb.window.__STORYWORLD_MOTION_FX_R1229__.set({trail:false});calls.length=0;sb.drawProjectile({friendly:false});ok('⑤ off switch {trail:false} restores the old trail',calls.length===2);}
// ⑥ R1229 사몽 방은 핏빛 고리로 안 바꿈
{const s=C('motion-fx-r1229.js'),c=C('combat-r170.js');ok('⑥ swapHex skips while R170 ink mode (samong) is on; R170 exposes inkMode',/function swapHex\(cs\)\{[^\n]*__STORYWORLD_COMBAT_R170__\?\.inkMode\?\.\(\)\)return;/.test(s)&&/inkMode:\(\)=>inkHex\(\)/.test(c));}
for(const f of ['summoning-r251.js','hud-bossbar-r334.js','bosses-r104.js','projectile-sheets-r912.js','motion-fx-r1229.js','combat-r170.js'])ok('runtime copy matches '+f,C(f)===RT(f));
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R1254 CPU ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
