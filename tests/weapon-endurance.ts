import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {preset,RULES,SLOTS,ROSTER} from '../src/model';
import {Simulation,initializePhysics,neutral,Tournament} from '../src/sim';
const results:any[]=[];
await initializePhysics();
for(const pair of[[1,8],[4,10]]){
 const s=new Simulation([preset(pair[0]),preset(pair[1])],{practice:true,hazards:false,ai:[false,false],autoUnstick:false});
 try{for(let t=0;t<180*RULES.hz;t++){s.step(s.bots.map(b=>({...neutral(),weapon:t===0&&b.compiled.config.weapon.type!=='crusher'})) as any);assert.equal(s.fault,undefined);}
  const bots=s.bots.map(b=>{const w=b.compiled.config.weapon;assert(b.energy>0);assert.equal(SLOTS.filter(k=>b.modules[k].present&&!b.modules[k].functional).length,0);if('rpm'in w)assert(b.rpm>w.rpm*.85,b.compiled.config.identity.name+' stalled');return{name:b.compiled.config.identity.name,seconds:s.time,batteryPercent:b.energy/(b.compiled.config.battery.capacityWh*36),rpm:b.rpm};});results.push({status:'passed',name:'Three-minute no-hit endurance: '+bots.map(b=>b.name).join(' / '),bots});console.log('PASS',JSON.stringify(bots));
 }catch(error){process.exitCode=1;results.push({status:'failed',name:'Endurance '+pair.join('/'),error:String(error)});console.log('FAIL',String(error));}finally{s.dispose();writeFileSync('docs/weapon-endurance-results.json',JSON.stringify(results,null,2));}
}
try{let checked=0;for(let seed=0;seed<8;seed++){const t=new Tournament(preset(0),false,seed);try{for(const entry of t.entries){const index=ROSTER.findIndex(r=>r.profile===entry.config.chassis.profile);assert(entry.config.battery.capacityWh>=preset(index).battery.capacityWh);checked++;}}finally{t.dispose();}}results.push({status:'passed',name:'Tournament packs retain template capacity',checked});console.log('PASS tournament packs',checked);}catch(error){process.exitCode=1;results.push({status:'failed',name:'Tournament packs',error:String(error)});}writeFileSync('docs/weapon-endurance-results.json',JSON.stringify(results,null,2));
