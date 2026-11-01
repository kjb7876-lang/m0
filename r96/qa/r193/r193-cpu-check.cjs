// R193 CPU check: S-01(봉합부인 구역) 꿰맨 인형 장식 → 원거리 몹(최대 3), 다른 구역 불변, 기존 드라이브 자산 재사용.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const idx=RT('index.html');
ok('samong-doll-r193 loads after era-r191, before combat-r118',idx.indexOf('./samong-doll-r193.js')>idx.indexOf('./era-r191.js')&&idx.indexOf('./samong-doll-r193.js')<idx.indexOf('./combat-r118.js'));
ok('runtime copy matches',RT('samong-doll-r193.js')===C('samong-doll-r193.js'));
ok('in the public verify list',/'samong-doll-r193\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
ok('reuses the existing Drive doll art (no new generated asset)',fs.existsSync(path.join(R,'runtime-text','assets','r105','drive','prop-doll.webp'))&&/assets\/r105\/drive\/prop-doll\.webp/.test(C('samong-doll-r193.js')));
const sb={window:{},localStorage:{getItem:()=>null,setItem(){}},setTimeout:()=>0};vm.createContext(sb);vm.runInContext(C('samong-doll-r193.js'),sb);const D=sb.window.__STORYWORLD_SAMONG_DOLL_R193__;
const mk=zone=>({samongR103:{zone},props:[{id:'d1',x:5,y:5,r123Deco:{kind:'doll'}},{id:'d2',x:8,y:8,r123Deco:{kind:'doll'}},{id:'f',x:1,y:1,r123Deco:{kind:'frame'}}],enemies:[{id:'sm103:k:m:1',name:'잔영',hp:100,maxHp:100,type:'melee',ai:'hybrid',weapon:'heavy',combatProfile:{preferredRange:3.6},profile:{ai:'hybrid',weapon:'heavy',combatProfile:{preferredRange:3.6}}},{id:'b',boss:true,hp:900,maxHp:900,combatProfile:{}}]});
const r=mk('sz115-S01-2');D.make(r);const dolls=r.enemies.filter(e=>e.r193Doll);
ok('S-01: one ranged doll per doll decoration, at its spot; decorations removed, others kept',dolls.length===2&&dolls[0].x===5&&dolls[1].y===8&&r.props.length===1&&r.props[0].id==='f');
ok('dolls are ranged (type/ai/weapon ranged, preferred range 5.2 like engine ranged mobs), 80% donor hp, named 꿰맨 아기 인형',dolls.every(e=>e.type==='ranged'&&e.ai==='ranged'&&e.weapon==='ranged'&&e.combatProfile.preferredRange===5.2&&e.maxHp===80&&e.name==='꿰맨 아기 인형'));
ok('donor and boss untouched',r.enemies[0].type==='melee'&&r.enemies[0].hp===100&&r.enemies[1].hp===900);
const o=mk('sz115-S02-4');D.make(o);ok('other samong zones untouched',!o.enemies.some(e=>e.r193Doll)&&o.props.length===3);
D.make(r);ok('idempotent per room',r.enemies.filter(e=>e.r193Doll).length===2);
// R197 (Codex 리뷰): 몹이 아직 없을 때 방을 끝내 버리지 않음 / 몸 그림은 frameFor 로만 바꿈(drawEnemy 를 대신하지 않음 → 기록기 범위·체력바·대상 표시 유지)
{const e0=mk('sz115-S01-3'),saved=e0.enemies;e0.enemies=[];D.make(e0);const none=e0.enemies.length===0&&e0.props.length===3;e0.enemies=saved;D.make(e0);
 ok('room entered before mobs spawn (intro open) is retried and gets its dolls once mobs exist',none&&e0.enemies.filter(e=>e.r193Doll).length===2);}
{const sb2={window:{__STORYWORLD_STORY_COMBAT_R54__:Object.freeze({frameFor:(e,f)=>({path:'base',e})})},localStorage:{getItem:()=>null,setItem(){}},setTimeout:()=>0,player:{x:0,y:0},drawEnemy:function orig(){}};
 vm.createContext(sb2);const orig=sb2.drawEnemy;vm.runInContext(C('samong-doll-r193.js'),sb2);const S=sb2.window.__STORYWORLD_STORY_COMBAT_R54__;
 const fd=S.frameFor({r193Doll:true,hp:5,x:3,y:1},null),fn=S.frameFor({hp:5},null);
 ok('doll body comes from the frameFor chain (engine draws it: recorder scope, hp bar, target mark kept); drawEnemy is not replaced',sb2.drawEnemy===orig&&fd.path==='assets/r105/drive/prop-doll.webp'&&fd.assetFrame.sourceRect[2]===259&&fn.path==='base'&&!/drawEnemy\s*=/.test(C('samong-doll-r193.js')),{fd:fd.path,fn:fn.path});}
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
