import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {preset,isSpinner,copy} from '../src/model';
import {physicalFit} from '../src/build-fit';
import {scratchBuild,addStructuralPart,templateParts,partKit} from '../src/builder-workshop';
mkdirSync('browser-evidence',{recursive:true});
const stock=[];
for(let index=0;index<11;index++){const config=preset(index),report=await physicalFit(config);stock.push({index,name:config.identity.name,...report});console.log(JSON.stringify(stock.at(-1)));}
writeFileSync('browser-evidence/builder-fit.json',JSON.stringify({stock},null,2));
assert(stock.every(r=>r.ok),'All stock robots must pass the physical fit check.');
const invalid=preset(0);if(isSpinner(invalid.weapon))invalid.weapon.mount.y=-.3;
assert.equal((await physicalFit(invalid)).ok,false);
const scratch=await physicalFit(scratchBuild());assert(scratch.ok,JSON.stringify(scratch));
const donor=templateParts(0).find(p=>!partKit(p)&&p.collides&&p.body==='chassis')!;
const blocked=addStructuralPart(scratchBuild(),0,donor.id);blocked.attachments![0].mount.y=-.5;
const rejected=await physicalFit(blocked);assert(!rejected.ok);assert(rejected.issues.some(i=>/floor|wheel/i.test(i.message)));
console.log('PASS physical fit for eleven stock robots, scratch, and floor-obstructing parts');
