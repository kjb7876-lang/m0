// R1101b 기억사수 대각·옆 시선(Dots CX-0119GD r1) — CPU 검사.  node r96/qa/r1101b/r1101b-cpu-check.cjs
//  ① 쏜 뒤 서 있기 R128 idle-e·se·ne·w·sw·nw(얼굴이 총 반대, 왼쪽은 거울) → Dots 대기 6칸(GD-7·GD-5·GD-6), 같은 자리·좌우, 칸은 게임 시간 .15초마다.
//  ② 대각 공격: GD-1(+26°)·GD-2(−29°) 를 se2·ne2 칸으로 더함 — 그 각 근처 조준이면 고르고, ±45° 는 여전히 se·ne(총 각도 오차 우선).
//  ③ 8칸 공격 시트: R143 6칸 번호 0..5 → 0..7 로 펼침. ④ 자산 크기·칸·발.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d));assert(c,m);n++;console.log('PASS',m);};
const src=fs.readFileSync(path.join(R,'client-source','gunner-aim-r991.js'),'utf8');
ok(src===fs.readFileSync(path.join(R,'runtime-text','gunner-aim-r991.js'),'utf8'),'runtime-text 사본과 같음');
ok(/node r96\/qa\/r1101b\/r1101b-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
function load(pref,t=0){const win={};const sb={window:win,localStorage:{getItem:()=>pref?JSON.stringify(pref):null,setItem(){}},Math,Number,JSON,Object,Array,Set,Map,WeakMap,String,isFinite,console,setTimeout:()=>0,document:{readyState:'loading'},addEventListener(){},
  readyImage:q=>({image:{naturalWidth:1152,naturalHeight:256,src:q,tag:'NEW'}}),player:{hero:'gunner'},time:t};win.addEventListener=()=>{};
 vm.createContext(sb);vm.runInContext(src,sb);return {A:win.__STORYWORLD_GUNNER_AIM_R991__,sb};}
const {A,sb}=load(null);const D=Math.PI/180,near=(a,b)=>Math.abs(a-b)<1e-6;
ok(/R1101b/.test(A.revision)&&/R1101-/.test(A.revision)&&/R1045d/.test(A.revision)&&/R1003/.test(A.revision),'판 R1101b(+R1101·R1045d·R1003 유지)',A.revision);
// ①
for(const d of ['e','se','ne'])for(const mir of [false,true]){const k=.3,x0=400,y0=200,w=192*k*(mir?-1:1);
 const c={kind:'image',owner:{kind:'hero'},sourcePath:'assets/r128/gunner/idle-'+d+'.webp',image:{},sourceRect:[384,0,192,256],points:[[x0,y0],[x0+w,y0],[x0+w,y0+256*k],[x0,y0+256*k]]};
 ok(A.sideIdle({commands:[c]},0)===1&&c.sourcePath==='assets/r1101b/gunner/idle-'+d+'6.webp'&&c.image.tag==='NEW','쏜 뒤 서 있기 idle-'+d+(mir?'(반전)':'')+' → Dots 대기 6칸',c.sourcePath);
 ok(near(c.points[0][0],x0)&&near(c.points[1][0],x0+w)&&near(c.points[3][1],y0+256*k)&&c.sourceRect[2]===192&&c.sourceRect[3]===256,'같은 자리·같은 좌우·칸 전체',c.points);}
for(const [d,r] of [['w','e'],['sw','se'],['nw','ne']]){const k=.3,x0=400,y0=200,w=192*k;
 const c={kind:'image',sourcePath:'assets/r128/gunner/idle-'+d+'.webp',image:{},sourceRect:[0,0,192,256],points:[[x0,y0],[x0+w,y0],[x0+w,y0+256*k],[x0,y0+256*k]]};
 ok(A.sideIdle({commands:[c]},0)===1&&c.sourcePath==='assets/r1101b/gunner/idle-'+r+'6.webp'&&near(c.points[0][0],x0+w)&&near(c.points[1][0],x0)&&near(c.points[3][1],y0+256*k),'왼쪽 서 있기 idle-'+d+' → idle-'+r+'6 거울(같은 자리)',c.points);}
{const seen=new Set();for(let t=0;t<1;t+=.05){const L=load(null,t).A;const c={kind:'image',sourcePath:'assets/r128/gunner/idle-e.webp',image:{},sourceRect:[0,0,192,256],points:[[0,0],[1,0],[1,1],[0,1]]};L.sideIdle({commands:[c]},0);seen.add(c.sourceRect[0]);}
 ok(seen.size===6&&[...seen].every(x=>x%192===0&&x<=960),'게임 시간으로 6칸 모두 돎',[...seen]);}
{const c={kind:'image',sourcePath:'assets/r128/gunner/idle-s.webp',image:{},sourceRect:[0,0,192,256],points:[[0,0],[1,0],[1,1],[0,1]]};ok(A.sideIdle({commands:[c]},0)===0,'정 아래·위 서 있기는 그대로(사용자 승인 그림)');}
{const B=load({sideIdle:false}).A,c={kind:'image',sourcePath:'assets/r128/gunner/idle-se.webp',image:{},sourceRect:[0,0,192,256],points:[[0,0],[1,0],[1,1],[0,1]]};ok(B.sideIdle({commands:[c]},0)===0,'sideIdle 끄면 예전 그대로');}
// ②
ok(A.SHEETS.includes('se2')&&A.SHEETS.includes('ne2'),'대각 겨눔 칸 se2·ne2');
const p=(deg)=>A.pick(deg*D);
ok(p(26).sheet==='se2'&&!p(26).mirror&&p(154).sheet==='se2'&&p(154).mirror,'+26°·154° 조준 → se2(왼쪽은 반전)',[p(26),p(154)]);
ok(p(-29).sheet==='ne2'&&!p(-29).mirror&&p(-151).sheet==='ne2'&&p(-151).mirror,'−29°·−151° 조준 → ne2',[p(-29),p(-151)]);
ok(p(45).sheet==='se'&&p(-45).sheet==='ne','±45° 는 총 각도가 가까운 R143 se·ne 그대로',[p(45),p(-45)]);
ok(JSON.stringify(A.tip('se2',7))==='[155,111]'&&JSON.stringify(A.tip('ne2',3))==='[151,55]','총구 끝(Dots 값 배율 반영)');
{const C=load({diag2:false}).A;ok(!C.SHEETS.includes('se2')&&!C.SHEETS.includes('ne2'),'diag2:false 면 예전 칸만');}
// ③ R143 6칸 번호 → 8칸
ok(/sx=Math\.round\(clamp\(Math\.round\(fin\(c\.sourceRect\[0\]\)\/CW\),0,5\)\*\(fin\(SHEET\[sw\.sheet\]\?\.frames,6\)-1\)\/5\)\*CW/.test(src),'공격 칸 번호를 시트 칸 수에 맞게 펼침');
// ④ 자산
const sz=f=>{const b=fs.readFileSync(path.join(R,'runtime-text','assets','r1101b','gunner',f));ok(b.slice(0,4).toString()==='RIFF'&&b.slice(8,12).toString()==='WEBP'&&b.length<200000,f+' WebP·200KB 미만',b.length);};
for(const f of ['attack-se8.webp','attack-ne8.webp','idle-se6.webp','idle-ne6.webp','idle-e6.webp'])sz(f);
console.log(JSON.stringify({passed:n}));
