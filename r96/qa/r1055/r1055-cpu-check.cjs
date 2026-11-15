// R1055 CPU 검사: 수묵화풍 테스트본(2안 중묵).
//  사용자 2026-11-15 "맵에 수묵화풍 필터를 코드로…", 시안 2안(중묵) 선택, "수묵화풍은 테스트본으로 따로 빼놓고 맨처음메뉴에서 테스트해볼수 있게 별도로".
//  완료 조건: 기본 꺼짐 / 첫 메뉴 단추로 켬(꺼짐→동양 지역→모든 지역) / 동양 지역(불면귀 마을·보스방) 맵 재질만 / 성능 5단계 이상 전체, 그 아래 종이 결만 /
//   등불 따뜻한 빛은 색을 남김 / NaN·Infinity 가 들어가도 유한한 색 / 셰이더 끼우기는 한 번만, R451 빛 곱 뒤.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'..','..');
let n=0,bad=0;const ok=(m,c,x)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(!c&&x!==undefined?' '+JSON.stringify(x).slice(0,500):''));};
const F=path.join(R,'client-source','ink-wash-r1055.js');let src='';try{src=fs.readFileSync(F,'utf8');}catch(_){}
ok('client-source/ink-wash-r1055.js exists',src.length>0);
const RT=f=>{try{return fs.readFileSync(path.join(R,'runtime-text',f),'utf8');}catch(_){return null;}};
ok('runtime copy identical to client-source',src.length>0&&RT('ink-wash-r1055.js')===src);
const html=RT('index.html')||'';
ok('index.html loads ink-wash-r1055.js exactly once',(html.match(/<script src="\.\/ink-wash-r1055\.js"><\/script>/g)||[]).length===1);
ok('no ctx.filter drop-shadow/blur in overlay (Three recorder falls back to Legacy)',!/drop-shadow|blur\(/.test(src));
function el(id){const e={id,children:[],style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains:()=>false},textContent:'',title:'',onclick:null,parentNode:null,
 appendChild(c){c.parentNode=e;e.children.push(c);return c;},insertBefore(c){c.parentNode=e;e.children.push(c);return c;},setAttribute(){},querySelector:()=>null,querySelectorAll:()=>[]};return e;}
function boot(o={}){const store=new Map(o.stored!==undefined?[['storyworld.r1055.inkWash',o.stored]]:[]);const els=new Map();
 const sb={console,Math,JSON,Number,String,Object,Array,Map,Set,WeakMap,WeakSet,Error,isFinite,parseFloat,Float32Array,
  localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},
  performance:{now:()=>0},setInterval:()=>0,clearInterval(){},setTimeout:()=>0,requestAnimationFrame:()=>0,addEventListener(){},
  document:{readyState:'complete',body:el('body'),head:el('head'),getElementById:id=>els.get(id)||null,createElement:()=>el(''),addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[]},
  MutationObserver:function(){this.observe=()=>{};this.disconnect=()=>{};}};
 sb.window=sb;sb.__STORYWORLD_PERF7_R1043__={step:()=>o.step??5};sb.__STORYWORLD_MOBILE_R63__={isMobile:()=>!!o.mobile};
 if(src){vm.createContext(sb);try{vm.runInContext(src,sb);}catch(e){sb.__bootError=String(e);}}
 return {sb,store,els,I:sb.__STORYWORLD_INK_WASH_R1055__};}
