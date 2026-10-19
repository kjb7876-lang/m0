import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {test} from 'node:test';

test('repeated ready-image audit binds one listener and still records source changes and both UI scopes',()=>{
 const listeners=[],records=[],img={complete:true,naturalWidth:64,naturalHeight:48,id:'awakeImage',path:'first.webp',addEventListener(type,fn){listeners.push({type,fn});}};
 const c={WeakMap,Set,imagePathFromElement5:im=>im.path,recordEvidence5:(key,path,detail)=>records.push({key,path,detail})};vm.createContext(c);vm.runInContext(fs.readFileSync('client-source/dom-image-evidence-r73.js','utf8'),c);
 const root={querySelectorAll:()=>[img]};for(let i=0;i<100;i++)c.recordDomImages5(root,'ui');assert.equal(listeners.length,1);assert.equal(records.length,100);
 c.recordDomImages5(root,'panel');img.path='second.webp';img.naturalWidth=96;listeners[0].fn();assert.deepEqual(records.slice(-2).map(r=>r.key),['ui:awakeImage','panel:awakeImage']);assert.ok(records.slice(-2).every(r=>r.path==='second.webp'&&r.detail.dimensions[0]===96));
 const count=records.length;img.complete=false;c.recordDomImages5(root,'ui');listeners[0].fn();assert.equal(records.length,count);assert.equal(listeners.length,1);
});
