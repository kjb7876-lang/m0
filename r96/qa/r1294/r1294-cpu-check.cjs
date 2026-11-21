// R1294 네온 R(노바) 때 사방으로 튀는 '차지드 볼트'가 흰 네모 도트(r106 fx 'pixel')로 그려지던 것 → 네온 민트 스파크 프레임 시트로. node r96/qa/r1294/r1294-cpu-check.cjs
//  fx-d2s-r106.js 를 vm 에 올려 영웅별로 R 노바를 띄우고 시간을 넘기며 그린다 → 그리기 이름(SP.draw)·ctx.drawImage 경로를 모아 본다.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..');let n=0;const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d).slice(0,300));assert(c,m);n++;console.log('PASS',m);};
const src=fs.readFileSync(path.join(R,'client-source','fx-d2s-r106.js'),'utf8');
const SHEET='assets/r951/neon-lance-impact.webp';
function load({ready=true,lowFx=false,hero='neon',tier=3}={}){
 const draws=[],images=[],asked=[];const win={};
 const ctx={globalAlpha:1,globalCompositeOperation:'source-over',filter:'none',save(){},restore(){},translate(){},rotate(){},scale(){},
  drawImage(im,...a){images.push({path:im&&im.src,args:a,alpha:this.globalAlpha,op:this.globalCompositeOperation,filter:this.filter});},
  scope(o,run){return run();}};
 const IMG={src:SHEET,width:1536,height:1024};
 const sb={window:win,localStorage:{getItem:()=>null,setItem(){}},Math,Number,JSON,Object,Array,String,Set,Map,Promise,console,
  started:true,room:{},player:{x:10,y:10,hero,specialCD:0},settings:{lowFx},time:0,ctx,effects:[],
  project:(x,y)=>({x:x*32,y:y*16}),actorHeight:()=>60,liveEnemies:()=>[],nearestEnemy:()=>null,
  readyImage:p=>ready&&p===SHEET?{image:IMG}:null,ensureImages:a=>{asked.push(...a);return Promise.resolve();},
  drawEffect(){},special(){},tick(){},fx(){},enterRegion:async()=>true};
 win.__STORYWORLD_FX_SPRITES_R106__={on:()=>true,pal:c=>({a:c,b:c}),draw:(name,F,x,y,w,h,o)=>{draws.push({name,x,y,w,h,o});return true;},along:()=>true};
 const PAL={neon:{a:[62,230,193],b:[226,232,242]},gunner:{a:[214,222,234],b:[255,255,255]},hwando:{a:[1,1,1],b:[2,2,2]},seoha:{a:[3,3,3],b:[4,4,4]}};
 win.__STORYWORLD_HERO_FX_R102__={PALETTE:PAL,tier:()=>tier};
 win.__STORYWORLD_HERO_SKILLS_R269__={slotsFor:h=>({neon:{w:'aegis',r:'nova'},hwando:{r:'nova'},seoha:{r:'nova'}})[h]};
 vm.createContext(sb);vm.runInContext(src,sb);const api=win.__STORYWORLD_D2S_R106__;
 const run=(t)=>{api.launch(hero,'r',0,null);api.test.freeze(true);const out=[];for(const tt of t){draws.length=0;images.length=0;api.test.seek(tt);sb.drawEffect({type:'r106-d2s'});out.push({t:tt,draws:draws.map(d=>d.name),dd:draws.slice(),images:images.slice()});}return out;};
 return {api,sb,run,asked};}
