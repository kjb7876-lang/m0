// R365 — 설정 '길잡이 중 / 직접 조작 중 기억 조각·쪽지 창 표시', '서사 창 자동 넘기기'. 끄면 창을 펼치지 않되 쪽지 모음에는 기록, 서사 넘기기도 기록·진행(계속 콜백) 그대로.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
const html=RT('index.html');const HAS=fs.existsSync(path.join(R,'client-source','guide-fragment-r365.js'));
function el(tag){return {tag,style:{},children:[],attrs:{},checked:false,parentNode:null,setAttribute(k,v){this.attrs[k]=v;},appendChild(c){c.parentNode=this;this.children.push(c);return c;},
 get nextSibling(){const p=this.parentNode;if(!p)return null;return p.children[p.children.indexOf(this)+1]||null;},
 insertBefore(c,ref){c.parentNode=this;const i=this.children.indexOf(ref);this.children.splice(i<0?this.children.length:i,0,c);return c;},querySelector(){return null;},querySelectorAll(){return [];},addEventListener(){},remove(){},classList:{add(){},remove(){},contains(){return false;}}};}
function mk(store,{guide,engine}){const kept=[],toasts=[];const room={id:'ep1a09',props:[],enemies:[]};const grid=el('div');
 const byId=id=>{const walk=n=>{if(n.id===id)return n;for(const c of n.children||[]){const r=walk(c);if(r)return r;}return null;};return walk(grid);};
 const sb={window:{__STORYWORLD_PLAY_R169__:{collect:n=>kept.push(n)}},localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);}},
  document:{getElementById:byId,createElement:t=>el(t),createTextNode:t=>({text:t}),querySelector:q=>q==='#panel .settings'?grid:null,head:{appendChild(){}},body:{appendChild(){}}},
  setInterval(){},performance:{now:()=>0},started:true,loading:false,room,player:{x:5,y:5,hp:100},readScenes:new Set(),regionById:{ep1a09:{title:'주사실'}},blocked:()=>false,toast:m=>toasts.push(m),
  playScenes(s,d){if(d)d();},drawProp(){},drawEffect(){},effects:[],advanceScene(){},interact(){},tick(){},async enterRegion(){return true;},showSettings(){},Promise,Math,JSON,String,Array,Set,Map,Object,Number,guide,innerWidth:1280,innerHeight:720};
 Object.defineProperty(sb,'time',{value:1,writable:true});vm.createContext(sb);
 if(engine){const panel=el('div');panel.id='panel';const foot=el('div');foot.className='storyFoot';panel.appendChild(foot);sb.__foot=foot;sb.foot=foot;sb.__done=0;
  const gi=sb.document.getElementById;sb.document.getElementById=id=>{if(id==='panel')return panel;const w=n=>{if(n.id===id)return n;for(const c of n.children||[]){const r=w(c);if(r)return r;}return null;};return w(panel)||gi(id);};
  panel.querySelector=q=>q==='.storyFoot'?foot:null;
  vm.runInContext("var storyScene=null,storyQueue=[],storyDone=null;function closePanel(){foot.children.length=0;}function playScenes(sc,d){storyQueue=sc.slice();storyDone=d||null;storyScene=null;advanceScene();}"+
   "function advanceScene(){if(storyScene)readScenes.add(storyScene.key);storyScene=storyQueue.shift()||null;if(!storyScene){const d=storyDone;storyDone=null;closePanel();if(d)d();return}foot.children.length=0;const b=document.createElement('button');b.id='storyNext';foot.appendChild(b);}",sb);}
 vm.runInContext(C('story-collect-r177.js'),sb);if(HAS)vm.runInContext(C('guide-fragment-r365.js'),sb);
 return {sb,kept,toasts,grid,X:sb.window.__STORYWORLD_STORY_COLLECT_R177__,G:sb.window.__STORYWORLD_GUIDE_FRAGMENT_R365__};}
async function pick(t){vm.runInContext("playScenes([{key:'DREAM:sz115:sz115-S05-2:cue:0',narrator:'〈미카엘라의 기억〉',title:'주사실',text:'원문 문장.'}],()=>{})",t.sb);await new Promise(r=>setImmediate(r));
 const d=t.X.inspect().docs()[0];if(!d)return false;t.sb.player.x=d.x;t.sb.player.y=d.y;vm.runInContext('tick()',t.sb);return true;}
