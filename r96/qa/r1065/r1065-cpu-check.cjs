// R1065 CPU 검사: Dots CX-0112MA r1 몹 공격 시트 7종(MA-02·03·04·06·07·08·10)을 엔진 frameFor 사슬 맨 바깥에서 공격·조준 동안만 바꿔 그린다.
//  바탕 그림(걷기 시트) 경로로 몹을 고르고, 바탕 프레임의 visibleHeight·pivot 을 몸 키 비율로 옮겨 크기·발 줄을 맞춘다.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.join(__dirname,'../..');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};
const F=path.join(R,'client-source','mob-attack-dots-r1065.js');ok(fs.existsSync(F),'overlay exists');const src=fs.readFileSync(F,'utf8');
function world({base,ready=true,left=null}={}){const store={},asked=[];
 const ctx={Math,String,Number,Array,Object,JSON,Map,WeakMap,Set,isFinite,setInterval:()=>0,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}}};ctx.window=ctx;vm.createContext(ctx);
 ctx.time=0;ctx.readyImage=p=>ready?{image:{naturalWidth:10}}:null;ctx.ensureImages=a=>{asked.push(...a);return Promise.resolve();};ctx.asked=asked;
 ctx.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({__r380:true,frameFor:(e,f)=>JSON.parse(JSON.stringify(e.__base||base))});
 if(left!==null)ctx.__STORYWORLD_ENEMY_FACE_R444__={left:()=>left};
 vm.runInContext(src,ctx);return ctx;}
