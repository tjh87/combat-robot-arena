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
 const a=noise(j+7)*Math.PI*2,spreadBase=spec.pattern==='fan'?(index%9===0?.68:.42):spec.pattern==='arcs'?(index%8===0?.52:.28):(index%9===0?.62:.34),spread=spreadBase*Math.sqrt(noise(j+13)),speed=spec.speed*(.35+noise(j+23)*.95);
 const velocity=mul(unit(add(n,add(mul(u,Math.cos(a)*spread),mul(w,Math.sin(a)*spread)))),speed),arc=spec.pattern==='arcs'?index%3===0:spec.pattern==='fan'?index%10===0:false;
 if(arc){const minimumRise=spec.pattern==='arcs'?1.7+noise(j+67)*.8:spec.pattern==='fan'?.9+noise(j+67)*.5:.4+noise(j+67)*.35;velocity.y=Math.max(velocity.y,minimumRise);}
 const life=spec.life*(arc&&spec.pattern==='arcs'?.68+noise(j+31)*.32:.42+noise(j+31)*.58),trail=.004+Math.pow(noise(j+43),2)*.065;
 return{color:sparkTint(damage,index,seed),velocity,life,trail:arc&&spec.pattern==='arcs'?trail*1.25:trail,size:.35+noise(j+59)*1.2,branch:index%11===0,arc};
}
// Two curved, cooling segments and an occasional short fork. All values use
// fixed buffers so large spark showers do not create a mesh per spark.
const DEFAULT_SPARK_TINT=v(1,.52,.035);
export function writeSparkTrail(p:Float32Array,c:Float32Array,index:number,x:number,y:number,z:number,vx:number,vy:number,vz:number,trail:number,fade:number,branch:boolean,tint:Vec=DEFAULT_SPARK_TINT){
 const i=index*SPARK_TRAIL_FLOATS,half=trail*.45,mx=x-vx*half,my=Math.max(.012,y-vy*half-4.905*half*half),mz=z-vz*half;
 const tx=x-vx*trail,ty=Math.max(.012,y-vy*trail-4.905*trail*trail),tz=z-vz*trail;
 p[i]=x;p[i+1]=y;p[i+2]=z;
 p[i+3]=p[i+6]=p[i+12]=mx;p[i+4]=p[i+7]=p[i+13]=my;p[i+5]=p[i+8]=p[i+14]=mz;
 p[i+9]=tx;p[i+10]=ty;p[i+11]=tz;
 p[i+15]=branch?tx+vz*trail*.12:mx;p[i+16]=branch?ty+trail*.7:my;p[i+17]=branch?tz-vx*trail*.12:mz;
 const f=clamp(fade,0,1),white=.32*f*f,mr=tint.x*(fade*.65),mg=tint.y*(fade*.65),mb=tint.z*(fade*.65),tr=tint.x*(fade*.12),tg=tint.y*(fade*.12),tb=tint.z*(fade*.12);
 c[i]=f*(tint.x*(1-white)+white);c[i+1]=f*(tint.y*(1-white)+white);c[i+2]=f*(tint.z*(1-white)+white);
 c[i+3]=c[i+6]=mr;c[i+4]=c[i+7]=mg;c[i+5]=c[i+8]=mb;
 c[i+9]=c[i+15]=tr;c[i+10]=c[i+16]=tg;c[i+11]=c[i+17]=tb;
 c[i+12]=mr*.6;c[i+13]=mg*.6;c[i+14]=mb*.6;
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
export type SparkPattern='subtle'|'arcs'|'fan';
export const SPARK_ARC_MIN_ENERGY=2500,SPARK_FAN_MIN_ENERGY=12000;
export function sparkProfile(energy:number){
 const impact=Number.isFinite(energy)?Math.max(0,energy):0,strength=clamp(Math.pow(impact/40000,.6),0,1),pattern:SparkPattern=impact>=SPARK_FAN_MIN_ENERGY?'fan':impact>=SPARK_ARC_MIN_ENERGY?'arcs':'subtle';
 return{count:Math.round(8+252*strength),speed:1.4+8.6*strength,life:.22+.68*strength,pattern};
}

const DAMAGE_SPARKS=['#ffb14a','#ffe894','#75edff','#9bff94','#ff6b8f','#cc8cff','#799eff','#fafcff'].map(hex=>{const c=new THREE.Color(hex);return v(c.r,c.g,c.b);});
export function sparkTint(damage:number,index:number,seed=0){const hp=Math.max(0,Number.isFinite(damage)?damage:0),colors=hp>=250?8:hp>=100?6:hp>=40?4:2;return{...DAMAGE_SPARKS[Math.min(colors-1,Math.floor(noise(index+seed*997+83)*colors))]};}
export function sparkHeadColor(tint:Vec,fade:number,out:Vec=v()){const f=clamp(fade,0,1),white=.32*f*f;out.x=f*(tint.x*(1-white)+white);out.y=f*(tint.y*(1-white)+white);out.z=f*(tint.z*(1-white)+white);return out;}
