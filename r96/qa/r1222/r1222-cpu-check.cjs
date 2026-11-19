// R1222 CPU 검사 — 늪지대 '늪에서 되살아난 혼령체' 근접 공격 물 튐(R169 mob-coast = Dots 물 튐)을 늪색(먹 테두리 + 탁한 녹색)으로, swamp-splash-r1222.js
//  사용자 2026-11-19 10:12Z "늪지대 혼령체 공격시 물나오는거 녹색 색 넣어서 늪같아보이게"
const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..'),F='swamp-splash-r1222.js',KEY='mob-swamp-r1222',ASSET='assets/r163/pixelfx/r1222/mob-swamp-dots-12.webp';let n=0;
const ok=(c,m,d)=>{if(!c)console.log('FAIL '+m,d===undefined?'':JSON.stringify(d).slice(0,400));assert(c,m);n++;console.log('PASS '+m);};
const srcPath=path.join(R,'client-source',F);ok(fs.existsSync(srcPath),'오버레이 파일 있음');
const src=fs.readFileSync(srcPath,'utf8');
ok(src===fs.readFileSync(path.join(R,'runtime-text',F),'utf8'),'runtime-text 사본 같음');
// ---- 빌드 연결 ----
const html=fs.readFileSync(path.join(R,'runtime-text/index.html'),'utf8'),t=s=>html.indexOf('<script src="./'+s+'"></script>');
ok(t(F)>t('samong-pixel-art-r1177.js')&&t(F)<t('boot-lean-r1038.js')&&/\n<script src="\.\/swamp-splash-r1222\.js"><\/script>\n/.test(html),'index.html: 자기 줄, R1177 뒤·boot-lean 앞');
ok(fs.readFileSync(path.join(ROOT,'scripts/verify-r96-public.py'),'utf8').includes("'"+F+"'"),'verify-r96-public 기대 목록');
ok(fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r1222/r1222-cpu-check.cjs'),'pages.yml CPU 검사 줄');
const man=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');ok(man.includes('/'+F+'"')||man.includes('"'+F+'"'),'runtime-manifest 에 오버레이');ok(man.includes('r1222/mob-swamp-dots-12.webp'),'runtime-manifest 에 늪 시트');
// ---- 시트: 원래 물 튐과 같은 칸 배치, 늪색(녹색 우세) + 먹 테두리 ----
const sheet=path.join(R,'runtime-text',ASSET);ok(fs.existsSync(sheet),'늪 시트 있음');
const orig=path.join(R,'runtime-text/assets/r1177/mob-coast-dots-12.webp');ok(fs.existsSync(orig),'원래 물 튐 시트는 그대로 남음');
{const {execFileSync}=require('child_process');
 const j=JSON.parse(execFileSync('python3',['-I','-c',`
import json,sys
from PIL import Image
a=Image.open(sys.argv[1]).convert('RGBA');b=Image.open(sys.argv[2]).convert('RGBA')
px=list(a.getdata());op=[p for p in px if p[3]>160]
g=sum(1 for p in op if p[1]>=p[0] and p[1]>p[2]+8)/max(1,len(op))
blue=sum(1 for p in op if p[2]>p[1]+6 and p[2]>p[0]+6)/max(1,len(op))
ink=sum(1 for p in op if max(p[:3])<70)/max(1,len(op))
white=sum(1 for p in op if min(p[:3])>215)/max(1,len(op))
ab=sum(1 for p in b.getdata() if p[3]>16);aa=sum(1 for p in px if p[3]>16)
print(json.dumps({"size":a.size,"osize":b.size,"green":g,"blue":blue,"ink":ink,"white":white,"cover":aa/max(1,ab)}))`,sheet,orig]).toString());
 ok(j.size[0]===j.osize[0]&&j.size[1]===j.osize[1],'칸 배치 그대로(크기 같음)',j);
 ok(j.green>.7,'불투명 칸의 70% 넘게 녹색 우세(늪 물빛)',j);ok(j.blue<.03,'파란 물빛 거의 없음',j);
 ok(j.ink>.04&&j.ink<.45,'먹 테두리(어두운 칸) 있음, 너무 검지 않음',j);ok(j.white<.02,'흰 물보라 없음(늪 거품은 옅은 녹황)',j);
 ok(j.cover>=1&&j.cover<1.6,'모양은 원래 물 튐 + 얇은 먹 테두리만',j);}
// ---- 샌드박스 ----
function sandbox(opt={}){
 const plays=[],meta={'mob-coast':{file:'r1177/mob-coast.webp',frame:[175,105],pivot:[87,83],columns:4,frames:12,fps:12,loop:false,r1177d:'Dots D coast'},'mob-garden':{file:'mob-garden.webp',frame:[1,1],pivot:[0,0],columns:1,frames:1}};
 let tickBase=0;const sb={window:{},localStorage:{store:{},getItem(k){return this.store[k]??null;},setItem(k,v){this.store[k]=v;}},time:5,room:{id:'dist02',enemies:[]},zone:'dist02',started:true,
  tick(){tickBase++;},readyImage:p=>null,addImage:()=>{},ensureImages:()=>Promise.resolve(),console};
 sb.window.window=sb.window;
 const r1177route=opt.noR1177?null:(name,x,y,o)=>meta[name]?.r1177d&&o.tint?{name,o:{...o,tint:null}}:null;
 sb.window.__STORYWORLD_PIXELFX_R163__=Object.freeze({has:n=>!!meta[n],meta:()=>meta,warm:ns=>plays.push(['warm',...ns]),
  play(name,x,y,o={}){const R=sb.window.__STORYWORLD_SAMONG_PIXEL_ART_R1177__;if(R&&typeof R.route==='function'){const r=R.route(name,x,y,o);if(r&&typeof r.name==='string'){name=r.name;o=r.o||o;}}plays.push([name,o]);return {name};}});
 if(r1177route)sb.window.__STORYWORLD_SAMONG_PIXEL_ART_R1177__=Object.freeze({revision:'R1177',route:r1177route,mobHit:{},TOWER_KEY:'t'});
 if(opt.prefs)sb.localStorage.store['storyworld.r1222.swamp']=JSON.stringify(opt.prefs);
 vm.createContext(sb);vm.runInContext('var window=this.window;Object.assign(window,{localStorage:this.localStorage});',sb);
 vm.runInContext(src,sb,{filename:F});
 return {sb,plays,meta,X:sb.window.__STORYWORLD_PIXELFX_R163__,api:sb.window.__STORYWORLD_SWAMP_SPLASH_R1222__,tickN:()=>tickBase};}
// R169 가 부르는 그대로: e.x+cos(a)*r*.45*sc
const hitAt=(e,sc=1)=>{const a=e.attack.angle,r=Math.min(2.4,Math.max(.8,Number(e.attack.shape154?.range)||1.3));return [e.x+Math.cos(a)*r*.45*sc,e.y+Math.sin(a)*r*.45*sc];};
const mob=(name,x,y,o={})=>({name,x,y,hp:10,attack:{id:1,angle:.7,committed:true,shape154:{range:1.3}},...o});
{const {sb,plays,meta,X,api,tickN}=sandbox();
 ok(!!api&&api.revision.startsWith('R1222'),'전역 점검 객체');
 sb.tick();ok(tickN()===1,'tick 감싸도 원래 tick 그대로 한 번');
 ok(meta[KEY]&&meta[KEY].file==='r1222/mob-swamp-dots-12.webp'&&meta[KEY].frames===12&&meta[KEY].columns===4&&meta[KEY].frame.join()==='175,105'&&meta[KEY].pivot.join()==='87,83'&&meta[KEY].loop===false,'pixelfx 표에 늪 칸 추가(원래 물 튐과 같은 칸·기준점·12칸)',meta[KEY]);
 ok(meta['mob-coast'].file==='r1177/mob-coast.webp','원래 mob-coast 줄은 바꾸지 않음');
 const spirit=mob('늪에서 되살아난 혼령체',10,10),goat=mob('늪의 염소머리 악마',14,9),boss=mob('중간보스 · 늪에서 되살아난 혼령체',6,12,{midboss:true}),add=mob('늪에서 되살아난 혼령체 추격대',3,3);
 sb.room.enemies=[goat,spirit,boss,add];
 X.play('mob-coast',...hitAt(spirit),{k:1.3,rate:1.2,tint:{a:[1,2,3],b:[4,5,6]}});
 ok(plays.at(-1)[0]===KEY&&plays.at(-1)[1].tint===null&&plays.at(-1)[1].k===1.3&&plays.at(-1)[1].rate===1.2,'혼령체 타격 → 늪 칸, 물들임 없음, 크기·속도 그대로',plays.at(-1));
 X.play('mob-coast',...hitAt(goat),{k:1.3,tint:{a:[1,2,3],b:[4,5,6]}});ok(plays.at(-1)[0]==='mob-coast','같은 늪의 다른 몹(염소머리 악마)은 원래 물 튐 그대로',plays.at(-1));
 X.play('mob-coast',...hitAt(boss,1.6),{k:1.6,tint:null});ok(plays.at(-1)[0]===KEY,'중간보스 혼령체(sc 1.6)도 늪 칸',plays.at(-1));
 X.play('mob-coast',...hitAt(add),{k:1.3});ok(plays.at(-1)[0]===KEY,'추격대·증원 이름도 늪 칸');
 X.play('mob-garden',...hitAt(spirit),{k:1.3});ok(plays.at(-1)[0]==='mob-garden','다른 이펙트 이름은 손대지 않음');
 X.play('mob-coast',spirit.x+.3,spirit.y+.3,{k:1.3});ok(plays.at(-1)[0]==='mob-coast','혼령체 타격 자리가 아니면 그대로(경계)');
 spirit.attack.committed=false;X.play('mob-coast',...hitAt(spirit),{k:1.3});ok(plays.at(-1)[0]==='mob-coast','내려치기 전(committed 아님)이면 그대로');spirit.attack.committed=true;
 spirit.hp=0;X.play('mob-coast',...hitAt(spirit),{k:1.3});ok(plays.at(-1)[0]==='mob-coast','죽은 혼령체는 그대로');spirit.hp=10;
 const s2={...spirit,name:'늪 뿌리 추적자'};sb.room.enemies=[s2];X.play('mob-coast',...hitAt(s2),{k:1.3});ok(plays.at(-1)[0]==='mob-coast','같은 그림 다른 이름(늪 뿌리 추적자)은 그대로');
 sb.room.enemies=[spirit];spirit.attack.angle=NaN;X.play('mob-coast',NaN,NaN,{k:1.3});ok(plays.at(-1)[0]==='mob-coast'&&api.inspect().errors===0,'NaN 자리 → 오류 없이 그대로');spirit.attack.angle=.7;
 ok(api.inspect().swapped===3,'바꾼 횟수 셈',api.inspect());
 // 늪 칸 줄이 아직 없을 때(표가 늦게 옴) → 그대로
 delete meta[KEY];X.play('mob-coast',...hitAt(spirit),{k:1.3});ok(plays.at(-1)[0]==='mob-coast','표에 늪 칸이 없으면 그대로(빈 그림 금지)');sb.tick();ok(!!meta[KEY],'tick 에서 다시 추가');
 // 미리 받기: 혼령체가 있는 방에서 한 번
 ok(plays.some(p=>p[0]==='warm'&&p.includes(KEY)),'혼령체 있는 방에서 늪 칸 미리 받기');
 api.set({on:false});X.play('mob-coast',...hitAt(spirit),{k:1.3});ok(plays.at(-1)[0]==='mob-coast','끄기 storyworld.r1222.swamp {on:false}');}
{const {plays,X,sb}=sandbox({noR1177:true});sb.tick();const s=mob('늪에서 되살아난 혼령체',2,2);sb.room.enemies=[s];X.play('mob-coast',...hitAt(s),{k:1.3});ok(plays.at(-1)[0]==='mob-swamp-r1222','R1177 이 없어도(옛 빌드) 늪 칸으로');}
{const {plays,X,sb}=sandbox({prefs:{on:false}});sb.tick();const s=mob('늪에서 되살아난 혼령체',2,2);sb.room.enemies=[s];X.play('mob-coast',...hitAt(s),{k:1.3});ok(plays.at(-1)[0]==='mob-coast','저장된 끄기 값 따름');}
// 주황 금지(#712)
{const rgbs=[...src.matchAll(/rgba?\((\d+),\s*(\d+),\s*(\d+)/g)].map(m=>[+m[1],+m[2],+m[3]]);ok(!rgbs.some(([r,g,b])=>r>g+40&&g>b+20),'주황 색 없음');}
console.log('R1222 CPU 검사 '+n+'개 통과');
