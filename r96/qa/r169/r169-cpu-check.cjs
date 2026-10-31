// R169 CPU check: 오라 무한강화 비용 = 다음 단계², 강화 통합 창, EGO 중첩(중첩당 +7%·DREAM 횟수), 서사 → 기억 쪽지, 길 위 장식 숨기기, 적 레벨별 패시브 조각.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
for(const f of ['upgrades-r169.js','play-r169.js','play-r115.js','story-batch-r139.js','samong-play-r162.js','samong-r161.js'])ok(f+' runtime copy matches',fs.readFileSync(path.join(R,'runtime-text',f),'utf8')===C(f));
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
ok('upgrades-r169 loads before play-r115 (the skill book reads its cards), play-r169 loads',html.indexOf('upgrades-r169.js')>0&&html.indexOf('upgrades-r169.js')<html.indexOf('play-r115.js')&&html.includes('<script src="./play-r169.js"></script>'));
const store={getItem(){return null;},setItem(){}};
const el=()=>({style:{},hidden:false,innerHTML:'',textContent:'',children:[],appendChild(c){this.children.push(c);return c;},setAttribute(){},getBoundingClientRect:()=>({bottom:0}),insertAdjacentHTML(){},insertAdjacentElement(){},querySelector:()=>null,querySelectorAll:()=>[]});
const doc={getElementById:()=>null,createElement:el,head:el(),body:el(),querySelector:()=>null,querySelectorAll:()=>[]};

// ---- 오라 비용 ---------------------------------------------------------------------------------
{const player={hero:'hwando',points:100};const ranks={egoAura:0,endlessPower:2,threadDanceR63:3,threadCrossR64:0};
 const defs=[{id:'egoAura'},{id:'endlessPower'},{id:'threadDanceR63'},{id:'threadCrossR64',cost:1,maxRank:1}];
 const sb={window:{__STORYWORLD_PROGRESSION_R62__:{defs,ranks:(id)=>ranks[id]||0}},localStorage:store,document:doc,player,showUpgrades(){},Math,JSON,String,Object,Number,Set};
 vm.createContext(sb);vm.runInContext(C('upgrades-r169.js'),sb);const U=sb.window.__STORYWORLD_UPGRADES_R169__;
 ok('aura endless upgrades cost (rank+1)²: rank 0 → 1, rank 2 → 9',defs[0].cost===1&&defs[1].cost===9,[defs[0].cost,defs[1].cost]);
 ranks.egoAura=6;ok('cost follows the current rank (rank 6 → 49)',defs[0].cost===49);
 ok('silver-thread dance and one-time motifs keep their old cost',defs[2].cost===undefined&&defs[3].cost===1&&!U.squared().includes('threadDanceR63'));
 U.set({square:false});ok('storyworld.r169.upgrades {square:false} restores 1 point',defs[0].cost===1);}
// 효과 상향: k단계 효과 = 기본 × k (누적 T(n)=n(n+1)/2)
{const player={hero:'hwando',points:0,level:1,upgrades:{},attackCD:0,specialCD:0,samong:0,samongCD:0};const ranks={endlessPower:10,egoAura:0,endlessWard:0,endlessVital:0,endlessHaste:4,endlessCooldown:0,endlessResonance:0,dreamAura:0};let dmg=0;
 const sb={window:{__STORYWORLD_PROGRESSION_R62__:{defs:[{id:'endlessPower',text:'t'}],ranks:(id)=>ranks[id]||0}},localStorage:store,document:doc,player,showUpgrades(){},time:0,
  attackPower:()=>100*(1+.02*ranks.endlessPower),hurt:d=>{dmg=d;},gainResonance(){},basicAttack(){player.attackCD=1;},awaken(){player.samong=7;player.samongCD=77;},UPGRADES:[{id:'vital'}],Math,JSON,String,Object,Number,Set};
 vm.createContext(sb);vm.runInContext(C('upgrades-r169.js'),sb);const U=sb.window.__STORYWORLD_UPGRADES_R169__;
 ok('aura effect grows with rank: 끝없는 의지 10단계 = +2% × 55 = ×2.10 (was ×1.20)',Math.abs(sb.attackPower()-210)<1e-9,sb.attackPower());
 sb.basicAttack();const t4=.28+.72/(1+.04*10),t1=.28+.72/(1+.04*4);ok('이어지는 검결 4단계 uses the 10-rank interval formula',Math.abs(player.attackCD-t4/t1)<1e-9,player.attackCD);
 ranks.endlessWard=3;ranks.endlessVital=2;sb.hurt(100);const w=(n)=>1-.3*n/(n+40);ok('ward 3 → 6-rank reduction, vital 2 → 3-rank (R71 HP 777: less damage taken)',Math.abs(dmg-100*w(6)/w(3)*(260+36)/(260+54))<1e-9,dmg);
 ok('the R169 note is appended to the aura text once',sb.window.__STORYWORLD_PROGRESSION_R62__.defs[0].text.endsWith('〕')&&U.TRI(10)===55);
 U.set({boost:false});ok('{boost:false} turns the boost off',sb.attackPower()===100*(1+.02*10));}
