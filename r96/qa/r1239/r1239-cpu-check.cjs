// R1239 CPU 검사 — 천사의 가면과 의목사 후보생(ep1a11) '수천 개의 얼굴' 가면 스킬 + 루시퍼 그림 일관성(masks-r1239.js)
//  사용자 2026-11-19 12:06Z "수천개의가면이 나와서 서사텍스트에 맞는 프레임애니메이션 이펙트 스킬을 루시퍼랑 보스가 사용하도록 연출 … 루시퍼보스 관련 전수조사해서 디버깅 특히 일관성과 이미지 출력부분"
const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..'),F='masks-r1239.js';let n=0;
const ok=(c,m,d)=>{if(!c)console.log('FAIL '+m,d===undefined?'':JSON.stringify(d).slice(0,400));assert(c,m);n++;console.log('PASS '+m);};
const src=fs.readFileSync(path.join(R,'client-source',F),'utf8');
ok(src===fs.readFileSync(path.join(R,'runtime-text',F),'utf8'),'runtime-text 사본 같음');
// ---- 빌드 연결 ----
const html=fs.readFileSync(path.join(R,'runtime-text/index.html'),'utf8'),t=s=>html.indexOf('<script src="./'+s+'"></script>');
ok(t(F)>0&&t(F)>t('bosses-r104.js')&&t(F)>t('boss-motion-r620.js')&&/\n<script src="\.\/masks-r1239\.js"><\/script>\n/.test(html),'index.html: 자기 줄, R104·R620 뒤');
ok(fs.readFileSync(path.join(ROOT,'scripts/verify-r96-public.py'),'utf8').includes("'"+F+"'"),'verify-r96-public 기대 목록');
ok(fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r1239/r1239-cpu-check.cjs'),'pages.yml CPU 검사 줄');
const man=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');ok(man.includes('/'+F+'"')||man.includes('"'+F+'"'),'runtime-manifest 에 들어감');
// ---- 그림(프레임 시트·루시퍼 2·3단계) — 있어야 하고 칸 크기가 맞아야 한다(PIL 없이 webp 머리만 읽음) ----
function webpSize(p){const b=fs.readFileSync(p);if(b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP')return null;const k=b.toString('ascii',12,16);
 if(k==='VP8X')return [1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];if(k==='VP8L'){const v=b.readUInt32LE(21);return [1+(v&0x3fff),1+((v>>14)&0x3fff)];}if(k==='VP8 ')return [b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];return null;}
const A=p=>path.join(R,'runtime-text',p);
const SHEETS={'assets/r1239/fx/mask-crack8.webp':8,'assets/r1239/fx/mask-swarm12.webp':12,'assets/r1239/fx/mask-burst10.webp':10,'assets/r1239/fx/mask-crack8-crimson.webp':8,'assets/r1239/fx/mask-swarm12-crimson.webp':12,'assets/r1239/fx/mask-burst10-crimson.webp':10};
for(const [p,nf] of Object.entries(SHEETS)){const s=fs.existsSync(A(p))&&webpSize(A(p));ok(s&&s[0]===256*nf&&s[1]===256&&src.includes(p),'가면 시트 '+p+' = 256칸 '+nf+'장, 코드가 씀',s);}
const DARK={'assets/r104/bosses/a11-boss-p1.webp':'assets/r1239/lucifer/a11-dark-p1.webp','assets/r104/bosses/a11-boss-p2.webp':'assets/r1239/lucifer/a11-dark-p2.webp','assets/r104/bosses/a11-boss-p3.webp':'assets/r1239/lucifer/a11-dark-p3.webp','assets/r104/bosses/a11-boss-p4.webp':'assets/r1239/lucifer/a11-dark-p4.webp','assets/r1147/bosses/a11-idle6.webp':'assets/r1239/lucifer/a11-dark-idle6.webp','assets/r1147/bosses/a11-hit4.webp':'assets/r1239/lucifer/a11-dark-hit4.webp'};
for(const [o,d] of Object.entries(DARK)){const so=webpSize(A(o)),sd=fs.existsSync(A(d))&&webpSize(A(d));ok(so&&sd&&so[0]===sd[0]&&so[1]===sd[1],'2·3단계 그림 '+d+' 크기 = 원본 '+o,[so,sd]);}
// ---- R104: 루시퍼는 모든 단계(0·1·2)에서 열쇠 자세 그림을 쓴다(옛 actors-normalized 저화질 회색 그림 금지) ----
{const r104=fs.readFileSync(path.join(R,'client-source/bosses-r104.js'),'utf8');const m=/'a11-boss':\[([0-9,]*)\]/.exec(r104);ok(m&&m[1]==='0,1,2','R104 PHASES a11-boss = [0,1,2]',m&&m[1]);
 ok(r104===fs.readFileSync(path.join(R,'runtime-text/bosses-r104.js'),'utf8'),'R104 runtime-text 사본 같음');}
// 주황 예고 금지(#712)
{const hexes=[...src.matchAll(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)].map(m=>m[1]),rgbs=[...src.matchAll(/rgba?\((\d+),\s*(\d+),\s*(\d+)/g)].map(m=>[+m[1],+m[2],+m[3]]);
 const toRgb=h=>h.length===3?[...h].map(c=>parseInt(c+c,16)):[0,2,4].map(i=>parseInt(h.slice(i,i+2),16));
 const hue=([r,g,b])=>{const M=Math.max(r,g,b),m=Math.min(r,g,b);if(M-m<40)return null;let h=M===r?((g-b)/(M-m))%6:M===g?(b-r)/(M-m)+2:(r-g)/(M-m)+4;return (h*60+360)%360;};
 ok([...hexes.map(toRgb),...rgbs].filter(c=>{const h=hue(c);return h!==null&&h>=15&&h<=55;}).length===0,'주황·노랑 색 없음');}
ok(!/drop-shadow|blur\(/.test(src),'게임 ctx.filter 에 drop-shadow·blur 안 씀(Three.js Legacy 검게 됨)');
// ---- 샌드박스 ----
function sandbox(o={}){
 const calls={hurt:[],imgs:[],add:[]};
 const ctx=new Proxy({commands:[]},{get:(t,k)=>k in t?t[k]:(typeof k==='string'&&!['globalAlpha','lineWidth','strokeStyle','fillStyle','globalCompositeOperation','filter'].includes(k)?((...a)=>{if(k==='drawImage')calls.imgs.push(a[0]&&a[0].src);}):undefined),set:(t,k,v)=>{t[k]=v;return true;}});
 const player={x:10,y:10,hp:100,maxHp:100,invincible:0};
 const sb={window:{},localStorage:{store:{},getItem(k){return this.store[k]??null;},setItem(k,v){this.store[k]=v;}},time:0,started:true,loading:false,modal:false,storyScene:null,player,ctx,room:{id:'ep1a11',enemies:[]},effects:[],W:960,H:540,TILE:32,zoom:1,
  project:(x,y)=>({x:(x-y)*32+480,y:(x+y)*16}),actorHeight:()=>60,readyImage:p=>({image:{src:'http://h/m0/'+p,width:3072,height:256,naturalWidth:3072,naturalHeight:256}}),addImage:p=>calls.add.push(p),
  clearLine:()=>true,hurt:(d,s)=>{calls.hurt.push([d,s]);return 'hit';},drawEffect(){},drawEnemy(e){},tick(dt){},setTimeout:(f)=>f(),Math,JSON,String,Object,Number,Array,Set,Map,WeakMap,WeakSet,Promise,console,...o};
 sb.window.window=sb.window;vm.createContext(sb);vm.runInContext(src,sb);return {sb,calls,player,M:sb.window.__STORYWORLD_MASKS_R1239__};
}
const boss=(id,o={})=>({id:'e'+Math.random(),nativeId:id,name:id==='a11-boss'?'루시퍼 · 가면 벗은 초천사':'초천사의 웃는 가면',boss:id==='a11-boss',midboss:id!=='a11-boss',hp:1000,maxHp:1000,damage:40,spawnState:'active',x:13,y:10,phase:0,...o});
function step(S,sec,dt=1/30){for(let i=0;i<Math.round(sec/dt);i++){S.sb.time+=dt;S.sb.tick(dt);}}
{const {M}=sandbox();ok(!!M&&typeof M.hits==='function'&&typeof M.fixScale==='function'&&typeof M.darkFor==='function','API window.__STORYWORLD_MASKS_R1239__');
 ok(M.casters.includes('a11-boss')&&M.casters.includes('mb-ep1a11'),'시전자 = 루시퍼(a11-boss)·초천사의 웃는 가면(mb-ep1a11)');
 const u=M.tune;ok(u.windup>=.9&&u.windup<=1.6,'예고 0.9~1.6초(보고 피할 시간)',u.windup);ok(u.dmgK>0&&u.dmgK<=1,'피해 ≤ 보스 근접 1대',u.dmgK);ok(u.cd>=10,'쿨다운 10초 이상',u.cd);
 ok(u.ring*u.perSheet+u.crowd*u.perSheet>=1000,'화면에 가면 1,000개 이상(고리+군중 시트 × 시트당 가면 수)',[u.ring,u.crowd,u.perSheet]);
 // 판정(순수)
 ok(M.hits(10,10,1.2,10.5,10.5)&&!M.hits(10,10,1.2,11.5,10)&&M.hits(10,10,1.2,11.2,10)&&!M.hits(10,10,1.2,NaN,10),'hits: 원 안/밖/경계/NaN');
 // 2·3단계 그림 고르기
 ok(M.darkFor('http://x/m0/assets/r104/bosses/a11-boss-p2.webp',1)==='assets/r1239/lucifer/a11-dark-p2.webp','darkFor: 1단계(가면 균열) p2 → 검게 물든 p2');
 ok(M.darkFor('assets/r1147/bosses/a11-idle6.webp',2)==='assets/r1239/lucifer/a11-dark-idle6.webp','darkFor: 3단계 대기 시트');
 ok(M.darkFor('assets/r104/bosses/a11-boss-p2.webp',0)===null&&M.darkFor('assets/r104/bosses/mb-ep1a11-p1.webp',2)===null,'darkFor: 0단계·다른 보스는 그대로');
 // 크기 고정: 같은 엔진 높이 H 에서 칸 높이 400 기준으로 그린 명령(옛 칸 337.5 기준보다 15.6% 작음)을 키우고, 발(피벗)은 제자리
 const H=104.5,sr=[0,0,466,432],piv=[231,413];const mk=s=>[[100,100],[100+466*s,100],[100+466*s,100+432*s],[100,100+432*s]];
 const small=mk(H/400),big=mk(H/337.5);
 const a=M.fixScale(small,sr,piv,H),b=M.fixScale(big,sr,piv,H);
 const hgt=P=>P[3][1]-P[0][1],foot=(P)=>[P[0][0]+(P[1][0]-P[0][0])*231/466,P[0][1]+(P[3][1]-P[0][1])*413/432];
 ok(Math.abs(hgt(a)-hgt(big))<.5&&Math.abs(hgt(b)-hgt(big))<.5,'fixScale: 400 기준 → 337.5 기준 높이로, 이미 맞는 건 그대로',[hgt(a),hgt(b),hgt(big)]);
 ok(Math.abs(foot(a)[0]-foot(small)[0])<.3&&Math.abs(foot(a)[1]-foot(small)[1])<.3,'fixScale: 발 자리 고정',[foot(a),foot(small)]);
 const enr=M.fixScale(mk(H*1.06/400),sr,piv,H);ok(Math.abs(hgt(enr)-432*H*1.06/337.5)<.6,'fixScale: 광폭화(+6%)는 비율로 남김',hgt(enr));
 const flipped=[[100+466*H/400,100],[100,100],[100,100+432*H/400],[100+466*H/400,100+432*H/400]],fa=M.fixScale(flipped,sr,piv,H);ok(fa[0][0]>fa[1][0]&&Math.abs(hgt(fa)-hgt(big))<.5,'fixScale: 좌우 뒤집힌 명령도',fa);
 const crop=[4.85,12.1,451.4,401.7],cq=[[100,100],[100+451.4*H/400,100],[100+451.4*H/400,100+401.7*H/400],[100,100+401.7*H/400]],cf=M.fixScale(cq,crop,piv,H);ok(Math.abs(hgt(cf)-401.7*H/337.5)<.6,'fixScale: 잘린 칸도 같은 픽셀 배율',hgt(cf));
 {const pad=[.1609,.081,.1609,.0995],B=small,ux=B[1][0]-B[0][0],vy=B[3][1]-B[0][1],[l,t2,r,b2]=pad;const FQ=[[B[0][0]-ux*l,B[0][1]-vy*t2],[B[1][0]+ux*r,B[1][1]-vy*t2],[B[2][0]+ux*r,B[2][1]+vy*b2],[B[3][0]-ux*l,B[3][1]+vy*b2]];
  const ff=M.fixFloat(FQ,pad,H),inH=(ff[3][1]-ff[0][1])/(1+t2+b2),fy=ff[0][1]+(ff[3][1]-ff[0][1])*(t2+413/432)/(1+t2+b2);ok(Math.abs(inH-hgt(big))<.6&&Math.abs(fy-foot(small)[1])<.4,'fixFloat: 떠서 이동 시트(R1029)도 같은 몸 배율·발 자리',[inH,hgt(big),fy,foot(small)[1]]);
  ok(M.fixFloat(FQ,null,H)===null,'fixFloat: pad 없으면 손대지 않음');}
 ok(M.fixScale([[0,0],[1,0],[1,NaN],[0,1]],sr,piv,H)===null&&M.fixScale(small,sr,piv,0)===null,'fixScale: NaN·0 높이는 손대지 않음(null)');}
// ---- 스킬 흐름 ----
{const S=sandbox();const e=boss('a11-boss');S.sb.room.enemies.push(e);step(S,1);ok(!e.r1239?.mode,'만나자마자는 안 씀(첫 지연)');
 let w=0;for(let i=0;i<30*12&&e.r1239?.mode!=='windup';i++)step(S,1/30);ok(e.r1239?.mode==='windup','첫 지연 뒤 예고 시작');
 const aim={...e.r1239.aim};ok(Math.abs(aim.x-10)<.01&&Math.abs(aim.y-10)<.01,'예고 = 그 순간 영웅 자리');
 step(S,S.M.tune.windup+S.M.tune.converge+.05);ok(S.calls.hurt.length===1&&S.calls.hurt[0][0]===40*S.M.tune.dmgK&&S.calls.hurt[0][1]?.r1239===true,'가만히 있으면 한 번 맞음(피해 = e.damage×dmgK, 출처 표지)',S.calls.hurt);
 step(S,3);ok(S.calls.hurt.length===1,'한 번 시전에 한 번만');}
{const S=sandbox();const e=boss('mb-ep1a11');S.sb.room.enemies.push(e);for(let i=0;i<30*12&&e.r1239?.mode!=='windup';i++)step(S,1/30);ok(e.r1239?.mode==='windup','중간보스 가면도 씀');
 S.player.x=14;S.player.y=14;step(S,S.M.tune.windup+S.M.tune.converge+.1);ok(S.calls.hurt.length===0,'예고 보고 비키면 안 맞음');}
{const S=sandbox();const e=boss('a11-boss',{hp:0});const f=boss('b02-boss');f.nativeId='b02-boss';S.sb.room.enemies.push(e,f);step(S,15);ok(!e.r1239?.mode&&!f.r1239&&S.calls.hurt.length===0,'죽은 루시퍼·다른 보스는 안 씀');}
{const S=sandbox();const e=boss('a11-boss',{spawnState:'hidden'});S.sb.room.enemies.push(e);step(S,15);ok(!e.r1239?.count,'숨은(아직 안 나온) 보스는 안 씀');}
{const S=sandbox();const e=boss('a11-boss');S.sb.room.enemies.push(e);S.player.x=30;step(S,15);ok(!e.r1239?.count,'멀리(12칸 밖) 있으면 안 씀');}
{const S=sandbox();const e=boss('a11-boss');S.sb.room.enemies.push(e);step(S,40);const c=e.r1239.count,u=S.M.tune;ok(c>=2&&c<=Math.floor(40/(u.cd))+1,'40초 시전 수 쿨다운 지킴',c);}
{const S=sandbox();const e=boss('a11-boss');S.sb.room.enemies.push(e);for(let i=0;i<30*12&&e.r1239?.mode!=='windup';i++)step(S,1/30);S.sb.storyScene={};step(S,3);ok(S.calls.hurt.length===0,'이야기 장면 중엔 멈춤');}
{const S=sandbox();S.sb.localStorage.store['storyworld.r1239.masks']='{"on":false}';const S2=sandbox({localStorage:S.sb.localStorage});const e=boss('a11-boss');S2.sb.room.enemies.push(e);step(S2,15);ok(!e.r1239?.count,'끄기 설정 지킴');}
// 그리기: 시전 중엔 시트를 실제로 그린다(가면 무리·갈라짐), 루시퍼는 핏빛판
{const S=sandbox();const e=boss('a11-boss');S.sb.room.enemies.push(e);for(let i=0;i<30*12&&e.r1239?.mode!=='windup';i++)step(S,1/30);step(S,.3);
 S.calls.imgs.length=0;S.sb.drawEffect({type:'r1239-fx'});ok(S.calls.imgs.some(s=>/mask-swarm12-crimson/.test(s))&&S.calls.imgs.some(s=>/mask-crack8-crimson/.test(s)),'루시퍼 예고: 핏빛 가면 무리·갈라짐 시트',[...new Set(S.calls.imgs)]);
 ok(S.calls.imgs.filter(s=>/swarm/.test(s)).length>=S.M.tune.ring,'고리 시트 수 ≥ ring',S.calls.imgs.length);}
{const S=sandbox();const e=boss('mb-ep1a11');S.sb.room.enemies.push(e);for(let i=0;i<30*12&&e.r1239?.mode!=='windup';i++)step(S,1/30);step(S,S.M.tune.windup+S.M.tune.converge+.1);
 S.calls.imgs.length=0;S.sb.drawEffect({type:'r1239-fx'});ok(S.calls.imgs.some(s=>/mask-burst10\.webp/.test(s)),'가면 중간보스 터짐: 상아판 시트',[...new Set(S.calls.imgs)]);}
// 그림을 아직 못 읽었으면 부른다(로딩 중엔 안 부름)
{const S=sandbox({readyImage:()=>null});S.sb.room.enemies.push(boss('a11-boss'));step(S,.5);ok(S.calls.add.some(p=>/r1239\/fx\/mask-swarm12-crimson/.test(p))&&S.calls.add.some(p=>/r1239\/lucifer\/a11-dark-p4/.test(p)),'ep1a11 에서 시트·2단계 그림 미리 부름',S.calls.add);}
console.log('R1239 CPU '+n+'/'+n+' PASS');
