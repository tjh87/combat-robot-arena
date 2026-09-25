import * as THREE from 'three';
import type {Travel} from './sim';

export function flightReadout(track:Pick<Travel,'bot'|'horizontal'|'height'>){
 return{robot:`P${track.bot+1}`,distance:`${track.horizontal.toFixed(2)} m`,height:`${track.height.toFixed(2)} m`};
}
/** The label follows the end of the drawn line, using the same height offset. */
export function flightLabelPosition(camera:THREE.PerspectiveCamera,track:Pick<Travel,'origin'|'final'>,width:number,height:number){
 const p=new THREE.Vector3(track.final.x,.046+Math.max(0,track.final.y-track.origin.y),track.final.z);
 camera.updateMatrixWorld();const projected=p.clone().project(camera),local=p.applyMatrix4(camera.matrixWorldInverse);
 if(local.z>=0||!Number.isFinite(projected.x)||!Number.isFinite(projected.y)||Math.abs(projected.x)>1||Math.abs(projected.y)>1||projected.z< -1||projected.z>1)return;
 return{x:(projected.x+1)*width/2,y:(1-projected.y)*height/2};
}
export class FlightLabel{
 element:HTMLDivElement;track?:Travel;private key='';
 constructor(container:HTMLElement){this.element=document.createElement('div');this.element.className='flight-label';this.element.hidden=true;container.appendChild(this.element);}
 update(track:Travel|undefined){
  this.track=track;if(!track)return;const r=flightReadout(track),key=[r.robot,r.distance,r.height].join('/');if(key===this.key)return;this.key=key;
  this.element.innerHTML=`<span class="flight-robot">${r.robot} LAUNCH</span><span><small>Distance</small><strong>${r.distance}</strong></span><span><small>Peak height</small><strong>${r.height}</strong></span>`;
  this.element.setAttribute('aria-label',`${r.robot} launch: distance ${r.distance}, peak height ${r.height}`);
 }
 draw(camera:THREE.PerspectiveCamera,width:number,height:number,active:boolean){
  const p=active&&this.track?flightLabelPosition(camera,this.track,width,height):undefined;this.element.hidden=!p;if(!p)return;
  const ew=this.element.offsetWidth||222,eh=this.element.offsetHeight||60;
  const x=p.x+14+ew<width-8?p.x+14:p.x-ew-14,y=Math.max(8,Math.min(height-eh-8,p.y-eh/2));
  this.element.style.left=`${Math.max(8,x)}px`;this.element.style.top=`${y}px`;
 }
 dispose(){this.element.remove();}
}
