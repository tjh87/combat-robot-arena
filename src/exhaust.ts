import * as THREE from 'three';
import {add,rotate,v} from './model';
import type {Simulation} from './sim';

// A fixed pool keeps the exhaust cost independent of match duration.
export class ExhaustPlume{
 readonly count=96;
 readonly positions=new Float32Array(this.count*3);
 readonly velocities=new Float32Array(this.count*3);
 readonly ages=new Float32Array(this.count).fill(-1);
 readonly clocks=[0,0];
 readonly points:THREE.Points;
 constructor(){
  const pixels=new Uint8Array(32*32*4);
  for(let y=0;y<32;y++)for(let x=0;x<32;x++){const i=(y*32+x)*4,r=Math.hypot((x-15.5)/15.5,(y-15.5)/15.5);pixels.set([220,229,235,Math.round(Math.max(0,1-r)**2*180)],i);}
  const texture=new THREE.DataTexture(pixels,32,32);texture.needsUpdate=true;
  const geometry=new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(this.positions,3));
  this.points=new THREE.Points(geometry,new THREE.PointsMaterial({map:texture,color:0xbcc9d0,size:.18,transparent:true,opacity:.6,depthWrite:false}));
  this.points.frustumCulled=false;this.reset();
 }
 reset(){this.ages.fill(-1);this.clocks.fill(0);for(let i=0;i<this.count;i++)this.positions[i*3+1]=-20;this.points.geometry.getAttribute('position').needsUpdate=true;}
 update(sim:Simulation,dt:number,reduced=false){
  this.points.visible=!reduced;if(reduced||dt<=0)return;
  for(const bot of sim.bots){const c=bot.compiled.config,w=c.weapon;if(c.chassis.profile!=='icewave'||w.type!=='horizontal_bar'||!sim.powered(bot)||!bot.modules.weapon_actuator.functional)continue;
   this.clocks[bot.id]+=dt*(bot.weaponOn?28:12);
   while(this.clocks[bot.id]>=1){this.clocks[bot.id]--;const i=this.ages.findIndex(a=>a<0);if(i<0)break;
    const q=bot.chassis.rotation(),p=add(bot.chassis.translation(),rotate(v(.01,w.mount.y+.29,.08),q)),jet=rotate(v(.07,.72,.37),q),velocity=bot.chassis.linvel();
    this.positions.set([p.x,p.y,p.z],i*3);this.velocities.set([jet.x+velocity.x*.25+(i%3-1)*.07,jet.y+velocity.y*.2,jet.z+velocity.z*.25],i*3);this.ages[i]=1.15;
   }
  }
  for(let i=0;i<this.count;i++){if(this.ages[i]<0){this.positions[i*3+1]=-20;continue;}this.ages[i]-=dt;this.velocities[i*3+1]+=.22*dt;for(let k=0;k<3;k++)this.positions[i*3+k]+=this.velocities[i*3+k]*dt;}
  this.points.geometry.getAttribute('position').needsUpdate=true;
 }
}
