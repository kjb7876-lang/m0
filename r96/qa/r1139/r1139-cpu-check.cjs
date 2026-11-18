'use strict';
// R1139 EGO 각성 영웅 공격·이펙트 전수 조사에서 나온 네 가지 — CPU 검사(사용자 2026-11-18 03:20Z "ego각성영웅 공격모션 및 이펙트 전수조사 디버깅및 개선").
//  ① 페르소나 탄(R1094 협주 기술)이 화면에서 8~15px 로 그려져 거의 안 보였다 → 탄 그림 크기만 키운다(판정 반지름·피해·속도는 그대로).
//  ② 삼협묵희 분신마다 영웅 오라(바닥 고리·보호막·기운)가 먹 필터로 다시 그려져 흰 원반·검은 얼룩이 됐다 → 분신 몫 오라는 그리지 않는다(몸·광륜은 남김).
//  ③ EGO 형상인데 환도 고유색(은·금) 절차 이펙트가 그대로 나왔다 → 금은 언주색, 은은 흰색으로(EGO 고유색 = 언주+먹+흰).
//  ④ 협주 기술 이름 글자가 같은 자리에 겹쳐 읽을 수 없었다 → 잇달아 뜨면 위로 한 줄씩.
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m,d)=>{n++;if(!c){bad++;console.log('FAIL',m,d!==undefined?JSON.stringify(d).slice(0,300):'');}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const N='ego-polish-r1139.js',SRC=rd(path.join(R,'client-source',N));
ok(SRC.length>0,N+' 있음');
ok(SRC.length>0&&rd(path.join(R,'runtime-text',N))===SRC,N+' runtime-text 사본 = client-source');
{const html=rd(path.join(R,'runtime-text','index.html'));ok(html.includes('<script src="./ego-kit-r1094.js"></script>\n<script src="./ego-guard-r1100.js"></script>\n<script src="./ego-polish-r1139.js"></script>'),'태그: ego-guard-r1100 바로 뒤');}
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r1139/r1139-cpu-check.cjs'),'pages.yml CPU 검사 줄');
ok(/'ego-polish-r1139\.js'/.test(rd(path.join(ROOT,'scripts','verify-r96-public.py'))),'공개 확인 목록');
ok(!/\btick\s*=\s*function|\bsaveGame\s*=\s*function/.test(SRC)&&/__STORYWORLD_POST_HOOKS__\.register\(/.test(SRC),'tick 은 직접 감싸지 않고 POST_HOOKS.register 로');
function boot(opt={}){const iv=[];const hooks={};const floats=[];
 const sb={console,JSON,Object,Array,Number,String,Math,Set,Map,WeakMap,Date,RegExp,isFinite,setInterval:f=>{iv.push(f);return iv.length;},setTimeout:f=>{iv.push(f);return 0;},localStorage:{getItem:()=>opt.off?'{"on":false}':null,setItem(){}},
  document:{readyState:'complete'},addEventListener(){}};sb.window=sb;vm.createContext(sb);sb.__floats=floats;
 vm.runInContext(`var time=10,projectiles=[];var player={hero:'hwando',x:0,y:0,hp:100};
  function floatText(t,x,y,c){__floats.push({t,x,y,c});}
  window.__STORYWORLD_POST_HOOKS__={register(mark,h){window.__hooks=window.__hooks||{};window.__hooks[mark]=h;}};
  window.__STORYWORLD_EGO_SOVEREIGN_R1046__={formActive:()=>${opt.form!==false},inspect:()=>({rc151:${!!opt.rc151}})};
  window.__STORYWORLD_EGO_KIT_R1094__={SKILL:{lance:{key:'lance',name:'악의의 관통'},eclipse:{key:'eclipse',name:'욕망의 일식'},orb:{key:'small-orb',name:'욕망의 씨앗'}}};`,sb);
 if(SRC)vm.runInContext(SRC,sb,{filename:N});return{sb,iv,floats,A:sb.__STORYWORLD_EGO_POLISH_R1139__,run:c=>vm.runInContext(c,sb)};}
const B=boot(),A=B.A;
ok(!!A&&/^R1139/.test(String(A?.revision)),'API 열림(__STORYWORLD_EGO_POLISH_R1139__)');
if(A){
 // ① 탄 크기
 const keys=['lance','small-orb','star','vortex','eye','eclipse','diamond','clock','shield'];
 ok(keys.every(k=>A.shotScale(k)>=1.8&&A.shotScale(k)<=3.2),'탄 9종 그림 배율 1.8~3.2',keys.map(k=>A.shotScale(k)));
 ok(A.shotScale('nope')===1&&A.shotScale(undefined)===1&&A.shotScale(NaN)===1,'모르는 탄은 그대로(1)');
 B.run(`projectiles.push({id:1,egoKitR1094:'lance',scale:.7,radius:.2,damage:5,vx:3,vy:0,friendly:true},{id:2,egoKitR1094:'eclipse',scale:1.2,radius:.3,damage:9,friendly:true},{id:3,scale:1,radius:.14,friendly:true},{id:4,scale:1.4,radius:.2,friendly:false,rc142Persona5:true},{id:5,egoKitR1094:'eye',scale:NaN,radius:.2});`);
 const g1=A.growShots(B.sb.projectiles),P=B.sb.projectiles;
 ok(g1===2&&Math.abs(P[0].scale-.7*A.shotScale('lance'))<1e-9&&Math.abs(P[1].scale-1.2*A.shotScale('eclipse'))<1e-9,'협주 탄만 커짐',P.map(s=>s.scale));
 ok(P[0].radius===.2&&P[1].radius===.3&&P[0].damage===5&&P[0].vx===3,'판정 반지름·피해·속도 그대로');
 ok(P[2].scale===1&&P[3].scale===1.4,'다른 아군 탄·보스 탄은 그대로');
 ok(Number.isNaN(P[4].scale)||P[4].scale===1,'유한하지 않은 크기는 건드리지 않음(NaN 번짐 없음)',P[4].scale);
 ok(A.growShots(B.sb.projectiles)===0&&Math.abs(P[0].scale-.7*A.shotScale('lance'))<1e-9,'두 번 돌려도 한 번만 커짐(회귀: 매 프레임 곱해져 화면을 덮는 일 없음)');
 ok(A.growShots(null)===0&&A.growShots([null,undefined,3])===0,'빈 입력 안전');
 // 화면 크기 상한: 엔진 drawProjectile 은 18*scale*zoom, 상한 min(W,H)*.2/√2 — 720p 에서 일식도 상한 안
 ok(18*1.2*A.shotScale('eclipse')<=720*.2/Math.SQRT2,'일식 탄 720p 화면 상한 안',18*1.2*A.shotScale('eclipse'));
 // 형상이 아니면 아무것도 안 함
 {const C=boot({form:false});C.run(`projectiles.push({egoKitR1094:'lance',scale:.7});`);C.sb.__hooks&&Object.values(C.sb.__hooks).forEach(h=>h.tick&&h.tick());ok(C.sb.projectiles[0].scale===.7,'EGO 형상 아님: tick 에서 탄 그대로');}
 {const C=boot();C.run(`projectiles.push({egoKitR1094:'lance',scale:.7});`);Object.values(C.sb.__hooks||{}).forEach(h=>h.tick&&h.tick());ok(C.sb.projectiles[0].scale>.7,'EGO 형상: tick 훅이 탄을 키움');}
 {const C=boot({off:true});C.run(`projectiles.push({egoKitR1094:'lance',scale:.7});`);Object.values(C.sb.__hooks||{}).forEach(h=>h.tick&&h.tick());ok(C.sb.projectiles[0].scale===.7,'끄기 설정: 그대로');}
 // ② 분신 오라
 const INK1='grayscale(1) brightness(0.1)',INK2='grayscale(1) contrast(1.5) brightness(0.92)';
 ok(A.isCloneInk(INK1)&&A.isCloneInk(INK2)&&A.isCloneInk(INK2+' saturate(.65) brightness(.93)')&&!A.isCloneInk('none')&&!A.isCloneInk('saturate(.9) contrast(1.06) brightness(.96)')&&!A.isCloneInk(undefined)&&!A.isCloneInk('grayscale(1)'),'분신 먹 필터 판별');
 ok(['assets/r100/sig-aura-red.webp','assets/r100/sig-aura-pale.webp','assets/r100/sig-gather-pale.webp','assets/r1027/barrier.webp','assets/r1041/fx-c4-ground-ring.webp','assets/auras-r62/resonance-petals.webp','assets/auras-r62/ego-halo.webp','r106fx:glow:214.222.234:255.198.72','r106fx:flame:255.198.72:214.222.234','r106fx:orb:214.222.234:255.198.72'].every(A.isAura),'오라 그림 판별');
 ok(!['assets/r1048/ego/idle-e.webp','assets/r1116/ego-ink/attack-e.webp','assets/r1048/fx/ego_halo.webp','blob:http://x/1','assets/rc134/persona-skills/eye.png','r106fx:slashline:255.198.72:214.222.234','',null].some(A.isAura),'몸·광륜·탄·베기 선은 오라 아님');
 const mk=(sp,filter,a=1,kind='image')=>({kind,sourcePath:sp,style:{globalAlpha:a,filter}});
 const cmds=[mk('assets/r100/sig-aura-red.webp',INK1),mk('assets/r100/sig-aura-red.webp',INK2),mk('assets/r1048/ego/idle-e.webp',INK1),mk('assets/r1048/fx/ego_halo.webp',INK2),mk('assets/r1048/fx/ego_halo.webp',INK1),mk('assets/r100/sig-aura-red.webp','none'),mk('assets/r1027/barrier.webp',INK2,.5),mk('assets/r1027/barrier.webp',INK2,1,'path'),null];
 const h=A.cleanClones(cmds);
 ok(h===4&&cmds[0].style.globalAlpha===0&&cmds[1].style.globalAlpha===0&&cmds[6].style.globalAlpha===0,'분신 몫 오라(먹 그림자·흰 겹) 숨김',[h,cmds.map(c=>c&&c.style.globalAlpha)]);
 ok(cmds[2].style.globalAlpha===1&&cmds[3].style.globalAlpha===1,'분신 몸·광륜 흰 겹은 남김');
 ok(cmds[4].style.globalAlpha===0,'분신 광륜의 먹 그림자 겹은 숨김(검은 고리)');
 ok(cmds[5].style.globalAlpha===1&&cmds[5].style.filter==='none','영웅 본체 오라는 그대로');
 ok(cmds[7].style.globalAlpha===1,'그림 아닌 명령은 그대로');
 ok(A.cleanClones(cmds)===0,'다시 돌려도 더 안 바뀜');
 ok(A.cleanClones(null)===0,'빈 입력 안전');
 // ③ 색
 ok(A.isHwandoFx('r106fx:glow:214.222.234:255.198.72')&&A.isHwandoFx('r106fx:slashline:255.198.72:214.222.234')&&!A.isHwandoFx('r106fx:smoke:118.100.82:176.158.128')&&!A.isHwandoFx('r106fx:ring:100.27.37:160.40.52')&&!A.isHwandoFx('assets/r100/sig-aura-red.webp')&&!A.isHwandoFx(null),'환도 은·금 절차 이펙트 판별');
 const hue=([r,g,b])=>{const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;if(!d)return -1;let hh=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;hh*=60;return hh<0?hh+360:hh;};
 const gold=A.recolor(255,198,72),silver=A.recolor(214,222,234),dim=A.recolor(128,99,36),black=A.recolor(0,0,0),white=A.recolor(255,255,255);
 ok(gold.every(Number.isFinite)&&(hue(gold)<=16||hue(gold)>=350)&&gold[0]>=170&&gold[1]<=90&&gold[2]<=80,'금 → 언주색(붉은 주홍, 색상 350~16도)',[gold,hue(gold)]);
 ok(Math.max(...silver)-Math.min(...silver)<=26&&silver[0]>=silver[2]&&Math.min(...silver)>=190,'은 → 따뜻한 흰색(푸른 기 없음)',silver);
 ok((hue(dim)<=16||hue(dim)>=350)&&dim[0]<gold[0],'어두운 금 → 어두운 언주(명도 차례 유지)',dim);
 ok(black.every(v=>v===0)&&white.every(v=>v>=220),'검정은 검정 · 흰색은 흰색',[black,white]);
 ok(A.recolor(NaN,1,2).every(Number.isFinite)&&A.recolor(-5,300,2).every(v=>v>=0&&v<=255),'이상한 입력도 0~255 유한값');
 // ④ 글자
 ok(A.textLift(0)===0&&A.textLift(1)>0&&A.textLift(2)>A.textLift(1)&&A.textLift(99)===A.textLift(3)&&A.textLift(NaN)===0&&A.textLift(-1)===0,'글자 올림: 0번째 0, 차례로 위로, 3줄 상한');
 B.run(`time=20;floatText('악의의 관통',1,2,'#e8b7c0');floatText('욕망의 일식',1,2,'#e8b7c0');floatText('123',1,2,'#fff');time=20.2;floatText('욕망의 씨앗',1,2,'#e8b7c0');time=22;floatText('악의의 관통',1,2,'#e8b7c0');`);
 const f=B.floats;
 ok(f.length===5&&f[0].y===2&&f[1].y<2&&f[2].y===2&&f[3].y<f[1].y&&f[4].y===2,'협주 기술 이름: 잇달아 뜨면 위로, 숫자는 그대로, 시간 지나면 처음 자리',f.map(q=>q.y));
 ok(f.every(q=>q.x===1)&&f[1].t==='욕망의 일식','글자 내용·가로 자리 그대로');
 {const C=boot({form:false});C.run(`floatText('악의의 관통',1,2,'#e8b7c0');floatText('욕망의 일식',1,2,'#e8b7c0');`);ok(C.floats[1].y===2,'EGO 형상 아님: 글자 그대로');}
 const I=A.inspect();ok(I&&I.stats&&I.stats.errors===0&&I.lastError==null,'오류 0',I);
}
console.log(`\nR1139 cpu: ${n-bad}/${n} 통과`);process.exit(bad?1:0);
