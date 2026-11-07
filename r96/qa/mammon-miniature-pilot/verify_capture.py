"""Focused CPU-only checks for the real capture recorder's identity and input witnesses."""
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import unittest

ROOT = Path(__file__).resolve().parent

def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

sequence = load("sequence_under_test", ROOT / "combat_sequence.py")
browser = load("capture_under_test", ROOT / "browser-check.py")

# The real JavaScript is evaluated against a small browser-like environment.
# This checks the telemetry itself, not Chrome, pixels, or actual gameplay.
JS_ENV = """
const fs=require('node:fs');
const code=JSON.parse(fs.readFileSync(0,'utf8')),assert=require('node:assert/strict');
function run(source,...a){return new Function(source)(...a)}
globalThis.window=globalThis;
Object.assign(globalThis,{innerWidth:390,innerHeight:844,devicePixelRatio:3,
  layer:'STORY', time:3, loading:false,modal:false,storyScene:null,performance:{now(){return 123}}},
  {player:{id:'hero',x:0,y:0,hp:777,combo:0,attackCD:0},room:{id:'ep1b06',encounterStage:'route',enemies:[]}});
const obj={id:'native-14',x:1,y:0,hp:787,maxHp:787,spawnState:'active',deadRecorded:false};
room.enemies=[obj];
const canvas3={getBoundingClientRect:()=>({left:0,top:0,right:390,bottom:844,width:390,height:844})};
globalThis.document={getElementById:k=>canvas3,elementFromPoint:()=>canvas3};
class Vec {constructor(x,y,z){this.x=x;this.y=y;this.z=z} project(){this.x=0;this.y=0;this.z=0;return this}}
window.__STORYWORLD_PHASE1__={controller:{state:{three:{T:{Vector3:Vec},camera:{},serial:2}}},inspect:()=>({active:'three'})};
window.__STORYWORLD_ENEMY_STATUS24__={snapshot:()=>({enemies:room.enemies.map(e=>({...e,active:e.hp>0,
  sightVisible:true,image:{ready:true},renderEligible:true,footOnScreen:true,combatLineClear:true}))})};
"""

def node(js, data):
    out = subprocess.run(["node", "-e", JS_ENV + js], input=json.dumps(data),
                         capture_output=True, text=True)
    if out.returncode:
        raise AssertionError(out.stderr)
    return out.stdout.strip()


