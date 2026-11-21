// R561c CPU check: 기억사수 Q 회상 광선포 — ① 광선이 실제 총구에서 나간다(8방향·확대·들림·걸어도 따라감) ② 굵기는 총구 크기 ③ 광선 접촉 중에만 피해.
// 총구 기준 = 엔진이 실제로 그리는 영웅 그림(PHASE1_ART.hero().frame)의 assetFrame.muzzle. 값 표 = gunner-skill-frames.json(엔진 portable-data gunner:skill:* 8방향).
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),src=fs.readFileSync(path.join(R,'client-source','gunner-arms-r561.js'),'utf8');
const FR=JSON.parse(fs.readFileSync(path.join(__dirname,'gunner-skill-frames.json'),'utf8'));
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const TILE=64;
// R128(Gemini) 기억사수 그림 g-*.webp 의 총구 끝(512칸 기준 픽셀) — 그림을 열어 보며 잰 값(이 그림이 실제로 그려진다). 엔진 표(gunner-skill-frames.json)는 옛 그림 기준이라 R128 그림엔 안 맞는다.
const G128={e:[362,190],se:[355,316],s:[352,336],sw:[154,314],w:[170,189],nw:[169,118],n:[330,165],ne:[353,124]};
// 엔진 sector(dx,dy) 와 같은 식(index.html phase1-original-adapter)
const ANG={e:0,se:Math.PI/4,s:Math.PI/2,sw:3*Math.PI/4,w:Math.PI,nw:-3*Math.PI/4,n:-Math.PI/2,ne:-Math.PI/4};
function sectorOf(dx,dy){const a=Math.atan2((dx+dy)*.5,dx-dy);let sel='s',best=1e9;for(const [s,r] of Object.entries(ANG)){const d=Math.abs(Math.atan2(Math.sin(a-r),Math.cos(a-r)));if(d<best){best=d;sel=s;}}return sel;}
// 8방향 한가운데로 겨눌 월드 각(화면각 → 월드 방향: screen a=atan2((dx+dy)/2,dx-dy))
function worldAngleFor(sec){const a=ANG[sec];let best=0,bd=1e9;for(let k=0;k<720;k++){const w=k/720*Math.PI*2,aa=Math.atan2((Math.cos(w)+Math.sin(w))*.5,Math.cos(w)-Math.sin(w)),d=Math.abs(Math.atan2(Math.sin(aa-a),Math.cos(aa-a)));if(d<bd){bd=d;best=w;}}return best;}

