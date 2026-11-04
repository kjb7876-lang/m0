// R291 CPU check: 스킬·공격 키 QWER + ASDF, 상호작용 C, 예전 배치 토글(storyworld.r291.keys='legacy').
// 실제 소스의 키 처리기(엔진 keydown/keyup · 본편 W/E/R · R247 미카엘라 capture)와 keys-r291.js 를 한 VM 안에서
// 브라우저와 같은 순서(window capture 등록 순 → bubble 등록 순)로 돌려, 키마다 일어난 동작을 표로 비교한다.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');
const C=n=>fs.readFileSync(path.join(R,'client-source',n),'utf8'),RT=n=>fs.readFileSync(path.join(R,'runtime-text',n),'utf8');
let fails=0;const ok=(name,cond,info)=>{if(cond)console.log('PASS',name);else{fails++;console.log('FAIL',name,info===undefined?'':JSON.stringify(info).slice(0,900));}};
const idx=RT('index.html'),lines=idx.split('\n');
const lineStarting=p=>{const l=lines.find(s=>s.startsWith(p));if(!l)throw Error('missing source line: '+p);return l;};
const KR_SRC=lineStarting('var KR291=');
const ENGINE_DOWN=lineStarting("window.addEventListener('keydown',ev=>{if(['INPUT','TEXTAREA','SELECT'].includes(ev.target?.tagName)");
const ENGINE_UP=lineStarting("window.addEventListener('keyup',ev=>{keys.delete(ev.key);");
const WER_DOWN=lineStarting(" window.addEventListener('keydown',ev=>{if(ev.repeat||ev.ctrlKey||ev.metaKey||ev.altKey");
const mich=C('michaela-r247.js'),mStart=mich.indexOf("addEventListener('keydown',ev=>{try{if(!mine()");
const MICH_DOWN=mich.slice(mStart,mich.indexOf('},true);',mStart)+8);
const KEYS_SRC=C('keys-r291.js');

function world({legacy=false,dedupe=false,michaela=false}={}){
 const listeners=[];const log=[];
 const store=new Map(legacy?[['storyworld.r291.keys','legacy']]:[]);
 const win={localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem(){}},
  addEventListener:(type,fn,opt)=>listeners.push({type,fn,capture:opt===true||!!opt?.capture})};
 const doc={readyState:'complete',querySelectorAll:()=>[],getElementById:()=>null,addEventListener(){}};
 const sb={window:win,document:doc,console,
  storyScene:null,modal:false,loading:false,started:true,auto:false,keys:new Set(),
  unlockAudio(){},updateHUD(){},clearControls(){},advanceScene(){log.push('advanceScene');},closePanel(){log.push('closePanel');},
  basicAttack(){log.push('attack');},blink(){log.push('blink');},guardStart(){log.push('guard');},guardEnd(){log.push('guardEnd');},
  special(){log.push('special');},ego(){log.push('ego');},interact(){log.push('interact');},
  showWorld(){log.push('map');},showUpgrades(){log.push('upgrades');},showMenu(){log.push('menu');},
  bindings:{z:'w',x:'e',c:'r'},active:()=>true,cast(slot){log.push('cast-'+slot);},
  mine:()=>michaela,busy:()=>false,fire(sl){log.push('michaela-'+sl);},fail(e){throw e;},KEYS:{z:'w',x:'e'}};
 if(dedupe)delete sb.bindings.x;// R209 dedupe:true 일 때 지우는 본편 E 칸(X 키). R291 사용자 결정으로 기본은 dedupe:false(E 살아 있음)
 sb.addEventListener=win.addEventListener;
 vm.createContext(sb);
 vm.runInContext(KR_SRC,sb,{filename:'KR291'});
 // 실제 페이지 등록 순서: 엔진(bubble) → 본편 W/E/R(bubble) → R247 미카엘라(capture) → keys-r291(capture, 맨 끝 오버레이)
 vm.runInContext(ENGINE_DOWN+'\n'+ENGINE_UP.replace("window.addEventListener('blur',clearControls);",''),sb,{filename:'engine-keys'});
 vm.runInContext(WER_DOWN,sb,{filename:'wer-keys'});
 vm.runInContext(MICH_DOWN,sb,{filename:'michaela-keys'});
 vm.runInContext(KEYS_SRC,sb,{filename:'keys-r291.js'});
 const api=win.__STORYWORLD_KEYS_R291__;
 function dispatch(type,init){let stopped=false,immediate=false,prevented=false;
  const ev={type,key:init.key,code:init.code||'',repeat:!!init.repeat,shiftKey:!!init.shift,ctrlKey:!!init.ctrl,metaKey:false,altKey:!!init.alt,
   target:init.target||{tagName:'CANVAS'},isTrusted:true,preventDefault(){prevented=true;},stopPropagation(){stopped=true;},stopImmediatePropagation(){stopped=immediate=true;}};
  for(const phase of [true,false]){for(const l of listeners){if(l.type!==type||l.capture!==phase)continue;l.fn(ev);if(immediate)break;}if(stopped)break;}
  return {ev,prevented};}
 function press(init){const start=log.length;const d=dispatch('keydown',init);const afterDown=log.slice(start);const holdAttack=sb.keys.has('attack');
  const u=dispatch('keyup',{...init,repeat:false});return{down:afterDown,up:log.slice(start+afterDown.length),holdAttack,releasedAttack:!sb.keys.has('attack'),key:d.ev.key,code:d.ev.code,upKey:u.ev.key,trusted:d.ev.isTrusted,prevented:d.prevented};}
 return{sb,api,press,dispatch,log};
}
const code=k=>/^[a-z]$/.test(k)?'Key'+k.toUpperCase():/^[0-9]$/.test(k)?'Digit'+k:k===' '?'Space':k;
const P=(w,k,extra={})=>w.press({key:k,code:code(k),...extra});

