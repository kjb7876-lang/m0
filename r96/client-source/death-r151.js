// R151 — 영웅이 쓰러질 때 '기억은 남아 있습니다' 창이 바로 뜨는 대신, 드라이브 영웅 시트의 쓰러짐 6프레임(휘청 2 → 무릎 1 → 눕기 3)을
//  그 자리에서 보여 준 뒤 창을 연다(사용자 2026-10-30 "다크에덴·디아블로 등 참고해 전체 개선" — 디아블로류의 쓰러지는 연출).
//  · 그림: assets/r151/death/<영웅>/death-<방향>.webp (scripts/r143-attack-sheets.py ... death, 출처·해시는 각 index.json).
//    일곱 영웅은 2026-10-30 시트의 5방향(왼쪽 3방향은 반전), 환도는 10-30 저녁 추가분의 옆(e) 한 방향만이라 왼쪽을 보면 반전해 쓴다.
//  · 방향은 마지막 걷기 방향(R119), 없으면 영웅이 보는 방향. 발은 칸의 발 기준점(96,227)을 영웅 발밑점에, 키는 서 있기 키에 맞춘다.
//  · 0.17초마다 한 칸, 마지막 칸(누운 자세)에 머문 뒤 1.5초에 원래 창을 연다. 그림이 아직 안 받아졌거나 협동 모드·서사 장면 중이면 바로 원래대로.
//  · 쓰러진 뒤 게임 시간은 원래처럼 멈춰 있다(tick 이 체력 0 이면 돌지 않음). 판정·부활·저장·보상은 그대로. storyworld.r151.death {on:false} 로 끈다.
(()=>{'use strict';
if(window.__STORYWORLD_DEATH_R151__)return;
const REV='R151-death-1',KEY='storyworld.r151.death',FRAME_MS=170,HOLD_MS=1500,FOOT_Y=227;
const HEROES=['lauren','hwando','seoha','neon','michaela','hunter','slayer','gunner'],ONLY_E=new Set(['hwando']);
const DIR8=['e','se','s','sw','w','nw','n','ne'],SHEET={s:['s',0],se:['se',0],e:['e',0],ne:['ne',0],n:['n',0],sw:['se',1],w:['e',1],nw:['ne',1]},FOUR={front:'s',back:'n',left:'w',right:'e'};
const BODY_ART=/hero_direction|hero-authored|assets\/heroes\/|r91\/walk\/|r93\/idle\/|r119\/heroes\/|r121\/(?:heroes|walk)\/|r128\/gunner\/|r130\/[a-z]+\/|r143\/(?:attack|hit)\/|r144\/walk\/|awakening|^blob:/;
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={plays:0,frames:0,panels:0,immediate:0,skipped:0,errors:0,lastFrame:null};let lastError=null,dying=null,preTick=0;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const solo=()=>{const m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();return !m||m==='off';};
const pathOf=(h,d)=>'assets/r151/death/'+h+'/death-'+d+'.webp';
const sheetOf=(h,d8)=>ONLY_E.has(h)?(['w','nw','sw'].includes(d8)?['e',1]:['e',0]):(SHEET[d8]||SHEET.s);
const asked=new Map();
function image(p){try{const row=typeof readyImage==='function'?readyImage(p):null;if(row?.image)return row.image;const t=Date.now();if(t-(asked.get(p)||0)>1000){asked.set(p,t);if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});}}catch(e){fail(e);}return null;}
function facing(){try{const w=window.__STORYWORLD_VISUAL_R119__?.inspect?.()?.stats?.walkDir;if(DIR8.includes(w))return w;}catch(_){}return FOUR[player?.direction]||'s';}
const bodyMemo=new WeakMap();// 쓰러짐 첫 칸(서 있는 자세)의 머리 꼭대기로 몸 키를 잰다 — 걷기·공격과 같은 키로 그리기 위해
function bodyOf(im){let v=bodyMemo.get(im);if(v)return v;v=180;try{const c=document.createElement('canvas');c.width=192;c.height=256;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0,192,256,0,0,192,256);const d=g.getImageData(0,0,192,256).data;
 for(let y=0;y<256;y++){let hit=false;for(let x=46;x<146;x+=2)if(d[(y*192+x)*4+3]>24){hit=true;break;}if(hit){const m=FOOT_Y-y;if(m>=150&&m<=240)v=m;break;}}}catch(_){}bodyMemo.set(im,v);return v;}
