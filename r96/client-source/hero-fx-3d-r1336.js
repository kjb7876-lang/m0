// R1336 3D 영웅 투명화 고침(사용자 영상 11-26: 기억사수·EGO 가 EGO 각성·보호막·막기 중, 걸을 때도 3D 몸이 투명해짐).
// 원인(헤드리스 실측): 그림 출처 끝에 ':<자르기>:<번호>:hero:<영웅>' 표지가 붙어 EGO 오라·보호막(barrier-sigil) 같은
//  영웅 몫 이펙트도 영웅 이름을 품는다 → R1302 가 그 이펙트를 가장 큰 '몸'으로 뽑아 3D 불투명도를 이펙트 알파(.21~.65)로 낮춘다.
// hwando-3d-r1302.js 는 해시 고정(R1310 검사)이라 손대지 않고, R1302 가 명령을 읽기 바로 앞(CommandScene.render 바깥)에서
//  3D 몸이 보이는 동안 그 이펙트들을 먼저 뺀다. R1302 도 원래 그 이펙트를 '몸'으로 골라 숨기던 것이라 화면에 남는 것은 같고,
//  몸 고르기만 진짜 몸(그림 경로에 영웅 이름이 있거나 캔버스 몸)으로 돌아온다.
//  EGO 는 출처 표지가 원래 영웅(hwando)이라 R1302 가 못 숨기던 보호막·문양도 3D 몸 앞 흰 막이 되므로 같이 뺀다.
// R1363(사용자 11-27 "각성영웅 ego 몸체 깜빡임"): EGO 2D 몸(R1176 ego2d 시트)은 동작·방향이 바뀔 때 앞 시트를 .5 → 0 으로 흐리며
//  새 시트와 겹쳐 그린다. R1302 는 이름으로 고른 몸 후보 중 가장 큰 한 장의 알파를 3D 몸 불투명도로 쓰므로, 사라지는 앞 시트가
//  더 크면 3D 몸이 1 → .5 → 0 → 1 로 깜빡였다(헤드리스 실측, 환도는 시트가 하나라 그대로 1). 몸 후보로 뽑힌 명령은 모두 2D 에서
//  빠지므로(R1302) 그 후보들의 알파를 후보 중 가장 큰 값으로 맞춰 넘긴다 — 2D 그림은 그대로, 3D 몸만 겹쳐 그린 몸 전체의 불투명도를 따른다.
// 끄기: localStorage storyworld.r1336.heroFx3d = off. API __STORYWORLD_HERO_FX3D_R1336__.
(()=>{'use strict';
if(window.__STORYWORLD_HERO_FX3D_R1336__)return;
const REV='r1363-hero-fx-3d-2',KEY='storyworld.r1336.heroFx3d';
let on=true;try{on=localStorage.getItem(KEY)!=='off';}catch(_){}
const SIGIL_BEHIND=/(?:barrier-sigil|\/r1027\/barrier)\.(?:webp|png)$/i;
const stats={frames:0,steadied:0,lastSteady:0,removed:0,removedSigil:0,lastRemoved:0,lastHero:null,errors:0,lastError:null};
const imagePath=c=>{const s=String(c?.sourcePath||'');const m=s.match(/^.*?\.(?:webp|png|jpe?g|avif|gif)(?=$|[:?#])/i);return m?m[0]:s.replace(/:hero:[^:]*$/,'');};
// R1302 assetKey 와 같은 식.
const assetKey=value=>{try{return decodeURIComponent(new URL(String(value||''),document.baseURI).pathname).replace(/^\//,'');}catch(_){return String(value||'').replace(/^\.\//,'');}};
let look={t:-1,hero:null};const done=new WeakSet();
function r1302(){const R=window.__STORYWORLD_HWANDO3D_R1302__;if(!R||!R.on())return null;const now=performance.now();if(now-look.t>250){look.t=now;try{const i=R.inspect();look.hero=i.ready?i.hero:null;}catch(_){look.hero=null;}}return look.hero;}
// R1363: R1302 heroCommands 의 이름 고르기(named)와 같은 후보 — exact·marked 가 있으면 R1302 가 그것만 고르므로 손대지 않는다.
function steady(commands,hero){
 if(!hero||!Array.isArray(commands))return 0;const all=[];for(const c of commands)if(c?.kind==='image'&&c.owner?.kind==='hero'&&!c.owner.r350&&!c.owner.r945Clone)all.push(c);if(all.length<2)return 0;
 if(all.some(c=>c.owner.bodyPath&&assetKey(c.sourcePath)===assetKey(c.owner.bodyPath)))return 0;
 if(all.some(c=>(c.spatialRole==='body'||c.r350Lifted)&&(c.mutable||String(c.sourcePath||'').includes(hero))))return 0;
 const named=all.filter(c=>c.mutable||String(c.sourcePath||'').includes(hero));if(named.length<2)return 0;
 const top=Math.max(...named.map(c=>Math.max(0,Math.min(1,c.style?.globalAlpha??1))));let n=0;
 for(const c of named)if((c.style?.globalAlpha??1)<top){c.style={...(c.style||{}),globalAlpha:top};n++;}if(n)stats.steadied++;return n;}
// commands 를 제자리에서 고친다(R1302 와 같은 방식). 뺀 수를 돌려준다.
function filter(commands,hero){
 if(!hero||!Array.isArray(commands))return 0;
 const heroImgs=[];for(const c of commands)if(c?.kind==='image'&&c.owner?.kind==='hero'&&!c.owner.r350&&!c.owner.r945Clone)heroImgs.push(c);
 if(!heroImgs.length)return 0;
 // R1302 heroCommands 고르기 순서를 따른다: bodyPath 와 같은 행(exact)·몸 표지(marked)가 있으면 R1302 가 그것만 몸으로 골라
 //  알파가 맞고 이펙트도 2D 로 남는다 → 아무것도 안 뺀다. 이름(named) 고르기로 갈 때만 이펙트가 몸 후보로 섞인다.
 if(heroImgs.some(c=>c.owner.bodyPath&&assetKey(c.sourcePath)===assetKey(c.owner.bodyPath)))return 0;
 if(heroImgs.some(c=>(c.spatialRole==='body'||c.r350Lifted)&&(c.mutable||String(c.sourcePath||'').includes(hero))))return 0;
 // 진짜 몸이 이 프레임에 있어야 R1302 가 3D 를 그린다 — 없으면 2D 그대로(아무것도 빼지 않음).
 if(!heroImgs.some(c=>c.mutable||imagePath(c).includes(hero)))return 0;
 const drop=new Set();
 for(const c of heroImgs){if(c.mutable)continue;const p=imagePath(c),full=String(c.sourcePath||'');
  if(SIGIL_BEHIND.test(p)){drop.add(c);stats.removedSigil++;continue;}
  // 출처 표지로만 영웅 이름을 품은 이펙트(그림 경로에는 영웅 이름 없음) = R1302 가 몸 후보로 뽑아 숨기던 것.
  if(!p.includes(hero)&&full.includes(hero))drop.add(c);}
 if(!drop.size)return 0;
 for(let i=commands.length-1;i>=0;i--)if(drop.has(commands[i]))commands.splice(i,1);
 return drop.size;}
function wrap(){try{
 const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three,scene=r?.commands;
 if(!scene||typeof scene.render!=='function')return;
 const cur=scene.render;if(cur.__r1336fx||done.has(scene))return; // 바깥에 다른 감싸기가 서도 다시 감싸지 않는다(장면마다 한 번).
 if(!cur.__r1304)return; // R1302 가 먼저 감싼 뒤 그 바깥에 선다(R1302 는 __r1304 표지를 보고 다시 감싸지 않는다).
 const w=function(commands){if(on){try{stats.frames++;const hero=r1302();stats.lastHero=hero;const n=filter(commands,hero);stats.lastRemoved=n;stats.removed+=n;stats.lastSteady=steady(commands,hero);}catch(e){stats.errors++;stats.lastError=String(e&&e.message||e);}}return cur.apply(this,arguments);};
 w.__r1304=true;w.__r1336fx=true;scene.render=w;done.add(scene);
}catch(e){stats.errors++;stats.lastError=String(e&&e.message||e);}}
setInterval(wrap,400);wrap();
window.__STORYWORLD_HERO_FX3D_R1336__=Object.freeze({revision:REV,steady,on:()=>on,set:v=>{on=!!v;try{localStorage.setItem(KEY,on?'on':'off');}catch(_){}return on;},filter,imagePath,inspect:()=>({revision:REV,on,wrapped:(()=>{const sc=window.__STORYWORLD_PHASE1__?.controller?.state?.three?.commands;return !!sc&&done.has(sc);})(),...stats})});
})();
