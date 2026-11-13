// R750 타격감·적중 자리 — 사용자 2026-11-11 "전반적인 스킬 및 공격등 타격감 및 타격이펙트 위치 개선 · 특히 무기 동작등이랑 잘어울리게".
//  정적·CPU 검사(가짜 엔진에 오버레이를 올려 동작을 잰다). GPU·실기기·실플레이 아님. 헤드리스 화면 비교는 PR 그림.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const FILE='hit-feel-r750.js',src=(()=>{try{return fs.readFileSync(path.join(R,'client-source',FILE),'utf8');}catch(_){return '';}})();
ok('overlay file exists',src.length>0);
let rt='';try{rt=fs.readFileSync(path.join(R,'runtime-text',FILE),'utf8');}catch(_){}
ok('runtime copy matches client-source',rt===src&&src.length>0);
// ---- 가짜 엔진 ----
function sandbox(o={}){
 const log={inner:[],translate:[],effects:[],kicked:[],drawn:[]};const store=new Map(Object.entries(o.store||{}));let now=1000;
 const canvases={game:{id:'game',style:{}},'phase1-webgl':{id:'phase1-webgl',style:{}},'combat-hud-r51':{id:'combat-hud-r51',style:{}}};
 const sb={console,Math,JSON,Number,String,Object,Array,Map,WeakMap,Set,Date,Error,isFinite,
  localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))},
  performance:{now:()=>now},setTimeout:()=>0,
  document:{getElementById:id=>canvases[id]||null},
  started:true,modal:null,loading:false,time:5,zoom:1,settings:{reducedMotion:!!o.reduced},
  player:{hero:o.hero||'lauren',x:10,y:10,attackAnim:0,skillAnim:0,ultimateAnim:0,dashAnim:0,hurtAnim:0,guard:false},
  room:{enemies:[]},
  ctx:(()=>{let T={a:o.dpr||1,b:0,c:0,d:o.dpr||1,e:0,f:0};const st=[];return {save(){st.push({...T});},restore(){T=st.pop()||T;},translate(x,y){log.translate.push([x,y]);T.e+=T.a*x+T.c*y;T.f+=T.b*x+T.d*y;},getTransform(){return {...T};},
   drawImage(im,x,y,w,h){const cx=x+w/2,cy=y+h/2;log.drawn.push({x:T.a*cx+T.c*cy+T.e,y:T.b*cx+T.d*cy+T.f});}};})(),
  actorHeight:()=>54,
  project:(x,y)=>({x:(x-y)*20+300,y:(x+y)*10}),
 };
 sb.window=sb;sb.globalThis=sb;
 sb.drawHero=function(){log.inner.push(sb.player.attackAnim);if(o.throwInner)throw new Error('inner');};
 sb.drawEffect=function(f){log.effects.push(f.type);if(f.type==='e568HeroImpact'){const q=sb.project(f.x,f.y),y=q.y-(54*.36-(o.engineLift||0))*sb.zoom;sb.ctx.drawImage({},q.x-20,y-20,40,40);}};
 sb.hitEnemy=function(e,v){if(!e||e.hp<=0)return false;e.hp-=v;return true;};
 sb.draw=function(){};
 if(o.coop)sb.__STORYWORLD_COOP_SIM_R62__={mode:()=>'host'};
 vm.createContext(sb);vm.runInContext(src,sb,{filename:FILE});
 return {sb,log,canvases,setNow:v=>{now=v;},get now(){return now;}};}
