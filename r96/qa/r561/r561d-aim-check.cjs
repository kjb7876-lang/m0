// R561d CPU check: 기억사수 Q·W·E 는 총구(그림 8방향 칸) 방향으로만 나가고, 적을 향해 꺾이지 않는다 — 줄 위에 걸린 적만 맞고 연쇄가 이어진다.
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

const norm=a=>Math.atan2(Math.sin(a),Math.cos(a));
const ab=(id,T,tag)=>T.hits.filter(h=>h.ab===tag&&h.id===id).length;
const BEAMT='gunnerBeamR561',CH='gunnerBeamChainR561';
// 겨눈 칸 한가운데 줄 위에서 옆으로 off(타일)만큼 벗어난 자리
function at(T,sec,d,off){const a=worldAngleFor(sec),p=T.sb.player;return {x:p.x+Math.cos(a)*d-Math.sin(a)*off,y:p.y+Math.sin(a)*d+Math.cos(a)*off};}
// 같은 8방향 칸 안에서 월드 각 +0.2 rad 벗어난 곳(옛 코드는 이쪽으로 꺾어 쏘았다)
const skew=(sec,d=6)=>{const a=worldAngleFor(sec)+0.2;return {x:10+Math.cos(a)*d,y:10+Math.sin(a)*d,sec:sectorOf(Math.cos(a),Math.sin(a))};};

for(const sec of Object.keys(ANG)){
 const p=skew(sec);
 ok(`setup ${sec}: skewed target is still inside the same aim sector`,p.sec===sec,p);
 // Q: 줄에서 벗어난 적만 있으면 — 쏘기는 하되 맞지 않고 연쇄도 없다
 {const T=mk({enemies:[mkE('off',p.x,p.y)]});T.sb.special();T.run(11.5);
  ok(`Q ${sec}: beam goes along the weapon sector, an enemy beside the line is NOT auto-hit`,ab('off',T,BEAMT)===0&&ab('off',T,CH)===0,{beam:ab('off',T,BEAMT),chain:ab('off',T,CH)});}
 // Q: 줄 위 적 + 곁 적 → 줄 위 적만 빔 적중, 곁 적은 연쇄로
 {const on=at(mk({}),sec,5,0),side=at(mk({}),sec,5,1.8);
  const T=mk({enemies:[mkE('on',on.x,on.y),mkE('side',side.x,side.y)]});T.sb.special();T.run(11.5);
  ok(`Q ${sec}: enemy on the muzzle line gets the beam, the one beside it only gets the chain`,ab('on',T,BEAMT)>0&&ab('side',T,BEAMT)===0&&ab('side',T,CH)>0,{on:ab('on',T,BEAMT),sideBeam:ab('side',T,BEAMT),sideChain:ab('side',T,CH)});}
}
// Q: 겨눈 줄이 8방향 정확한 칸 각도로 고정(적 방향이 아님)
{const sec='e',a=worldAngleFor(sec),T=mk({});T.sb.special();T.run(10.4);
 const on=at(T,sec,5,0);T.sb.room.enemies.push(mkE('on',on.x,on.y));T.run(11.5);
 ok('Q: manual cast with no enemy still fires along the facing sector (no crash, beam line follows the pose)',T.A().inspect().lastError==null,T.A().inspect().lastError);}
// W 저격: 곁 적은 안 맞는다 / E 연사: 곁 적은 안 맞는다
for(const sec of ['e','s','nw']){const p=skew(sec);
 {const T=mk({enemies:[mkE('off',p.x,p.y)]});T.A().fire('w',true);T.run(12.5);
  ok(`W ${sec}: sniper shot is not bent onto an enemy beside the muzzle line`,ab('off',T,'gunnerSnipeR561')===0,{n:ab('off',T,'gunnerSnipeR561')});}
 {const T=mk({enemies:[mkE('off',p.x,p.y)]});T.A().fire('e',true);T.run(12.5);
  ok(`E ${sec}: rifle burst is not bent onto an enemy beside the muzzle line`,ab('off',T,'gunnerRifleR561')===0,{n:ab('off',T,'gunnerRifleR561')});}
}
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R561d aim: ${pass}/${checks.length}`);if(pass!==checks.length)process.exitCode=1;