// R561d: 총구 방향(8방향 칸 한가운데)으로만 나가므로, 옛 시험의 '월드 x축 위 적'을 겨눈 칸 중심 줄로 옮긴다 — 플레이어(10,10) 기준 회전, 거리·간격은 그대로(벽 판정은 역회전)
const RO=Math.atan2(2*Math.sin(Math.PI/4)-Math.cos(Math.PI/4),Math.cos(Math.PI/4)+2*Math.sin(Math.PI/4)),rot=(x,y,s=1)=>{const c=Math.cos(RO*s),n=Math.sin(RO*s);return [10+(x-10)*c-(y-10)*n,10+(x-10)*n+(y-10)*c];};
const rotE=l=>l.map(e=>{const [x,y]=rot(e.x,e.y);return {...e,x,y};});
const rotB=f=>f?((x,y,...r)=>{const [a,b]=rot(x,y,-1);return f(a,b,...r);}):null;
function mk(opt={}){opt={...opt,enemies:opt.enemies?rotE(opt.enemies):opt.enemies,blocked:rotB(opt.blocked)};const hits=[],drawn={along:[],draw:[],img:[]},L={};
 const zoom=opt.zoom||1;
 const enemies=opt.enemies||[];
 const stack=[],st={tx:0,ty:0,rot:0,sx:1,sy:1};
 const ctx={globalAlpha:1,globalCompositeOperation:'source-over',save(){stack.push({...st});},restore(){Object.assign(st,stack.pop()||{});},translate(x,y){st.tx+=x;st.ty+=y;},rotate(a){st.rot+=a;},transform(){},scale(x,y){st.sx*=x;st.sy*=y;},
  drawImage(im,sx,sy,sw,sh,dx,dy,dw,dh){drawn.img.push({tag:im&&im.tag,tx:st.tx,ty:st.ty,sx:st.sx,sy:st.sy,rot:st.rot,dw,dh,alpha:ctx.globalAlpha});},scope(meta,fn){fn();}};
 const sb={console,Math,JSON,Object,Array,Set,Map,WeakMap,Number,String,Infinity,Date,localStorage:{getItem:()=>null,setItem(){}},window:{},setTimeout:()=>0,addEventListener(t,f){(L[t]=L[t]||[]).push(f);},
  auto:false,guide:false,started:true,modal:null,loading:false,storyScene:null,settings:{},time:10,COMBAT_RHYTHM_R26:1,shake:0,ctx,zoom,
  project:(x,y)=>({x:(x-y)*TILE*zoom+640,y:(x+y)*TILE*.5*zoom+360}),actorHeight:()=>66*zoom,
  player:{hero:'gunner',x:10,y:10,hp:100,specialCD:0,direction:'right',skillAnim:0,visualLiftPx:opt.lift||0,poseStarted5:{},poseDuration5:{},storyWER:{ready:{},buffs:{}}},
  maxHP:()=>200,attackPower:()=>40,rank:()=>0,clearLine:opt.clearLine||(()=>true),blocked:opt.blocked||(()=>false),effects:[],sound(){},moveActor(){},
  HEROES:{gunner:{name:'기억사수',special:'기억 재현',range:8.2}},room:{enemies},liveEnemies:()=>enemies.filter(e=>e.hp>0),damageable3:()=>true,
  hitEnemy:(e,v,m)=>{hits.push({id:e.id,v,ab:m&&m.ability,t:sb.time});e.hp-=v;return true;},
  special(){},serializeSave:()=>({}),tick(){},drawEffect(){},updateHUD(){},restoreSave(){}};
 sb.window.__STORYWORLD_WER__=Object.freeze({cast:()=>'base',defs:{}});
 // 엔진 영웅 그림: 시전 때 굳힌 방향이 없으면 옛 값('e')에 머문다(R561 이 굳히지 않던 때의 거동). 그림은 skillAnim>0 일 때만 'skill' 칸.
 const eng={direction:(p,state)=>state==='skill'?(sb.__staleSector||'e'):'e'};
 sb.window.__STORYWORLD_CURRENT_HERO__=Object.freeze({...eng,direction(p,state,fb){return eng.direction(p,state,fb);}});
 sb.window.__STORYWORLD_PHASE1_ART__=Object.freeze({hero(){const p=sb.player,state=p.skillAnim>0?'skill':'idle',dir=sb.window.__STORYWORLD_CURRENT_HERO__.direction(p,state,p.direction);
   if(state!=='skill')return{state,frame:{assetFrame:{sourceRect:[0,0,512,512],pivot:[256,496],visibleHeight:400,muzzle:null},nativeHero5:{flip:false}}};
   const f=FR[dir];return{state,direction:dir,frame:{path:'assets/hero_direction334/gunner/'+dir+'.webp',assetFrame:{sourceRect:f.sourceRect,pivot:f.pivot,visibleHeight:f.visibleHeight,muzzle:f.muzzlePx},nativeHero5:{flip:f.flip===true}}};}});
 const rec=(k)=>(n,F,...a)=>{drawn[k].push({n,a});};
 sb.window.__STORYWORLD_FX_SPRITES_R106__={draw:(n,F,x,y,w,h,o)=>drawn.draw.push({n,x,y,w,h,o}),along:(n,F,x0,y0,x1,y1,w,o)=>drawn.along.push({n,x0,y0,x1,y1,w,o}),warm(){}};
 if(opt.pose){const SH=opt.pose[0],SY=opt.pose[1];sb.window.__STORYWORLD_COMBAT_SYNC_R48__=Object.freeze({applyBodyPose(c,hero){c.transform(1,0,SH,SY,0,0);return {shear:SH,scaleY:SY};}});}
 if(opt.sheets||opt.swap){sb.readyImage=p=>({image:{tag:p,src:opt.swap?'assets/r128/gunner/g-x.webp':''}});}
 vm.createContext(sb);vm.runInContext(src,sb);
 const A=()=>sb.window.__STORYWORLD_GUNNER_ARMS_R561__;A().set({chain:false});
 const run=(t1,step=.02)=>{while(sb.time<t1-1e-9){sb.time=+(sb.time+step).toFixed(4);sb.tick(step);}};
 const heroDraw=()=>{const R=sb.window.__STORYWORLD_COMBAT_SYNC_R48__;if(R)R.applyBodyPose(ctx,true);};
 const paint=()=>{heroDraw();drawn.along.length=0;drawn.draw.length=0;drawn.img.length=0;st.tx=st.ty=st.rot=0;st.sx=st.sy=1;stack.length=0;sb.drawEffect({type:'r561-fx'});};
 return {sb,hits,drawn,L,A,run,paint,pose:opt.pose,swap:!!opt.swap};}
