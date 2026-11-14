// R1036 CPU 검사: 불면귀 보스 구역 이름 카드(R255 '보스 구역 짧은 연출')의 실루엣이 옛 회백 해골 그림(엔진 e.path = bulmyeongwi_idle)이 아니라
//  지금 게임에서 쓰는 R760 불면귀 그림(Dots CX-0070BM 대기 시트 첫 칸)에서 나오는가.
//  사용자 2026-11-14 13:43Z "불면귀예고 실루엣 예전불면귀라 거슬림". 헤드리스 실측(qa/r1036/silhouette-probe.mjs): last303 카드가 692e4ae01c29_bulmyeongwi_idle.webp 로 그려졌다.
//  정상: 불면귀(last303 l303-boss) → assets/r760/boss/sheet-idle.webp 한 칸. 시트 끔 → R760 톤 자세 p4. 경계: 중간보스(last302)는 중간보스 시트, R760 꺼짐이면 엔진 그림 그대로(게임 몸도 옛 그림이므로).
//  회귀: 다른 보스(루시퍼 등)는 e.path 그대로, 미리보기에 path 를 직접 주면 그대로.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'../..');let n=0,bad=0;const ok=(c,m)=>{n++;if(c)console.log('ok  ',m);else{bad++;console.log('FAIL',m);}};
const read=f=>fs.readFileSync(path.join(R,f),'utf8');
const s760=read('client-source/bulmyeongwi-r760.js'),s255=read('client-source/story-fragments-r255.js');
ok(read('runtime-text/bulmyeongwi-r760.js')===s760,'R760 runtime copy matches client source');
ok(read('runtime-text/story-fragments-r255.js')===s255,'R255 runtime copy matches client source');
ok(/r96\/qa\/r1036\/r1036-silhouette-cpu-check\.cjs/.test(read('../.github/workflows/pages.yml')),'pages.yml runs this check');
const OLD=/bulmyeongwi_(idle|attack|rain|transition)|bulmyeongwi_b\./i;
const OLDPATH='assets/generated-v31224/actors-normalized/692e4ae01c29_bulmyeongwi_idle.webp';
// 작은 가짜 엔진: 캔버스는 drawImage 호출을 기록, rAF 는 손으로 돌린다
function world({zone='last303',prefs=null,enemies=[],withR760=true}={}){
 const draws=[],ensured=[],asked=[],rafs=[];let clock=0;
 const mkCanvas=()=>{const c={width:1,height:1,style:{},remove(){},onclick:null,getContext(){return g;}};const g={canvas:c,setTransform(){},clearRect(){},fillRect(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},save(){},restore(){},translate(){},scale(){},fillText(){},
   measureText:t=>({width:String(t).length*10}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4)}),
   drawImage(src,...a){draws.push({src,a});}};return c;};
 const store={};if(prefs)store['storyworld.r760.bulmyeongwi']=JSON.stringify(prefs);
 const imgFor=p=>({src:p,naturalWidth:p.includes('sheet-')?3072:672,naturalHeight:p.includes('sheet-')?512:384});
 const room={id:zone,layer:'STORY',enemies};
 const ctx={console,Math,JSON,Date,Object,Array,String,Number,Boolean,Set,Map,WeakMap,WeakSet,Promise,RegExp,Error,Uint8ClampedArray,isFinite,parseInt,
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},
  performance:{now:()=>clock},devicePixelRatio:1,innerWidth:1280,innerHeight:720,matchMedia:()=>({matches:false}),
  requestAnimationFrame:f=>{rafs.push(f);return rafs.length;},setTimeout:()=>0,setInterval:()=>0,addEventListener(){},removeEventListener(){},
  document:{createElement:()=>mkCanvas(),getElementById:()=>null,body:{appendChild(){}},head:{appendChild(){}}},
  readyImage:p=>{asked.push(String(p));return {image:imgFor(String(p)),ready:true};},ensureImages:ps=>{ensured.push(...ps);return Promise.resolve();},addImage(){},
  room,layer:'STORY',time:0,regionById:{last303:{title:'한약과 불면귀',bosses:[{name:'불면귀'}]},last302:{title:'잠들지 못하는 마을',bosses:[{name:'꼭두각시 실안개'}]},ep1a11:{title:'교만',bosses:[{name:'루시퍼'}]}},
  storyScene:null,advanceScene(){},openPanel(){},closePanel(){}};
 ctx.window=ctx;vm.createContext(ctx);if(withR760)vm.runInContext(s760,ctx);vm.runInContext(s255,ctx);
 const pump=(steps=30,dt=200)=>{for(let i=0;i<steps;i++){clock+=dt;const q=rafs.splice(0);for(const f of q)f(clock);}};
 return {ctx,draws,ensured,asked,pump,room,setScene:s=>{ctx.storyScene=s;}};}
