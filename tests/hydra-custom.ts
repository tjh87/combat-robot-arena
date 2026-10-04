import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {preset,compile,copy} from '../src/model';
const c=preset(2),stock=compile(c),before=readFileSync('browser-evidence/before-default.json','utf8');assert.equal(JSON.stringify(stock.parts),before,'Default Hydra geometry and mass must remain identical.');
const thick=copy(c);assert(thick.weapon.type==='flipper');thick.weapon.thickness=.040;const heavy=compile(thick);assert(heavy.mass>stock.mass);assert(heavy.rotorInertia>stock.rotorInertia);assert(heavy.errors.some(e=>e.field==='mass'),'Custom thickness must retain the normal mass limit.');
const light=copy(c);assert(light.weapon.type==='flipper');light.weapon.material='titanium';const titanium=compile(light);assert.deepEqual(titanium.errors,[]);assert(titanium.mass<stock.mass);assert(titanium.rotorInertia<stock.rotorInertia);assert(titanium.parts.filter(p=>p.id.startsWith('flipper_tine_')).every(p=>p.material==='titanium'));
console.log(JSON.stringify({defaultPartsIdentical:true,stockMass:stock.mass,thickMass:heavy.mass,titaniumMass:titanium.mass,customMassLimit:true,customTineMaterial:true}));
