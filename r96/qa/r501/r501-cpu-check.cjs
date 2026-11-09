// R501 CPU check: 설정 충돌 — ① 처음 화면·게임 중 설정 창에서 직접 고른 기본 설정(효과음·음악·서사 음성·간소화·흔들림 줄이기·음량)이
//  '이어하기'·슬롯 불러오기 때 세이브 안의 옛 값으로 되돌아가던 문제, ② '손전등 주변 시야' 체크가 R182 시야 고르기(0.5초마다 맞춤)에 덮여 눌러도 되돌아가던 문제.
const fs=require('fs'),path=require('path'),vm=require('vm');const ROOT=path.resolve(__dirname,'../../');const C=f=>fs.readFileSync(path.join(ROOT,'client-source',f),'utf8');
let n=0,bad=0;const ok=(m,c)=>{n++;if(!c){bad++;console.log('FAIL '+m);}else console.log('PASS '+m);};
// ---------- ① 기본 설정이 기기 전체 설정으로 남는지 ----------
function settingsBlock(){const src=C('access-r420.js');const a=src.indexOf('/* R501-SETTINGS-START */'),b=src.indexOf('/* R501-SETTINGS-END */');return a>=0&&b>a?src.slice(a,b):null;}
function boot(stored,{settings={sound:true,music:true,narration:true,lowFx:false,reducedMotion:false,volume:.7,bgm:.5,voice:.8}}={}){
 const store={};if(stored!==undefined)store['storyworld.r501.settings']=stored;const calls=[];const listeners={};
 const sb={console,Math,JSON,Object,Array,Number,String,RegExp,Error,setTimeout:f=>f(),queueMicrotask:f=>f(),localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}},window:{},
  document:{addEventListener:(t,f)=>{(listeners[t]=listeners[t]||[]).push(f);}},settings:{...settings},restoreSave:function(raw){calls.push(raw);return Promise.resolve('done');}};
 sb.window.document=sb.document;vm.createContext(sb);const code=settingsBlock();if(!code)return null;vm.runInContext(code,sb);
 const fire=(type,el)=>{for(const f of listeners[type]||[])f({type,target:el});};
 const ctl=(attr,key,extra)=>({dataset:attr==='setting'?{setting:key}:attr==='volume'?{volume:key}:{r114Preset:key},checked:extra?.checked,value:extra?.value,closest:s=>/#panel/.test(s)?{}:null,matches:()=>false});
 return {sb,store,calls,fire,ctl,api:sb.window.__STORYWORLD_SETTINGS_R501__};}
{const t=boot();ok('settings block exists in access-r420.js between R501 markers and exposes __STORYWORLD_SETTINGS_R501__',!!t&&!!t.api);}
{const t=boot();if(t){const raw={version:3,settings:{lowFx:true,sound:false}};t.sb.restoreSave(raw);ok('no stored choice: restoreSave gets the very same save object (old behaviour kept)',t.calls[0]===raw);}else ok('no stored choice',false);}
{const t=boot(JSON.stringify({lowFx:true,sound:false}));if(t){const raw={version:3,settings:{lowFx:false,sound:true,music:true,voicePreroll:0,volume:.3}};t.sb.restoreSave(raw);const s=t.calls[0]?.settings||{};
 ok('stored choice wins over the save: lowFx true, sound false after 이어하기',s.lowFx===true&&s.sound===false);ok('…keys the player never touched come from the save (music, voicePreroll, volume)',s.music===true&&s.voicePreroll===0&&s.volume===.3);ok('…the original save object is not mutated',raw.settings.lowFx===false&&raw.settings.sound===true);}else ok('stored choice',false);}
{const t=boot(JSON.stringify({volume:5,bgm:-2,voice:'0.4',sound:'yes',lowFx:1,reducedMotion:true}));if(t){t.sb.restoreSave({settings:{}});const s=t.calls[0]?.settings||{};
 ok('boundary: volume 5 → 1, bgm -2 → 0, numeric string voice "0.4" → 0.4',s.volume===1&&s.bgm===0&&s.voice===.4);ok('boundary: non-boolean sound/lowFx ignored, boolean reducedMotion kept',!('sound' in s)&&!('lowFx' in s)&&s.reducedMotion===true);}else ok('boundary',false);}
{let threw=false,t=null;try{t=boot('{oops');t&&t.sb.restoreSave({settings:{lowFx:false}});}catch(_){threw=true;}ok('corrupt stored JSON: no throw and save untouched',!!t&&!threw&&t.calls[0]?.settings?.lowFx===false);}
{const t=boot();if(t){const raw={version:3};t.store['storyworld.r501.settings']=JSON.stringify({narration:false});t.sb.restoreSave(raw);ok('save without a settings object still gets the stored choice',t.calls[0]?.settings?.narration===false);}else ok('no settings object',false);}
{const t=boot(JSON.stringify({lowFx:true,reducedMotion:true,volume:.2}));ok('on boot (title screen) the stored choice is applied to the live settings',!!t&&t.sb.settings.lowFx===true&&t.sb.settings.reducedMotion===true&&t.sb.settings.volume===.2&&t.sb.settings.sound===true);}
{const t=boot();if(t){t.sb.settings.lowFx=true;t.sb.settings.narration=false;t.fire('change',t.ctl('setting','lowFx',{checked:true}));const s=JSON.parse(t.store['storyworld.r501.settings']||'{}');
 ok('a player change of 간소화 VFX in the panel stores only that key (narration changed by code is not captured)',s.lowFx===true&&!('narration' in s));
 t.sb.settings.volume=.35;t.fire('input',t.ctl('volume','volume',{value:'.35'}));const s2=JSON.parse(t.store['storyworld.r501.settings']||'{}');ok('volume slider input stores volume and keeps lowFx',s2.volume===.35&&s2.lowFx===true);
 t.sb.settings.lowFx=false;t.fire('click',t.ctl('preset','mid'));const s3=JSON.parse(t.store['storyworld.r501.settings']||'{}');ok('그래픽 품질 preset click stores lowFx it set',s3.lowFx===false);}else ok('panel change',false);}
{const t=boot();if(t){t.sb.settings.lowFx=true;const el=t.ctl('setting','lowFx',{checked:true});el.closest=()=>null;t.fire('change',el);ok('changes outside the settings panel are ignored',!t.store['storyworld.r501.settings']);}else ok('outside panel',false);}
// ---------- ② 손전등 체크 ↔ 시야 고르기 ----------
function light(stored){const store={};if(stored)store['storyworld.r182.light']=stored;const els={};const grid={children:[],appendChild(c){this.children.push(c);reg(c);}};
 function mk(tag){const e={tagName:tag.toUpperCase(),children:[],style:{},classList:{toggle(){},contains(){return false;}},dataset:{},_l:{},appendChild(c){this.children.push(c);reg(c);return c;},append(...c){for(const x of c)this.appendChild(x);},setAttribute(){},addEventListener(t,f){(this._l[t]=this._l[t]||[]).push(f);},dispatch(t){if(this['on'+t])this['on'+t]({target:this});for(const f of this._l[t]||[])f({target:this});},closest(){return null;}};return e;}
 function reg(e){if(e.id)els[e.id]=e;for(const c of e.children||[])reg(c);}
 const box=mk('input');box.type='checkbox';box.id='flashlightModeR58';const sb={console,Math,JSON,Object,Array,Number,String,RegExp,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}},window:{},
  document:{getElementById:id=>{reg(grid);return els[id]||null;},querySelector:s=>/settings/.test(s)?grid:null,createElement:mk},addEventListener(){},requestAnimationFrame(){},settings:{flashlight58:false},room:{id:'hub'},started:true,player:{x:1,y:1},modal:false};
 sb.showSettings=function(){box.checked=sb.settings.flashlight58!==false;els.flashlightModeR58=box;};vm.createContext(sb);vm.runInContext(C('light-r182.js'),sb);const L=sb.window.__STORYWORLD_LIGHT_R182__;
 const open=()=>{sb.showSettings();return {box:els.flashlightModeR58,sel:els.lightModeR182};};return {L,open,sb};}
{const t=light(null);const {box,sel}=t.open();box.checked=true;box.dispatch('change');ok('checking 손전등 주변 시야 picks the flashlight sight mode (not undone by the 0.5 s R182 sync)',t.L.choice()==='flashlight'&&t.L.beam()===true);ok('…and the 시야 select shows 손전등',sel&&sel.value==='flashlight');
 box.checked=false;box.dispatch('change');ok('unchecking goes back to the default glow sight',t.L.choice()==='glow'&&t.L.beam()===false&&sel.value==='glow');}
{const t=light(JSON.stringify({mode:'torch',v:455}));const {box}=t.open();ok('opening settings in torch mode shows the 손전등 box checked (a beam is on)',box.checked===true);box.checked=false;box.dispatch('change');ok('…unchecking from torch goes to glow',t.L.choice()==='glow');}
{const t=light(null);const {box,sel}=t.open();sel.value='torch';sel.dispatch('change');ok('picking 횃불 in the select ticks the box',box.checked===true);sel.value='full';sel.dispatch('change');ok('picking 전체 in the select unticks the box',box.checked===false);}
{const t=light(JSON.stringify({mode:'full',v:455}));const {box}=t.open();box.checked=true;box.dispatch('change');ok('regression: checking from 전체 also lands on flashlight (R455: flashlight only when the player picks it)',t.L.choice()==='flashlight');}
console.log((bad?'R501 CPU CHECK FAILED ':'R501 CPU CHECK PASSED ')+(n-bad)+'/'+n);process.exit(bad?1:0);