function draw(rec,st){const D=dying;if(!D||!player)return;let best=null,bh=0;
 for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c.kind!=='image'||c.owner?.kind!=='hero'||!c.points||!BODY_ART.test(String(c.sourcePath||c.image?.src||'')))continue;const h=Math.abs(c.points[3][1]-c.points[0][1]);if(h>bh){bh=h;best=c;}}
 const im=D.im,n=Math.max(1,Math.round((im.naturalWidth||im.width)/192)),fr=Math.min(n-1,Math.floor((performance.now()-D.t0)/FRAME_MS));
 let ratio=.98;try{ratio=window.__STORYWORLD_VISUAL_R119__?.inspect?.()?.stats?.standRatio||.98;}catch(_){}
 const want=(typeof actorHeight==='function'?actorHeight():bh||54)*ratio,k=want/bodyOf(im),q=project(player.x,player.y),f=D.mir?-1:1,X=v=>q.x+f*(v-96)*k,Y=v=>q.y+(v-FOOT_Y)*k;
 // 체력 0 이면 본편은 영웅 몸을 그리지 않는다 — 바꿔 낄 몸 그림이 없으면 같은 자리(영웅 그리기 순서)에 직접 그린다.
 if(!best){const paint=()=>{rec.save();rec.globalAlpha=1;rec.translate(q.x,Y(0));rec.scale(f*k,k);rec.drawImage(im,fr*192,0,192,256,-96,0,192,256);rec.restore();};
  if(typeof rec.scope==='function')rec.scope({id:'hero:'+(player.id||'p')+':r151',kind:'hero',x:player.x,y:player.y,alive:false,bodyPath:D.path,groundAligned:false},paint);else paint();
  stats.frames++;stats.drawn=(stats.drawn||0)+1;stats.lastFrame=fr;return;}
 const before=best.image;
 Object.assign(best,{image:im,sourcePath:D.path,immutableTint:null,sourceRect:[fr*192,0,192,256],imageSize:[im.naturalWidth||im.width,im.naturalHeight||im.height],points:[[X(0),Y(0)],[X(192),Y(0)],[X(192),Y(256)],[X(0),Y(256)]],r151Death:true});
 if(best.style&&best.style.globalAlpha<1)best.style.globalAlpha=1;
 for(let i=rec.commands.length-1;i>=st;i--){const c=rec.commands[i];if(c!==best&&c.kind==='image'&&c.owner?.kind==='hero'&&(c.image===before||BODY_ART.test(String(c.sourcePath||c.image?.src||''))))rec.commands.splice(i,1);}
 stats.frames++;stats.lastFrame=fr;}
if(typeof drawHero==='function'){const base=drawHero;drawHero=function(...a){const rec=typeof ctx==='object'?ctx:null,st=Array.isArray(rec?.commands)?rec.commands.length:-1;const r=base.apply(this,a);
 try{if(dying&&player&&player.hp>0){dying=null;stats.revived=(stats.revived||0)+1;}/* R159: 새 게임·불러오기로 다시 살아나면 쓰러짐 그림을 멈춘다 */
  if(dying&&st>=0)draw(rec,st);else if(player&&HEROES.includes(player.hero)&&player.hp>0&&++preTick%30===0){/* 지금 보는 방향의 쓰러짐 그림을 미리 받아 둔다(지역마다 그림 기억이 비워짐) */const[sd]=sheetOf(player.hero,facing());image(pathOf(player.hero,sd));}}catch(e){fail(e);}return r;};}
if(typeof showDeath==='function'){const base=showDeath;showDeath=function(...a){
 if(dying)return;// 이미 쓰러지는 중 — 끝나면 창을 연다
 try{if(prefs.on&&solo()&&player&&HEROES.includes(player.hero)&&!storyScene&&typeof project==='function'){const d8=facing(),[sd,mir]=sheetOf(player.hero,d8),path=pathOf(player.hero,sd),im=image(path);
  if(im){dying={t0:performance.now(),path,im,mir,dir:d8};stats.plays++;const self=this;
   // R159: 원래 창이 하던 조작 정리·음성 멈춤은 쓰러지는 순간 바로(누르던 공격·막기 키가 1.5초 동안 남지 않게).
   try{if(typeof clearControls==='function')clearControls();if(typeof stopVoice==='function')stopVoice();}catch(e){fail(e);}
   setTimeout(()=>{dying=null;try{if(typeof started!=='undefined'&&started&&player&&player.hp<=0){stats.panels++;base.apply(self,a);}else stats.skipped++;}catch(e){fail(e);}},HOLD_MS);return;}}}catch(e){fail(e);}
 stats.immediate++;return base.apply(this,a);};}
function set(k,v){prefs[k]=!!v;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_DEATH_R151__=Object.freeze({revision:REV,set,FRAME_MS,HOLD_MS,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},dying:!!dying,lastError})});
})();
