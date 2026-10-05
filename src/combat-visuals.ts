import {componentConfig,componentProfile} from './model';
import {enhancedRotorExposure,updateEnhancedExposure} from './weapon-exposure';
import {sawbladeExposure,updateSawbladeExposure} from './sawblaze-blur';
import * as THREE from 'three';
import {isSpinner,isHorizontal,clamp,weaponAxis,type BotConfig} from './model';

const usesLegacyExposure=(c:BotConfig):boolean=>c.chassis.profile==='whyachi';
const EXPOSURE_SECONDS=1/90,SWEEP_STEPS=24,SWEEP_RINGS=4;

// A short angular exposure of the actual rotor. One small, reusable mesh per
// cutting level replaces the six separate horizontal tip streaks.
function horizontalSweep(radius:number,inner:number,blades:number,phase:number,color:string){
 const geometry=new THREE.BufferGeometry(),count=blades*(SWEEP_STEPS+1)*SWEEP_RINGS;
 geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(count*3),3).setUsage(THREE.DynamicDrawUsage));
 const colors=new Float32Array(count*4),indices:number[]=[],paint=new THREE.Color(color),steel=new THREE.Color('#c5cdd1');
 for(let blade=0;blade<blades;blade++)for(let step=0;step<=SWEEP_STEPS;step++)for(let ring=0;ring<SWEEP_RINGS;ring++){
  const i=(blade*(SWEEP_STEPS+1)+step)*SWEEP_RINGS+ring,t=step/SWEEP_STEPS;
  const tint=ring<2?paint:steel,fade=Math.sin(Math.PI*t)**.65*(1-.65*t),edge=ring===0||ring===SWEEP_RINGS-1?0:1;
  colors.set([tint.r,tint.g,tint.b,fade*edge],i*4);
  if(step<SWEEP_STEPS&&ring<SWEEP_RINGS-1)indices.push(i,i+SWEEP_RINGS,i+1,i+1,i+SWEEP_RINGS,i+SWEEP_RINGS+1);
 }
 geometry.setAttribute('color',new THREE.BufferAttribute(colors,4));geometry.setIndex(indices);
 geometry.boundingSphere=new THREE.Sphere(new THREE.Vector3(),radius);
 geometry.userData={radius,inner,blades,phase};
 const material=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true});
 const mesh=new THREE.Mesh(geometry,material);mesh.name='horizontal-weapon-blur';mesh.userData.horizontalBlur=true;
 return mesh;
}

function updateHorizontalSweep(mesh:THREE.Mesh<THREE.BufferGeometry,THREE.MeshBasicMaterial>,rpm:number,direction:number,strength:number){
 const geometry=mesh.geometry,data=geometry.userData;
 mesh.material.opacity=.58*strength;
 // Geometry is shared with replay clones. Cache against the buffer itself so
 // returning from a replay restores the live exposure even at unchanged RPM.
 if(Math.abs((data.rpm??-100)-rpm)<.5&&data.direction===direction)return;
 data.rpm=rpm;data.direction=direction;
 const {radius,inner,blades,phase}=data,span=Math.min(Math.PI*2/blades,rpm*Math.PI/30*EXPOSURE_SECONDS);
 data.exposureAngle=span;
 const positions=geometry.getAttribute('position') as THREE.BufferAttribute;
 const radii=[radius*inner,radius*(inner+.08*(1-inner)),radius*.985,radius];
 for(let blade=0;blade<blades;blade++)for(let step=0;step<=SWEEP_STEPS;step++){
  const angle=phase+blade*Math.PI*2/blades-direction*span*step/SWEEP_STEPS,c=Math.cos(angle),s=Math.sin(angle);
  for(let ring=0;ring<SWEEP_RINGS;ring++)positions.setXYZ((blade*(SWEEP_STEPS+1)+step)*SWEEP_RINGS+ring,c*radii[ring],s*radii[ring],-(data.inclination??0)*radii[ring]);
 }
 positions.needsUpdate=true;
}

/** Exposure trails supplement, but never replace, the physical rotor pose. */
export function rotorMotion(config:BotConfig){config=componentConfig(config,'weapon');
 if(config.chassis.profile==='sawblaze'&&config.weapon.type==='hammer_saw')return sawbladeExposure(config);
 if(!usesLegacyExposure(config))return enhancedRotorExposure(config);
 const w=config.weapon,root=new THREE.Group();root.name='rotor-motion';
 if(!isSpinner(w))return root;
 root.userData.rotorMotion=true;
 const axis=weaponAxis(w),orientation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(axis.x,axis.y,axis.z));
 root.userData.targetRPM=w.rpm;root.userData.direction=w.direction;root.userData.horizontal=isHorizontal(w);root.visible=false;
 if(isHorizontal(w)){
  const shell=w.type==='shell_spinner',bar=w.type==='horizontal_bar',ro=w.radius-w.toothDepth;
  const levels=shell?[{height:.009+w.toothHeight/2+.003,radius:w.radius,phase:-Math.PI/2,blades:w.teeth},{height:w.width*.75+.027,radius:ro*.88,phase:-Math.PI/3,blades:3}]:[{height:Math.max(w.thickness,w.toothHeight)/2+.003,radius:w.radius,phase:bar?0:-Math.PI/2,blades:bar?2:3}];
  const color=bar?(config.chassis.profile==='icewave'?'#b66040':'#ad4850'):shell?'#919ba3':'#66727d';
  for(const level of levels){const disk=new THREE.Group();disk.quaternion.copy(orientation);disk.position.y=level.height;const sweep=horizontalSweep(level.radius,shell?.82:bar?.13:.25,level.blades,level.phase,color);if(config.chassis.profile==='whyachi'&&w.type==='horizontal_cage'){disk.position.y+=.05;sweep.geometry.userData.inclination=Math.sin(8*Math.PI/180);}disk.add(sweep);root.add(disk);}
  root.userData.exposureSeconds=EXPOSURE_SECONDS;return root;
 }
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
 return root;
}

export function updateRotorMotion(rotor:THREE.Object3D|undefined,rpm:number,time:number,reduced=false,direction?:number){
 const root=rotor?.getObjectByName('rotor-motion');if(!root)return;
 if(root.userData.sawbladeExposure){updateSawbladeExposure(rotor!,root,rpm,reduced,Math.sign(direction??root.userData.direction??1)||1);return;}
 if(root.userData.enhancedExposure){updateEnhancedExposure(root,rpm,reduced,direction);return;}
 const speed=Number.isFinite(rpm)?Math.abs(rpm):0,strength=clamp((speed-90)/(root.userData.horizontal?1000:650),0,1);root.visible=strength>.01&&!reduced;
 if(!root.visible)return;
 if(root.userData.horizontal){const spin=Math.sign(direction??root.userData.direction??1)||1;for(const disk of root.children)for(const mesh of disk.children)updateHorizontalSweep(mesh as THREE.Mesh<THREE.BufferGeometry,THREE.MeshBasicMaterial>,speed,spin,strength);return;}
 for(const disk of root.children)for(const obj of disk.children){const mesh=obj as THREE.Mesh<THREE.BufferGeometry,THREE.MeshBasicMaterial>;
  mesh.material.opacity=strength*mesh.userData.blurGain;
  // Slightly different exposure phases prevent symmetric blades aliasing to stillness.
  mesh.rotation.z=-time*(7+Math.min(rpm/240,12))*(direction??root.userData.direction??1)-mesh.userData.phase*.11;
 }
}