const T=[.02,.1,.2,.3,.45,.6,.75,.85];
// 1 네온 R: 네모 도트 0, 스파크 시트 그리기 있음
{const o=load();const fr=o.run(T);const pix=fr.reduce((s,f)=>s+f.draws.filter(n=>n==='pixel').length,0),sp=fr.reduce((s,f)=>s+f.images.filter(i=>i.path===SHEET).length,0);
 ok(o.api.effects().some(e=>e.kind==='nova'&&e.hero==='neon'),'네온 R 은 노바로 뜸(R269 슬롯 표)');
 ok(pix===0,'네온 R 노바에 흰 네모 도트(pixel) 그리기 0',{pix});
 ok(sp>=T.length*4,'네온 R 차지드 볼트마다 민트 스파크 시트 칸을 그림',{sp});
 const ims=fr.flatMap(f=>f.images.filter(i=>i.path===SHEET));
 ok(ims.every(i=>i.args.length===8&&i.args.every(Number.isFinite)),'스파크는 9인자 drawImage, 좌표 모두 유한값');
 ok(ims.every(i=>i.args[2]===256&&i.args[3]===256&&i.args[0]%256===0&&i.args[1]===0&&i.args[0]>=256&&i.args[0]<=768),'시트 첫 줄 1~3칸(스파크 별)만 씀',ims.slice(0,3).map(i=>i.args.slice(0,4)));
 ok(new Set(ims.map(i=>i.args[0])).size>=2,'칸이 바뀜(프레임 애니메이션, 정지 그림 아님)');
 ok(ims.every(i=>i.filter==='none'||i.filter===undefined),'ctx.filter 쓰지 않음');
 ok(ims.every(i=>i.alpha>0&&i.alpha<=1),'알파 0~1');
 const late=fr.filter(f=>f.t>=.85).flatMap(f=>f.images.filter(i=>i.path===SHEET));ok(late.every(i=>i.alpha<.2),'끝 무렵 옅어짐',late.map(i=>i.alpha));
 ok(fr.reduce((s,f)=>s+f.draws.filter(n=>n==='flare').length,0)>0&&fr.some(f=>f.draws.includes('cross')),'노바의 다른 층(십자·섬광)은 그대로');}
// 2 그림이 아직 안 받아졌을 때: 도트로 되돌아가지 않고 시트를 부름
{const o=load({ready:false});const fr=o.run(T);ok(fr.every(f=>!f.draws.includes('pixel')),'시트 준비 전에도 네모 도트로 되돌아가지 않음');ok(o.asked.includes(SHEET),'시트 받기를 요청');ok(fr.every(f=>!f.images.length),'준비 전엔 스파크 안 그림(섬광만)');}
// 3 낮은 효과 설정에서도 같은 규칙
{const o=load({lowFx:true});const fr=o.run(T);ok(fr.every(f=>!f.draws.includes('pixel')),'lowFx 에서도 도트 0');ok(fr.some(f=>f.images.length),'lowFx 에서도 스파크');}
// 4 회귀: 다른 영웅 노바는 손대지 않음(이번 요청은 네온만)
{const o=load({hero:'gunner'});const fr=o.run(T);ok(fr.some(f=>f.draws.includes('pixel'))&&fr.every(f=>!f.images.length),'거너 노바는 그대로(범위 밖)');}
// 5 단계 0·7 경계
for(const tier of [0,7]){const o=load({tier});const fr=o.run(T);ok(fr.every(f=>!f.draws.includes('pixel'))&&fr.some(f=>f.images.length),'성장 단계 '+tier+' 에서도 도트 0·스파크');}
// 6 R108 칠한 노바(fx-eden-r108 pre, 그림 시트가 받아졌을 때 R106 대신 그림)도 같은 볼트를 'pixel' 로 그렸다 → 네온이면 같은 스파크 API 를 부름
{const o=load();ok(typeof o.api.neonSpark==='function','R106 API 에 neonSpark 공개');
 const eden=fs.readFileSync(path.join(R,'client-source','fx-eden-r108.js'),'utf8');const novaAt=eden.indexOf("R343: 영웅 노바는");const seg=eden.slice(novaAt,eden.indexOf('return true;}',novaAt));
 ok(novaAt>0&&/e\.hero===['"]neon['"]/.test(seg)&&/neonSpark/.test(seg),'R108 노바 볼트: 네온이면 neonSpark',seg.slice(-260));
 ok(!/e\.hero===['"]neon['"][^;]*\?[^;]*neonSpark[^;]*\|\|[^;]*'pixel'/.test(seg),'스파크 실패 시 도트로 되돌아가는 꼴(|| pixel) 아님');
 const sp=[];const r=o.api.neonSpark(100,100,40,0,.5);ok(r===true,'neonSpark 그리면 true');ok(o.api.neonSpark(NaN,1,40,0,1)===false&&o.api.neonSpark(1,1,40,0,0)===false,'NaN·알파 0 은 그리지 않음');}
console.log('R1294 CPU',n,'checks passed');
