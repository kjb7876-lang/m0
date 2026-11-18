// R1138 지역 전환 가림막 — CPU 검사(정적 연결 + 가짜 엔진·가짜 DOM 으로 실제 모듈 실행).
//  node r96/qa/r1138/curtain-cpu-check.cjs
//  사용자 2026-11-18 "응 버그없이 페이블로진행" — 전환 직후 무거운 첫 그리기를 로딩 화면 뒤에서 끝낸다. 판정·순서는 그대로여야 한다.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;
const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d).slice(0,500));assert(c,m);n++;console.log('PASS',m);};
const rd=(d,f)=>{try{return fs.readFileSync(path.join(R,d,f),'utf8');}catch(_){return '';}};
const F='transition-curtain-r1138.js',src=rd('client-source',F),html=rd('runtime-text','index.html');
// ---- 정적 ----
ok(src.length>0&&src===rd('runtime-text',F),'R1138 모듈이 있고 runtime-text 사본과 같음');
ok(html.split('"./'+F+'"').length===2,'index.html 스크립트 태그 한 번');
ok(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"),'verify-r96-public.py 기대 목록');
ok(/node r96\/qa\/r1138\/curtain-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
ok(JSON.stringify(JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8'))).includes(F),'runtime-manifest 에 들어 있음');
const strip=s=>s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'');
{const s=strip(src);
 ok(!/\b(tick|blocked|serializeSave|restoreSave|saveGame|spawnPoint|findPath|getRoom|moveActor|draw)\s*=(?!=)/.test(s),'판정·저장·그리기 함수를 바꿔 끼우지 않음');
 ok(!/\b(player|room|enemies|route|cam|transitionCD|time)\b\s*(\.[\w.]+\s*)?=(?!=)/.test(s)&&!/\bplayer\b|\broom\b/.test(s),'영웅·방·몹 상태를 읽지도 쓰지도 않음');
 ok(!/\b(loading|modal|storyScene|zone|layer)\s*=(?!=)/.test(s),'엔진 상태 변수(loading·modal·storyScene·zone·layer)에 값을 넣지 않음');
 ok(!/setInterval/.test(s),'주기 감싸기 없음(한 번만 감쌈)');
 ok((s.match(/\benterRegion\s*=(?!=)/g)||[]).length===1&&(s.match(/\bclosePanel\s*=(?!=)/g)||[]).length===1,'감싸는 것은 enterRegion·closePanel 한 번씩');}

// ---- 가짜 DOM ----
class El{constructor(tag){this.tag=tag;this.children=[];this.parentNode=null;this.attrs={};this._cls=new Set();this.style={cssText:''};this.dataset={};this.textContent='';this.rect={width:0,height:0};this.paused=true;this.ended=false;
  const self=this;this.classList={add:c=>self._cls.add(c),remove:c=>self._cls.delete(c),contains:c=>self._cls.has(c)};}
 get id(){return this.attrs.id||'';}set id(v){this.attrs.id=v;}
 setAttribute(k,v){if(k==='class'){this._cls=new Set(String(v).split(/\s+/).filter(Boolean));}else this.attrs[k]=String(v);}
 removeAttribute(k){if(k==='class')this._cls.clear();else delete this.attrs[k];}
 append(...c){for(const x of c){x.parentNode=this;this.children.push(x);}return this;}
 insertBefore(x,ref){x.parentNode=this;const i=ref?this.children.indexOf(ref):-1;if(i<0)this.children.push(x);else this.children.splice(i,0,x);return x;}
 get nextSibling(){const p=this.parentNode;if(!p)return null;return p.children[p.children.indexOf(this)+1]||null;}
 remove(){const p=this.parentNode;if(p){p.children.splice(p.children.indexOf(this),1);this.parentNode=null;}}
 all(){const out=[];const walk=e=>{for(const c of e.children){out.push(c);walk(c);}};walk(this);return out;}
 querySelectorAll(sel){const a=this.all();if(sel==='*')return a;if(sel[0]==='#')return a.filter(e=>e.id===sel.slice(1));return a.filter(e=>e.tag===sel);}
 querySelector(sel){return this.querySelectorAll(sel)[0]||null;}
 appendChild(x){this.append(x);return x;}
 cloneNode(){const c=new El(this.tag);c.attrs={...this.attrs};c._cls=new Set(this._cls);c.textContent=this.textContent;c.style={...this.style};for(const k of this.children)c.append(k.cloneNode(true));return c;}
 getBoundingClientRect(){return this.rect;}}
function world(opt={}){
 const body=new El('body'),modalEl=new El('div'),panel=new El('section'),fatal=new El('div');modalEl.id='modal';panel.id='panel';fatal.id='fatal';body.append(modalEl,fatal);modalEl.append(panel);
 const loadingMarkup=()=>{panel.children.length=0;const eb=new El('div'),h=new El('h2'),ld=new El('div'),fill=new El('i'),st=new El('div');eb.setAttribute('class','eyebrow');h.textContent='구역';ld.setAttribute('class','loader');fill.id='loadFill';fill.style.width='37%';st.id='loadStatus';st.setAttribute('class','readout');st.textContent='지역 그림 3 / 9';ld.append(fill);panel.append(eb,h,ld,st);};
 const document={createElement:t=>{const e=new El(t);e.appendChild=x=>e.append(x);return e;},body,getElementById:id=>id==='modal'?(modalEl.parentNode?modalEl:null):[body,...body.all()].find(e=>e.id===id)||null,querySelectorAll:s=>body.querySelectorAll(s),querySelector:s=>body.querySelector(s)};
 const store=new Map(Object.entries(opt.store||{}));let clock=0;const raf=[];const timers=[];
 const three={sceneGeneration:1,__r204:null};
 const ctx={console,JSON,Math,Number,String,Object,Array,Error,Promise,Set,Map,document,
  localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))},
  performance:{now:()=>clock},requestAnimationFrame:f=>{raf.push(f);return raf.length;},
  setTimeout:(f,ms)=>{timers.push({f,at:clock+ms,on:true});return timers.length;},clearTimeout:i=>{if(timers[i-1])timers[i-1].on=false;},
  getComputedStyle:(e,pe)=>{if(pe){const on=pe==='::after'&&e.tag==='h2'&&e.parentNode&&e.parentNode.id==='panel',pp=on?['content','color']:[],pv={content:'"合"',color:'rgb(160,40,30)'};const cs={length:pp.length,getPropertyValue:p=>on?pv[p]:(p==='content'?'none':'')};pp.forEach((p,i)=>cs[i]=p);return cs;}
   const props=['display','position','background-color','width','transition'],vals={display:e===modalEl&&modalEl.classList.contains('hidden')?'none':'flex',position:e===modalEl?'fixed':'static','background-color':'rgb(3,7,11)',width:e.style.width||'300px',transition:'width 0.2s'};
   const cs={length:props.length,getPropertyValue:p=>vals[p]};props.forEach((p,i)=>cs[i]=p);return cs;},
  innerWidth:812,innerHeight:375};
 ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
 // 가짜 엔진: 실제 엔진과 같은 순서(그림 읽기 → 방 바꾸기 → loading=false → closePanel(true) → 서사)
 vm.runInContext(`var loading=false,modal=false,storyScene=null,zone='hub',layer='STORY',calls=[],narrate=false,failNext=false,syncThrow=false;
  function openPanel(){modal=true;document.getElementById('modal').classList.remove('hidden');}
  function closePanel(force){if(!force&&(loading||storyScene))return 'kept';modal=false;document.getElementById('modal').classList.add('hidden');calls.push('close');return 'closed';}
  async function enterRegion(id,from,options){if(syncThrow)throw Error('sync');if(loading)return false;loading=true;openPanel();__markup();await Promise.resolve();await Promise.resolve();
   if(failNext){failNext=false;loading=false;openPanel();document.getElementById('panel').children.length=0;return false;}
   zone=id;loading=false;closePanel(true);calls.push('entered:'+id);if(narrate){storyScene={id};}return true;}`,ctx);
 ctx.__markup=loadingMarkup;
 ctx.__STORYWORLD_PHASE1__={controller:{state:{three}}};
 let cavePrefs={on:true};ctx.__STORYWORLD_CAVE_R204__={zones:opt.caveZones||['cave01','dist01'],inspect:()=>({prefs:cavePrefs})};
 const baseEnter=vm.runInContext('enterRegion',ctx),baseClose=vm.runInContext('closePanel',ctx);
 if(opt.load!==false)vm.runInContext(src,ctx,{filename:F});
 const frame=(ms=16)=>{clock+=ms;const q=raf.splice(0);for(const f of q)f(clock);for(const t of timers)if(t.on&&t.at<=clock){t.on=false;t.f();}};
 const advance=ms=>{clock+=ms;for(const t of timers)if(t.on&&t.at<=clock){t.on=false;t.f();}};
 const curtain=()=>body.all().find(e=>e.id==='r1138Curtain')||null;
 return{ctx,body,modalEl,panel,fatal,three,frame,advance,curtain,baseEnter,baseClose,raf,api:()=>ctx.__STORYWORLD_TRANSITION_CURTAIN_R1138__,run:c=>vm.runInContext(c,ctx),setCave:p=>{cavePrefs=p;},
  video:(w,h,playing)=>{const v=new El('video');v.rect={width:w,height:h};v.paused=!playing;body.append(v);return v;}};}
