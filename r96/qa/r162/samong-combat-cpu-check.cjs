// R162 CPU check: 사몽 전투 위주 재구성(사용자 2026-10-31) — 탐색 에피소드당 1번, 버티기 없음, 처치 66·666, 장마다 B(광장 666 + 중간보스 6)·D(정화의 코어 666),
// 단서는 단서조각(쪽지), 보스 패턴에 분신 6·운석·촉수. 원문 단서 문단은 하나도 빠지지 않는다. 브라우저 없이 실제 모듈을 돌린다.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),SRC=path.join(R,'client-source'),C=f=>fs.readFileSync(path.join(SRC,f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const atlas={path:'a.webp',width:8,height:8,sha256:'0',styles:{garden:{floorRect:[0,0,1,1],wallRect:[0,0,1,1]},domestic:{floorRect:[0,0,1,1],wallRect:[0,0,1,1]},clinical:{floorRect:[0,0,1,1],wallRect:[0,0,1,1]},forge:{floorRect:[0,0,1,1],wallRect:[0,0,1,1]}}};
function load(reshape){const sb={console,Math,JSON,Date,Set,Map,Object,Array,Number,String,Boolean,Symbol,Error,performance:{now:()=>0},matchMedia:()=>({matches:false}),setTimeout,clearTimeout,
  StoryArtR74:{atlases:{materials:atlas}},document:{getElementById:()=>null,querySelector:()=>null,createElement:()=>({style:{}}),head:{appendChild(){}}},localStorage:{getItem:k=>k==='storyworld.r162.samong'?JSON.stringify({reshape}):null,setItem(){}}};
 sb.window=sb;vm.createContext(sb);for(const f of ['samong-text-r103.js','samong-zones-r115-data.js','samong-zones-r115.js','samong-r103.js'])vm.runInContext(C(f),sb,{filename:f});return sb;}
