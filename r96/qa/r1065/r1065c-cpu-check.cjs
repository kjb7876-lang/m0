// R1065c CPU 검사: Dots 06:45Z 도착분 — CX-0117MA AT-03 생체기계 악몽 공격 6칸 + CX-0116RA 조준 4칸(RA-01 흑장미 눈가린 신도 · RA-03 설원 아래의 기계 다리).
//  조준 시트는 rangedWindup 동안만(손 올림 2칸 → 유지 2칸 반복), 공격 그림이 아니라 covers()·R286 'full' 에 넣지 않는다.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.join(__dirname,'../..');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};
const src=fs.readFileSync(path.join(R,'client-source','mob-attack-dots-r1065.js'),'utf8');
function world(base){const store={};const ctx={Math,String,Number,Array,Object,JSON,Map,WeakMap,Set,isFinite,setInterval:()=>0,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}}};ctx.window=ctx;vm.createContext(ctx);
 ctx.time=0;ctx.readyImage=()=>({image:{naturalWidth:10}});ctx.ensureImages=()=>Promise.resolve();
 ctx.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({frameFor:()=>JSON.parse(JSON.stringify(base))});vm.runInContext(src,ctx);return ctx;}
const FF=c=>c.__STORYWORLD_STORY_COMBAT_R54__.frameFor,API=c=>c.__STORYWORLD_MOB_ATTACK_DOTS_R1065__;
const mob=o=>({id:'m',hp:5,maxHp:5,combatProfile:{attackShape:{windup:.3,active:.15,recovery:.35}},...o});
const S=API(world({path:'x'})).inspect().sheets;
ok(['AT-03','RA-01','RA-03'].every(k=>S[k]),'AT-03·RA-01·RA-03 in table');ok(S['RA-01'].kind==='aim'&&S['RA-03'].kind==='aim'&&!S['AT-03'].kind,'kinds');
for(const k of ['AT-03','RA-01','RA-03']){const s=S[k];const p=path.join(R,'runtime-text',s.path);ok(fs.existsSync(p)&&fs.statSync(p).size>1000,k+' sheet file');
 ok(s.cells===(s.kind==='aim'?4:6),k+' cell count');const dim=require('child_process').execFileSync('python3',['-c','from PIL import Image;import sys;print(*Image.open(sys.argv[1]).size)',p]).toString().trim().split(' ').map(Number);
 ok(dim[0]===s.cell[0]*s.cells&&dim[1]===s.cell[1],k+' sheet size matches cell×cells');
 for(const [bp,b] of Object.entries(s.bases)){const r=s.bodyH/b.bodyH;ok(r>.9&&r<1.1,k+' body ratio ~1 for '+bp);ok(s.anchor[1]+8*r<=s.cell[1],k+' room below feet');}}
// AT-03: 공격 6칸, covers
{const base={path:'assets/r380/mobs/legacy-m134-nightmare-v4-walk-d1.webp',assetFrame:{sourceRect:[192,0,192,256],pivot:[96,214],visibleHeight:150}};
 const c=world(base),e=mob();ok(FF(c)(e,null).path===base.path,'AT-03 calm untouched');ok(API(c).covers(e),'AT-03 covers');const seen=new Set();
 for(let t=0;t<.8;t+=.02){e.attack={elapsed:t};const f=FF(c)(e,null);ok(/at-03-/.test(f.path),'AT-03 sheet in attack');seen.add(f.assetFrame.sourceRect[0]/f.assetFrame.sourceRect[2]);ok(f.assetFrame.pivot[1]<=f.assetFrame.sourceRect[3],'AT-03 pivot in cell');}
 ok(seen.size===6,'AT-03 all 6 cells');}
