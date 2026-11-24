/* CPU preflight only: imports witness configuration without Playwright and checks pinned sources. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {config,checkURL} from './guardian34-browser.mjs';
const read=p=>fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const html=read('runtime-text/index.html'), wrapper=read('client-source/move-dir-r974.js');
const official=read('qa/sw0025/browser.mjs');
for(const id of config.selectors){
 assert.ok(html.includes(id.slice(1)));
 assert.ok(official.includes("locator('"+id+"')"));
}
for(const api of ['enterRegion','clearLine','blocked','readyImage','advanceScene','project','captureVisual','__STORYWORLD_PHASE1__','__STORYWORLD_SAVE_SLOTS_R73__']) assert.ok(html.includes(api),api);
assert.match(html,/controller,scope:'all compiled regions STORY\/DREAM/);
const data=JSON.parse(html.match(/id="portable-data">([\s\S]*?)<\/script>/)[1]);
const zone=data.mainloop||data.mainlineRosterExpectations.zones.find(z=>z.id===config.zone||z.zoneId===config.zone);
const actor=zone.sourceActors.find(a=>a.id===config.id);
assert.equal(actor.name,config.name+' 34');assert.equal(actor.runtimeSprite,config.native);
assert.equal(actor.boss,false);assert.equal(actor.midboss,false);
const context={window:{}};
vm.runInNewContext(read('client-source/mob-art-variants-r306-data.js'),context);
const ids=context.window.__STORYWORLD_MOB_ART_VARIANTS_R306_DATA__.actors;
assert.equal(ids['STORY|'+config.id+'|'+config.name],'actor-3808047d926a');
assert.equal(ids['DREAM|'+config.id+'|'+config.name],'actor-89205ef0d4ad');
const pack=JSON.parse(wrapper.match(/^const G34_PACK=(.*);$/m)[1]);
for(const [dir,[dx,dy]] of Object.entries(config.directions)){
 assert.equal(pack[dir].path,config.pack+'guardian34-'+dir+'.webp');
 assert.equal(pack[dir].cell*pack[dir].n,1024);
 const P=[dx-dy,(dx+dy)/2];
 assert.deepEqual(P,{up:[0,-1],down:[0,1],right:[2,0],left:[-2,0]}[dir]);
}
assert.equal(checkURL('http://127.0.0.1:4396/m0/'),'http://127.0.0.1:4396/m0/');
for(const u of ['https://example.org/m0/','http://example.org/m0/','http://localhost/wrong/','http://localhost/m0/?renderer=legacy'])assert.throws(()=>checkURL(u));
console.log('Guardian34 CPU preflight PASS: exact STORY roster, distinct DREAM identity, four projection vectors, approved route and selectors (no browser)');
