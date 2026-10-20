import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {test} from 'node:test';

const html=fs.readFileSync('_pages/docs/index.html','utf8');

function runtime(){
 const box={window:{},console,URL,performance,Float32Array};
 vm.createContext(box);
 vm.runInContext(fs.readFileSync('_pages/docs/dist/phase1.js','utf8'),box);
 return box.window.StoryPhase1;
}

test('R76 renderer uses a new URL so cached R75 code cannot pair with R76 HTML',()=>{
 assert.equal((html.match(/src="\.\/dist\/phase1\.js\?r76=1"/g)||[]).length,1);
 assert.doesNotMatch(html,/src="\.\/dist\/phase1\.js\?r75=1"/);
});

test('negative-bounds minimap paints the native boss core at its bounds-relative location',()=>{
 const start=html.indexOf('const miniBase=drawMini;drawMini=function()');
 assert.notEqual(start,-1,'expanded-layout minimap override exists');
 const draw=html.slice(start,start+6500);
 assert.match(draw,/core=layout\.originalEncounterBounds\|\|\[0,0,28,28\]/);
 assert.match(draw,/mini\.fillRect\(coreX,coreY,coreW,coreH\)/);
 assert.match(draw,/mini\.drawImage\(map\.image,coreX,coreY,coreW,coreH\)/);

 const layout=runtime().explorationLayout('last301','black-sea',false,{seedR73:75,worldR74:1,worldR75:1});
 const bounds=layout.bounds,core=layout.originalEncounterBounds;
 assert.deepEqual(JSON.parse(JSON.stringify(bounds)),[-28,-28,81,81]);
 assert.deepEqual(JSON.parse(JSON.stringify(core)),[1,1,29,29]);
 const scale=Math.min(180/(bounds[2]-bounds[0]),180/(bounds[3]-bounds[1]));
 const expected=[(core[0]-bounds[0])*scale,(core[1]-bounds[1])*scale];
 const boss=[(1-bounds[0])*scale,(1-bounds[1])*scale];
 assert.ok(Math.abs(expected[0]-boss[0])<1e-9&&Math.abs(expected[1]-boss[1])<1e-9);
 assert.ok(expected[0]>45&&expected[1]>45,'the original core belongs near the minimap center, not at its northwest corner');
});
