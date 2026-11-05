// R355 CPU checks: 사몽 구역 넓히기(복도·길 폭 2배, 방·교실 넓이 1.5배 이상)와 학교 광장(처치 666) 얼굴 없는 학생 그림.
// 실제 모듈(samong-zones-r115·samong-r103 + R162·R173 재구성 켬)을 vm 에서 돌려 넓히기 전후를 같은 구역마다 잰다.
// 표는 --table 로 출력한다(PR 본문용). 브라우저·GPU 는 보지 않는다.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'..','..'),SRC=path.join(ROOT,'client-source');
const results=[];const check=(name,ok,detail='')=>{results.push({name,ok:!!ok,detail});if(!ok||process.argv.includes('-v'))console.log((ok?'PASS ':'FAIL ')+name+(ok||!detail?'':' :: '+detail));};
const atlas={path:'a.webp',width:8,height:8,sha256:'0',styles:{garden:{floorRect:[0,0,1,1],wallRect:[0,0,1,1]},domestic:{floorRect:[0,0,1,1],wallRect:[0,0,1,1]},clinical:{floorRect:[0,0,1,1],wallRect:[0,0,1,1]},forge:{floorRect:[0,0,1,1],wallRect:[0,0,1,1]}}};
function sandbox(store={}){const sb={console,Math,JSON,Date,Set,Map,WeakMap,Object,Array,Number,String,Boolean,Symbol,Error,Promise,performance:{now:()=>0},matchMedia:()=>({matches:false}),setTimeout,clearTimeout,
 StoryArtR74:{atlases:{materials:atlas}},document:{getElementById:()=>null,querySelector:()=>null,createElement:()=>({style:{}}),head:{appendChild(){}}},localStorage:{getItem:k=>store[k]??null,setItem(){}}};sb.window=sb;vm.createContext(sb);return sb;}
