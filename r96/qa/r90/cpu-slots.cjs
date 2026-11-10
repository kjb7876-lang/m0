'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{createHarness}=require('../harness.cjs');
const report={schema:'r90-native-three-slots/v1',method:'Actual shipped native new-game, confirmation callback, save and load APIs in Node VM. No browser, GPU or natural play.',assistance:['Native UI callbacks invoked programmatically','Existing harness image/audio/renderer readiness stubs','Authored narrative dismissed via advanceScene','Distinct HP values assigned solely to synthetic test slots; no real user storage'],checks:[],browserVerified:false,headlessVerified:false,GPUVerified:false,naturalPlayVerified:false};
const check=(name,passed,detail)=>{report.checks.push({name,passed:!!passed,detail});if(!passed)throw Error(name);console.log('PASS '+name);};
(async()=>{
 const h=createHarness({timeoutMs:90000}),run=s=>h.run(s),boot=await h.boot();check('Native boot succeeds',boot.booted&&!boot.errors.length,boot);
 check('R90 overlay is the applied canonical source',fs.readFileSync(path.join(h.site,'visual-r90.js'),'utf8')===fs.readFileSync(path.resolve(__dirname,'../../client-source/visual-r90.js'),'utf8'));
 const api=run('__STORYWORLD_SAVE_SLOTS_R73__'),presentation=run('__STORYWORLD_VISUAL_R90__');
 const settle=async()=>{for(let i=0;i<1000&&api.inspect().busy;i++)await new Promise(r=>setImmediate(r));if(api.inspect().busy)throw Error('Native slot transaction did not settle');};
 const dismiss=()=>run('for(let i=0;i<80&&storyScene;i++)advanceScene();if(modal&&!storyScene)closePanel(true);');
 h.storage.set('storyworld.hospital-three-pc.maze.v8:r90-sentinel','preserve prior unrelated save');
 const expected=[];
 for(const n of[1,2,3]){
  run(`__STORYWORLD_SAVE_SLOTS_R73__.confirm('new',${n})`);h.elements.get('slotConfirmR73').onclick();await settle();dismiss();
  check('Slot '+n+' native confirmed new game enters refuge',api.inspect().active===n&&run("started&&!loading&&zone==='hub'&&layer==='STORY'"),api.inspect());
  const hp=run(`player.hp=Math.max(1,maxHP()-${n*17});player.hp`);expected.push(hp);
  check('Slot '+n+' saves through native API',run('saveGame(false)')===true&&api.read(n)?.player.hp===hp);
 }
 const before=run('JSON.stringify([1,2,3].map(n=>__STORYWORLD_SAVE_SLOTS_R73__.read(n)))');
 for(const on of[false,true,false,true])presentation.set(Object.fromEntries(Object.keys(presentation.prefs()).map(k=>[k,on])));
 const after=run('JSON.stringify([1,2,3].map(n=>__STORYWORLD_SAVE_SLOTS_R73__.read(n)))');
 check('All seven R90 preferences leave all three native slot bytes unchanged',before===after);
 const prefix=run('__STORYWORLD_TEST_STORAGE_B1__.prefix');
 check('Presentation preference storage is outside slots with preserved namespace',presentation.storageKey===prefix+'r90.presentation'&&h.storage.has(prefix+'r90.presentation'),{prefix,key:presentation.storageKey});
 for(const n of[1,2,3]){await run(`__STORYWORLD_SAVE_SLOTS_R73__.confirm('load',${n})`);await settle();dismiss();check('Slot '+n+' restores its own HP and active pointer',api.inspect().active===n&&run('player.hp')===expected[n-1],{expected:expected[n-1],actual:run('player.hp')});}
 check('Native serialized save contains no R90 fields',!JSON.stringify(run('serializeSave()')).includes('r90.presentation'));
 check('Older unrelated namespace remains byte-identical',h.storage.get('storyworld.hospital-three-pc.maze.v8:r90-sentinel')==='preserve prior unrelated save');
 check('Native game error ledger stays empty',run('errors.length===0'),run('[...errors]'));
 report.sourceSHA256=Object.fromEntries(['index.html','visual-r90.js','visual-r90-world.js'].map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(path.join(h.site,p))).digest('hex')]));
})().catch(e=>{report.failure=e.stack;process.exitCode=1;console.error(e.stack);}).finally(()=>{report.passed=report.checks.every(c=>c.passed)&&!report.failure;fs.writeFileSync(path.join(__dirname,'cpu-slots.json'),JSON.stringify(report,null,2)+'\n');console.log(report.checks.filter(c=>c.passed).length+'/'+report.checks.length);});