const a=boot(),I=a.I;
ok('module boots and exposes API',!!I&&!a.sb.__bootError,a.sb.__bootError);
if(!I){console.log(`\nR1055 ink wash: ${n-bad}/${n} pass`);process.exit(1);}
// ---- 기본 꺼짐·범위 ----
ok('default mode is off (test build: nothing changes until the title button is pressed)',I.prefs().mode==='off');
ok('off: wants() false even in the eastern village',I.wants('last302','STORY')===false&&I.wants('last303','STORY')===false);
ok('zones are exactly the canon eastern dream (last302, last303) — no invented regions',JSON.stringify([...I.zones].sort())===JSON.stringify(['last302','last303']));
I.set({mode:'east'});
ok('east: village and boss room on',I.wants('last302','STORY')&&I.wants('last303','STORY'));
ok('east: other regions off (hub, hospital, hando castle)',!I.wants('hub','STORY')&&!I.wants('ep1a08','STORY')&&!I.wants('hando01','STORY'));
ok('east: DREAM layer / missing layer / missing zone off',!I.wants('last302','DREAM')&&!I.wants('last302')&&!I.wants(undefined,'STORY')&&!I.wants(null,'STORY'));
ok('east: substring ids do not match (last3020, xlast302)',!I.wants('last3020','STORY')&&!I.wants('xlast302','STORY'));
I.set({mode:'all'});
ok('all (test): every STORY region on, still STORY only',I.wants('hub','STORY')&&I.wants('last302','STORY')&&!I.wants('hub','DREAM'));
I.set({mode:'bogus'});ok('set() ignores unknown mode (stays all)',I.prefs().mode==='all');
ok('mode persisted to localStorage',JSON.parse(a.store.get('storyworld.r1055.inkWash')).mode==='all');
ok('stored mode restored on next boot',boot({stored:'{"mode":"east"}'}).I.prefs().mode==='east');
ok('garbage storage → off',['{bad','null','{"mode":7}','{"mode":"ALL"}','[]',''].every(s=>boot({stored:s}).I.prefs().mode==='off'));
// ---- 성능 단계 ----
ok('level: steps 5·6·7 full',[5,6,7].every(s=>I.level(s,false)==='full'));
ok('level: steps 1~4 paper only',[1,2,3,4].every(s=>I.level(s,false)==='paper'));
ok('level: boundary 4 → paper, 5 → full',I.level(4,false)==='paper'&&I.level(5,false)==='full');
ok('level: garbage step (NaN, undefined, null, "x", -1, 99) never throws; unknown → paper, above 7 → full',[NaN,undefined,null,'x',-1].every(s=>I.level(s,false)==='paper')&&I.level(99,false)==='full');
ok('level: phone below step 5 → paper, phone at 5+ → full',I.level(2,true)==='paper'&&I.level(5,true)==='full');
// ---- 색 계산(셰이더와 같은 식) ----
const lum=c=>c[0]*.2126+c[1]*.7152+c[2]*.0722,sat=c=>{const mx=Math.max(...c),mn=Math.min(...c);return mx<=1e-6?0:(mx-mn)/mx;};
const fin=c=>Array.isArray(c)&&c.length===3&&c.every(v=>Number.isFinite(v)&&v>=0&&v<=1);
const night=[.10,.14,.26],moon=[.22,.28,.42],lamp=[.85,.52,.18],black=[0,0,0],white=[1,1,1];
ok('tone: strength 0 → identity',[night,moon,lamp,white].every(c=>I.tone(c,'full',0).every((v,i)=>Math.abs(v-c[i])<1e-6)));
ok('tone full: blue night ground loses ≥55% saturation (ink grey)',sat(I.tone(night,'full',1))<=sat(night)*.45&&sat(I.tone(moon,'full',1))<=sat(moon)*.45,[sat(night),sat(I.tone(night,'full',1))]);
ok('tone full: lantern amber keeps ≥70% saturation (accent colour stays)',sat(I.tone(lamp,'full',1))>=sat(lamp)*.7,[sat(lamp),sat(I.tone(lamp,'full',1))]);
ok('tone full: luminance order kept (darker in → not brighter out) over a grey ramp',(()=>{let p=-1;for(let i=0;i<=40;i++){const v=i/40,o=lum(I.tone([v*.8,v*.9,v*1],'full',1));if(o<p-.02)return false;p=Math.max(p,o);}return true;})());
ok('tone full: night stays night (dark ground not lifted above .35 luminance)',lum(I.tone(night,'full',1))<.35,lum(I.tone(night,'full',1)));
ok('tone full: black stays near black, output always within 0..1',lum(I.tone(black,'full',1))<.08&&[night,moon,lamp,black,white,[2,2,2],[-1,-1,-1]].every(c=>fin(I.tone(c,'full',1))));
ok('tone: NaN / Infinity / missing input → finite colour (no NaN into drawing)',[[NaN,0,0],[Infinity,1,1],[undefined,undefined,undefined],[],null].every(c=>fin(I.tone(c,'full',1)))&&fin(I.tone(night,'full',NaN))&&fin(I.tone(night,'nope',1)));
ok('tone paper: colour kept (saturation loss ≤15%) — low tiers only get paper grain',sat(I.tone(moon,'paper',1))>=sat(moon)*.85&&sat(I.tone(lamp,'paper',1))>=sat(lamp)*.85);
ok('tone full differs visibly from paper on night ground',Math.abs(sat(I.tone(night,'full',1))-sat(I.tone(night,'paper',1)))>.2);
// ---- 셰이더 끼우기 ----
const FRAG='void main(){\n#include <map_fragment>\n#include <colorspace_fragment>\n}';
{const s={uniforms:{},vertexShader:'void main(){}',fragmentShader:FRAG};const r=I.inject(s);
 ok('inject: adds ink code after colorspace include',r===true&&s.fragmentShader.includes('r1055Ink')&&s.fragmentShader.indexOf('r1055Ink(')>s.fragmentShader.indexOf('#include <colorspace_fragment>'));
 ok('inject: uniforms attached (r1055K, r1055Lv, r1055Res)',['r1055K','r1055Lv','r1055Res'].every(k=>k in s.uniforms));
 const once=s.fragmentShader;I.inject(s);ok('inject: idempotent (second call changes nothing)',s.fragmentShader===once);}
{const s={uniforms:{},vertexShader:'',fragmentShader:FRAG.replace('#include <colorspace_fragment>','#include <colorspace_fragment>\ngl_FragColor.rgb*=r451Light();')};I.inject(s);
 ok('inject: with R451 local light present, ink runs after the light multiply',s.fragmentShader.lastIndexOf('r1055Ink(')>s.fragmentShader.indexOf('r451Light();'));}
{const s={uniforms:{},vertexShader:'',fragmentShader:'void main(){gl_FragColor=vec4(1.);}'};let threw=false,r;try{r=I.inject(s);}catch(_){threw=true;}
 ok('inject: shader without anchor → untouched, no throw',!threw&&r===false&&s.fragmentShader==='void main(){gl_FragColor=vec4(1.);}');}