const H0=z=>66*z;
// 영웅이 실제로 그리는 총구 화면 좌표(= 엔진 drawHero 와 같은 식)
function expectedMuzzle(T){const p=T.sb.player,q=T.sb.project(p.x,p.y),f=T.sb.window.__STORYWORLD_PHASE1_ART__.hero().frame,a=f.assetFrame;const k=T.sb.actorHeight()/a.visibleHeight;
 const mzp=T.swap?G128[T.sb.window.__STORYWORLD_PHASE1_ART__.hero().direction]:a.muzzle,lx=(mzp[0]-a.sourceRect[0]-a.pivot[0])*k*(f.nativeHero5.flip?-1:1),ly=(mzp[1]-a.sourceRect[1]-a.pivot[1])*k,SH=T.pose?T.pose[0]:0,SY=T.pose?T.pose[1]:1;
 return{x:q.x+lx+SH*ly,y:q.y-(p.visualLiftPx||0)+SY*ly};}
function cast(T,sec){const a=worldAngleFor(sec),d=8;T.sb.enemies=null;const e={id:'tgt',x:T.sb.player.x+Math.cos(a)*d,y:T.sb.player.y+Math.sin(a)*d,hp:1e9,maxHp:1e9,radius:.3,spawnState:'active'};T.sb.room.enemies.push(e);T.sb.special();return a;}
const mkE=(id,x,y)=>({id,x,y,hp:1e9,maxHp:1e9,radius:.3,spawnState:'active'});

