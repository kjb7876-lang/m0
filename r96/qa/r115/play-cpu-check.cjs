// R115 CPU checks: 전투·화면 다듬기(play-r115.js)와 그에 맞춘 기존 오버레이 수정. 브라우저 없이 소스와 순수 함수를 본다.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const SRC=path.join(__dirname,'..','..','client-source'),read=f=>fs.readFileSync(path.join(SRC,f),'utf8');
const results=[];const check=(name,ok,detail='')=>{results.push({name,ok:!!ok,detail});console.log((ok?'PASS ':'FAIL ')+name+(ok||!detail?'':' :: '+detail));};
const P=read('play-r115.js');
for(const f of ['play-r115.js','play-r113.js','polish-r101.js','fx-d2s-r106.js','vfx-r98.js','hero-fx-r102.js','samong-zones-r115.js'])
 {let ok=true,err='';try{new vm.Script(read(f),{filename:f});}catch(e){ok=false;err=String(e);}check(f+' parses',ok,err);}
const html=fs.readFileSync(path.join(SRC,'..','runtime-text','index.html'),'utf8');
check('play-r115 loads after cinema-r114 (last combat overlay)',html.indexOf('play-r115.js')>html.indexOf('cinema-r114.js')&&html.indexOf('cinema-r114.js')>0);
check('zone data loads before the zone module',html.indexOf('samong-zones-r115-data.js')>0&&html.indexOf('samong-zones-r115-data.js')<html.indexOf('samong-zones-r115.js"'));
// ① 타격 중심
check('enemy draw measures the drawn body (opaque box, transform-mapped)',/function opaqueBox/.test(P)&&/getImageData/.test(P)&&/inverse\(\)\.multiply/.test(P));
check('hero hit FX use the measured centre',/centreOf\?\.\(e\.tgt\)/.test(read('polish-r101.js'))&&/tgt:e/.test(read('polish-r101.js'))&&/__STORYWORLD_PLAY_R115__\?\.place\?\./.test(read('fx-d2s-r106.js'))&&/centreOf\?\.\(e\.target\)/.test(read('vfx-r98.js'))&&/e568HeroImpact'&&f\.targetIdE568/.test(P));
// place() 수학: 발밑에서 z/키 비율만큼 실제 그림 높이로
{const sb={window:{},localStorage:{getItem:()=>null,setItem(){}},document:{getElementById:()=>null,head:{appendChild(){}},createElement:()=>({})},tick(){},drawEnemy(){},DOMPoint:class{constructor(x,y){this.x=x;this.y=y;}},console,Math,JSON,Object,Array,Number,String,Boolean,Set,Map,WeakMap,WeakSet,RegExp,Error};
 sb.window=sb;vm.createContext(sb);vm.runInContext(P,sb);const A=sb.__STORYWORLD_PLAY_R115__;check('module exposes centreOf/place/sinkOf',A&&typeof A.place==='function'&&typeof A.sinkOf==='function');
 check('props sink 4–6%, wall-hung/door/chest/record markers never sink',A.sinkOf({id:'prop:statue:1'},{})>=.04&&A.sinkOf({id:'prop:statue:1'},{})<=.06&&A.sinkOf({id:'wall-torch:3'},{})===0&&A.sinkOf({id:'x'},{samongR103:'record'})===0&&A.sinkOf({id:'r115:door'},{})===0);}
check('play-r113 grounding buries the base (crops the source rect under the ground line)',/sinkOf\?\.\(owner,p\)/.test(read('play-r113.js'))&&/c\.sourceRect=\[r\[0\],r\[1\],r\[2\],r\[3\]\*sink\.keep\]/.test(read('play-r113.js')));
// ② 보스 조준
check('boss floor attacks: one of each new batch aims at the hero\'s lead position',/function aimTick/.test(P)&&/major\(o\)/.test(P)&&/best\.x=px;best\.y=py/.test(P));
// ③ 보조
check('semi-auto/guide dodges telegraphs, ranged kite, melee side-step, W/E/R auto',/inThreat\(player\.x,player\.y/.test(P)&&/stats\.kites\+\+/.test(P)&&/stats\.sidesteps\+\+/.test(P)&&/wer\.cast\(slot,true\)/.test(P)&&/!steering\(\)/.test(P));
check('assist never overrides the player\'s own movement and never steers in co-op',/steering\(\)/.test(P)&&/solo\(\)/.test(P));
check('guide presses E on arrival at clue/statement/door, never while the player steers',/function reachTick/.test(P)&&/g\.kind!=='objective'&&g\.kind!=='exit'/.test(P)&&/steering\(\)\)return;if\(!room\?\.samongR103\)/.test(P));
// ④ 간격
check('mobs keep a size-based gap, bosses/patrols untouched',/rad\(a\)\+rad\(b\)\+\.42/.test(P)&&/!major\(e\)&&!e\.samongPatrolR115/.test(P));
// ⑥ 빛
check('shadows fall behind objects (light from the viewer)',/y-len\*\.42\*\.55/.test(P)&&/frontLight/.test(P));
// ⑦ 사몽선
check('사몽 lines: 3 in 4 rerouted through dense clusters, weighted, rest random',/r<\.25\)continue/.test(P)&&/Math\.pow\(c\.n,1\.4\)/.test(P)&&/runs\.length=0;runs\.push/.test(P));
// ⑧ 강화 모음
check('skill-upgrade collection: groups, levels, +1 buttons, tier/W/E/R bars, view toggle',/스킬 강화 모음/.test(P)&&/data-r115up/.test(P)&&/data-r115view/.test(P)&&/r115bar/.test(P));
// ⑨ 벽
check('non-samong walls: varied heights, walls beside doors stand above the door',/DOOR\+\.45/.test(P)&&/L\.samongR103\|\|L\.samongR115/.test(P));
// R102 바닥 연출 병용
check('first ground-changing skill FX kept alongside D2S (mixed by situation)',/r115Mix/.test(read('hero-fx-r102.js'))&&/n>=3\|\|t>=5/.test(read('hero-fx-r102.js')));
// 방향
check('facing: bosses face the hero across 2× rooms',/major\(e\)\?22:10/.test(read('play-r113.js')));
check('no damage/HP/cooldown numbers changed by play-r115',!/\.damage\s*=|maxHp\s*=|CD\s*=/.test(P));
const failed=results.filter(r=>!r.ok);console.log(JSON.stringify({checks:results.length,failed:failed.length}));process.exitCode=failed.length?1:0;
