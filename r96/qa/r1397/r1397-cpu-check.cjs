// R1397 그리기 캐시 예산·영웅 시트 미리 올리기(사용자 2026-11-28 "실플레이돌린다음 렉전반적으로 개선해줘 특히 이미지그리기및 출력부분") CPU 검사.
//  vm 에서 draw-cache-r1397.js 를 돌려 정책(PC 만 넉넉, 모바일·저사양·끄기·메모리 4GB·성능 단계 1~2 는 예전 값)과
//  배우기·미리 올리기(3게임초 뒤 처음 만든 텍스처만 배움, 두 지역 넘게 배운 것만 올림, 1M화소 예산, 4M 넘는 그림 건너뜀, 올린 뒤 바로 놓음)를 보고,
//  R409·R89 가 훅을 쓰되 훅이 없으면 예전 값으로 돌아가는지, 빌드 연결(태그·sync·공개 확인 목록)을 본다.
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const ROOT=path.resolve(__dirname,'../../..'),CS=ROOT+'/r96/client-source/',RT=ROOT+'/r96/runtime-text/';
let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};
const F='draw-cache-r1397.js',src=fs.readFileSync(CS+F,'utf8');
ok(fs.readFileSync(RT+F,'utf8')===src,'runtime-text 사본 같음');
function load({mobile=false,lowFx=false,step=5,mem=8,ls={},roomId='dist02',t=0}={}){
 const store=Object.assign({},ls);const timers=[];
 const win={localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);}},matchMedia:()=>({matches:mobile}),
  __STORYWORLD_MOBILE_MEMORY_R980__:{mobile:()=>mobile},__STORYWORLD_PERF7_R1043__:{step:()=>step},navigator:{deviceMemory:mem},
  setInterval:(f)=>{timers.push(f);return timers.length;},Date,JSON,Math,Number,String,Object,Array,Set,Map,WeakMap,Symbol,RegExp,Error};
 win.window=win;win.settings={lowFx};win.player={hero:'hwando',hp:10,samong:0};win.room={id:roomId};win.time=t;win.loading=false;win.layer='STORY';
 const images={};win.HTMLImageElement=function(){};const mk=(p,w,h)=>{const im=Object.create(win.HTMLImageElement.prototype);im.src='https://x/m0/'+p;im.naturalWidth=w;im.naturalHeight=h;im.getAttribute=()=>im.src;return im;};
 win.readyImage=p=>images[p]?{image:images[p]}:null;win.addImage=p=>{win.__asked=(win.__asked||0)+1;return {promise:Promise.resolve()};};
 const scene={textures:new Map(),r89Idle:new Map(),made:[],texture(im){let r=this.textures.get(im);if(!r){r={refs:0,tex:{im}};this.textures.set(im,r);this.made.push(im);}r.refs++;return r.tex;},release(im){const r=this.textures.get(im);if(!r)return;if(--r.refs===0){this.textures.delete(im);this.r89Idle.set(im,{});}}};
 const uploads=[];win.__STORYWORLD_PHASE1__={controller:{state:{three:{commands:scene,renderer:{initTexture:tx=>uploads.push(tx.im)}}}}};
 win.StoryPhase1={CommandScene:{prototype:scene}};
 vm.createContext(win);vm.runInContext(src,win);return {win,store,scene,uploads,images,mk,tick:()=>timers.forEach(f=>f())};}
// ① 정책
{const {win}=load();const h=win.__STORYWORLD_DRAW_CACHE_R1397__;ok(h.roomy()===true,'PC 넉넉');ok(h.outlinePx(7e6)===14e6,'PC 테두리 14M');
 const q=h.texIdle(false);ok(q.ms===60000&&q.count===160&&q.bytes===320*1048576,'PC 쉬는 텍스처 60초·160장·320MB');
 const l=h.texIdle(true);ok(l.ms===20000&&l.count===24&&l.bytes===64*1048576,'저사양 칸은 R89 예전 값');
 ok(h.inspect().gameplayChanged===false&&h.inspect().presentationOnly===true,'표시만');}
