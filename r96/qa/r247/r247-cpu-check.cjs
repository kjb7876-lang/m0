// R247 CPU check: 미카엘라 Z '성흔 광시'(관통 성광 창 + 회복)·X '제네시스 성광주'(빛기둥 여러 개) — R209 가 숨긴 칸을 새 스킬로.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const src=C('michaela-r247.js'),idx=RT('index.html');
ok('runtime copy matches; loads after auto-levelup-r237 (after skills-r209); in verify list and CI',RT('michaela-r247.js')===src&&/auto-levelup-r237\.js"><\/script>(<script src="\.\/[a-z0-9-]+\.js"><\/script>)*<script src="\.\/michaela-r247\.js"><\/script>/.test(idx)&&idx.indexOf('skills-r209.js')<idx.indexOf('michaela-r247.js')&&/'michaela-r247\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8'))&&/qa\/r247\/r247-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
{const r9=C('skills-r209.js');ok('R209 still blocks michaela original W·E (gate) but shows the Z/X buttons and lets the window cast through while R247 is on',/const owned=\(hero,slot\)=>hero==='michaela'&&\(slot==='w'\|\|slot==='e'\)&&!!window\.__STORYWORLD_MICHAELA_R247__\?\.on\?\.\(\)/.test(r9)&&r9.includes('const off=!!hero&&removed(hero,slot)&&!owned(hero,slot);')&&r9.includes("&&!owned(h,String(slot).toLowerCase())){")&&/if\(removed\(player\.hero,slot\)\)\{if\(!\(s\.ready\[k\]>time\+FAR\/2\)\)/.test(r9)&&RT('skills-r209.js')===r9);}
function mk(lv=0){const hits=[],L={};const sb={console,Math,JSON,Object,Array,Set,Number,String,localStorage:{getItem:()=>null,setItem(){}},window:{},setTimeout:()=>0,addEventListener(t,f,c){(L[t]=L[t]||[]).push(f);},auto:false,guide:false,started:true,modal:null,loading:false,storyScene:null,settings:{},time:10,COMBAT_RHYTHM_R26:1,
 player:{hero:'michaela',x:10,y:10,hp:100,direction:'right',storyWER:{ready:{},buffs:{}}},maxHP:()=>200,attackPower:()=>40,clearLine:()=>true,blocked:()=>false,effects:[],sound(){},
 room:{enemies:[{id:'a',x:13,y:10,hp:99,spawnState:'active'},{id:'b',x:15,y:10,hp:99,spawnState:'active'},{id:'c',x:10,y:15,hp:99,spawnState:'active'}]},
 hitEnemy:(e,v,m)=>hits.push([e.id,v,m.ability]),tick(){},drawEffect(){}};
 sb.window.__STORYWORLD_WER__=Object.freeze({cast:()=>'base',defs:{}});sb.window.__STORYWORLD_GROWTH_R103__={state:()=>({procs:{'michaela:w':lv,'michaela:e':lv}})};
 vm.createContext(sb);vm.runInContext(src,sb);return {sb,hits,L,W:()=>sb.window.__STORYWORLD_WER__};}
{const {sb,hits,W}=mk(0);const r=W().cast('w',false);
 ok('Z pierces every enemy on the line toward the nearest enemy (a and b), not the one off-line (c)',r===true&&hits.map(h=>h[0]).sort().join()==='a,b'&&hits.every(h=>h[2]==='michaelaAngelRayR247'),hits);
 ok('Z heals michaela 2% max HP per enemy hit',sb.player.hp===108,sb.player.hp);
 ok('Z goes on its own cooldown (5 s × rhythm) and refuses a second cast',Math.abs(sb.window.__STORYWORLD_MICHAELA_R247__.remain('w')-5)<1e-9&&W().cast('w',false)===false);}
{const {sb,hits,W}=mk(0);W().cast('e',false);const f=()=>hits.length;sb.time=10.3;sb.tick();const early=f();sb.time=11.5;sb.tick();
 ok('X: pillars land after the 0.45 s windup, around the target, and hit with the Genesis tag',early===0&&hits.length>0&&hits.every(h=>h[2]==='michaelaGenesisR247'),{early,n:hits.length});
 ok('X goes on a 9 s cooldown',Math.abs(sb.window.__STORYWORLD_MICHAELA_R247__.remain('e')+sb.time-19)<1e-9);}
{const a=mk(0),b=mk(7);a.W().cast('w',false);b.W().cast('w',false);ok('7-step growth: Z damage grows with the Z skill level',b.hits[0][1]>a.hits[0][1]*1.5,[a.hits[0][1],b.hits[0][1]]);}
{const {sb,hits,L}=mk(0);const kd=L.keydown[0];kd({key:'z',target:{tagName:'CANVAS'}});const z=hits.length;kd({key:'x',target:{tagName:'CANVAS'}});sb.time=11.5;sb.tick();
 ok('Z·X keys are captured by R247 (engine keys call the inner cast, which R209 keeps blocked for michaela)',z>0&&hits.some(h=>h[2]==='michaelaGenesisR247')&&sb.window.__STORYWORLD_MICHAELA_R247__.remain('w')>0,{z,n:hits.length});}
{const {sb,hits}=mk(0);sb.tick();const off=hits.length;sb.auto=true;sb.time=10.4;sb.tick();sb.time=11.6;sb.tick();
 ok('semi-auto / guide casts michaela Z·X by itself when an enemy is near',off===0&&hits.length>0&&sb.window.__STORYWORLD_MICHAELA_R247__.remain('e')>0,{off,n:hits.length});}
{const {sb,W}=mk(0);sb.player.hero='hwando';ok('other heroes still use the original cast',W().cast('w',false)==='base');}
ok('drawn only with R106 painted sprites in michaela colours (wing, feather, pillar, halo, cross, glow, slashline) — no external assets',/'wing'/.test(src)&&/'pillar'/.test(src)&&/'feather'/.test(src)&&/\[150,22,34\]/.test(src)&&!/assets\//.test(src));
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R247 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
