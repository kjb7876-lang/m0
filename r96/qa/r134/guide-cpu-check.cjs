// R134 CPU check: 길잡이 버그(사용자 2026-10-30) — 길잡이가 출구에서 travel 을 바로 불러 R77 '다음 서사 맵은 노말' 표시를 건너뛰어
// 난이도 선택 창에서 멈추던 것, 그리고 멈춘 직후 걷기 그림이 바탕 상자 밑변을 발로 봐서 아래로 툭 떨어지던 것.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'..','..'),SRC=path.join(ROOT,'client-source'),RT=path.join(ROOT,'runtime-text');
let n=0,failed=0;const check=(name,ok,detail='')=>{n++;if(!ok)failed++;console.log((ok?'PASS ':'FAIL ')+name+(ok||!detail?'':' :: '+String(detail).slice(0,400)));};
const pol=fs.readFileSync(path.join(SRC,'polish-r101.js'),'utf8'),vis=fs.readFileSync(path.join(SRC,'visual-r119.js'),'utf8');
check('runtime copies match client-source',pol===fs.readFileSync(path.join(RT,'polish-r101.js'),'utf8')&&vis===fs.readFileSync(path.join(RT,'visual-r119.js'),'utf8'));
const body=(name)=>{const i=pol.indexOf('function '+name+'(');return i<0?'':pol.slice(i,pol.indexOf('\n',pol.indexOf('\n',i)+1));};
const gi=pol.indexOf('function guideTravel('),rest=pol.slice(0,gi)+pol.slice(pol.indexOf('\n// ',gi));
check('guide exits go through guideTravel (no bare travel(dir) elsewhere in the guide code)',!/[^a-zA-Z]travel\(dir\)/.test(rest)&&(pol.match(/[^ ]guideTravel\(dir\)/g)||[]).length===2);
// guideTravel: arms the R77 normal intent first, cancels it when travel fails
{const i=pol.indexOf('function guideTravel(');const src=pol.slice(i,pol.indexOf('\n// ',i));const log=[];
 const mk=(ok)=>{const sb={zone:'hub',layer:'STORY',stats:{},fail:e=>log.push('fail '+e),window:{__STORYWORLD_GUIDE_R77__:{armNextNormal:(g,z,l)=>{log.push('arm '+g.kind+' '+g.direction+' '+z+' '+l);return 7;},cancelNextNormal:id=>log.push('cancel '+id)}},travel:d=>{log.push('travel '+d);return Promise.resolve(ok);}};vm.createContext(sb);vm.runInContext(src+';this.gt=guideTravel;',sb);return sb;};
 const a=mk(true);a.gt('e');const b=mk(false);b.gt('w');
 setTimeout(()=>{check('guideTravel arms "next story map = normal" before travelling, cancels it if travel fails',JSON.stringify(log)===JSON.stringify(['arm portal e hub STORY','travel e','arm portal w hub STORY','travel w','cancel 7']),JSON.stringify(log));
  check('difficulty watchdog: guide on + no human input for 3 s -> confirm current choice; human input wins',/r71DifficultyConfirm/.test(pol)&&/diffWatch\.input<diffWatch\.openAt&&Date\.now\(\)-diffWatch\.openAt>3000/.test(pol)&&/e\.isTrusted/.test(pol));
  check('walk overlay puts the feet on the projected hero position (not the base sprite box bottom)',/q0=typeof project==='function'\?project\(player\.x,player\.y\)/.test(vis)&&/fy=\(q0\?q0\.y-lift:/.test(vis));
  const c118=fs.readFileSync(path.join(SRC,'combat-r118.js'),'utf8');
  check('combat run never switches the guide on by itself (guide started ON every new game and re-enabled 0.2 s after turning it off)',!/guide!=='undefined'&&!guide\)guide=true/.test(c118)&&/if\(typeof guide==='undefined'\|\|!guide\)return;/.test(c118));
  check('loading a save / continue starts with the guide off',/for\(const fn of \['restoreSave','normalizeSave3'\]\)/.test(pol)&&/guide=false;stats\.guideLoadOff/.test(pol));
  check('guide rests while an area is being entered (late arrival placement used to teleport the hero and make it walk back), with a 4 s safety limit',/enteringNow=\(\)=>entering>0&&Date\.now\(\)-enterAt<4000/.test(pol)&&/try\{if\(enteringNow\(\)\)return;\}/.test(pol)&&/route=\[\];command=null;guideTimer=0;stats\.guideReplans/.test(pol));
  check('waypoints within one step are skipped (the hero used to stop one frame on every 0.25-tile waypoint)',/const step=SPEED\*dt\+\.04;let n=0;while\(route\.length>1&&n<4/.test(pol));
  check('compass exit sealed by an enemy pack: guide fights the R75 pack goal instead of retrying the closed door',/function chasePackGoal\(g\)/.test(pol)&&(pol.match(/if\(chasePackGoal\(g\)\)return;/g)||[]).length===2);
  check('workflow runs this check',fs.readFileSync(path.join(ROOT,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r134/guide-cpu-check.cjs'));
  console.log((failed?'FAIL ':'PASS ')+(n-failed)+'/'+n+' r134 guide checks');process.exit(failed?1:0);},20);}
