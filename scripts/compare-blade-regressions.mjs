import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const before=JSON.parse(readFileSync(process.argv[2],'utf8')),after=JSON.parse(readFileSync(process.argv[3],'utf8'));
const key=name=>name.replace(/^Six requested weapons.*/,'Six requested weapons');
const baseline=new Map(before.map(row=>[key(row.name),row]));assert.equal(after.length,before.length);
const historical=[];for(const row of after){const old=baseline.get(key(row.name));assert(old);if(row.status==='failed'){assert.equal(old.status,'failed','New regression: '+row.name);assert.equal(row.error,old.error,'Changed failure: '+row.name);historical.push(row.name);}}
console.log('PASS Blade comparison: no new failures.',JSON.stringify({historical}));
