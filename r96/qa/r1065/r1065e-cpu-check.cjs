// R1065e CPU 검사: Dots r2(11-16 08:20Z) — RA-05 옥상으로 돌아온 기억 잔향·RA-07 이동문 청람잔영 조준 4칸(R248 직접 그리기 몹, aimR248), AT-07 중간보스 극지 사이보그 개 공격 6칸(이름 제한).
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.join(__dirname,'../..');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};
const src=fs.readFileSync(path.join(R,'client-source','mob-attack-dots-r1065.js'),'utf8');
function world(base){const store={};const ctx={Math,String,Number,Array,Object,JSON,Map,WeakMap,Set,RegExp,isFinite,setInterval:()=>0,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}}};ctx.window=ctx;vm.createContext(ctx);
 ctx.time=0;ctx.readyImage=()=>({image:{naturalWidth:10}});ctx.ensureImages=()=>Promise.resolve();
 ctx.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({frameFor:()=>JSON.parse(JSON.stringify(base))});vm.runInContext(src,ctx);return ctx;}
const FF=c=>c.__STORYWORLD_STORY_COMBAT_R54__.frameFor,API=c=>c.__STORYWORLD_MOB_ATTACK_DOTS_R1065__;
const mob=o=>({id:'m',name:'x',hp:5,maxHp:5,combatProfile:{attackShape:{windup:.3,active:.15,recovery:.35}},...o});
const S=API(world({path:'x'})).inspect().sheets;
ok(['AT-07','RA-05','RA-07'].every(k=>S[k]),'AT-07·RA-05·RA-07 in table');ok(S['RA-05'].kind==='aim'&&S['RA-07'].kind==='aim'&&!S['AT-07'].kind,'kinds');
for(const k of ['AT-07','RA-05','RA-07']){const s=S[k];const p=path.join(R,'runtime-text',s.path);ok(fs.existsSync(p)&&fs.statSync(p).size>1000,k+' sheet file');ok(s.cells===(s.kind==='aim'?4:6),k+' cell count');
 const dim=require('child_process').execFileSync('python3',['-c','from PIL import Image;import sys;print(*Image.open(sys.argv[1]).size)',p]).toString().trim().split(' ').map(Number);
 ok(dim[0]===s.cell[0]*s.cells&&dim[1]===s.cell[1],k+' sheet size matches cell×cells');
 for(const [bp,b] of Object.entries(s.bases)){const r=s.bodyH/b.bodyH;ok(r>.85&&r<1.15,k+' body ratio ~1 for '+bp+' '+r.toFixed(2));ok(s.anchor[1]+8*r<=s.cell[1],k+' room below feet');}}
// AT-07: 중간보스만. 같은 그림(polar_cyborg_hound)을 쓰는 태엽 수집자 등에는 안 씀
{const base={path:'assets/episode1b/generated-v394/polar_cyborg_hound.webp',assetFrame:{sourceRect:[0,0,418,418],pivot:[206,376],visibleHeight:241}};
 const c=world(base),e=mob({name:'중간보스 · 강철 턱의 사이보그 개'});ok(FF(c)(e,null).path===base.path,'AT-07 calm untouched');ok(API(c).covers(e),'AT-07 covers midboss');const seen=new Set();
 for(let t=0;t<.8;t+=.02){e.attack={elapsed:t};const f=FF(c)(e,null);ok(/at-07-/.test(f.path),'AT-07 sheet in attack');seen.add(f.assetFrame.sourceRect[0]/f.assetFrame.sourceRect[2]);ok(f.assetFrame.pivot[1]<=f.assetFrame.sourceRect[3]&&f.assetFrame.pivot.every(Number.isFinite),'AT-07 pivot in cell');}
 ok(seen.size===6,'AT-07 all 6 cells');
 const c2=world(base),g=mob({name:'태엽 수집자',attack:{elapsed:.3}});ok(FF(c2)(g,null).path===base.path&&!API(c2).covers(g),'clockwork collector on same image untouched');
 const h=mob({name:'강철 턱의 사이보그 개',attack:{elapsed:.3}});ok(FF(c2)(h,null).path===base.path,'regular hound name untouched (MA-06 uses its own base)');}
// RA-05/RA-07: R248 직접 그리기 → aimR248 (조준 동안만)
for(const [k,bp,nm] of [['RA-05','assets/r410/mobs/m054.webp','옥상으로 돌아온 기억 잔향 3'],['RA-07','assets/r410/mobs/m040.webp','이동문 청람잔영']]){
 const c=world({path:'x'}),A=API(c),e=mob({name:nm});ok(A.aimR248(e,bp)===null,k+' calm null');ok(!A.covers(e),k+' does not claim attack art');
 e.rangedWindup=.6;const ks=new Set();for(let t=0;t<1.4;t+=.05){c.time=t;const r=A.aimR248(e,bp);ok(r&&r.id===k&&r.w>0&&r.h>0&&[r.sx,r.dx,r.dy,r.r].every(Number.isFinite),k+' aimR248 frame');ks.add(r.cell);}
 ok(ks.size===4,k+' plays 4 cells');e.attack={elapsed:.2};ok(A.aimR248(e,bp)===null,k+' real attack null');}
{const pages=fs.readFileSync(path.join(R,'../.github/workflows/pages.yml'),'utf8');ok(pages.includes('r96/qa/r1065/r1065e-cpu-check.cjs'),'pages.yml');
 const v=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');for(const k of ['AT-07','RA-05','RA-07'])ok(v.includes(S[k].path),k+' in runtime-manifest');
 ok(fs.readFileSync(path.join(R,'runtime-text','mob-attack-dots-r1065.js'),'utf8')===src,'runtime copy matches');}
console.log('R1065e CPU check passed:',n);
