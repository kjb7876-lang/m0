/* R108 UI: a short settings top level, one "세부 조정" area for every other
 * overlay section, and a tidier HUD. Presentation only: no damage, cooldown,
 * hit shape, AI, collision, save schema or narrative is touched.
 *
 *  - The native settings panel is built by showSettings() and ~20 overlays that
 *    append their own <section>. This overlay loads LAST, wraps showSettings and
 *    MOVES the existing nodes (never clones them: ids, listeners and the
 *    guards other overlays use keep working) into
 *      top level : 소리 / 화면(그래픽 품질 프리셋) / 진행
 *      세부 조정 : 화면·조명 / 전투 연출 / 맵·날씨 / 몹·소품 / 사운드 / 검사·개발 / 기타
 *    A MutationObserver keeps late or future sections (R108 weather, mobs, D2 ...)
 *    in the right place. organise() is idempotent and never loops.
 *  - 그래픽 품질 낮음/보통/높음 only drives switches that already exist:
 *    settings.lowFx (through the native checkbox handler), the R97 adaptive
 *    render scale, and the public set() of the overlay prefs. Overlays added
 *    later can opt in with setQuality(level) on a window.__STORYWORLD_*_R108__ object.
 *  - HUD polish is CSS only (<style id="uiR108">), scoped under html.ui108, and can
 *    be switched off in 세부 조정 > 화면·조명.
 * Canonical source; copied into the site by the build scripts. */
