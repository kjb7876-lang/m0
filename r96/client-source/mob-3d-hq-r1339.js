// R1339 고품질 3D 몹·보스(사용자 2026-11-26 "나머지 3d몹도 다 그런식으로해줘 특히 보스몹", "리깅도하고 알아서 고품질로 만들어서 적용해줘",
//  "자산최대한 고품질로 어색함없게").
//  · 만드는 길: 2D 원화 → (정면 서 있는 자세로 다시 그림, FLUX.1 Kontext) → TRELLIS.2(허깅페이스, 사용자 PRO 계정) 고해상도 메시·텍스처
//    → 블렌더에서 옛 모델과 겹치게 맞춤(4방향 시작 + ICP: 방향·크기·위치) → 옛 모델 뼈대의 가중치를 새 메시로 옮김(가장 가까운 면 보간, 뼈 4개 한도)
//    → 옛 뼈대·클립(Idle·Walk·Attack…)을 그대로 씀 → 금속광 줄이기·면 수 줄이기·텍스처 1024 webp.
//  · 게임에서: 각 3D 오버레이(R1312·R1315·R1316·R1317·R1322·R1322c·R1329·R1330)는 fetch(KINDS[id].glb) 로 모델을 읽는다.
//    여기서 그 요청만 새 파일(assets/r1339/…)로 바꾼다 → 크기·위치·동작 고르기·색 맞춤·먹 윤곽·2D/3D 지역 규칙은 각 오버레이 그대로.
//    옛 GLB 는 지우지 않는다(원본 보존, 끄면 그대로 돌아감).
//  · 켜고 끄기: 설정 '고품질 3D 몹(R1339)', localStorage storyworld.r1339.hq('on'|'off'), 주소 ?hq39=1·0. 기본 켜짐. 바꾼 뒤 새로 고침해야 적용(모델은 처음 한 번만 읽음).
//  · 미검증: GPU 실기기·모바일 프레임·실제 플레이(헤드리스 소프트웨어 렌더만).
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_MOB3D_HQ_R1339__)return;
const REV='R1339-hq-8',KEY='storyworld.r1339.hq';
// 옛 경로 → 새 경로. 생성·리깅 검수를 통과한 것만 넣는다.
// hq5(R1354, 11-27): HF 메시를 Dots 가 새 뼈대·동작으로 리깅한 판(늘어남 slab 0~0.14%). 호텔 회장·검은 소화액도 이 판으로 다시 넣음.
//  대수문장05·통제자는 Dots 판의 Walk 를 옛 이름 Float 로 바꿔 넣음(R1322c 가 Walk||Float 로 고르므로 동작 같음).
// hq6(R1382, 11-27): HF(TRELLIS.2) 새 메시 + Dots SW-R1354B 리깅 — 탐식 베엘제붑(R1315)·레비아탄(R1343)·주사기 환영체(R1322c).
//  옛 로더가 고르는 클립 이름에 맞춤: 베엘제붑 Attack_Special→Special_DevourMaw(Cast 뺌), 레비아탄 소문자(Attack_Special 뺌, cast 유지), 주사기 Walk→Float.
//  hq7: 호텔 그룹 회장(ep1b08)은 HF+Dots hq5 의 걷기·공격 회전 폭이 옛 모델의 1/3(걷기 17° / 53°, 공격 32° / 83°)이라
//       옆 걷기·공격이 서 있는 자세처럼 보임 → 사용자가 11-26 고른 옛 Dots 3D(B)로 되돌림. Dots 가 동작을 키운 판을 주면 다시 넣는다(SW-R1354E).
//  hq8: Dots SW-R1354E r2(동작 폭 키운 판) — 세이렌 모르·통제자·서윤·사이보그 회장을 -hq8 로(hq5 파일은 보존).
//       공격 최대 회전 22→92°·36→112°·28→111°·18→85°, 늘어남 검사 통과. 통제자는 Walk→Float(옛 클립 이름).
//       대수문장05 r2 는 몸 전체가 구르듯 기울어(7분야 7.41) hq5 유지.
//  중독의 폐허핵(#17)은 HF 모양이 2D 원화(붉은 눈을 품은 도시 구체)와 달리 납작한 검은 빌딩 벽이라 옛 Dots 모델 유지(넣지 않음).
//  분노의 귀·루시퍼·나태 남자는 옛 3D 가 없어 R1382 오버레이가 맡는다.
const MAP=Object.freeze({
 'assets/r1322/boss-u203-gate-frame-3d.glb':'assets/r1339/boss-u203-gate-frame-hq5.glb',
 'assets/r1322c/boss-cult05-id-cultivation-manager-3d.glb':'assets/r1339/boss-cult05-id-cultivation-manager-hq5.glb',
 'assets/r1322c/boss-ep1b05-seoyun-3d.glb':'assets/r1339/boss-ep1b05-seoyun-hq8.glb',
 'assets/r1322c/boss-ep1b09-cyborg-chairman-3d.glb':'assets/r1339/boss-ep1b09-cyborg-chairman-hq8.glb',
 'assets/r1322c/boss-kair03-siren-mor-3d.glb':'assets/r1339/boss-kair03-siren-mor-hq8.glb',
 'assets/r1322c/boss-kair08-great-gatekeeper-05-3d.glb':'assets/r1339/boss-kair08-great-gatekeeper-05-hq5.glb',
 'assets/r1322c/boss-u203-controller-3d.glb':'assets/r1339/boss-u203-controller-hq8.glb',
 'assets/r1330/sw-sin7-05-living-giant-stomach.glb':'assets/r1339/sw-sin7-05-living-giant-stomach-hq5.glb',
 'assets/r1330/sw-sin7-06-black-digestive-fluid.glb':'assets/r1339/sw-sin7-06-black-digestive-fluid-hq5.glb',
 'assets/r1315/boss-gluttony-demon-3d.glb':'assets/r1339/boss-gluttony-demon-hq5.glb',
 'assets/r1343/leviathan.glb':'assets/r1339/leviathan-hq5.glb',
 'assets/r1322c/boss-ep1a09-syringe-apparition-3d.glb':'assets/r1339/boss-ep1a09-syringe-apparition-hq5.glb'
});
let on=true;
try{if(window.localStorage.getItem(KEY)==='off')on=false;}catch(_){}
try{const m=/[?&]hq39=([01])\b/.exec(window.location.search||'');if(m)on=m[1]==='1';}catch(_){}
const stats={swapped:0,passed:0};const seen=[];
function rel(u){let s=String(u||'');const q=s.search(/[?#]/);if(q>=0)s=s.slice(0,q);
 try{const base=window.document&&window.document.baseURI;if(base&&/^https?:/i.test(s)){const b=new URL('.',base).href;if(s.startsWith(b))s=s.slice(b.length);}}catch(_){}
 return s.replace(/^\.\//,'');}
function swap(u){if(!on)return null;const r=rel(u);if(Object.prototype.hasOwnProperty.call(MAP,r))return MAP[r];
 // 절대 주소의 경로 끝이 표 키와 같을 때(다른 baseURI)
 for(const k in MAP)if(r.endsWith('/'+k))return r.slice(0,r.length-k.length)+MAP[k];return null;}
const base=window.fetch;
if(typeof base==='function'){window.fetch=function(input,init){try{const url=typeof input==='string'?input:(input&&input.url);const n=url&&swap(url);
 if(n){stats.swapped++;seen.push(rel(url));return base.call(this,n,init);}stats.passed++;}catch(_){}return base.call(this,input,init);};}
function set(v){on=!!v;try{window.localStorage.setItem(KEY,on?'on':'off');}catch(_){}const el=window.document.getElementById&&window.document.getElementById('mob3dHqR1339Toggle');if(el)el.checked=on;return on;}
function row(){const doc=window.document;if(!doc||!doc.getElementById||doc.getElementById('mob3dHqR1339Row'))return;const host=doc.getElementById('combatScreenR1021')||doc.getElementById('quickSettingsR114');if(!host)return;
 const d=doc.createElement('div');d.id='mob3dHqR1339Row';d.className='r1021-row';
 d.innerHTML='<label><input type="checkbox" id="mob3dHqR1339Toggle"> 고품질 3D 몹·보스(R1339)</label><p class="small muted">3D로 나오는 몹·보스를 2D 원화에 맞춰 새로 만든 고해상도 모델로 그립니다(동작은 그대로). 끄면 이전 3D 모델입니다. 바꾼 뒤 새로 고침하세요.</p>';
 host.appendChild(d);const el=d.querySelector('#mob3dHqR1339Toggle');if(el){el.checked=on;el.onchange=()=>set(!!el.checked);}}
try{if(typeof window.showSettings==='function'){const b=window.showSettings;window.showSettings=function(...a){const r=b.apply(this,a);try{row();}catch(_){}return r;};}}catch(_){}
window.__STORYWORLD_MOB3D_HQ_R1339__=Object.freeze({revision:REV,on:()=>on,set,map:()=>({...MAP}),inspect:()=>({revision:REV,on,stats:{...stats},seen:seen.slice(-20)})});
})();