for(const f of ['samong-zones-r115.js','samong-r103.js','samong-play-r162.js','samong-mood-r123.js'])ok(f+' runtime copy matches',fs.readFileSync(path.join(R,'runtime-text',f),'utf8')===C(f));
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');ok('samong-play-r162.js loads after samong-r103 and samong-zones-r115',html.indexOf('samong-play-r162.js')>html.indexOf('samong-zones-r115.js')&&html.indexOf('samong-play-r162.js')>html.indexOf('samong-r103.js'));
const base=load(false),sb=load(true),Z=sb.__STORYWORLD_SAMONG_ZONES_R115__,SM=sb.__STORYWORLD_SAMONG_R103__,Z0=base.__STORYWORLD_SAMONG_ZONES_R115__;
ok('modules load, reshape on by default / off by setting',Z?.r162===true&&Z0?.r162===false);
const ch=Object.entries(Z.chapters),all=ch.flatMap(([,l])=>l);
ok('every episode keeps at most one explore (map-search) zone',ch.every(([k,l])=>l.filter(z=>z.kind==='explore').length<=1),ch.map(([k,l])=>k+':'+l.filter(z=>z.kind==='explore').length).join(' '));
ok('every episode has exactly one B (광장) and one D (정화의 코어) zone',ch.every(([k,l])=>l.filter(z=>z.mode==='B').length===1&&l.filter(z=>z.mode==='D').length===1),ch.map(([k,l])=>k+':'+l.filter(z=>z.mode==='B').length+'/'+l.filter(z=>z.mode==='D').length).join(' '));
ok('no hold (버티기) goals remain, no hazard-only fights, no hold before statements',all.every(z=>!z.goal?.hold&&!z.hazards&&!z.solve?.hold));
ok('combat kill goals are only 66 or 666; B and D are 666',all.filter(z=>z.kind==='combat').every(z=>[66,666].includes(z.goal?.kills))&&all.filter(z=>z.mode).every(z=>z.goal.kills===666));
ok('P-2 (뿌리 666, lead boss) became the P chapter B zone',Z.zone('sz115-P-2')?.mode==='B'&&!!Z.zone('sz115-P-2').lead);
ok('B/D zones sit right before the last confront (or at the end)',ch.every(([k,l])=>{const last=l.map(z=>z.kind).lastIndexOf('confront'),d=l.findIndex(z=>z.mode==='D');return last<0?d===l.length-1:d===last-1;}));
const clueKey=z=>(z.clues||[]).map(c=>c.key+'|'+c.sub).join(';');const before=Object.values(Z0.chapters).flat().map(clueKey).join('#'),after=all.filter(z=>!z.r162New).map(clueKey).join('#');
ok('every original clue paragraph is still in the game (same anchors, same order)',before===after&&before.length>100);
ok('combat zones with clues hand them out as 단서조각 (fragments), explore keeps placed clue boxes',all.filter(z=>z.kind==='combat'&&(z.clues||[]).length).every(z=>z.r162Frag)&&all.filter(z=>z.kind==='explore').every(z=>!z.r162Frag));
ok('zone ids unique; old R115 ids all still resolve (saves keep working)',new Set(all.map(z=>z.id)).size===all.length&&Object.values(Z0.chapters).flat().every(z=>Z.zone(z.id)));
// layouts of the new zones
let bad=[];for(const[k,l]of ch){const ei=SM.episodes.findIndex(e=>e.key===k);for(const z of l.filter(z=>z.mode)){let L=null;try{L=SM.layoutFor(ei,Z.stageOf(z),z.id);}catch(e){bad.push(z.id+':'+e);continue;}
 const cells=new Set(L.floorCells.map(([x,y])=>x+':'+y)),on=p=>p&&cells.has(Math.floor(p.x)+':'+Math.floor(p.y));
 if(!on(L.entry))bad.push(z.id+':entry');if(z.mode==='D'){const X=L.samongR103;if(!on(X.core))bad.push(z.id+':core');if(!on(X.top))bad.push(z.id+':top');
  const top=Math.min(...L.floorCells.map(([a,b])=>a+b)),bot=Math.max(...L.floorCells.map(([a,b])=>a+b));if(bot-top<30)bad.push(z.id+':short '+(bot-top));if(X.core.x+X.core.y<bot-6)bad.push(z.id+':core not at the bottom');}
 if(z.mode==='B'&&L.floorCells.length<700)bad.push(z.id+':plaza small '+L.floorCells.length);}}
ok('every B plaza is wide and every D lane runs top→bottom with the core on its bottom end',!bad.length,bad.slice(0,6).join(' '));
const r103=C('samong-r103.js');
ok('B: midboss every 111 kills, 6 in all',/S\.kills<\(x\.r162Mid\+1\)\*111/.test(r103)&&/x\.r162Mid>=6/.test(r103));
ok('D: enemies spawn on the lane top, leak into the core (66), core loss restarts the zone',/const CORE_R162=66/.test(r103)&&/function defenseR162/.test(r103)&&/S\.kills=0;c\.hp=c\.max/.test(r103));
ok('boss pattern lists gain 분신 6 · 운석 · 촉수',(()=>{try{const f=new Function('window',r103.match(/ function R162P\(list\)\{[^\n]*\n/)[0]+';return R162P;');const P=f({});const out=P(['sky','ground']);return ['clones','meteor','tentacles'].every(k=>out.includes(k))&&out.includes('sky');}catch(e){return false;}})());
ok('clones pattern has exactly 6 shadows',/for\(let k=0;k<6;k\+\+\)\{const a=k\*Math\.PI\/3/.test(r103));
const play=C('samong-play-r162.js');
ok('fragments drop at goal/(clues+1) steps and are picked up by walking over them',/Math\.ceil\(G\*\(i\+1\)\/\(N\+1\)\)/.test(play)&&/<1\.1\)\{const i=clues\.findIndex/.test(play));
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