const bossE=o=>({id:'B',nativeId:'l303-boss',name:'불면귀',boss:true,midboss:false,x:3,y:3,hp:1000,maxHp:1000,spawnState:'active',path:OLDPATH,...o});
const midE=o=>({id:'M',nativeId:'mb-last302-v31231',name:'꼭두각시 실안개',boss:false,midboss:true,x:3,y:3,hp:1000,maxHp:1000,spawnState:'active',path:'assets/episode1b/generated-v394/bulmyeongwi_b.webp',...o});
// 실루엣 그림(bossArt 의 base 캔버스에 처음 그린 원본)과 그 잘라 낸 칸
const firstArt=w=>w.draws.find(d=>d.src&&typeof d.src.src==='string');
// 1) 정상: 서사 장면(전투 전)이 처음 열릴 때 — advanceScene 경로
{const w=world({enemies:[bossE()]});const api=w.ctx.__STORYWORLD_BULMYEONGWI_R760__;
 ok(typeof api.portrait==='function','R760 exposes portrait(e)');
 const pr=api.portrait?.(bossE());ok(pr&&pr.path==='assets/r760/boss/sheet-idle.webp','portrait(불면귀) = R760 대기 시트 '+JSON.stringify(pr));
 ok(pr&&pr.crop&&pr.crop.x>=0&&pr.crop.y>=0&&pr.crop.x+pr.crop.w<=512&&pr.crop.y+pr.crop.h<=512&&pr.crop.w>=300&&pr.crop.h>=380,'portrait crop stays inside first 512 cell and holds the body '+JSON.stringify(pr?.crop));
 w.setScene({id:'last303',part:'pre',key:'pre:last303'});w.ctx.advanceScene();w.pump();
 const a=firstArt(w);ok(!!a,'name card drew a silhouette');ok(a&&!OLD.test(a.src.src),'silhouette source is not old grey art: '+(a?.src?.src));
 ok(a&&a.src.src==='assets/r760/boss/sheet-idle.webp','silhouette source = R760 idle sheet');
 ok(a&&a.a[2]<=512&&a.a[3]<=512&&a.a[0]+a.a[2]<=512,'silhouette uses one cell, not the whole 6-cell sheet '+JSON.stringify(a?.a?.slice(0,4)));
 ok(w.ensured.includes('assets/r760/boss/sheet-idle.webp')&&!w.ensured.some(p=>OLD.test(p)),'name card asks for the new sheet only');}
// 2) 미리보기(검수·녹화용 preview)도 같은 그림
{const w=world({enemies:[bossE()]});w.ctx.__STORYWORLD_STORY_FRAGMENTS_R255__.preview();w.pump();const a=firstArt(w);ok(a&&a.src.src==='assets/r760/boss/sheet-idle.webp','preview() uses R760 idle sheet too');}
// 3) 경계: 시트 끔 → 톤 자세(p4), 모두 끔 → 엔진 그림(게임 몸도 엔진 그림이라 일치)
{const w=world({enemies:[bossE()],prefs:{sheets:false}});const pr=w.ctx.__STORYWORLD_BULMYEONGWI_R760__.portrait?.(bossE());ok(pr&&/assets\/r760\/boss\/bulmyeongwi-p4\.webp$/.test(pr.path)&&!OLD.test(pr.path),'sheets off → toned pose p4 '+JSON.stringify(pr));}
{const w=world({enemies:[bossE()],prefs:{on:false}});ok(w.ctx.__STORYWORLD_BULMYEONGWI_R760__.portrait?.(bossE())===null,'R760 off → portrait null (card keeps engine art, same as the body)');
 w.setScene({id:'last303',part:'pre',key:'k'});w.ctx.advanceScene();w.pump();const a=firstArt(w);ok(a&&a.src.src===OLDPATH,'R760 off → card falls back to e.path');}
// 경계: 중간보스(last302)는 중간보스 시트
{const w=world({zone:'last302',enemies:[midE()]});const pr=w.ctx.__STORYWORLD_BULMYEONGWI_R760__.portrait?.(midE());ok(pr&&pr.path==='assets/r760/mid/sheet-idle.webp','midboss portrait = R760 mid idle sheet '+JSON.stringify(pr));}
// 경계: 쓰러진 불면귀도(죽은 뒤 다시 보기) 같은 그림
{const w=world({enemies:[bossE({hp:0})]});const pr=w.ctx.__STORYWORLD_BULMYEONGWI_R760__.portrait?.(bossE({hp:0}));ok(pr&&pr.path==='assets/r760/boss/sheet-idle.webp','dead boss still maps to new art');}
// 4) 회귀: 다른 지역 보스는 e.path 그대로
{const luc={id:'L',nativeId:'a11-boss',name:'루시퍼',boss:true,hp:10,spawnState:'active',path:'assets/x/lucifer.webp'};const w=world({zone:'ep1a11',enemies:[luc]});
 ok(w.ctx.__STORYWORLD_BULMYEONGWI_R760__.portrait?.(luc)===null,'other boss → portrait null');
 w.setScene({id:'ep1a11',part:'pre',key:'k'});w.ctx.advanceScene();w.pump();const a=firstArt(w);ok(a&&a.src.src==='assets/x/lucifer.webp','other boss card keeps its own art');}
// 회귀: 같은 이름이라도 다른 지역(last303 밖)의 '불면귀'는 바꾸지 않는다
{const e=bossE({nativeId:'x-boss'});const w=world({zone:'ep1a11',enemies:[e]});ok(w.ctx.__STORYWORLD_BULMYEONGWI_R760__.portrait?.(e)===null,'불면귀 outside last303 → null');}
// 회귀: 미리보기에 path 를 직접 주면 그대로(검수용)
{const w=world({enemies:[bossE()]});w.ctx.__STORYWORLD_STORY_FRAGMENTS_R255__.preview({path:'assets/x/given.webp'});w.pump();const a=firstArt(w);ok(a&&a.src.src==='assets/x/given.webp','preview({path}) keeps the given path');}
// 회귀: R760 이 없는 빌드(스크립트 순서·실패)에서도 카드는 e.path 로 뜬다
{const w=world({enemies:[bossE()],withR760:false});w.setScene({id:'last303',part:'pre',key:'k'});w.ctx.advanceScene();w.pump();const a=firstArt(w);ok(a&&a.src.src===OLDPATH,'no R760 → card still works with e.path');
 ok(w.ctx.__STORYWORLD_STORY_FRAGMENTS_R255__.inspect().stats.errors===0,'no R760 → R255 errors 0');}
console.log(`\nR1036 silhouette CPU check: ${n-bad}/${n} passed`);process.exit(bad?1:0);
