import * as THREE from 'three';
import {rng,type Slot} from './model';
export const DAMAGE_DEBRIS={capacity:48,lifetime:2.6,minLoss:32};
export type FragmentSource={position:THREE.Vector3,center:THREE.Vector3,size:number,color:string,part:string};
export const fragmentKind=(slot:Slot)=>slot.startsWith('drive_')?'tire':slot==='weapon'?'tooth':slot==='battery'?'case':slot==='weapon_actuator'||slot==='self_right'?'mechanism':'plate';
export function fragmentCount(loss:number,max:number){const threshold=Math.max(DAMAGE_DEBRIS.minLoss,max*.04);return loss<threshold?0:Math.min(8,Math.floor(loss/threshold));}
type Fragment={mesh:THREE.Mesh<THREE.BufferGeometry,THREE.MeshStandardMaterial>,velocity:THREE.Vector3,spin:THREE.Vector3,born:number};
/** Cosmetic pieces use actual component HP loss. They add no physical force. */
export class DamageDebris{
 readonly root=new THREE.Group();private box=new THREE.BoxGeometry(1,1,1);private tire=new THREE.CylinderGeometry(.5,.5,1,7,1,false,0,Math.PI*.85);private hp=new Map<string,number>();private pending=new Map<string,number>();private fragments:Fragment[]=[];private serial=0;private time=0;
 constructor(){this.root.name='damage-component-fragments';}
 get count(){return this.fragments.length;}
 reset(){for(const piece of this.fragments){piece.mesh.removeFromParent();piece.mesh.material.dispose();}this.fragments=[];this.hp.clear();this.pending.clear();this.serial=0;this.time=0;}
 observe(bot:number,slot:Slot,hp:number,max:number,source:()=>FragmentSource|undefined,time:number,reduced=false){
  const key=bot+'/'+slot,previous=this.hp.get(key);this.hp.set(key,hp);if(previous===undefined||hp>previous||reduced){this.pending.set(key,0);return 0;}
  if(hp===previous)return 0;const loss=(this.pending.get(key)??0)+previous-hp,count=fragmentCount(loss,max);if(!count){this.pending.set(key,loss);return 0;}this.pending.set(key,Math.max(0,loss-count*Math.max(DAMAGE_DEBRIS.minLoss,max*.04)));const part=source();if(!part)return 0;
  const kind=fragmentKind(slot),random=rng(bot*100003+this.serial++*7919+Math.floor(time*240)),out=part.position.clone().sub(part.center);out.y=0;if(out.lengthSq()<.0001)out.set(1,0,0);out.normalize();
  for(let i=0;i<count;i++){
   if(this.fragments.length>=DAMAGE_DEBRIS.capacity){const old=this.fragments.shift()!;old.mesh.removeFromParent();old.mesh.material.dispose();}
   const rubber=kind==='tire',material=new THREE.MeshStandardMaterial({color:rubber?'#282d32':part.color,metalness:rubber?0:.75,roughness:rubber?.95:.45,transparent:true}),mesh=new THREE.Mesh(rubber?this.tire:this.box,material),size=Math.max(.025,Math.min(.18,part.size*(.10+random()*.13)));
   mesh.scale.set(size,rubber?size*.45:kind==='plate'||kind==='case'?size*.13:size*.6,size*(.6+random()*.6));mesh.position.copy(part.position);mesh.rotation.set(random()*Math.PI,random()*Math.PI,random()*Math.PI);mesh.userData={bot,module:slot,fragmentKind:kind,sourcePart:part.part,hpLoss:loss};mesh.name='fragment-'+bot+'-'+slot;this.root.add(mesh);
   const speed=1.2+Math.min(2,loss/max*4)+random();this.fragments.push({mesh,velocity:new THREE.Vector3(out.x*speed+(random()-.5),1.2+random()*1.7,out.z*speed+(random()-.5)),spin:new THREE.Vector3((random()-.5)*9,(random()-.5)*9,(random()-.5)*9),born:time});
  }return count;
 }
 step(time:number,reduced=false){if(time<this.time-.001){this.reset();this.time=time;return;}const dt=Math.min(.1,Math.max(0,time-this.time));this.time=time;for(let i=this.fragments.length-1;i>=0;i--){const piece=this.fragments[i],age=time-piece.born;if(reduced||age>=DAMAGE_DEBRIS.lifetime){piece.mesh.removeFromParent();piece.mesh.material.dispose();this.fragments.splice(i,1);continue;}piece.velocity.y-=9.81*dt;piece.mesh.position.addScaledVector(piece.velocity,dt);if(piece.mesh.position.y<.035){piece.mesh.position.y=.035;piece.velocity.y=Math.abs(piece.velocity.y)*.22;piece.velocity.x*=.8;piece.velocity.z*=.8;}piece.mesh.rotation.x+=piece.spin.x*dt;piece.mesh.rotation.y+=piece.spin.y*dt;piece.mesh.rotation.z+=piece.spin.z*dt;piece.mesh.material.opacity=Math.min(1,Math.max(0,(DAMAGE_DEBRIS.lifetime-age)/.6));}}
 dispose(){this.reset();this.box.dispose();this.tire.dispose();this.root.removeFromParent();}
}