// ---- 1. 새 배치 표: 키 → 동작(정확히 하나) ------------------------------------------------------------
{const w=world();
 ok('keys-r291 loads, new layout by default, exposes translate/logical/table',w.api&&w.api.legacy===false&&typeof w.api.translate==='function'&&w.api.rev==='R291-keys-1');
 ok('KR291 label table (new): interact C, W/E/R',w.sb.KR291&&w.sb.KR291.i==='C'&&w.sb.KR291.w==='W'&&w.sb.KR291.e==='E'&&w.sb.KR291.r==='R'&&w.sb.KR291.legacy===false);
 const EXPECT={a:['attack'],'1':['attack'],s:['blink'],'2':['blink'],d:['guard'],'3':['guard'],q:['special'],'4':['special'],f:['ego'],'5':['ego'],
  w:['cast-w'],'6':['cast-w'],e:['cast-e'],'7':['cast-e'],r:['cast-r'],'8':['cast-r'],c:['interact'],z:[],x:[],' ':[],m:['map'],p:['upgrades'],Escape:['menu'],g:[],t:[],l:[],j:[],ArrowUp:[],h:[],v:[],b:[],'9':[],'0':[]};
 const table=[];let allOk=true;
 for(const [k,exp] of Object.entries(EXPECT)){const r=P(w,k);table.push([k,r.down.join('+')||'-']);if(JSON.stringify(r.down)!==JSON.stringify(exp)){allOk=false;console.log('   mismatch',JSON.stringify(k),r.down,'expected',exp);}}
 console.log('   new layout (R209 default dedupe off = all 8 keys cast, non-Michaela):',table.map(([k,a])=>(k===' '?'Space':k)+'→'+a).join('  '));
 ok('every key does exactly its new action; none fires two actions (E/7 = story E, user decision "E·W 둘 다 되살리기")',allOk);
 {const d=world({dedupe:true});ok('with R209 dedupe:true (toggle) E/7 do nothing — no blink/interact fallback',P(d,'e').down.length===0&&P(d,'7').down.length===0);}
 const before=w.sb.auto;P(w,' ');ok('Space still toggles semi-auto',w.sb.auto===!before);
 const up=P(w,'ArrowUp');ok('arrows untouched (key ArrowUp reaches engine)',up.key==='ArrowUp');
 const a=P(w,'a');ok('A held → keys has attack; keyup A releases it',a.holdAttack&&a.releasedAttack);
 const one=P(w,'1');ok('1 held → attack; keyup releases',one.holdAttack&&one.releasedAttack);
 const d=P(w,'d');ok('D → guard start, keyup D → guard end',JSON.stringify(d.down)==='["guard"]'&&JSON.stringify(d.up)==='["guardEnd"]');
 const d3=P(w,'3');ok('3 → guard start, keyup 3 → guard end',JSON.stringify(d3.up)==='["guardEnd"]');
 ok('new keys keep isTrusted and code (only key is relabelled)',P(w,'w').trusted===true&&P(w,'w').code==='KeyW'&&P(w,'c').code==='KeyC');
 ok('W keyup is translated the same way as keydown (no stuck key)',P(w,'w').upKey==='z'&&P(w,'c').upKey==='e');
 ok('Shift+W / Shift+C still cast W / interact',JSON.stringify(P(w,'W',{shift:true,code:'KeyW'}).down)==='["cast-w"]'&&JSON.stringify(P(w,'C',{shift:true,code:'KeyC'}).down)==='["interact"]');
 ok('key repeat: holding W / R casts once (repeat ignored), holding C interacts once',P(w,'w',{repeat:true}).down.length===0&&P(w,'r',{repeat:true}).down.length===0&&P(w,'c',{repeat:true}).down.length===0);
 const ar=P(w,'a',{repeat:true});ok('holding A (repeat) keeps attack held without extra swing',ar.down.length===0&&ar.holdAttack);
 ok('Ctrl/Alt combos are not remapped (Ctrl+C copy, Ctrl+R reload, Ctrl+W)',P(w,'c',{ctrl:true}).down.length===0&&P(w,'r',{ctrl:true}).down.length===0&&P(w,'w',{ctrl:true}).down.length===0&&P(w,'c',{ctrl:true}).key==='c');
 const inp=P(w,'c',{target:{tagName:'INPUT'}});ok('typing in an input (777 code) is untouched: key stays c, nothing fires',inp.key==='c'&&inp.down.length===0);
 ok('textarea / contentEditable also untouched',P(w,'w',{target:{tagName:'TEXTAREA'}}).key==='w'&&P(w,'e',{target:{tagName:'DIV',isContentEditable:true}}).key==='e');
 // 한글 입력 상태: key 가 자모, code 는 KeyX
 const hang={ㅁ:['KeyA','attack'],ㄴ:['KeyS','blink'],ㅇ:['KeyD','guard'],ㅂ:['KeyQ','special'],ㄹ:['KeyF','ego'],ㅈ:['KeyW','cast-w'],ㄱ:['KeyR','cast-r'],ㅊ:['KeyC','interact'],ㅡ:['KeyM','map'],ㅔ:['KeyP','upgrades'],ㅋ:['KeyZ',null],ㅌ:['KeyX',null],ㄷ:['KeyE','cast-e']};
 let hOk=true;for(const [k,[c,act]] of Object.entries(hang)){const r=w.press({key:k,code:c});if(JSON.stringify(r.down)!==JSON.stringify(act?[act]:[])){hOk=false;console.log('   hangul mismatch',k,c,r.down);}}
 ok('Korean IME (jamo key + KeyX code) maps to the same layout',hOk);
 ok("'Process' key with KeyC code → interact",JSON.stringify(w.press({key:'Process',code:'KeyC'}).down)==='["interact"]');
 ok('numpad 6/7/8 = W/E/R like digits',JSON.stringify(w.press({key:'6',code:'Numpad6'}).down)==='["cast-w"]'&&JSON.stringify(w.press({key:'8',code:'Numpad8'}).down)==='["cast-r"]');
 ok('logical() helper reports the engine key',w.api.logical('w')==='z'&&w.api.logical('e')==='x'&&w.api.logical('r')==='c'&&w.api.logical('c')==='e'&&w.api.logical('z')==='Unidentified'&&w.api.logical('a')==='a'&&w.api.logical('g')==='g');
 ok('translate is idempotent (same event relabelled once)',(()=>{const ev={key:'w',code:'KeyW',target:null,type:'keydown'};w.api.translate(ev);w.api.translate(ev);return ev.key==='z';})());
 // G/T(황금실·은실)·L(조명) 처리기는 ev.code 로 듣는다 — code 는 절대 바뀌지 않는다
 ok('G / T / L codes untouched (golden/silver thread and light use ev.code)',P(w,'g').code==='KeyG'&&P(w,'t').code==='KeyT'&&P(w,'l').code==='KeyL'&&P(w,'g').key==='g');
 // 모달·서사 장면·불러오기 중에는 엔진이 키를 받지 않는다 — 새 키도 같다
 w.sb.modal=true;ok('modal open: C/W/A do nothing in the engine (unchanged rule)',P(w,'c').down.length===0&&P(w,'a').down.length===0);w.sb.modal=false;
 w.sb.storyScene={key:'x'};ok('story scene: C does nothing (Enter advances)',P(w,'c').down.length===0&&JSON.stringify(w.press({key:'Enter',code:'Enter'}).down)==='["advanceScene"]');w.sb.storyScene=null;
}
// ---- 2. 예전 배치(legacy) = R290 이전과 같다 -----------------------------------------------------------
{const w=world({legacy:true});
 ok('legacy: KR291 shows old letters (E, Z/X/C)',w.sb.KR291.legacy===true&&w.sb.KR291.i==='E'&&w.sb.KR291.w==='Z'&&w.sb.KR291.r==='C');
 const EXPECT={a:['attack'],s:['blink'],d:['guard'],q:['special'],f:['ego'],z:['cast-w'],x:['cast-e'],c:['cast-r'],e:['interact'],w:[],r:[],'6':[],'7':[],'8':[],m:['map'],p:['upgrades'],'1':['attack'],'5':['ego']};
 let allOk=true;for(const [k,exp] of Object.entries(EXPECT)){const r=P(w,k);if(JSON.stringify(r.down)!==JSON.stringify(exp)){allOk=false;console.log('   legacy mismatch',k,r.down,exp);}}
 ok("legacy 'storyworld.r291.keys'='legacy' restores E interact, Z/X/C skills, W/R/6-8 unbound",allOk);
 ok('legacy: overlay relabels nothing',P(w,'w').key==='w'&&P(w,'c').key==='c'&&w.api.map&&Object.keys(w.api.map).length===0);
}
// ---- 3. 새 키 = 예전 키와 똑같은 동작(설정·영웅 조합 모두) ------------------------------------------------
for(const opt of [{dedupe:true,michaela:false},{dedupe:false,michaela:false},{dedupe:true,michaela:true},{dedupe:false,michaela:true}]){
 const n=world(opt),o=world({...opt,legacy:true});
 const pairs=[['w','z'],['e','x'],['r','c'],['c','e'],['6','z'],['7','x'],['8','c'],['a','a'],['s','s'],['d','d'],['q','q'],['f','f'],['m','m'],['p','p']];
 const bad=pairs.filter(([nk,okey])=>JSON.stringify(P(n,nk).down)!==JSON.stringify(P(o,okey).down)).map(([nk,okey])=>nk+'≠'+okey+':'+P(n,nk).down+'/'+P(o,okey).down);
 ok('new W/E/R/C/6/7/8 do exactly what old Z/X/C/E did ('+(opt.michaela?'Michaela':'other heroes')+', R209 dedupe '+(opt.dedupe?'on':'off')+')',bad.length===0,bad);
 ok('old Z / X do nothing in the new layout ('+JSON.stringify(opt)+')',P(n,'z').down.length===0&&P(n,'x').down.length===0);
}
{const m=world({michaela:true});ok('Michaela: W → her R247 skill w (capture handler sees the new key via translate)',P(m,'w').down.includes('michaela-w')&&P(m,'e').down.includes('michaela-e')&&!P(m,'z').down.length);}

