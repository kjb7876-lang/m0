// R199 CPU check: 형광 만화풍 슬라임 3종만 그리는 동안 몸 필터(기록기 허용 필터만), 다른 몹·보스 불변, drawImage 필터 이어 붙임.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});const S=C('mob-style-r199.js'),idx=RT('index.html');
ok('loads after samong-doll-r193, before combat-r118',idx.indexOf('./mob-style-r199.js')>idx.indexOf('./samong-doll-r193.js')&&idx.indexOf('./mob-style-r199.js')<idx.indexOf('./combat-r118.js'));
ok('runtime copy matches',RT('mob-style-r199.js')===S);
ok('in the public verify list',/'mob-style-r199\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
const F=/const FILTER='([^']+)'/.exec(S)[1];ok('filter uses only recorder-safe CSS functions (no blur/drop-shadow)',F.split(/\s+/).every(t=>/^(saturate|brightness|contrast|hue-rotate|grayscale)\(/.test(t))&&!/blur|drop-shadow/.test(F),F);
const calls=[];let ctxFilter='none';
const ctxObj={get filter(){return ctxFilter},set filter(v){ctxFilter=v},save(){},restore(){},drawImage(){calls.push({p:'ctx',ctx:ctxFilter});}};
const sb={window:{},localStorage:{getItem:()=>null,setItem(){}},ctx:ctxObj,
 drawImage:(p,x,y,w,h,opt)=>{calls.push({p,f:opt&&opt.filter,ctx:ctxFilter});},
 /* 엔진처럼: 몸은 미리 붙잡아 둔 함수가 ctx.filter 를 opt.filter 로 덮은 뒤 ctx.drawImage 로 그린다 */
 drawEnemy:function(e){ctxFilter=e.flash?'brightness(1.8)':'none';sb.ctx.drawImage();ctxFilter='none';}};
vm.createContext(sb);vm.runInContext(S,sb);
sb.drawEnemy({nativeId:'c101-e3',hp:5});ok('slime body: the ctx.drawImage call sees the tone filter appended',calls[0].ctx===F,calls[0]);
sb.drawEnemy({nativeId:'c101-e3',hp:5,flash:1});ok('existing filter (hit flash) is kept and the tone appended',calls[1].ctx==='brightness(1.8) '+F,calls[1]);
ok('ctx.drawImage is restored after the slime draw (no own property left behind)',!Object.prototype.hasOwnProperty.call(ctxObj,'drawImage')||ctxObj.drawImage.toString().includes('calls.push'));
sb.drawEnemy({nativeId:'c101-e1',hp:5});ok('other mobs untouched',calls[2].ctx==='none',calls[2]);
sb.drawEnemy({nativeId:'l304-e1',hp:5,boss:true});ok('bosses untouched even with a listed id',calls[3].ctx==='none');
sb.ctx.drawImage();ok('ctx draws outside a slime draw are untouched (effects, props)',calls[4].ctx==='none');
sb.window.__STORYWORLD_MOB_STYLE_R199__.set({on:false});sb.drawEnemy({nativeId:'c101-e3',hp:5});ok('off switch restores original look',calls[5].ctx==='none');
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
