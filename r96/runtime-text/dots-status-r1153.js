// R1153 — Dots CX-0146ST·0148SG·0149SE·0150MX 적용(사용자 2026-11-18 07:53Z "개선적용 앵간하면 홀드도 개선적용해 배경처리같은거 잘하고",
//  07:59Z "모든모드에서 구분되게 각각 독립적이게").
//  ① 상태이상 9종(화상·중독·질병·빙결·속박·감전·시간 왜곡·타락·흑염 화상): 영웅·협동 동료·적마다 따로, 상태마다 따로
//     몸 위 반복 오버레이(6칸) + 머리 위 아이콘 한 칸씩(화면 HUD 캔버스). 모드(스토리·사몽·생존·협동)를 가리지 않는다. 글자 기호(♨ ☠ …)를 대신한다.
//     출처: R431 영웅별 상태(statusFor), 조종 영웅의 R61·R58·R53 상처 줄, 네온 중독 적, mark(actor,key,초) API.
//  ② 사몽 발현 문양: 라우렌·헌터·슬레이어·기억사수의 R572 코드 문양을 Dots 한 장 시트로(뒤층 전체 + 앞층 발 앞 고리). 페르소나 형상일 때 라우렌 문양은 건드리지 않는다.
//  ③ 서하 톱니바퀴·초침(R949 시간 붕괴의 톱니), ④ 슬레이어 낙인 1~5(R586), ⑤ 기억사수 R 조준 고리·연쇄 레이저(R561), ⑥ 배치 영웅 발밑 고리(R720 영웅색 웅덩이·고리 위에 흰 테두리 빛).
//  판정·피해·대기·키는 바꾸지 않는다(그림만). 시트가 덜 읽혔거나 꺼졌거나 좌표가 깨졌으면 false 를 돌려 원래 그림으로.
//  ctx.filter 안 씀. 끄기: localStorage 'storyworld.r1153.dots' {status:false} / {sigil:false} / {mix:false}.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_DOTS_STATUS_R1153__)return;
const REV='R1153-dots-status-sigil-1',KEY='storyworld.r1153.dots',DIR='assets/r1153/';
const P={icons:DIR+'status-icons.webp',overlay:DIR+'status-overlay.webp',brand:DIR+'slayer-brand.webp',reticle:DIR+'gunner-reticle.webp',chain:DIR+'gunner-chain.webp',gears:DIR+'seoha-clockwork.webp',deploy:DIR+'deploy-ring.webp'};
const ORDER=Object.freeze(['burn','poison','disease','chill','bind','shock','warp','curse','hellfire']);
const NAME=Object.freeze({burn:'화상',poison:'중독',disease:'질병',chill:'빙결',bind:'속박',shock:'감전',warp:'시간 왜곡',curse:'타락',hellfire:'흑염 화상'});
const ALIAS=Object.freeze({burn:'burn',fire:'burn',fireOpen:'burn',fissure:'burn',ignite:'burn','화상':'burn',
 poison:'poison',pollution:'poison',toxic:'poison',mist:'poison',swampMist:'poison','중독':'poison',
 disease:'disease',blight:'disease','질병':'disease',chill:'chill',frost:'chill',freeze:'chill',cold:'chill','빙결':'chill','냉상':'chill',
 bind:'bind',root:'bind',tendril:'bind','속박':'bind',shock:'shock',arc:'shock','감전':'shock',warp:'warp',rift:'warp','시간 왜곡':'warp',
 curse:'curse',brand:'curse',corrupt:'curse','타락':'curse','저주':'curse',hellfire:'hellfire',blackflame:'hellfire','흑염 화상':'hellfire','흑염':'hellfire'});
const SIGIL=Object.freeze({lauren:163.5,hunter:165.1,slayer:163.7,gunner:166});/* 발 피벗 y(칸 192×224, assets/r1153/index.json) */
const stats={overlays:0,icons:0,sigils:0,brand:0,reticle:0,chain:0,gears:0,deploy:0,baked:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
let prefs={status:true,sigil:true,mix:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const fin=v=>typeof v==='number'&&Number.isFinite(v);
const T=()=>{try{return fin(time)?time:0;}catch(_){return 0;}};
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lowFx=()=>G(()=>!!settings.lowFx,false);
const AH=()=>G(()=>actorHeight(),66*G(()=>zoom,1));
const asked=new Map();
function image(p){try{const g=typeof readyImage==='function'?readyImage(p):null;if(g&&g.image)return g.image;const n=Date.now();if(n-(asked.get(p)||-1e9)>1500){asked.set(p,n);if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});}}catch(e){fail(e);}return null;}
function scoped(o,f){if(typeof ctx.scope==='function')ctx.scope(o,f);else f();}
const idOf=a=>String(a&&(a.id??a.name)||'actor');
const hash=s=>{let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))|0;return Math.abs(h);};

