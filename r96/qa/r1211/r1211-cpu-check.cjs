'use strict';
// R1211 — R1199(#833) 후속: Dots 검수·코드 리뷰 지적 두 가지 재현과 고침 확인.
//  ① R111 흑백 사본 예열(preUpload)이 CommandScene.texture() 로 참조를 하나 얻고 놓지 않는다 → grayReset 으로 사본을 버려도
//     텍스처 참조가 남아 R89 정리에 안 걸리고 GPU 에 쌓인다(모바일은 각성이 끝날 때마다 비우므로 각성 3회에 참조 1→2→3).
//     고침: 예열 때 얻은 참조를 사본마다 한 번만 기록하고, 사본을 버릴 때(grayReset) 그 장면(CommandScene)에 한 번만 돌려준다.
//  ② R409 테두리 캐시는 알파만이 아니라 원본 몸 그림(RGB)까지 구워 넣는다 → 흑백 사본에 원본 열쇠를 쓰면
//     컬러로 구운 칸이 각성 중에 그대로 나오고(흑백 화면에 원색 몹), 각성 중에 구운 회색 칸이 각성 뒤에도 남는다.
//     고침: 흑백 사본은 '원본 열쇠 + :g' 로 컬러와 따로 굽는다(사본을 다시 만들어도 열쇠는 같아 각성마다 다시 굽지는 않음).
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'..','..'),SRC=path.join(ROOT,'client-source'),RT=path.join(ROOT,'runtime-text');
let n=0,bad=0;const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('PASS',m);};
const src=fs.readFileSync(path.join(SRC,'play-r111.js'),'utf8');
ok(fs.readFileSync(path.join(RT,'play-r111.js'),'utf8')===src,'runtime-text 사본 = client-source(play-r111)');
function mk(opt={}){
 class DrawCommands{constructor(){this.commands=[];this.owner={kind:'prop'};this.got=[];}drawImage(image){this.got.push(image);}push(kind,data){this.commands.push({kind,style:{...(data||{})}});return true;}}
 const mkScene=()=>{const textures=new Map();return{textures,disposed:0,released:0,
  texture(img,m){let r=textures.get(img);if(!r){r={texture:{img},refs:0};textures.set(img,r);}r.refs++;return r.texture;},
  release(img){const r=textures.get(img);this.released++;if(!r)return;if(--r.refs===0){textures.delete(img);this.disposed++;}},
  refs(){let s=0;for(const r of textures.values())s+=r.refs;return s;}};};
 const three={commands:mkScene(),renderer:{initTexture(){}}};
 const sb={console,Math,JSON,Set,Map,WeakMap,WeakSet,Object,Array,Number,String,Boolean,Error,Promise,setTimeout,
  localStorage:{getItem:()=>null,setItem(){}},NodeFilter:{SHOW_TEXT:4},performance:{now:()=>0},
  document:{getElementById:()=>null,querySelector:()=>null,createTreeWalker:()=>({nextNode:()=>null}),
   createElement:()=>{let w=0;return{get width(){return w;},set width(v){w=v;},height:0,getContext:()=>({filter:'none',drawImage(){}})};}},
  time:10,started:true,modal:false,loading:false,settings:{lowFx:false},zoom:1,target:null,layer:'DREAM',
  player:{x:0,y:0,hp:50,hero:'hwando',direction:'front',resonance:0,attackAnim:0,skillAnim:0,moving:false,samong:0,samongCD:0},
  room:{id:'zoneA',enemies:[],props:[]},HEROES:{hwando:{range:1.5}},
  maxHP:()=>100,actorHeight:()=>60,project:(x,y)=>({x:(x-y)*34,y:(x+y)*17}),facing:()=>'left',
  tick(dt){sb.time+=dt;},drawHero(){},drawEffect(){},drawProjectile(){},hitEnemy(){return true;},hurt(){},fx(){},blink(){},guideStep(){},
  StoryPhase1:{DrawCommands},__STORYWORLD_PHASE1__:{controller:{state:{three}}}};
 sb.window=sb;if(opt.mobile)sb.__STORYWORLD_MOBILE_R63__={isMobile:()=>true};let active=false;sb.__STORYWORLD_SAMONG_R75__={active:()=>active};sb.__STORYWORLD_WER__={defs:{hwando:{e:['E','x','dash']}}};
 vm.createContext(sb);vm.runInContext(src,sb,{filename:'play-r111.js'});
 const dc=new DrawCommands();const P=sb.__STORYWORLD_PLAY_R111__;
 return{sb,three,mkScene,P,set:v=>{active=v;sb.player.samong=v?7:0;sb.player.samongCD=v?50:0;},tick:(dt=.016)=>sb.tick(dt),
  draw:(img)=>{dc.owner={kind:'prop'};dc.got.length=0;dc.drawImage(img,0,0);return dc.got[0];},st:()=>P.inspect().samong};}
