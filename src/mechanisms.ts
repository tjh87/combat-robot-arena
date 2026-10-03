import {MATERIALS,chiselShape,WEDGE_TIP,HYDRA_TIP,groundForkMount,v,add,sub,mul,length,axisQ,identity,armOffset,type BotConfig,type Spinner,type Part,type Slot,type Material,type Vec,type Quat} from './model';

// These plates, tubes and rotor sectors are the actual collision geometry.
// All hulls are convex prisms; mass and moments use the shared analytic model.
function writer(parts:Part[]){
 const put=(id:string,module:Slot,body:string,shape:Part['shape'],position=v(),material:Part['material']='hardox',rotation=identity,tooth?:number)=>{
  const volume=shape.kind==='box'?shape.size.x*shape.size.y*shape.size.z:shape.kind==='cylinder'?Math.PI*shape.radius**2*shape.width:shape.volume;
  parts.push({id,module,body,shape,position,material,rotation,mass:volume*(material==='rubber'?1100:MATERIALS[material].density),collides:true,tooth});
 };
 const box=(id:string,module:Slot,body:string,size:Vec,position=v(),mat:Material='hardox',rotation=identity)=>put(id,module,body,{kind:'box',size},position,mat,rotation);
 const prism=(id:string,module:Slot,body:string,width:number,section:number[][],position=v(),mat:Part['material']='hardox',rotation=identity,tooth?:number)=>{
  let twice=0;const vertices:number[]=[];for(let i=0;i<section.length;i++){const a=section[i],b=section[(i+1)%section.length];twice+=a[0]*b[1]-a[1]*b[0];}for(const x of[-width/2,width/2])for(const [y,z]of section)vertices.push(x,y,z);
  put(id,module,body,{kind:'hull',vertices,volume:Math.abs(twice)*width/2},position,mat,rotation,tooth);
 };
 const tube=(id:string,module:Slot,body:string,a:Vec,b:Vec,r:number,mat:Material='hardox')=>{
  const d=sub(b,a),len=length(d),n=mul(d,1/len),s=Math.sqrt(2*(1+n.y)),q:Quat=s<1e-6?axisQ(v(1,0,0),Math.PI):{x:n.z/s,y:0,z:-n.x/s,w:s/2};
  put(id,module,body,{kind:'cylinder',radius:r,width:len},mul(add(a,b),.5),mat,q);
 };
 const ring=(id:string,module:Slot,body:string,ro:number,ri:number,width:number,position=v(),mat:Part['material']='hardox',count=20)=>{
  for(let j=0;j<count;j++){const a=j*2*Math.PI/count,b=(j+1)*2*Math.PI/count;prism(j===0?id:id+'_'+j,module,body,width,[[ro*Math.cos(a),ro*Math.sin(a)],[ro*Math.cos(b),ro*Math.sin(b)],[ri*Math.cos(b),ri*Math.sin(b)],[ri*Math.cos(a),ri*Math.sin(a)]],position,mat);}
 };
 return{put,box,prism,tube,ring};
}