// ---------- ① 총구 정렬 ----------
for(const sheets of [false,true]){
 const bad=[];
 for(const sec of Object.keys(ANG))for(const zoom of [1,1.7])for(const lift of [0,9]){
  const T=mk({zoom,lift,sheets});const a=cast(T,sec);const want=sectorOf(Math.cos(a),Math.sin(a));
  T.sb.__staleSector='e';T.run(10.5);              // 충전 구간 지나 광선 구간
  T.paint();const m=expectedMuzzle(T);
  let got=null;
  if(sheets){const b=T.drawn.img.find(i=>/q-beam/.test(i.tag||''));if(b)got={x:b.tx,y:b.ty};}
  else{const al=T.drawn.along.find(c=>c.n==='line');if(al)got={x:al.x0,y:al.y0};}
  const dir=T.sb.window.__STORYWORLD_PHASE1_ART__.hero().direction;
  if(!got||Math.hypot(got.x-m.x,got.y-m.y)>0.75||dir!==want)bad.push({sec,zoom,lift,want,dir,got,m});
 }
 ok(`muzzle: beam starts at the drawn hero's muzzle (≤0.75px) in all 8 aim sectors × zoom 1/1.7 × lift 0/9 and the pose sector is committed to the aim [${sheets?'sheet beam':'code beam'}]`,bad.length===0,bad.slice(0,3));
}
{const T=mk({sheets:true});cast(T,'se');T.run(10.4);T.paint();const m0=expectedMuzzle(T);
 T.sb.player.x+=1.5;T.sb.player.y-=0.5;T.run(10.6);T.paint();const m1=expectedMuzzle(T),b=T.drawn.img.find(i=>/q-beam/.test(i.tag||''));
 ok('muzzle: when the hero walks during the beam, the beam start follows the muzzle (≤0.75px) — it is not left at the cast position',!!b&&Math.hypot(b.tx-m1.x,b.ty-m1.y)<=.75&&Math.hypot(m1.x-m0.x,m1.y-m0.y)>20,{b:b&&[b.tx,b.ty],m1,m0});}
{const bad=[];for(const sec of Object.keys(ANG))for(const sheets of [false,true]){const T=mk({sheets,pose:[.22,.9],zoom:1.3,lift:4});cast(T,sec);T.run(10.5);T.paint();const m=expectedMuzzle(T);let got=null;
  if(sheets){const b=T.drawn.img.find(i=>/q-beam/.test(i.tag||''));if(b)got={x:b.tx,y:b.ty};}else{const al=T.drawn.along.find(c=>c.n==='line');if(al)got={x:al.x0,y:al.y0};}
  if(!got||Math.hypot(got.x-m.x,got.y-m.y)>0.75)bad.push({sec,sheets,got,m});}
 ok('muzzle: the engine body-pose lean (shear .22, scaleY .9 about the foot, applied by the real hero draw) is applied to the muzzle point — beam still starts within 0.75px, 8 sectors × code/sheet',bad.length===0,bad.slice(0,3));}
{const bad=[];for(const sec of Object.keys(ANG))for(const sheets of [false,true]){const T=mk({sheets,swap:true,pose:[.1,.95],zoom:1.1,lift:2});cast(T,sec);T.run(10.5);T.paint();const m=expectedMuzzle(T);let got=null;
  if(sheets){const b=T.drawn.img.find(i=>/q-beam/.test(i.tag||''));if(b)got={x:b.tx,y:b.ty};}else{const al=T.drawn.along.find(c=>c.n==='line');if(al)got={x:al.x0,y:al.y0};}
  if(!got||Math.hypot(got.x-m.x,got.y-m.y)>0.75)bad.push({sec,sheets,got,m});}
 ok('muzzle: when the hero is drawn from the R128 gunner art (assets/r128/gunner/g-*.webp, what ships), the beam starts at that art\'s own barrel tip, not the old art\'s engine muzzle — 8 sectors × code/sheet',bad.length===0,bad.slice(0,3));}
{const T2=mk({});cast(T2,'w');T2.run(10.6);ok('muzzle: pose still "skill" 0.6 s after cast (old .6 s pose would have ended mid-beam)',T2.sb.player.skillAnim>0,T2.sb.player.skillAnim);}
{const T=mk({});cast(T,'ne');ok('pose lock: engine direction() for the skill pose returns the aim sector right after cast (poseStarted5.skill refreshed)',T.sb.window.__STORYWORLD_CURRENT_HERO__.direction(T.sb.player,'skill','right')===sectorOf(Math.cos(worldAngleFor('ne')),Math.sin(worldAngleFor('ne')))&&T.sb.player.poseStarted5.skill===T.sb.time,[T.sb.player.poseStarted5.skill,T.sb.time]);}

