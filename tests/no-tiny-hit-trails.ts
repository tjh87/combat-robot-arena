import assert from 'node:assert/strict';
import {HitReadouts,roundedDamage} from '../src/hit-readouts';
import {writeFileSync} from 'node:fs';
const rows=[];
for(const interval of[1,4,12]){
 const r=new HitReadouts(),events=[0,1].map(bot=>({id:bot+1,cause:'weapon',point:{x:0,y:1,z:0},allocations:[{bot,hp:80}]})) as any;
 r.update(events,0);let tiny=0,afterExpiry=0;
 for(let tick=interval;tick<=720;tick+=interval){for(const e of events)e.allocations[0].hp+=1;const hits=r.update(events,tick);tiny+=hits.filter(h=>roundedDamage(h.hp)<=1).length;if(tick>312)afterExpiry+=hits.length;}
 assert.equal(tiny,0,'Do not create 1 HP readouts');assert.equal(afterExpiry,0,'Do not create new bubbles from trailing 1 HP increments');
 assert.equal(events[0].allocations[0].hp,80+720/interval);
 events[0].allocations[0].hp+=25;assert.equal(r.update(events,724).length,1,'Keep the next real hit');
 rows.push({intervalTicks:interval,robots:2,tinyReadouts:tiny,trailingBubbles:afterExpiry,exactDamage:events[0].allocations[0].hp});
}
const crush=new HitReadouts(),e:any={id:9,cause:'crush',releasedTick:60,point:{x:0,y:0,z:0},allocations:[{bot:1,hp:20.25}]};assert.equal(crush.update([e],60)[0].hp,20.25);
writeFileSync('docs/no-tiny-hit-trails-results.json',JSON.stringify({rows,crushSummaryPreserved:true},null,2));console.log('PASS',JSON.stringify(rows));