// ---- 4. 화면 글자: 예전 글자가 남지 않음 ------------------------------------------------------------------
{const files=['index.html','hospital-maze-progression.js','portal-interaction-r83.js','samong-r103.js','samong-zones-r115.js','upgrades-r169.js','play-r115.js','auto-levelup-r237.js','world-combat-r78.js','world-retro-r89.js','michaela-r247.js','hospital-pc-test.js'];
 const strip=s=>s.split('\n').filter(l=>!/^\s*\/\//.test(l)).join('\n').replace(/\/\*[\s\S]*?\*\//g,'');
 const pats=[/['"`>][^'"`<\n]{0,80}(?<![A-Za-z0-9_.$#-])E\s?(·|를|로|\))[^'"`<\n]{0,40}['"`<]/,/에서 E['")]/,/'E · /,/Z\s?[·/]\s?X\s?[·/]\s?C/,/\{w:'Z',e:'X',r:'C'\}/,/E 상호작용/];
 // 예전 글자는 legacy 갈래(KR291 표 줄·KR291.legacy?'…' 문자열)에만 남는다 — 그것만 빼고 본다. 'W·E·R' 은 새 글자.
 const left=[];for(const f of files){for(const line of strip(RT(f)).split('\n')){if(line.startsWith('var KR291='))continue;const L=line.replace(/(KR291\.legacy\)|legacyKeys\(\))\?'[^']*'/g,'');for(const p of pats){const m=L.match(new RegExp(p.source,'g'))||[];for(const x of m)if(!/기록 조작 콘솔|EGO|Enter|W\s?[·/]\s?E\s?[·/]\s?R/.test(x))left.push(f+': '+x.slice(0,70));}}}
 ok('no hard-coded old key letter left in visible strings (E prompts, Z/X/C)',left.length===0,left);
 ok('legacy branch keeps the old letters in one table (KR291) + r89 hint + pc-test help',/legacy\?\{legacy:true,i:'E',w:'Z',e:'X',r:'C'/.test(KR_SRC)&&/legacyKeys\(\)\?'Z\/X\/C':'W\/E\/R'/.test(C('world-retro-r89.js'))&&/'E':'C'\)\+' 상호작용'/.test(C('world-retro-r89.js')));
 ok('story W/E/R buttons show KR291 letters (kbd + aria-label)',/<kbd>'\+KR291\[slot\]\+'<\/kbd>/.test(idx)&&/aria-label',d\[0\]\+' · '\+KR291\[slot\]\)/.test(idx));
 ok('help panel lists the new keys from KR291',/<b>'\+\(window\.__STORYWORLD_KEYS_R291__\?\.werLabel\?\.\(\)\|\|KR291\.wer\)\+'<\/b><span>본편 W \/ E \/ R 전용 기술/.test(idx)&&/<b>'\+KR291\.i\+'<\/b><span>기억 표식/.test(idx));
 ok('static HTML: minimap portal label and title help line use C (legacy restores via keys-r291)',/<div id="miniLabel">포탈 앞에서 C · 이동<\/div>/.test(idx)&&/<span class="r291-i">C<\/span> 상호작용/.test(idx)&&/r291-i/.test(KEYS_SRC));
 ok('samong R115 data hints (E) converted when shown',/say\(z\.solve\.hint\?keyText\(z\.solve\.hint\)/.test(C('samong-zones-r115.js')));
 const ctx={KR291:{i:'C'}};vm.createContext(ctx);const kt=vm.runInContext("(t=>String(t).replace(/(^|[^A-Za-z0-9])E(?![A-Za-z0-9])/g,'$1'+(typeof KR291!=='undefined'&&KR291?KR291.i:'C')))",ctx);
 ok('keyText: (E)/표식에서 E/E로 → C, EGO untouched',kt('매듭을 끊으세요(E).')==='매듭을 끊으세요(C).'&&kt('둘레의 표식에서 E')==='둘레의 표식에서 C'&&kt('포탑 표식에서 E로 장악')==='포탑 표식에서 C로 장악'&&kt('EGO 각성')==='EGO 각성');
 ok('touch button (#touchUse 상호작용) unchanged — no letter, still calls interact',/<button id="touchUse">상호작용<\/button>/.test(idx));
}
// ---- 4b. R209 가 끈 칸은 안내하지 않는다(죽은 키 광고 금지), dedupe 끄면 다시 안내 ----------------------
{const mk=({legacy=false,dedupe=true,michaelaOn=true,hero=null}={})=>{const w=world({legacy});
  const REMOVED={hwando:['e'],seoha:['e'],neon:['e'],michaela:['e','w'],lauren:['e'],hunter:['e'],slayer:['e'],gunner:['e','w']};
  w.sb.window.__STORYWORLD_SKILLS_R209__={removed:(h,sl)=>dedupe&&!!REMOVED[h]?.includes(sl)};
  w.sb.window.__STORYWORLD_MICHAELA_R247__={on:()=>michaelaOn};
  if(hero){w.sb.player={hero};w.sb.started=true;}return w.api;};
 ok('labels: hwando → W / R (E slot removed by R209)',mk({hero:'hwando'}).werLabel()==='W / R');
 ok('labels: gunner → R only (W·E removed)',mk({hero:'gunner'}).werLabel()==='R');
 ok('labels: michaela with R247 → W / E / R (her new W·E skills)',mk({hero:'michaela'}).werLabel()==='W / E / R');
 ok('labels: michaela with R247 off → R',mk({hero:'michaela',michaelaOn:false}).werLabel()==='R');
 ok('labels: R209 dedupe off → W / E / R again',mk({hero:'hwando',dedupe:false}).werLabel()==='W / E / R');
 ok('labels: no hero yet (title) → slots usable by some hero = W / E / R (Michaela R247 owns E); without R247 → W / R',mk().werLabel(' / ',null)==='W / E / R'&&mk({michaelaOn:false}).werLabel(' / ',null)==='W / R');
 ok('labels: legacy → Z / C for hwando',mk({legacy:true,hero:'hwando'}).werLabel()==='Z / C');
 ok('help panel / r89 hint / title use werLabel (live slots only)',/__STORYWORLD_KEYS_R291__\?\.werLabel\?\.\(\)\|\|KR291\.wer\)\+'<\/b>/.test(idx)&&/werLabel\?\.\('\/'\)/.test(C('world-retro-r89.js'))&&/<span class="r291-wer">W \/ E \/ R<\/span>/.test(idx));
 ok('skill buttons of removed slots stay hidden by R209 (hideButtons untouched)',/function hideButtons\(\)/.test(C('skills-r209.js'))&&/if\(b\.x==='e'\)delete b\.x;/.test(C('skills-r209.js')));
}
// ---- 5. 연결(다섯 곳) ----------------------------------------------------------------------------------
{ok('runtime copy matches client-source',RT('keys-r291.js')===KEYS_SRC&&RT('michaela-r247.js')===C('michaela-r247.js'));
 ok('script tag: after michaela-r247 and mob-art-r290, before R287/R292 (they must stay the outermost drawProp wrappers) and combat-r118',/<script src="\.\/mob-motion-r286\.js"><\/script>(<script src="\.\/mob-art-r290\.js"><\/script>)?(<script src="\.\/light-atmos-r300\.js"><\/script>)?(<script src="\.\/env-props-r299\.js"><\/script>)?(<script src="\.\/props-fit-r303\.js"><\/script>)?(<script src="\.\/hud-bgm-hwando-w-r313\.js"><\/script>)?(<script src="\.\/boss-prop-control-r314\.js"><\/script>)?(<script src="\.\/bgm-map-r308\.js"><\/script>)?(<script src="\.\/mobile-perf-r298\.js"><\/script>)?<script src="\.\/keys-r291\.js"><\/script>/.test(idx)&&idx.indexOf('"./michaela-r247.js"')<idx.indexOf('"./keys-r291.js"')&&idx.indexOf('"./keys-r291.js"')<idx.indexOf('"./combat-r118.js"')&&idx.split('"./keys-r291.js"').length===2);
 ok('in verify-r96-public list',/'keys-r291\.js'/.test(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8')));
 ok('in pages.yml CPU checks',/node r96\/qa\/r291\/r291-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')));
 ok('in runtime-inputs textPaths',JSON.parse(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8')).textPaths.includes('keys-r291.js'));
 ok('r176 order regex knows keys-r291',/keys-r291/.test(fs.readFileSync(path.join(R,'qa','r176','r176-cpu-check.cjs'),'utf8')));
 ok('KR291 defined before the engine script (line-144 inline script)',idx.indexOf('var KR291=')>0&&idx.indexOf('var KR291=')<idx.indexOf("window.addEventListener('keydown',ev=>{if(['INPUT'"));
 ok('CI browser smoke presses C (not E) for the portal',/keyboard\.press\('c'\)/.test(fs.readFileSync(path.join(ROOT,'scripts','r96.browser.mjs'),'utf8'))&&!/keyboard\.press\('e'\)/.test(fs.readFileSync(path.join(ROOT,'scripts','r96.browser.mjs'),'utf8')));
}
console.log(fails?fails+' failed':'all passed');process.exit(fails?1:0);
