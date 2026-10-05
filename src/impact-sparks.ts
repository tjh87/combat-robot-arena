import {clamp,add,mul,dot,cross,length,v,type Vec} from './model';
import * as THREE from 'three';
export const SPARK_CAPACITY=720;
export const SPARK_TRAIL_FLOATS=18;
const unit=(p:Vec,fallback=v(0,.25,1))=>length(p)>.0001?mul(p,1/length(p)):fallback;
export function contactSparkDirection(tangent:Vec,normal:Vec,launch:Vec){
 const n=unit(normal),t=unit(tangent,n),motion=unit(launch,n);
 // The contact normal fixes the outgoing hemisphere. Blade motion adds the
 // cutting direction; the receiver's motion adds the direction of its launch.
 return unit(add(mul(n,.60),add(mul(dot(t,n)>=0?t:mul(t,-1),.27),mul(dot(motion,n)>=0?motion:n,.13))));
}
const noise=(seed:number)=>{let n=Math.imul(seed^0x68bc21eb,0x45d9f3b);n=Math.imul(n^(n>>>16),0x45d9f3b);return((n^(n>>>16))>>>0)/4294967296;};
export function sparkParticle(energy:number,direction:Vec,index:number,seed=0,damage=0){
 const spec=sparkProfile(energy),n=unit(direction),u=unit(cross(n,Math.abs(n.y)<.9?v(0,1,0):v(1,0,0))),w=cross(n,u),j=index+seed*997;
 const a=noise(j+7)*Math.PI*2,spread=(index%9===0?.62:.34)*Math.sqrt(noise(j+13)),speed=spec.speed*(.35+noise(j+23)*.95);
 const velocity=mul(unit(add(n,add(mul(u,Math.cos(a)*spread),mul(w,Math.sin(a)*spread)))),speed);
 return{color:sparkTint(damage,index,seed),velocity,life:spec.life*(.42+noise(j+31)*.58),trail:.004+Math.pow(noise(j+43),2)*.065,size:.35+noise(j+59)*1.2,branch:index%11===0};
}
// Two curved, cooling segments and an occasional short fork. All values use
// fixed buffers so large spark showers do not create a mesh per spark.
export function writeSparkTrail(p:Float32Array,c:Float32Array,index:number,x:number,y:number,z:number,vx:number,vy:number,vz:number,trail:number,fade:number,branch:boolean,tint:Vec=v(1,.52,.035)){
 const i=index*SPARK_TRAIL_FLOATS,half=trail*.45,mx=x-vx*half,my=Math.max(.012,y-vy*half-4.905*half*half),mz=z-vz*half;
 const tx=x-vx*trail,ty=Math.max(.012,y-vy*trail-4.905*trail*trail),tz=z-vz*trail;
 p.set([x,y,z,mx,my,mz,mx,my,mz,tx,ty,tz,mx,my,mz,branch?tx+vz*trail*.12:mx,branch?ty+trail*.7:my,branch?tz-vx*trail*.12:mz],i);
 const hot=sparkHeadColor(tint,fade),mid=mul(tint,fade*.65),tail=mul(tint,fade*.12);c.set([hot.x,hot.y,hot.z,mid.x,mid.y,mid.z,mid.x,mid.y,mid.z,tail.x,tail.y,tail.z,mid.x*.6,mid.y*.6,mid.z*.6,tail.x,tail.y,tail.z],i);
}
export function sparkMaterial(){
 const material=roundParticleMaterial({color:0xffffff,vertexColors:true,size:.030,transparent:true,opacity:.95,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
 const compile=material.onBeforeCompile;material.onBeforeCompile=(shader,renderer)=>{compile(shader,renderer);shader.vertexShader='attribute float sparkSize;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('gl_PointSize = size;','gl_PointSize = size * sparkSize;');};
 material.customProgramCacheKey=()=>'directional-sparks-v2';return material;
}
// Point sprites remain fast, but the shader clips their square raster bounds.
// A white hot core fades into a soft circular glow without a texture download.
export const ROUND_PARTICLE_FRAGMENT=`
 float radius = length(gl_PointCoord - vec2(0.5));
 if (radius >= 0.5) discard;
 float halo = exp(-radius * radius * 18.0) * (1.0 - smoothstep(0.32, 0.5, radius));
 diffuseColor.a *= halo;
`;
export function roundParticleMaterial(parameters:THREE.PointsMaterialParameters){
 const material=new THREE.PointsMaterial(parameters);
 material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+ROUND_PARTICLE_FRAGMENT);};
 material.customProgramCacheKey=()=>'round-particle-v1';
 return material;
}
export function sparkProfile(energy:number){
 const strength=clamp(Math.pow(Math.max(0,energy)/40000,.6),0,1);
 return{count:Math.round(8+252*strength),speed:1.4+8.6*strength,life:.22+.68*strength};
}

const DAMAGE_SPARKS=['#ffb14a','#ffe894','#75edff','#9bff94','#ff6b8f','#cc8cff','#799eff','#fafcff'].map(hex=>{const c=new THREE.Color(hex);return v(c.r,c.g,c.b);});
export function sparkTint(damage:number,index:number,seed=0){const hp=Math.max(0,Number.isFinite(damage)?damage:0),colors=hp>=250?8:hp>=100?6:hp>=40?4:2;return{...DAMAGE_SPARKS[Math.min(colors-1,Math.floor(noise(index+seed*997+83)*colors))]};}
export function sparkHeadColor(tint:Vec,fade:number){const f=clamp(fade,0,1),white=.32*f*f;return v(f*(tint.x*(1-white)+white),f*(tint.y*(1-white)+white),f*(tint.z*(1-white)+white));}