ok('the merged window adds Z·X·C (buyProc) and 일반강화 cards, the skill book groups them',/r169proc:/.test(C('upgrades-r169.js'))&&/buyProc\(id\)/.test(C('upgrades-r169.js'))&&/'Z·X·C 스킬강화',\/\^r169proc\//.test(C('play-r115.js'))&&/'일반강화',\/\^r169up\//.test(C('play-r115.js'))&&/b\.dataset\.r169/.test(C('play-r115.js')));

// ---- play-r169 -------------------------------------------------------------------------------
let t=0;const toasts=[];const floor=[];for(let x=0;x<20;x++)for(let y=4;y<7;y++)floor.push([x,y]);for(let y=0;y<12;y++)floor.push([10,y]);
const room={id:'ep1a09',kills:0,props:[],enemies:[],passivePointDropsR64:[],exploration:{floorCells:floor,entry:{x:.5,y:5.5}},objective:{x:19.5,y:5.5}};
const player={x:.5,y:5.5,hp:100,ego:0,egoCD:0,egoCount:0,samong:0,resonance:100,points:0};const claims={};let awakened=0;
let pending=[{key:'STORY:ep1a09:pre:0',id:'ep1a09',title:'주사실',narrator:'환도',text:'첫 문단.\n\n둘째 문단.'}];
const sb={window:{__STORYWORLD_STORY_BATCH_R139__:{pending:()=>pending.slice(),take:k=>{const i=pending.findIndex(s=>s.key===k);return i<0?null:pending.splice(i,1)[0];}},
  __STORYWORLD_PROGRESSION_R62__:{state:()=>({pointDropClaimsR64:claims}),mapLevel:()=>9}},
 localStorage:store,document:doc,setInterval:()=>0,performance:{now:()=>0},room,player,started:true,modal:false,loading:false,layer:'STORY',regionById:{ep1a09:{title:'주사실',exits:{}}},
 effects:[],toast:m=>toasts.push(m),sound(){},fx(){},saveGame(){},VFX:{aura:'a'},
 awaken(){awakened++;player.samong=7;player.ego=0;},
 ego(){if(player.egoCD>0||player.ego>0||player.samong>0)return;if(player.resonance<30)return;player.resonance-=30;player.ego=3;player.egoCD=6;if(sb.layer==='DREAM'){player.egoCount=Math.min(7,player.egoCount+1);if(player.egoCount===7){player.pending=true;sb.awaken('seven');}}},
 attackPower:()=>(player.ego>0?1.55:1)*100,updateHUD(){},killEnemy(e){e.deadRecorded=true;e.hp=0;if(e.drop)room.passivePointDropsR64.push({id:'r64:1:drop:'+e.id,amount:e.drop,x:e.x,y:e.y});},drawProp(){},drawEffect(){},tick(){},async enterRegion(){return true;},
 blocked:()=>false,Math,JSON,String,Object,Number,Date,Promise,Map,Set,WeakMap,Array};
Object.defineProperty(sb,'time',{get:()=>t});vm.createContext(sb);vm.runInContext(C('play-r169.js'),sb);const P=sb.window.__STORYWORLD_PLAY_R169__;
// EGO 중첩
sb.ego();const a1=sb.attackPower();t+=.5;sb.ego();const a2=sb.attackPower();
ok('EGO pressed again while active stacks (2) and costs 30 resonance',P.inspect().stack===2&&player.resonance===40,[P.inspect().stack,player.resonance]);
ok('each extra stack adds only +7% on top of EGO (×1.07)',Math.abs(a2/a1-1.07)<1e-9,a2/a1);
for(let i=0;i<8;i++){t+=.5;player.resonance=100;sb.ego();}ok('stacks stop at 7 (EGO +42%)',P.inspect().stack===7&&Math.abs(sb.attackPower()/a1-1.42)<1e-9,P.inspect().stack);
player.ego=0;vm.runInContext('tick()',sb);ok('stacks reset when EGO ends',player.egoStackR169===0);
sb.layer='DREAM';player.egoCD=0;player.egoCount=0;player.resonance=100;sb.ego();for(let i=0;i<6;i++){t+=.5;player.resonance=100;sb.ego();}
ok('in DREAM every stack also counts toward the 7 EGO uses, so 사몽 opens sooner',player.egoCount===7&&awakened===1,[player.egoCount,awakened]);
sb.layer='STORY';player.samong=0;player.ego=0;
// 기억 쪽지
t+=45;vm.runInContext('tick()',sb);const note=room.props.find(p=>p.r169Note);
ok('a deferred story scene drops as a 기억 쪽지 during combat',!!note&&note.noteKey==='STORY:ep1a09:pre:0');
player.x=note.x;player.y=note.y;vm.runInContext('tick()',sb);
ok('walking onto it picks it up, takes it out of the batch queue and keeps it in 쪽지 모음',!room.props.some(p=>p.r169Note)&&pending.length===0&&P.book().length===1&&P.book()[0].place==='주사실',P.book());
pending.push({key:'STORY:ep1a09:after:1',id:'ep1a09',title:'정리',text:'정리 서사'});vm.runInContext('tick()',sb);pending.length=0;vm.runInContext('tick()',sb);
ok('scenes shown by the closing batch instead are still kept in 쪽지 모음',P.book().length===2);
P.collect({key:'r162:z:0',title:'단서조각 1 / 3 · 봉합 정원',text:'단서'});ok('R162 clue notes join the same 쪽지 모음',P.book().length===3&&/window\.__STORYWORLD_PLAY_R169__\?\.collect\(/.test(C('samong-play-r162.js')));
// 길 위 장식
room.props.push({id:'d1',path:'assets/props/v290/dead_tree.webp',x:5.5,y:5.5,visible:true},{id:'d2',path:'assets/props/v290/dead_tree.webp',x:10.5,y:10.5,visible:true},{id:'c1',path:'assets/props/crate.webp',x:6.5,y:5.5,visible:true},{id:'k1',path:'x.webp',x:7.5,y:5.5,r115Clue:'a',visible:true});
t+=1;vm.runInContext('tick()',sb);const by=id=>room.props.find(p=>p.id===id);
ok('decor standing on the entry→objective path is hidden; decor off the path stays',by('d1').visible===false&&by('d2').visible===true,[by('d1').visible,by('d2').visible]);
ok('crates and clues on the path are never hidden',by('c1').visible===true&&by('k1').visible===true);
ok('pathCells joins entry and objective through the corridor',(()=>{const s=P.pathCells(room);return s&&s.has('0,5')&&s.has('19,5')&&!s.has('10,11');})());
// 적 레벨별 패시브 조각
const foe={id:'f1',hp:5,x:3,y:5,levelR62:21,drop:4};room.enemies.push(foe);sb.killEnemy(foe);claims['r64:1:drop:f1']=true;const p0=player.points;vm.runInContext('tick()',sb);
ok('a point orb from a Lv.21 foe gives 4 × (1 + ⌊21/7⌋) = 16: base 4 by the native path, +12 here',player.points-p0===12,player.points-p0);
const low={id:'f2',hp:5,x:3,y:5,levelR62:6,drop:5};sb.killEnemy(low);claims['r64:1:drop:f2']=true;const p1=player.points;vm.runInContext('tick()',sb);ok('foes under Lv.7 give no extra',player.points===p1);
// 정적
ok('mob attack FX cover each region family and skip bosses/persona/samong puppets',['clinical','garden','cave','stone','swamp','ash','forge','domestic','snow','coast','memory','neural','regional'].every(k=>P.MOBFX[k])&&/samongMidR162\|\|e\?\.samongR103/.test(C('play-r169.js')));
ok('samong sculpture: one per room, off the path, beside a clue record',/pathCells\?\.\(r\)/.test(C('samong-r161.js'))&&/Math\.abs\(d-2\.4\)/.test(C('samong-r161.js'))&&!/const want=/.test(C('samong-r161.js')));
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