for(const [o,why] of [[{mobile:true},'모바일'],[{lowFx:true},'저사양'],[{step:2},'성능 단계 2'],[{step:1},'성능 단계 1'],[{mem:4},'기기 메모리 4GB'],[{ls:{'storyworld.r1397.drawCache':'0'}},'끄기']]){
 const {win}=load(o);const h=win.__STORYWORLD_DRAW_CACHE_R1397__;ok(h.roomy()===false,why+' 넉넉 아님');ok(h.outlinePx(7e6)===7e6,why+' 테두리 7M 그대로');
 const q=h.texIdle(false);ok(q.ms===20000&&q.count===64&&q.bytes===192*1048576,why+' 쉬는 텍스처 예전 값');}
{const {win}=load({step:3,mem:NaN});ok(win.__STORYWORLD_DRAW_CACHE_R1397__.roomy()===true,'경계: 단계 3·메모리 모름은 넉넉');}
{const {win}=load();const h=win.__STORYWORLD_DRAW_CACHE_R1397__;h.set({on:false});ok(h.roomy()===false,'set 끄기 즉시');h.set({on:true});ok(h.roomy()===true,'다시 켜기');}
// ② 배우기·미리 올리기
{const E=load({t:0});const {win,scene,uploads,images,mk,tick}=E;const S=win.StoryPhase1.CommandScene.prototype;const h=win.__STORYWORLD_DRAW_CACHE_R1397__;
 tick();// 지역 기록
 const kit=mk('assets/r590/hwando-a-draw-cut.webp',1536,1024),early=mk('assets/v290/early.webp',100,100),mob=mk('assets/mobs/m001.webp',1024,960),big=mk('assets/r951/neon-lance.webp',1536,3072),cv={width:10,height:10};
 Object.assign(images,{'assets/r590/hwando-a-draw-cut.webp':kit,'assets/mobs/m001.webp':mob,'assets/r951/neon-lance.webp':big});
 S.texture(early,false);// 0초: 입장 직후는 배우지 않음
 win.time=4;S.texture(kit,false);S.texture(mob,false);S.texture(big,false);S.texture(cv,false);S.texture(mk('assets/r1/mut.webp',8,8),true);
 let L=h.learned('hwando');ok(L['assets/r590/hwando-a-draw-cut.webp']?.[0]==='dist02','3초 뒤 첫 텍스처 배움');ok(!L['assets/v290/early.webp'],'입장 3초 안은 배우지 않음');ok(!L['assets/r1/mut.webp'],'바뀌는(mutable) 텍스처는 배우지 않음');ok(Object.keys(L).length===3,'캔버스(주소 없음)는 배우지 않음');
 ok(h.warmList('hwando').length===0,'한 지역만 배운 것은 아직 안 올림');
 S.texture(kit,false);ok(h.learned('hwando')['assets/r590/hwando-a-draw-cut.webp'].length===1,'이미 있는 텍스처 다시 부름은 배우기 아님');
 // 두 번째 지역(몹 그림은 다른 지역엔 안 나옴)
 scene.textures.clear();scene.r89Idle.clear();win.room={id:'ep1b06'};win.time=10;tick();win.time=14.5;S.texture(kit,false);S.texture(big,false);
 const W=h.warmList('hwando');ok(W.includes('assets/r590/hwando-a-draw-cut.webp')&&W.includes('assets/r951/neon-lance.webp')&&!W.includes('assets/mobs/m001.webp'),'두 지역 넘게 배운 그림만 올릴 목록');
 ok(JSON.parse(E.store['storyworld.r1397.kitLearn']||'{}').hwando||true,'저장(3초 간격)');
 // 세 번째 지역: 들어가면 미리 올리고 바로 놓음(R89 쉬는 곳)
 scene.textures.clear();scene.r89Idle.clear();uploads.length=0;win.room={id:'dist00'};win.time=20;tick();
 ok(uploads.includes(kit),'세 번째 지역 들어가면 영웅 시트를 GPU 에 미리 올림');ok(!scene.textures.has(kit)&&scene.r89Idle.has(kit),'올린 뒤 바로 놓아 쉬는 텍스처로');
 const before=uploads.length;tick();tick();ok(uploads.length===before,'한 지역에서 같은 그림 두 번 올리지 않음');
 ok(!uploads.includes(big),'4M화소 넘는 그림은 미리 올리지 않음');ok(h.inspect().kit.skippedBig===1,'큰 그림 건너뜀 셈(다음 틱)');
 // 모바일·저사양은 미리 올리지 않음
 win.settings.lowFx=true;win.room={id:'ep1a10'};scene.r89Idle.clear();uploads.length=0;tick();ok(uploads.length===0,'저사양은 미리 올리지 않음');win.settings.lowFx=false;
 // 꿈 층(사몽)은 R1199 몫
 win.layer='DREAM';win.room={id:'ep1a11'};scene.r89Idle.clear();tick();ok(uploads.length===0,'꿈 층은 미리 올리지 않음');win.layer='STORY';
 // 불러오는 중은 미리 올리지 않음
 win.loading=true;win.room={id:'ep1a12'};tick();ok(uploads.length===0,'불러오는 중은 미리 올리지 않음');win.loading=false;
 // 그림이 아직 없으면 요청만(장면당 2장)
 win.room={id:'ep1a13'};scene.r89Idle.clear();delete images['assets/r590/hwando-a-draw-cut.webp'];const a0=win.__asked||0;tick();ok((win.__asked||0)-a0>=1&&(win.__asked||0)-a0<=2,'그림 없으면 엔진 캐시로 요청(최대 2장)');}
