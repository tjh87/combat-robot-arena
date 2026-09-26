import * as THREE from 'three';
import {roundParticleMaterial} from './impact-sparks';
import type {Vec} from './model';

// Fixed pools and simulation time make flames repeatable in pauses and replays.
export class BatteryFireVisual extends THREE.Group{
 readonly flamePositions=new Float32Array(96*3);
 readonly flameColors=new Float32Array(96*3);
 readonly smokePositions=new Float32Array(48*3);
 readonly flames:THREE.Points;
 readonly smoke:THREE.Points;
 readonly lights=[new THREE.PointLight(0xff8b26,0,1.4),new THREE.PointLight(0xff8b26,0,1.4)];
 constructor(){
  super();this.name='battery-fire';
  const flameGeometry=new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(this.flamePositions,3)).setAttribute('color',new THREE.BufferAttribute(this.flameColors,3));
  this.flames=new THREE.Points(flameGeometry,roundParticleMaterial({color:0xffffff,vertexColors:true,size:.14,transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
  const smokeGeometry=new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(this.smokePositions,3));
  this.smoke=new THREE.Points(smokeGeometry,roundParticleMaterial({color:0x383b3e,size:.25,transparent:true,opacity:.42,depthWrite:false}));
  this.flames.frustumCulled=this.smoke.frustumCulled=false;this.add(this.flames,this.smoke,...this.lights);this.update([],0);
 }
 update(emitters:{position:Vec,active:boolean}[],seconds:number,reduced=false){
  const active=emitters.some(e=>e.active);this.flames.visible=this.smoke.visible=active;
  if(!active){for(const light of this.lights)light.intensity=0;return;}
  const t=reduced?0:seconds;
  for(let bot=0;bot<2;bot++){
   const emitter=emitters[bot],p=emitter?.position??{x:0,y:-20,z:0},active=!!emitter?.active;
   this.lights[bot].position.set(p.x,p.y+.14,p.z);this.lights[bot].intensity=active?.9:0;
   for(let i=0;i<48;i++){
    const j=(bot*48+i)*3,life=(t*(1.7+i%5*.06)+i*.61803398875)%1,angle=i*2.399963,spread=.025+(1-life)*.055;
    this.flamePositions.set(active?[p.x+Math.cos(angle+life*3)*spread,p.y+.08+life*.53,p.z+Math.sin(angle+life*2)*spread]:[0,-20,0],j);
    const fade=Math.pow(1-life,1.25);this.flameColors.set([fade,fade*(.24+.68*(1-life)),fade*Math.pow(1-life,3)*.48],j);
   }
   for(let i=0;i<24;i++){
    const j=(bot*24+i)*3,life=(t*.55+i*.61803398875)%1,angle=i*2.399963;
    this.smokePositions.set(active?[p.x+life*.13+Math.cos(angle)*(.025+life*.13),p.y+.30+life*.95,p.z+Math.sin(angle)*(.025+life*.12)]:[0,-20,0],j);
   }
  }
  this.flames.geometry.getAttribute('position').needsUpdate=true;this.flames.geometry.getAttribute('color').needsUpdate=true;this.smoke.geometry.getAttribute('position').needsUpdate=true;
 }
}
