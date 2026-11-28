// R1385 몹별 2D·3D 선택 규칙 CPU 검사: 판정표(decision.json) ↔ 오버레이 표 일치, 결정 함수 경계값, 3D 오버레이 11개 연결, 빌드 연결.
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const ROOT=path.resolve(__dirname,'../../..'),CS=ROOT+'/r96/client-source/',RT=ROOT+'/r96/runtime-text/';
let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};
const dec=JSON.parse(fs.readFileSync(__dirname+'/decision.json','utf8'));
const src=fs.readFileSync(CS+'mob-dim-rule-r1385.js','utf8');
ok(fs.readFileSync(RT+'mob-dim-rule-r1385.js','utf8')===src,'runtime-text 사본이 client-source 와 같다');
function load({webdriver=false,search='',zone='ep1b04',layer='STORY',ls={}}={}){const win={};const store=Object.assign({},ls);
 const ctx={window:win,navigator:{webdriver},location:{search},localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);}},room:{id:zone,layer},console};win.window=win;
 vm.runInNewContext(src,ctx);const R=win.__STORYWORLD_MOB_DIM_R1385__;ok(R,'전역 API');return {R,ctx};}
// 1) 표 일치: 오버레이 표 = decision.json 의 결정
const {R}=load();const T=R.table();
const want={};for(const m of dec.mobs)for(const k of m.kinds)want[k]=m.decision;
ok(JSON.stringify(Object.keys(T).sort())===JSON.stringify(Object.keys(want).sort()),'표 열쇠 일치 '+Object.keys(T).length+' vs '+Object.keys(want).length);
for(const k in want)ok(T[k]===want[k],'결정 일치 '+k);
ok(Object.values(T).every(v=>v==='2d'||v==='3d'),'결정 값은 2d·3d 뿐');
// 2) 모든 열쇠가 실제 3D 오버레이 종류
const tagOf={};for(const f of fs.readdirSync(CS).filter(f=>/^mob-3d-r1\d+c?\.js$/.test(f))){const s=fs.readFileSync(CS+f,'utf8');tagOf[f.replace(/^mob-3d-|\.js$/g,'')]=s;}
for(const k in want){const [t,kid]=k.split(':');ok(tagOf[t],'오버레이 있음 '+t);ok(new RegExp('(^|[\\s{,])'+kid+':[\\[{]','m').test(tagOf[t]),'종류 있음 '+k);}
// 3) 잠금: 사용자 몹 단위 결정은 그대로
const LOCK={'r1329:eggkeeper':'3d','r1329:violetAngel':'3d','r1329:swampMage':'3d','r1329:swampStalker':'3d','r1329:bloodHound':'3d','r1329:addictionCore':'3d','r1322:clockwork':'2d','r1322:clockworkLeader':'2d','r1322:reversal':'2d','r1322:censor':'2d','r1322c:surgeon':'2d','r1317:orb':'3d','r1322c:seoyun':'3d','r1322c:hotelChairman':'3d'};
// 설정으로 켜고 끄는 것(발록 v4·루시퍼·탐식 악마)은 표에 넣지 않는다(사용자: 기본 2D·설정 켜면 3D / 설정 켜면 방 내내 3D).
for(const k of ['r1338:balrog','r1382:lucifer','r1315:glutton'])ok(!(k in want),'설정이 정하는 것은 표 밖 '+k);
for(const [k,v] of Object.entries(LOCK))if(k in want)ok(want[k]===v,'사용자 잠금 유지 '+k+'='+v);
for(const m of dec.mobs)if(m.lock)ok(LOCK[m.kinds[0]]===undefined||LOCK[m.kinds[0]]===m.decision,'잠금 표기 일치 '+m.name);
// 4) 결정 함수 경계값
const k3=Object.keys(want).find(k=>want[k]==='3d'),k2=Object.keys(want).find(k=>want[k]==='2d');
ok(k3&&k2,'3d·2d 결정이 하나 이상');
const [t3,i3]=k3.split(':'),[t2,i2]=k2.split(':');
ok(R.use(t3,i3,false)===true,'3d 결정은 설정 꺼져도 3D');ok(R.use(t2,i2,true)===false,'2d 결정은 설정 켜져도 2D');
ok(R.use('r1316','__none__',true)===true&&R.use('r1316','__none__',false)===false,'표에 없는 종류는 원래 값 그대로');
ok(R.active(t3,false)===true,'3d 결정이 있는 오버레이는 꺼져 있어도 active');ok(R.active('r9999',false)===false&&R.active('r9999',true)===true,'모르는 오버레이는 원래 값');
for(const z of ['last302','last303']){const {R:Rz}=load({zone:z});ok(Rz.use(t3,i3,true)===false,'불면귀 마을 '+z+' 은 늘 2D');}
{const {R:Rs}=load({layer:'SAMONG'});ok(Rs.use(t3,i3,false)===false,'이야기 층 밖은 원래 값(false)');}
{const {R:Ro}=load({ls:{'storyworld.r1385.dimrule':'off'}});ok(Ro.use(t3,i3,false)===false&&Ro.use(t2,i2,true)===true,'규칙 끄면 원래 값');}
{const {R:Rw}=load({webdriver:true});ok(Rw.on()===false&&Rw.use(t2,i2,true)===true,'자동 검사(webdriver)는 기본 꺼짐');}
{const {R:Ru}=load({webdriver:true,search:'?dim85=1'});ok(Ru.on()===true&&Ru.use(t2,i2,true)===false,'주소 ?dim85=1 로 켬');}
// 5) 3D 오버레이 11개 연결
for(const [t,s] of Object.entries(tagOf)){ok(s.includes(`__STORYWORLD_MOB_DIM_R1385__?.active?.('${t}',false)`),'active 연결 '+t);ok(s.includes(`__STORYWORLD_MOB_DIM_R1385__?.use?.('${t}',kid,`),'종류별 연결 '+t);
 ok(fs.readFileSync(RT+'mob-3d-'+t+'.js','utf8')===s,'runtime-text 사본 '+t);}
ok(Object.keys(tagOf).length===11,'3D 오버레이 11개');
// 6) 빌드 연결
const html=fs.readFileSync(RT+'index.html','utf8');ok(/<script src="\.\/mob-3d-zone-r1326\.js"><\/script>\n<script src="\.\/mob-dim-rule-r1385\.js"><\/script>/.test(html),'스크립트 태그(R1326 바로 뒤)');
ok(fs.readFileSync(ROOT+'/scripts/verify-r96-public.py','utf8').includes("'mob-dim-rule-r1385.js'"),'공개 검증 목록');
ok(fs.readFileSync(ROOT+'/.github/workflows/pages.yml','utf8').includes('node r96/qa/r1385/r1385-cpu-check.cjs'),'CI 검사 줄');
ok(JSON.parse(fs.readFileSync(ROOT+'/r96/runtime-manifest.json','utf8')).files.some(f=>f.path==='mob-dim-rule-r1385.js'),'manifest');
ok(fs.existsSync(ROOT+'/docs/mob-2d3d-rule-r1385.md'),'규칙 문서');
console.log('R1385 CPU check OK',n,'assertions,',Object.keys(want).length,'kinds');
