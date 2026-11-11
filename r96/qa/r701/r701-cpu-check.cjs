// R701 무한 생존: 강화 창 77초 묶음(누적 원큐)·난이도 선택·영웅 초상화/설명 선택 CPU 검사
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const src=fs.readFileSync(path.join(root,'client-source','survival-r600.js'),'utf8');
assert.strictEqual(src,fs.readFileSync(path.join(root,'runtime-text','survival-r600.js'),'utf8'));ok('client-source and runtime copies agree');
const win={};const doc={getElementById:()=>null,createElement:()=>({}),addEventListener:()=>{},head:{appendChild(){}},body:{appendChild(){}},querySelectorAll:()=>[]};
new Function('window','document','localStorage',src)(win,doc,{getItem:()=>null,setItem(){}});
const P=win.__STORYWORLD_SURVIVAL_R600__.pure;
// ── 77초 묶음 ──
assert.strictEqual(P.CHOICE_EVERY,77);ok('window interval is 77 s');
{const d=(t,last,q)=>P.choiceDue(t,last,q);
 assert.deepStrictEqual(d(0,0,3),{due:false,idx:0});
 assert.deepStrictEqual(d(76.99,0,3),{due:false,idx:0});ok('before 77 s no window (boundary 76.99)');
 assert.deepStrictEqual(d(77,0,3),{due:true,idx:1});ok('exactly 77 s with queued levels opens the window');
 assert.deepStrictEqual(d(77,0,0),{due:false,idx:1});ok('77 s with nothing queued: no window, grid still advances');
 assert.deepStrictEqual(d(80,1,5),{due:false,idx:1});ok('already shown this slot: not again');
 assert.deepStrictEqual(d(154,1,1),{due:true,idx:2});ok('next slot at 154 s');
 assert.deepStrictEqual(d(500,1,2),{due:true,idx:6});ok('long pause: one window, not a pile of windows');
 assert.deepStrictEqual(d(NaN,0,2),{due:false,idx:0});assert.deepStrictEqual(d(-5,0,2),{due:false,idx:0});ok('bad time is ignored');}
{assert.strictEqual(P.windowPicks(0),0);assert.strictEqual(P.windowPicks(1),1);assert.strictEqual(P.windowPicks(4),4);assert.strictEqual(P.windowPicks(P.WINDOW_MAX),P.WINDOW_MAX);assert.strictEqual(P.windowPicks(P.WINDOW_MAX+5),P.WINDOW_MAX);assert.strictEqual(P.windowPicks(-2),0);assert.strictEqual(P.windowPicks('x'),0);
 assert(P.WINDOW_MAX>=6&&P.WINDOW_MAX<=12);ok('window picks: 0/1/many, capped, bad input → 0');}
// ── 난이도 ──
{const D=P.DIFFS;assert.deepStrictEqual(Object.keys(D),['easy','normal','hard','nightmare']);
 assert.deepStrictEqual({hp:D.normal.hp,cap:D.normal.cap,dmg:D.normal.dmg,xp:D.normal.xp},{hp:1,cap:1,dmg:1,xp:1});
 const ks=['easy','normal','hard','nightmare'];for(const k of['hp','cap','dmg']){for(let i=1;i<4;i++)assert(D[ks[i]][k]>D[ks[i-1]][k],k+' rises with difficulty');}
 for(let i=1;i<4;i++)assert(D[ks[i]].xp<=D[ks[i-1]].xp);for(const k of ks)assert(D[k].name&&D[k].text);
 assert.strictEqual(P.diffOf('hard'),D.hard);assert.strictEqual(P.diffOf('zzz'),D.normal);assert.strictEqual(P.diffOf(undefined),D.normal);ok('difficulty table: normal=1, monotonic, unknown → normal');
 assert.strictEqual(P.hpMul(3,0),P.hpMul(3,0,'normal'));assert(Math.abs(P.hpMul(3,0,'hard')-P.hpMul(3,0)*D.hard.hp)<1e-9);assert(P.hpMul(3,0,'easy')<P.hpMul(3,0));
 assert.strictEqual(P.cap(0,0,false),P.cap(0,0,false,'normal'));assert(P.cap(0,0,false,'hard')>P.cap(0,0,false));assert(P.cap(0,0,false,'easy')<P.cap(0,0,false));
 assert.strictEqual(P.cap(9999,60,false,'nightmare'),48);assert.strictEqual(P.cap(9999,60,true,'nightmare'),30);assert(P.cap(0,0,false,'easy')>=10);ok('hp and cap scale by difficulty; perf ceiling 48/30 stays; floor 10');}
// ── 연결(소스) ──
assert(/function difficultyPicker\(/.test(src)&&/pending=true;\s*difficultyPicker\(\)/.test(src));ok('title button opens the difficulty picker first');
assert(/function heroPicker\(/.test(src)&&/portrait/.test(src.slice(src.indexOf('function heroPicker('),src.indexOf('async function start(')))&&/passive/.test(src.slice(src.indexOf('function heroPicker('),src.indexOf('async function start('))) );ok('hero picker shows portrait and description');
assert(!/&&!choiceQ&&!narrPlaying\(\)/.test(src));ok('stage advance no longer waits on the queued choices');
console.log('R701 CPU 검사 통과 '+n+'건');