(()=>{'use strict';
 if(window.__STORYWORLD_UI_R108__||typeof document==='undefined')return;
 const REV='R108-ui-1';
 const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r108.ui';
 const DEFAULTS=Object.freeze({adaptive:true,polish:true});
 let prefs={...DEFAULTS},lastError=null;
 const stats={organised:0,moved:0,lateSweeps:0,presets:0,rootBuilds:0,errors:0};
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');for(const k of Object.keys(DEFAULTS))if(typeof saved?.[k]==='boolean')prefs[k]=saved[k];}catch(_){}
 const fail=e=>{stats.errors++;lastError=String(e?.stack||e);};
 const $=id=>document.getElementById(id);
 // The inherited CPU harnesses use a tiny array-based DOM; real browsers return an HTMLCollection.
 const REAL=()=>{try{return typeof HTMLCollection==='function'&&!!document.body&&document.body.children instanceof HTMLCollection;}catch(_){return false;}};
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}};

 // ---- groups --------------------------------------------------------------
 const GROUPS=Object.freeze([['screen','화면·조명'],['combat','전투 연출'],['world','맵·날씨'],['mobs','몹·소품'],['sound','사운드'],['diag','검사·개발'],['misc','기타']]);
 const GROUP_LABEL=Object.freeze(Object.fromEntries(GROUPS));
 // Known sections by id. Anything new falls through to the keyword rules, then to 기타.
 const BY_ID=Object.freeze({
  retroSettingsR89:'screen',retroSettingsR90:'screen',retroSettingsR93:'screen',
  retroSettingsR98Combat:'combat',retroSettingsR98Vfx:'combat',retroSettingsR100:'combat',retroSettingsR101:'combat',retroSettingsR102:'combat',
  retroSettingsR92:'world',retroSettingsR98World:'world',retroSettingsR99Outdoor:'world',
  retroSettingsR91:'mobs',retroSettingsR92Mobs:'mobs',retroSettingsR92Boss:'mobs',retroSettingsR102Props:'mobs',
  retroSettingsR93Sound:'sound',
  statusDiagnosticsR63R2:'diag',hospitalTestSettingsR84:'diag'});
 // Plain-language titles for sections whose own title is an internal revision tag.
 const TITLES=Object.freeze({
  retroSettingsR89:'레트로 화면',retroSettingsR90:'화면 보강',retroSettingsR91:'벽 장식·잔해·사망 연출',retroSettingsR92:'바닥 데칼·광원 소품',
  retroSettingsR92Mobs:'잡몹 동작',retroSettingsR92Boss:'보스 소멸',retroSettingsR93:'HUD',retroSettingsR93Sound:'발소리·환경음',
  retroSettingsR98Combat:'전투 느낌',retroSettingsR98Vfx:'적 스킬 연출',retroSettingsR98World:'장소 표현',
  retroSettingsR100:'몹·길안내·분위기 연출',retroSettingsR101:'영웅 연출·타격감',retroSettingsR102:'영웅 스킬 색·성장',retroSettingsR102Props:'조형물 테마·크기',
  retroSettingsR99Outdoor:'야외 원화'});
 // Individual controls that live in a shared container.
 const LEAF=Object.freeze({hitboxToggle:'diag',voicePreroll:'sound',enemyDirectionR51:'combat',campaignAutoSkillR63:'combat',lowFx:'screen'});
 const RULES=Object.freeze([
  [/weather|rain|storm|snow|hail|water|sky|haze|fog|wind|thunder|lightning|ocean|날씨|비바람|폭풍|우박|안개|물결|하늘/i,'world'],
  [/mob|monster|enemy|boss|prop|statue|tree|decor|bestiary|몹|몬스터|보스|조형물|소품|장식|잔해/i,'mobs'],
  [/sound|audio|bgm|music|voice|ambience|소리|음악|음성|효과음|환경음/i,'sound'],
  [/diag|debug|inspect|test|hitbox|진단|검사|테스트|개발/i,'diag'],
  [/d2|diablo|skill|combat|fx|vfx|effect|hit|aura|spell|attack|스킬|전투|연출|이펙트|타격|오라|검무/i,'combat'],
  [/light|screen|hud|ui|color|grade|camera|조명|광원|화면|색감|해상도|그래픽/i,'screen']]);
 function classify(id,text){
  if(id&&Object.prototype.hasOwnProperty.call(BY_ID,id))return BY_ID[id];
  const hay=(id||'')+' '+(text||'');for(const[re,g]of RULES)if(re.test(hay))return g;return'misc';
 }
 const cleanTitle=s=>String(s||'').replace(/\s*\(R\d+[A-Za-z0-9]*[^)]*\)/g,'').replace(/^\s*R\d+\s+/,'').replace(/\s+/g,' ').trim();

 // ---- graphics quality ------------------------------------------------------
 // [api global, control-id prefix, pref key, LOW value, default value, label]
 const KNOBS=Object.freeze([
  ['__STORYWORLD_VISUAL_R90__','r90-','localLights',false,true,'국지 광원'],
  ['__STORYWORLD_VISUAL_R90__','r90-','decals',false,true,'바닥 흔적'],
  ['__STORYWORLD_VISUAL_R90__','r90-','atmosphere',false,true,'지역 대기 효과'],
  ['__STORYWORLD_VISUAL_R91__','r91-','remains',false,true,'적 잔해·얼룩'],
  ['__STORYWORLD_VISUAL_R91__','r91-','blood','low','normal','피 표현'],
  ['__STORYWORLD_VISUAL_R92__','r92-','floorDecals',false,true,'바닥 데칼'],
  ['__STORYWORLD_OUTDOOR_R99__','r99o-','water',false,true,'야외 물결'],
  ['__STORYWORLD_OUTDOOR_R99__','r99o-','trees',false,true,'흔들리는 나무'],
  ['__STORYWORLD_POLISH_R100__','r100-','ambience',false,true,'분위기 입자'],
  ['__STORYWORLD_POLISH_R101__','r101-','aura',false,true,'영웅 오라'],
  ['__STORYWORLD_HERO_FX_R102__','r102-','flourish',false,true,'시전 연출']]);
 const LEVELS=Object.freeze([['low','낮음'],['normal','보통'],['high','높음']]);
 const LEVEL_KO=Object.freeze({low:'낮음',normal:'보통',high:'높음'});
 const LEVEL_NOTE=Object.freeze({
  low:'간소화 VFX를 켜고 광원·대기·잔해·물결·오라 같은 부가 연출을 끕니다.',
  normal:'기본값입니다. 모든 연출이 켜지고 느릴 때만 해상도를 자동으로 낮춥니다.',
  high:'기본 연출을 모두 켜고 해상도 자동 낮춤을 끕니다.'});
 const perf=()=>window.__STORYWORLD_PERF_R97__;
 const adaptiveOn=()=>{try{return perf()?.inspect?.().adaptiveEnabled!==false;}catch(_){return true;}};
 const lowFxOn=()=>typeof settings!=='undefined'&&!!settings&&!!settings.lowFx;
 function snapshot(){
  const s={lowFx:lowFxOn(),adaptive:adaptiveOn(),knobs:[]};
  for(const[g,id,k,lo,def,label]of KNOBS){let p=null;try{p=window[g]?.prefs?.();}catch(_){}if(!p||!(k in p))continue;s.knobs.push([g,id,k,p[k],lo,def,label]);}
  return s;
 }
 function diff(s,level){
  const out=[];if(s.lowFx!==(level==='low'))out.push('간소화 VFX');if(s.adaptive!==(level!=='high'))out.push('해상도 자동 낮춤');
  for(const[,,,cur,lo,def,label]of s.knobs)if(cur!==(level==='low'?lo:def))out.push(label);return out;
 }
 // The preset that matches the live switches exactly, else the nearest one and what differs.
 function levelOf(s=snapshot()){
  let best=null;for(const lv of['normal','low','high']){const d=diff(s,lv);if(!d.length)return{level:lv,near:lv,diff:[]};if(!best||d.length<best.diff.length)best={level:'custom',near:lv,diff:d};}return best;
 }
 function syncControls(){
  for(const[g,id,k]of KNOBS){let p=null;try{p=window[g]?.prefs?.();}catch(_){}const c=p&&$(id+k);if(!c||!(k in p))continue;if(c.type==='checkbox')c.checked=!!p[k];else c.value=String(p[k]);}
 }
 function applyLevel(level){
  if(!LEVEL_NOTE[level])return false;
  // The native checkbox owns lowFx (resize + saveGame); use its handler when the panel is open.
  const want=level==='low',cb=document.querySelector('input[data-setting="lowFx"]');
  if(cb){if(cb.checked!==want){cb.checked=want;cb.dispatchEvent(new Event('change',{bubbles:true}));}}
  else if(typeof settings!=='undefined'&&settings){settings.lowFx=want;try{if(typeof resize==='function')resize();if(typeof saveGame==='function')saveGame(false);}catch(e){fail(e);}}
  setAdaptive(level!=='high');
  for(const g of new Set(KNOBS.map(r=>r[0]))){const patch={};for(const r of KNOBS)if(r[0]===g)patch[r[2]]=level==='low'?r[3]:r[4];try{window[g]?.set?.(patch);}catch(e){fail(e);}}
  syncControls();
  // Optional opt-in for overlays that appear later (R108 weather, mobs, D2 ...).
  try{for(const k of Object.keys(window))if(/^__STORYWORLD_.*_R108__$/.test(k)&&k!=='__STORYWORLD_UI_R108__'){const o=window[k];if(o&&typeof o.setQuality==='function')o.setQuality(level);}}catch(e){fail(e);}
  stats.presets++;refreshQuality();return true;
 }
 function setAdaptive(on){prefs.adaptive=!!on;save();try{perf()?.setAdaptive?.(prefs.adaptive);}catch(e){fail(e);}const c=$('ui108-adaptive');if(c)c.checked=prefs.adaptive;}
 function setPolish(on){prefs.polish=!!on;save();document.documentElement.classList.toggle('ui108',prefs.polish);const c=$('ui108-polish');if(c)c.checked=prefs.polish;}

 // ---- DOM helpers (no innerHTML, no cloning) -------------------------------
 function h(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;}
 const has=(a,b)=>!!a&&!!b&&(a===b||(typeof a.contains==='function'?a.contains(b):false));
 const upTo=(n,tag)=>{for(let p=n;p;p=p.parentNode)if(p.tagName===tag)return p;return null;};
 const kids=n=>Array.from((n&&n.children)||[]);
 const cls=(n,c)=>/\s/.test(c)?c.split(/\s+/).every(x=>cls(n,x)):new RegExp('(^|\\s)'+c+'(\\s|$)').test((n&&n.className)||'');
 // Append (or insert before `before`). A node already inside `parent` is left where it is.
 function put(node,parent,before=null){
  if(!node||!parent||node===before)return false;
  if(node.parentNode===parent&&(before?node.nextSibling===before:true))return false;
  parent.insertBefore(node,before);stats.moved++;return true;
 }
 // A trailing "(...)" description becomes a quiet second line; textContent stays identical.
 function splitLabel(label){
  if(!label||typeof label.childNodes==='undefined'||label.getAttribute('data-ui108s'))return;label.setAttribute('data-ui108s','1');
  for(const n of Array.from(label.childNodes)){
   if(n.nodeType!==3)continue;const t=n.textContent||'',end=t.trimEnd();if(!end.endsWith(')'))continue;
   let depth=0,at=-1;for(let i=end.length-1;i>=0;i--){const c=end[i];if(c===')')depth++;else if(c==='('){depth--;if(depth===0){at=i;break;}}}
   if(at<=0||!end.slice(0,at).trim())continue;
   const title=h('span','ui108-t',t.slice(0,at)),desc=h('small','ui108-d',t.slice(at));if(/^\(\s*R\d+/.test(t.slice(at)))desc.className+=' ui108-rtag';
   label.insertBefore(title,n);label.insertBefore(desc,n);label.removeChild(n);
  }
 }
 // Notes that only repeat "stored outside the save slots" are hidden; other notes stay as written.
 const BOILER=/^(생성 자산 )?(표현 )?설정은 저장 슬롯(과 별도로|밖에 따로) 보관됩니다\.?$/;
 function tidyNote(p){
  if(!p||p.getAttribute('data-ui108n'))return;p.setAttribute('data-ui108n','1');
  if(BOILER.test((p.textContent||'').trim()))p.className+=' ui108-empty';
 }
 function tidySection(sec){
  const hd=kids(sec).find(c=>c.tagName==='H3');
  if(hd&&!hd.getAttribute('data-ui108h')){hd.setAttribute('data-ui108h','1');const t=hd.textContent||'',c=TITLES[sec.id]||cleanTitle(t);if(c&&c!==t){hd.setAttribute('title',t);hd.textContent=c;}}
  for(const c of kids(sec)){if(c.tagName==='P'&&cls(c,'muted'))tidyNote(c);else if(c.tagName==='LABEL')splitLabel(c);}
 }

 // ---- build / place ----------------------------------------------------------
 const ui={detailOpen:false,group:null};
 let mo=null;
 const card=(root,key,title,first)=>{
  const found=kids(root.main).find(c=>c.getAttribute('data-card')===key);if(found)return found;
  const c=h('section','ui108-card');c.setAttribute('data-card',key);if(title)c.appendChild(h('h3','',title));
  root.main.insertBefore(c,first?root.main.firstChild:null);return c;
 };
 function ensureRoot(panel){
  let root=$('uiSettingsR108');
  if(root&&has(panel,root)){const k=kids(root);return{el:root,head:k[0],main:k[1],detail:k[2]};}
  root=h('div','ui108-root');root.id='uiSettingsR108';
  const head=h('div','ui108-head'),title=h('div','ui108-title'),main=h('div','ui108-main'),detail=h('details','ui108-detail');
  detail.id='uiDetailR108';
  const sum=h('summary','ui108-sum');sum.appendChild(h('span','ui108-sumt','세부 조정'));sum.appendChild(h('span','ui108-sumh','화면 · 전투 · 맵 · 몹 · 사운드 · 검사'));
  detail.appendChild(sum);detail.appendChild(h('div','ui108-groups'));
  detail.open=!!ui.detailOpen;detail.addEventListener('toggle',()=>{ui.detailOpen=detail.open;});
  head.appendChild(title);root.appendChild(head);root.appendChild(main);root.appendChild(detail);
  panel.insertBefore(root,panel.firstChild);
  root.addEventListener('input',onInput);root.addEventListener('change',onInput);root.addEventListener('click',onClickCapture,true);
  stats.rootBuilds++;
  return{el:root,head,main,detail};
 }
 function groupBody(root,key){
  const wrap=kids(root.detail).find(c=>cls(c,'ui108-groups'));
  let g=kids(wrap).find(c=>c.getAttribute('data-g')===key);
  if(!g){
   g=h('details','ui108-group');g.setAttribute('data-g',key);g.setAttribute('name','ui108-groups');
   const s=h('summary','ui108-gsum');s.appendChild(h('span','ui108-gname',GROUP_LABEL[key]||GROUP_LABEL.misc));s.appendChild(h('span','ui108-gcount',''));
   g.appendChild(s);g.appendChild(h('div','ui108-gbody'));
   const mine=g;g.addEventListener('toggle',()=>{if(mine.open)ui.group=key;else if(ui.group===key)ui.group=null;});
   // keep the fixed order of GROUPS
   const order=GROUPS.map(r=>r[0]);const next=kids(wrap).find(c=>order.indexOf(c.getAttribute('data-g'))>order.indexOf(key));wrap.insertBefore(g,next||null);
   if(ui.group===key)g.open=true;
  }
  return kids(g)[1];
 }
 function toDetail(root,node,key){
  const body=groupBody(root,key);if(!put(node,body))return false;
  if(node.tagName==='SECTION')tidySection(node);else if(node.tagName==='LABEL')splitLabel(node);else if(node.tagName==='P'&&cls(node,'muted'))tidyNote(node);
  return true;
 }
 function qualityRow(screen){
  if(kids(screen).some(c=>c.getAttribute('data-q-row')))return;
  const row=h('div','ui108-row ui108-qrow');row.setAttribute('data-q-row','1');
  const name=h('span','ui108-rowname','그래픽 품질'),seg=h('div','ui108-seg');seg.setAttribute('role','radiogroup');seg.setAttribute('aria-label','그래픽 품질');
  for(const[lv,text]of LEVELS){const b=h('button','',text);b.type='button';b.setAttribute('role','radio');b.setAttribute('aria-checked','false');b.setAttribute('data-q',lv);b.title=LEVEL_NOTE[lv];seg.appendChild(b);}
  seg.addEventListener('keydown',e=>{const bs=kids(seg),i=bs.indexOf(document.activeElement);if(i<0)return;let j=-1;if(e.key==='ArrowRight'||e.key==='ArrowDown')j=(i+1)%bs.length;else if(e.key==='ArrowLeft'||e.key==='ArrowUp')j=(i+bs.length-1)%bs.length;if(j>=0){e.preventDefault();bs[j].focus();}});
  const note=h('p','ui108-qnote','');note.id='ui108-qnote';note.setAttribute('aria-live','polite');
  row.appendChild(name);row.appendChild(seg);row.appendChild(note);screen.insertBefore(row,kids(screen)[1]||null);
 }
 function refreshQuality(){
  const root=$('uiSettingsR108');if(!root)return;const seg=kids(root.querySelector('.ui108-qrow')||root).find(c=>cls(c,'ui108-seg'));if(!seg)return;
  const L=levelOf();
  for(const b of kids(seg)){const on=b.getAttribute('data-q')===L.level;b.setAttribute('aria-checked',on?'true':'false');b.className=on?'on':'';}
  const note=$('ui108-qnote');
  if(note)note.textContent=L.level==='custom'?'사용자 지정 · '+LEVEL_KO[L.near]+'과 다른 항목: '+L.diff.slice(0,3).join(', ')+(L.diff.length>3?' 외 '+(L.diff.length-3)+'개':''):LEVEL_NOTE[L.level];
 }
 function fillRanges(root){
  if(!root)return;
  for(const r of Array.from(root.querySelectorAll('input[type=range]'))){const min=Number(r.min||0),max=Number(r.max||100),v=Number(r.value);r.style.setProperty('--p',(max>min?Math.max(0,Math.min(100,(v-min)/(max-min)*100)):0).toFixed(1)+'%');}
  for(const o of Array.from(root.querySelectorAll('output.ui108-pct'))){const l=o.previousSibling,r=l&&l.querySelector&&l.querySelector('input[type=range]');if(r)o.textContent=Math.round(Number(r.value)*100)+'%';}
 }
 function onInput(e){try{const t=e.target;if(!t)return;if(t.type==='range')fillRanges($('uiSettingsR108'));refreshQuality();}catch(x){fail(x);}}
 function onClickCapture(e){
  try{
   const b=e.target&&upTo(e.target,'BUTTON');if(!b)return;
   if(b.getAttribute('data-q')){e.preventDefault();applyLevel(b.getAttribute('data-q'));return;}
   if(b.id==='cameraResetR63')setTimeout(()=>fillRanges($('uiSettingsR108')),0);
  }catch(x){fail(x);}
 }

 function topLevel(panel,root){
  // heading block: eyebrow + title + close button move into the sticky head
  const title=kids(root.head)[0];
  const eyebrow=kids(panel).find(c=>cls(c,'eyebrow')),h2=kids(panel).find(c=>c.tagName==='H2'),close=$('settingsClose');
  if(eyebrow&&!has(root.head,eyebrow)){eyebrow.textContent='OPTIONS';put(eyebrow,title);}
  if(h2&&!has(root.head,h2))put(h2,title);
  if(close&&!has(root.head,close))put(close,root.head);
  // mobile quick menu (touch actions) stays reachable at the very top
  const quick=$('mobileOptionsR63');
  if(quick&&!has(root.el,quick)){const c=card(root,'quick',null,true);c.className+=' ui108-quick';put(quick,c);}
  // 소리
  const sound=card(root,'sound','소리');
  for(const[a,b,key]of[['sound','volume','sfx'],['music','bgm','bgm'],['narration','voice','voice']]){
   const ca=panel.querySelector('input[data-setting="'+a+'"]'),rb=panel.querySelector('input[data-volume="'+b+'"]');if(!ca&&!rb)continue;
   const la=ca&&upTo(ca,'LABEL'),lb=rb&&upTo(rb,'LABEL');
   let row=kids(sound).find(c=>c.getAttribute('data-vol')===key);
   if(!row){row=h('div','ui108-row ui108-vol');row.setAttribute('data-vol',key);sound.appendChild(row);}
   if(la&&!has(row,la))put(la,row);
   if(lb&&!has(row,lb)){if(!cls(lb,'ui108-slider'))lb.className=((lb.className||'')+' ui108-slider').trim();put(lb,row);}
   if(!kids(row).some(c=>c.tagName==='OUTPUT')){const o=h('output','ui108-pct','');o.setAttribute('aria-hidden','true');row.appendChild(o);}
  }
  // 화면
  const screen=card(root,'screen','화면');qualityRow(screen);
  const rm=panel.querySelector('input[data-setting="reducedMotion"]'),fl=$('flashlightModeR58'),cam=$('cameraSettingsR63');
  const lrm=rm&&upTo(rm,'LABEL'),lfl=fl&&upTo(fl,'LABEL');
  if(lrm&&!has(screen,lrm)){const r=h('div','ui108-row ui108-toggle');put(lrm,r);screen.appendChild(r);}
  if(lfl&&!has(screen,lfl)){
   const r=h('div','ui108-row ui108-toggle');r.setAttribute('data-k','flashlight');put(lfl,r);
   const hint=$('flashlightHintR58');if(hint){r.title=hint.textContent||'';hint.className+=' ui108-empty';put(hint,r);}
   screen.appendChild(r);
  }
  if(cam&&!has(screen,cam)){
   if(!cam.getAttribute('data-ui108c')){cam.setAttribute('data-ui108c','1');for(const p of kids(cam))if(p.tagName==='P'&&!p.id){const d=h('details','ui108-note'),s=h('summary','','카메라 시야 설명');cam.insertBefore(d,p);d.appendChild(s);d.appendChild(p);}}
   put(cam,screen);
  }
  // 진행
  const play=card(root,'play','진행');
  const acts=panel.querySelector('.campaign-settings-r63'),note=panel.querySelector('.campaign-difficulty-note-r63');
  if(!kids(play).some(c=>c.getAttribute('data-save-row'))){
   const row=h('div','ui108-btnrow');row.setAttribute('data-save-row','1');
   if(typeof started!=='undefined'&&started&&typeof saveGame==='function'){const b=h('button','','진행 저장');b.type='button';b.id='ui108-save';b.onclick=()=>{try{saveGame(true);}catch(e){fail(e);}};row.appendChild(b);}
   const slots=window.__STORYWORLD_SAVE_SLOTS_R73__;
   if(slots&&typeof slots.panel==='function'){const b=h('button','','저장·불러오기 · 슬롯');b.type='button';b.id='ui108-slots';b.onclick=()=>{try{slots.panel();}catch(e){fail(e);}};row.appendChild(b);}
   if(kids(row).length)play.appendChild(row);
  }
  if(acts&&!has(play,acts))put(acts,play);
  if(note&&!has(play,note))put(note,play);
  play.hidden=!kids(play).some(c=>c.tagName!=='H3');
 }
 function leafSweep(panel,root){
  const grid=kids(panel).find(c=>c.tagName==='DIV'&&cls(c,'settings'));if(!grid)return;
  for(const n of kids(grid)){
   if(n.id==='flashlightHintR58')continue;
   const ctl=n.querySelector&&n.querySelector('input,select'),id=ctl&&(ctl.id||ctl.getAttribute('data-setting'));
   toDetail(root,n,(id&&LEAF[id])||classify(id||n.id,n.textContent||''));
  }
  grid.hidden=!kids(grid).length;
 }
 function sweep(panel,root){
  for(const n of kids(panel)){
   if(n===root.el||n.tagName==='SCRIPT'||n.tagName==='STYLE')continue;
   if(n.tagName==='DIV'&&cls(n,'settings'))continue;
   if(n.tagName==='DIV'&&n.querySelector){
    // compound containers: route the audio test to 소리, split the diagnostics row by control
    if(n.querySelector('#story-audio-preview')){const sound=card(root,'sound','소리');put(n,sound);if(!cls(n,'ui108-sfxtest'))n.className+=' ui108-sfxtest';continue;}
    if(n.querySelector('#hitboxToggle,#voicePreroll')){for(const l of kids(n)){const c=l.querySelector&&l.querySelector('input,select');toDetail(root,l,(c&&LEAF[c.id])||'diag');}n.hidden=!kids(n).length;continue;}
   }
   const hd=n.tagName==='SECTION'?kids(n).find(c=>c.tagName==='H3'):null;
   const key=n.tagName==='P'&&/서사 음성/.test(n.textContent||'')?'sound':classify(n.id,(hd?hd.textContent:(n.textContent||'').slice(0,80)));
   toDetail(root,n,key);
  }
 }
 function decorate(root){
  // switches that belong to this overlay (화면·조명)
  const sb=groupBody(root,'screen');
  if(!kids(sb).some(c=>c.getAttribute('data-ui108x'))){
   const s=h('section','ui108-own');s.setAttribute('data-ui108x','1');s.appendChild(h('h3','','화면 표현'));
   for(const[id,text,get,set]of[['ui108-adaptive','해상도 자동 낮춤 (느릴 때만 단계적으로)',()=>prefs.adaptive,setAdaptive],['ui108-polish','정돈된 HUD 스타일',()=>prefs.polish,setPolish]]){
    const l=h('label',''),c=document.createElement('input');c.type='checkbox';c.id=id;c.checked=!!get();c.onchange=()=>set(c.checked);
    l.appendChild(c);l.appendChild(document.createTextNode(' '+text));s.appendChild(l);splitLabel(l);
   }
   sb.insertBefore(s,sb.firstChild);
  }
  const wrap=kids(root.detail).find(c=>cls(c,'ui108-groups'));
  for(const g of kids(wrap)){
   const k=kids(g),body=k[1];if(!body)continue;
   // sections a later wrapper inserted next to an already moved host land inside a group body: tidy those too
   for(const c of kids(body)){if(c.tagName==='SECTION')tidySection(c);else if(c.tagName==='LABEL')splitLabel(c);else if(c.tagName==='P'&&cls(c,'muted'))tidyNote(c);}
   const n=body.querySelectorAll('input,select').length,cnt=kids(k[0])[1];if(cnt)cnt.textContent=n?String(n):'';
  }
 }
 function organise(){
  const panel=$('panel');if(!panel||!REAL())return false;
  const close=$('settingsClose');if(!close||!has(panel,close))return false;
  if(mo)mo.disconnect();
  try{
   const root=ensureRoot(panel);
   topLevel(panel,root);leafSweep(panel,root);sweep(panel,root);decorate(root);
   fillRanges(root.el);refreshQuality();stats.organised++;
  }catch(e){fail(e);}
  finally{watch(panel);}
  return true;
 }
 function watch(panel){
  if(typeof MutationObserver!=='function')return;
  if(!mo)mo=new MutationObserver(records=>{
   try{
    // Readouts and status lines replace text nodes all the time; only new ELEMENTS matter.
    let added=false;for(const r of records){for(const n of r.addedNodes){if(n.nodeType===1){added=true;break;}}if(added)break;}
    if(!added)return;
    const p=$('panel'),r=$('uiSettingsR108');if(!p||!r||!has(p,r)){mo.disconnect();return;}
    stats.lateSweeps++;organise();
   }catch(e){fail(e);}
  });
  mo.observe(panel,{childList:true,subtree:true});
 }
 if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...args){const result=base.apply(this,args);try{organise();}catch(e){fail(e);}return result;};}

 // ---- CSS ------------------------------------------------------------------
 const SETTINGS_CSS=`
/* settings: structure (always on) */
#panel:has(#uiSettingsR108){width:min(700px,96vw);padding:0;overscroll-behavior:contain}
#uiSettingsR108{display:block;font-size:13px;color:#e3d8c2}
#uiSettingsR108 .ui108-head{position:sticky;top:0;z-index:6;display:flex;gap:16px;align-items:flex-start;justify-content:space-between;padding:22px 26px 14px;background:linear-gradient(180deg,#1c1710,#16120d);border-bottom:1px solid #4a3e2c;box-shadow:0 10px 14px -12px #000}
#uiSettingsR108 .ui108-head .eyebrow{font:10px/1 Georgia,serif;letter-spacing:.32em;color:#a98d5b}
#uiSettingsR108 .ui108-head h2{margin:8px 0 0;font:400 22px/1.2 Georgia,'Malgun Gothic',serif;letter-spacing:.14em;color:#ead9b4}
#uiSettingsR108 .ui108-head .close{float:none;flex:none}
#uiSettingsR108 .ui108-main{display:grid;gap:12px;padding:16px 26px 12px}
#uiSettingsR108 .ui108-card{position:relative;margin:0;padding:2px 16px 8px;border:1px solid #3b3225;background:linear-gradient(180deg,rgba(255,235,190,.045),rgba(0,0,0,.2));box-shadow:inset 0 1px 0 rgba(255,236,190,.06)}
#uiSettingsR108 .ui108-card>h3{display:flex;align-items:center;gap:9px;margin:13px 0 6px;font:600 11px/1 'Malgun Gothic',sans-serif;letter-spacing:.22em;color:#b99b62}
#uiSettingsR108 .ui108-card>h3::before{content:'';width:6px;height:6px;transform:rotate(45deg);background:#b99b62;box-shadow:0 0 6px rgba(185,155,98,.5)}
#uiSettingsR108 .ui108-card.ui108-quick{padding-top:10px}
#uiSettingsR108 .ui108-card[hidden]{display:none}
#uiSettingsR108 .mobile-options-r63{border:0;margin:0;padding:6px 0 4px}
#uiSettingsR108 .mobile-options-r63 label{margin:7px 0}
#uiSettingsR108 .mobile-options-r63>h3{margin:12px 0 6px;font-size:14px}
#uiSettingsR108 .ui108-row{display:grid;grid-template-columns:minmax(150px,1fr) minmax(120px,1.15fr) 42px;align-items:center;gap:8px 14px;padding:9px 0;border-top:1px solid rgba(201,169,107,.1)}
#uiSettingsR108 .ui108-card>h3+.ui108-row{border-top:0}
#uiSettingsR108 .ui108-toggle{display:block}
#uiSettingsR108 .ui108-qrow{grid-template-columns:auto 1fr;align-items:center}
#uiSettingsR108 .ui108-rowname{font-size:13px;color:#e3d8c2}
#uiSettingsR108 .ui108-qnote{grid-column:1/-1;margin:0;font-size:11px;line-height:1.5;color:#9c8f77}
#uiSettingsR108 .ui108-seg{justify-self:end;display:inline-grid;grid-auto-flow:column;border:1px solid #5b4b33;background:#0e0b08;box-shadow:inset 0 1px 3px #000}
#uiSettingsR108 .ui108-seg button{margin:0;padding:7px 20px;border:0;border-left:1px solid #34291c;border-radius:0;background:transparent;box-shadow:none;color:#b6a78b;font-size:13px;line-height:1.2;min-height:34px}
#uiSettingsR108 .ui108-seg button:first-child{border-left:0}
#uiSettingsR108 .ui108-seg button:hover{color:#f1dfb5;filter:none}
#uiSettingsR108 .ui108-seg button.on{background:linear-gradient(#4b3b22,#2b2113);color:#f6e6bd;box-shadow:inset 0 0 0 1px #b99b62}
#uiSettingsR108 label{display:flex;align-items:center;gap:10px;margin:0;padding:0;border:0;background:none;box-shadow:none;font-size:13px;line-height:1.35;color:#e3d8c2;cursor:pointer}
#uiSettingsR108 .ui108-slider{font-size:0;color:transparent;gap:0;cursor:default}
#uiSettingsR108 .ui108-slider input{font-size:13px}
#uiSettingsR108 .ui108-pct{justify-self:end;font:12px/1 Consolas,monospace;color:#b99b62;font-variant-numeric:tabular-nums}
#uiSettingsR108 .ui108-t{min-width:0}
#uiSettingsR108 .ui108-d{flex:1 0 100%;margin:-3px 0 0;padding-left:46px;font-size:11px;line-height:1.45;color:#8f826b}
#uiSettingsR108 .ui108-d.ui108-rtag{display:none}
#uiSettingsR108 label:has(.ui108-d){flex-wrap:wrap;row-gap:0}
#uiSettingsR108 label:has(.ui108-d)>.ui108-t{flex:1 1 0}
#uiSettingsR108 label output{margin-left:auto;font-size:11px;color:#9c8f77}
#uiSettingsR108 select{margin-left:8px;padding:5px 8px;border:1px solid #5b4b33;background:#14110d;color:#e3d8c2;font-size:12px}
#uiSettingsR108 input[type=checkbox]{appearance:none;-webkit-appearance:none;flex:none;width:36px;height:20px;margin:0;border-radius:11px;border:1px solid #6b5a40;background:#0f0c09;box-shadow:inset 0 1px 3px #000;position:relative;cursor:pointer;transition:background .15s,border-color .15s}
#uiSettingsR108 input[type=checkbox]::after{content:'';position:absolute;left:3px;top:3px;width:12px;height:12px;border-radius:50%;background:#7d6d54;transition:transform .15s,background .15s,box-shadow .15s}
#uiSettingsR108 input[type=checkbox]:checked{border-color:#b99b62;background:#2a2113}
#uiSettingsR108 input[type=checkbox]:checked::after{transform:translateX(16px);background:#ecd29a;box-shadow:0 0 7px rgba(236,210,154,.6)}
#uiSettingsR108 input[type=checkbox]:focus-visible,#uiSettingsR108 input[type=range]:focus-visible,#uiSettingsR108 summary:focus-visible,#uiSettingsR108 select:focus-visible,#uiSettingsR108 button:focus-visible{outline:2px solid #ecd29a;outline-offset:2px}
#uiSettingsR108 input[type=range]{appearance:none;-webkit-appearance:none;width:100%;height:20px;margin:0;background:transparent;cursor:pointer;--p:50%}
#uiSettingsR108 input[type=range]::-webkit-slider-runnable-track{height:4px;border-radius:2px;background:linear-gradient(90deg,#b99b62 var(--p),#2a241b var(--p));box-shadow:inset 0 0 0 1px #000}
#uiSettingsR108 input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;margin-top:-5px;border-radius:50%;background:#ecd29a;border:1px solid #6b5a40;box-shadow:0 0 0 2px #14110d,0 0 8px rgba(236,210,154,.35)}
#uiSettingsR108 input[type=range]::-moz-range-track{height:4px;border-radius:2px;background:#2a241b}
#uiSettingsR108 input[type=range]::-moz-range-progress{height:4px;border-radius:2px;background:#b99b62}
#uiSettingsR108 input[type=range]::-moz-range-thumb{width:12px;height:12px;border-radius:50%;background:#ecd29a;border:1px solid #6b5a40}
#uiSettingsR108 button{margin:0}
#uiSettingsR108 .ui108-btnrow,#uiSettingsR108 .actions{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 2px}
#uiSettingsR108 .ui108-btnrow button,#uiSettingsR108 .actions button{padding:8px 14px;font-size:12px}
#uiSettingsR108 .ui108-sfxtest{margin:6px 0 2px;align-items:center;gap:10px}
#uiSettingsR108 .ui108-sfxtest button{padding:6px 12px;font-size:12px}
#uiSettingsR108 .small,#uiSettingsR108 .ui108-card>p{font-size:11px;line-height:1.55;color:#9c8f77;margin:4px 0}
#uiSettingsR108 .ui108-empty{display:none}
#uiSettingsR108 #cameraSettingsR63{border:0;margin:0;padding:6px 0 2px;border-top:1px solid rgba(201,169,107,.1)}
#uiSettingsR108 #cameraSettingsR63>h3{margin:2px 0 0;font:400 13px/1.4 'Malgun Gothic',sans-serif;color:#e3d8c2}
#uiSettingsR108 #cameraSettingsR63 label{display:flex;justify-content:space-between;margin:0 0 2px;font-size:11px;color:#9c8f77}
#uiSettingsR108 #cameraSettingsR63 input[type=range]{min-height:20px}
#uiSettingsR108 #cameraSettingsR63 button{padding:6px 12px}
#uiSettingsR108 .ui108-note{margin:4px 0}
#uiSettingsR108 .ui108-note>summary{cursor:pointer;font-size:11px;color:#8f826b}
#uiSettingsR108 .ui108-note>summary::before{content:'ⓘ ';color:#b99b62}
#uiSettingsR108 .ui108-note[open]>summary{margin-bottom:4px}
#uiSettingsR108 .ui108-detail{border:1px solid #3b3225;background:rgba(0,0,0,.2);margin:0 26px 26px}
#uiSettingsR108 .ui108-detail>.ui108-groups{display:grid;gap:0;padding:0 8px 8px}
#uiSettingsR108 summary{list-style:none;cursor:pointer;user-select:none}
#uiSettingsR108 summary::-webkit-details-marker{display:none}
#uiSettingsR108 .ui108-sum{display:flex;align-items:baseline;gap:12px;padding:15px 18px}
#uiSettingsR108 .ui108-sum::before{content:'';flex:none;width:7px;height:7px;border-right:2px solid #b99b62;border-bottom:2px solid #b99b62;transform:rotate(-45deg);align-self:center;transition:transform .15s}
#uiSettingsR108 .ui108-detail[open]>.ui108-sum::before{transform:rotate(45deg)}
#uiSettingsR108 .ui108-sumt{font:600 14px/1 'Malgun Gothic',sans-serif;letter-spacing:.14em;color:#ecd9ae}
#uiSettingsR108 .ui108-sumh{font-size:11px;color:#8f826b}
#uiSettingsR108 .ui108-group{border-top:1px solid rgba(201,169,107,.14)}
#uiSettingsR108 .ui108-gsum{display:flex;align-items:center;gap:10px;padding:12px 10px}
#uiSettingsR108 .ui108-gsum::before{content:'';flex:none;width:5px;height:5px;border-right:2px solid #8d7650;border-bottom:2px solid #8d7650;transform:rotate(-45deg);transition:transform .15s}
#uiSettingsR108 .ui108-group[open]>.ui108-gsum::before{transform:rotate(45deg)}
#uiSettingsR108 .ui108-gname{font-size:13px;color:#e3d8c2}
#uiSettingsR108 .ui108-gcount{margin-left:auto;min-width:22px;padding:2px 7px;border:1px solid #4a3e2c;border-radius:9px;font:11px/1.2 Consolas,monospace;text-align:center;color:#a99871}
#uiSettingsR108 .ui108-gcount:empty{display:none}
#uiSettingsR108 .ui108-gbody{display:grid;gap:0;padding:0 10px 10px}
#uiSettingsR108 .ui108-gbody>section{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:22px;row-gap:0;margin:0;padding:10px 0 8px;border:0;border-top:1px solid rgba(201,169,107,.1);background:none}
#uiSettingsR108 .ui108-gbody>section:first-child{border-top:0}
#uiSettingsR108 .ui108-gbody>section>h3{grid-column:1/-1;margin:0 0 4px;font:600 12px/1.4 'Malgun Gothic',sans-serif;letter-spacing:.06em;color:#d4bc86}
#uiSettingsR108 .ui108-gbody>section>p,#uiSettingsR108 .ui108-gbody>section>details,#uiSettingsR108 .ui108-gbody>section>pre,#uiSettingsR108 .ui108-gbody>section>div{grid-column:1/-1}
#uiSettingsR108 .ui108-gbody>section>p{margin:0 0 6px;font-size:11px;line-height:1.5;color:#8f826b}
#uiSettingsR108 .ui108-gbody label{padding:7px 0}
#uiSettingsR108 .ui108-gbody>label,#uiSettingsR108 .ui108-gbody>p{margin:0;padding:8px 0;border-top:1px solid rgba(201,169,107,.1)}
#uiSettingsR108 .ui108-gbody>p{font-size:11px;color:#8f826b}
#uiSettingsR108 .ui108-gbody>div.actions{border-top:1px solid rgba(201,169,107,.1);margin:0;padding-top:8px}
#uiSettingsR108 .readout{margin:6px 0 0;padding:10px 12px;border:1px solid #3b3225;background:#0d0b08;color:#b9ad92;font:11px/1.65 Consolas,monospace;max-height:30vh}
#uiSettingsR108 #hospitalTestSettingsR84>div,#uiSettingsR108 #hospitalTestSettingsR84>details,#uiSettingsR108 #hospitalPCTest{margin:6px 0 0!important;padding:10px 12px!important;border:1px solid #3b3225!important;border-radius:0!important;background:#0d0b08!important;color:#c9bda4!important;font-size:12px!important}
#uiSettingsR108 #hospitalTestSettingsR84 button{padding:8px 14px;font-size:12px}
@media(max-width:600px){
 #panel:has(#uiSettingsR108){width:96vw}
 #uiSettingsR108 .ui108-head{padding:14px 14px 10px}
 #uiSettingsR108 .ui108-head h2{font-size:19px}
 #uiSettingsR108 .ui108-main{padding:12px 14px 10px;gap:10px}
 #uiSettingsR108 .ui108-card{padding:2px 12px 8px}
 #uiSettingsR108 .ui108-row{grid-template-columns:1fr 42px;gap:4px 10px}
 #uiSettingsR108 .ui108-vol>label:first-child{grid-column:1/-1}
 #uiSettingsR108 .ui108-qrow{grid-template-columns:1fr}
 #uiSettingsR108 .ui108-seg{justify-self:stretch}
 #uiSettingsR108 .ui108-seg button{padding:9px 6px;min-height:40px}
 #uiSettingsR108 .ui108-detail{margin:0 14px 18px}
 #uiSettingsR108 .ui108-gbody>section{grid-template-columns:1fr}
 #uiSettingsR108 .ui108-sumh{display:none}
}
@media(prefers-reduced-motion:reduce){#uiSettingsR108 *{transition:none!important}}
`;
 // HUD polish. CSS only, scoped under html.ui108 (switchable in 세부 조정). It restyles colour, border,
 // shadow, type and the grouping of the top-right buttons; ids, handlers, hotkeys, the compass and
 // every combat read-out stay where they are.
 const HUD_CSS=`
html.ui108{--u-g1:#ecd29a;--u-g2:#c9a96b;--u-g3:#8d7650;--u-g4:#5e4e34;--u-s0:#0a0806;--u-s1:#12100c;--u-s2:#1b1710;--u-ink:#e7dcc6;--u-ink2:#a89a82}
html.ui108 #modal{background:rgba(5,4,3,.84)}
html.ui108 #panel{background:linear-gradient(160deg,#1d1812 0%,#0d0b08 72%);border:1px solid #7b6542;border-radius:2px;box-shadow:0 0 0 1px #000,0 0 0 3px #17120c,0 0 0 4px #4d3f29,inset 0 1px 0 rgba(255,236,190,.08),0 26px 90px rgba(0,0,0,.85);color:var(--u-ink)}
html.ui108 #panel h1,html.ui108 #panel h2{color:#ecdab0;text-shadow:0 1px 0 #000}
html.ui108 #panel h3{color:#d9c391}
html.ui108 #panel p{color:#c9bda4}
html.ui108 .eyebrow{color:#a98d5b}
html.ui108 button{border-color:#5e4e34;border-radius:2px;background-image:linear-gradient(#352d21,#18140f);color:#e0d3b3;box-shadow:inset 0 1px 0 rgba(255,236,190,.07),0 1px 0 rgba(0,0,0,.5)}
html.ui108 button:hover{border-color:var(--u-g2);color:#fff0c8;filter:none}
html.ui108 button.primary{border-color:#b99b62;background-image:linear-gradient(#5a4528,#2c2213);color:#f6e6bd}
html.ui108 button.flat{background-image:none;background-color:transparent;box-shadow:none}
html.ui108 button:focus-visible{outline:2px solid var(--u-g1);outline-offset:2px}
html.ui108 .card,html.ui108 .storyArt{border-color:#4a3e2b}
html.ui108 .card.selected{border-color:#c9a96b}
html.ui108 select{border-color:#5e4e34;background-color:#14110d;color:#e0d3b3}
html.ui108 .bar{background:#0a0806;border-color:#4a3e2b}
/* header: title block + grouped actions */
html.ui108 header{background:linear-gradient(180deg,#1f1a13 0%,#0f0c09 100%);border-bottom:1px solid #6a5636;box-shadow:inset 0 1px 0 rgba(255,236,190,.08),inset 0 -1px 0 #000,0 8px 20px rgba(0,0,0,.5)}
html.ui108 .brand{color:#dbc590;text-shadow:0 1px 0 #000,0 0 14px rgba(201,169,107,.22);padding-right:18px;border-right:1px solid rgba(201,169,107,.16)}
html.ui108 .brand small{color:#8a7c62;letter-spacing:.2em}
html.ui108 .region strong{color:#f0e4c9;font-size:16px;letter-spacing:.03em;text-shadow:0 1px 0 #000}
html.ui108 .tag{margin-left:0;border:1px solid #7a6a4a;background:rgba(0,0,0,.4);color:#cdb67f;font-size:10px;letter-spacing:.14em;padding:2px 7px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.5)}
html.ui108 header .region small{color:#8f8369}
html.ui108 #quest.r93-dock #questInlineSummary{color:#d9c07f}
html.ui108 .topnav{gap:6px;align-items:center}
html.ui108 .topnav>button,html.ui108 #goldHudR72 button,html.ui108 #story-code-button{border:1px solid #5e4e34;border-radius:2px;background:linear-gradient(#2d251a,#16120d);color:#dccfae;font-size:12px;letter-spacing:.04em;padding:7px 12px;box-shadow:inset 0 1px 0 rgba(255,236,190,.09),0 1px 0 rgba(0,0,0,.6);transition:border-color .12s,color .12s,background .12s}
html.ui108 .topnav>button:hover,html.ui108 #goldHudR72 button:hover,html.ui108 #story-code-button:hover{border-color:var(--u-g2);color:#fff1cc;filter:none;background:linear-gradient(#3b3123,#1e1912)}
html.ui108 #story-code-button,html.ui108 #goldHudR72 button{background:transparent;border-color:rgba(141,118,80,.42);color:#a99a7b;font-size:11px;padding:5px 9px;box-shadow:none}
html.ui108 #story-code-button:hover,html.ui108 #goldHudR72 button:hover{background:rgba(201,169,107,.08)}
html.ui108 body.r93-dock #goldHudR72{padding-right:10px;margin-right:8px;border-right:1px solid rgba(201,169,107,.2)}
html.ui108 #menuBtn{border-color:#a98d5b;background:linear-gradient(#4b3b22,#271e12);color:#f6e6bd}
/* compass / guide, quest, notices */
html.ui108 #minipanel{background:radial-gradient(circle at 50% 40%,rgba(28,23,16,.92),rgba(9,7,5,.94));border:1px solid #6b5736;border-radius:2px;box-shadow:inset 0 0 0 1px #000,inset 0 1px 0 rgba(255,236,190,.1),0 6px 16px rgba(0,0,0,.5)}
html.ui108 #miniLabel{color:#a99b7f}
html.ui108 #quest{border-left-color:#c9a96b}
html.ui108 #noticeShelfR63R2{background:linear-gradient(90deg,#0b0907f2,#17120cf5 18%,#17120cf5 82%,#0b0907f2);border-top:1px solid rgba(201,169,107,.28);box-shadow:0 -4px 12px rgba(0,0,0,.45)}
html.ui108 #noticeShelfR63R2 #hint{color:#d6c9aa}
html.ui108 #noticeShelfR63R2 #toast{color:#f3d9a0}
html.ui108 #bossbar{background:linear-gradient(180deg,rgba(34,17,14,.95),rgba(12,8,7,.96));border:1px solid #7c4f40;box-shadow:inset 0 1px 0 rgba(255,200,170,.07),0 6px 18px rgba(0,0,0,.6)}
/* footer: stone slab, glass orbs, recessed slots */
html.ui108 footer{background:linear-gradient(180deg,#1b160f 0%,#0b0907 100%);border-top:1px solid #6a5636;box-shadow:inset 0 1px 0 rgba(255,236,190,.08),0 -10px 26px rgba(0,0,0,.55)}
html.ui108 #heroName{color:#ecd9ad;letter-spacing:.05em;text-shadow:0 1px 0 #000}
html.ui108 #portrait{border:1px solid #8d7650;background:radial-gradient(circle at 50% 35%,#2e261b,#0c0a07);box-shadow:inset 0 0 0 1px #000,0 2px 6px rgba(0,0,0,.6)}
html.ui108 #hpText,html.ui108 #resText{color:#b9ad92}
html.ui108 #xpText{color:#9a8c6c}
html.ui108 .r93-orb .fill{box-shadow:inset 0 -6px 12px rgba(0,0,0,.45)}
html.ui108 .r93-orb b{z-index:2}
html.ui108 .r93-orb::before{content:'';position:absolute;left:20%;right:20%;bottom:9%;height:16%;border-radius:50%;background:radial-gradient(ellipse at 50% 100%,rgba(255,255,255,.2),transparent 70%);pointer-events:none;z-index:1}
html.ui108 .r93-orb::after{content:'';position:absolute;left:15%;top:9%;width:50%;height:32%;border-radius:50%;background:radial-gradient(ellipse at 42% 32%,rgba(255,255,255,.5),rgba(255,255,255,.1) 58%,transparent 74%);transform:rotate(-26deg);pointer-events:none;z-index:1}
html.ui108 .skill{background-image:radial-gradient(ellipse at 50% 30%,#2b2318,#0c0a07 82%)}
html.ui108 .skill img{filter:drop-shadow(0 0 4px rgba(201,169,107,.28))}
html.ui108 .skill kbd{font:600 9px/1 Consolas,monospace;color:#d9c38f;letter-spacing:.02em}
html.ui108 .skill span.label{color:#cdbf9f}
html.ui108 #upgradeBtn{border-color:#8d7650;background-image:linear-gradient(#3d3120,#1f1810);color:#ecd9ad}
html.ui108 #awakeText{color:#b9a979}
html.ui108 #buildText{color:#857960}
/* touch layout (header/footer are hidden there) */
html.ui108 #mobileSettingsR63{border-color:#a98d5b;background-image:linear-gradient(#3d3120,#1c160e);color:#ecd9ad;border-radius:2px}
html.ui108 #heroCard.mobile-hud-r63{background:linear-gradient(180deg,rgba(27,22,15,.9),rgba(10,8,6,.92));border:1px solid #6b5736;border-radius:2px;box-shadow:inset 0 0 0 1px #000}
html.ui108 #mobileMapR74{background:rgba(20,16,11,.92);border:1px solid #6b5736;border-radius:2px;color:#e7dcc6;box-shadow:inset 0 0 0 1px #000}
html.ui108 #mobileAilmentR63{background:rgba(20,16,11,.9);border-color:#7a5b4a}
@media(prefers-reduced-motion:reduce){html.ui108 *{transition:none!important}}
`;
 function injectCss(){
  if(!REAL()||$('uiR108'))return;
  const s=document.createElement('style');s.id='uiR108';s.textContent=SETTINGS_CSS+HUD_CSS;(document.head||document.documentElement).appendChild(s);
 }

 // ---- start ------------------------------------------------------------------
 try{injectCss();if(REAL())document.documentElement.classList.toggle('ui108',prefs.polish);}catch(e){fail(e);}
 try{if(prefs.adaptive===false)perf()?.setAdaptive?.(false);}catch(e){fail(e);}

 window.__STORYWORLD_UI_R108__=Object.freeze({
  revision:REV,storageKey:KEY,groups:GROUPS.map(r=>({id:r[0],label:r[1]})),classify,cleanTitle,
  prefs:()=>({...prefs}),setPolish,setAdaptive,
  quality:Object.freeze({levels:LEVELS.map(r=>r[0]),get:()=>levelOf(),set:applyLevel,knobs:KNOBS.map(r=>({api:r[0],id:r[1]+r[2],key:r[2],low:r[3],normal:r[4],label:r[5]}))}),
  organise,
  inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},level:levelOf(),detailOpen:ui.detailOpen,openGroup:ui.group,lastError,presentationOnly:true,gameplayChanged:false,savesTouched:false})
 });
})();
