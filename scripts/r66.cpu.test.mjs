import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {test} from 'node:test';
const html = fs.readFileSync('_pages/docs/index.html','utf8');
const source = fs.readFileSync('client-source/review-r66.js','utf8');
const context = {window:{},Intl,WeakMap};
vm.runInNewContext(source, context);
const api = context.window.__STORYWORLD_R66__;
const plain = x => JSON.parse(JSON.stringify(x));

test('generated production HTML parses every executable classic script',()=>{
  let count=0;
  for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if(/\bsrc=/.test(match[1]) || /type=["'](?:application\/json|module)/.test(match[1])) continue;
    new vm.Script(match[2],{filename:'runtime-inline-'+(++count)+'.js'});
  }
  assert.ok(count>50);
  assert.equal((html.match(/<script id="review-r66">/g)||[]).length,1);
  assert.equal(html.includes('targetCooldowns'),false);
});

test('player base damage doubles without changing native level, EGO or samong ratios',()=>{
  const old=fs.readFileSync('docs/index.html','utf8').match(/function attackPower\(\)\{[^\n]+?\}/)[0];
  const next=html.match(/function attackPower\(\)\{[^\n]+?\}/)[0];
  for(const [ego,samong] of [[0,0],[3,0],[0,7]]) for(const level of [1,15,90]) {
    const globals={HEROES:{hwando:{power:50}},player:{hero:'hwando',ego,samong,level},rank:k=>k==='power'?3:2};
    const a=vm.runInNewContext(old+';attackPower()',globals);
    const b=vm.runInNewContext(next+';attackPower()',globals);
    assert.equal(b,a*2);
  }
  assert.ok(html.includes('const base=attackPower()*2*(.22+Math.min(.08,skillRank*.006))'));
  for(const rank of [0,1,5,10,100]) {
    const before=50*(.22+Math.min(.08,rank*.006));
    const after=100*2*(.22+Math.min(.08,rank*.006));
    assert.equal(after,before*4);
    assert.ok(Math.abs((after/3)*3-after)<1e-10);
  }
});

test('cooldowns are 20 seconds normally and 4 seconds in EGO; transition clamps once',()=>{
  let now=0;const p={ego:0},tracker=api.createCooldownTracker({now:()=>now,isActive:p=>p.ego>0});
  tracker.start(p);assert.equal(tracker.remaining(p),20);
  now=2;p.ego=3;assert.equal(tracker.remaining(p),4);
  now=3;assert.equal(tracker.remaining(p),3);
  now=3.5;p.ego=0;assert.equal(tracker.remaining(p),2.5);
  now=6;p.ego=1;tracker.start(p);assert.equal(tracker.remaining(p),4);
  for(let i=0;i<1000;i++)assert.equal(tracker.remaining(p),4);
});

test('new actors, co-op participants, and restarted clocks do not inherit stale cooldowns',()=>{
  let now=100;const tracker=api.createCooldownTracker({now:()=>now,isActive:p=>!!p.awake});
  const a={id:'local'},b={id:'local'},c={id:'guest'};
  tracker.start(a);assert.equal(tracker.remaining(a),20);assert.equal(tracker.remaining(b),0);
  c.awake=true;tracker.start(c);assert.equal(tracker.remaining(c),4);assert.equal(tracker.remaining(a),20);
  now=0;assert.equal(tracker.remaining(a),0);
});

test('both temporary EGO and the native transformed EGO visit select the reduction',()=>{
  context.isEgoVisit151=()=>false;assert.equal(api.isEgo({ego:1}),true);assert.equal(api.isEgo({ego:0}),false);
  context.isEgoVisit151=()=>true;assert.equal(api.isEgo({ego:0}),true);assert.equal(api.isEgo(null),false);
});

test('target ordering, ties, range, and dead-enemy exclusions are unchanged',()=>{
  let seed=42;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  for(let run=0;run<200;run++){
    const p={x:rnd()*30,y:rnd()*30};
    const enemies=Array.from({length:100},(_,i)=>({id:i,x:rnd()*30,y:rnd()*30,hp:i%7?1:0,deadRecorded:i%11===0}));
    enemies.push({id:'tie1',x:p.x+1,y:p.y,hp:1},{id:'tie2',x:p.x-1,y:p.y,hp:1});
    const expected=enemies.filter(e=>e&&e.hp>0&&!e.deadRecorded&&distance(p,e)<=11).sort((a,b)=>distance(p,a)-distance(p,b));
    assert.deepEqual(plain(api.selectTargets(enemies,p,11,distance).map(e=>e.id)),expected.map(e=>e.id));
    assert.equal(api.hasTargets(enemies,p,11,distance),expected.length>0);
  }
});

test('presence check short circuits instead of sorting every living enemy',()=>{
  const p={x:0,y:0},enemies=Array.from({length:200},(_,id)=>({id,x:1,y:0,hp:1}));let calls=0;
  const found=api.hasTargets(enemies,p,12,(a,b)=>{calls++;return Math.hypot(a.x-b.x,a.y-b.y);});
  assert.equal(found,true);assert.equal(calls,1);
  assert.ok(html.includes('if(hasTargetsR66(12)){'));
  assert.ok(!html.includes('!available(p)||!validTargets(11).length'));
});

test('overlay does not add loops, change narrative records, or alter save/difficulty source',()=>{
  assert.ok(!/requestAnimationFrame|setInterval|setTimeout/.test(source));
  const old=fs.readFileSync('docs/index.html','utf8');
  for(const id of ['portable-data','story-campaign-data-r54','coop-sim-r62']) {
    const pattern=new RegExp('<script[^>]*id="'+id+'"[^>]*>([\\s\\S]*?)<\\/script>');
    assert.equal(html.match(pattern)?.[1],old.match(pattern)?.[1],id);
  }
  const manifest=JSON.parse(fs.readFileSync('_pages/docs/web-manifest-r62.json','utf8'));
  assert.equal(manifest.webHTMLSha256,crypto.createHash('sha256').update(html).digest('hex'));
  assert.equal(manifest.r66.mediaChanged,false);
});
