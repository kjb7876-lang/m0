/* Reuse every R72 feature/authority assertion over R73; acknowledge only the
 * added slot confirmation in the two original new-game UI entry paths. */
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const path='scripts/r72.browser.test.mjs',hash=s=>createHash('sha256').update(s).digest('hex');
let source=await fs.readFile(path,'utf8');assert.equal(hash(source),'0f028037f2c20c9c9e96f92d675f50af9c0323d819c24f952eb680b895056bfb','preserved c011601 R72 assertions must not drift; pin also works in a shallow CI checkout');
for(const owner of ['page','touch']){
 const click=`await ${owner}.locator('#campaignNew54').click({timeout:60000});`;
 assert.equal(source.split(click).length-1,1);source=source.replace(click,click+`if(await ${owner}.locator('#slotConfirmR73').count())await ${owner}.locator('#slotConfirmR73').click();`);
}
const coopStart=source.indexOf("await run('cooperative-authority-save-and-input'");
const coopEnd=source.indexOf('\n\nawait browser.close();',coopStart);
assert.ok(coopStart>=0&&coopEnd>coopStart,'the old golden co-op case must be replaced with the R63 compatibility check');
const coopCase=`await run('existing-r63-coop-disables-solo-only-features',async({page})=>{
 const result=await page.evaluate(async()=>{
  const c=window.__STORYWORLD_COOP_SIM_R62__,g=window.__STORYWORLD_GOLDEN_R72__,before=JSON.stringify(serializeSave().goldenR72);
  await c.start({role:'host',selfId:'qa-host',hero:'hwando',members:[{id:'qa-host',nick:'방장',character:'hwando'},{id:'qa-peer',nick:'검증동료',character:'seoha'}]});let epoch=c.inspect().epoch;c.receive({type:'all_loaded',epoch,phase:'running'});
  const p=c.localPlayer(),dispatch=g.dispatch({op:'auto',enabled:true}),direct=g.applyCommand(p,{op:'auto',enabled:true}),cast=g.cast(),auto=g.autoCast();showMenu();
  const profile=window.__STORYWORLD_COOP_CLIENT_R62__.inspect(),menu=!!document.querySelector('#goldOpen'),hud=document.querySelector('#goldHudR72').style.display,saved=serializeSave();await c.stop();
  return{dispatch,direct,cast,auto,menu,hud,profile,requestGolden:typeof c.requestGolden,soloRestored:JSON.stringify(serializeSave().goldenR72)===before,normalFields:{hasMaze:Object.hasOwn(saved,'mazeR73'),hasGolden:Object.hasOwn(saved,'goldenR72')}};
 });
 report.fixtures.push('co-op case: native host simulation; gold management/cast API blocked, no menu/HUD control or requestGolden method, R63R1 transport and original normal-save schema retained');
 assert.equal(result.dispatch.ok,false);assert.equal(result.direct.ok,false);assert.equal(result.cast,false);assert.equal(result.auto,false);assert.equal(result.menu,false);assert.equal(result.hud,'none');assert.equal(result.requestGolden,'undefined');assert.equal(result.profile.revision,'R63R1');assert.equal(result.soloRestored,true);assert.deepEqual(result.normalFields,{hasMaze:false,hasGolden:false});return result;
});`;
source=source.slice(0,coopStart)+coopCase+source.slice(coopEnd);
assert.equal(source.split("path.resolve('out/r72')").length-1,1);source=source.replace("path.resolve('out/r72')","path.resolve('out/r73/features')");
await fs.mkdir('out/r73',{recursive:true});const generated='out/r73/features-generated.mjs';await fs.writeFile(generated,source);const run=spawnSync(process.execPath,[generated],{stdio:'inherit',env:process.env});if(run.error)throw run.error;assert.equal(run.status,0,'R73 golden/777/portal/touch/cooperative authority regressions');