const BASE=['samong-text-r103.js','samong-zones-r115-data.js','samong-zones-r115.js','samong-r103.js'];
const load=(sb,files)=>{for(const f of files)vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),sb,{filename:f});};
// ---- 정적 ----
const src=fs.readFileSync(path.join(SRC,'samong-wide-r355.js'),'utf8');
check('client-source and runtime-text copies agree',src===fs.readFileSync(path.join(ROOT,'runtime-text','samong-wide-r355.js'),'utf8'));
const idx=fs.readFileSync(path.join(ROOT,'runtime-text','index.html'),'utf8');
check('script tag loaded once, after samong-zones-r115/samong-r103/art-drive-r105/hit-center-r259 and before combat-r118',idx.split('"./samong-wide-r355.js"').length===2&&['samong-r103.js','art-drive-r105.js','hit-center-r259.js','mob-unique-r248.js','enemy-hexagram-r341.js'].every(f=>idx.indexOf('"./'+f+'"')<idx.indexOf('"./samong-wide-r355.js"'))&&idx.indexOf('"./samong-wide-r355.js"')<idx.indexOf('"./combat-r118.js"'));
check('no ctx.filter blur/drop-shadow (Three recorder)',!/drop-shadow|blur\(/.test(src));
check('story maps untouched: only R115 zone definitions are reshaped (no story layout hook, no room.exploration edits)',!/LAYOUT_HOOK_R204|STORY_MAPS_R171|room\.exploration\s*=/.test(src));
const pv=fs.readFileSync(path.join(ROOT,'..','scripts','verify-r96-public.py'),'utf8');check('verify-r96-public lists the overlay',pv.includes('samong-wide-r355.js'));
const wf=fs.readFileSync(path.join(ROOT,'..','.github','workflows','pages.yml'),'utf8');check('pages.yml runs this check',wf.includes('qa/r355/samong-wide-cpu-check.cjs'));
// ---- 넓히기 전(오버레이 없이) ----
const A=sandbox();load(A,BASE);const ZA=A.__STORYWORLD_SAMONG_ZONES_R115__,SMA=A.__STORYWORLD_SAMONG_R103__;
const beforeCells=new Map();for(const l of Object.values(ZA.chapters))for(const z of l)beforeCells.set(z.id,ZA.carve(z).cells.size);
// ---- 넓힌 뒤 ----
const B=sandbox();load(B,[...BASE,'samong-wide-r355.js']);const Z=B.__STORYWORLD_SAMONG_ZONES_R115__,SM=B.__STORYWORLD_SAMONG_R103__,W=B.__STORYWORLD_SAMONG_WIDE_R355__;
check('overlay loads, no errors',!!W&&W.inspect().stats.errors===0,W&&W.inspect().lastError);
const all=Object.entries(Z.chapters).flatMap(([k,l])=>l.map(z=>[k,z]));
check('every Samong zone (all chapters, incl. R162 B/D and R173 G) was widened once',all.length>=140&&all.every(([,z])=>z.r355),all.length+' zones');
const off=sandbox({'storyworld.r355.samongWide':'{"on":false}'});load(off,[...BASE,'samong-wide-r355.js']);
check('{"on":false} leaves every zone as R115 made it',Object.values(off.__STORYWORLD_SAMONG_ZONES_R115__.chapters).every(l=>l.every(z=>!z.r355)));
const rows=[];let worst=Infinity;
for(const[k,z]of all){const b=z.r355.before,a=z.r355.after,ei=SM.episodes.findIndex(e=>e.key===k);
 check(z.id+' corridors/paths exactly 2× wide',a.paths.length===b.paths.length&&a.paths.every((w,i)=>w===2*b.paths[i])&&a.links.every((w,i)=>w===2*b.links[i]),b.paths+' → '+a.paths+' | '+b.links+' → '+a.links);
 const ratio=b.roomArea?a.roomArea/b.roomArea:null;if(ratio!=null)worst=Math.min(worst,ratio);
 check(z.id+' rooms/classrooms ≥ 1.5× area',ratio==null||ratio>=1.5,String(ratio));
 let L=null,err='';try{L=SM.layoutFor(ei,Z.stageOf(z),z.id);}catch(e){err=String(e);}
 if(!L){check(z.id+' layout builds',false,err);continue;}
 const cells=new Set(L.floorCells.map(([x,y])=>x+':'+y)),on=p=>p&&Number.isFinite(p.x)&&cells.has(Math.floor(p.x)+':'+Math.floor(p.y));
 const seen=new Set(),q=[[Math.floor(L.entry.x),Math.floor(L.entry.y)]];seen.add(q[0].join(':'));while(q.length){const[x,y]=q.shift();for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const k2=(x+dx)+':'+(y+dy);if(cells.has(k2)&&!seen.has(k2)){seen.add(k2);q.push([x+dx,y+dy]);}}}
 const reach=p=>on(p)&&seen.has(Math.floor(p.x)+':'+Math.floor(p.y)),x=L.samongR103;
 check(z.id+' entry on floor, every floor cell reachable',on(L.entry)&&seen.size===cells.size,seen.size+'/'+cells.size);
 check(z.id+' floor cells and bounds non-negative',L.floorCells.every(([a,b2])=>a>=0&&b2>=0)&&L.bounds[0]===0&&L.bounds[1]===0);
 const r={exploration:L,props:[]};try{Z.dress(r,z,{});}catch(e){check(z.id+' dress',false,String(e));}
 const goals=[['exit',x.exit],['dais',x.dais],['save',x.save],['core',x.core],['top',x.top],...(x.chests||[]).map(c=>['chest',c]),...(x.landings||[]).map(c=>['landing',c]),...(z.clues||[]).map(c=>['clue',{x:z.rooms[c.room].x+c.at[0],y:z.rooms[c.room].y+c.at[1]}]),...r.props.map(p=>[p.id,p])].filter(g=>g[1]);
 const bad=goals.filter(([,p])=>!reach(p));
 check(z.id+' objectives, clues, desks/props on reachable floor ('+goals.length+')',!bad.length,bad.slice(0,6).map(([n,p])=>n+'@'+(+p.x).toFixed(1)+','+(+p.y).toFixed(1)).join(' '));
 // 길잡이(findPath) 반지름 .29: 목표로 가는 칸 길이 폭 1칸 이상 — 4방향 BFS 로 이미 확인. 몸통이 끼지 않게 목표 칸 둘레에 바닥이 하나 이상.
 if(x.patrol){const pb=[];for(const rt of x.patrol)for(let i=0;i<rt.length;i++){const a2=rt[i],b2=rt[(i+1)%rt.length],n=Math.ceil(Math.hypot(b2.x-a2.x,b2.y-a2.y)/.5);for(let t=0;t<=n;t++){const p={x:a2.x+(b2.x-a2.x)*t/n,y:a2.y+(b2.y-a2.y)*t/n};if(!on(p)){pb.push(p.x.toFixed(1)+','+p.y.toFixed(1));break;}}}check(z.id+' patrol routes stay on the floor',!pb.length,pb.join(' '));}
 if(z.kind==='confront')check(z.id+' dais stays near the native boss field grid (3..27)',x.dais&&x.dais.x>3&&x.dais.x<27&&x.dais.y>3&&x.dais.y<27,x.dais&&x.dais.x+','+x.dais.y);
 const bc=beforeCells.get(z.id),N=L.floorCells.length;
 check(z.id+' size stays bounded (≤ 3.5× the floor before — 길 폭 2배 × 길이 1.5배, ≤ 9000 cells, ≤ 150×150)',N<=bc*3.5&&N<=9000&&L.bounds[2]<=150&&L.bounds[3]<=150,bc+' → '+N+' '+L.bounds);
 rows.push({k,id:z.id,title:z.title,kind:z.kind+(z.mode?'/'+z.mode:''),S:z.r355.scale,pb:Math.min(...b.paths,...b.links),pa:Math.min(...a.paths,...a.links),ra:b.roomArea,rb:a.roomArea,cb:bc,ca:N});}
