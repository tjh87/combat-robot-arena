import assert from 'node:assert/strict';
import * as THREE from 'three';
import {mkdirSync,writeFileSync} from 'node:fs';
import {FollowCamera} from '../src/follow-camera';
import {preset,compile,RULES} from '../src/model';
const results=[];
for(let index=0;index<11;index++)for(const tilt of[0,Math.PI/2,Math.PI]){
 const c=preset(index),rig=new FollowCamera(),camera=new THREE.PerspectiveCamera(60,16/9,.05,100),p=new THREE.Vector3(2,.3,-2),q=new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt,.7,tilt*.25));
 const result=rig.update(camera,p,q,c,compile(c).envelope,'bot',1/60,false);
 assert([...camera.position.toArray(),...result.target.toArray()].every(Number.isFinite));assert(camera.position.y>p.y+1);assert.equal(camera.up.y,1);assert.equal(camera.up.x,0);assert.equal(camera.up.z,0);
 const before=camera.position.clone();p.add(new THREE.Vector3(.6,.2,-.4));rig.update(camera,p,q,c,compile(c).envelope,'bot',1/60,false);assert(camera.position.clone().sub(before).distanceTo(new THREE.Vector3(.6,.2,-.4))<1e-10);
 p.set(RULES.floor/2-.15,.3,RULES.floor/2-.15);rig.update(camera,p,q,c,compile(c).envelope,'bot',1/60,false);assert(Math.abs(camera.position.x)<=RULES.floor/2-.35+1e-10);assert(Math.abs(camera.position.z)<=RULES.floor/2-.35+1e-10);
 results.push({index,tilt,finite:true,horizonStable:true,tracksTranslation:true,wallClearance:true});
}
mkdirSync('browser-evidence',{recursive:true});writeFileSync('browser-evidence/follow-camera.json',JSON.stringify({source:process.env.GITHUB_SHA,results},null,2));console.log('PASS follow camera for eleven robots, rolls, inversion, movement, and walls');
