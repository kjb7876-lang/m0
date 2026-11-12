// R561c CPU check: 기억사수 Q 회상 광선포 — ① 광선이 실제 총구에서 나간다(8방향·확대·들림·걸어도 따라감) ② 굵기는 총구 크기 ③ 맞은 적에서 근처 적으로 연쇄 레이저(수·거리 상한).
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

function mk(opt={}){const hits=[],drawn={along:[],draw:[],img:[]},L={};
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
 const A=()=>sb.window.__STORYWORLD_GUNNER_ARMS_R561__;
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
{const T=mk({enemies:[mkE('on',13,10),mkE('edge',13,10.5),mkE('out',13,11.2)]});T.sb.special();T.run(11.5);
 const s=id=>T.hits.filter(h=>h.ab==='gunnerBeamR561'&&h.id===id).length;
 ok('hit width: thin beam hits on-line and ±0.5 tiles, not ±1.2 tiles (was ±0.75)',s('on')>0&&s('edge')>0&&s('out')===0,{on:s('on'),edge:s('edge'),out:s('out')});}

// ---------- ③ 연쇄 레이저 ----------
const CH='gunnerBeamChainR561';
const chainHits=(T,id)=>T.hits.filter(h=>h.ab===CH&&(!id||h.id===id));
{// 기본 연쇄: a(줄 위 첫 적) → c → d, 멀리 z·e 는 안 맞음, 줄 위 b 는 연쇄로 또 맞지 않음
 const T=mk({enemies:[mkE('a',13,10),mkE('b',16,10),mkE('c',13,12.5),mkE('d',13,15),mkE('z',13,19.2),mkE('e',3,3)]});T.sb.special();T.run(11.5);
 ok('chain: spreads from the first beam target to the nearest unhit enemies (c then d) within range',chainHits(T,'c').length>0&&chainHits(T,'d').length>0,{c:chainHits(T,'c').length,d:chainHits(T,'d').length});
 ok('chain: does not reach out-of-range enemies (z is 4.2 from d, e is far) and never re-hits beam-line targets',chainHits(T,'z').length===0&&chainHits(T,'e').length===0&&chainHits(T,'a').length===0&&chainHits(T,'b').length===0,{z:chainHits(T,'z').length,e:chainHits(T,'e').length,a:chainHits(T,'a').length,b:chainHits(T,'b').length});
 const p=T.hits.filter(h=>h.ab==='gunnerBeamR561'&&h.id==='a')[0],c0=chainHits(T,'c')[0],d0=chainHits(T,'d')[0];
 ok('chain: damage falls off along the chain (c > d) and one link is weaker than a full beam tick × 2',c0&&d0&&p&&c0.v>d0.v&&c0.v<=p.v*2,{p:p&&p.v,c:c0&&c0.v,d:d0&&d0.v});}
{// 거리 경계: 3.19 포함, 3.21 제외 (a 에서)
 const mkRing=r=>mk({enemies:[mkE('a',13,10),mkE('n',13,10+r)]});
 const In=mkRing(3.19);In.sb.special();In.run(11.5);const Out=mkRing(3.21);Out.sb.special();Out.run(11.5);
 ok('chain range boundary: enemy 3.19 tiles from the hit target is chained, 3.21 is not',chainHits(In,'n').length>0&&chainHits(Out,'n').length===0,{in:chainHits(In,'n').length,out:chainHits(Out,'n').length});}
{// 벽(시선 막힘)은 건너뜀
 const T=mk({enemies:[mkE('a',13,10),mkE('c',13,12.5)],clearLine:(p,q)=>!((p.id==='a'&&q.id==='c')||(p.id==='c'&&q.id==='a'))});T.sb.special();T.run(11.5);
 ok('chain: no link through a wall (line of sight blocked)',chainHits(T,'c').length===0,chainHits(T,'c').length);}
{// 상한: 한 줄로 늘어선 20마리 — 한 시전의 연쇄 맞음은 (파동 3 × 뿌리 2 × 4번) 이하, 한 파동에 같은 적은 한 번
 const row=[mkE('a',13,10)];for(let i=1;i<=20;i++)row.push(mkE('r'+i,13,10+i*2));
 const T=mk({enemies:row});T.sb.special();T.run(11.5);const total=chainHits(T).length;
 const perWave={};let dup=0;for(const h of chainHits(T)){const w=Math.round((h.t-10-0.18)/0.24),k=perWave[w]=perWave[w]||new Set();if(k.has(h.id))dup++;k.add(h.id);}
 ok('chain cap: a 20-enemy column gets ≤ 3 waves × 2 roots × 4 jumps = 24 chain hits per cast, ≤ 4 per root per wave',total>0&&total<=24,{total});
 ok('chain cap: within a wave no enemy is chained twice',dup===0,{dup});}
{// 대량(300마리) — 연쇄 맞음·그림 수 상한, 처리 시간
 const crowd=[];let n=0;for(let x=11;x<=40;x+=1.5)for(let y=0;y<=30;y+=1.5)crowd.push(mkE('m'+(n++),x,y));const T=mk({enemies:crowd});
 const t0=process.hrtime.bigint();T.sb.special();T.run(12);const ms=Number(process.hrtime.bigint()-t0)/1e6;
 const total=chainHits(T).length;T.run(10.6);let peak=0;for(let k=0;k<20;k++){T.sb.time=+(10.2+k*.03).toFixed(3);T.paint();peak=Math.max(peak,T.drawn.along.length+T.drawn.draw.length);}
 ok(`chain load: ${crowd.length} enemies → ≤ 24 chain hits per cast, ≤ 80 sprite draws in any frame, whole 2 s simulation under 400 ms`,total>0&&total<=24&&peak<=80&&ms<400,{total,peak,ms:Math.round(ms),crowd:crowd.length});}
{// 연쇄 그림: a→c 사이에 가는 선이 그려진다(양끝이 두 적의 화면 위치 근처, 굵기는 총구 이하)
 const T=mk({enemies:[mkE('a',13,10),mkE('c',13,12.5),mkE('d',13,15)]});T.sb.special();T.run(10.45);T.paint();const H=H0(1),pa=T.sb.project(13,10),pc=T.sb.project(13,12.5),near=(x,y,p)=>Math.abs(x-p.x)<=45&&y<=p.y+10&&y>=p.y-H*1.3;
 const thin=T.drawn.along.filter(c=>c.w<=0.2*H);
 ok('chain visual: a thin laser segment leaves the first target and one reaches the next enemy (code-drawn, temporary until a Dots sheet)',thin.some(c=>near(c.x0,c.y0,pa))&&thin.some(c=>near(c.x1,c.y1,pc)),thin.slice(0,4));}
{// 끄기 호환: 연계(chain) 끄기와 무관, on:false 이면 엔진 원래 스킬
 const T=mk({enemies:[mkE('a',13,10),mkE('c',13,12.5)]});T.A().set({on:false});T.sb.special();T.run(11.5);ok('off switch: storyworld.r561.gunner on:false leaves the engine special alone (no chain hits)',chainHits(T).length===0,chainHits(T).length);}

const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R561c chain beam: ${pass}/${checks.length}`);if(pass!==checks.length)process.exitCode=1;
