// R237 CPU check: 패시브 포인트가 생기면 알아서 강화(싼 것부터, 일반강화→Z·X·C→오라), 혼자·창 없을 때만, 끄기 가능.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const src=C('auto-levelup-r237.js'),idx=RT('index.html');
ok('runtime copy matches; loads right after mob-flank-r230; in the public verify list and CI',RT('auto-levelup-r237.js')===src&&idx.includes('<script src="./mob-flank-r230.js"></script><script src="./auto-levelup-r237.js"></script>')&&/'auto-levelup-r237\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8'))&&/qa\/r237\/r237-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
ok('R169 exports its own buyTalent so the same purchase rule is used',/buyTalent,\/\*/.test(C('upgrades-r169.js'))&&RT('upgrades-r169.js')===C('upgrades-r169.js'));
function mk(o={}){const store={};const sb={console,Math,JSON,Number,String,Object,Array,setInterval:()=>0,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}},window:{},
 started:true,modal:o.modal||null,loading:false,storyScene:null,layer:o.layer||'STORY',saves:0,toasts:[],
 player:{hero:'hwando',hp:100,points:o.points??10,upgrades:{}}};
 const T={};sb.UPGRADES=[{id:'vital',name:'생명',max:2},{id:'edge',name:'칼날',max:1},{id:'dreamOnly',name:'꿈',max:3,dream:true}];sb.rank=id=>T[id]||0;
 sb.window.__STORYWORLD_UPGRADES_R169__={buyTalent:id=>{const u=sb.UPGRADES.find(x=>x.id===id);if(sb.player.points<1||(T[id]||0)>=u.max)return false;sb.player.points--;T[id]=(T[id]||0)+1;return true;}};
 const procs={};const routeOpen=o.route!==false;
 sb.window.__STORYWORLD_GROWTH_R103__={MAX_LEVEL:7,procCost:l=>l*l,inspect:()=>({routeOpen,state:{procs}}),buyProc:s=>{const k='hwando:'+s,l=(procs[k]||0)+1;if(!routeOpen||sb.player.points<l*l)return false;sb.player.points-=l*l;procs[k]=l;return true;}};
 const ranks={};const def=(id,name)=>({id,name,get cost(){const n=ranks[id]||0;return (n+1)*(n+1);}});
 const defs=[def('endlessPower','위력'),def('endlessVital','체력'),def('egoAura','합일'),def('dreamAura','안개'),{id:'threadCrossR64',name:'십자',cost:1,maxRank:1}];
 sb.window.__STORYWORLD_PROGRESSION_R62__={defs,ranks:id=>ranks[id]||0,purchase:id=>{const d=defs.find(x=>x.id===id);const c=d.cost;if(sb.player.points<c)return false;sb.player.points-=c;ranks[id]=(ranks[id]||0)+1;return true;}};
 if(o.coop)sb.window.__STORYWORLD_COOP_SIM_R62__={mode:()=>'host'};
 sb.saveGame=()=>sb.saves++;sb.toast=t=>sb.toasts.push(t);
 vm.createContext(sb);vm.runInContext(src,sb);return {sb,T,procs,ranks,A:sb.window.__STORYWORLD_AUTOLEVEL_R237__};}
{const {sb,T,procs,ranks,A}=mk({points:10});const b=A.step();
 ok('talents (cost 1) are bought first, dream-only talent skipped outside DREAM',T.vital===2&&T.edge===1&&!T.dreamOnly,{T,b});
 ok('then the cheapest Z·X·C proc and aura at cost 1, never egoAura / dreamAura (STORY); R663: thread motifs are bought too',procs['hwando:w']===1&&procs['hwando:e']===1&&procs['hwando:r']===1&&!ranks.egoAura&&!ranks.dreamAura,{procs,ranks,b});
 ok('one step buys at most 6, saves once and shows one toast',b.length===6&&sb.saves===1&&sb.toasts.length===1&&/자동 스킬레벨업/.test(sb.toasts[0]),{b,toasts:sb.toasts});
 const b2=A.step();ok('the next step spends the rest on the cheapest remaining (cost-1 auras) and stops when nothing is affordable',sb.player.points>=0&&ranks.endlessPower===1&&ranks.endlessVital===1&&ranks.threadCrossR64===1&&b2.length===3&&A.candidates().length===0,{b2,points:sb.player.points,ranks});}
{const {A,T}=mk({points:3,modal:'panel'});ok('does nothing while a panel/modal is open',A.step().length===0&&!T.vital);}
{const {A,T}=mk({points:3,coop:true});ok('does nothing in co-op (host/guest purchase paths stay manual)',A.step().length===0&&!T.vital);}
{const {A,T}=mk({points:3});A.set(false);ok('can be turned off',A.step().length===0&&!T.vital&&A.inspect().on===false);}
{const {A,procs,T}=mk({points:5,route:false});A.step();ok('Z·X·C is skipped before the samong route opens',Object.keys(procs).length===0&&T.vital===2);}
{const {A,ranks,T}=mk({points:15,layer:'DREAM'});A.step();A.step();A.step();ok('in DREAM the dream-only talent and the samong mist aura are allowed',ranks.dreamAura>=1&&T.dreamOnly===3,{ranks,T});}
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R237 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