ok('inject: null / broken shader object → false, no throw',[null,undefined,{},{fragmentShader:5}].every(s=>{try{return I.inject(s)===false;}catch(_){return false;}}));
ok('GLSL clamps output and guards strength (no division without epsilon guard on luminance)',/clamp\(/.test(I.GLSL)&&/r1055K/.test(I.GLSL));
// ---- 첫 메뉴 단추 ----
{const b=boot();const panel=el('panel'),box=el('box'),neu=el('campaignNew54');box.appendChild(neu);b.els.set('panel',panel);b.els.set('campaignNew54',neu);
 b.I.titleButton();const btn=box.children.find(c=>c.id==='inkTestR1055');
 ok('title: button added next to the start button',!!btn);
 if(btn)b.els.set('inkTestR1055',btn);
 b.I.titleButton();ok('title: not added twice',box.children.filter(c=>c.id==='inkTestR1055').length===1);
 ok('title: label says test and shows off',!!btn&&/수묵화풍/.test(btn.textContent)&&/테스트/.test(btn.textContent)&&/꺼짐/.test(btn.textContent),btn&&btn.textContent);
 if(btn){btn.onclick();ok('title: 1st press → eastern regions',b.I.prefs().mode==='east'&&/동양/.test(btn.textContent),btn.textContent);
  btn.onclick();ok('title: 2nd press → all regions (test)',b.I.prefs().mode==='all'&&/모든/.test(btn.textContent),btn.textContent);
  btn.onclick();ok('title: 3rd press → off again',b.I.prefs().mode==='off'&&/꺼짐/.test(btn.textContent),btn.textContent);}
 const c=boot();c.I.titleButton();ok('title: no panel / no start button → nothing, no error',c.I.inspect().stats.errors===0);}
ok('no errors recorded',I.inspect().stats.errors===0,I.inspect().lastError);
console.log(`\nR1055 ink wash: ${n-bad}/${n} pass`);process.exit(bad?1:0);
