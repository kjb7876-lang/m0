// R1098 CPU 검사: 사몽 얼굴 바로잡기(samong-face-r1098.js) — 브라우저 없이 실제 모듈을 가짜 전역에서 돌린다.
//  사용자 2026-11-16 "사몽·사몽역행 몹·보스 이미지 전수조사, 환도영웅 자꾸 나오는 문제" → 실측: 사몽 전용 그림이 없는 44종이
//  R161 꼭두각시 시트(두건·칼, 환도와 거의 같은 모습)로 그려지고 최종 보스 미카엘라도 그 시트였다. 사용자 선택(05:25Z) "꼭두각시도 다시 칠하기".
//  ① 연결(태그·sync·공개 확인 목록·CI 줄)
//  ② 미카엘라: 사몽 최종 보스·무한생존 미카엘라만 미카엘라 본인 시트(R380 persona-michaela-w), 다른 보스·같은 이름 일반몹·영웅은 그대로, 그림 준비 전엔 바탕+미리 읽기
//  ③ R161 꼭두각시가 미카엘라를 덮지 않음(실제 samong-r161.js puppetOf)
//  ④ 먹·흰 실 인형 칠(inkPuppet): 칼날 기둥 지움, 몸은 무채색 먹(짙게), 위쪽 실은 흰 실, 바깥 테는 종이빛, 경계값·NaN 없음·같은 입력 같은 결과
//  ⑤ readyImage 감싸기: 구운 뒤엔 꼭두각시 경로에만 구운 캔버스, 다른 경로·끈 상태는 원본
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'..','..'),ROOT=path.resolve(R,'..');
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return '';}};
const res=[];const ok=(n,c,d='')=>{res.push(!!c);console.log((c?'PASS ':'FAIL ')+n+(c||d===''?'':' :: '+(typeof d==='string'?d:JSON.stringify(d))));};
const done=()=>{const failed=res.filter(x=>!x).length;console.log(JSON.stringify({total:res.length,failed,method:'node vm + fake globals'}));process.exit(failed?1:0);};
const NAME='samong-face-r1098.js',F=path.join(R,'client-source',NAME);const src=rd(F);
ok('client-source/'+NAME+' exists',src.length>0);
// ---- ① 연결 ----
const html=rd(path.join(R,'runtime-text','index.html'));
ok('runtime copy identical to client-source',src.length>0&&rd(path.join(R,'runtime-text',NAME))===src);
ok('index.html loads it exactly once, on its own line',(html.match(/\n<script src="\.\/samong-face-r1098\.js"><\/script>\n/g)||[]).length===1);
{const t=n=>html.indexOf('<script src="./'+n+'">');
 ok('right after persona-ink-r1097, before boot-lean-r1038 (R161·R380 보다 먼저 실려도 됨: puppetOf 는 부를 때 covers 를 묻고, frameFor 는 0.7초마다 바깥으로 다시 감싼다)',t(NAME)>0&&t('samong-r161.js')>0&&t('approved-mobs-r380.js')>0&&/<script src="\.\/persona-ink-r1097\.js"><\/script>\n<script src="\.\/samong-face-r1098\.js"><\/script>\n<script src="\.\/boot-lean-r1038\.js"><\/script>/.test(html));}
