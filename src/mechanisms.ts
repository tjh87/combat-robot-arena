import {MATERIALS,chiselShape,WEDGE_TIP,HYDRA_TIP,groundForkMount,v,add,sub,mul,length,axisQ,identity,armOffset,type BotConfig,type Spinner,type Part,type Slot,type Material,type Vec,type Quat} from './model';

// These plates, tubes and rotor sectors are the actual collision geometry.
// All hulls are convex prisms; mass and moments use the shared analytic model.
function writer(parts:Part[]){
 const put=(id:string,module:Slot,body:string,shape:Part['shape'],position=v(),material:Part['material']='hardox',rotation=identity,tooth?:number)=>{
  const volume=shape.kind==='box'?shape.size.x*shape.size.y*shape.size.z:shape.kind==='cylinder'?Math.PI*shape.radius**2*shape.width:shape.volume;
  parts.push({id,module,body,shape,position,material,rotation,mass:volume*(material==='rubber'?1100:MATERIALS[material].density),collides:true,tooth});
 };
