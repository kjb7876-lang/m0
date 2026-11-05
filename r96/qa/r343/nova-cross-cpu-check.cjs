// R343: hero nova (fx-d2s nova, fx-eden PRE.nova, EGO egoRing) uses a ground cross instead of a circular ring.
'use strict';const fs=require('fs'),path=require('path');const R=path.join(__dirname,'..','..');
let n=0;const ok=(c,m)=>{if(!c){console.error('FAIL',m);process.exit(1);}n++;console.log('PASS',m);};
for(const dir of ['client-source','runtime-text']){
 const d2s=fs.readFileSync(path.join(R,dir,'fx-d2s-r106.js'),'utf8'),eden=fs.readFileSync(path.join(R,dir,'fx-eden-r108.js'),'utf8');
 const nova=d2s.slice(d2s.indexOf(' nova(e,u,h){'),d2s.indexOf('\n};',d2s.indexOf(' nova(e,u,h){')));
 ok(nova.length>100,dir+' d2s nova found');
 ok(!/S\('ring'/.test(nova),dir+' d2s nova draws no ring');
 ok(/S\('cross',F,[^)]*squash:\.5[^)]*blend:'screen'/.test(nova),dir+' d2s nova draws a ground cross (screen blend)');
 const pre=eden.slice(eden.indexOf('PRE.nova='),eden.indexOf('return true;};',eden.indexOf('PRE.nova=')));
 ok(pre.length>100&&!/nova\.all/.test(pre),dir+' eden PRE.nova no ring sheet');
 ok(/S\('cross',F/.test(pre),dir+' eden PRE.nova draws a cross');
 const ego=eden.slice(eden.indexOf("e.kind==='egoRing'"),eden.indexOf('return;}',eden.indexOf("e.kind==='egoRing'")));
 ok(ego.length>50&&!/clip\('nova\.all'/.test(ego),dir+' egoRing no ring sheet');
 ok(/draw\('cross'/.test(ego),dir+' egoRing draws a cross');
}
ok(fs.readFileSync(path.join(R,'client-source','fx-d2s-r106.js'),'utf8')===fs.readFileSync(path.join(R,'runtime-text','fx-d2s-r106.js'),'utf8'),'d2s source = runtime-text');
ok(fs.readFileSync(path.join(R,'client-source','fx-eden-r108.js'),'utf8')===fs.readFileSync(path.join(R,'runtime-text','fx-eden-r108.js'),'utf8'),'eden source = runtime-text');
console.log(JSON.stringify({ok:true,checks:n}));