class Telemetry(unittest.TestCase):
    def test_real_start_fixture_and_hit_oracle(self):
        # The key here is a mock event, so this exercises the branches that handle
        # trusted browser input; it does not itself establish trusted input in Chrome.
        encoded = node("""
          Object.assign(globalThis,{guide:false,auto:false,route:[],command:null,
            HEROES:{hero:{range:2.6}},visible3:()=>true,renderable3:()=>true,
            blocked:()=>false,clearLine:()=>true,canvas:canvas3});
          obj.id='ep1b06:r75-pack:14';obj.homeX=1;obj.homeY=0;
          room.exploration={floorCells:[[0,0],[1,0],[2,0],[0,1],[1,1]]};
          player.hero='hero';player.attackAnim=0;player.attackCD=0;
          const callbacks=new Map(),events=new Map();let request=0;
          window.addEventListener=(name,cb,capture)=>{assert.equal(capture,true);events.set(name,cb)};
          window.removeEventListener=(name,cb,capture)=>{assert.equal(capture,true);if(cb===events.get(name))events.delete(name)};
          window.requestAnimationFrame=cb=>{callbacks.set(++request,cb);return request};
          window.cancelAnimationFrame=id=>callbacks.delete(id);
          const id=obj.id, marker=run(code.fixture,null,[]);
          assert.equal(marker.enemyId,id);assert.equal(obj.hp,787);assert.equal(room.enemies[0],obj);
          const tracked=window.__mammonQaEncounter, key=events.get('keydown'), frame=callbacks.get(tracked.request);
          const read=()=>run(code.evidence,'combat',marker);
          const pre=read();assert(pre.foes.some(a=>a.id===id));assert.equal(pre.nativeCombat.sameObjectTracked,true);
          for(const [name,isTrusted,repeat] of [['x',true,false],['1',false,false],['1',true,true]]) {
              key({key:name,isTrusted,repeat});assert.equal(tracked.active,true);
              assert.equal(read().nativeCombat.trustedAttackInputObserved,false);
          }
          key({key:'1',isTrusted:true,repeat:false});assert.equal(tracked.active,false);assert.equal(events.has('keydown'),false);
          assert.equal(read().nativeCombat.inputStart.originalInRoom,true);
          assert.equal(read().nativeCombat.inputStart.enemy.hp,787);
          const startHP=obj.hp, startHero=player.hp;player.x=5;player.y=6;obj.x=9;obj.y=10;
          frame();assert.deepEqual([player.x,player.y,obj.x,obj.y],[5,6,9,10]);
          assert.equal(obj.hp,startHP);assert.equal(player.hp,startHero);
          room.enemies=[];player.combo++;
          const removal=read();
          obj.hp=0;obj.deadRecorded=true;const death=read();
          room.enemies=[{...obj,hp:1,deadRecorded:false}];const impostor=read();
          assert.equal(impostor.nativeCombat.identityReplaced,true);
          const noKey=JSON.parse(JSON.stringify(death));noKey.nativeCombat.trustedAttackInputObserved=false;
          const noAct=JSON.parse(JSON.stringify(death));
          noAct.nativeCombat.heroCombo=pre.nativeCombat.heroCombo;noAct.nativeCombat.heroAttackAnimation=0;
          noAct.nativeCombat.heroAttackCD=pre.nativeCombat.heroAttackCD;
          delete window.__mammonQaEncounter;
          console.log(JSON.stringify({id,pre,removal,death,impostor,noKey,noAct}));
        """,{"fixture":browser.COMBAT_APPROACH,"evidence":browser.EVIDENCE})
        values=json.loads(encoded)
        def check(after):
            return browser.target_hit(values["pre"],values[after],values["id"])
        self.assertFalse(check("removal")["targetDeathConfirmed"])
        self.assertFalse(check("removal")["nativeActionObserved"])
        self.assertTrue(check("death")["targetDeathConfirmed"])
        self.assertTrue(check("death")["nativeActionObserved"])
        self.assertFalse(check("impostor")["nativeActionObserved"])
        self.assertFalse(check("noKey")["nativeActionObserved"])
        self.assertFalse(check("noAct")["nativeActionObserved"])

    def test_touch_witness_requires_native_button_and_touch(self):
        node("""
          Object.assign(globalThis,{guide:false,auto:false,route:[],command:null,
            HEROES:{hero:{range:2.6}},visible3:()=>true,renderable3:()=>true,
            blocked:()=>false,clearLine:()=>true,canvas:canvas3});
          obj.id='ep1b06:r75-pack:14';obj.homeX=1;obj.homeY=0;player.hero='hero';player.attackAnim=0;
          room.exploration={floorCells:[[0,0],[1,0],[2,0],[0,1],[1,1]]};
          const events=new Map();
          window.addEventListener=(k,fn)=>events.set(k,fn);window.removeEventListener=(k,fn)=>events.delete(k);
          window.requestAnimationFrame=()=>1;window.cancelAnimationFrame=()=>{};
          const m=run(code.fixture,null,[],'touch'),watch=window.__mammonQaEncounter;
          const button={textContent:'기본 공격',closest(){return this}};
          const ev={target:button,isTrusted:true};
          events.get('keydown')({key:'1',isTrusted:true});
          events.get('pointerdown')({...ev,pointerType:'mouse'});events.get('click')(ev);
          assert(watch.active);assert.equal(watch.input,null);
          events.get('pointerdown')({...ev,pointerType:'touch'});events.get('click')({...ev,isTrusted:false});
          assert(watch.active);assert.equal(watch.input,null);
          events.get('click')(ev);
          assert.equal(watch.input.control,'touch-native-basic');assert(watch.input.trusted&&watch.input.clearInRange);
          assert(!watch.active);assert.equal(watch.enemy,obj);assert.equal(obj.hp,787);
        """,{"fixture":browser.COMBAT_APPROACH})

    def test_observer_retains_the_original_native_object(self):
        node("""
          const id=obj.id, slot='__qa';
          assert.equal(run(code.watch,id,slot),true);
          const state=()=>run(code.snapshot,id,slot);
          assert.equal(state().targetReportedVisible,true);
          room.enemies.length=0;
          assert.equal(state().target.hp,787);
          assert.equal(state().target.deadRecorded,false);
          assert.equal(state().targetReportedVisible,false);
          const impostor={...obj,hp:0,deadRecorded:true};room.enemies.push(impostor);
          assert.equal(state().target.hp,787);
          assert.equal(state().target.deadRecorded,false);
          assert.equal(state().targetInRoom,false);
          obj.hp=0;obj.deadRecorded=true;
          assert.equal(state().target.hp,0);
          assert.equal(state().target.deadRecorded,true);
          room={id:'another',enemies:[impostor]};
          assert.equal(state().target,null);
        """, {"watch":sequence.WATCH,"snapshot":sequence.SNAPSHOT})

if __name__=="__main__":
    unittest.main(verbosity=2)
