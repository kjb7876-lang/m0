// R443 CPU 검사: R74 순찰 '재 나방'(ash)이 움직일 때만 기존 지도 칸 [idle→windup→recover→windup] 으로 날갯짓, 그 밖엔 원래 그림 그대로.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let n=0;const ok=(c,m)=>{if(!c){console.error('FAIL',m);process.exit(1);}n++;};
ok(RT('era-r191.js')===C('era-r191.js'),'runtime copy matches client-source');
const cells={};for(const s of ['root','clock','ash','glass'])for(const p of ['idle','windup','contact','recover'])cells[s+':'+p]={path:'assets/r74/monsters.png',sourceRect:[s.length,p.length,1,1]};
const sb={time:0,setTimeout:()=>0,localStorage:{getItem:()=>null,setItem(){}}};sb.window=sb;
sb.__STORYWORLD_WORLD_R74__={atlasFrame:(a,k)=>a==='monsters'?cells[k]||null:null};
sb.__STORYWORLD_PHASE1_ART__=Object.freeze({enemy(e){if(!e.r74Monster)return {path:'x',state:'idle'};const ph=e.attack?'contact':e.hitTimer>0?'recover':'idle';const f=cells[e.r74Monster+':'+ph];return {path:f.path,frame:{...f,flip:true,r74Monster:true},flip:true,state:ph};}});
vm.createContext(sb);vm.runInContext(C('era-r191.js'),sb);const F=sb.__STORYWORLD_MOB_FLAP_R443__;
ok(F&&F.install()&&sb.__STORYWORLD_PHASE1_ART__.__r443,'installs over PHASE1_ART.enemy');
const A=()=>sb.__STORYWORLD_PHASE1_ART__;
const moth={id:'dist01:r74-patrol:0',r74Monster:'ash',hp:10,moving:true,x:1,y:1};
const seen=new Set();for(let i=0;i<40;i++){sb.time=i/40;const r=A().enemy(moth);seen.add(r.r443Flap||'idle');ok(r.state==='idle'&&r.flip===true&&r.frame.flip===true&&r.frame.r74Monster,'keeps state idle and facing');}
ok(seen.has('windup')&&seen.has('recover')&&seen.has('idle')&&!seen.has('contact'),'moving moth cycles idle/windup/recover only (no attack cell): '+[...seen]);
moth.moving=false;sb.time=5;ok(!A().enemy(moth).r443Flap,'standing moth keeps folded idle cell');
moth.moving=true;moth.attack={elapsed:.1};sb.time=5.1;ok(A().enemy(moth).state==='contact'&&!A().enemy(moth).r443Flap,'attack frames untouched');delete moth.attack;
moth.hitTimer=.2;ok(!A().enemy(moth).r443Flap,'hit frame untouched');moth.hitTimer=0;
for(const s of ['root','clock','glass']){let any=false;for(let i=0;i<20;i++){sb.time=i/20;if(A().enemy({r74Monster:s,hp:5,moving:true,x:0,y:0}).r443Flap)any=true;}ok(!any,'wingless patrol style untouched: '+s);}
ok(!A().enemy({hp:5,moving:true}).r443Flap,'non-R74 mobs untouched');
F.set({on:false});let any=false;for(let i=0;i<20;i++){sb.time=i/20;if(A().enemy({...moth,moving:true}).r443Flap)any=true;}ok(!any,'off switch');
console.log(JSON.stringify({ok:true,checks:n}));