// ---- ① 상태 이름 → 9종 ----------------------------------------------------------------------------
function keyOf(v){if(typeof v!=='string'||!v)return null;let s=v.replace(/^(r431-|r58-|r61-|native-|hospital-wound-r53-)/,'');if(ALIAS[s])return ALIAS[s];s=s.split(' · ')[0].trim();return ALIAS[s]||null;}
const marks=new WeakMap();
function mark(a,key,sec){const k=keyOf(key);if(!a||typeof a!=='object'||!k||!fin(sec)||!(sec>0))return false;let m=marks.get(a);if(!m){m={};marks.set(a,m);}m[k]=Math.max(m[k]||0,T()+sec);return true;}
function heroes(){try{const c=window.__STORYWORLD_COOP_SIM_R62__,m=c?.mode?.();if(m==='host'||m==='guest'){const l=c.livingPlayers?.();if(Array.isArray(l)&&l.length)return l.filter(a=>a&&a.hp>0);}}catch(_){}const p=G(()=>player,null);return p&&typeof p==='object'&&p.hp>0?[p]:[];}
function rowsOfPlayer(){const out=[],t=T();
 for(const name of ['__STORYWORLD_FIELDS_R61__','__STORYWORLD_REGIONAL_COMBAT_R58__','__STORYWORLD_HOSPITAL_WOUNDS_R53__'])for(const r of G(()=>window[name]?.statusRows?.()||[],[])){if(!r)continue;const k=keyOf(r.key)||keyOf(r.label);if(!k)continue;const u=fin(r.until)?r.until:fin(r.remaining)?t+r.remaining:NaN;if(fin(u))out.push({key:k,until:u});}
 return out;}
function collect(){const t=T(),res=[],F=G(()=>window.__STORYWORLD_THEME_FX_R430__,null),me=G(()=>player,null);
 const add=(a,rows)=>{const m=new Map();for(const r of rows){if(!r||!ORDER.includes(r.key)||!fin(r.until)||!(r.until>t))continue;m.set(r.key,Math.max(m.get(r.key)||0,r.until));}
  const mm=marks.get(a);if(mm)for(const k of Object.keys(mm))if(mm[k]>t)m.set(k,Math.max(m.get(k)||0,mm[k]));
  if(m.size)res.push({actor:a,list:ORDER.filter(k=>m.has(k)).map(k=>({key:k,until:m.get(k)}))});};
 for(const a of heroes()){let rows=[];try{if(typeof F?.statusFor==='function')rows=(F.statusFor(a)||[]).map(r=>({key:keyOf(r.key),until:r.until}));else if(a===me)rows=(F?.statusRows?.()||[]).map(r=>({key:keyOf(r.key),until:t+(+r.remaining)}));}catch(e){fail(e);}
  if(a===me)rows=rows.concat(rowsOfPlayer());add(a,rows);}
 let poisoned=null;try{const n=window.__STORYWORLD_NEON_TOXIC_R562__;if(n?.on?.())poisoned=new Set(n.inspect().poisoned||[]);}catch(_){}
 for(const e of G(()=>room.enemies,[])||[]){if(!e||!(e.hp>0)||e.deadRecorded)continue;const rows=poisoned&&poisoned.has(e.id)?[{key:'poison',until:t+.3}]:[];if(rows.length||marks.has(e))add(e,rows);}
 return res;}