ok('verify-r96-public.py expects it',/'samong-face-r1098\.js'/.test(rd(path.join(ROOT,'scripts','verify-r96-public.py'))));
ok('runtime-inputs/manifest list it',/samong-face-r1098\.js/.test(rd(path.join(R,'runtime-inputs.json')))&&/samong-face-r1098\.js/.test(rd(path.join(R,'runtime-manifest.json'))));
ok('pages.yml runs this check',/node r96\/qa\/r1098\/r1098-cpu-check\.cjs/.test(rd(path.join(ROOT,'.github','workflows','pages.yml'))));
if(!src)done();
// ---- 가짜 세계 ----
const MICH='assets/r380/mobs/persona-michaela-w.webp',PUP='assets/r161/puppet/puppet-ego-walk-right-8.webp';
function world(stored,{ready=true}={}){
 const store=new Map(stored===undefined?[]:[['storyworld.r1098.samongFace',stored]]);const asked=[];const base=[];
 const W={console,Math,JSON,Number,String,Array,Object,Map,Set,WeakMap,WeakSet,Uint8ClampedArray,Promise,Date,RegExp,Error,isFinite,setInterval:()=>0,setTimeout:()=>0,
  localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))},
  document:{createElement:t=>({width:0,height:0,getContext:()=>({drawImage(){},getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4),width:w,height:h}),putImageData(){}})})},
  time:5,layer:'DREAM',room:{samongR103:{key:'M',zone:'sz115-M-1'},enemies:[]},player:{hero:'hwando',x:0,y:0},
  ensureImages:a=>{asked.push(...a);return Promise.resolve();}};
 W.readyImage=p=>{base.push(p);return ready?{image:{naturalWidth:100,width:100,height:100,src:p},ready:true}:null;};
 W.window=W;
 W.__STORYWORLD_APPROVED_MOBS_R380__=Object.freeze({frameOf:(e,m,id)=>({path:m.path,assetFrame:{sourceRect:[0,0,m.cell[0],m.cell[1]],pivot:m.pivot,visibleHeight:m.visibleHeight},flip:false,r380Sheet:id}),assign:()=>null});
 W.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({frameFor:(e,f)=>({path:'assets/base/'+(e.name||'x')+'.webp',assetFrame:{sourceRect:[0,0,10,10],pivot:[5,9],visibleHeight:9}})});
 vm.createContext(W);vm.runInContext(src,W,{filename:NAME});return {W,asked,base,store};}
// ---- ② 미카엘라 ----
{const {W,asked}=world();const M=W.__STORYWORLD_SAMONG_FACE_R1098__;ok('API exposed',!!M&&typeof M.covers==='function'&&typeof M.inkPuppet==='function'&&typeof M.inspect==='function');
 if(!M)done();
 const mich={id:'sm103:sz115-M-1:b:1',name:'미카엘라',boss:true,hp:10,maxHp:10,samongR103:'sm103:sz115-M-1:b:1'};
 const surv={id:'sv:1',name:'미카엘라',boss:true,hp:10,r1010Michaela:true};
 ok('samong final boss 미카엘라 covered',M.covers(mich)===true);
 ok('survival finale 미카엘라 covered',M.covers(surv)===true);
 ok('other samong boss not covered',M.covers({name:'강재헌',boss:true,hp:5,samongR103:'x'})===false);
 ok('non-boss named 미카엘라 not covered',M.covers({name:'미카엘라',boss:false,hp:5,samongR103:'x'})===false);
 ok('story-mode 미카엘라-like boss outside samong not covered',M.covers({name:'미카엘라',boss:true,hp:5})===false);
 ok('null / hero not covered',M.covers(null)===false&&M.covers(W.player)===false);
 const S=W.__STORYWORLD_STORY_COMBAT_R54__;const f=S.frameFor(mich,null);
 ok('frameFor gives Michaela her own sheet',f&&f.path===MICH,f&&f.path);
 const g=S.frameFor({name:'강재헌',boss:true,hp:5,samongR103:'x'},null);ok('other boss frame untouched',g&&g.path==='assets/base/강재헌.webp');
 ok('frame numbers finite',f&&f.assetFrame.pivot.every(Number.isFinite)&&Number.isFinite(f.assetFrame.visibleHeight));}
{const {W,asked}=world(undefined,{ready:false});const S=W.__STORYWORLD_STORY_COMBAT_R54__;const f=S.frameFor({id:'a',name:'미카엘라',boss:true,hp:5,samongR103:'a'},null);
 ok('sheet not ready → base frame and preload asked',f.path==='assets/base/미카엘라.webp'&&asked.includes(MICH),{p:f.path,asked});}
{const {W}=world('{"michaela":false}');const S=W.__STORYWORLD_STORY_COMBAT_R54__;ok('switch off michaela → base frame',S.frameFor({id:'a',name:'미카엘라',boss:true,hp:5,samongR103:'a'},null).path==='assets/base/미카엘라.webp');}
// ---- ③ R161 꼭두각시가 미카엘라를 덮지 않음 ----
{const r161=rd(path.join(R,'client-source','samong-r161.js'));const {W}=world();W.drawEnemy=function(){};W.tick=function(){};W.drawEffect=function(){};W.drawProp=function(){};
 W.__STORYWORLD_SAMONG_R161__=undefined;try{vm.runInContext(r161,W,{filename:'samong-r161.js'});}catch(e){ok('samong-r161 loads in fake world',false,String(e));}
 const P=W.__STORYWORLD_SAMONG_R161__;
 ok('R161 puppetOf skips covered Michaela',P&&P.puppetOf({id:'m',name:'미카엘라',boss:true,hp:5,samongR103:'m'})===false);
 ok('R161 puppetOf still takes other art-less samong boss',P&&P.puppetOf({id:'k',name:'강재헌',boss:true,hp:5,samongR103:'k'})===true);}