check('worst room-area ratio ≥ 1.5',worst>=1.5,String(worst));
// ---- 학교 광장 처치 666 ----
const plaza=Z.zone('sz162-S-02-B');
check('school plaza 666 zone exists in S-02 and its mobs are the 얼굴 없는 학생 (episode mob list)',plaza&&plaza.goal?.kills===666&&SM.episodes.find(e=>e.key==='S-02').mobName==='얼굴 없는 학생'&&!plaza.mobName);
// 가짜 엔진으로 그리기 훅: 기증 몹의 본편 몸 그림은 칠하지 않고 R105 원화만 칠한다.
{const drawn=[];const ctx={drawImage(im){drawn.push(im.src);}};
 const stu='assets/r105/drive/mob-student.webp',story='assets/episode1a/generated-v392/corridor_scream_echo.webp',wraith='assets/r99/clean/assets/u2/generated-v350/u2_void_wraith.webp';
 const g={ctx,room:{samongR103:{ep:2}},time:1,readyImage:p=>({image:{src:'http://x/m0/'+p}}),ensureImages:()=>Promise.resolve(),project:(x,y)=>({x,y}),actorHeight:()=>60,
  sprite:(p)=>{ctx.drawImage({src:'http://x/m0/'+p});return true;},
  __STORYWORLD_DRIVE_ART_R105__:{artFor:e=>e.boss?'assets/r105/drive/boss-patroller.webp':stu},__STORYWORLD_STORY_COMBAT_R54__:{frameSet:e=>({idle:{path:story},attack:{path:wraith}})}};
 const S2=sandbox();Object.assign(S2,g);S2.drawEnemy=function(e){ctx.drawImage({src:'http://x/m0/'+(e.mid?wraith:e.rc137?'assets/rc137/mob-attacks-01.png':story)});if(e.fx)ctx.drawImage({src:'http://x/m0/assets/fx-sprites/glow.webp'});if(e.r105)ctx.drawImage({src:'http://x/m0/'+stu});};
 load(S2,['samong-wide-r355.js']);const D=S2.drawEnemy;
 drawn.length=0;D({samongR103:true,name:'얼굴 없는 학생',hp:9,x:1,y:1});check('attacking student whose frame bypasses R105: story body hidden, student drawn',drawn.length===1&&drawn[0].endsWith(stu),drawn.join(' '));
 drawn.length=0;D({samongR103:true,name:'중간보스 · 얼굴 없는 학생',midboss:true,mid:true,hp:9,x:1,y:1});check('midboss · 얼굴 없는 학생 drawn as the student, not u2_void_wraith',drawn.length===1&&drawn[0].endsWith(stu),drawn.join(' '));
 drawn.length=0;D({samongR103:true,name:'얼굴 없는 학생',r105:true,hp:9,x:1,y:1});check('R105 already drew the student: no second copy',drawn.length===1&&drawn[0].endsWith(stu),drawn.join(' '));
 drawn.length=0;D({samongR103:true,name:'얼굴 없는 학생',rc137:true,fx:true,hp:9,x:1,y:1});check('story attack-pose sheet (rc137 mob-attacks) hidden, effect sprites kept',drawn.length===2&&drawn.some(s=>s.endsWith(stu))&&drawn.some(s=>s.endsWith('glow.webp')),drawn.join(' '));
 drawn.length=0;D({samongR103:true,boss:true,name:'순찰자',hp:9,x:1,y:1});check('bosses untouched',drawn.length===1&&drawn[0].endsWith(story));
 drawn.length=0;D({samongR103:true,name:'칠판을 벗어난 글씨',hp:9,x:1,y:1});check('other names untouched',drawn.length===1&&drawn[0].endsWith(story));
 drawn.length=0;D({name:'얼굴 없는 학생',hp:9,x:1,y:1});check('non-Samong actors untouched',drawn.length===1&&drawn[0].endsWith(story));}
