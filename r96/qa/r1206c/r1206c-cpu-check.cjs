// R1206c CPU 검사 — Dots CX-0166SM-C 먹 번짐 예고 8프레임 시트(ink-bloom_warn8)를 사몽 육망성 자리 예고에 연결(combat-r170 inkSheet).
// 발동(C2)은 Dots 품질 보류라 코드 먹 번짐(inkBlot) 그대로. 판정·타이밍 불변.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'../..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({n,p:!!p,d});
const SHEET='assets/r1206/fx/ink-bloom-warn8.webp';
const fx=(()=>{try{return JSON.parse(fs.readFileSync(path.join(R,'runtime-text/assets/r1206/fx/index.json'),'utf8'));}catch(_){return null;}})();
ok('시트 있음·색인 바이트 일치·8프레임 256칸',fx&&fx.sheets?.['ink-bloom-warn8']?.path===SHEET&&fs.existsSync(path.join(R,'runtime-text',SHEET))&&fs.statSync(path.join(R,'runtime-text',SHEET)).size===fx.sheets['ink-bloom-warn8'].bytes&&fx.sheets['ink-bloom-warn8'].frames===8&&fx.sheets['ink-bloom-warn8'].cell===256);
ok('runtime-inputs 등록',fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8').includes(SHEET));
ok('runtime-text 사본 같음',fs.readFileSync(path.join(R,'runtime-text/combat-r170.js'),'utf8')===C('combat-r170.js'));
const mk=(ready)=>{const added=[];const sb={window:{},localStorage:{getItem:()=>null,setItem(){}},console,Math,JSON,Object,Array,Set,Map,WeakMap,Number,String,Promise,Date,
  readyImage:p=>ready&&p===SHEET?{image:{naturalWidth:2048,naturalHeight:256}}:null,addImage:p=>added.push(p)};sb.window=sb;vm.createContext(sb);vm.runInContext(C('combat-r170.js'),sb);return {A:sb.__STORYWORLD_COMBAT_R170__,added};};
{const {A,added}=mk(true);const rec=[];const g={drawImage:(...a)=>rec.push(a)};
 ok('API inkSheet 있음',typeof A?.inkSheet==='function');
 const r0=A?.inkSheet?.(g,108,0),r5=A?.inkSheet?.(g,108,.66),r9=A?.inkSheet?.(g,108,1);
 ok('예고 진행도 → 프레임(0→0, .66→5, 1→7 마지막에 멈춤)',r0&&r5&&r9&&rec[0]?.[1]===0&&rec[1]?.[1]===5*256&&rec[2]?.[1]===7*256,rec.map(a=>a.slice(1,9)));
 ok('타원 216px 가 화면 지름 2w 에 맞음(칸 256 → 256·2w/216, 중심 128)',rec[0]&&Math.abs(rec[0][7]-256*216/216)<1e-6&&Math.abs(rec[0][5]+128)<1e-6,rec[0]?.slice(5,9));
 ok('준비된 시트는 다시 요청하지 않음',added.length===0);}
{const {A,added}=mk(false);const rec=[];const g={drawImage:(...a)=>rec.push(a)};const r=A?.inkSheet?.(g,108,.5);
 ok('경계: 시트가 아직 없으면 false·요청만 하고 코드 먹 번짐으로 버팀',r===false&&rec.length===0&&added.includes(SHEET),[r,added]);}
const src=C('combat-r170.js');
ok('drawHex: 예고 중에만 시트, 그린 뒤엔 코드 먹 번짐 생략 / 발동은 inkBlot 그대로',/const sheet=warn&&inkHex\(\)&&inkSheet\(ctx,w,u\)/.test(src)&&/if\(inkHex\(\)\)\{inkBlot\(sheet\?null:ctx,/.test(src)&&/function inkBlot\(g,w,grow,seed\)\{if\(!g\)return;/.test(src));
ok('끄기: r170.combat {inkSheet:false} 면 시트 안 씀',/prefs\.inkSheet===false/.test(src));
const pass=checks.filter(c=>c.p).length;for(const c of checks)console.log((c.p?'PASS ':'FAIL ')+c.n+(c.p?'':' '+String(JSON.stringify(c.d)??'').slice(0,400)));
console.log(`R1206c ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