// ---- ④ 먹·흰 실 인형 칠 ----
{const {W}=world();const M=W.__STORYWORLD_SAMONG_FACE_R1098__;
 // 2칸(128×160) 가짜 꼭두각시: 실(위 x=60·64 세로줄), 몸(붉은/흰 무늬 덩어리 x40..90 y40..150), 칼날(가는 회색 줄 x91..125 y100..103)
 const CW=128,CH=160,Wd=CW*2,Hd=CH;const px=new Uint8ClampedArray(Wd*Hd*4);const set=(x,y,r,g,b,a=255)=>{const i=(y*Wd+x)*4;px[i]=r;px[i+1]=g;px[i+2]=b;px[i+3]=a;};
 for(let c=0;c<2;c++){const o=c*CW;for(let y=0;y<40;y++){set(o+60,y,10,10,10);set(o+64,y,10,10,10);}
  for(let y=40;y<150;y++)for(let x=40;x<=90;x++)((x+y)%6<3)?set(o+x,y,200,40,50):set(o+x,y,235,230,225);
  for(let y=100;y<=103;y++)for(let x=91;x<=125;x++)set(o+x,y,170,170,175);}
 const cfg={cw:CW,ch:CH,pivotX:52};const out=M.inkPuppet(px,Wd,Hd,cfg);
 const at=(x,y)=>{const i=(y*Wd+x)*4;return [out[i],out[i+1],out[i+2],out[i+3]];};
 ok('returns same-size pixels',out&&out.length===px.length);
 let blade=0;for(let c=0;c<2;c++)for(let y=100;y<=103;y++)for(let x=100;x<=125;x++)if(at(c*CW+x,y)[3]>0)blade++;ok('sword blade removed (both cells)',blade===0,blade);
 let sat=0,lum=0,n=0;for(let y=50;y<140;y++)for(let x=46;x<=84;x++){const [r,g,b,a]=at(x,y);if(!a)continue;const mx=Math.max(r,g,b),mn=Math.min(r,g,b);sat=Math.max(sat,mx?(mx-mn)/mx:0);lum+=(r+g+b)/3;n++;}
 ok('body is colourless ink (max saturation < .12)',n>0&&sat<.12,{sat});ok('body is dark ink (mean < 110)',n>0&&lum/n<110,{mean:lum/n});
 {const [r,g,b,a]=at(60,10);ok('strings above the head turn pale thread',a>0&&(r+g+b)/3>175,[r,g,b,a]);}
 {const [r,g,b,a]=at(40,90);ok('outer edge gets a pale paper rim',a>0&&(r+g+b)/3>150,[r,g,b,a]);}
 ok('no NaN, deterministic',[...out].every(Number.isFinite)&&M.inkPuppet(px,Wd,Hd,cfg).every((v,i)=>v===out[i]));
 ok('input not mutated',px[(10*Wd+60)*4]===10);
 let threw=false;try{M.inkPuppet(new Uint8ClampedArray(0),0,0,cfg);M.inkPuppet(new Uint8ClampedArray(4),1,1,cfg);M.inkPuppet(new Uint8ClampedArray(4*CW*CH),CW,CH,cfg);M.inkPuppet(null,3,3,cfg);M.inkPuppet(px,Wd,Hd,{});}catch(e){threw=String(e);}
 ok('edge cases (empty, 1x1, transparent, null, default cfg) do not throw',threw===false,threw);}
// ---- ⑤ readyImage 감싸기 ----
{const {W,base}=world();const M=W.__STORYWORLD_SAMONG_FACE_R1098__;
 const before=W.readyImage(PUP);ok('before bake puppet path gives original image',before&&before.image&&before.image.src===PUP);
 M._setBaked({width:1024,height:640,r1098:true});
 const after=W.readyImage(PUP);ok('after bake puppet path gives baked canvas',after&&after.image&&after.image.r1098===true);
 ok('other paths untouched',W.readyImage('assets/x.webp').image.src==='assets/x.webp');
 M.set({puppet:false});ok('puppet repaint off → original',W.readyImage(PUP).image.src===PUP);}
done();
