// R191 CPU check: 기계·현대 구역의 R74 순찰 몹·가구·자연 장식을 시대에 맞게(중세·판타지·병원은 그대로, 전투 수치 불변).
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const idx=RT('index.html');
ok('era-r191 loads after fx-blood-r190, before combat-r118',idx.indexOf('./era-r191.js')>idx.indexOf('./fx-blood-r190.js')&&idx.indexOf('./era-r191.js')<idx.indexOf('./combat-r118.js'));
ok('runtime copy matches',RT('era-r191.js')===C('era-r191.js'));
ok('in the public verify list',/'era-r191\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
const sb={window:{},localStorage:{getItem:()=>null,setItem(){}},setTimeout:()=>0};vm.createContext(sb);vm.runInContext(C('era-r191.js'),sb);const E=sb.window.__STORYWORLD_ERA_R191__;
const room=(style,mode)=>({exploration:{worldR74:{style,mode}},enemies:[{id:'z:r74-patrol:0',r74Monster:'root',name:'뿌리 추적자',hp:40,maxHp:40,attack:null},{id:'z:mob',name:'x',hp:9}],props:[{id:'r74:z:scenery:1',r74Prop:'stump'},{id:'r74:z:scenery:2',r74Prop:'ferns'},{id:'z-prop-1',key:'moss',path:'assets/props/v290/moss_boulders.webp',solid:false},{id:'z-prop-2',key:'console',path:'assets/x/surveillance_console.webp',solid:false},{id:'r74:z:door-0',r74Door:{}}]});
const t=room('controller-war-loop','outdoor');E.apply(t);
ok('machine zone: patrol becomes 태엽 수집자 (clock), hp/attack untouched, other mobs untouched',t.enemies[0].r74Monster==='clock'&&t.enemies[0].name==='태엽 수집자'&&t.enemies[0].hp===40&&t.enemies[0].maxHp===40&&t.enemies[1].name==='x');
ok('machine zone: forest furniture → workbench/crate/obelisk, nature decor hidden (not removed/moved), narrative console and doors kept',['workbench','crate','obelisk'].includes(t.props[0].r74Prop)&&['workbench','crate','obelisk'].includes(t.props[1].r74Prop)&&t.props[2].r191Hide===true&&t.props.length===5&&!t.props[3].r191Hide&&!t.props[4].r191Hide&&t.props[2].path.includes('moss_boulders'));
const m=room('rain-crosswalk','outdoor');E.apply(m);ok('modern outdoor zone: patrol 유리 망령 (glass), furniture crate/cabinet/statue',m.enemies[0].r74Monster==='glass'&&['crate','cabinet','statue'].includes(m.props[0].r74Prop));
const h=room('house','indoor');E.apply(h);ok('modern indoor: cabinet/empty-bed/statue',['cabinet','empty-bed','statue'].includes(h.props[0].r74Prop));
const f=room('demon-tree-palace-garden','outdoor');E.apply(f);ok('medieval/fantasy zone untouched',f.enemies[0].r74Monster==='root'&&f.props[0].r74Prop==='stump'&&!f.props[2].r191Hide);
const hosp={exploration:{},enemies:[],props:[]};E.apply(hosp);ok('hospital (no R74 style) untouched',E.eraOf(hosp)===null);
ok('applying twice changes nothing more',(()=>{const before=JSON.stringify(t);E.apply(t);return before===JSON.stringify(t);})());
ok('hidden decor is only skipped at draw time',/drawProp=function\(p,\.\.\.a\)\{if\(prefs\.on&&p\?\.r191Hide\)return;/.test(C('era-r191.js')));
ok('only existing R74 atlas cells / monster styles are used',/\['clock','태엽 수집자'\]/.test(C('era-r191.js'))&&/\['glass','유리 망령'\]/.test(C('era-r191.js')));
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