// RA-01/RA-03: 조준만, 공격·평상시는 바탕, covers 아님
for(const [k,base] of [['RA-01',{path:'assets/r363/mobs/L128.webp',assetFrame:{sourceRect:[256,320,256,320],pivot:[128,300],visibleHeight:180}}],['RA-03',{path:'assets/r380/mobs/cult-mech-legs-walk-d1.webp',assetFrame:{sourceRect:[320,0,320,320],pivot:[160,319],visibleHeight:180}}]]){
 const c=world(base),e=mob();ok(FF(c)(e,null).path===base.path,k+' calm untouched');ok(!API(c).covers(e),k+' aim sheet does not claim attack art');
 e.attack={elapsed:.3};ok(FF(c)(e,null).path===base.path,k+' real attack untouched (no attack sheet)');e.attack=null;
 e.rangedWindup=.8;const ks=[];for(let t=0;t<1.6;t+=.05){c.time=t;const f=FF(c)(e,null);ok(new RegExp(k.toLowerCase()+'-').test(f.path),k+' aim sheet during windup');ks.push(f.assetFrame.sourceRect[0]/f.assetFrame.sourceRect[2]);ok([...f.assetFrame.pivot,f.assetFrame.visibleHeight].every(Number.isFinite),k+' finite');}
 ok(ks[0]===0&&ks.includes(1)&&ks.includes(2)&&ks.includes(3),k+' raise 0→1 then hold 2·3 ('+[...new Set(ks)]+')');ok(ks.slice(ks.indexOf(2)).every(v=>v>=2),k+' no going back to raise cells during hold');
 e.rangedWindup=0;ok(FF(c)(e,null).path===base.path,k+' after windup: base');c.time=5;e.rangedWindup=.5;ok(FF(c)(e,null).assetFrame.sourceRect[0]===0,k+' next windup restarts at cell 0');}
