// R440 CPU 검사: 스킬·궁극기 중 영웅 몸 그림 덧씌우기들이 '공격 중'을 보도록 잠깐 바꾸고, drawHero 가 끝나면 원래 값으로 되돌리는지.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
const src=C('skill-attack-r440.js');ok('runtime copy matches source',src===RT('skill-attack-r440.js'));
try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax '+e.message,false);}
const html=RT('index.html');ok('script tag once, right after combat-flow-r425 and before combat-r118',html.split('"./skill-attack-r440.js"').length===2&&/<script src="\.\/combat-flow-r425\.js"><\/script>(?:<script src="\.\/perf-r441\.js"><\/script>)?<script src="\.\/skill-attack-r440\.js"><\/script>(?:<script src="\.\/enemy-skill-pose-r442\.js"><\/script>)?(?:<script src="\.\/weather-r450\.js"><\/script><script src="\.\/local-light-r451\.js"><\/script><script src="\.\/ground-fringe-r452\.js"><\/script><script src="\.\/actor-tone-r453\.js"><\/script>)?\s*<script src="\.\/combat-r118\.js">/.test(html));
ok('listed in verify-r96-public.py',/'skill-attack-r440\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
const a143=C('attack-anim-r143.js');ok('R143 inner hook calls swap before its own wrapper',/__STORYWORLD_SKILL_ATTACK_R440__\?\.swap\?\.\(\)/.test(a143)&&a143.indexOf('R440_SKILL_ATTACK_R440__')<0&&a143.indexOf('SKILL_ATTACK_R440__?.swap')<a143.indexOf('const base=drawHero;drawHero=function(...a){const rec='));
ok('R143 exposes actSheet',/actSheet,/.test(a143)&&a143===RT('attack-anim-r143.js'));
ok('no gameplay writes (damage/save/cooldown keys)',!/\.damage\s*=|saveGame|specialCD\s*=|blinkCD\s*=|ready\[/.test(src));
// 가짜 전역으로 돌리기
function env(){const seen=[];const e={window:{},localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>0},time:10,player:{hero:'neon',hp:10,skillAnim:0,ultimateAnim:0,attackAnim:0,attackCD:.5,dashAnim:0,guard:false},console};
 e.drawHero=function(){if(e.window.__STORYWORLD_SKILL_ATTACK_R440__)e.window.__STORYWORLD_SKILL_ATTACK_R440__.swap();seen.push({sk:e.player.skillAnim,ul:e.player.ultimateAnim,at:e.player.attackAnim,cd:e.player.attackCD});};
 vm.createContext(e);vm.runInContext(src,e);e.seen=seen;return e;}
{const e=env();vm.runInContext('player.skillAnim=.6;drawHero();',e);const s=e.seen[0];ok('skill: overlays see attack (skill 0, attack>0, cd=SWING)',s.sk===0&&s.at>0.2&&Math.abs(s.cd-.3)<1e-9);
 ok('restored after drawHero',e.player.skillAnim===.6&&e.player.attackAnim===0&&e.player.attackCD===.5);
 vm.runInContext('time=10.2;player.skillAnim=.4;drawHero();',e);ok('attack value counts down (one swing)',Math.abs(e.seen[1].at-.1)<1e-6);
 vm.runInContext('time=10.5;player.skillAnim=.1;drawHero();',e);ok('then holds last frame',e.seen[2].at>0&&e.seen[2].at<.01);
 vm.runInContext('time=10.55;player.skillAnim=.6;drawHero();',e);ok('new cast restarts the swing',e.seen[3].at>.29);}
{const e=env();vm.runInContext('player.ultimateAnim=1.05;drawHero();',e);ok('ultimate: slower swing (ULT)',e.seen[0].ul===0&&Math.abs(e.seen[0].at-.42)<1e-9&&e.player.ultimateAnim===1.05);}
{const e=env();vm.runInContext('player.skillAnim=.6;player.dashAnim=.2;drawHero();',e);ok('dash skills keep dash motion',e.seen[0].sk===.6);}
{const e=env();vm.runInContext('player.skillAnim=.6;player.guard=true;drawHero();',e);ok('guard untouched',e.seen[0].sk===.6);}
{const e=env();vm.runInContext('player.skillAnim=.6;player.ego=1;drawHero();',e);ok('EGO/samong forms untouched',e.seen[0].sk===.6);}
{const e=env();e.window.__STORYWORLD_ATTACK_ANIM_R143__={actSheet:()=>true};vm.runInContext('player.skillAnim=.6;drawHero();',e);ok('R201 dedicated skill sheet direction kept',e.seen[0].sk===.6);}
{const e=env();e.window.__STORYWORLD_COOP_SIM_R62__={mode:()=>'duo'};vm.runInContext('player.skillAnim=.6;drawHero();',e);ok('coop untouched',e.seen[0].sk===.6);}
{const e=env();vm.runInContext('player.skillAnim=.6;player.attackAnim=.2;drawHero();',e);ok('real basic attack during skill keeps its own value',e.seen[0].at===.2&&e.player.attackAnim===.2);}
{const e=env();e.drawHero=function(){e.window.__STORYWORLD_SKILL_ATTACK_R440__.swap();throw new Error('x');};vm.runInContext(src.replace("if(window.__STORYWORLD_SKILL_ATTACK_R440__)return;",''),e);let threw=false;try{vm.runInContext('player.skillAnim=.6;drawHero();',e);}catch(_){threw=true;}ok('restores even when drawHero throws',threw&&e.player.skillAnim===.6);}
{const e={window:{},localStorage:{getItem:()=>'{"on":false}',setItem(){}},performance:{now:()=>0},time:1,player:{hero:'neon',hp:10,skillAnim:.6,attackAnim:0}};e.drawHero=function(){e.window.__STORYWORLD_SKILL_ATTACK_R440__.swap();e.v=e.player.skillAnim;};vm.createContext(e);vm.runInContext(src,e);vm.runInContext('drawHero()',e);ok('can be switched off',e.v===.6);}
console.log(JSON.stringify({ok:fail===0,checks:pass+fail,pass}));if(fail)process.exit(1);
