// R187 CPU check: 최근 작업 디버깅 — 사몽 전투 구역 손전등 부채꼴, 벽 앞 부채꼴 방향, R186 설정 켜고 끄기, 낮은 화면 쪽지 한 장 크기, form 없는 쪽지.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
for(const f of ['light-r182.js','samong-void-r186.js','story-collect-r177.js'])ok('runtime copy matches · '+f,RT(f)===C(f));
const L=C('light-r182.js');
ok('flashlight cone skips samong only while samong-r103 is drawing its own light (maze/dark zones)',/room\.samongR103&&document\.getElementById\('r103Flashlight'\)\?\.style\.display==='block'\)return false;/.test(L)&&!/if\(room\.samongR103\)return false;/.test(L));
ok('standing still with the cone on a wall turns it to the longest open line',/ray\(player\.x,player\.y,Math\.atan2\(dir\.y,dir\.x\),3\)<2\.2\)\{let best=0,ba=0;for\(let k=0;k<16;k\+\+\)/.test(L));
const V=C('samong-void-r186.js');
ok('R186 void plane has a settings checkbox (r186Void) wired to set({on})',/c\.id='r186Void'/.test(V)&&/c\.onchange=\(\)=>set\(\{on:c\.checked\}\)/.test(V));
const S=C('story-collect-r177.js');
ok('page size follows the remaining screen height; paged card capped to the viewport',/function pageLimit\(\)/.test(S)&&/pages=paginate\(showing\.text,pageLimit\(\)\)/.test(S)&&/#r177Doc\.r182pages\{overflow:hidden;max-height:calc\(100vh - 124px\)\}/.test(S));
ok('a document without a known form falls back to note (no "undefined" class or title)',/el\.className=\(FORMS\[showing\.form\]\?showing\.form:'note'\)/.test(S)&&/title:\(FORMS\[doc\.form\]\|\|'쪽지'\)/.test(S));
// pageLimit 값
const sb={innerWidth:844,innerHeight:390};const lim=new Function('innerWidth','innerHeight',S.match(/function pageLimit\(\)\{[^\n]*\}/)[0]+';return pageLimit();');
ok('pageLimit: phone landscape 844×390 → ≤ 180 chars, desktop 1280×720 → 320, never < 110',lim(844,390)<=180&&lim(1280,720)===320&&lim(400,200)===110,[lim(844,390),lim(1280,720),lim(400,200)]);
for(const f of ['light-r182.js','samong-void-r186.js','story-collect-r177.js'])ok('parses · '+f,(()=>{try{new vm.Script(C(f));return true;}catch(e){return false;}})());
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
