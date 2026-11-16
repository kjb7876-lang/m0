// R1112 CPU/정적 검사: EGO 전수 복구 연결 확인(그래픽 검증 아님).
//  ① 미리 구운 수묵 시트 48장(PRE 표·파일·크기) ② 얼굴은 앞쪽만 ③ 사몽각성 컷인 EGO 그림·이름 ④ 사몽 오라 EGO 색 ⑤ R1033 초상 바꾸기 EGO 때 쉼 ⑥ 선택 칸 HIDDEN 표 아래로 ⑦ 스크립트 태그 그대로
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,300):''));};
const src=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const ink=src('ego-ink-r1099.js');for(const f of ['ego-ink-r1099.js','ego-sovereign-r1046.js','passive-cutin-r1033.js','samong-surge-r571.js'])new vm.Script(src(f),{filename:f});ok(true,'문법');
// ①
const m=/\/\*R1112-PRE\*\/(.*?)\/\*R1112-PRE-END\*\//s.exec(ink);let PRE=null;try{PRE=JSON.parse(m[1]);}catch(_){}
ok(PRE&&PRE.cell===160&&PRE.base==='assets/r1112/ego-ink/','PRE 표(칸 160, 경로)',PRE&&{cell:PRE.cell,base:PRE.base});
const CL=['idle','walk','run','attack','hit','discard'],DI=['s','se','e','ne','n','nw','w','sw'];const keys=CL.flatMap(c=>DI.map(d=>c+'-'+d));
ok(PRE&&keys.every(k=>Array.isArray(PRE.sheets[k])&&PRE.sheets[k].length===7),'48장 모두 표에 있음',PRE&&Object.keys(PRE.sheets).length);
let size=0,badDim=[];if(PRE)for(const k of keys){const e=PRE.sheets[k],f=path.join(R,'runtime-text',PRE.base,k+'.webp');if(!fs.existsSync(f)){badDim.push(k+':없음');continue;}size+=fs.statSync(f).size;
 const b=fs.readFileSync(f);/* VP8X 캔버스 크기 */const w=1+b.readUIntLE(24,3),h=1+b.readUIntLE(27,3);if(w!==e[4]*e[6]||h!==e[5])badDim.push(k+':'+w+'x'+h);
 const [x0,y0,x1,y1]=e;if(!(x0>=0&&y0>=0&&x1<=160&&y1<=160&&x1>x0&&y1>y0))badDim.push(k+':box');
 const raw=path.join(R,'runtime-text','assets','r1048','ego',k+'.webp');const rb=fs.readFileSync(raw);const rw=1+rb.readUIntLE(24,3);if(rw/160!==e[6])badDim.push(k+':frames');}
ok(PRE&&badDim.length===0,'webp 48장 크기·칸 수가 표·원본 시트와 맞음',badDim.slice(0,6));
ok(size>0&&size<12e6,'미리 구운 시트 합계 12MB 미만',size);
ok(/preUsable\(md\)\)\{preloadAll\(\);const r=preRequest\(m\)/.test(ink)&&/r\.pre\)continue/.test(ink),'수묵 켜면 미리 구운 그림을 먼저 씀·캐시 비우기에서 뺌');
// ②
ok(/const FACE_DIR=\{s:0,sw:1,se:7\}/.test(ink),'얼굴은 앞쪽(s·sw·se)만');
// ③
const sov=src('ego-sovereign-r1046.js');
ok(/function wrapAwake\(\)/.test(sov)&&/wrapHUD\(\);wrapAwake\(\);/.test(sov)&&/art\.awakening=P\.cutin\.image/.test(sov),'사몽각성 동안 각성 그림 = EGO 컷인 원화');
ok(/AWAKE_NAME='마지막 수호자 EGO'/.test(sov)&&/formActive\(\)&&!rc\(\)\?\.active/.test(sov),'이름 줄 EGO, RC151 변신 중엔 그쪽에 맡김');
ok(/r1046tag\{top:auto!important;bottom:22px!important/.test(sov),'선택 칸 HIDDEN 표를 그림 아래쪽으로');
// ④ 오라 색: palette 를 떼어 돌린다
const sur=src('samong-surge-r571.js');const pf=/const EGO_PAL=.*?\nconst egoForm=.*?\nfunction palette\(hero\)\{.*?\}\n/s.exec(sur);
ok(!!pf,'오라 palette 에 EGO 갈래');
if(pf){const mk=form=>{const sb={window:{__STORYWORLD_EGO_SOVEREIGN_R1046__:{formActive:()=>form}},GOLD:[255,198,72],SILVER:[214,222,234]};vm.createContext(sb);
  vm.runInContext('const FALLBACK={hwando:{main:[214,222,234],sub:GOLD}};'+pf[0]+';this.out=palette("hwando");this.other=palette("seoha");',sb);return sb;};
 const a=mk(true),b=mk(false);ok(a.out.main.join()==='204,52,40'&&a.out.sub.join()==='243,238,226','EGO 형상: 언주 바깥 + 흰빛 안쪽',a.out);
 ok(b.out.main.join()==='214,222,234','환도: 원래 은빛',b.out);}
// ⑤
const pc=src('passive-cutin-r1033.js');ok(/portraitOn\(\)&&!egoForm\(\)\)/.test(pc),'R1033 초상 바꾸기는 EGO 형상 때 쉼');
// ⑦
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
ok(html.indexOf('passive-cutin-r1033.js')<html.indexOf('ego-ink-r1099.js')&&html.indexOf('ego-ink-r1099.js')<html.indexOf('ego-sovereign-r1046.js'),'태그 순서(R1033 → R1099 → R1046)');
console.log(`\nR1112 cpu: ${n-bad}/${n} 통과`);process.exit(bad?1:0);
