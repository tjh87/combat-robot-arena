import * as THREE from 'three';
import {RULES,clamp,cross,rotate,v,type Vec} from './model';
import type {Simulation} from './sim';

const SMOKE_COUNT=160,MARK_COUNT=768;
type WheelPoint={x:number,z:number};

// A rolling tire has little speed at the floor. Sliding contact and pushing
// pressure create effects; airborne wheels cannot leave smoke or marks.
export function tireStress(slip:number,command:number,pushImpulse:number){
 const slide=clamp((slip-.20)/1.6,0,1),push=clamp(pushImpulse/2.5,0,1);
 return clamp(slide*(.3+.7*clamp(command,0,1)+push*.56),0,1);
}
export function skidStrength(slip:number,speed:number,yawRate:number,braking:number,pushImpulse:number){
 const slide=clamp((slip-.30)/2,0,1);
 const pace=clamp(speed/5,0,1),turn=clamp(Math.abs(yawRate)/4,0,1),push=clamp(pushImpulse/5,0,1);
 return slide*clamp(.08+.48*pace+.24*turn+.20*clamp(braking,0,1)+.10*push,0,1);
}

function softTexture(width:number,height:number,streak=false){
 const data=new Uint8Array(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const dx=Math.abs((x+.5-width/2)/(width/2)),dy=Math.abs((y+.5-height/2)/(height/2));
  const fall=streak?Math.pow(Math.max(0,1-dx*dx),2)*Math.min(1,(1-dy)*8):Math.pow(Math.max(0,1-Math.hypot(dx,dy)),2);
  const noise=streak?.70+.25*Math.sin(y*2.1+x*1.9):1,j=(y*width+x)*4;
  data.set([255,255,255,Math.round(255*fall*noise)],j);
 }
 const texture=new THREE.DataTexture(data,width,height,THREE.RGBAFormat);texture.needsUpdate=true;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearFilter;return texture;
}