const frameOf=(a,start=.24,n=6)=>Math.min(n-1,Math.floor(Math.min(.999,Math.max(0,1-a/start))*n));
if(src){
 // ① 무기 타격 칸 = 적중 순간 (R143 시트 영웅)
 for(const hero of ['lauren','seoha','neon','michaela','hunter','gunner']){
  const {sb,log}=sandbox({hero});const P=sb.player;const seen=[];
  for(const a of [.24,.235,.22,.2,.18,.15,.12,.09,.06,.03,.005]){P.attackAnim=a;log.inner.length=0;sb.drawHero();seen.push(log.inner[0]);ok(`${hero}: real attackAnim restored after draw (${a})`,P.attackAnim===a);}
  const fr=seen.map(v=>frameOf(v));
  ok(`${hero}: first drawn frame of a swing registers the full start (R143 needs it)`,Math.abs(seen[0]-.24)<1e-9,{seen});
  ok(`${hero}: from the 2nd frame the weapon is already on a strike frame (2 or 3)`,fr[1]>=2&&fr[1]<=3&&fr[2]>=2&&fr[2]<=3,{fr});
  ok(`${hero}: strike frames held for the first half of the swing (hold on contact)`,fr.slice(1,6).every(f=>f===2||f===3),{fr});
  ok(`${hero}: ends on recovery frame 5 and never goes backwards`,fr[fr.length-1]===5&&seen.every((v,i)=>i===0||v<=seen[i-1]+1e-12),{fr,seen});
 }
 {const {sb,log}=sandbox({hero:'lauren'});const P=sb.player;P.attackAnim=.24;sb.drawHero();P.attackAnim=.2;sb.drawHero();P.attackAnim=.24;log.inner.length=0;sb.drawHero();P.attackAnim=.23;sb.drawHero();
  ok('a new swing (attackAnim rises) restarts: first frame full start, then strike',Math.abs(log.inner[0]-.24)<1e-9&&frameOf(log.inner[1])>=2,{inner:log.inner});}
 for(const hero of ['hwando','slayer']){const {sb,log}=sandbox({hero});const P=sb.player;const vals=[.24,.22,.18];for(const a of vals){P.attackAnim=a;sb.drawHero();}
  ok(`${hero}: untouched (its own sheet already starts on the contact frame)`,JSON.stringify(log.inner)===JSON.stringify(vals),{inner:log.inner});}
 {const {sb,log}=sandbox({hero:'lauren'});const P=sb.player;P.skillAnim=.3;for(const a of [.24,.2]){P.attackAnim=a;sb.drawHero();}
  ok('skill/ultimate/dash/guard/hurt in progress: untouched (R440 owns skill poses)',JSON.stringify(log.inner)==='[0.24,0.2]',{inner:log.inner});}
 {const {sb,log}=sandbox({hero:'lauren',store:{'storyworld.r750.hitFeel':'{"sync":false}'}});const P=sb.player;for(const a of [.24,.2]){P.attackAnim=a;sb.drawHero();}
  ok('pref sync:false turns the strike sync off',JSON.stringify(log.inner)==='[0.24,0.2]',{inner:log.inner});}
 {const {sb}=sandbox({hero:'lauren',throwInner:true});const P=sb.player;P.attackAnim=.24;try{sb.drawHero();}catch(_){}P.attackAnim=.2;let threw=false;try{sb.drawHero();}catch(_){threw=true;}
  ok('real attackAnim restored even when an inner draw throws',threw&&P.attackAnim===.2);}
 {const {sb,log}=sandbox({hero:'lauren',coop:true});const P=sb.player;for(const a of [.24,.2]){P.attackAnim=a;sb.drawHero();}
  ok('co-op: untouched',JSON.stringify(log.inner)==='[0.24,0.2]');}
 // ② 영웅 고유 큰 적중 그림(e568HeroImpact)을 적 몸의 맞은 자리로 — 실제로 그려진 자리를 재어 배운 뒤 옮긴다
 for(const [label,opt] of [['engine formula',{}],['already moved by another overlay (−22px)',{engineLift:-22}],['device pixel ratio 2',{dpr:2}]]){
  const {sb,log}=sandbox({hero:'hwando',...opt});const e={id:'m1',x:12,y:10,hp:50};sb.room.enemies.push(e);const dpr=opt.dpr||1;
  const V={cx:340,cy:150,top:110,h:80,w:60};sb.__STORYWORLD_HIT_CENTER_R259__={centreOf:x=>x===e?V:null};
  const f={type:'e568HeroImpact',x:12,y:10,targetIdE568:'m1',asset:'a.webp'};const hx=sb.project(10,10).x,side=Math.sign(hx-V.cx),want={x:V.cx+side*V.w*.15,y:V.cy};
  sb.drawEffect(f);const first=log.drawn.pop();sb.drawEffect(f);const second=log.drawn.pop();sb.drawEffect(f);const third=log.drawn.pop();
  ok(`${label}: from the 2nd draw the impact lands on the body hit point (centre height, 15% toward the attacker)`,Math.abs(second.x/dpr-want.x)<.5&&Math.abs(second.y/dpr-want.y)<.5&&Math.abs(third.x/dpr-want.x)<.5&&Math.abs(third.y/dpr-want.y)<.5,{first,second,third,want});
  ok(`${label}: the effect is still drawn exactly once per call`,log.effects.filter(t=>t==='e568HeroImpact').length===3);}
 {const {sb,log}=sandbox({hero:'hwando'});const e={id:'m1',x:12,y:10,hp:50};sb.room.enemies.push(e);const small={cx:340,cy:190,top:170,h:40,w:40};sb.__STORYWORLD_HIT_CENTER_R259__={centreOf:()=>small};
  const f={type:'e568HeroImpact',x:12,y:10,targetIdE568:'m1',asset:'b.webp'};sb.drawEffect(f);sb.drawEffect(f);const d=log.drawn.pop();
  ok('small enemy: impact no longer floats above the head',d.y>=small.top&&d.y<=small.top+small.h,{d,small});
  sb.zoom=2;sb.drawEffect(f);const z2=log.drawn.pop();ok('learned offset scales with zoom (still on the body after zooming)',Math.abs(z2.y-small.cy)<1,{z2});
  sb.__STORYWORLD_HIT_CENTER_R259__={centreOf:()=>null};log.translate.length=0;sb.drawEffect(f);
  ok('no fresh body measurement: drawn where the engine put it',log.translate.length===0);
  sb.__STORYWORLD_HIT_CENTER_R259__={centreOf:()=>small};log.translate.length=0;sb.drawEffect({type:'burst',x:12,y:10});sb.drawEffect({type:'e568HeroUltimate',x:10,y:10});
  ok('other effect types untouched (R259 owns burst/slash/text; ultimate is on the hero)',log.translate.length===0);}
 // ③ 적중 방향 화면 반동
 function kickRun(o,hits){const S=sandbox(o);const {sb,canvases}=S;const e={id:'k',x:13,y:10,hp:o.hp??100,boss:!!o.boss};sb.room.enemies.push(e);const amps=[];
  for(const h of hits){S.setNow(h.t);sb.hitEnemy(e,h.v??1,h.src);}
  const samples=[];for(let t=hits[hits.length-1].t;t<=hits[hits.length-1].t+200;t+=5){S.setNow(t);sb.draw();const s=canvases.game.style.translate||'';const m=s.match(/(-?[\d.]+)px (-?[\d.]+)px/);samples.push(m?Math.hypot(+m[1],+m[2]):0);}
  return {samples,canvases,sb,e};}
 {const r=kickRun({hero:'lauren'},[{t:1000}]);const peak=Math.max(...r.samples);
  ok('normal hit: small kick (0.8..2.2 px)',peak>=.8&&peak<=2.2,{peak});
  ok('kick returns to rest within 130 ms and the style is cleared',r.samples.slice(27).every(v=>v===0)&&r.canvases.game.style.translate==='',{tail:r.samples.slice(24)});
  ok('3D layer and combat HUD move with the game canvas',r.canvases['phase1-webgl'].style.translate===r.canvases.game.style.translate);}
 {const S=sandbox({hero:'lauren'});const e={id:'k',x:13,y:10,hp:100};S.sb.room.enemies.push(e);S.setNow(1000);S.sb.hitEnemy(e,1);S.setNow(1020);S.sb.draw();
  const m=(S.canvases.game.style.translate||'').match(/(-?[\d.]+)px (-?[\d.]+)px/);const hx=S.sb.project(10,10),ex=S.sb.project(13,10);
  ok('kick pushes along the hero→enemy screen direction',m&&Math.sign(+m[1])===Math.sign(ex.x-hx.x)&&Math.sign(+m[2])===Math.sign(ex.y-hx.y),{m,hx,ex});}
 {const r=kickRun({hero:'slayer',hp:1},[{t:1000,v:5}]);const peak=Math.max(...r.samples);const n=kickRun({hero:'lauren'},[{t:1000}]);const pn=Math.max(...n.samples);
  ok('kill / heavy hero: stronger kick but capped at 3.5 px',peak>pn&&peak<=3.5,{peak,pn});}
 {const hits=[];for(let i=0;i<40;i++)hits.push({t:1000+i*3});const r=kickRun({hero:'hunter',boss:true},hits);const peak=Math.max(...r.samples);
  ok('40 hits in 120 ms (crowd/multi-hit): no build-up, still ≤3.5 px',peak<=3.5,{peak});}
 {const r=kickRun({hero:'lauren',reduced:true},[{t:1000}]);ok('settings.reducedMotion: no kick',Math.max(...r.samples)===0);}
 {const r=kickRun({hero:'lauren',coop:true},[{t:1000}]);ok('co-op: no kick',Math.max(...r.samples)===0);}
 {const r=kickRun({hero:'lauren'},[{t:1000,src:{friendly:false}}]);ok('enemy-side damage source: no kick',Math.max(...r.samples)===0);}
 {const r=kickRun({hero:'lauren',hp:0},[{t:1000}]);ok('hit that did no damage (already dead): no kick',Math.max(...r.samples)===0);}
 {const S=sandbox({hero:'lauren'});const e={id:'k',x:13,y:10,hp:100};S.sb.room.enemies.push(e);S.setNow(1000);S.sb.hitEnemy(e,1);S.setNow(1010);S.sb.draw();const was=S.canvases.game.style.translate;S.sb.modal={};S.setNow(1020);S.sb.draw();
  ok('modal/pause: style cleared immediately',!!was&&S.canvases.game.style.translate==='',{was});}
 {const S=sandbox({hero:'lauren',store:{'storyworld.r750.hitFeel':'{"kick":false}'}});const e={id:'k',x:13,y:10,hp:100};S.sb.room.enemies.push(e);S.setNow(1000);S.sb.hitEnemy(e,1);S.setNow(1020);S.sb.draw();
  ok('pref kick:false turns the kick off',(S.canvases.game.style.translate||'')==='');}
 {const S=sandbox({hero:'lauren'});const e={id:'k',x:13,y:10,hp:100};S.sb.room.enemies.push(e);const r=S.sb.hitEnemy(e,7);ok('hitEnemy result and damage unchanged',r===true&&e.hp===93);}
 {const S=sandbox({});const api=S.sb.__STORYWORLD_HIT_FEEL_R750__;ok('API: revision, set, inspect',api&&typeof api.set==='function'&&typeof api.inspect==='function'&&/R750/.test(api.revision));}
 ok('no camera shake via the engine `shake` value (R63 camera zeroes it) and no simulation slow-down',!/\bshake\s*=/.test(src)&&!/tick\s*=\s*function/.test(src));
 ok('Three.js recorder safe: no ctx.filter / drop-shadow / blur',!/\.filter\s*=|drop-shadow|blur\(/.test(src));
}
// ---- 빌드 연결 ----
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
ok('script tag loaded after enemy-attack-tempo-r601 (outside R143/R440/R259/e568 wrappers)',/<script src="\.\/enemy-attack-tempo-r601\.js"><\/script><script src="\.\/hit-feel-r750\.js"><\/script>/.test(html));
ok('runtime inputs list it',fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8').includes(FILE));
ok('public verify expects it',fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes(FILE));
ok('CI runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r750/r750-cpu-check.cjs'));
const fail=checks.filter(x=>!x.pass);for(const x of checks)console.log((x.pass?'PASS ':'FAIL ')+x.name+(x.pass?'':' '+JSON.stringify(x.detail||'')));
console.log(`R750 ${checks.length-fail.length}/${checks.length}`);if(fail.length)process.exit(1);
