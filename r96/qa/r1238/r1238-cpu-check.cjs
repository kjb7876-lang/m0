// R1238 막혀서 제자리인 이동은 서기 그림으로 — CPU 검사.  node r96/qa/r1238/r1238-cpu-check.cjs
//  조종 영웅이 '이동 중'인데 0.15초 넘게 위치가 그대로이고 공격·스킬·피격·대시·막기가 아니면, 그리는 동안만 moving=false 로 그리고 되돌린다.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..');let n=0;const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d));assert(c,m);n++;console.log('PASS',m);};
const F='hero-blocked-r1238.js',src=fs.readFileSync(path.join(R,'client-source',F),'utf8');
{const h=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');ok(h.split('"./'+F+'"').length===2&&h.indexOf(F)>h.indexOf('hero-walk-r1108c.js')&&h.indexOf(F)<h.indexOf('persona-stride-r1104.js'),'스크립트 태그 한 번, hero-walk-r1108c 바로 뒤');}
for(const k of ['runtime-inputs.json','runtime-manifest.json'])ok(fs.readFileSync(path.join(R,k),'utf8').includes(F),k+' 에 등록');
ok(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"),'공개판 확인 목록에 있음');
function load(pref){const win={},seen=[];const sb={window:win,localStorage:{getItem:()=>pref?JSON.stringify(pref):null,setItem(){}},Math,Number,JSON,Object,Array,String,console,setTimeout:f=>f(),time:0,
 player:{hero:'neon',x:10,y:10,moving:false},document:{readyState:'complete'}};sb.drawHero=function(){seen.push(sb.player.moving);return 'R';};
 vm.createContext(sb);vm.runInContext(src,sb);return {api:win.__STORYWORLD_HERO_BLOCKED_R1238__,sb,seen};}
const step=(o,dt,dx=0,dy=0,extra={})=>{o.sb.time+=dt;o.sb.player.x+=dx;o.sb.player.y+=dy;Object.assign(o.sb.player,extra);const r=o.sb.drawHero();return {r,saw:o.seen[o.seen.length-1],after:o.sb.player.moving};};
{const o=load(null);ok(o.api.inspect().wrapped===true,'drawHero 감쌈');
 o.sb.player.moving=true;let s=step(o,.02,.1);ok(s.saw===true&&s.r==='R','실제로 걷는 중엔 그대로(moving true)');
 for(let i=0;i<5;i++)s=step(o,.02,.1);ok(s.saw===true,'계속 걸으면 그대로');
 s=step(o,.05);ok(s.saw===true,'막힌 지 0.05초 — 아직 걷기 꼬리(경계 아래)');
 s=step(o,.05);ok(s.saw===true,'막힌 지 0.10초 — 아직 그대로');
 s=step(o,.06);ok(s.saw===false&&s.after===true,'막힌 지 0.16초 — 그리는 동안만 moving=false, 그린 뒤 되돌림');
 for(let i=0;i<40;i++)s=step(o,.05);ok(s.saw===false&&s.after===true,'오래 막혀 있어도 서기 그림, 상태는 그대로');
 s=step(o,.05,.003);ok(s.saw===false,'0.004 칸보다 작은 떨림은 움직임 아님');
 s=step(o,.05,.05);ok(s.saw===true,'다시 움직이면 바로 걷기');
 for(const [k,v] of [['attackAnim',.3],['skillAnim',.3],['ultimateAnim',.3],['hurtAnim',.2],['dashAnim',.2],['guard',true]]){const o2=load(null);o2.sb.player.moving=true;step(o2,.02,.1);step(o2,.3,0,0,{[k]:v});const z=step(o2,.05);ok(z.saw===true,'막혀도 '+k+' 중이면 손대지 않음');}
 const o3=load(null);o3.sb.player.moving=false;step(o3,.02);const z3=step(o3,.5);ok(z3.saw===false&&z3.after===false,'멈춰 있으면(moving false) 그대로');}
{const o=load(null);o.sb.player.moving=true;step(o,.02,.1);step(o,.5);o.sb.player.hero='lauren';let s=step(o,.02);ok(s.saw===true,'영웅이 바뀌면 다시 잼(첫 장면 그대로)');}
{const o=load(null);o.sb.player.moving=true;step(o,.02,.1);step(o,.5);o.sb.player.r720Ally=true;const s=step(o,.1);ok(s.saw===true,'배치 영웅(r720Ally)은 손대지 않음');}
{const o=load(null);o.sb.player.moving=true;step(o,.02,.1);step(o,.5,5,5);const s=step(o,.05);ok(s.saw===true,'순간이동 직후는 새로 시작');}
{const o=load(null);o.sb.player.moving=true;step(o,5,.1);o.sb.time=0;const s=step(o,.05);ok(s.saw===true,'시간이 되감기면(새 판) 새로 시작');}
{const o=load(null);o.sb.player.moving=true;step(o,.02,.1);o.sb.player.x=NaN;const s=step(o,.5);ok(s.saw===true,'NaN 위치는 손대지 않음');}
{const o=load({on:false});o.sb.player.moving=true;step(o,.02,.1);const s=step(o,.5);ok(s.saw===true,'끄기 설정이면 그대로');}
{let threw=false;
 // 안쪽 그리기가 던져도 moving 이 되돌려지는지: 새 샌드박스에서 안쪽이 던지게 한다
 const win={};const sb={window:win,localStorage:{getItem:()=>null,setItem(){}},Math,Number,JSON,Object,Array,String,console,setTimeout:f=>f(),time:0,player:{hero:'neon',x:1,y:1,moving:true},document:{readyState:'complete'}};
 sb.drawHero=function(){throw new Error('inner');};vm.createContext(sb);vm.runInContext(src,sb);try{sb.drawHero();}catch(_){}sb.time=1;try{sb.drawHero();}catch(_){threw=true;}ok(threw&&sb.player.moving===true,'안쪽 그리기가 던져도 moving 되돌림');}
ok(/gameplayChanged:false/.test(src)&&!/player\.(x|y)\s*=(?!=)/.test(src),'위치·판정은 바꾸지 않음(그리는 동안의 표시만)');
console.log(`\nR1238 CPU ${n} 통과`);