const settle=()=>new Promise(r=>setImmediate(r));

(async()=>{
 // ① 보통 지역(동굴 지형 없음): 닫기와 같은 흐름에서 가림막, 3장면 뒤 걷힘
 {const w=world();ok(w.api()&&w.api().revision,'모듈이 올라오고 API 가 있음');
  const before=w.run('[typeof enterRegion,typeof closePanel]');ok(before.join()==='function,function','감싼 뒤에도 함수');
  let seen=null;const base=w.ctx.closePanel;/* 닫기 직후(같은 동기 흐름)의 모습을 본다 */
  w.ctx.closePanel=function(...a){const r=base.apply(this,a);seen={curtain:!!w.curtain(),loading:w.run('loading'),modal:w.run('modal'),hidden:w.modalEl.classList.contains('hidden')};return r;};
  const p=w.run("enterRegion('town01','left',{noStory:true})");ok(p instanceof w.ctx.Promise||typeof p.then==='function','enterRegion 은 그대로 약속을 돌려줌');
  ok(!w.curtain(),'로딩 중에는 가림막이 없다(진짜 로딩 창이 보임)');
  const r=await p;await settle();ok(r===true,'결과값 true 그대로');
  ok(seen&&seen.curtain&&seen.loading===false&&seen.modal===false&&seen.hidden,'로딩 창이 닫히는 그 흐름에서 가림막이 올라와 있다(loading·modal 은 false, #modal 은 숨김)',seen);
  const c=w.curtain();ok(c&&c.style.pointerEvents==='none'&&c.attrs['aria-hidden']==='true','가림막은 입력을 막지 않는다(pointer-events:none)');
  ok(![c,...c.all()].some(e=>e.id&&e.id!=='r1138Curtain')&&w.body.all().filter(e=>e.id==='loadFill').length===1,'본뜬 창에 id 중복 없음(loadFill·loadStatus·modal·panel)');
  ok(c.all().some(e=>e.style.width==='100%')&&c.all().some(e=>/지형을 준비/.test(e.textContent)),'막대 100%·"지형을 준비하는 중" 문구');
  {const st=c.all().find(e=>e.tag==='style'),h=c.all().find(e=>e.tag==='h2');ok(st&&h&&h.attrs['data-r1138k']&&st.textContent==='#r1138Curtain [data-r1138k="'+h.attrs['data-r1138k']+'"]::after{content:"合";color:rgb(160,40,30);transition:none;animation:none;}','제목 옆 낙관(::after 장식)도 같은 모습으로 옮긴다',st&&st.textContent);}
  ok(c.parentNode===w.body&&w.body.children.indexOf(c)===w.body.children.indexOf(w.modalEl)+1,'#modal 바로 뒤(같은 층)에 놓임');
  ok(w.run('calls.join()')==='close,entered:town01','엔진 순서 그대로(닫기 → 진입 마무리)');
  w.frame();ok(w.curtain(),'1장면: 아직');w.frame();ok(w.curtain(),'2장면: 아직');w.frame();ok(!w.curtain(),'3장면: 걷힘');
  const i=w.api().inspect();ok(i.log.length===1&&i.log[0].reason==='plain'&&i.log[0].frames===3&&i.log[0].zone==='town01'&&!i.active&&i.depth===0,'기록: plain·3장면',i);
  for(let k=0;k<5;k++)w.frame();w.advance(9000);ok(!w.curtain()&&w.api().inspect().stats.lifted===1&&w.raf.length===0,'걷힌 뒤 남은 루프·타이머 동작 없음');}
 // ② 동굴 지형 지역: 지형이 붙을 때까지 + 2장면
 {const w=world();const p=w.run("enterRegion('dist01','left')");await p;await settle();ok(w.curtain(),'동굴 지역: 가림막');
  w.frame();w.three.__r204={gen:1,zone:'dist01',pending:true};w.frame();w.frame();w.frame();ok(w.curtain(),'지형 대기 중(4장면)에는 유지');
  w.three.__r204={gen:1,zone:'dist01',pending:false,group:{visible:true}};w.frame();ok(w.curtain(),'붙은 장면: 아직(셰이더·텍스처 올리는 장면)');w.frame();ok(w.curtain(),'붙고 1장면: 아직');w.frame();ok(!w.curtain(),'붙고 2장면: 걷힘');
  const l=w.api().inspect().log[0];ok(l.reason==='ready'&&l.frames===7&&l.cave==='ready','기록: ready·7장면',l);}
 // ③ 지형이 이미 붙은 채 첫 장면: 최소 3장면
 {const w=world();await w.run("enterRegion('dist01')");await settle();w.three.__r204={gen:1,zone:'dist01',pending:false};w.frame();w.frame();ok(w.curtain(),'2장면: 유지');w.frame();ok(!w.curtain()&&w.api().inspect().log[0].reason==='ready','3장면: 걷힘(ready)');}
 // ④ 동굴 지역인데 만들기를 시작하지 않음(Legacy·조건 미달): 6장면에서 포기
 {const w=world();await w.run("enterRegion('dist01')");await settle();for(let k=0;k<5;k++)w.frame();ok(w.curtain(),'5장면: 기다림');w.frame();ok(!w.curtain()&&w.api().inspect().log[0].reason==='plain'&&w.api().inspect().log[0].frames===6,'6장면: 포기하고 걷힘');}
 {const w=world();await w.run("enterRegion('dist01')");await settle();w.three.__r204={gen:0,zone:'dist01',pending:false};/* 옛 장면 세대 */w.frame();w.frame();w.frame();ok(w.curtain(),'옛 세대 지형은 준비로 치지 않음');
  w.three.__r204={gen:1,zone:'cave01',pending:false};w.frame();ok(w.curtain(),'다른 지역 지형도 준비로 치지 않음');w.frame();w.frame();ok(!w.curtain(),'6장면 포기');}
 {const w=world();await w.run("enterRegion('dist01')");await settle();w.three.__r204={gen:1,zone:'dist01',failed:true,pending:true};w.frame();w.frame();w.frame();ok(!w.curtain()&&w.api().inspect().log[0].reason==='plain','지형 빌드 실패면 기다리지 않음');}
 {const w=world();w.setCave({on:false});await w.run("enterRegion('dist01')");await settle();w.frame();w.frame();w.frame();ok(!w.curtain(),'동굴 지형 설정이 꺼져 있으면 기다리지 않음');}
 {const w=world();w.run("layer='DREAM'");await w.run("enterRegion('dist01')");await settle();w.frame();w.frame();w.frame();ok(!w.curtain(),'DREAM 층은 동굴 지형을 기다리지 않음');}
 {const w=world();w.ctx.__STORYWORLD_COOP_SIM_R62__={mode:()=>'host'};await w.run("enterRegion('dist01')");await settle();w.frame();w.frame();w.frame();ok(!w.curtain(),'협동 중에는 동굴 지형을 기다리지 않음');}
 {const w=world();delete w.ctx.__STORYWORLD_CAVE_R204__;w.ctx.__STORYWORLD_PHASE1__=undefined;await w.run("enterRegion('dist01')");await settle();w.frame();w.frame();w.frame();ok(!w.curtain()&&w.api().inspect().stats.errors===0,'동굴 모듈·렌더러가 없어도 오류 없이 3장면');}
 // ⑤ 시간 상한: 지형이 끝내 대기면 4초에 걷힘 / 그리기 루프가 멈춰도 타이머로 걷힘
 {const w=world();await w.run("enterRegion('dist01')");await settle();w.three.__r204={gen:1,zone:'dist01',pending:true};for(let k=0;k<7;k++)w.frame(500);ok(w.curtain(),'3.5초: 유지');w.frame(500);ok(!w.curtain()&&w.api().inspect().log[0].reason==='cap','4초: 상한으로 걷힘');}
 {const w=world();await w.run("enterRegion('town01')");await settle();w.advance(4999);ok(w.curtain(),'루프 멈춤 4.999초: 유지');w.advance(2);ok(!w.curtain()&&w.api().inspect().log[0].reason==='timer','루프가 멈춰 있어도 5초 타이머로 걷힘');w.frame();ok(!w.curtain()&&w.api().inspect().stats.lifted===1,'그 뒤 장면에서 다시 생기지 않음');}
 // ⑥ 가리면 안 되는 화면
 {const w=world();w.run('narrate=true');await w.run("enterRegion('town01')");await settle();ok(!w.curtain()&&w.api().inspect().log[0].reason==='blocked:story'&&w.api().inspect().log[0].frames===0,'진입 서사가 뜨면 첫 장면 전에 걷힘');}
 {const w=world();await w.run("enterRegion('town01')");await settle();w.frame();w.run('openPanel()');w.frame();ok(!w.curtain()&&w.api().inspect().log[0].reason==='blocked:modal','창이 열리면 걷힘');}
 {const w=world();await w.run("enterRegion('town01')");await settle();w.frame();const p=w.run("enterRegion('dist01')");ok(w.run('loading')===true,'가림막 중 다음 지역 진입이 막히지 않음');w.frame();ok(!w.curtain(),'다음 로딩이 시작되면 걷힘');await p;await settle();ok(w.body.all().filter(e=>e.id==='r1138Curtain').length===1,'다음 진입의 가림막은 한 장');}
 {const w=world();await w.run("enterRegion('town01')");await settle();w.video(812,375,true);w.frame();ok(!w.curtain()&&w.api().inspect().log[0].reason==='blocked:video','큰 영상이 재생 중이면 걷힘');}
 {const w=world();w.video(812,375,false);w.video(120,80,true);await w.run("enterRegion('town01')");await settle();w.frame();w.frame();ok(w.curtain(),'멈춘 영상·작은 영상은 상관없음');w.frame();ok(!w.curtain(),'3장면 걷힘');}
 {const w=world();await w.run("enterRegion('town01')");await settle();w.fatal.style.display='block';w.frame();ok(!w.curtain()&&w.api().inspect().log[0].reason==='blocked:fatal','오류 화면이 뜨면 걷힘');}
 // ⑦ 가림막이 생기면 안 되는 닫기
 {const w=world();w.run('openPanel()');w.ctx.__markup();const r=w.run('closePanel(true)');ok(r==='closed'&&!w.curtain(),'enterRegion 밖의 닫기(부팅·오프라인 묶기 로딩)는 가림막 없음·결과값 그대로');}
 {const w=world();w.run('failNext=true');const r=await w.run("enterRegion('town01')");await settle();ok(r===false&&!w.curtain()&&w.run('modal')===true&&w.api().inspect().depth===0,'진입 실패(그림 못 읽음): 가림막 없음, 오류 창 그대로');}
 {const w=world();const base=w.baseEnter;/* 안쪽 감싸기가 로딩 도중 닫기를 부르는 경우 */
  w.run("{const b=enterRegion;enterRegion=async function(...a){const p=b.apply(this,a);const r0=closePanel(true);calls.push('mid:'+loading);return p;};}");
  await w.run("enterRegion('town01')");await settle();ok(w.run('calls[0]')==='close'&&w.run('calls[1]')==='mid:true','(시험 준비) 로딩 중 닫기 호출됨');ok(w.api().inspect().stats.shown===0&&w.api().inspect().stats.skipped===1&&!w.curtain(),'로딩 중(loading=true) 닫기에는 가림막 없음 — 그 닫기로 로딩 창이 이미 사라졌으면 끝에서도 본뜰 창이 없어 만들지 않는다',w.api().inspect().stats);}
 {const w=world();w.run("{const b=enterRegion;enterRegion=async function(...a){const r=await b.apply(this,a);openPanel();document.getElementById('panel').children.length=0;closePanel(true);return r;};}");
  await w.run("enterRegion('town01')");await settle();ok(w.api().inspect().stats.shown===1,'로딩 창이 아닌 창(#loadFill 없음)의 닫기에는 가림막 없음');}
 {const w=world();w.run('syncThrow=true');let threw=false;try{await w.run("enterRegion('town01')");}catch(e){threw=e.message==='sync';}await settle();ok(threw&&w.api().inspect().depth===0&&w.api().inspect().stats.errors===0,'엔진 약속이 거절돼도 그대로 거절되고 깊이 0');
  {const w3=world({load:false});vm.runInContext("enterRegion=function(){throw Error('now');};",w3.ctx);vm.runInContext(src,w3.ctx);let t=false;try{w3.run('enterRegion()');}catch(e){t=e.message==='now';}ok(t&&w3.api().inspect().depth===0,'엔진이 바로 던져도 그대로 던지고 깊이 0');}
  w.run('syncThrow=false');w.run('openPanel()');w.ctx.__markup();w.run('closePanel(true)');ok(!w.curtain(),'그 뒤 바깥 닫기에 가림막 없음');}
 // ⑧ 끄기
 {const w=world({store:{'storyworld.r1138.curtain':'{"on":false}'}});const r=await w.run("enterRegion('dist01')");await settle();ok(r===true&&!w.curtain()&&w.api().inspect().stats.shown===0,'설정 off: 가림막 없음');}
 {const w=world({store:{'storyworld.r1138.curtain':'0'}});await w.run("enterRegion('dist01')");await settle();ok(!w.curtain(),"'0' 도 끔");}
 {const w=world({store:{'storyworld.r1138.curtain':'{bad'}});await w.run("enterRegion('town01')");await settle();ok(w.curtain(),'깨진 설정값은 기본(켜짐)');w.api().set({on:false});ok(!w.curtain()&&w.api().inspect().log[0].reason==='off','set({on:false}) 로 즉시 걷힘');
  await w.run("enterRegion('dist01')");await settle();ok(!w.curtain(),'꺼진 뒤 진입: 없음');w.api().set({on:true});await w.run("enterRegion('town01')");await settle();ok(w.curtain(),'다시 켜면 나옴');}
 // ⑨ 회귀: 모듈이 있든 없든 엔진 쪽 결과가 같다
 {const run=async load=>{const w=world({load});const out=[];for(const id of ['town01','dist01','cave01']){const r=await w.run("enterRegion('"+id+"','left',{noStory:true})");await settle();out.push([r,w.run('zone'),w.run('loading'),w.run('modal'),w.run('storyScene'),w.modalEl.classList.contains('hidden')]);for(let k=0;k<8;k++)w.frame();}
   out.push(w.run('calls.join()'));const b=await w.run("Promise.all([enterRegion('town01'),enterRegion('dist01')])");out.push([...b]);return JSON.stringify(out);};
  const a=await run(true),b=await run(false);ok(a===b,'진입 결과·순서·상태가 모듈 유무와 같다(연속 3지역 + 겹친 진입)',{a,b});}
 {const w=world();const same=w.run("(()=>{const p=Promise.resolve(7);const b=window.__probe=function(){return p;};return p;})()");
  const w2=world({load:false});vm.runInContext("var __p=Promise.resolve(true);enterRegion=function(){return __p;};",w2.ctx);vm.runInContext(src,w2.ctx);ok(w2.run('enterRegion()===__p'),'enterRegion 이 돌려준 약속 객체를 그대로 넘긴다(새 약속으로 바꾸지 않음)');
  vm.runInContext("enterRegion.__inner=1",w2.ctx);ok(w2.run('enterRegion.__r1138')===true&&w2.run('closePanel.__r1138')===true,'감싼 표식');
  vm.runInContext(src,w2.ctx);ok(w2.run('enterRegion.__inner')===1,'두 번 실어도 다시 감싸지 않음');}
 console.log('\nR1138 curtain CPU check: '+n+' passed');
})().catch(e=>{console.error(e);process.exit(1);});
