import * as THREE from 'three';
import {rng,type BotConfig} from './model';

function surface(width:number,height:number){const element=document.createElement('canvas');element.width=width;element.height=height;return{element,ctx:element.getContext('2d')!};}
function finish(element:HTMLCanvasElement){const map=new THREE.CanvasTexture(element);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;return map;}
function polygon(ctx:CanvasRenderingContext2D,color:string,points:number[][]){ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();}
function label(ctx:CanvasRenderingContext2D,text:string,y:number,size=54,color='#f1f1e6',font='900',width=428){ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`${font} ${size}px Arial, sans-serif`;ctx.fillText(text,256,y,width);}
function flames(ctx:CanvasRenderingContext2D,color:string){
 ctx.fillStyle=color;for(const side of[-1,1])for(let i=0;i<4;i++){const x=256+side*(118+i*25);ctx.beginPath();ctx.moveTo(x,512);ctx.bezierCurveTo(x-side*74,338,x+side*56,270,x-side*20,100+i*28);ctx.bezierCurveTo(x+side*62,264,x+side*38,421,x+side*25,512);ctx.fill();}
}
function eyes(ctx:CanvasRenderingContext2D){
 for(const side of[-1,1]){ctx.save();ctx.translate(256+side*150,115);ctx.rotate(side*.22);ctx.fillStyle='#171020';ctx.beginPath();ctx.ellipse(0,0,71,36,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#c5d244';ctx.beginPath();ctx.ellipse(0,0,51,18,0,0,Math.PI*2);ctx.fill();polygon(ctx,'#171020',[[-4,-19],[7,-2],[1,18],[-7,0]]);ctx.restore();}
}

// Reference-specific paint, baked once when a model is built. No runtime image
// fetches, extra material layers, or work in the animation loop.
export function robotDeckTexture(c:BotConfig,part=''){
 const {element,ctx}=surface(512,512),profile=c.chassis.profile,primary=c.identity.primary,accent=c.identity.secondary,name=c.identity.name.toUpperCase();
 ctx.fillStyle=primary;ctx.fillRect(0,0,512,512);
 switch(profile){
  case 'tombstone':
   // White hood and skull against the plain, dark bolted deck.
   polygon(ctx,'#d8dcd7',[[160,225],[186,86],[256,48],[326,86],[352,225],[307,193],[295,149],[215,149],[205,193]]);
   ctx.fillStyle='#d8dcd7';ctx.beginPath();ctx.ellipse(256,158,37,44,0,0,Math.PI*2);ctx.fill();
   for(const side of[-1,1])polygon(ctx,primary,[[256+side*6,149],[256+side*30,137],[256+side*28,159],[256+side*10,164]]);
   polygon(ctx,primary,[[256,164],[248,179],[264,179]]);for(let i=0;i<5;i++){ctx.fillStyle=primary;ctx.fillRect(239+i*8,186,3,16);}label(ctx,name,330,57);break;
  case 'minotaur':
   ctx.fillStyle='#eeeede';ctx.beginPath();ctx.moveTo(224,141);ctx.bezierCurveTo(123,141,94,98,91,42);ctx.bezierCurveTo(40,129,132,213,206,195);ctx.lineTo(224,141);ctx.fill();
   ctx.beginPath();ctx.moveTo(288,141);ctx.bezierCurveTo(389,141,418,98,421,42);ctx.bezierCurveTo(472,129,380,213,306,195);ctx.closePath();ctx.fill();
   polygon(ctx,'#eeeede',[[207,150],[256,134],[305,150],[311,222],[280,275],[256,300],[232,275],[201,222]]);
   polygon(ctx,primary,[[208,187],[240,205],[221,208]]);polygon(ctx,primary,[[304,187],[272,205],[291,208]]);polygon(ctx,primary,[[242,254],[270,254],[256,268]]);label(ctx,name,377,54);break;
  case 'hydra':
   for(const side of[-1,1]){polygon(ctx,'#3c215e',[[256+side*45,220],[256+side*150,65],[256+side*254,0],[256+side*244,370],[256+side*135,308]]);polygon(ctx,'#ae2548',[[256+side*62,259],[256+side*205,201],[256+side*154,349]]);polygon(ctx,'#e7dfcc',[[256+side*71,265],[256+side*92,261],[256+side*109,312]]);}eyes(ctx);if(part!=='wedge'){ctx.save();ctx.translate(512,796);ctx.rotate(Math.PI);label(ctx,name,398,72);ctx.restore();}break;
  case 'icewave':
   ctx.fillStyle='#929da7';ctx.fillRect(0,0,512,512);for(const side of[-1,1])polygon(ctx,primary,[[256+side*215,0],[256+side*252,0],[256+side*252,512],[256+side*145,512]]);label(ctx,name,364,58,'#233e61','italic 900');break;
  case 'hypershock':
   for(const side of[-1,1])for(let j=0;j<3;j++){const x=side<0?0:512,y=30+j*144;polygon(ctx,accent,[[x,y],[x-side*122,y+56],[x-side*47,y+90],[x-side*100,y+141],[x,y+117]]);}
   polygon(ctx,'#282c2b',[[180,27],[256,57],[332,27],[310,226],[256,260],[202,226]]);label(ctx,name,338,57,'#222723','italic 900');break;
  case 'whyachi':
   label(ctx,c.identity.name==='Son of Whyachi'?'WHYACHI':name,220,65,'#bb3033','italic 900');label(ctx,'TKO',340,112,'#ead143','italic 900');break;
  case 'huge':label(ctx,name,346,60,accent);break;
  case 'sawblaze':flames(ctx,accent);if(!part.startsWith('saw_fork'))label(ctx,name,371,59,'#edeee2','italic 900');break;
  case 'deep_six':label(ctx,c.identity.name==='Deep Six'?(part.endsWith('_-1')?'DEEP':'SIX'):name,275,100,'#e5e8e2','900',410);break;
  case 'quantum':label(ctx,c.identity.name,355,65,'#e3eced','300');break;
  default:label(ctx,name,302,56);break;
 }
 const random=rng(418);ctx.lineWidth=1;for(let i=0;i<75;i++){ctx.strokeStyle=i%2?'#bbc3c014':'#060b1018';const x=random()*512,y=random()*512;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+random()*24,y+random()*5);ctx.stroke();}
 const map=finish(element);map.name=`${profile??'custom'}-reference-deck`;return map;
}

export function robotSideTexture(c:BotConfig){
 const {element,ctx}=surface(512,128),profile=c.chassis.profile;ctx.clearRect(0,0,512,128);
 if(profile==='hypershock')for(let j=0;j<5;j++)polygon(ctx,c.identity.secondary,[[j*118,0],[j*118+83,0],[j*118+29,71],[j*118+73,61],[j*118+5,128],[j*118-24,128],[j*118+20,57]]);
 if(profile==='sawblaze'){ctx.save();ctx.scale(1,.25);flames(ctx,c.identity.secondary);ctx.restore();}
 label(ctx,c.identity.name.toUpperCase(),68,profile==='quantum'?47:51,profile==='icewave'?'#efc146':profile==='gigabyte'?'#131a20':'#f0f1e5',profile==='quantum'?'300':'italic 900',454);
 return finish(element);
}

export function tireSidewallTexture(){
 const {element,ctx}=surface(256,256);ctx.fillStyle='#171a1c';ctx.fillRect(0,0,256,256);ctx.strokeStyle='#343b3d';ctx.lineWidth=2;for(const r of[102,119]){ctx.beginPath();ctx.arc(128,128,r,0,Math.PI*2);ctx.stroke();}
 ctx.fillStyle='#dce2d9';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='900 14px Arial, sans-serif';
 for(const start of[-Math.PI*.82,Math.PI*.18])for(const [i,char]of[...'HYPERSHOCK'].entries()){const a=start+i*.137;ctx.save();ctx.translate(128+110*Math.cos(a),128+110*Math.sin(a));ctx.rotate(a+Math.PI/2);ctx.fillText(char,0,0);ctx.restore();}
 return finish(element);
}
