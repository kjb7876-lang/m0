// R365 — 설정 '길잡이 중 기억 조각 창 표시'. 끄고 길잡이면 창을 펼치지 않되 쪽지 모음에는 기록, 켜짐·손 조작은 그대로.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
const html=RT('index.html');const HAS=fs.existsSync(path.join(R,'client-source','guide-fragment-r365.js'));
function el(tag){return {tag,style:{},children:[],attrs:{},checked:false,parentNode:null,setAttribute(k,v){this.attrs[k]=v;},appendChild(c){c.parentNode=this;this.children.push(c);return c;},
 get nextSibling(){const p=this.parentNode;if(!p)return null;return p.children[p.children.indexOf(this)+1]||null;},
 insertBefore(c,ref){c.parentNode=this;const i=this.children.indexOf(ref);this.children.splice(i<0?this.children.length:i,0,c);return c;},querySelector(){return null;},querySelectorAll(){return [];},addEventListener(){},remove(){},classList:{add(){},remove(){},contains(){return false;}}};}
function mk(store,{guide}){const kept=[],toasts=[];const room={id:'ep1a09',props:[],enemies:[]};const grid=el('div');
 const byId=id=>{const walk=n=>{if(n.id===id)return n;for(const c of n.children||[]){const r=walk(c);if(r)return r;}return null;};return walk(grid);};
 const sb={window:{__STORYWORLD_PLAY_R169__:{collect:n=>kept.push(n)}},localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);}},
  document:{getElementById:byId,createElement:t=>el(t),createTextNode:t=>({text:t}),querySelector:q=>q==='#panel .settings'?grid:null,head:{appendChild(){}},body:{appendChild(){}}},
  setInterval(){},performance:{now:()=>0},started:true,loading:false,room,player:{x:5,y:5,hp:100},readScenes:new Set(),regionById:{ep1a09:{title:'주사실'}},blocked:()=>false,toast:m=>toasts.push(m),
  playScenes(s,d){if(d)d();},drawProp(){},drawEffect(){},effects:[],advanceScene(){},interact(){},tick(){},async enterRegion(){return true;},showSettings(){},Promise,Math,JSON,String,Array,Set,Map,Object,Number,guide,innerWidth:1280,innerHeight:720};
 Object.defineProperty(sb,'time',{value:1,writable:true});vm.createContext(sb);
 vm.runInContext(C('story-collect-r177.js'),sb);if(HAS)vm.runInContext(C('guide-fragment-r365.js'),sb);
 return {sb,kept,toasts,grid,X:sb.window.__STORYWORLD_STORY_COLLECT_R177__,G:sb.window.__STORYWORLD_GUIDE_FRAGMENT_R365__};}
async function pick(t){vm.runInContext("playScenes([{key:'DREAM:sz115:sz115-S05-2:cue:0',narrator:'〈미카엘라의 기억〉',title:'주사실',text:'원문 문장.'}],()=>{})",t.sb);await new Promise(r=>setImmediate(r));
 const d=t.X.inspect().docs()[0];if(!d)return false;t.sb.player.x=d.x;t.sb.player.y=d.y;vm.runInContext('tick()',t.sb);return true;}
(async()=>{
 ok('overlay present with a global',HAS&&!!mk({},{guide:false}).G);
 {const store={};const t=mk(store,{guide:true});vm.runInContext('showSettings()',t.sb);const c=t.sb.document.getElementById('r365GuideFrag');
  const row=t.sb.document.getElementById('r365GuideFragRow');
  ok('settings panel gets a Korean checkbox, on by default (current behaviour)',!!c&&c.checked===true&&/길잡이 중 기억 조각 창 표시/.test((row?.children||[]).map(x=>x.text||'').join('')));
  if(c){c.checked=false;c.onchange();}const t2=mk(store,{guide:true});
  ok('toggle persists across reload (localStorage storyworld.r365.guideFragment)',JSON.parse(store['storyworld.r365.guideFragment']||'{}').show===false&&t2.G?.prefs().show===false);
  vm.runInContext('showSettings()',t2.sb);ok('reopened settings show the saved state',t2.sb.document.getElementById('r365GuideFrag')?.checked===false);
  const k=t2.grid.children.map(x=>x.id);ok('placed right after the R253 auto-advance row',k.indexOf('r253SecsRow')>=0&&k.indexOf('r365GuideFragRow')===k.indexOf('r253SecsRow')+1,k);}
 {const t=mk({'storyworld.r365.guideFragment':'{"show":false}'},{guide:true});const p=await pick(t);const s=t.X.inspect().stats;
  ok('guide + off: fragment is picked up and recorded in the note book, but no window opens',p&&t.kept.length===1&&t.kept[0].text==='원문 문장.'&&s.picked===1&&s.shown===0,{kept:t.kept.length,s});
  ok('guide + off: a short toast points to the note book',t.toasts.some(m=>/쪽지 모음/.test(m)));
  t.X.show({form:'shard',title:'x',text:'y'});ok('R169/R162 path (global show) is held too',t.X.inspect().stats.shown===0);
  t.X.show({form:'shard',title:'x',text:'y'},{force:true});ok('forced reading still opens',t.X.inspect().stats.shown===1);}
 {const t=mk({},{guide:true});const p=await pick(t);ok('guide + on: unchanged (window opens, recorded)',p&&t.kept.length===1&&t.X.inspect().stats.shown===1);}
 {const t=mk({'storyworld.r365.guideFragment':'{"show":false}'},{guide:false});const p=await pick(t);ok('manual play + off: unchanged (window opens, recorded)',p&&t.kept.length===1&&t.X.inspect().stats.shown===1);}
 ok('runtime copies match; loads right after mob-legacy-r363, before combat-r118',HAS&&RT('guide-fragment-r365.js')===C('guide-fragment-r365.js')&&RT('story-collect-r177.js')===C('story-collect-r177.js')&&/mob-legacy-r363\.js"><\/script><script src="\.\/guide-fragment-r365\.js"><\/script>/.test(html)&&html.indexOf('guide-fragment-r365')<html.indexOf('combat-r118'));
 const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail||'')));
 console.log(`R365 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
})().catch(e=>{console.log('FAIL '+e.stack);process.exit(1);});
