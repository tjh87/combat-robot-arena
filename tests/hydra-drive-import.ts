import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {preset,compile,copy,parseConfig,encodeBuild,decodeBuild,canonical} from '../src/model';
const current=preset(2);assert.equal(current.drive.hydraTuning,1);const old=copy(current);delete old.drive.hydraTuning;old.drive.ratio=14;assert.equal(parseConfig(old).drive.ratio,6.5);const manual=copy(current);manual.drive.ratio=14;assert.equal(parseConfig(manual).drive.ratio,14);assert.equal(canonical(decodeBuild(encodeBuild(manual))),canonical(manual));const invalid=copy(current);(invalid.drive as any).hydraTuning=2;assert.throws(()=>parseConfig(invalid));
assert.equal(JSON.stringify(Array.from({length:11},(_,i)=>compile(preset(i)).parts)),readFileSync('browser-evidence/parts-before.json','utf8'));
console.log(JSON.stringify({oldStockDriveUpdated:true,newCustomRatioPreserved:true,allElevenPhysicalAssembliesIdentical:true,customBuildLinkRoundTrip:true,invalidTuningRejected:true}));