const IMG=(w,h,name)=>({width:w,height:h,naturalWidth:w,naturalHeight:h,src:'assets/'+name+'.png'});
// ---- ① 모바일: 각성 3회 ----
{const m=mk({mobile:true}),S=m.three.commands,imgs=[IMG(300,200,'a'),IMG(200,200,'b')];const after=[];
 for(let k=0;k<3;k++){m.tick();for(const x of imgs)m.draw(x);m.tick();m.tick();
  if(k===0)ok(m.st().prewarmMade>=2&&S.refs()===2,'예열이 사본 2장을 GPU 에 올리고 참조 2개를 쥠(refs '+S.refs()+')');
  m.set(true);m.tick();for(const x of imgs)m.draw(x);m.tick();m.set(false);m.tick();after.push(S.refs());}
 ok(after.every(v=>v===0),'모바일 각성 3회: 각성이 끝나 사본을 버릴 때마다 예열 참조도 0 으로(남은 참조 '+after.join('→')+')');
 ok(S.textures.size===0&&S.disposed>=6,'버린 사본의 텍스처는 장면에서 정리됨(dispose '+S.disposed+')');}
// ---- ① PC: 지역 이동으로 비울 때 ----
{const m=mk(),S=m.three.commands;m.tick();m.draw(IMG(300,200,'a'));m.tick();m.tick();const r0=S.refs();
 m.sb.room={id:'zoneB',enemies:[],props:[]};m.tick();ok(r0===1&&S.refs()===0,'PC 지역 이동으로 사본을 비우면 예열 참조도 돌려줌('+r0+'→'+S.refs()+')');}
// ---- ① 같은 사본은 한 번만 쥐고 한 번만 놓음, 장면이 바뀌었으면 옛 장면에 놓음 ----
{const m=mk({mobile:true}),S1=m.three.commands;m.tick();m.draw(IMG(300,200,'a'));m.tick();m.tick();
 const S2=m.mkScene();m.three.commands=S2;m.tick();m.tick();
 m.set(true);m.tick();m.set(false);m.tick();
 ok(S1.refs()===0&&S1.released===1&&S2.released===0,'장면이 바뀐 뒤 비우면 참조를 얻었던 옛 장면에 한 번만 돌려줌(옛 '+S1.released+'·새 '+S2.released+')');
 m.set(true);m.tick();m.set(false);m.tick();ok(S1.released===1&&S2.released===0,'이미 놓은 참조는 다시 놓지 않음');}
// ---- ② R409 열쇠 ----
const r409=fs.readFileSync(path.join(SRC,'combat-read-r409.js'),'utf8');
ok(fs.readFileSync(path.join(RT,'combat-read-r409.js'),'utf8')===r409,'runtime-text 사본 = client-source(R409)');
const mIm=r409.match(/const imgId=im=>\{[^\n]*\n/);ok(!!mIm,'R409 imgId 찾음');
if(mIm){const imgId=vm.runInNewContext('(()=>{const ids=new WeakMap();let idSerial=0;'+mIm[0]+';return imgId;})()',{WeakMap});
 const s={src:'https://x/assets/mob.png',currentSrc:'https://x/assets/mob.png'};
 const copy=()=>{const c={};Object.defineProperty(c,'__r1199AlphaOf',{value:s});return c;};const g1=copy(),g2=copy();
 ok(imgId(g1)!==imgId(s),'흑백 사본 테두리 열쇠 ≠ 컬러 원본 열쇠(컬러로 구운 칸이 각성 중에 나오지 않음): '+imgId(g1)+' / '+imgId(s));
 ok(imgId(g1)===imgId(g2),'같은 원본의 흑백 사본은 다시 만들어도 같은 열쇠(각성마다 다시 굽지 않음): '+imgId(g2));
 ok(typeof imgId(g1)==='string'&&String(imgId(g1)).startsWith(String(imgId(s))),'흑백 열쇠는 원본 열쇠에서 나옴');}
console.log(`\nR1211 CPU ${n-bad}/${n} ${bad?'FAIL':'PASS'}`);process.exit(bad?1:0);