const heel={path:'assets/r380/mobs/ep1b-red-heel-blade-walk-d1.webp',assetFrame:{sourceRect:[320,0,320,320],pivot:[160,318],visibleHeight:200},flip:false,r380Mob:'red-heel'};
const mob=o=>({id:'m1',name:'붉은 하이힐 칼날',hp:10,maxHp:10,combatProfile:{attackShape:{windup:.3,active:.15,recovery:.35}},...o});
const FF=c=>c.__STORYWORLD_STORY_COMBAT_R54__.frameFor;const API=c=>c.__STORYWORLD_MOB_ATTACK_DOTS_R1065__;
{const c=world({base:heel}),e=mob();ok(API(c)&&typeof API(c).covers==='function'&&typeof API(c).inspect==='function','API');
 const f0=FF(c)(e,null);ok(f0.path===heel.path&&f0.assetFrame.sourceRect[0]===320,'calm: base frame untouched');ok(API(c).covers(e),'covers after seen');
 const seen=new Set();for(let t=0;t<.8;t+=.02){e.attack={elapsed:t,angle:0};const f=FF(c)(e,null);ok(/assets\/r1065\/mobs\/ma-02-/.test(f.path),'attack: MA-02 sheet');seen.add(f.assetFrame.sourceRect[0]/f.assetFrame.sourceRect[2]);
  ok(f.assetFrame.sourceRect[1]===0&&f.assetFrame.sourceRect[2]>0&&f.assetFrame.sourceRect[3]>0,'cell rect');ok([...f.assetFrame.pivot,f.assetFrame.visibleHeight].every(Number.isFinite),'finite pivot/vh');}
 ok(seen.size===6&&[...seen].every(k=>Number.isInteger(k)&&k>=0&&k<6),'all 6 cells play in order range ('+[...seen]+')');
 e.attack={elapsed:.5,angle:0};const f=FF(c)(e,null);const M=API(c).inspect().sheets['MA-02'];const B=M.bases['r380/mobs/ep1b-red-heel-blade-walk-d1.webp'];const r=M.bodyH/B.bodyH;
 ok(Math.abs(f.assetFrame.visibleHeight-200*r)<1e-6,'visibleHeight scaled by body ratio');ok(Math.abs(f.assetFrame.pivot[1]-(M.anchor[1]+(318-B.bottom)*r))<1e-6,'pivot y follows foot line');
 const X=f.normalizedFullRectangleExtents;ok(Array.isArray(X)&&X.every(Number.isFinite)&&X[0]<0&&X[2]>0,'extents recomputed');
 e.attack=null;e.rangedWindup=.4;ok(FF(c)(e,null).assetFrame.sourceRect[0]===M.cell[0],'aim (rangedWindup): windup cell 2');e.rangedWindup=0;
 e.attack={elapsed:.1,r286Fake:true};ok(FF(c)(e,null).path===heel.path,'R286 fake attack: untouched');
 API(c).set(false);e.attack={elapsed:.5};ok(FF(c)(e,null).path===heel.path,'set(false): off');ok(c.localStorage.getItem('storyworld.r1065.mobatk')!==null,'pref saved');}
{// 바탕 경로가 표에 없으면 그대로, m033 공격 줄(y640)을 이미 쓰는 공급자는 그대로
 const c=world({base:{path:'assets/r380/mobs/purple-eggkeeper-v1.webp',assetFrame:{sourceRect:[0,0,256,256],pivot:[128,250],visibleHeight:150}}}),e=mob({attack:{elapsed:.4}});ok(FF(c)(e,null).path.includes('eggkeeper'),'unknown base: untouched');ok(!API(c).covers(e),'not covered');
 const m=p=>({path:'assets/r410/mobs/m033.webp',assetFrame:{sourceRect:[0,p,256,320],pivot:[128,300],visibleHeight:180}});
 const c2=world({}),e2=mob({name:'태엽 수집자',attack:{elapsed:.4},__base:m(640)});ok(FF(c2)(e2,null).path.includes('m033'),'m033 attack row 640 kept');
 const e3=mob({id:'m3',name:'태엽 수집자',attack:{elapsed:.4},__base:m(320)});ok(/ma-10-/.test(FF(c2)(e3,null).path),'m033 walk row replaced');}
{// 그림이 아직 안 읽혔으면 바탕 그대로 + 읽기 요청, 바탕 pivot 이 없으면 그대로
 const c=world({base:heel,ready:false}),e=mob({attack:{elapsed:.4}});ok(FF(c)(e,null).path===heel.path,'not ready: base');ok(c.asked.some(p=>/r1065/.test(p)),'ensureImages asked');
 const c2=world({base:{path:heel.path,assetFrame:{sourceRect:[0,0,320,320]}}}),e2=mob({attack:{elapsed:.4}});ok(FF(c2)(e2,null).path===heel.path,'no pivot/vh: base');}
{// 바탕 pivot 이 엉뚱해도 새 pivot 은 칸 안(엔진이 칸 밖 pivot 은 거절하고 시트 전체를 그림)
 for(const py of [-500,1000]){const c=world({base:{...heel,assetFrame:{...heel.assetFrame,pivot:[900,py]}}}),e=mob({attack:{elapsed:.4}});const f=FF(c)(e,null);const [,,w,h]=f.assetFrame.sourceRect,[x,y]=f.assetFrame.pivot;ok(x>=0&&x<=w&&y>=0&&y<=h,'pivot clamped into cell ('+py+')');ok(API(c).inspect().stats.clamped>=1,'clamp counted');}
 for(const [k,s] of Object.entries(API(world({base:heel})).inspect().sheets))for(const [bp,b] of Object.entries(s.bases)){const r=s.bodyH/b.bodyH;const py=s.anchor[1]+(b.bottom+8-b.bottom)*r;ok(py<=s.cell[1],k+' room below feet for '+bp);}}
{// 좌우: R444 가 정한 쪽(시트는 오른쪽을 봄)
 for(const L of [true,false]){const c=world({base:{...heel,flip:!L},left:L}),e=mob({attack:{elapsed:.4}});ok(FF(c)(e,null).flip===L,'flip follows R444 left='+L);}}
{// 맨 바깥 유지: 뒤에 다른 공급자가 감싸도 다시 감싼다
 const c=world({base:heel}),e=mob({attack:{elapsed:.4}});const S=c.__STORYWORLD_STORY_COMBAT_R54__;
 c.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({...S,frameFor:(x,f)=>({...heel,r999:true})});ok(FF(c)(e,null).r999,'other wrapper outside');
 API(c).install();ok(/ma-02-/.test(FF(c)(e,null).path),'reinstall puts R1065 outermost again');}
{// 7종 시트 파일·표
 const c=world({base:heel});const S=API(c).inspect().sheets;ok(Object.keys(S).sort().join()==='MA-02,MA-03,MA-04,MA-06,MA-07,MA-08,MA-10','7 sheets');
 for(const [k,s] of Object.entries(S)){const p=path.join(R,'runtime-text',s.path);ok(fs.existsSync(p)&&fs.statSync(p).size>1000,k+' sheet file');ok(s.cells===6&&s.cell.every(v=>v>0&&v<=400),k+' cell spec');}}
{// R286: 이 시트가 맡는 몹은 'full'(R286 내딛기를 겹치지 않음)
 const r286=fs.readFileSync(path.join(R,'client-source','mob-motion-r286.js'),'utf8');const i=r286.indexOf('function kindNow');ok(/__STORYWORLD_MOB_ATTACK_DOTS_R1065__\?\.covers\?\.\(e\)\)return 'full'/.test(r286.slice(i,i+600)),'R286 kindNow defers to R1065 covers');}
{const html=fs.readFileSync(path.join(R,'runtime-text/index.html'),'utf8');ok(html.split('"./mob-attack-dots-r1065.js"').length===2,'script tag once');
 ok(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8').includes('mob-attack-dots-r1065.js'),'runtime-inputs');
 ok(fs.readFileSync(path.join(R,'../scripts/verify-r96-public.py'),'utf8').includes('mob-attack-dots-r1065.js'),'public verify list');
 ok(fs.readFileSync(path.join(R,'../.github/workflows/pages.yml'),'utf8').includes('r96/qa/r1065/r1065-cpu-check.cjs'),'pages.yml');}
console.log('R1065 CPU check passed:',n);
