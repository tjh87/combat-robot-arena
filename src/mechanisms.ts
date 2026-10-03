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
export function largeWheelParts(c:BotConfig,id:string,slot:Slot,position:Vec,parts:Part[]){
 const b=writer(parts),r=c.drive.radius,w=c.drive.width;
 b.ring(id,slot,id,r-.009,r*.84,w,position,'uhmw',16);
 b.ring(id+'_tread',slot,id,r,r-.009,w,position,'rubber',16);
 for(let j=0;j<5;j++)b.box(id+'_spoke_'+j,slot,id,v(w,.07,r*.77),add(position,v(0,Math.sin(j*Math.PI*2/5)*r*.40,Math.cos(j*Math.PI*2/5)*r*.40)),'uhmw',axisQ(v(1,0,0),-j*Math.PI*2/5));
 b.put(id+'_hub',slot,id,{kind:'cylinder',radius:r*.13,width:w+.018},position,'aluminium7075',axisQ(v(0,0,1),Math.PI/2));
}
export function racerWheelParts(c:BotConfig,id:string,slot:Slot,position:Vec,parts:Part[]){
 const b=writer(parts),r=c.drive.radius,w=c.drive.width;
 b.ring(id,slot,id,r,r*.78,w,position,'rubber',16);
 b.ring(id+'_rim',slot,id,r*.79,r*.67,.015,position,'aluminium7075',16);
 for(let j=0;j<5;j++)b.box(id+'_spoke_'+j,slot,id,v(.016,r*.13,r*.70),add(position,v(0,Math.sin(j*Math.PI*2/5)*r*.36,Math.cos(j*Math.PI*2/5)*r*.36)),'aluminium7075',axisQ(v(1,0,0),-j*Math.PI*2/5));
 b.put(id+'_hub',slot,id,{kind:'cylinder',radius:r*.23,width:.055},position,'aluminium7075',axisQ(v(0,0,1),Math.PI/2));
}
// SawBlaze hammer-saw blade outline (reference silhouette). The outer radius
// carries three saw teeth on one flank, a broad hammer head opposite, a
// shallow crown notch and a lower spike; the bore is hexagonal. Physics,
// finish geometry and cosmetic detail share these helpers, so all three agree.
export function sawbladeOuter(radius:number,toothDepth:number,a:number){
 const ro=radius-toothDepth;
 const norm=(x:number)=>{while(x>Math.PI)x-=2*Math.PI;while(x<-Math.PI)x+=2*Math.PI;return x;};
 const bump=(centre:number,halfWidth:number)=>Math.max(0,1-Math.abs(norm(a-centre))/halfWidth);
 const r=ro+0.030*Math.min(1,bump(Math.PI,.62)*1.15)+0.030*bump(0,.20)+0.026*bump(.44,.17)+0.026*bump(-.44,.17)+0.020*bump(-Math.PI/2,.13)-0.012*bump(Math.PI/2,.10);
 return Math.min(ro+0.030,Math.max(ro-0.012,r));
}
export function sawbladeHex(innerRadius:number,a:number){
 const s=Math.PI/3,t=((a%s)+s)%s;
 return innerRadius*0.8660254/Math.cos(t-s/2);
}
export function templateParts(c:BotConfig,parts:Part[]){
 const b=writer(parts),p=c.chassis.profile,w=c.weapon,L=c.chassis.length,W=c.chassis.width,H=c.chassis.height,floor=-H/2-c.chassis.clearance,top=H/2;
 const fork=(id:string,x:number,front:number,rear:number,width=.065,height=.07,mat:Material='hardox')=>{const tip=p==='hydra'?HYDRA_TIP:WEDGE_TIP;return b.prism(id,'chassis','chassis',width,[[floor+tip.clearance,front],[floor+height-.009,rear],[floor+height,rear],[floor+tip.clearance+tip.thickness,front]],v(x,0,0),mat);};
 // A thin triangular plate presents a floor-level edge to a sideways sweep.
 // Its inner rear corner rises into the existing scoop; the side is a ramp,
 // not the vertical end face of an extruded front wedge.
 const sideRamps=(id:string,inner:number,width:number,front:number,rear:number,height:number,mat:Material)=>{
  const tip=p==='hydra'?HYDRA_TIP:WEDGE_TIP;
  for(const side of[-1,1]){
   const vertices:number[]=[];
   for(const lift of[0,tip.thickness])for(const[x,y,z]of[[side*inner,floor+tip.clearance,front],[side*inner,floor+height,rear],[side*(inner+width),floor+tip.clearance,rear]])vertices.push(x,y+lift,z);
   b.put(id+'_'+side,'chassis','chassis',{kind:'hull',vertices,volume:width*(rear-front)*tip.thickness/2},v(),mat);
  }
 };