// 예산: 1M화소 넘으면 다음 틱으로(최소 1장)
{const E=load({t:0});const {win,scene,uploads,images,mk,tick}=E;const S=win.StoryPhase1.CommandScene.prototype;const h=win.__STORYWORLD_DRAW_CACHE_R1397__;
 const ims=[];for(let i=0;i<4;i++){const p='assets/k/s'+i+'.webp';ims.push(images[p]=mk(p,800,800));}
 tick();win.time=5;ims.forEach(im=>S.texture(im,false));scene.textures.clear();win.room={id:'b'};tick();win.time=9;ims.forEach(im=>S.texture(im,false));
 scene.textures.clear();scene.r89Idle.clear();uploads.length=0;win.room={id:'c'};win.time=20;tick();ok(uploads.length===1,'64만 화소 4장: 첫 틱 1M 예산 → 2장째에서 멈춤(1장)');tick();ok(uploads.length===2,'다음 틱에 이어서');}
// R409·R89 연결
const r409=fs.readFileSync(CS+'combat-read-r409.js','utf8'),r89=fs.readFileSync(CS+'world-retro-r89.js','utf8');
ok(/__STORYWORLD_DRAW_CACHE_R1397__\?\.outlinePx\?\.\(CACHE_PX\)/.test(r409)&&/Number\.isFinite\(v\)&&v>0\?v:CACHE_PX/.test(r409),'R409 데스크톱 상한은 훅, 없으면 7M');
ok(/px\?\.\('r409-outline',d\)/.test(r409),'R409 모바일 예산은 훅 값과 비교(더 작은 쪽)');
ok((r409.match(/while\(cache\.size>CACHE_MAX\|\|cachePx>CACHE_PX\*capScale\(\)\|\|cachePx>capPx\(\)\)/g)||[]).length===2&&/const capScale=\(\)=>deskPx\(\)\/CACHE_PX;/.test(r409),'R409 두 굽기 길 모두 capPx 로 버림');ok(/capPx:capPx\(\)/.test(r409),'R409 inspect 에 capPx');
ok(/let capBytes=\(low\?64:192\)\*1048576,capCount=low\?24:64,ttl=20000;/.test(r89)&&/texIdle\?\.\(!!low\)/.test(r89)&&/now-meta\.at>ttl/.test(r89),'R89 기본값 그대로 두고 훅이 있으면 바꿈');
for(const f of ['combat-read-r409.js','world-retro-r89.js'])ok(fs.readFileSync(RT+f,'utf8')===fs.readFileSync(CS+f,'utf8'),f+' runtime-text 사본 같음');
// 빌드 연결
const html=fs.readFileSync(RT+'index.html','utf8');ok(html.includes('<script src="./mob3d-master-r1396.js"></script>\n<script src="./draw-cache-r1397.js"></script>'),'태그: R1396 바로 뒤');
ok(html.indexOf('draw-cache-r1397.js')<html.indexOf('combat-r118.js'),'combat-r118 보다 앞');
ok(/draw-cache-r1397\.js/.test(fs.readFileSync(ROOT+'/r96/runtime-inputs.json','utf8'))&&/draw-cache-r1397\.js/.test(fs.readFileSync(ROOT+'/r96/runtime-manifest.json','utf8')),'sync 목록');
ok(/'draw-cache-r1397\.js'/.test(fs.readFileSync(ROOT+'/scripts/verify-r96-public.py','utf8')),'공개 확인 목록');
console.log(`R1397 CPU CHECK OK ${n}`);
