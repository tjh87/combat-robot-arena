import * as THREE from 'three';
import {sawbladeContours} from './sawblade-profile';
import {clamp,type BotConfig} from './model';

const ANGLES=256,RADII=128,TAU=Math.PI*2,SHUTTER=1/60;
function contains(points:THREE.Vector2[],y:number,z:number){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a.y>z)!==(b.y>z)&&y<(b.x-a.x)*(z-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}
function edgeDistance(points:THREE.Vector2[],y:number,z:number){let distance=Infinity;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],dy=b.x-a.x,dz=b.y-a.y,t=clamp(((y-a.x)*dy+(z-a.y)*dz)/(dy*dy+dz*dz),0,1);distance=Math.min(distance,Math.hypot(y-a.x-t*dy,z-a.y-t*dz));}return distance;}
export function sawbladePolarCoverage(radius:number){
 const contours=sawbladeContours(radius),data=new Uint8Array(ANGLES*RADII*4);
 for(let r=0;r<RADII;r++){let faceSum=0,edgeSum=0;
  for(let a=0;a<ANGLES;a++){const angle=(a+.5)/ANGLES*TAU,d=(r+.5)/RADII*radius,y=Math.cos(angle)*d,z=Math.sin(angle)*d,solid=contains(contours[0],y,z)&&!contours.slice(1).some(h=>contains(h,y,z)),edge=solid?clamp(1-Math.min(...contours.map(h=>edgeDistance(h,y,z)))/.003,0,1):0,index=(r*ANGLES+a)*4;data[index]=solid?255:0;data[index+1]=Math.round(edge*255);faceSum+=data[index];edgeSum+=data[index+1];}
  for(let a=0;a<ANGLES;a++){const index=(r*ANGLES+a)*4;data[index+2]=Math.round(faceSum/ANGLES);data[index+3]=Math.round(edgeSum/ANGLES);}
 }
 const texture=new THREE.DataTexture(data,ANGLES,RADII,THREE.RGBAFormat);texture.wrapS=THREE.RepeatWrapping;texture.magFilter=texture.minFilter=THREE.LinearFilter;texture.needsUpdate=true;return texture;
}
export function sawbladeExposure(config:BotConfig){
 const w=config.weapon,root=new THREE.Group();if(w.type!=='hammer_saw')return root;
 root.name='rotor-motion';root.visible=false;root.userData={rotorMotion:true,sawbladeExposure:true,targetRPM:w.rpm,direction:w.direction,exposureSeconds:SHUTTER};
 const mask=sawbladePolarCoverage(w.radius),geometry=new THREE.PlaneGeometry(w.radius*2,w.radius*2);
 geometry.applyMatrix4(new THREE.Matrix4().makeBasis(new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,1),new THREE.Vector3(1,0,0)));
 for(const side of[-1,1]){
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{polarCoverage:{value:mask.clone()},radius:{value:w.radius},exposureAngle:{value:0},strength:{value:0},direction:{value:1},face:{value:new THREE.Color('#26322b')},rim:{value:new THREE.Color('#70ce4d')}},vertexShader:'varying vec2 rotorPoint; uniform float radius; void main(){rotorPoint=position.yz/radius;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`varying vec2 rotorPoint;uniform sampler2D polarCoverage;uniform float exposureAngle;uniform float strength;uniform float direction;uniform vec3 face;uniform vec3 rim;
void main(){float r=length(rotorPoint);if(r>1.0)discard;float angle=atan(rotorPoint.y,rotorPoint.x)/6.28318530718;vec2 coverage=vec2(0.0);
if(exposureAngle>=6.282){coverage=texture2D(polarCoverage,vec2(fract(angle),r)).ba;}else{for(int i=0;i<32;i++){float t=(float(i)+0.5)/32.0;coverage+=texture2D(polarCoverage,vec2(fract(angle+direction*exposureAngle*t/6.28318530718),r)).rg;}coverage/=32.0;}
float alpha=strength*min(0.88,coverage.x*0.84+coverage.y*0.36);if(alpha<0.002)discard;gl_FragColor=vec4(mix(face,rim,clamp(coverage.y/max(0.01,coverage.x)*1.9,0.0,1.0)),alpha);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
  material.userData.sawbladeExposure=true;const mesh=new THREE.Mesh(geometry.clone(),material);mesh.position.x=side*(w.width/2+.0016);mesh.name='sawblaze-angular-exposure';mesh.renderOrder=2;root.add(mesh);
 }
 mask.dispose();geometry.dispose();return root;
}
export function updateSawbladeExposure(rotor:THREE.Object3D,root:THREE.Object3D,rpm:number,reduced:boolean,direction:number){
 const speed=Number.isFinite(rpm)?Math.abs(rpm):0,strength=reduced?0:clamp((speed-60)/Math.max(600,root.userData.targetRPM*.70),0,1),span=Math.min(TAU,speed*Math.PI/30*SHUTTER);
 root.visible=strength>.001;root.userData.exposureAngle=span;root.userData.strength=strength;root.userData.spinDirection=direction;
 for(const child of root.children){const mesh=child as THREE.Mesh<THREE.BufferGeometry,THREE.ShaderMaterial>;mesh.material.uniforms.exposureAngle.value=span;mesh.material.uniforms.strength.value=strength;mesh.material.uniforms.direction.value=direction;}
 rotor.traverse(object=>{if(!(object instanceof THREE.Mesh)||!object.userData.svgBlade)return;object.traverse(child=>{if(!(child instanceof THREE.Mesh))return;const opacity=1-.95*strength;for(const material of Array.isArray(child.material)?child.material:[child.material]){const transparent=opacity<.999;if(material.transparent!==transparent){material.transparent=transparent;material.needsUpdate=true;}material.opacity=opacity;material.depthWrite=!transparent;}if(child.userData.restShadow===undefined)child.userData.restShadow=child.castShadow;child.castShadow=strength<.5&&child.userData.restShadow;});});
}
export function disposeSawbladeExposure(material:THREE.Material){if(material instanceof THREE.ShaderMaterial&&material.userData.sawbladeExposure)material.uniforms.polarCoverage.value.dispose();}