export class TireEffects{
 readonly positions=new Float32Array(SMOKE_COUNT*3);
 readonly velocities=new Float32Array(SMOKE_COUNT*3);
 readonly ages=new Float32Array(SMOKE_COUNT).fill(-1);
 readonly lives=new Float32Array(SMOKE_COUNT);
 readonly smoke:THREE.Points;
 readonly marks:THREE.InstancedMesh;
 private clocks=new Map<string,number>();
 private markClocks=new Map<string,number>();
 private previous=new Map<string,WheelPoint>();
 private markIndex=0;
 private puffIndex=0;
 private stamp=new THREE.Object3D();
 private floorColor=new THREE.Color(0x3c4248);
 private rubberColor=new THREE.Color(0x13171b);
 private streakColor=new THREE.Color();
 constructor(){
  const smokeGeometry=new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(this.positions,3));
  this.smoke=new THREE.Points(smokeGeometry,new THREE.PointsMaterial({map:softTexture(32,32),color:0xb9bdba,size:.24,transparent:true,opacity:.58,depthWrite:false}));
  this.smoke.frustumCulled=false;
  const surface=new THREE.PlaneGeometry(1,1);surface.rotateX(-Math.PI/2);
  this.marks=new THREE.InstancedMesh(surface,new THREE.MeshBasicMaterial({map:softTexture(32,64,true),color:0xffffff,transparent:true,opacity:.30,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1}),MARK_COUNT);
  this.marks.count=0;this.marks.frustumCulled=false;this.reset();
 }
 reset(){
  this.ages.fill(-1);this.clocks.clear();this.markClocks.clear();this.previous.clear();this.markIndex=this.puffIndex=0;this.marks.count=0;
  for(let i=0;i<SMOKE_COUNT;i++)this.positions[i*3+1]=-20;
  this.smoke.visible=false;this.smoke.geometry.getAttribute('position').needsUpdate=true;
 }
 private puff(point:Vec,velocity:Vec,intensity:number){
  const i=this.puffIndex++%SMOKE_COUNT,j=i*3,spread=(i*97%23)/22-.5;
  this.positions.set([point.x+spread*.045,Math.max(.025,point.y),point.z-spread*.03],j);
  this.velocities.set([velocity.x*.25+spread*.22,.24+intensity*.68,velocity.z*.25-spread*.15],j);
  this.ages[i]=this.lives[i]=.58+intensity*.60;
 }
 private mark(from:WheelPoint,to:WheelPoint,width:number,strength:number){
  const dx=to.x-from.x,dz=to.z-from.z,distance=Math.hypot(dx,dz);
  if(distance<.015||distance>.34)return;
  const slot=this.markIndex++%MARK_COUNT;
  this.stamp.position.set((from.x+to.x)/2,.004,(from.z+to.z)/2);
  this.stamp.rotation.set(0,Math.atan2(dx,dz),0);
  this.stamp.scale.set(width*(.30+.35*strength),1,distance+.008);
  this.stamp.updateMatrix();this.marks.setMatrixAt(slot,this.stamp.matrix);
  this.marks.setColorAt(slot,this.streakColor.copy(this.floorColor).lerp(this.rubberColor,strength));
  this.marks.count=Math.max(this.marks.count,slot+1);this.marks.visible=true;
  this.marks.instanceMatrix.needsUpdate=true;if(this.marks.instanceColor)this.marks.instanceColor.needsUpdate=true;
 }
 update(sim:Simulation,dt:number,reduced=false){
  this.smoke.visible=!reduced&&this.ages.some(age=>age>=0);this.marks.visible=!reduced&&this.marks.count>0;
  if(reduced||dt<=0)return;
  const live=new Set<string>();
  for(const bot of sim.bots)for(const [id,wheel]of bot.bodies){
   if(!id.startsWith('wheel_'))continue;
   const key=`${bot.id}:${id}`,p=wheel.translation(),radius=bot.compiled.config.drive.radius;
   const axis=rotate(v(1,0,0),wheel.rotation());
   const onFloor=p.y<=radius+.024&&p.y>=radius*.4&&Math.abs(axis.y)<.55&&Math.abs(p.x)<RULES.floor/2&&Math.abs(p.z)<RULES.floor/2;
   if(!onFloor){this.previous.delete(key);this.clocks.delete(key);this.markClocks.delete(key);continue;}
   live.add(key);
   const velocity=wheel.linvel(),turn=wheel.angvel(),contact=cross(turn,v(0,-radius,0));
   const slipX=velocity.x+contact.x,slipZ=velocity.z+contact.z,slip=Math.hypot(slipX,slipZ);
   const side=id.includes('_-1_')?0:1,command=Math.abs(side?bot.command.right:bot.command.left);
   const intensity=tireStress(slip,command,sim.pushImpulse[bot.id]);
   const chassisVelocity=bot.chassis.linvel(),speed=Math.hypot(chassisVelocity.x,chassisVelocity.z),forward=sim.forward(bot);
   const throttle=(bot.command.left+bot.command.right)/2;
   const braking=clamp(-throttle*(chassisVelocity.x*forward.x+chassisVelocity.z*forward.z)/3,0,1);
   const strength=skidStrength(slip,speed,bot.chassis.angvel().y,braking,sim.pushImpulse[bot.id]);
   const current={x:p.x,z:p.z},previous=this.previous.get(key);
   if(strength>.12&&slip>.48&&previous){
    const moved=Math.hypot(current.x-previous.x,current.z-previous.z);
    if(moved>=.015)this.mark(previous,current,bot.compiled.config.drive.width,strength);
    else if(slip>.75){
     const clock=(this.markClocks.get(key)??0)+dt;
     if(clock>=.25){
      const x=slipX/slip*.025,z=slipZ/slip*.025;
      this.mark({x:p.x-x,z:p.z-z},{x:p.x+x,z:p.z+z},bot.compiled.config.drive.width,strength);
     }
     this.markClocks.set(key,clock>=.25?clock%.25:clock);
    }
   }else this.markClocks.delete(key);
   this.previous.set(key,current);
   const rate=intensity>.10?4+38*intensity:0,clock=(this.clocks.get(key)??0)+dt*rate;
   const count=Math.min(4,Math.floor(clock));this.clocks.set(key,rate?clock-count:0);
   for(let n=0;n<count;n++)this.puff(v(p.x,.022,p.z),v(velocity.x,0,velocity.z),intensity);
  }
  for(const key of this.previous.keys())if(!live.has(key)){this.previous.delete(key);this.clocks.delete(key);this.markClocks.delete(key);}
  for(let i=0;i<SMOKE_COUNT;i++){
   const j=i*3;if(this.ages[i]<0){this.positions[j+1]=-20;continue;}
   this.ages[i]-=dt;if(this.ages[i]<=0){this.positions[j+1]=-20;continue;}
   const fade=this.ages[i]/this.lives[i];
   this.velocities[j]*=Math.exp(-1.6*dt);this.velocities[j+2]*=Math.exp(-1.6*dt);
   this.positions[j]+=this.velocities[j]*dt;
   this.positions[j+1]+=(this.velocities[j+1]+.18*(1-fade))*dt;
   this.positions[j+2]+=this.velocities[j+2]*dt;
  }
  this.smoke.visible=this.ages.some(age=>age>=0);if(this.smoke.visible)this.smoke.geometry.getAttribute('position').needsUpdate=true;
 }
}
