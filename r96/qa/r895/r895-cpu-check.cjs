// R895 CPU 검사: 영웅 모션 법칙(hero-motion-r895.js)의 전환 규칙 경계값과, 몸 그림 덧씌우기들(R119·R143·R271·R351·R440)이 그 규칙을 묻는지.
//  헤드리스 실측(8영웅 전환 시나리오)은 qa/r895/probe.mjs + rules.cjs — 이 검사는 CI 에서 브라우저 없이 도는 부분.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>{try{return fs.readFileSync(path.join(R,'runtime-text',f),'utf8');}catch(_){return null;}};
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
const F='hero-motion-r895.js';let src='';try{src=C(F);}catch(_){}
ok('source exists',!!src);
ok('runtime copy matches source',!!src&&src===RT(F));
try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax '+e.message,false);}
const html=RT('index.html')||'';
ok('script tag once, after enemy-attack-tempo-r601 and right before combat-r118',html.split('"./'+F+'"').length===2&&/enemy-attack-tempo-r601\.js"><\/script>\s*<script src="\.\/hero-motion-r895\.js"><\/script>\s*<script src="\.\/combat-r118\.js">/.test(html));
ok('listed in verify-r96-public.py',/'hero-motion-r895\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
ok('CI runs this check',/r96\/qa\/r895\/r895-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
ok('no gameplay writes (damage/save/cooldowns/positions)',!!src&&!/\.damage\s*=|saveGame|(?:attackCD|specialCD|blinkCD|skillAnim|attackAnim|hurtAnim|dashAnim)\s*=[^=]|player\.(?:x|y|hp)\s*=[^=]/.test(src));
// 가짜 전역
function env(over={}){const e={window:{},localStorage:{store:{},getItem(k){return this.store[k]??null;},setItem(k,v){this.store[k]=v;}},performance:{now:()=>0},time:10,console,Math,JSON,
 player:{hero:'neon',hp:10,x:0,y:0,attackAnim:0,skillAnim:0,ultimateAnim:0,dashAnim:0,hurtAnim:0,moving:false},project:(x,y)=>({x:(x-y)*20+300,y:(x+y)*10+100}),ctx:null,...over};
 e.drawHero=function(){if(e.__draw)e.__draw();};vm.createContext(e);vm.runInContext(src,e);e.M=e.window.__STORYWORLD_HERO_MOTION_R895__;
 e.step=(dt,ch={})=>{e.time=+(e.time+dt).toFixed(6);Object.assign(e.player,ch);e.ctx={commands:[]};vm.runInContext('drawHero()',e);};return e;}
if(src){
 {const e=env();ok('API present (rules, moveCancel, hurtFirst, dash, castStart, attackOverTail)',!!e.M&&typeof e.M.moveCancel==='function'&&typeof e.M.dash==='function'&&e.M.RULES.attackCommit===.12&&e.M.RULES.skillCommit===.18&&e.M.RULES.recastMerge===.25);
  ok('priority order dash > hurt > ultimate > skill > attack > move > idle',e.M.RULES.priority.join(',')==='dead,dash,hurt,ultimate,skill,attack,move,idle');}
 // 규칙 2: 기본 공격 이동 캔슬 경계
 {const e=env();e.step(.05);e.step(.05,{attackAnim:.24});e.step(.05,{attackAnim:.19,moving:true});ok('attack: moving at 0.05s (inside 0.12 commit) → no cancel',e.M.moveCancel('attack')===false);
  e.step(.06,{attackAnim:.13});ok('attack: moving at 0.11s → still committed',e.M.moveCancel('attack')===false);
  e.step(.02,{attackAnim:.11});ok('attack: moving at 0.13s → cancel',e.M.moveCancel('attack')===true);
  e.step(.001,{moving:false});ok('attack: no move input → never cancel',e.M.moveCancel('attack')===false);
  e.step(.01,{moving:true,dashAnim:.18});ok('attack: during dash → dash owns the body, not a move cancel',e.M.moveCancel('attack')===false);}
 // 규칙 2: 스킬 커밋 경계
 {const e=env();e.step(.05);e.step(.05,{skillAnim:.6,moving:true});e.step(.17,{skillAnim:.43});ok('skill: moving at 0.17s → committed',e.M.moveCancel('skill')===false);
  e.step(.02,{skillAnim:.41});ok('skill: moving at 0.19s → cancel to walk',e.M.moveCancel('skill')===true);
  e.step(.001,{moving:false});ok('skill: standing → keeps skill pose',e.M.moveCancel('skill')===false);
  e.step(.01,{skillAnim:0,ultimateAnim:1,moving:true});e.step(.1,{ultimateAnim:.9});ok('ultimate uses skill commit too (0.10s → committed)',e.M.moveCancel('skill')===false);
  e.step(.1,{ultimateAnim:.8});ok('ultimate 0.20s moving → cancel',e.M.moveCancel('skill')===true);}
 // 같은 화면 안에서는 처음 읽은 값을 쓴다(R440 의 가짜 공격 값이 새 공격으로 읽히지 않게)
 {const e=env();e.step(.05);e.__draw=()=>{e.player.attackAnim=.3;e.M.moveCancel('attack');e.player.attackAnim=0;};e.step(.05,{moving:true});e.__draw=null;e.step(.2,{moving:true});ok('fake attack value set during the same draw is not read as a new attack',e.M.moveCancel('attack')===false);}
 // R440 이 스킬을 공격 휘두르기로 보일 때(가짜 공격): 공격 캔슬은 스킬 커밋(0.18초)을 따른다
 {const e=env();e.step(.05);e.step(.05,{skillAnim:.6,moving:true});e.step(.1,{skillAnim:.5});ok('skill-as-swing: 0.10s → attack cancel waits for skill commit',e.M.moveCancel('attack')===false);e.step(.1,{skillAnim:.4});ok('skill-as-swing: 0.20s → attack-swing cancels too',e.M.moveCancel('attack')===true);}
 // 규칙 3: 같은 시전 합치기
 {const e=env();e.step(.05);e.step(.05,{skillAnim:.18});const t0=e.M.castStart();e.step(.1,{skillAnim:.08});e.step(.14,{skillAnim:.18});ok('skill re-rise after 0.24s while active → same cast (no rewind)',e.M.castStart()===t0);
  e.step(.3,{skillAnim:.0});e.step(.05,{skillAnim:.6});ok('new rise after the cast ended → new cast',e.M.castStart()>t0);
  const e3=env();e3.step(.05);e3.step(.05,{skillAnim:.18});const b0=e3.M.castStart();e3.step(.1,{ultimateAnim:1});ok('ultimate right after a skill → its own cast (merge only same kind)',e3.M.castStart()>b0);
  const e2=env();e2.step(.05);e2.step(.05,{skillAnim:.18});const a=e2.M.castStart();e2.step(.26,{skillAnim:.6});ok('re-rise after 0.26s → new cast',e2.M.castStart()>a);}
 // 규칙 4: 대시 방향(화면 좌·우)
 {const e=env();e.step(.05);e.step(.05,{x:1.2,y:0,dashAnim:.26});ok('dash +x world → screen right (e)',e.M.dash()?.side==='e');
  e.step(.3,{dashAnim:0});ok('dash over → null',e.M.dash()===null);
  e.step(.05,{x:1.2,y:1.4,dashAnim:.26});ok('dash +y world → screen left (w)',e.M.dash()?.side==='w');
  e.step(.3,{dashAnim:0});e.step(.05,{x:1.21,y:1.4,dashAnim:.26,moveVX150:-1,moveVY150:0});ok('blocked dash (no displacement) → input direction',e.M.dash()?.side==='w');
  e.step(.3,{dashAnim:0,moveVX150:0});e.step(.05,{dashAnim:.26});ok('blocked dash without input → no side (keep overlay choice)',e.M.dash()?.side==null);}
 // 규칙 5: 멈춘 직후 공격
 {const e=env();e.step(.05,{moving:true});e.step(.05,{moving:true,x:.1});e.step(.05,{moving:false});e.step(.05,{attackAnim:.24});ok('attack started 0.05s after stop beats the walk tail',e.M.attackOverTail()===true);
  const e2=env();e2.step(.05,{moving:true});e2.step(.05,{attackAnim:.24});e2.step(.05,{moving:false,attackAnim:.19});ok('attack started while still moving → tail rules (walk-and-shoot kept)',e2.M.attackOverTail()===false);
  const e3=env();e3.step(.05,{moving:true});e3.step(.05,{moving:false});e3.step(.41,{attackAnim:.24});ok('attack 0.41s after stop → not a tail case',e3.M.attackOverTail()===false);
  const e4=env();e4.step(.05,{moving:true});e4.step(.05,{moving:false});e4.step(.05,{attackAnim:.24,moving:true});ok('moving again → walk keeps priority',e4.M.attackOverTail()===false);}
 // 규칙 1·6: 피격
 {const e=env();e.step(.05);e.step(.05,{attackAnim:.2,hurtAnim:.34});ok('hurt during basic attack → hurt first',e.M.hurtFirst()===true);
  e.step(.001,{skillAnim:.5});ok('hurt during skill → skill armor',e.M.hurtFirst()===false);
  e.step(.001,{skillAnim:0,dashAnim:.2});ok('hurt during dash → dash armor',e.M.hurtFirst()===false);
  const e2=env();e2.step(.05);e2.step(.05,{hurtAnim:.34});e2.step(.12,{hurtAnim:.22});ok('hit reaction may start at 0.12s',e2.M.hurtFresh()===true);e2.step(.01,{hurtAnim:.21});ok('hit reaction refused at 0.13s (late flinch)',e2.M.hurtFresh()===false);}
 // 안전망: 대시 반대쪽을 보는 몸 그림 좌우 뒤집기
 {const mk=(name,mir)=>{const L=290,Rr=310;return{kind:'image',owner:{kind:'hero'},sourcePath:'assets/r130/neon/'+name,image:{src:name},points:mir?[[Rr,40],[L,40],[L,100],[Rr,100]]:[[L,40],[Rr,40],[Rr,100],[L,100]]};};
  const run=(cmds,dx,dy)=>{const e=env();e.step(.05);e.__draw=()=>{for(const c of cmds)e.ctx.commands.push(c);};e.step(.05,{x:dx,y:dy,dashAnim:.26});return cmds;};
  let c=run([mk('actions-v3126-neon-move-right.webp',false)],0,1.2);ok('dash left + move-right art → mirrored around the foot',c[0].r895DashFlip===true&&c[0].points[1][0]<c[0].points[0][0]);
  const foot=300+(0-1.2)*20;ok('mirror axis is the hero foot x',Math.abs((c[0].points[0][0]+c[0].points[1][0])/2-((290+310)/2*-1+2*foot))<1e-6);
  c=run([mk('actions-v3126-neon-move-right.webp',false)],1.2,0);ok('dash right + move-right art → untouched',!c[0].r895DashFlip);
  c=run([mk('walk-e.webp',true)],1.2,0);ok('dash right + mirrored walk-e (faces left) → fixed',c[0].r895DashFlip===true&&c[0].points[1][0]>c[0].points[0][0]);
  c=run([mk('walk-s.webp',false)],0,1.2);ok('front/back art (s) → untouched',!c[0].r895DashFlip);
  const fx={...mk('actions-v3126-neon-move-right.webp',false),sourcePath:'assets/r106/fx/neon-ring-right.webp'};c=run([fx],0,1.2);ok('effects are not bodies → untouched',!c[0].r895DashFlip);}
 // 끄기
 {const e=env();e.M.set('on',false);e.step(.05);e.step(.05,{attackAnim:.24,moving:true});e.step(.2);ok('switch off → no cancels',e.M.moveCancel('attack')===false&&e.M.dash()===null);}
 // 협동 모드에는 끼어들지 않는다
 {const e=env();e.window.__STORYWORLD_COOP_SIM_R62__={mode:()=>'duo'};e.step(.05);e.step(.2,{attackAnim:.24,moving:true});ok('coop → no cancels',e.M.moveCancel('attack')===false);}
}
// R440 와 함께: 이동 캔슬·같은 시전 합치기
{const s440=C('skill-attack-r440.js');ok('R440 asks moveCancel(skill) and castStart',/__STORYWORLD_HERO_MOTION_R895__\?\.moveCancel\?\.\('skill'\)/.test(s440)&&/castStart\(\)/.test(s440)&&s440===RT('skill-attack-r440.js'));
 if(src){const e=env();const seen=[];e.__draw=()=>{e.window.__STORYWORLD_SKILL_ATTACK_R440__.swap();seen.push({sk:e.player.skillAnim,at:e.player.attackAnim});};vm.runInContext(s440,e);
  e.step(.05);e.step(.05,{hero:'seoha',skillAnim:.6});ok('R440: swing shown at cast start',seen.at(-1).sk===0&&seen.at(-1).at>.2);
  e.step(.1,{skillAnim:.5,moving:true});ok('R440: moving inside skill commit keeps the swing',seen.at(-1).sk===0);
  e.step(.1,{skillAnim:.4});ok('R440: moving after 0.18s → swing dropped (walk takes over)',seen.at(-1).sk===.4&&e.player.skillAnim===.4);
  const g=env();const sg=[];g.__draw=()=>{g.window.__STORYWORLD_SKILL_ATTACK_R440__.swap();sg.push(g.player.attackAnim);};vm.runInContext(s440,g);
  g.step(.05);g.step(.05,{hero:'gunner',skillAnim:.18});g.step(.05,{skillAnim:.13});g.step(.05,{skillAnim:.18});ok('R440: skill value re-rising inside 0.25s does not rewind the swing',sg.at(-1)<sg[1]-.09);}}
// 다른 덧씌우기들이 규칙을 묻는지(정적)
{const r119=C('visual-r119.js'),r143=C('attack-anim-r143.js'),r271=C('hwando-r271.js'),r351=C('slayer-r351.js');
 ok('R119: skill walk-cancel and stop-attack tail',/M720\?\.moveCancel\?\.\('skill'\)/.test(r119)&&/M720\?\.attackOverTail\?\.\(\)/.test(r119)&&r119===RT('visual-r119.js'));
 ok('R143: dedicated skill sheets yield to walk after commit',/currentAct\(\);\/\*[^*]*\*\/if\(!\(\(ca==='skill'\|\|ca==='ultimate'\)&&window\.__STORYWORLD_HERO_MOTION_R895__\?\.moveCancel\?\.\('skill'\)\)/.test(r143)&&r143===RT('attack-anim-r143.js'));
 ok('R271 hwando: dash side, dash cuts swing, hurt cuts swing, late hit dropped, commit cancel',/M\?\.dash\?\.\(\)\?\.side/.test(r271)&&/S\.swing=null;\/\* 대시가 공격을 끊는다/.test(r271)&&/M\?\.hurtFirst\?\.\(\)&&S\.hit&&S\.swing/.test(r271)&&/!M\.hurtFresh\(\)/.test(r271)&&/M\.moveCancel\('attack'\)/.test(r271)&&r271===RT('hwando-r271.js'));
 ok('R351 slayer: dash side, dash cuts swing, commit cancel, super-armor documented',/M\?\.dash\?\.\(\)\?\.side/.test(r351)&&/S\.swing=null;\/\* R895 규칙 4/.test(r351)&&/M\.moveCancel\('attack'\)/.test(r351)&&/슈퍼아머/.test(r351)&&r351===RT('slayer-r351.js'));}
console.log(JSON.stringify({ok:fail===0,checks:pass+fail,pass}));if(fail)process.exit(1);