// ---- Codex 검토 3건(R355-2): 기록 범위(scope)·R259 가운데 측정·R306 픽셀 모드 — 실제 hit-center-r259·mob-art-variants-r306 를 가짜 엔진 위에 얹어 본다 ----
{const stu='assets/r105/drive/mob-student.webp',story='assets/episode1a/generated-v392/corridor_scream_echo.webp',pix='assets/r306/pixel/a08-s1.png';
 const img=p=>({src:'http://x/m0/'+p,naturalWidth:100,naturalHeight:200,width:100,height:200});
 function rig(pixel){const log=[];let owner={id:'scene',kind:'scene'};const st=[];
  const ctx={a:1,b:0,c:0,d:1,e:0,f:0,globalAlpha:1,globalCompositeOperation:'source-over',filter:'none',imageSmoothingEnabled:true,
   getTransform(){return{a:this.a,b:this.b,c:this.c,d:this.d,e:this.e,f:this.f};},setTransform(t,...r){const m=typeof t==='object'?t:{a:t,b:r[0],c:r[1],d:r[2],e:r[3],f:r[4]};Object.assign(this,{a:m.a,b:m.b,c:m.c,d:m.d,e:m.e,f:m.f});},
   translate(x,y){this.e+=this.a*x;this.f+=this.d*y;},scale(x,y){this.a*=x;this.d*=y;},save(){st.push({...this.getTransform(),globalAlpha:this.globalAlpha,filter:this.filter,globalCompositeOperation:this.globalCompositeOperation});},
   restore(){const s=st.pop();if(s){this.setTransform(s);this.globalAlpha=s.globalAlpha;this.filter=s.filter;this.globalCompositeOperation=s.globalCompositeOperation;}},
   scope(o,f){const p=owner;owner=o;try{return f();}finally{owner=p;}},
   drawImage(im,...q){log.push({src:String(im.src).replace('http://x/m0/',''),owner,T:this.getTransform(),alpha:this.globalAlpha,q});},fill(){log.push({src:'(fill)',owner});}};
  const S=sandbox();Object.assign(S,{ctx,time:1,layer:'STORY',readyImage:p=>({image:img(p)}),ensureImages:()=>Promise.resolve(),project:(x,y)=>({x:x*10,y:y*10}),actorHeight:()=>60,
   sprite:(p,x,y,h,o={})=>{ctx.save();ctx.globalAlpha*=o.alpha??1;ctx.translate(x,y);ctx.drawImage(img(p),-h/4,-h,h/2,h);ctx.restore();return true;},
   restoreSave:async()=>true,
   __STORYWORLD_DRIVE_ART_R105__:{artFor:()=>stu},__STORYWORLD_STORY_COMBAT_R54__:{frameSet:()=>({idle:{path:story}})},
   __STORYWORLD_MOB_ART_VARIANTS_R306_DATA__:{actors:{'STORY|a08-s1|얼굴 없는 학생':'r1'},rows:{r1:{paths:[story],frames:[],pixel:{path:pix,cell:[64,80],cols:4,body:60,pivot:[32,76]}}}}});
  // 엔진: index.html scoped(drawEnemy,'enemy') 처럼 enemy 범위 안에서, 몸 자리로 옮기고(translate) 투명도를 바꾼 뒤 기증 몹 몸 그림(8인자)
  S.drawEnemy=function(e){return ctx.scope({id:'enemy:'+e.id,kind:'enemy',x:e.x,y:e.y},()=>{if(e.culled)return;/* 시야 거름: 엔진이 아무것도 안 그림 */if(e.noBody){ctx.fill();return;}/* 그림자만 */ctx.save();ctx.translate(500,500);ctx.globalAlpha*=.4;ctx.drawImage(img(story),0,0,100,200,-20,-80,40,80);ctx.restore();});};
  load(S,['hit-center-r259.js','mob-art-variants-r306.js']);if(pixel)S.restoreSave({mobArt:'pixel'});load(S,['samong-wide-r355.js']);return{S,log,ctx};}
 const E=o=>({id:7,samongR103:true,name:'얼굴 없는 학생',nativeId:'a08-s1',hp:9,x:3,y:4,...o});
 {const{S,log}=rig(false),e=E();S.drawEnemy(e);const st=log.filter(l=>l.src===stu);
  check('[P2-1] replacement student drawn inside the engine enemy recorder scope (not scene)',st.length===1&&st[0].owner.kind==='enemy'&&st[0].owner.id==='enemy:7'&&!log.some(l=>l.src===story),JSON.stringify(log.map(l=>[l.src,l.owner.kind])));
  check('[P2-1] inside draw uses the outer transform/alpha, not the donor translate/alpha',st[0]&&Math.abs(st[0].T.e-30)<1e-9&&Math.abs(st[0].T.f-40)<1e-9&&st[0].alpha===1,st[0]&&JSON.stringify([st[0].T,st[0].alpha]));
  const v=S.__STORYWORLD_HIT_CENTER_R259__.centreOf(e);
  check('[P2-2] R259 centreOf measures the replacement (centre over project(e), not the hidden donor at +500)',v&&Math.abs(v.cx-30)<1&&Math.abs(v.cy-10)<1&&Math.abs(v.h-60)<1,JSON.stringify(v));}
 {const{S,log}=rig(false),e=E({noBody:true});S.drawEnemy(e);const st=log.filter(l=>l.src===stu);
  check('[P2-1] fallback (no donor body at all) still wrapped in an enemy scope with actor id and world position',st.length===1&&st[0].owner.kind==='enemy'&&st[0].owner.id==='r355:mob:7'&&st[0].owner.x===3&&st[0].owner.y===4,JSON.stringify(st.map(l=>l.owner)));}
 {const{S,log}=rig(false),e=E({culled:true});S.drawEnemy(e);check('[Codex sight] engine drew nothing (sight wrapper rejected the actor) → no fallback replacement drawn',!log.some(l=>l.src===stu)&&S.__STORYWORLD_SAMONG_WIDE_R355__.inspect().stats.culled===1,JSON.stringify(log.map(l=>l.src)));}
 {const{S,log}=rig(true),e=E();S.drawEnemy(e);const W2=S.__STORYWORLD_SAMONG_WIDE_R355__.inspect();
  check('[P2-3] pixel mode: R306 pixel body counts as the body draw — no second painted student',log.filter(l=>l.src===pix).length===1&&!log.some(l=>l.src===stu||l.src===story)&&W2.stats.pixel===1&&W2.stats.errors===0,JSON.stringify(log.map(l=>l.src))+' '+JSON.stringify(W2.stats));
  S.drawEnemy(E({name:'중간보스 · 얼굴 없는 학생',id:8}));check('[P2-3] pixel mode also covers the midboss name (R306 normalize)',log.filter(l=>l.src===pix).length===2&&!log.some(l=>l.src===stu));}
 {const{S,log}=rig(true);S.drawEnemy(E({nativeId:'other'}));
  check('[P2-3] pixel mode without an R306 row: painted student still replaces the donor once',log.filter(l=>l.src===stu).length===1&&!log.some(l=>l.src===story||l.src===pix),JSON.stringify(log.map(l=>l.src)));}}
if(process.argv.includes('--table')){console.log('| 장 | 구역 | 종류 | S | 가장 좁은 길 폭 전→후 | 방 넓이 합 전→후(배) | 바닥 칸 전→후 |\n|---|---|---|---|---|---|---|');
 for(const r of rows)console.log(`| ${r.k} | ${r.id} ${r.title} | ${r.kind} | ${r.S} | ${r.pb===Infinity?'-':r.pb} → ${r.pa===Infinity?'-':r.pa} | ${r.ra} → ${r.rb} (${r.ra?(r.rb/r.ra).toFixed(2):'-'}) | ${r.cb} → ${r.ca} |`);}
const failed=results.filter(r=>!r.ok);console.log(`R355 samong-wide: ${results.length-failed.length}/${results.length} PASS`);if(failed.length)process.exit(1);