// R248 직접 그리기(L128): aimR248 이 조준 동안만 칸을 준다
{const c=world({path:'x'}),A=API(c);ok(typeof A.aimR248==='function','aimR248 API');const e=mob();ok(A.aimR248(e,'assets/r363/mobs/L128.webp')===null,'aimR248: calm null');
 e.rangedWindup=.6;const ks=new Set();for(let t=0;t<1.2;t+=.05){c.time=t;const r=A.aimR248(e,'assets/r363/mobs/L128.webp');ok(r&&r.id==='RA-01'&&r.w>0&&r.h>0&&[r.sx,r.dx,r.dy,r.r].every(Number.isFinite),'aimR248 frame');ks.add(r.cell);}
 ok(ks.size===4,'aimR248 plays 4 cells');ok(A.aimR248(e,'assets/r380/mobs/legacy-m134-nightmare-v4-walk-d1.webp')===null,'aimR248: attack sheet not used for aim');
 e.attack={elapsed:.2};ok(A.aimR248(e,'assets/r363/mobs/L128.webp')===null,'aimR248: real attack null');}
{const r248=fs.readFileSync(path.join(R,'client-source','mob-unique-r248.js'),'utf8');ok(/aimR248\?\.\(e,s\.path\)/.test(r248)&&/if\(A\)\{ctx\.scale\(m\.face\*k\*A\.r/.test(r248),'R248 draws aim cell via R1065');}
// 죽음 시트(CX-0115MD 11종): R462 15세 재 소멸 동안 deathFrame 이 6칸을 준다
{const S2=API(world({path:'x'})).inspect().sheets;const D=Object.entries(S2).filter(([k,v])=>v.kind==='death');ok(D.length>=11,'at least 11 death sheets (R1111 adds 5 more) ('+D.map(x=>x[0])+')');
 for(const [k,s] of D){const p=path.join(R,'runtime-text',s.path);ok(fs.existsSync(p)&&fs.statSync(p).size>1000,k+' death file');ok(s.cells===(k==='MD-44'?4:6),k+' 6 cells (MD-44 존재하는 4칸)');
  for(const [bp,b] of Object.entries(s.bases)){const r=s.bodyH/b.bodyH;ok(r>.6&&r<1.4,k+' body ratio sane '+bp+' '+r.toFixed(2));}}
 const look={path:'assets/r380/mobs/legacy-m119-nameless-scar-v4-walk-d1.webp',flip:true,frame:{path:'assets/r380/mobs/legacy-m119-nameless-scar-v4-walk-d1.webp',assetFrame:{sourceRect:[192,0,192,256],pivot:[96,219],visibleHeight:190},flip:true}};
 const c=world({path:'x'}),A=API(c);ok(typeof A.deathFrame==='function','deathFrame API');const ks=[];
 for(let t=0;t<1.25;t+=.05){const d=A.deathFrame(look,t);ok(d&&/md-37-/.test(d.path)&&d.frame.assetFrame.visibleHeight>0&&d.frame.assetFrame.pivot.every(Number.isFinite),'death frame at '+t.toFixed(2));ok(d.frame.flip===true,'death keeps base flip');ks.push(d.cell);}
 ok(ks[0]===0&&ks[ks.length-1]===5&&ks.every((v,i)=>!i||v>=ks[i-1]),'death cells 0→5 in order');
 ok(A.deathFrame({...look,path:'assets/x.webp'},.3)===null,'no sheet: null');ok(/md-66-/.test(A.deathFrame({path:'assets/murder/other.png',name:'반복된 추락의 인과 잔향 3',frame:{assetFrame:{sourceRect:[0,0,10,10],pivot:[5,9],visibleHeight:9}}},.5)?.path||''),'name fallback (R248 직접 그리기 몹)');ok(A.deathFrame({path:'assets/x.png',name:'시간수문장 07'},.5)===null,'unlisted guardian: null');
 const d0=A.deathFrame(look,.5),S37=S2['MD-37'];ok(d0.frame.assetFrame.visibleHeight===S37.bodyH&&d0.frame.assetFrame.pivot[0]===S37.anchor[0]&&d0.frame.assetFrame.pivot[1]===S37.anchor[1],'size from R462 hPx: vh = sheet body, pivot = sheet foot');ok(A.deathFrame(look,NaN)===null,'NaN age: null');
 const c2=world({path:'x'});API(c2).set(false);ok(API(c2).deathFrame(look,.3)===null,'off: null');
 // 같은 바탕 경로에 공격 시트(MA-04)와 죽음 시트(MD-21)가 함께 있어도 서로 안 가림
 const w=world({path:'assets/r1029/float/wrath-satan.webp',assetFrame:{sourceRect:[0,0,287,256],pivot:[143,244],visibleHeight:150}});const e=mob({attack:{elapsed:.3}});ok(/ma-04-/.test(FF(w)(e,null).path),'MA-04 attack still on shared base');
 ok(/md-21-/.test(API(w).deathFrame({path:'assets/r1029/float/wrath-satan.webp',frame:{assetFrame:{sourceRect:[0,0,287,256],pivot:[143,244],visibleHeight:150}}},.5).path),'MD-21 death on same base');}
{const r462=fs.readFileSync(path.join(R,'client-source','mob-death-r462.js'),'utf8');const i=r462.indexOf('function drawDyingAsh');const seg=r462.slice(i,i+2600);
 ok(/deathFrame\?\.\(look,age\)/.test(seg),'R462 ash death asks R1065 deathFrame');ok(/if\(DF\)/.test(seg)&&/else if\(fade>\.01\)/.test(seg),'R462 falls back to silhouette without sheet');ok(!/blood/.test(seg.slice(0,seg.indexOf('const t=clamp01'))),'no blood in ash death (15세)');}
// R286 kindNow 은 covers 만 보므로 조준 전용 몹은 R286 판정 그대로
ok(/aim&&!covered\.has\(e\)|!aim&&!covered\.has\(e\)/.test(src),'covered set only for attack sheets');
{const pages=fs.readFileSync(path.join(R,'../.github/workflows/pages.yml'),'utf8');ok(pages.includes('r96/qa/r1065/r1065c-cpu-check.cjs'),'pages.yml');
 const v=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');for(const k of ['AT-03','RA-01','RA-03'])ok(v.includes(S[k].path.replace(/^assets\//,'assets/')),k+' in runtime-manifest');
 ok(fs.readFileSync(path.join(R,'runtime-text','mob-attack-dots-r1065.js'),'utf8')===src,'runtime copy matches');}
console.log('R1065c CPU check passed:',n);