// ---------- ② 굵기 = 총구 크기 ----------
for(const zoom of [1,1.7]){
 const T=mk({zoom});cast(T,'e');T.run(10.5);T.paint();const H=H0(zoom);
 const w=Math.max(0,...T.drawn.along.filter(c=>c.n==='line'||c.n==='slashline').map(c=>c.w));const flare=Math.max(0,...T.drawn.draw.map(d=>Math.max(d.w,d.h)));
 ok(`thickness [code beam, zoom ${zoom}]: widest beam layer ≤ 0.22·H (gun-muzzle sized, was 1.05·H) and no draw wider than 0.9·H`,w>0&&w<=0.22*H&&flare<=0.9*H,{w,H,flare});
 const S=mk({zoom,sheets:true});cast(S,'e');S.run(10.5);S.paint();const b=S.drawn.img.find(i=>/q-beam/.test(i.tag||'')),mz=S.drawn.img.filter(i=>/q-muzzle/.test(i.tag||''));
 const thick=b?b.sy*106:null,mzPx=mz.length?Math.max(...mz.map(i=>Math.abs(i.sx)*170)):null;
 ok(`thickness [sheet beam, zoom ${zoom}]: visible beam thickness ≤ 0.22·H and muzzle flash ≤ 0.6·H`,thick!=null&&Math.abs(thick)<=0.22*H&&mzPx!=null&&mzPx<=0.6*H,{thick,mzPx,H});
}
{const T=mk({enemies:[mkE('on',13,10),mkE('edge',13,10.35),mkE('out',13,10.5)]});T.sb.special();T.run(11.5);
 const s=id=>T.hits.filter(h=>h.ab==='gunnerBeamR561'&&h.id===id).length;
 ok('hit width: the painted beam and the target collision circle overlap at .35 tiles, miss at .5',s('on')>0&&s('edge')>0&&s('out')===0,{on:s('on'),edge:s('edge'),out:s('out')});}

// ---------- ③ 광선 접촉 피해 ----------
const beamHits=(T,id)=>T.hits.filter(h=>h.ab==='gunnerBeamR561'&&(!id||h.id===id));
{const T=mk({enemies:[mkE('on',13,10),mkE('off',13,12)]});T.sb.special();T.run(11.5);
 ok('contact: six hits on the beam and no damage or secondary arc beside it',beamHits(T,'on').length===6&&T.hits.every(h=>h.id==='on'&&h.ab==='gunnerBeamR561'),T.hits);}
{const T=mk({enemies:[mkE('crossing',13,10)]}),e=T.sb.room.enemies[0];T.sb.special();
 T.run(10.22);const charge=beamHits(T).length;
 T.run(10.38);const first=beamHits(T).length;
 [e.x,e.y]=rot(13,12);T.run(10.63);const outside=beamHits(T).length;
 [e.x,e.y]=rot(13,10);T.run(10.87);const reentry=beamHits(T).length;
 T.run(11.5);const end=beamHits(T).length;
 ok('contact: damage starts after opening, stops outside, resumes on reentry, and ends with the beam',
   charge===0&&first===2&&outside===2&&reentry===4&&end===4,{charge,first,outside,reentry,end});}
{const T=mk({enemies:[mkE('late',13,10)]}),e=T.sb.room.enemies[0];T.sb.special();
 [e.x,e.y]=rot(13,12);T.run(10.22);[e.x,e.y]=rot(13,10);T.sb.time=10.65;T.sb.tick(.43);
 const first=beamHits(T).length;
 T.sb.time=11;T.sb.tick(.35);
 ok('contact: a late frame checks current contact once and a frame after expiration deals no damage',first===1&&beamHits(T).length===1,T.hits);}
{const T=mk({enemies:[mkE('on',13,10)]});T.A().set({on:false});T.sb.special();T.run(11.5);
 ok('off switch: storyworld.r561.gunner on:false leaves the engine special alone',T.hits.length===0,T.hits);}

{const T=mk({enemies:[mkE('on',13,10)]});T.sb.special();T.run(10.24);
 T.sb.player.specialCD=0;T.sb.special();T.run(11);
 ok('recast: cooldown reset during a beam cannot create a second concurrent beam',T.A().inspect().stats.q===1&&beamHits(T).length===6,T.hits);
 T.sb.special();ok('recast: a new cast can start once the previous beam expires',T.A().inspect().stats.q===2,T.A().inspect().stats.q);}
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R561c beam contact: ${pass}/${checks.length}`);if(pass!==checks.length)process.exitCode=1;