// ---- ① 그리기 -----------------------------------------------------------------------------------
const SENT={type:'r1153-status',x:0,y:0,age:0,life:Infinity,r1153Sentinel:true};
function arm(on){try{if(typeof effects==='undefined'||!Array.isArray(effects))return;const i=effects.indexOf(SENT);if(on&&i<0){SENT.age=0;effects.push(SENT);}else if(!on&&i>=0)effects.splice(i,1);}catch(_){}}
let cache=[];
function drawActor(row,t){const a=row.actor;if(!fin(a.x)||!fin(a.y))return;const q=project(a.x,a.y);if(!q||!fin(q.x)||!fin(q.y))return;
 const hero=!room?.enemies?.includes?.(a),h=AH()*(hero?1:a.boss?1.5:a.midboss?1.25:1),aid=idOf(a),list=hero?row.list:row.list.slice(0,4);
 const ov=!lowFx()?image(P.overlay):null;
 if(ov)for(const s of list){const r=ORDER.indexOf(s.key),fr=Math.floor(t*8+hash(aid+s.key)%6)%6,W=h*1.75,sc=W/256;
  scoped({id:'r1153:st:'+aid+':'+s.key,kind:'effect',x:a.x,y:a.y+.02,presentationOnly:true,r1153:true},()=>{ctx.save();try{ctx.globalCompositeOperation='source-over';ctx.globalAlpha*=.92;ctx.drawImage(ov,fr*256,r*256,256,256,q.x-128*sc,q.y-220*sc,W,W);}finally{ctx.restore();}});stats.overlays++;}
}
// 머리 위 아이콘은 화면 위 HUD 캔버스(R51 체력 HUD 와 같은 길)에 그린다 — 어두운 지역·수묵화풍·조명에 묻혀 색이 바래지 않게(구분이 목적).
let surface=null;
function hudCanvas(){try{if(surface?.parentNode)return surface;const stage=document.getElementById('stage');if(!stage)return null;surface=document.createElement('canvas');surface.id='r1153-status-hud';surface.setAttribute('aria-hidden','true');
 const z=document.getElementById('combat-hud-r51')?.style?.zIndex||'3';Object.assign(surface.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:z});stage.appendChild(surface);return surface;}catch(e){fail(e);return null;}}
function paintHud(c){if(!c)return 0;const t=T(),ic=prefs.status?image(P.icons):null;let n=0;
 const shown=G(()=>started&&!loading&&!modal&&!storyScene,true);if(!shown){brandQ.clear();return 0;}if(!ic)return paintBrands(c);
 for(const row of cache){const a=row.actor;if(!fin(a?.x)||!fin(a?.y))continue;const q=G(()=>project(a.x,a.y),null);if(!q||!fin(q.x)||!fin(q.y))continue;
  const hero=!G(()=>room.enemies.includes(a),false),h=AH()*(hero?1:a.boss?1.5:a.midboss?1.25:1),list=hero?row.list:row.list.slice(0,4);
  const s=clamp(h*.36,16,26),gap=3,total=list.length*(s+gap)-gap,x0=q.x-total/2,y0=q.y-h*1.34-s-(hero?8:0);
  c.save();try{c.globalCompositeOperation='source-over';list.forEach((st,i)=>{const x=x0+i*(s+gap),left=st.until-t;c.globalAlpha=left<1?.45+.55*Math.abs(Math.sin(t*10)):1;
   c.fillStyle='rgba(10,8,14,.55)';c.beginPath();c.arc(x+s/2,y0+s/2,s*.56,0,Math.PI*2);c.fill();c.drawImage(ic,ORDER.indexOf(st.key)*128,0,128,128,x,y0,s,s);n++;});}finally{c.restore();}}
 stats.icons+=n;return n+paintBrands(c);}
function updateHud(){const cv=hudCanvas();if(!cv)return;const d=G(()=>dpr,1)||1,w=Math.max(1,Math.round(G(()=>W,innerWidth)*d)),h=Math.max(1,Math.round(G(()=>H,innerHeight)*d));if(cv.width!==w)cv.width=w;if(cv.height!==h)cv.height=h;
 const c=cv.getContext('2d');if(!c)return;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,w,h);if(!cache.length&&!brandQ.size)return;c.setTransform(d,0,0,d,0,0);paintHud(c);}
function drawAll(){if(typeof ctx==='undefined'||!ctx||typeof project!=='function'||!prefs.status)return;const t=T();for(const row of cache)try{drawActor(row,t);}catch(e){fail(e);}}