(async()=>{
 ok('overlay present with a global',HAS&&!!mk({},{guide:false}).G);
 {const store={};const t=mk(store,{guide:true});vm.runInContext('showSettings()',t.sb);const c=t.sb.document.getElementById('r365GuideFrag');
  const row=t.sb.document.getElementById('r365GuideFragRow');
  ok('settings panel gets a Korean checkbox, on by default (current behaviour)',!!c&&c.checked===true&&/길잡이 중 기억 조각·쪽지 창 표시/.test((row?.children||[]).map(x=>x.text||'').join('')));
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
 // ── 2026-11-06 직접 조작 생략·서사 넘기기 ──
 {const t=mk({'storyworld.r365.guideFragment':'{"show":false}'},{guide:true});
  ok('old key {show:false} migrates: guide off, manual on, story skip off',t.G?.prefs().show===false&&t.G?.prefs().manual===true&&t.G?.prefs().skipStory===false,t.G?.prefs());}
 {const t=mk({},{guide:false});ok('defaults unchanged: both windows on, story skip off',t.G?.prefs().show===true&&t.G?.prefs().manual===true&&t.G?.prefs().skipStory===false);
  vm.runInContext('showSettings()',t.sb);const k=t.grid.children.map(x=>x.id);const i=k.indexOf('r253SecsRow');
  const txt=id=>(t.sb.document.getElementById(id)?.children||[]).map(x=>x.text||'').join('');
  ok('settings: three Korean rows in order after R253 (guide / manual / story skip)',i>=0&&k.slice(i+1,i+4).join()==='r365GuideFragRow,r365ManualFragRow,r365SkipStoryRow'&&/직접 조작 중 기억 조각·쪽지 창 표시/.test(txt('r365ManualFragRow'))&&/서사 창 자동 넘기기/.test(txt('r365SkipStoryRow')),k);
  const m=t.sb.document.getElementById('r365ManualFrag'),sk=t.sb.document.getElementById('r365SkipStory');
  ok('manual box on, story-skip box off by default',m?.checked===true&&sk?.checked===false);}
 {const store={};const t=mk(store,{guide:false});vm.runInContext('showSettings()',t.sb);const m=t.sb.document.getElementById('r365ManualFrag');if(m){m.checked=false;m.onchange();}
  const t2=mk(store,{guide:false});const p=await pick(t2);const s=t2.X.inspect().stats;
  ok('manual + manual-off: fragment recorded in note book, no window, toast',p&&t2.kept.length===1&&s.picked===1&&s.shown===0&&t2.toasts.some(m=>/쪽지 모음/.test(m)),{kept:t2.kept.length,s});
  const t3=mk(store,{guide:true});const p3=await pick(t3);ok('manual-off does not affect guide (guide window still opens)',p3&&t3.X.inspect().stats.shown===1);}
 {const t=mk({'storyworld.r365.guideFragment':'{"skipStory":true}'},{guide:false,engine:true});
  vm.runInContext("playScenes([{key:'STORY:ep1a09:pre',id:'ep1a09',title:'문 앞',narrator:'환도',text:'첫 장.'},{key:'STORY:ep1a09:pre2',id:'ep1a09',title:'문 안',text:'둘째 장.'}],()=>{__done++;})",t.sb);
  ok('story skip on: continue callback fires exactly once, scenes marked read, panel closed',t.sb.__done===1&&t.sb.readScenes.has('STORY:ep1a09:pre')&&t.sb.readScenes.has('STORY:ep1a09:pre2')&&vm.runInContext('storyScene',t.sb)===null,{done:t.sb.__done});
  ok('story skip on: every skipped scene recorded in note book',t.kept.filter(n=>/^story:STORY:ep1a09:pre2?$/.test(n.key)).length===2&&t.kept.some(n=>n.text==='첫 장.'),t.kept.map(n=>n.key));
  vm.runInContext("playScenes([{key:'journal:ep1a09:0',id:'ep1a09',title:'j',text:'책.'}],()=>{__done++;})",t.sb);ok('journal reading is never skipped',vm.runInContext('storyScene',t.sb)?.key==='journal:ep1a09:0'&&t.sb.__done===1);}
 {const t=mk({},{guide:false,engine:true});
  vm.runInContext("playScenes([{key:'STORY:ep1a09:post',id:'ep1a09',title:'끝',text:'끝 장.'},{key:'STORY:ep1a09:post2',id:'ep1a09',title:'끝2',text:'끝 둘.'}],()=>{__done++;})",t.sb);
  const b=t.sb.document.getElementById('r365Skip');ok('default: narrative window stays open with a 건너뛰기 button next to 계속',vm.runInContext('storyScene',t.sb)?.key==='STORY:ep1a09:post'&&t.sb.__done===0&&b?.textContent==='건너뛰기'&&t.sb.__foot.children.map(x=>x.id).join()==='storyNext,r365Skip');
  b?.onclick?.();ok('건너뛰기 button: records all, fires continue once, marks read',t.sb.__done===1&&t.kept.length===2&&t.sb.readScenes.has('STORY:ep1a09:post2'),{done:t.sb.__done,kept:t.kept.length});}
 ok('runtime copies match; loads right after mob-legacy-r363, before combat-r118',HAS&&RT('guide-fragment-r365.js')===C('guide-fragment-r365.js')&&RT('story-collect-r177.js')===C('story-collect-r177.js')&&/mob-legacy-r363\.js"><\/script><script src="\.\/guide-fragment-r365\.js"><\/script>/.test(html)&&html.indexOf('guide-fragment-r365')<html.indexOf('combat-r118'));
 const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail||'')));
 console.log(`R365 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
})().catch(e=>{console.log('FAIL '+e.stack);process.exit(1);});
