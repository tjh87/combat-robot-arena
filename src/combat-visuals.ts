import * as THREE from 'three';
import {isSpinner,isHorizontal,clamp,weaponAxis,type BotConfig} from './model';

/** Exposure trails supplement, but never replace, the physical rotor pose. */
export function rotorMotion(config:BotConfig){
 const w=config.weapon,root=new THREE.Group();root.name='rotor-motion';
 if(!isSpinner(w))return root;
 root.userData.rotorMotion=true;
 const axis=weaponAxis(w),orientation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(axis.x,axis.y,axis.z));
 const twin=config.chassis.profile==='hypershock'&&w.type==='vertical_disc',offset=(w.width-Math.min(w.thickness,w.width*.28))/2;
 const levels=twin?[-offset,offset]:w.type==='drum'?[-w.width/2-.003,w.width/2+.003]:w.type==='shell_spinner'?[.012,w.width]:[0];
 for(const offset of levels){
  const disk=new THREE.Group();disk.quaternion.copy(orientation);disk.position.set(axis.x*offset,axis.y*offset,axis.z*offset);root.add(disk);
  for(let i=0;i<6;i++){
   // Short edge streaks show speed without covering the weapon with a disc.
   const inner=w.radius*(i%2?.972:.95),outer=w.radius*.998;
   const geo=new THREE.RingGeometry(inner,outer,8,1,i*Math.PI/3,.26);
   const material=new THREE.MeshBasicMaterial({color:i%2?'#e5eff5':config.identity.secondary,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,blending:THREE.AdditiveBlending});
   const mesh=new THREE.Mesh(geo,material);mesh.name='blade-tip-streak';mesh.userData.blurGain=i%2?.32:.22;mesh.userData.phase=i;disk.add(mesh);
  }
 }
 root.userData.targetRPM=w.rpm;root.userData.direction=w.direction;root.userData.horizontal=isHorizontal(w);root.visible=false;return root;
}

export function updateRotorMotion(rotor:THREE.Object3D|undefined,rpm:number,time:number,reduced=false,direction?:number){
 const root=rotor?.getObjectByName('rotor-motion');if(!root)return;
 const strength=clamp((rpm-90)/650,0,1);root.visible=strength>.01&&!reduced;
 if(!root.visible)return;
 for(const disk of root.children)for(const obj of disk.children){const mesh=obj as THREE.Mesh<THREE.BufferGeometry,THREE.MeshBasicMaterial>;
  mesh.material.opacity=strength*mesh.userData.blurGain;
  // Slightly different exposure phases prevent symmetric blades aliasing to stillness.
  mesh.rotation.z=-time*(7+Math.min(rpm/240,12))*(direction??root.userData.direction??1)-mesh.userData.phase*.11;
 }
}