// ---- ② 사몽 발현 문양 ----------------------------------------------------------------------------
const personaForm=()=>G(()=>!!window.__STORYWORLD_PERSONA_HERO_R1113__?.formActive?.(),false);
function patchSigils(){const R=G(()=>window.__STORYWORLD_SAMONG_THEME_R572__,null);if(!R||typeof R.theme!=='function')return;
 for(const h of Object.keys(SIGIL)){let TH=null;try{TH=R.theme(h);}catch(_){}if(!TH||typeof TH.draw!=='function'||TH.__r1153||Object.isFrozen(TH))continue;const base=TH.draw,path=DIR+'sigil-'+h+'.webp',pv=SIGIL[h];
  TH.draw=function(L,x,fy,hh,F,t,a,lo){if(!prefs.sigil||(L!=='back'&&L!=='front')||!fin(x)||!fin(fy)||(h==='lauren'&&personaForm()))return base.apply(this,arguments);
   const im=image(path);if(!im)return base.apply(this,arguments);
   const sc=Math.max(40,fin(hh)?hh:0)/105,fr=Math.floor((fin(t)?t:T())*12.5)%24,u=(fr%6)*192,v=Math.floor(fr/6)*224,al=clamp(fin(a)?a:1,0,1)*(L==='front'?.85:.95),c0=L==='front'?Math.floor(pv-2):0;
   const own={id:'r1153:sigil-'+h+'-'+L,kind:'effect',x:G(()=>player.x,0),y:G(()=>player.y,0)+(L==='front'?.02:0),groundAligned:false,r572:true};if(L==='back')own.r350=true;
   scoped(own,()=>{ctx.save();try{ctx.globalCompositeOperation='source-over';ctx.globalAlpha*=al;ctx.drawImage(im,u,v+c0,192,224-c0,x-96*sc,fy+(c0-pv)*sc,192*sc,(224-c0)*sc);}finally{ctx.restore();}});stats.sigils++;};
  TH.__r1153=true;}}

// ---- ③~⑥ 혼합 이펙트(기존 파일이 묻는다) --------------------------------------------------------
// 낙인 방울도 머리 위 표시라 화면 HUD 캔버스에 그린다(월드에 그리면 어두운 지역에서 검게 묻힘 — 헤드리스 확인). 이번 그리기에서 받은 것만 그리고 비운다.
const brandQ=new Map();
function brandFrame(n,t){n=Math.min(5,Math.floor(n));return n>=5?4+(Math.floor((fin(t)?t:T())*5)%2):n-1;}
function brand(e,n,x,cy,t){if(!prefs.mix||!(n>=1)||!fin(x)||!fin(cy))return false;const im=image(P.brand);if(!im)return false;
 brandQ.set(e||{},{fr:brandFrame(n,t),x,cy});if(brandQ.size>64)brandQ.delete(brandQ.keys().next().value);stats.brand++;return true;}
function paintBrands(c){const im=image(P.brand);let n=0;if(im&&brandQ.size){const s=clamp(AH()*.0068,.32,.62);c.save();try{c.globalCompositeOperation='source-over';c.globalAlpha=1;for(const b of brandQ.values()){c.drawImage(im,b.fr*256,0,256,256,b.x-128*s,b.cy-78*s,256*s,256*s);n++;}}finally{c.restore();}}brandQ.clear();return n;}
function reticle(cx,cy,Wd,k,blink,wx,wy){if(!prefs.mix||!fin(cx)||!fin(cy)||!fin(Wd)||!(Wd>0))return false;const im=image(P.reticle);if(!im)return false;
 const fr=Math.min(7,Math.floor(clamp(fin(k)?k:0,0,1)*8)),s=Wd/216,al=clamp(fin(blink)?blink:1,0,1)*.95;
 const go=()=>{ctx.save();try{ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=al;ctx.drawImage(im,fr*256,0,256,256,cx-128*s,cy-128*s*1.15,256*s,256*s*1.15);}finally{ctx.restore();}};
 if(fin(wx)&&fin(wy))scoped({id:'r1153:reticle:'+wx.toFixed(2)+':'+wy.toFixed(2),kind:'effect',x:wx,y:wy,groundAligned:true},go);else go();stats.reticle++;return true;}
function chain(ax,ay,mx,my,ex,ey,H,fade,t,id,wx,wy){if(!prefs.mix||![ax,ay,mx,my,ex,ey,H].every(fin)||!(H>0))return false;const im=image(P.chain);if(!im)return false;
 const fr=Math.floor((fin(t)?t:T())*12.5)%8,s=H*.58/128,tw=256*s,al=clamp(fin(fade)?fade:1,0,1)*.95;let n=0;
 const go=()=>{for(const [x0,y0,x1,y1] of [[ax,ay,mx,my],[mx,my,ex,ey]]){const L=Math.hypot(x1-x0,y1-y0);if(!(L>1))continue;ctx.save();try{ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=al;ctx.translate(x0,y0);ctx.rotate(Math.atan2(y1-y0,x1-x0));
   for(let x=0;x<L;x+=tw){const w=Math.min(tw,L-x);ctx.drawImage(im,fr*256,0,256*w/tw,128,x,-64*s,w,128*s);n++;}}finally{ctx.restore();}}};
 if(fin(wx)&&fin(wy))scoped({id:'r1153:chain:'+String(id||''),kind:'effect',x:wx,y:wy},go);else go();stats.chain+=n;return n>0;}
function gears(cx,cy,R,t,alpha,dir,wx,wy){if(!prefs.mix||![cx,cy,R].every(fin)||!(R>0))return false;const im=image(P.gears);if(!im)return false;
 let fr=Math.floor((fin(t)?t:T())*8)%6;if(dir<0)fr=(6-fr)%6;const W=R*4.6,s=W/256,al=clamp(fin(alpha)?alpha:1,0,1);
 const go=()=>{ctx.save();try{ctx.globalCompositeOperation='source-over';ctx.globalAlpha*=al;ctx.drawImage(im,fr*256,0,256,256,cx-128*s,cy+R*.25-190*s,W,W);/* 어두운 바닥에서 회색으로 묻히지 않게 같은 장을 옅게 한 번 더 빛으로 */ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=.45;ctx.drawImage(im,fr*256,0,256,256,cx-128*s,cy+R*.25-190*s,W,W);}finally{ctx.restore();}};
 if(fin(wx)&&fin(wy))scoped({id:'r1153:gears:'+wx.toFixed(2)+':'+wy.toFixed(2),kind:'effect',x:wx,y:wy+.01,groundAligned:false},go);else go();stats.gears++;return true;}
// 배치 고리: 흰·회색 테두리 시트를 영웅색 빛 웅덩이·코드 고리(R720, 영웅 구분) 위에 'lighter' 로 얹는다.
//  (캔버스로 구운 그림은 Three 기록기가 받지 못해 화면에서 사라졌다 — 헤드리스 확인. 영웅색은 R720 웅덩이·고리가 맡는다)
function deploy(x,y,unit,col,t,i){if(!prefs.mix||!fin(x)||!fin(y)||!fin(unit)||!(unit>0))return false;const im=image(P.deploy);if(!im)return false;
 const fr=Math.floor((fin(t)?t:T())*8+(fin(i)?i:0))%8,s=unit*1.25/218;ctx.save();try{ctx.globalAlpha=.9;ctx.globalCompositeOperation='lighter';ctx.drawImage(im,fr*256,0,256,256,x-128*s,y-170*s*1.4,256*s,256*s*1.4);}finally{ctx.restore();}stats.deploy++;return true;}

// ---- 연결 --------------------------------------------------------------------------------------
function tickNow(){try{patchSigils();}catch(e){fail(e);}try{cache=prefs.status?collect():[];arm(cache.length>0);if(cache.length){image(P.icons);if(!lowFx())image(P.overlay);}}catch(e){fail(e);cache=[];}}
try{const H=window.__STORYWORLD_POST_HOOKS__;if(H&&typeof H.register==='function')H.register('__r1153',{tick:tickNow},fail);
 else if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);tickNow();return r;};}}catch(e){fail(e);}
try{if(typeof draw==='function'){const base=draw;draw=function(...a){let r;try{r=base.apply(this,a);}finally{try{updateHud();}catch(e){fail(e);}}return r;};}}catch(e){fail(e);}
try{if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e,...a){if(e===SENT||(e&&e.type==='r1153-status')){try{drawAll();}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};}}catch(e){fail(e);}
function set(v){prefs={...prefs,...(v&&typeof v==='object'?v:{})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}if(!prefs.status){cache=[];arm(false);}return{...prefs};}
window.__STORYWORLD_DOTS_STATUS_R1153__=Object.freeze({revision:REV,ORDER,NAME,paths:P,keyOf,mark,collect,tickNow,paintHud,brandFrame,brand,reticle,chain,gears,deploy,set,
 status:a=>{const r=collect().find(x=>x.actor===(a||G(()=>player,null)));return r?r.list.map(s=>({...s,name:NAME[s.key]})):[];},
 inspect:()=>({revision:REV,prefs:{...prefs},active:cache.map(r=>({id:idOf(r.actor),keys:r.list.map(s=>s.key)})),stats:{...stats},lastError,GPU:false})});
})();
